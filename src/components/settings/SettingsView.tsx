import { useState } from 'react';
import { 
  Settings, 
  DollarSign, 
  Download, 
  Trash2, 
  Bell, 
  Check, 
  Database
} from 'lucide-react';

export function SettingsView() {
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Moneda Base Visual
            </h3>
            <p className="text-[11px] text-slate-400">
              Selecciona la moneda principal con la que se calcularán tus saldos
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currency === 'USD'
                  ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('VES')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currency === 'VES'
                  ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              VES (Bs)
            </button>
          </div>
        </div>

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
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
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

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-500" /> Gestión de Datos Local
          </h3>
          <p className="text-[11px] text-slate-400">
            Exporta tus movimientos o restablece los datos en caso de requerir un reinicio
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar en JSON</span>
            </button>

            <button
              onClick={() => alert('Para reiniciar datos limpia el LocalStorage de tu navegador.')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Restablecer Datos Local</span>
            </button>
          </div>
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