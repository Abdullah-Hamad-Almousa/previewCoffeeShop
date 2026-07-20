import { useEffect, useState } from 'react';
import { getProducts, getProduct, type Product } from '@/services/products';
import { getAllProductRatings } from '@/services/reviews';

/** Hook: fetch all products + merge aggregate ratings + loading state */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getProducts(), getAllProductRatings()])
      .then(([data, ratings]) => {
        const merged = data.map((p) => {
          const r = ratings.get(p.id);
          return {
            ...p,
            avg_rating: r?.avg_rating,
            review_count: r?.review_count,
          };
        });
        setProducts(merged);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return { products, loading, error };
}

/** Hook: fetch single product by id + loading state */
export function useProduct(id?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((data) => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  return { product, loading };
}