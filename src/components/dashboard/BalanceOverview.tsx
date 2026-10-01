import { Wallet, CheckCircle2, ArrowRightLeft, HandCoins, Users } from 'lucide-react';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useCurrency } from '@/hooks/useCurrency';

interface BalanceOverviewProps {
  totalJointSpent: number;
  userPaidTotal: number;
  partnerPaidTotal: number;
  netBalance: number;
  onOpenSettleModal?: () => void;
}

export function BalanceOverview({
  totalJointSpent,
  userPaidTotal,
  partnerPaidTotal,
  netBalance,
  onOpenSettleModal,
}: BalanceOverviewProps) {
  const { currentUser, partner } = useCoupleProfiles();
  const { formatAmount } = useCurrency();

  const currentUserName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú';
  const partnerName = partner?.name ? partner.name.split(' ')[0] : 'Pareja';

  const userInitial = currentUser?.name ? currentUser.name[0].toUpperCase() : 'U';
  const partnerInitial = partner?.name ? partner.name[0].toUpperCase() : 'P';

  const isSettled = Math.abs(netBalance) < 0.01;
  const userIsOwed = netBalance > 0.01;
  const absoluteBalance = Math.abs(netBalance);

  // Cálculo de porcentajes de aportes reales
  const totalPaid = userPaidTotal + partnerPaidTotal;
  const userPercent = totalPaid > 0 ? Math.round((userPaidTotal / totalPaid) * 100) : 50;
  const partnerPercent = totalPaid > 0 ? 100 - userPercent : 50;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Tarjeta 1: Estado de Deuda Mutua (Destacada y Accionable) */}
      <div 
        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
          isSettled
            ? 'bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-500/10 dark:via-[#161B22] dark:to-[#161B22] border-emerald-500/30'
            : userIsOwed
            ? 'bg-gradient-to-br from-blue-500/10 via-white to-white dark:from-blue-500/10 dark:via-[#161B22] dark:to-[#161B22] border-blue-500/30'
            : 'bg-gradient-to-br from-pink-500/10 via-white to-white dark:from-pink-500/10 dark:via-[#161B22] dark:to-[#161B22] border-pink-500/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HandCoins className="w-4 h-4 text-blue-500" />
            Balance de Pareja
          </span>
          <span 
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              isSettled
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}
          >
            {isSettled ? 'Equilibrado' : 'Pendiente'}
          </span>
        </div>

        <div className="my-3 space-y-1">
          {isSettled ? (
            <div>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Todo al día
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                No hay deudas pendientes entre ustedes.
              </p>
            </div>
          ) : (
            <div>
              <p 
                className={`text-2xl font-black font-numeric tracking-tight ${
                  userIsOwed ? 'text-blue-600 dark:text-blue-400' : 'text-pink-600 dark:text-pink-400'
                }`}
              >
                {formatAmount(absoluteBalance)}
              </p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                {userIsOwed ? (
                  <span>{partnerName} te debe este monto</span>
                ) : (
                  <span>Le debes este monto a {partnerName}</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div>
          {onOpenSettleModal && !isSettled && (
            <button
              type="button"
              onClick={onOpenSettleModal}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Saldar Cuentas</span>
            </button>
          )}
          {isSettled && (
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Gastos repartidos de forma justa</span>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta 2: Gasto Total Compartido */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-500" />
            Gasto Colectivo
          </span>
          <span className="text-[10px] font-semibold text-slate-400">Total acumulado</span>
        </div>

        <div className="my-3 space-y-1">
          <p className="text-2xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {formatAmount(totalJointSpent)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Suma de todos los pagos registrados por la pareja
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Mi aporte estimado (50%):</span>
          <span className="font-bold text-slate-900 dark:text-white font-numeric">
            {formatAmount(totalJointSpent / 2)}
          </span>
        </div>
      </div>

      {/* Tarjeta 3: Distribución Visual de Aportes Desembolsados */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-500" />
            Dinero Desembolsado
          </span>
          <span className="text-[10px] font-semibold text-slate-400">Quién puso más</span>
        </div>

        {/* Barra de Proporción Visual */}
        <div className="my-3 space-y-2">
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5">
            <div 
              className="h-full bg-blue-500 rounded-l-full transition-all duration-500"
              style={{ width: `${userPercent}%` }}
              title={`${currentUserName}: ${userPercent}%`}
            />
            <div 
              className="h-full bg-pink-500 rounded-r-full transition-all duration-500"
              style={{ width: `${partnerPercent}%` }}
              title={`${partnerName}: ${partnerPercent}%`}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black">
                {userInitial}
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-200">{currentUserName}</span>
              <span className="text-slate-400 text-[11px] font-numeric font-semibold">({userPercent}%)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-numeric font-semibold">({partnerPercent}%)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{partnerName}</span>
              <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px] font-black">
                {partnerInitial}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="font-numeric font-bold text-slate-800 dark:text-slate-200">
            {formatAmount(userPaidTotal)}
          </span>
          <span className="text-[11px] text-slate-400">vs</span>
          <span className="font-numeric font-bold text-slate-800 dark:text-slate-200">
            {formatAmount(partnerPaidTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}