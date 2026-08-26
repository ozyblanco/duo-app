import { useState, useEffect, useCallback } from 'react';
import type { ExchangeRates } from '@/types';

interface DolarApiResponseItem {
  fuente: string;
  promedio: number;
}

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>({
    bcvUsd: 36.50,
    bcvEur: 39.80,
    binanceUsdt: 38.20,
    lastUpdated: 'Cargando...',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchRates() {
      try {
        const [resDolares, resEuro, resBinanceP2P] = await Promise.all([
          fetch('https://ve.dolarapi.com/v1/dolares'),
          fetch('https://ve.dolarapi.com/v1/euros/oficial').catch(() => null),
          fetch('https://criptoya.com/api/binancep2p/usdt/ves/1').catch(() => null),
        ]);

        if (!resDolares.ok) {
          throw new Error('No se pudo obtener la tasa de cambio oficial.');
        }

        if (isMounted) {
          const dataDolares: DolarApiResponseItem[] = await resDolares.json();
          const oficial = dataDolares.find((d) => d.fuente === 'oficial')?.promedio || 36.50;
          let paralelo = dataDolares.find((d) => d.fuente === 'paralelo')?.promedio || 38.20;

          // Extrae el precio 'ask' (tasa de venta/compra real P2P Binance)
          if (resBinanceP2P && resBinanceP2P.ok) {
            const dataP2P = await resBinanceP2P.json();
            if (dataP2P?.ask) {
              paralelo = Number(dataP2P.ask);
            }
          }

          let euroValue = Number((oficial * 1.09).toFixed(2));
          if (resEuro && resEuro.ok) {
            const dataEuro = await resEuro.json();
            if (dataEuro?.promedio) euroValue = dataEuro.promedio;
          }

          const now = new Date();
          const formattedTime = now.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
          });

          setRates({
            bcvUsd: oficial,
            bcvEur: euroValue,
            binanceUsdt: paralelo,
            lastUpdated: `Hoy ${formattedTime}`,
          });
        }
      } catch {
        if (isMounted) {
          setRates((prev) => ({
            ...prev,
            lastUpdated: 'Modo offline',
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchRates();

    const interval = setInterval(() => {
      fetchRates();
    }, 300000); // 5 minutos

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [reloadTrigger]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  const convertUsdToVes = useCallback(
    (amountInUsd: number, rateType: 'bcv' | 'binance' = 'binance') => {
      const rate = rateType === 'bcv' ? rates.bcvUsd : rates.binanceUsdt;
      return amountInUsd * rate;
    },
    [rates.bcvUsd, rates.binanceUsdt]
  );

  return { rates, isLoading, convertUsdToVes, refetch };
}