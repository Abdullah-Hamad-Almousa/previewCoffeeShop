import { supabase } from '@/lib/supabase';
import type { Product } from '@/services/products';

// ---------- Types ----------

export interface Queue {
  id: number;
  name: string;
  is_active: boolean;
  current_position: number;
  started_at: string | null;
}

export interface QueueItem {
  id: string;
  queue_id: number;
  product_id: string;
  position: number;
}

export interface QueueWithItems extends Queue {
  items: QueueItem[];
}

// ---------- Read ----------

export async function getQueues(): Promise<Queue[]> {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Queue[];
}

export async function getQueueItems(queueId: number): Promise<QueueItem[]> {
  const { data, error } = await supabase
    .from('queue_items')
    .select('*')
    .eq('queue_id', queueId)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data ?? []) as QueueItem[];
}

export async function getQueueWithItems(queueId: number): Promise<QueueWithItems | null> {
  const [queues, items] = await Promise.all([
    getQueues(),
    getQueueItems(queueId),
  ]);

  const queue = queues.find((q) => q.id === queueId);
  if (!queue) return null;

  return { ...queue, items };
}

// ---------- Start ----------

export async function startQueue(queueId: number): Promise<void> {
  // 1. Deactivate all other queues
  const { error: deactivateErr } = await supabase
    .from('queues')
    .update({ is_active: false })
    .neq('id', queueId);

  if (deactivateErr) throw deactivateErr;

  // 2. Activate this queue, reset position to 1, set started_at
  const { error: activateErr } = await supabase
    .from('queues')
    .update({
      is_active: true,
      current_position: 1,
      started_at: new Date().toISOString(),
    })
    .eq('id', queueId);

  if (activateErr) throw activateErr;

  // 3. Get the first item in the queue
  const items = await getQueueItems(queueId);
  if (items.length === 0) return;

  const firstItem = items[0];

  // 4. Create the first 24H recommendation
  const now = new Date().toISOString();
  const ends = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Clear old recommendations
  await supabase.from('recommendations').delete().lt('ends_at', now);

  const { error: recErr } = await supabase.from('recommendations').insert({
    product_id: firstItem.product_id,
    starts_at: now,
    ends_at: ends,
  });

  if (recErr) throw recErr;
}

// ---------- Save queue items ----------

export async function saveQueueItems(queueId: number, productIds: string[]): Promise<void> {
  // Delete existing items
  const { error: delErr } = await supabase
    .from('queue_items')
    .delete()
    .eq('queue_id', queueId);

  if (delErr) throw delErr;

  // Insert new items with positions
  if (productIds.length === 0) return;

  const rows = productIds.map((productId, index) => ({
    queue_id: queueId,
    product_id: productId,
    position: index + 1,
  }));

  const { error: insertErr } = await supabase.from('queue_items').insert(rows);

  if (insertErr) throw insertErr;
}

// ---------- Random ----------

export async function buildRandomQueue(products: Product[]): Promise<string[]> {
  if (!products || products.length === 0) return [];
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((p) => p.id);
}