import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  X, 
  PiggyBank, 
  Loader2, 
  Trash2,
  CreditCard,
  ArrowLeftRight,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions } from '@/hooks/useTransactions';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useNotifications } from '@/hooks/useNotifications';
import { useCurrency } from '@/hooks/useCurrency';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/components/accounts/useAccounts';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import type { Goal } from '@/types';

export function GoalsView() {
  const { 
    goals, 
    isLoading, 
    totalTarget, 
    totalSaved, 
    overallProgress, 
    addGoal, 
    depositToGoal, 
    deleteGoal 
  } = useGoals();

  const { addTransaction, refreshTransactions } = useTransactions();
  const { currentUser, partner } = useCoupleProfiles();
  const { addNotification } = useNotifications();
  const { formatAmount } = useCurrency();
  const { categories } = useCategories();
  const { accounts, debitAccount, refetch: refetchAccounts } = useAccounts();
  const { rates, isLoading: ratesLoading, refetch: refetchRates } = useExchangeRates();

  const currentUserId = currentUser?.id || '';
  const partnerId = partner?.id || '';
  const currentUserName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú';
  const partnerName = partner?.name ? partner.name.split(' ')[0] : 'Pareja';

  const userInitial = currentUser?.name ? currentUser.name[0].toUpperCase() : 'U';
  const partnerInitial = partner?.name ? partner.name[0].toUpperCase() : 'P';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario Nueva Meta
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Formulario Abono
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<'USD' | 'VES'>('USD');
  const [rateType, setRateType] = useState<'bcv' | 'binance'>('bcv');
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const activePayerId = selectedPayerId || currentUserId;

  // Tasa de cambio activa
  const activeRate = (rateType === 'bcv' ? rates.bcvUsd : rates.binanceUsdt) || 860;
  const numericAmount = parseFloat(depositAmount) || 0;

  // Cálculo en USD (para la meta) y en VES (para cuentas venezolanas)
  const amountInUsd =
    depositCurrency === 'USD'
      ? numericAmount
      : numericAmount > 0 ? Number((numericAmount / activeRate).toFixed(2)) : 0;

  const amountInVes =
    depositCurrency === 'VES'
      ? numericAmount
      : numericAmount > 0 ? Number((numericAmount * activeRate).toFixed(2)) : 0;

  // Cuenta bancaria seleccionada
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // MONTO EXACTO A DEBITAR SEGÚN LA MONEDA DE LA CUENTA
  let exactDebitAmount = 0;
  if (selectedAccount && numericAmount > 0) {
    if (selectedAccount.currency === 'VES') {
      // Si la cuenta es venezolana, se debita en Bolívares
      exactDebitAmount = amountInVes;
    } else {
      // Si la cuenta es en dólares (PayPal, Binance, etc.), se debita en USD
      exactDebitAmount = amountInUsd;
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newTarget);
    if (!newTitle.trim() || isNaN(target) || target <= 0) return;

    try {
      setIsSubmitting(true);
      const chosenCat = newCategory || (categories[0]?.name ?? 'General');

      const success = await addGoal({
        title: newTitle.trim(),
        category: chosenCat,
        targetAmount: target,
        deadline: newDeadline || undefined,
      });

      if (success) {
        addNotification({
          title: 'Nueva Meta Compartida 🎯',
          message: `${currentUserName} creó el objetivo "${newTitle.trim()}" por ${formatAmount(target)}.`,
          type: 'goal',
        });
        setNewTitle('');
        setNewTarget('');
        setNewDeadline('');
        setIsCreateOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ABONO CON CONVERSIÓN AUTOMÁTICA Y TRAZABILIDAD COMPLETA
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || numericAmount <= 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const isUser = activePayerId === currentUserId;
      const payerDisplayName = isUser ? currentUserName : partnerName;

      // 1. Aumentar el progreso de la meta (siempre en USD)
      const result = await depositToGoal(selectedGoal.id, amountInUsd, isUser);
      const isGoalCompleted = typeof result === 'object' && result?.isNowCompleted;

      // 2. Débito bancario exacto en la moneda nativa de la cuenta seleccionada
      if (selectedAccountId && exactDebitAmount > 0) {
        await debitAccount(selectedAccountId, exactDebitAmount);
        await refetchAccounts();
      }

      // 3. Registrar el movimiento oficial en el historial de transacciones
      const savingsCategory =
        categories.find(
          (c) =>
            c.name.toLowerCase().includes('ahorro') ||
            c.name.toLowerCase().includes('meta')
        )?.name || 'Ahorro';

      await addTransaction({
        title: `Abono: ${selectedGoal.title}`,
        amount: amountInUsd,
        currency: 'USD',
        type: 'expense',
        ownership: 'joint',
        paidByUserId: activePayerId,
        categoryId: savingsCategory,
        accountId: selectedAccountId || undefined,
        splitRatio: isUser ? { userA: 100, userB: 0 } : { userA: 0, userB: 100 },
        createdAt: new Date().toISOString(),
      });

      await refreshTransactions();

      // 4. Notificación del abono con detalle del débito bancario
      const debitDetail = selectedAccount
        ? selectedAccount.currency === 'VES'
          ? ` (Bs. ${exactDebitAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} debitados de ${selectedAccount.name})`
          : ` ($${exactDebitAmount.toFixed(2)} USD debitados de ${selectedAccount.name})`
        : '';

      addNotification({
        title: 'Nuevo Abono a Meta 💰',
        message: `${payerDisplayName} abonó $${amountInUsd.toFixed(2)} USD a "${selectedGoal.title}"${debitDetail}.`,
        type: 'expense',
      });

      // 5. Notificación adicional si se alcanzó el 100% de la meta
      if (isGoalCompleted) {
        addNotification({
          title: '¡Meta Alcanzada! 🎉',
          message: `¡Completaron el 100% de la meta "${selectedGoal.title}"!`,
          type: 'goal',
        });
      }

      setDepositAmount('');
      setSelectedGoal(null);
      setSelectedPayerId('');
      setSelectedAccountId('');
    } catch (err) {
      console.error('Error al realizar abono a la meta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (confirm(`¿Deseas eliminar la meta "${title}"?`)) {
      await deleteGoal(goalId);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Metas de Ahorro
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Planifiquen y alcancen sus proyectos compartidos juntos
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Meta</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-wider text-blue-100 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Progreso Global de Ahorro
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{formatAmount(totalSaved)}</span>
              <span className="text-xs text-blue-200">de {formatAmount(totalTarget)}</span>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-blue-100">Meta colectiva</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-blue-950/40 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
              No tienen metas registradas aún. Haz clic en "+ Nueva Meta" para comenzar.
            </div>
          ) : (
            goals.map((goal) => {
              const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
              const isDone = goal.isCompleted || percentage >= 100;

              return (
                <div 
                  key={goal.id} 
                  className={`p-5 rounded-2xl border transition-all relative group ${
                    isDone 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : 'bg-white dark:bg-[#161B22] border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {goal.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {goal.title}
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isDone}
                        onClick={() => setSelectedGoal(goal)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default' 
                            : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                        }`}
                      >
                        <PiggyBank className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Completada' : 'Abonar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id, goal.title)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white font-numeric">
                        {formatAmount(goal.currentAmount)}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-numeric">
                        Meta: {formatAmount(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isDone ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-500'
                        }`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {goal.deadline || 'Sin fecha'}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {percentage}% alcanzado
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-[#3B82F6] text-[9px] flex items-center justify-center font-bold text-white uppercase">
                        {userInitial}
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 font-numeric">
                        {formatAmount(goal.userContribution)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-numeric">
                        {formatAmount(goal.partnerContribution)}
                      </span>
                      <div className="h-5 w-5 rounded-full bg-[#FF6B9D] text-[9px] flex items-center justify-center font-bold text-white uppercase">
                        {partnerInitial}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Crear Meta */}
      {isCreateOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCreateOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Nueva Meta Compartida
              </h2>
              <button 
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Objetivo
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Viaje, Fondo de Emergencia, Internet..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    {categories.length === 0 ? (
                      <option value="General">General</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Objetivo ($)
                  </label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="1"
                    placeholder="1000"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-numeric font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Límite Esperada
                </label>
                <input 
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Meta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Realizar Abono con Cálculo Automático de Divisa */}
      {selectedGoal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setSelectedGoal(null)}
        >
          <div 
            className="bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Abonar a Meta
                </h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[240px]">
                  {selectedGoal.title}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedGoal(null)}
                disabled={isSubmitting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              {/* 1. ¿Quién realiza el abono? */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ¿Quién realiza el abono?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayerId(currentUserId)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      activePayerId === currentUserId
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black">
                      {userInitial}
                    </div>
                    <span>{currentUserName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayerId(partnerId)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      activePayerId === partnerId
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px] font-black">
                      {partnerInitial}
                    </div>
                    <span>{partnerName}</span>
                  </button>
                </div>
              </div>

              {/* 2. Monto con Selector USD / VES y Tasa */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Monto a Abonar</span>
                  <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                    <button
                      type="button"
                      onClick={refetchRates}
                      disabled={ratesLoading}
                      className="flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                      <span>Tasa: Bs. {activeRate.toFixed(2)}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {depositCurrency === 'USD' ? (
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <span className="text-xs font-bold text-blue-500">Bs</span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-2 py-1.5 text-lg font-black font-numeric text-slate-900 dark:text-white bg-transparent focus:outline-none"
                    />
                  </div>

                  {/* Selector USD / VES */}
                  <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setDepositCurrency('USD')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        depositCurrency === 'USD'
                          ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositCurrency('VES')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        depositCurrency === 'VES'
                          ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      VES
                    </button>
                  </div>
                </div>

                {/* Switch de Tasa BCV / Binance */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[10px]">Tasa:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setRateType('bcv')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          rateType === 'bcv'
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        BCV
                      </button>
                      <button
                        type="button"
                        onClick={() => setRateType('binance')}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          rateType === 'binance'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        Binance
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold font-numeric text-xs">
                    <ArrowLeftRight className="w-3 h-3 text-blue-500" />
                    <span>
                      {depositCurrency === 'USD'
                        ? `≈ Bs. ${amountInVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                        : `≈ $${amountInUsd.toFixed(2)} USD para la meta`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Descontar de Cuenta / Billetera con Débito Proporcional */}
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                  <span>Descontar de Cuenta o Billetera</span>
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer font-medium"
                >
                  <option value="">Abono manual (Sin descontar de cuenta)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {acc.currency === 'VES' ? 'Bs.' : '$'}{acc.balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })} {acc.currency}
                    </option>
                  ))}
                </select>

                {/* Recuadro de Confirmación de Débito */}
                {selectedAccount && numericAmount > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                    <span>⚡ Se debitará de {selectedAccount.name}:</span>
                    <strong className="font-numeric font-extrabold text-sm">
                      {selectedAccount.currency === 'VES'
                        ? `Bs. ${exactDebitAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                        : `$${exactDebitAmount.toFixed(2)} USD`}
                    </strong>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || numericAmount <= 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirmar Abono (${amountInUsd.toFixed(2)} USD)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}