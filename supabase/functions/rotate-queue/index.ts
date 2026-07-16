// Supabase Edge Function: rotate-queue
// Runs every hour via pg_cron. Checks if the active queue's current
// recommendation has ended (ends_at < now). If so, advances current_position
// (+1, or loops back to 1 after the last item) and inserts a new 24H recommendation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

Deno.serve(async (_req: Request) => {
  try {
    return await rotateQueue();
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function rotateQueue() {
  const now = new Date().toISOString();

  // 1. Find the active queue
  const { data: activeQueue, error: qErr } = await supabase
    .from('queues')
    .select('*')
    .eq('is_active', true)
    .single();

  if (qErr || !activeQueue) {
    return jsonResponse({ message: 'No active queue', skipped: true });
  }

  // 2. Check if current recommendation has ended
  const { data: currentRec } = await supabase
    .from('recommendations')
    .select('*')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('starts_at', { ascending: false })
    .limit(1)
    .single();

  // If there's still an active recommendation, nothing to do
  if (currentRec) {
    return jsonResponse({ message: 'Current recommendation still active', skipped: true });
  }

  // 3. Get all queue items for the active queue
  const { data: items, error: itemsErr } = await supabase
    .from('queue_items')
    .select('*')
    .eq('queue_id', activeQueue.id)
    .order('position', { ascending: true });

  if (itemsErr || !items || items.length === 0) {
    return jsonResponse({ message: 'No items in active queue', skipped: true });
  }

  // 4. Calculate next position (loop back to 1 after last item)
  const currentPosition = activeQueue.current_position;
  const nextPosition = currentPosition >= items.length ? 1 : currentPosition + 1;

  const nextProduct = items.find((item) => item.position === nextPosition);
  if (!nextProduct) {
    return jsonResponse({ message: 'Next product not found', error: true });
  }

  // 5. Update queue current_position
  const { error: updateErr } = await supabase
    .from('queues')
    .update({ current_position: nextPosition })
    .eq('id', activeQueue.id);

  if (updateErr) {
    return jsonResponse({ error: updateErr.message }, 500);
  }

  // 6. Insert new 24H recommendation
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: recErr } = await supabase.from('recommendations').insert({
    product_id: nextProduct.product_id,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (recErr) {
    return jsonResponse({ error: recErr.message }, 500);
  }

  return jsonResponse({
    message: 'Queue rotated',
    queue_id: activeQueue.id,
    previous_position: currentPosition,
    next_position: nextPosition,
    product_id: nextProduct.product_id,
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}