import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowLeftRight, 
  Plus, 
  User, 
  Tag, 
  CreditCard,
  X,
  TrendingDown,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  Receipt
} from 'lucide-react';
import type { Transaction } from '@/types';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useCurrency } from '@/hooks/useCurrency';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { mockCategories } from '@/data/mockData';

interface TransactionsViewProps {
  transactions: Transaction[];
  onNewTransaction: () => void;
  onUpdateTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => Promise<boolean>;
  onDeleteTransaction: (id: string) => Promise<boolean>;
}

function getCategoryName(tx: Transaction) {
  const catVal = tx.categoryId || tx.category;
  if (!catVal) return 'General';
  const cat = mockCategories.find((c) => c.id === catVal || c.name.toLowerCase() === catVal.toLowerCase());
  return cat ? cat.name : catVal;
}

export function TransactionsView({ 
  transactions, 
  onNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}: TransactionsViewProps) {
  const { currentUser, partner } = useCoupleProfiles();
  const { formatAmount } = useCurrency();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayer, setSelectedPayer] = useState<'all' | string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_30_days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [txType, setTxType] = useState<'all' | 'expenses' | 'settlements'>('all');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return transactions
      .filter((tx) => {
        const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPayer = selectedPayer === 'all' || tx.paidByUserId === selectedPayer;
        
        const catName = getCategoryName(tx);
        const isSettlement = catName === 'Liquidación' || tx.category === 'Liquidación';

        const matchesCategory =
          selectedCategory === 'all' ||
          tx.categoryId === selectedCategory ||
          tx.category === selectedCategory ||
          catName.toLowerCase() === selectedCategory.toLowerCase();

        let matchesType = true;
        if (txType === 'expenses') matchesType = !isSettlement;
        if (txType === 'settlements') matchesType = isSettlement;

        const txTime = new Date(tx.createdAt || tx.date || 0).getTime();
        let matchesDate = true;
        if (dateRange === 'this_month') matchesDate = txTime >= startOfMonth;
        if (dateRange === 'last_30_days') matchesDate = txTime >= thirtyDaysAgo;
        if (dateRange === 'custom') {
          if (startDate) {
            const startMs = new Date(`${startDate}T00:00:00`).getTime();
            matchesDate = matchesDate && txTime >= startMs;
          }
          if (endDate) {
            const endMs = new Date(`${endDate}T23:59:59`).getTime();
            matchesDate = matchesDate && txTime <= endMs;
          }
        }

        return matchesSearch && matchesPayer && matchesCategory && matchesType && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') {
          return b.amount - a.amount;
        }
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      });
  }, [transactions, searchTerm, selectedPayer, selectedCategory, sortBy, dateRange, startDate, endDate, txType]);

  const filteredTotal = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPayer('all');
    setSelectedCategory('all');
    setSortBy('date');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
    setTxType('all');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedPayer !== 'all' ||
    selectedCategory !== 'all' ||
    dateRange !== 'all' ||
    txType !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const currentUserName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú';
  const partnerName = partner?.name ? partner.name.split(' ')[0] : 'Pareja';

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${title}"?`)) {
      await onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Historial de Movimientos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta, busca, edita y filtra todos los gastos e intercambios de saldo
          </p>
        </div>

        <button
          type="button"
          onClick={onNewTransaction}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {mockCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value="Liquidación">Liquidación / Saldos</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'all' | 'this_month' | 'last_30_days' | 'custom')}
              className="w-full pl-10 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              <option value="all">Cualquier fecha</option>
              <option value="this_month">Este mes</option>
              <option value="last_30_days">Últimos 30 días</option>
              <option value="custom">Rango personalizado...</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortBy === 'date' ? 'Orden: Recientes' : 'Orden: Mayor monto'}</span>
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Desde:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">Hasta:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Pagó:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPayer('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPayer === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Ambos
            </button>
            {currentUser && (
              <button
                type="button"
                onClick={() => setSelectedPayer(currentUser.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPayer === currentUser.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <div className="h-4 w-4 rounded-full bg-blue-400 text-[9px] flex items-center justify-center text-white font-bold">
                  {currentUserName[0]}
                </div>
                <span>{currentUserName}</span>
              </button>
            )}
            {partner && (
              <button
                type="button"
                onClick={() => setSelectedPayer(partner.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPayer === partner.id
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <div className="h-4 w-4 rounded-full bg-pink-400 text-[9px] flex items-center justify-center text-white font-bold">
                  {partnerName[0]}
                </div>
                <span>{partnerName}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Tipo:
            </span>
            <button
              type="button"
              onClick={() => setTxType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                txType === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTxType('expenses')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                txType === 'expenses'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Gastos
            </button>
            <button
              type="button"
              onClick={() => setTxType('settlements')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                txType === 'settlements'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Liquidaciones
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto lg:ml-2 text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteo y Suma */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Mostrando {filteredTransactions.length} de {transactions.length} registros
        </span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
          <TrendingDown className="w-4 h-4 text-rose-500" />
          <span>Suma: {formatAmount(filteredTotal)}</span>
        </div>
      </div>

      {/* Lista de Movimientos */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2">
            <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No se encontraron movimientos
            </p>
            <p className="text-xs text-slate-400">
              Prueba cambiando la palabra clave o limpiando los filtros
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isUser = tx.paidByUserId === currentUser?.id;
            const payerName = isUser ? currentUserName : partnerName;
            const categoryName = getCategoryName(tx);
            const isSettlement = categoryName === 'Liquidación' || tx.category === 'Liquidación';

            const txDate = tx.createdAt || tx.date;
            const formattedDate = txDate 
              ? new Date(txDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              : 'Hoy';

            return (
              <div
                key={tx.id}
                className={`p-4 rounded-2xl bg-white dark:bg-[#161B22] border transition-all flex items-center justify-between gap-4 group ${
                  isSettlement
                    ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/5'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSettlement
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : isUser
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400'
                    }`}
                  >
                    {isSettlement ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </h3>
                      {tx.receiptUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingReceiptUrl(tx.receiptUrl!)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          title="Ver comprobante adjunto"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Recibo</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3 h-3" /> Pagado por {payerName}
                      </span>
                      <span>•</span>
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          isSettlement
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        <Tag className="w-3 h-3" /> {categoryName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold block font-numeric ${
                        isSettlement
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isSettlement ? '+' : '-'}{formatAmount(tx.amount)}
                    </span>
                    {!isSettlement && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {tx.splitRatio?.userA ?? 50}/{tx.splitRatio?.userB ?? 50}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSettlement && (
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all cursor-pointer"
                        title="Editar movimiento"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id, tx.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Edición */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
          onUpdate={onUpdateTransaction}
        />
      )}

      {/* Modal Lightbox Visor de Comprobante */}
      {viewingReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setViewingReceiptUrl(null)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] bg-white dark:bg-[#161B22] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewingReceiptUrl(null)}
              className="absolute top-4 right-4 bg-slate-900/70 text-white p-2 rounded-full hover:bg-slate-900 transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={viewingReceiptUrl}
              alt="Comprobante en detalle"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}