import { supabase } from '@/lib/supabase';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  username: string | null;
}

/** Fetch all reviews for a product (with reviewer username) */
export async function getReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase.rpc('get_product_reviews', {
    p_product_id: productId,
  });

  if (error) throw error;
  return (data ?? []) as Review[];
}

/** Check if the current user has purchased (paid order) a product */
export async function hasPurchased(productId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_purchased', {
    p_product_id: productId,
  });

  if (error) throw error;
  return data as boolean;
}

/** Add a review for a product (RLS enforces purchase check) */
export async function addReview(
  productId: string,
  rating: number,
  comment: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('reviews').insert({
    product_id: productId,
    user_id: user.id,
    rating,
    comment: comment.trim() || null,
  });

  if (error) throw error;
}

/** Delete the current user's review */
export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

// ---------- Aggregate ratings ----------

export interface ProductRating {
  product_id: string;
  avg_rating: number;
  review_count: number;
}

/** Fetch aggregate ratings (avg + count) for ALL products in one call */
export async function getAllProductRatings(): Promise<Map<string, ProductRating>> {
  const { data, error } = await supabase.rpc('get_all_product_ratings');
  if (error) throw error;

  const map = new Map<string, ProductRating>();
  for (const row of (data ?? []) as ProductRating[]) {
    map.set(row.product_id, row);
  }
  return map;
}

/** Fetch aggregate rating for a single product */
export async function getProductRating(productId: string): Promise<ProductRating | null> {
  const all = await getAllProductRatings();
  return all.get(productId) ?? null;
}