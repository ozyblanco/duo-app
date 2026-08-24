import { useState } from 'react';
import { RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export function RatesWidget() {
  const { rates, isLoading, refetch } = useExchangeRates();
  const [amountUsd, setAmountUsd] = useState<number | string>(10);
  const [selectedRate, setSelectedRate] = useState<'binance' | 'bcv' | 'eur'>('binance');

  const getActiveRate = () => {
    if (selectedRate === 'bcv') return rates.bcvUsd;
    if (selectedRate === 'eur') return rates.bcvEur;
    return rates.binanceUsdt;
  };

  const calculatedVes = (Number(amountUsd) || 0) * getActiveRate();

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white space-y-4 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
            Tasas de Cambio VES
          </span>
        </div>
        <button 
          onClick={refetch}
          disabled={isLoading}
          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
          title="Actualizar tasas"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          {rates.lastUpdated}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setSelectedRate('binance')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedRate === 'binance'
              ? 'bg-blue-600/30 border-blue-500 text-white'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-400">Paralelo / P2P</div>
          <div className="text-sm font-black text-emerald-400 mt-0.5">
            Bs. {rates.binanceUsdt.toFixed(2)}
          </div>
        </button>

        <button
          onClick={() => setSelectedRate('bcv')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedRate === 'bcv'
              ? 'bg-blue-600/30 border-blue-500 text-white'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-400">BCV $</div>
          <div className="text-sm font-black text-blue-400 mt-0.5">
            Bs. {rates.bcvUsd.toFixed(2)}
          </div>
        </button>

        <button
          onClick={() => setSelectedRate('eur')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedRate === 'eur'
              ? 'bg-blue-600/30 border-blue-500 text-white'
              : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
          }`}
        >
          <div className="text-[10px] font-semibold text-slate-400">BCV Euro</div>
          <div className="text-sm font-black text-indigo-400 mt-0.5">
            Bs. {rates.bcvEur.toFixed(2)}
          </div>
        </button>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="number"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            placeholder="USD"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 block font-medium">Equivalente estimado</span>
          <span className="text-sm font-black text-white">
            Bs. {calculatedVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}