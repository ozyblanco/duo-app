import { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  Download, 
  Trash2, 
  Bell, 
  Check, 
  Database,
  LogOut
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';

const NOTIF_SETTINGS_KEY = 'duo_notifications_enabled';

export function SettingsView() {
  const { currency, setCurrency } = useCurrency();
  const { signOut } = useAuth();

  const [notifications, setNotifications] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(NOTIF_SETTINGS_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error guardando preferencias de notificaciones:', e);
    }
  }, [notifications]);

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
      const keysToRemove = [];
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

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          Configuración General
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Preferencias del sistema, moneda principal y exportación de respaldos
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

        {/* Alertas */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" /> Alertas y Recordatorios
            </h3>
            <p className="text-[11px] text-slate-400">
              Recibe notificaciones cuando tu pareja registre nuevos gastos o pagos
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              notifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
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
    </div>
  );
}