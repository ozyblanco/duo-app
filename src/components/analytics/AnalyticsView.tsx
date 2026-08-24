import { useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart2, 
  Award,
  ShoppingBag,
  CalendarDays
} from 'lucide-react';
import type { Transaction } from '@/types';
import { currentUser, partnerUser, mockCategories } from '@/data/mockData';

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export function AnalyticsView({ transactions }: AnalyticsViewProps) {
  // Función para obtener el nombre real de la categoría
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Otros';
    const cat = mockCategories.find((c) => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  // Filtrar únicamente gastos reales (excluyendo liquidaciones de saldo) sin usar explicit 'any'
  const expenseTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txCategory = (tx as { category?: string }).category;
      const catVal = tx.categoryId || txCategory;
      return catVal !== 'Liquidación' && txCategory !== 'Liquidación';
    });
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenseTransactions]);

  const userTotal = useMemo(() => {
    return expenseTransactions
      .filter((t) => t.paidByUserId === currentUser.id)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [expenseTransactions]);

  const partnerTotal = totalSpent - userTotal;

  const categoryStats = useMemo(() => {
    const map = new Map<string, { categoryName: string; total: number; userPaid: number; partnerPaid: number; count: number }>();

    expenseTransactions.forEach((tx) => {
      const catId = tx.categoryId || 'otros';
      const categoryName = getCategoryName(tx.categoryId);
      const existing = map.get(catId) || { categoryName, total: 0, userPaid: 0, partnerPaid: 0, count: 0 };
      const isUser = tx.paidByUserId === currentUser.id;

      map.set(catId, {
        categoryName,
        total: existing.total + tx.amount,
        userPaid: existing.userPaid + (isUser ? tx.amount : 0),
        partnerPaid: existing.partnerPaid + (!isUser ? tx.amount : 0),
        count: existing.count + 1,
      });
    });

    return Array.from(map.entries())
      .map(([catId, data]) => ({
        catId,
        ...data,
        percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenseTransactions, totalSpent]);

  const topCategory = categoryStats[0] || { categoryName: 'Ninguna', total: 0 };
  const dailyAverage = (totalSpent / 30).toFixed(2);

  const userPercentage = totalSpent > 0 ? Math.round((userTotal / totalSpent) * 100) : 50;
  const partnerPercentage = 100 - userPercentage;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Análisis de Gastos & Reportes
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Visualiza los patrones de consumo de la pareja y distribuciones por categoría
        </p>
      </div>

      {/* Cards Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Gasto Total Acumulado</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            ${totalSpent.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
          </p>
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Basado en {expenseTransactions.length} registros
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Promedio Diario</span>
            <CalendarDays className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            ${dailyAverage} <span className="text-xs font-normal text-slate-400">/ día</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Proyección para el mes actual
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Categoría Mayoritaria</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {topCategory.categoryName}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold">
            ${topCategory.total.toFixed(2)} USD ({categoryStats[0]?.percentage || 0}% del total)
          </span>
        </div>
      </div>

      {/* Distribución de Aportes */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Distribución de Aportes Reales
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">División activa 50/50</span>
        </div>

        <div className="space-y-2">
          <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5">
            <div 
              className="h-full bg-blue-500 rounded-l-full transition-all duration-500"
              style={{ width: `${userPercentage}%` }}
              title={`${currentUser.name}: ${userPercentage}%`}
            />
            <div 
              className="h-full bg-pink-500 rounded-r-full transition-all duration-500"
              style={{ width: `${partnerPercentage}%` }}
              title={`${partnerUser.name}: ${partnerPercentage}%`}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
              <span className="text-slate-400">(${userTotal.toFixed(2)} USD • {userPercentage}%)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">(${partnerTotal.toFixed(2)} USD • {partnerPercentage}%)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{partnerUser.name}</span>
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista por Categoría */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            Gastos por Categoría
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {categoryStats.length} categorías registradas
          </span>
        </div>

        <div className="space-y-4">
          {categoryStats.map((item) => (
            <div key={item.catId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-bold">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                  {item.categoryName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{item.count} transacciones</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">
                    ${item.total.toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>{item.percentage}% del presupuesto total</span>
                <div className="flex items-center gap-3">
                  <span>{currentUser.name}: ${item.userPaid.toFixed(2)}</span>
                  <span>•</span>
                  <span>{partnerUser.name}: ${item.partnerPaid.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}