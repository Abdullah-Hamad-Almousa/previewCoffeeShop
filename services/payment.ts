import { supabase } from '@/lib/supabase';

export type PaymentMethod = 'mada' | 'visa' | 'applepay';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  moyasarId?: string;
  status: PaymentStatus;
  message?: string;
}

export interface CardDetails {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}

/**
 * Create a payment via the server-side edge function.
 * The edge function:
 *   1. Reads payment_super AND payment_enabled from app_settings
 *   2. If either is false → refuses (returns error)
 *   3. If canPay → creates Moyasar payment (test mode), saves order row
 *   4. Returns result
 *
 * The client NEVER decides alone — the server is the gatekeeper.
 */
export async function createPayment(
  productId: string,
  amount: number,
  method: PaymentMethod,
  card: CardDetails
): Promise<PaymentResult> {
  // Get the current session token to pass to the edge function
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      success: false,
      status: 'failed',
      message: 'Not authenticated',
    };
  }

  // Call the edge function
  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: {
      productId,
      amount,
      method,
      card,
    },
  });

  if (error) {
    return {
      success: false,
      status: 'failed',
      message: error.message ?? 'Edge function error',
    };
  }

  return data as PaymentResult;
}

