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
  Trash2
} from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useNotifications } from '@/hooks/useNotifications';
import { useCurrency } from '@/hooks/useCurrency';
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

  const { currentUser, partner } = useCoupleProfiles();
  const { addNotification } = useNotifications();
  const { formatAmount } = useCurrency();

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
  const [newCategory, setNewCategory] = useState('Hogar');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Formulario Abono
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');

  const activePayerId = selectedPayerId || currentUserId;

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newTarget);
    if (!newTitle.trim() || isNaN(target) || target <= 0) return;

    try {
      setIsSubmitting(true);
      const success = await addGoal({
        title: newTitle.trim(),
        category: newCategory,
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      setIsSubmitting(true);
      const isUser = activePayerId === currentUserId;
      const payerDisplayName = isUser ? currentUserName : partnerName;

      const { success, isNowCompleted } = await depositToGoal(selectedGoal.id, amount, isUser);

      if (success) {
        if (isNowCompleted) {
          addNotification({
            title: '¡Meta Alcanzada! 🎉',
            message: `¡Completaron el 100% de la meta "${selectedGoal.title}"!`,
            type: 'goal',
          });
        } else {
          addNotification({
            title: 'Nuevo Abono a Meta 💰',
            message: `${payerDisplayName} abonó ${formatAmount(amount)} a "${selectedGoal.title}".`,
            type: 'goal',
          });
        }

        setDepositAmount('');
        setSelectedGoal(null);
        setSelectedPayerId('');
      }
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
      {/* Header Módulo */}
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

      {/* Banner Resumen */}
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

      {/* Rejilla de Metas */}
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

                  {/* Saldo y Barra */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatAmount(goal.currentAmount)}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
                        <Calendar className="w-3 h-3" />
                        {goal.deadline || 'Sin fecha'}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {percentage}% alcanzado
                      </span>
                    </div>
                  </div>

                  {/* Aportes Individuales Dinámicos */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-[#3B82F6] text-[9px] flex items-center justify-center font-bold text-white uppercase">
                        {userInitial}
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {formatAmount(goal.userContribution)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400">
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
                  placeholder="Ej: Viaje a la playa, Fondo de Emergencia..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
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
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <option value="Hogar">Hogar</option>
                    <option value="Viajes & Ocio">Viajes & Ocio</option>
                    <option value="Seguridad">Seguridad</option>
                    <option value="Inversión">Inversión</option>
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
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 font-numeric font-bold"
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
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
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

      {/* Modal: Realizar Abono */}
      {selectedGoal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedGoal(null)}
        >
          <div 
            className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Abonar a Meta
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {selectedGoal.title}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ¿Quién realiza el abono?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayerId(currentUserId)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      activePayerId === currentUserId
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{currentUserName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPayerId(partnerId)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      activePayerId === partnerId
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{partnerName}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Abonar ($ USD)
                </label>
                <input 
                  type="number" 
                  required
                  step="0.01"
                  min="1"
                  placeholder="50.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 font-numeric font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
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
                  <span>Confirmar Abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}