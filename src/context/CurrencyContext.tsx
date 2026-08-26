/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export type BaseCurrency = 'USD' | 'VES';

interface CurrencyContextType {
  currency: BaseCurrency;
  setCurrency: (currency: BaseCurrency) => void;
  formatAmount: (amountInUSD: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'duo_base_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<BaseCurrency>(() => {
    if (typeof window === 'undefined') return 'USD';
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      return saved === 'VES' || saved === 'USD' ? saved : 'USD';
    } catch {
      return 'USD';
    }
  });

  const { rates } = useExchangeRates();

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (e) {
      console.error('Error guardando moneda:', e);
    }
  }, [currency]);

  const setCurrency = useCallback((newCurr: BaseCurrency) => {
    setCurrencyState(newCurr);
  }, []);

  const formatAmount = useCallback(
    (amountInUSD: number) => {
      if (currency === 'VES') {
        const rate = rates.bcvUsd > 0 ? rates.bcvUsd : 36.5;
        const inVES = amountInUSD * rate;
        return `Bs. ${inVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [currency, rates.bcvUsd]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatAmount,
    }),
    [currency, setCurrency, formatAmount]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}