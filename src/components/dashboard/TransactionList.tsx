import { 
  ArrowLeftRight, 
  ChevronRight,
  Receipt,
  Plus,
  Tag,
  Clock
} from 'lucide-react';
import type { Transaction } from '@/types';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';
import { formatFriendlyDate } from '@/utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onViewAll?: () => void;
  onNewTransaction?: () => void;
}

export function TransactionList({ transactions, onViewAll, onNewTransaction }: TransactionListProps) {
  const { currentUser, partner } = useCoupleProfiles();
  const { formatAmount } = useCurrency();
  const { categories } = useCategories();

  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú';
  const partnerName = partner?.name ? partner.name.split(' ')[0] : 'Pareja';

  const userInitial = currentUser?.name ? currentUser.name[0].toUpperCase() : 'U';
  const partnerInitial = partner?.name ? partner.name[0].toUpperCase() : 'P';

  const getCategoryDetails = (catIdOrName?: string) => {
    if (!catIdOrName) return { name: 'General', color: '#3B82F6' };
    const found = categories.find(
      (c) => c.id === catIdOrName || c.name.toLowerCase() === catIdOrName.toLowerCase()
    );
    return {
      name: found ? found.name : catIdOrName,
      color: found?.color || '#3B82F6',
    };
  };

  // Mostrar únicamente los últimos 5 movimientos en el Dashboard
  const recentTransactions = transactions.slice(0, 5);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Aún no hay gastos registrados 🎉
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed mb-4">
          Comiencen a organizar sus finanzas registrando su primera compra o pago compartido.
        </p>
        {onNewTransaction && (
          <button
            type="button"
            onClick={onNewTransaction}
            className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Primer Gasto</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-5 lg:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Movimientos Recientes
          </h2>
          <p className="text-[11px] text-slate-400">
            Últimos registros de la pareja
          </p>
        </div>
        {onViewAll && (
          <button 
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver historial completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {recentTransactions.map((tx) => {
          const isUser = tx.paidByUserId === currentUserId;
          const payerName = isUser ? currentUserName : partnerName;
          const payerInitial = isUser ? userInitial : partnerInitial;

          const isSettlement = tx.categoryId === 'Liquidación' || tx.category === 'Liquidación';
          const { name: categoryName, color: categoryColor } = getCategoryDetails(tx.categoryId || tx.category);

          const friendlyDate = formatFriendlyDate(tx.createdAt || tx.date);

          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isSettlement
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-slate-50/80 dark:bg-[#0B0F17]/50 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar del Pagador */}
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 ${
                    isSettlement 
                      ? 'bg-emerald-500' 
                      : isUser 
                      ? 'bg-blue-600' 
                      : 'bg-pink-500'
                  }`}
                  title={`Pagado por ${payerName}`}
                >
                  {isSettlement ? <ArrowLeftRight className="w-4 h-4" /> : payerInitial}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tx.title}
                    </h3>
                    {tx.receiptUrl && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                        <Receipt className="w-2.5 h-2.5" />
                        <span>Recibo</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {payerName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Tag className="w-3 h-3" style={{ color: categoryColor }} />
                      <span style={{ color: categoryColor }}>{categoryName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {friendlyDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span 
                  className={`text-xs font-extrabold font-numeric block ${
                    isSettlement
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isSettlement ? '+' : '-'}{formatAmount(tx.amount)}
                </span>
                {!isSettlement && (
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5">
                    {tx.splitRatio?.userA ?? 50}/{tx.splitRatio?.userB ?? 50}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}