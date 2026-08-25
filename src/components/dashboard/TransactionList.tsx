import { 
  ShoppingBag, 
  Wifi, 
  UtensilsCrossed, 
  ArrowLeftRight, 
  CreditCard,
  ChevronRight,
  Receipt
} from 'lucide-react';
import type { Transaction } from '@/types';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';

interface TransactionListProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  onNewTransaction?: () => void;
}

export function TransactionList({ transactions, onViewAll, onNewTransaction }: TransactionListProps) {
  // CORRECCIÓN: Se extrae 'partner' correctamente del hook
  const { currentUser, partner } = useCoupleProfiles();

  const getCategoryIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('transferencia') || lower.includes('liquidación')) {
      return <ArrowLeftRight className="w-4 h-4 text-emerald-500" />;
    }
    if (lower.includes('supermercado') || lower.includes('comida') || lower.includes('mercado')) {
      return <ShoppingBag className="w-4 h-4 text-rose-500" />;
    }
    if (lower.includes('internet') || lower.includes('luz') || lower.includes('servicio')) {
      return <Wifi className="w-4 h-4 text-amber-500" />;
    }
    if (lower.includes('cena') || lower.includes('aniversario') || lower.includes('restaurante')) {
      return <UtensilsCrossed className="w-4 h-4 text-indigo-500" />;
    }
    return <CreditCard className="w-4 h-4 text-blue-500" />;
  };

  const formatSplitRatio = (splitRatio?: { userA: number; userB: number } | string) => {
    if (!splitRatio) return '50 / 50';
    if (typeof splitRatio === 'string') return splitRatio;
    return `${splitRatio.userA} / ${splitRatio.userB}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-6 lg:p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Sin movimientos registrados
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed mb-4">
          Aún no han registrado ningún gasto juntos. Registren el primero para comenzar a synchronizar sus finanzas.
        </p>
        {onNewTransaction && (
          <button
            onClick={onNewTransaction}
            className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Registrar Primer Gasto
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-5 lg:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
          Movimientos Recientes
        </h2>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {transactions.map((tx) => {
          const displayAmount = Math.abs(tx.amount);
          const isUser = tx.paidByUserId === currentUser?.id;
          
          // CORRECCIÓN: Se utiliza 'partner'
          const paidByName = isUser 
            ? (currentUser?.name || 'Tú') 
            : (partner?.name || 'Pareja');

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#0B0F17]/40 border border-slate-200/50 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700/60 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#161B22] border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  {getCategoryIcon(tx.title)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {tx.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Pagado por <span className="font-semibold text-slate-700 dark:text-slate-300">{paidByName}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold font-numeric block text-slate-900 dark:text-white">
                  -${displayAmount.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block mt-0.5">
                  {formatSplitRatio(tx.splitRatio)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}