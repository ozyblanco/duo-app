import { ChevronDown } from 'lucide-react';

export function MonthlyAnalytics() {
  // Datos mock para el análisis del mes
  const analyticsData = {
    income: 386.79,
    expenses: 73.60,
    savings: 313.19,
    savingsPercentage: 68,
    categories: [
      { name: 'Comida', amount: 145.20, percentage: 45, color: 'bg-rose-500', barColor: '#F43F5E' },
      { name: 'Hogar', amount: 85.00, percentage: 27, color: 'bg-emerald-500', barColor: '#10B981' },
      { name: 'Servicios', amount: 60.00, percentage: 19, color: 'bg-amber-500', barColor: '#F59E0B' },
      { name: 'Entretenimiento', amount: 30.40, percentage: 9, color: 'bg-indigo-500', barColor: '#6366F1' },
    ],
  };

  // Cálculo para el SVG de Dona
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analyticsData.savingsPercentage / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Tarjeta 1: Resumen del mes */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Resumen del mes
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-2">
          {/* Leyenda Financiera */}
          <div className="space-y-3.5 w-full sm:w-auto text-xs font-semibold">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Ingresos</span>
              </div>
              <span className="text-slate-900 dark:text-slate-100 font-bold font-numeric">
                +${analyticsData.income.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">Gastos</span>
              </div>
              <span className="text-slate-900 dark:text-slate-100 font-bold font-numeric">
                -${analyticsData.expenses.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400">Ahorro</span>
              </div>
              <span className="text-slate-900 dark:text-slate-100 font-bold font-numeric">
                +${analyticsData.savings.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Gráfico de Dona SVG */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Círculo de fondo */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="11"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Círculo de Progreso (Ahorro) */}
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
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Ahorro
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-numeric tracking-tight">
                {analyticsData.savingsPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Gastos por categoría */}
      <div className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Gastos por categoría
          </h2>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg hover:text-slate-900 dark:hover:text-white transition-all">
            <span>Este mes</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3.5 my-auto">
          {analyticsData.categories.map((cat) => (
            <div key={cat.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                  <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-900 dark:text-white font-bold font-numeric">
                    ${cat.amount.toFixed(2)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 w-8 text-right font-numeric">
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
          ))}
        </div>
      </div>
    </div>
  );
}