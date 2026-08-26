import { useContext } from 'react';
import { CurrencyContext } from '@/context/CurrencyContext';

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency debe usarse dentro de un CurrencyProvider');
  }
  return context;
}