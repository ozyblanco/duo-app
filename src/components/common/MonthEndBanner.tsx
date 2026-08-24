import { AlertCircle, ArrowRight } from 'lucide-react';

interface MonthEndBannerProps {
  netBalance: number;
  onOpenSettleModal: () => void;
}

export function MonthEndBanner({ netBalance, onOpenSettleModal }: MonthEndBannerProps) {
  if (Math.abs(netBalance) < 0.01) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
          Hay un saldo pendiente de{' '}
          <span className="font-extrabold text-amber-600 dark:text-amber-400 font-numeric">
            ${Math.abs(netBalance).toFixed(2)} USD
          </span>
          . Pueden saldar cuentas para reiniciar el balance del mes a $0.00.
        </p>
      </div>

      <button
        onClick={onOpenSettleModal}
        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
      >
        <span>Saldar Ahora</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}