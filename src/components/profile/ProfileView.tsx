import { useState } from 'react';
import { 
  ShieldCheck, 
  Percent, 
  Heart, 
  Sparkles, 
  Save, 
  DollarSign,
  Check,
  Loader2,
  Copy
} from 'lucide-react';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';

const SETTINGS_STORAGE_KEY = 'duo_couple_settings';

export function ProfileView() {
  const { currentUser, partner, coupleCode, loading } = useCoupleProfiles();

  const [splitRatio, setSplitRatio] = useState(() => {
    if (typeof window === 'undefined') return '50/50';
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? (JSON.parse(saved).ratio || '50/50') : '50/50';
    } catch {
      return '50/50';
    }
  });

  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    if (typeof window === 'undefined') return '1500';
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? (JSON.parse(saved).budget || '1500') : '1500';
    } catch {
      return '1500';
    }
  });

  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ratio: splitRatio, budget: monthlyBudget })
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Error al guardar configuración:', e);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(coupleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myInitial = currentUser?.name ? currentUser.name[0].toUpperCase() : 'U';
  const partnerInitial = partner?.name ? partner.name[0].toUpperCase() : 'P';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500/20" />
          Ajustes de Pareja
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configura las reglas de división de gastos y la sincronización entre ambos perfiles
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-pink-500/10 to-transparent border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            Cargando perfiles de la pareja...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 items-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-white dark:border-[#161B22] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                  {myInitial}
                </div>
                <div className="w-12 h-12 rounded-full bg-pink-600 border-2 border-white dark:border-[#161B22] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                  {partnerInitial}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {currentUser?.name || 'Tú'} & {partner?.name || 'Tu Pareja'}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Vinculados
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sincronización activa en tiempo real • Código de pareja:{' '}
                  <code className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {coupleCode}
                  </code>
                </p>
              </div>
            </div>

            <button
              onClick={copyCodeToClipboard}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all self-start sm:self-auto active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? '¡Código Copiado!' : 'Copiar Código'}</span>
            </button>
          </>
        )}
      </div>

      <form onSubmit={handleSave} className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Percent className="w-4 h-4 text-blue-500" /> Reglas Financieras de la Pareja
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Regla de División Predeterminada
            </label>
            <p className="text-[11px] text-slate-400">
              Porcentaje aplicado por defecto al registrar un nuevo gasto compartido
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['50/50', '60/40', 'Proporcional'].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setSplitRatio(option)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    splitRatio === option
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Límite de Presupuesto Conjunto (Mensual)
            </label>
            <p className="text-[11px] text-slate-400">
              Monto máximo recomendado para controlar gastos mensuales compartidos
            </p>
            <div className="relative pt-1">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full pl-9 pr-12 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400 font-bold absolute right-3.5 top-1/2 -translate-y-1/2">
                USD
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Los cambios se guardarán y sincronizarán
          </span>

          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? '¡Guardado!' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}