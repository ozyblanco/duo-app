import { useState } from 'react';
import { CheckCircle2, Circle, X, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingChecklistProps {
  isPartnerConnected: boolean;
  hasAccounts: boolean;
  hasGoals: boolean;
  hasTransactions: boolean;
  onOpenNewTransaction: () => void;
  onNavigateTab: (tab: string) => void;
}

export function OnboardingChecklist({
  isPartnerConnected,
  hasAccounts,
  hasGoals,
  hasTransactions,
  onOpenNewTransaction,
  onNavigateTab,
}: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('duo_checklist_dismissed') === 'true';
  });

  const tasks = [
    {
      id: 'profile',
      label: 'Perfil y moneda configurados',
      completed: true,
      action: () => onNavigateTab('profile'),
    },
    {
      id: 'partner',
      label: 'Conectar con tu pareja',
      completed: isPartnerConnected,
      action: () => onNavigateTab('profile'),
    },
    {
      id: 'account',
      label: 'Añadir primera cuenta bancaria',
      completed: hasAccounts,
      action: () => onNavigateTab('accounts'),
    },
    {
      id: 'goal',
      label: 'Definir una meta de ahorro',
      completed: hasGoals,
      action: () => onNavigateTab('goals'),
    },
    {
      id: 'transaction',
      label: 'Registrar su primer gasto compartido',
      completed: hasTransactions,
      action: onOpenNewTransaction,
    },
  ];

  const completedCount = tasks.filter((t) => t.completed).length;
  const isAllComplete = completedCount === tasks.length;

  if (isDismissed || isAllComplete) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('duo_checklist_dismissed', 'true');
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-pink-500/5 border border-indigo-500/20 shadow-xs relative">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
        title="Ocultar checklist"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-blue-500" />
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Configura tu espacio DUO ({completedCount} de {tasks.length})
        </h3>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5">
        Completa estos pasos iniciales para desbloquear el potencial de tus finanzas en pareja.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={task.completed ? undefined : task.action}
            disabled={task.completed}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
              task.completed
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-[#161B22] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500 cursor-pointer shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
              <span className={`text-xs truncate ${task.completed ? 'line-through opacity-70 font-medium' : 'font-bold'}`}>
                {task.label}
              </span>
            </div>
            {!task.completed && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}