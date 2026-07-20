import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  image_url: string | null;
  initials: string;
  real_name_en: string | null;
  real_name_ar: string | null;
  // Optional rating fields (populated by useProducts after fetching ratings)
  avg_rating?: number;
  review_count?: number;
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name_en', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Product;
}

// ---------- Manager: Product updates ----------

export interface ProductUpdate {
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  image_url: string | null;
}

export async function updateProduct(id: string, updates: ProductUpdate): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name_en: updates.name_en,
      name_ar: updates.name_ar,
      description_en: updates.description_en,
      description_ar: updates.description_ar,
      price: updates.price,
      image_url: updates.image_url,
    })
    .eq('id', id);

  if (error) throw error;
}

// ---------- Manager: Recommendation Today ----------

export interface Recommendation {
  id: string;
  product_id: string;
  starts_at: string;
  ends_at: string;
}

export async function setRecommendationToday(productId: string): Promise<void> {
  // Delete any existing active recommendations, then insert a new 24H window
  const now = new Date().toISOString();
  const ends = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Clear old ones
  await supabase.from('recommendations').delete().lt('ends_at', now);

  const { error } = await supabase.from('recommendations').insert({
    product_id: productId,
    starts_at: now,
    ends_at: ends,
  });

  if (error) throw error;
}

export async function getCurrentRecommendation(): Promise<Recommendation | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .lte('starts_at', now)
    .gt('ends_at', now)
    .order('starts_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as Recommendation;
}

// ---------- Manager: Payment settings ----------

export async function getPaymentSettings(): Promise<{
  payment_super: boolean;
  payment_enabled: boolean;
}> {
  const { data, error } = await supabase.from('app_settings').select('key, value');

  if (error) throw error;

  const settings: Record<string, boolean> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return {
    payment_super: settings['payment_super'] ?? false,
    payment_enabled: settings['payment_enabled'] ?? false,
  };
}

export async function updatePaymentEnabled(enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ value: enabled })
    .eq('key', 'payment_enabled');

  if (error) throw error;
}