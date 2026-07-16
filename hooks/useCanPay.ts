import { useState, useEffect, useCallback } from 'react';

import { getPaymentSettings } from '@/services/products';

interface CanPayState {
  canPay: boolean;
  payment_super: boolean;
  payment_enabled: boolean;
  loading: boolean;
}

export function useCanPay() {
  const [state, setState] = useState<CanPayState>({
    canPay: false,
    payment_super: false,
    payment_enabled: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const settings = await getPaymentSettings();
      setState({
        canPay: settings.payment_super && settings.payment_enabled,
        payment_super: settings.payment_super,
        payment_enabled: settings.payment_enabled,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll every 30 seconds for live flag updates
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return state;
}