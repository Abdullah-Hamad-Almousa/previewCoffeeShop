import { supabase } from '@/lib/supabase';
import type { RiyadhArea } from '@/lib/riyadh-locations';

export type PickupSlot = 'asap' | '30min' | '1hour' | 'custom';

export interface OrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
}

/**
 * Calculate the pickup time ISO string from a slot choice.
 * - asap: now + 15 min
 * - 30min: now + 30 min
 * - 1hour: now + 60 min
 * - custom: user-provided Date
 */
export function calcPickupTime(slot: PickupSlot, customDate?: Date): string {
  const now = new Date();
  if (slot === 'asap') return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  if (slot === '30min') return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  if (slot === '1hour') return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  return (customDate ?? now).toISOString();
}

/**
 * Create a FREE order (no payment). Inserts a row with status='ordered'.
 * Includes pickup time + random Riyadh delivery location.
 */
export async function createFreeOrder(
  productId: string,
  pickupTime: string,
  deliveryArea: RiyadhArea,
  isAr: boolean
): Promise<OrderResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      product_id: productId,
      amount: 0,
      status: 'ordered',
      pickup_time: pickupTime,
      delivery_area: isAr ? deliveryArea.name_ar : deliveryArea.name_en,
      delivery_lat: deliveryArea.lat,
      delivery_lng: deliveryArea.lng,
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, orderId: data.id };
}