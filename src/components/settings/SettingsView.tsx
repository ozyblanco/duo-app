import { useState } from 'react';
import { 
  Settings, 
  DollarSign, 
  Download, 
  Trash2, 
  Bell, 
  Check, 
  Database,
  LogOut,
  Tag,
  Plus,
  Pencil,
  AlertTriangle,
  BellRing,
  Send
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useWebPush } from '@/hooks/useWebPush';
import { useNotifications } from '@/hooks/useNotifications';
import { CategoryModal } from '@/components/modals/CategoryModal';
import type { Category } from '@/types';

export function SettingsView() {
  const { currency, setCurrency, formatAmount } = useCurrency();
  const { signOut } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { transactions } = useTransactions();
  const { permission, isSubscribed, loading: pushLoading, requestPermission } = useWebPush();
  const { addNotification } = useNotifications();

  const [saved, setSaved] = useState(false);

  // Estados para Modal de Categorías
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleCurrencyChange = (newCurrency: 'USD' | 'VES') => {
    setCurrency(newCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportData = () => {
    try {
      const exportData: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('duo_') || key.startsWith('sb-'))) {
          exportData[key] = localStorage.getItem(key);
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DUO_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exportando datos:', e);
      alert('Hubo un error al exportar el respaldo.');
    }
  };

  const handleResetData = () => {
    if (confirm('¿Estás seguro de que deseas limpiar los datos locales en caché? (Esto no borrará tus datos en la base de datos de Supabase).')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('duo_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    if (confirm('¿Deseas cerrar tu sesión actual en DUO?')) {
      await signOut();
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"?`)) {
      await deleteCategory(id);
    }
  };

  const handleTestNotification = () => {
    addNotification({
      title: 'Prueba de Notificación Push 🔔',
      message: '¡El sistema de notificaciones en tiempo real está funcionando a la perfección!',
      type: 'system',
    });
  };

  // Cálculo de gastos del mes actual por categoría
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = transactions.filter((tx) => {
    if (tx.categoryId === 'Liquidación' || tx.type === 'income') return false;
    const d = new Date(tx.createdAt || tx.date || 0);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const getSpentForCategory = (cat: Category) => {
    return currentMonthExpenses
      .filter((tx) => tx.categoryId === cat.id || tx.category === cat.name || tx.categoryId === cat.name)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          Configuración General
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Preferencias del sistema, notificaciones push, categorías y presupuestos
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
        {/* Moneda Base */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Moneda Base Visual
            </h3>
            <p className="text-[11px] text-slate-400">
              Selecciona la moneda principal con la que se calcularán y mostrarán tus saldos
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleCurrencyChange('USD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              USD ($)
            </button>
            <button
              type="button"
              onClick={() => handleCurrencyChange('VES')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currency === 'VES'
                  ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              VES (Bs)
            </button>
          </div>
        </div>

        {/* Notificaciones Push Web */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" /> Notificaciones Push del Dispositivo
            </h3>
            <p className="text-[11px] text-slate-400">
              {isSubscribed
                ? 'Las notificaciones están activadas en este dispositivo.'
                : permission === 'denied'
                ? 'Las notificaciones están bloqueadas en tu navegador.'
                : 'Recibe alertas nativas en pantalla cuando tu pareja registre gastos o pagos.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSubscribed ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Enviar notificación de prueba"
                >
                  <Send className="w-3.5 h-3.5 text-blue-500" />
                  <span>Probar</span>
                </button>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" />
                  <span>Activo</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={requestPermission}
                disabled={pushLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>{pushLoading ? 'Activando...' : 'Activar Notificaciones'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Categorías y Presupuestos por Rubro */}
        <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" /> Categorías & Presupuestos
              </h3>
              <p className="text-[11px] text-slate-400">
                Personaliza tus rubros de gasto y define topes mensuales
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Categoría</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {categories.map((cat) => {
              const spent = getSpentForCategory(cat);
              const limit = cat.budgetLimit || 0;
              const hasBudget = limit > 0;
              const percentage = hasBudget ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const isExceeded = hasBudget && spent > limit;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#3B82F6' }}
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                        title="Editar categoría"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {!cat.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {hasBudget ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span className="text-slate-400">
                          Gastado: <strong className="text-slate-700 dark:text-slate-200">{formatAmount(spent)}</strong> de {formatAmount(limit)}
                        </span>
                        <span className={isExceeded ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded ? 'bg-rose-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      {isExceeded && (
                        <span className="text-[9px] font-bold text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Presupuesto excedido
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">Sin presupuesto asignado</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gestión de Datos */}
        <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-500" /> Gestión de Datos Local
          </h3>
          <p className="text-[11px] text-slate-400">
            Exporta tus preferencias o restablece los datos en caché en caso de requerir un reinicio
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar en JSON</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Restablecer Datos Locales</span>
            </button>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sesión
            </h3>
            <p className="text-[11px] text-slate-400">
              Desconecta tu cuenta de forma segura en este dispositivo
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer active:scale-95"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Configuración actualizada correctamente</span>
        </div>
      )}

      {/* Modal para Crear / Editar Categoría */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={async (data) => {
          if (editingCategory) {
            return await updateCategory(editingCategory.id, data);
          } else {
            return await addCategory(data);
          }
        }}
      />
    </div>
  );
}