import { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, PiggyBank, ShoppingBag } from 'lucide-react';
import type { Transaction } from '@/types';
import { mockCategories } from '@/data/mockData';
import { useCurrency } from '@/hooks/useCurrency';

interface MonthlyAnalyticsProps {
  transactions: Transaction[];
}

type PeriodFilter = 'this_month' | 'last_month' | 'all';

const CATEGORY_COLORS: Record<string, { color: string; barColor: string }> = {
  Comida: { color: 'bg-rose-500', barColor: '#F43F5E' },
  Hogar: { color: 'bg-emerald-500', barColor: '#10B981' },
  Servicios: { color: 'bg-amber-500', barColor: '#F59E0B' },
  Entretenimiento: { color: 'bg-indigo-500', barColor: '#6366F1' },
  Salud: { color: 'bg-teal-500', barColor: '#14B8A6' },
  Transporte: { color: 'bg-sky-500', barColor: '#0EA5E9' },
  General: { color: 'bg-purple-500', barColor: '#A855F7' },
  Otros: { color: 'bg-slate-500', barColor: '#64748B' },
};

function getCategoryName(categoryId?: string) {
  if (!categoryId) return 'Otros';
  const cat = mockCategories.find((c) => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

export function MonthlyAnalytics({ transactions }: MonthlyAnalyticsProps) {
  const { formatAmount } = useCurrency();
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 1. Filtrar transacciones según el período seleccionado
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter((tx) => {
      if (tx.categoryId === 'Liquidación' || tx.type === 'income') return false;

      const txDate = tx.createdAt || tx.date ? new Date(tx.createdAt || tx.date!) : new Date();

      if (period === 'this_month') {
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      }

      if (period === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
      }

      return true;
    });
  }, [transactions, period]);

  // 2. Gastos Totales del período
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  // 3. Ingresos / Presupuesto base y Ahorro calculado
  const { income, savings, savingsPercentage } = useMemo(() => {
    let monthlyBudget = 500;
    try {
      const saved = localStorage.getItem('duo_couple_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number(parsed.budget) > 0) {
          monthlyBudget = Number(parsed.budget);
        }
      }
    } catch {
      monthlyBudget = 500;
    }

    const calculatedIncome = monthlyBudget;
    const calculatedSavings = Math.max(0, calculatedIncome - totalExpenses);
    const calculatedPercentage =
      calculatedIncome > 0
        ? Math.max(0, Math.min(100, Math.round((calculatedSavings / calculatedIncome) * 100)))
        : 0;

    return {
      income: calculatedIncome,
      savings: calculatedSavings,
      savingsPercentage: calculatedPercentage,
    };
  }, [totalExpenses]);

  // 4. Desglose de Gastos por Categoría
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredExpenses.forEach((tx) => {
      const name = getCategoryName(tx.categoryId);
      map.set(name, (map.get(name) || 0) + tx.amount);
    });

    return Array.from(map.entries())
      .map(([name, amount]) => {
        const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
        const styling = CATEGORY_COLORS[name] || CATEGORY_COLORS['Otros'];
        return {
          name,
          amount,
          percentage,
          color: styling.color,
          barColor: styling.barColor,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);

  // 5. Cálculo para el gráfico SVG de Dona
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (savingsPercentage / 100) * circumference;

  const periodLabel =
    period === 'this_month' ? 'Este mes' : period === 'last_month' ? 'Mes anterior' : 'Todo';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Tarjeta 1: Resumen del mes */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Resumen del mes
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Presupuesto: {formatAmount(income)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-2">
          {/* Leyenda Financiera */}
          <div className="space-y-3.5 w-full sm:w-auto text-xs font-semibold">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Base / Ingresos
                </span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-numeric">
                +{formatAmount(income)}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Gastos Reales
                </span>
              </div>
              <span className="text-rose-500 dark:text-rose-400 font-bold font-numeric">
                -{formatAmount(totalExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400">Margen Ahorro</span>
              </div>
              <span className="text-blue-500 dark:text-blue-400 font-bold font-numeric">
                +{formatAmount(savings)}
              </span>
            </div>
          </div>

          {/* Gráfico de Dona SVG */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="11"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-slate-400 font-medium">Ahorro</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-numeric tracking-tight">
                {savingsPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Gastos por categoría */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 relative">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Gastos por categoría
          </h2>

          {/* Selector de Período */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <span>{periodLabel}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('this_month');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    period === 'this_month' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Este mes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('last_month');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    period === 'last_month' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Mes anterior
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('all');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    period === 'all' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Todo
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3.5 my-auto">
          {categoryBreakdown.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
              <ShoppingBag className="w-5 h-5 opacity-40" />
              <span>Sin gastos en este período</span>
            </div>
          ) : (
            categoryBreakdown.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 dark:text-white font-bold font-numeric">
                      {formatAmount(cat.amount)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 w-8 text-right font-numeric font-bold">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
                {/* Barra de Proporción */}
                <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.barColor,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}