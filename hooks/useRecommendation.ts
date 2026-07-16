import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';

import {
  getCurrentRecommendation,
  getProduct,
  type Product,
  type Recommendation,
} from '@/services/products';

interface RecommendationWithProduct {
  recommendation: Recommendation;
  product: Product;
}

export function useRecommendation() {
  const [data, setData] = useState<RecommendationWithProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const appStateRef = useRef(AppState.currentState);

  const fetch = useCallback(async () => {
    try {
      const rec = await getCurrentRecommendation();
      if (!rec) {
        setData(null);
        return;
      }
      const product = await getProduct(rec.product_id);
      if (product) {
        setData({ recommendation: rec, product });
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [fetch]);

  // Refetch on app focus (user returns to the app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive =
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active';

      appStateRef.current = nextState;

      if (wasInactive) {
        fetch();
      }
    });

    return () => subscription.remove();
  }, [fetch]);

  // Poll every 60 seconds as a fallback for realtime
  useEffect(() => {
    const interval = setInterval(() => {
      fetch();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, refetch: fetch };
}