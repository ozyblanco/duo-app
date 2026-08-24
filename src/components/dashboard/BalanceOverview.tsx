import { DollarSign, Scale } from 'lucide-react';

interface BalanceOverviewProps {
  totalJointSpent: number;
  userPaidTotal: number;
  partnerPaidTotal: number;
}

export function BalanceOverview({
  totalJointSpent,
  userPaidTotal,
  partnerPaidTotal,
}: BalanceOverviewProps) {
  const balance = userPaidTotal - totalJointSpent / 2;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Gastos Compartidos */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          <span>Gastos Compartidos</span>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ${totalJointSpent.toFixed(2)}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Total acumulado este mes
          </p>
        </div>
      </div>

      {/* Balance Mutuo */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          <span>Balance Mutuo (50/50)</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold tracking-tight text-emerald-500">
            {balance >= 0 ? `+$${balance.toFixed(2)}` : `-$${Math.abs(balance).toFixed(2)}`}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {balance >= 0 ? '↙ Pareja te debe este monto' : '↗ Le debes este monto a tu pareja'}
          </p>
        </div>
      </div>

      {/* Aportes del Mes */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-3">
          Aportes del Mes
        </div>
        <div className="space-y-3 text-xs font-medium">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
            <span className="text-slate-600 dark:text-slate-400">Oscar ha pagado:</span>
            <span className="font-bold text-slate-900 dark:text-white">${userPaidTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Pareja ha pagado:</span>
            <span className="font-bold text-slate-900 dark:text-white">${partnerPaidTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}