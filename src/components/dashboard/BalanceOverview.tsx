import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';

interface BalanceOverviewProps {
  totalJointSpent: number;
  userPaidTotal: number;
  partnerPaidTotal: number;
  netBalance: number;
}

export function BalanceOverview({
  totalJointSpent,
  userPaidTotal,
  partnerPaidTotal,
  netBalance,
}: BalanceOverviewProps) {
  // Extraemos currentUser y partner del hook personalizado
  const { currentUser, partner } = useCoupleProfiles();

  const currentUserName = currentUser?.name || 'Tú';
  const partnerName = partner?.name || 'Pareja';

  const isSettled = Math.abs(netBalance) < 0.01;
  const userIsOwed = netBalance > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tarjeta 1: Gasto Total */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Gasto Total Compartido
          </span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-numeric">
          ${totalJointSpent.toFixed(2)}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">Acumulado general de la pareja</p>
      </div>

      {/* Tarjeta 2: Aportes Pagados */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Aportes Pagados
          </span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">{currentUserName}:</span>
            <span className="font-bold text-slate-900 dark:text-white">${userPaidTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">{partnerName}:</span>
            <span className="font-bold text-slate-900 dark:text-white">${partnerPaidTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tarjeta 3: Estado de Saldos */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Estado de Saldos
          </span>
          <div
            className={`p-2 rounded-xl ${
              isSettled
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : userIsOwed
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {userIsOwed ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        {isSettled ? (
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            Están al día 🎉
          </p>
        ) : (
          <div>
            <p
              className={`text-2xl font-extrabold font-numeric ${
                userIsOwed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {userIsOwed ? '+' : '-'}${Math.abs(netBalance).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {userIsOwed ? `${partnerName} te debe` : `Le debes a ${partnerName}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}