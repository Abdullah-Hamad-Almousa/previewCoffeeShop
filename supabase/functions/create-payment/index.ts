// Supabase Edge Function: create-payment
// Server-side payment creation with TWO-LEVEL kill switch.
// 1. Reads payment_super AND payment_enabled from app_settings
// 2. If either is false → refuses (returns error)
// 3. If canPay → creates Moyasar payment (TEST MODE), saves order row
// 4. Returns result
//
// The client NEVER decides alone — this function is the gatekeeper.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Moyasar TEST MODE secret key — set as a Supabase secret:
// supabase secrets set MOYASAR_SECRET_KEY=sk_test_xxx
const moyasarSecretKey = Deno.env.get('MOYASAR_SECRET_KEY') ?? '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    return await handleCreatePayment(req);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});

async function handleCreatePayment(req: Request) {
  // 1. Get the user from the Authorization header
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  const { data: userData, error: userErr } =
    await supabaseAdmin.auth.getUser(token);

  if (userErr || !userData.user) {
    return jsonResponse({ success: false, status: 'failed', message: 'Not authenticated' }, 401);
  }

  const userId = userData.user.id;

  // 2. Parse request body
  const body = await req.json();
  const { productId, amount, method, card } = body;

  if (!productId || !amount || !method) {
    return jsonResponse({ success: false, status: 'failed', message: 'Missing required fields' }, 400);
  }

  // 3. SERVER-SIDE KILL SWITCH: read both flags from app_settings
  const { data: settings, error: settingsErr } = await supabaseAdmin
    .from('app_settings')
    .select('key, value');

  if (settingsErr) {
    return jsonResponse({ success: false, status: 'failed', message: 'Failed to read payment settings' }, 500);
  }

  const flags: Record<string, boolean> = {};
  for (const row of settings ?? []) {
    flags[row.key] = row.value;
  }

  const paymentSuper = flags['payment_super'] ?? false;
  const paymentEnabled = flags['payment_enabled'] ?? false;
  const canPay = paymentSuper && paymentEnabled;

  // 4. If either flag is false → REFUSE
  if (!canPay) {
    return jsonResponse({
      success: false,
      status: 'failed',
      message: 'Payment is not available',
      canPay: false,
      payment_super: paymentSuper,
      payment_enabled: paymentEnabled,
    }, 403);
  }

  // 5. Create the Moyasar payment (TEST MODE)
  const moyasarResponse = await createMoyasarPayment(amount, method, card);

  if (!moyasarResponse.ok) {
    const errBody = await moyasarResponse.text();

    // Save failed order
    await supabaseAdmin.from('orders').insert({
      user_id: userId,
      product_id: productId,
      amount: amount,
      status: 'failed',
      moyasar_id: null,
    });

    return jsonResponse({
      success: false,
      status: 'failed',
      message: 'Moyasar payment creation failed',
      detail: errBody,
    }, 400);
  }

  const moyasarData = await moyasarResponse.json();
  const moyasarId = moyasarData.id ?? null;

  // 6. Save order row
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      product_id: productId,
      amount: amount,
      status: 'paid',
      moyasar_id: moyasarId,
    })
    .select()
    .single();

  if (orderErr) {
    return jsonResponse({
      success: false,
      status: 'failed',
      message: 'Payment processed but failed to save order',
      moyasar_id: moyasarId,
    }, 500);
  }

  // 7. Return success
  return jsonResponse({
    success: true,
    status: 'paid',
    orderId: order.id,
    moyasarId: moyasarId,
    message: 'Payment processed successfully (test mode)',
  });
}

/**
 * Create a payment via Moyasar API (TEST MODE).
 * Docs: https://docs.moyasar.com/
 * Supports: mada, Visa/MC, Apple Pay
 */
async function createMoyasarPayment(
  amount: number,
  method: string,
  card: { number: string; name: string; expiry: string; cvc: string }
) {
  // Moyasar expects amounts in halalas (1 SAR = 100 halalas)
  const amountHalalas = Math.round(amount * 100);

  // For card payments (mada, visa), send card details to Moyasar
  // In test mode, Moyasar accepts test card numbers
  if (method === 'applepay') {
    // Apple Pay uses a different flow (token-based)
    // For test mode, we simulate a successful Apple Pay payment
    return fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`,
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: 'SAR',
        source: {
          type: 'applepay',
          token: 'tok_test_apple_pay',
        },
      }),
    });
  }

  // mada / visa — card-based
  const [expiryMonth, expiryYear] = (card.expiry || '12/30').split('/');

  return fetch('https://api.moyasar.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(moyasarSecretKey + ':')}`,
    },
    body: JSON.stringify({
      amount: amountHalalas,
      currency: 'SAR',
      source: {
        type: 'creditcard',
        name: card.name || 'Test User',
        number: card.number || '4111111111111111',
        cvc: card.cvc || '123',
        month: expiryMonth || '12',
        year: expiryYear || '2030',
      },
    }),
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}