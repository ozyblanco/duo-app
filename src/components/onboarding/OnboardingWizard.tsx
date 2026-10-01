import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Heart, 
  Users, 
  Wallet, 
  Target, 
  ArrowRight, 
  Check, 
  Copy, 
  Share2, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useGoals } from '@/hooks/useGoals';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  isPartnerConnected: boolean;
  hasAccounts: boolean;
  hasGoals: boolean;
  onPartnerConnected: () => void;
}

const generatePairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DUO-${result}`;
};

export function OnboardingWizard({
  isOpen,
  onClose,
  isPartnerConnected,
  hasAccounts,
  hasGoals,
  onPartnerConnected,
}: OnboardingWizardProps) {
  const { user } = useAuth();
  const { currentUser } = useCoupleProfiles();
  const { currency, setCurrency } = useCurrency();
  const { addGoal } = useGoals();

  // Paso actual (1: Bienvenida, 2: Perfil, 3: Pareja, 4: Cuenta, 5: Meta, 6: Éxito)
  const [step, setStep] = useState<number>(1);

  // Estados Paso 2: Perfil
  const [fullName, setFullName] = useState(currentUser?.name || '');

  // Estados Paso 3: Pareja
  const [pairMode, setPairMode] = useState<'create' | 'join'>('create');
  const [myCode, setMyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  // Estados Paso 4: Primera Cuenta
  const [accountName, setAccountName] = useState('Efectivo');
  const [accountType, setAccountType] = useState('cash');
  const [accountBalance, setAccountBalance] = useState('100');
  const [accountLoading, setAccountLoading] = useState(false);

  // Estados Paso 5: Primera Meta
  const [goalTitle, setGoalTitle] = useState('Fondo de Emergencia');
  const [goalTarget, setGoalTarget] = useState('500');
  const [goalLoading, setGoalLoading] = useState(false);

  if (!isOpen) return null;

  // Generar código de pareja
  const handleGenerateCode = async () => {
    if (myCode) return;
    setPartnerLoading(true);
    setPartnerError(null);
    const code = generatePairCode();
    setMyCode(code);

    try {
      if (!user) throw new Error('Usuario no autenticado.');

      const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .insert({ pair_code: code })
        .select()
        .single();

      if (coupleErr) throw coupleErr;

      await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', user.id);

      onPartnerConnected();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creando código.';
      setPartnerError(msg);
    } finally {
      setPartnerLoading(false);
    }
  };

  // Unirse con código existente
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = inputCode.trim().toUpperCase();
    if (!formatted) return;

    setPartnerLoading(true);
    setPartnerError(null);

    try {
      if (!user) throw new Error('Usuario no autenticado.');

      const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .select('id')
        .eq('pair_code', formatted)
        .single();

      if (coupleErr || !couple) {
        throw new Error('El código ingresado no existe o es incorrecto.');
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      onPartnerConnected();
      goToNextStep();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al vincular pareja.';
      setPartnerError(msg);
    } finally {
      setPartnerLoading(false);
    }
  };

  // Guardar Perfil (Paso 2)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !user) return;

    try {
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
    } catch (e) {
      console.error('Error guardando perfil:', e);
    }

    goToNextStep();
  };

  // Crear Primera Cuenta (Paso 4)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !user) return;

    try {
      setAccountLoading(true);
      const balance = parseFloat(accountBalance) || 0;

      await supabase.from('accounts').insert({
        user_id: user.id,
        name: accountName.trim(),
        type: accountType,
        balance,
        currency,
        color: '#3B82F6',
      });

      goToNextStep();
    } catch (err) {
      console.error('Error creando cuenta inicial:', err);
      goToNextStep();
    } finally {
      setAccountLoading(false);
    }
  };

  // Crear Primera Meta (Paso 5)
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget) || 0;
    if (!goalTitle.trim() || target <= 0) return;

    try {
      setGoalLoading(true);
      await addGoal({
        title: goalTitle.trim(),
        category: 'Ahorro',
        targetAmount: target,
      });
      goToNextStep();
    } catch (err) {
      console.error('Error creando meta inicial:', err);
      goToNextStep();
    } finally {
      setGoalLoading(false);
    }
  };

  // Navegación inteligente (Salto automático de pasos completados)
  const goToNextStep = () => {
    let next = step + 1;

    // Si ya tiene pareja vinculada, saltar paso 3
    if (next === 3 && isPartnerConnected) next++;
    // Si ya tiene cuentas, saltar paso 4
    if (next === 4 && hasAccounts) next++;
    // Si ya tiene metas, saltar paso 5
    if (next === 5 && hasGoals) next++;

    if (next > 5) {
      setStep(6); // Pantalla de éxito
    } else {
      setStep(next);
      if (next === 3 && !isPartnerConnected && pairMode === 'create') {
        handleGenerateCode();
      }
    }
  };

  const handleFinish = () => {
    if (user) {
      localStorage.setItem(`duo_onboarding_completed_${user.id}`, 'true');
    }
    onClose();
  };

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`duo_onboarding_completed_${user.id}`, 'true');
    }
    onClose();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Únete a mi espacio en DUO para gestionar nuestras finanzas juntos 💗. Mi código es: ${myCode}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const progressPercentage = Math.min(Math.round(((step - 1) / 5) * 100), 100);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior con Progreso y Omitir */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {step < 6 ? `Paso ${step} de 5` : 'Completado'}
            </span>
          </div>

          {step < 6 && (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Omitir por ahora
            </button>
          )}
        </div>

        {/* Barra de progreso */}
        {step < 6 && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-pink-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="p-6">
          {/* PASO 1: BIENVENIDA */}
          {step === 1 && (
            <div className="space-y-6 text-center py-2 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-pink-500 mx-auto flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Bienvenido a DUO ❤️
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Tu espacio privado para organizar y coordinar las finanzas en pareja de forma simple, justa y transparente.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">En Pareja</p>
                  <p className="text-[9px] text-slate-400">Gastos 50/50 o individuales</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Multimoneda</p>
                  <p className="text-[9px] text-slate-400">USD & Tasas en Bolívares</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <Target className="w-4 h-4 text-pink-500" />
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Metas</p>
                  <p className="text-[9px] text-slate-400">Ahorren juntos para proyectos</p>
                </div>
              </div>

              <button
                type="button"
                onClick={goToNextStep}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Comenzar Configuración</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PASO 2: PERFIL & MONEDA */}
          {step === 2 && (
            <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Personaliza tu Perfil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ¿Cómo te llamará tu pareja dentro de la app?
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tu Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Ozy, Ale, Juan..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Moneda Principal Visual
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currency === 'USD'
                          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs">Dólares ($ USD)</div>
                      <div className="text-[10px] text-slate-400">Referencia estándar</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('VES')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currency === 'VES'
                          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs">Bolívares (Bs VES)</div>
                      <div className="text-[10px] text-slate-400">Tasas BCV y Binance</div>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!fullName.trim()}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* PASO 3: CONECTAR PAREJA */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  Conecta con tu Pareja
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Vinculen sus cuentas para ver los mismos gastos en tiempo real.
                </p>
              </div>

              {partnerError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{partnerError}</span>
                </div>
              )}

              {/* Selector de modo */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setPairMode('create');
                    handleGenerateCode();
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    pairMode === 'create'
                      ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Generar Código
                </button>
                <button
                  type="button"
                  onClick={() => setPairMode('join')}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    pairMode === 'join'
                      ? 'bg-white dark:bg-[#161B22] text-pink-600 dark:text-pink-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tengo un Código
                </button>
              </div>

              {pairMode === 'create' ? (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-pink-500/10 border border-indigo-500/20 text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      TU CÓDIGO DE INVITACIÓN
                    </span>
                    <div className="text-xl font-black text-slate-900 dark:text-white tracking-widest">
                      {partnerLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /> : myCode || 'Generando...'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={copyCode}
                      disabled={!myCode}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={shareWhatsApp}
                      disabled={!myCode}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Listo, continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleJoinWithCode} className="space-y-3 pt-1">
                  <input
                    type="text"
                    required
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Ej. DUO-8K9P2X"
                    maxLength={10}
                    className="w-full py-2.5 text-center text-sm font-black tracking-widest rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  />
                  <button
                    type="submit"
                    disabled={partnerLoading || !inputCode.trim()}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-pink-500 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {partnerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Vincular Cuentas</span>}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PASO 4: PRIMERA CUENTA */}
          {step === 4 && (
            <form onSubmit={handleCreateAccount} className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  Añade tu Primera Cuenta
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ¿Desde dónde realizarás tus pagos cotidianos?
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Cuenta o Método
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ej. Efectivo, Banesco, Zelle, Billetera..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="bank">Banco / Débito</option>
                      <option value="digital">Digital (Zelle / PayPal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Saldo Inicial ({currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-numeric font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-1/2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Omitir paso
                </button>
                <button
                  type="submit"
                  disabled={accountLoading || !accountName.trim()}
                  className="w-1/2 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {accountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Guardar</span>}
                </button>
              </div>
            </form>
          )}

          {/* PASO 5: PRIMERA META */}
          {step === 5 && (
            <form onSubmit={handleCreateGoal} className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  Define su Primera Meta
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Un objetivo conjunto para motivarse a ahorrar.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Objetivo
                  </label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Ej. Viaje juntos, Fondo de Emergencia..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Objetivo ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="500.00"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-numeric font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-1/2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Omitir meta
                </button>
                <button
                  type="submit"
                  disabled={goalLoading || !goalTitle.trim()}
                  className="w-1/2 py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {goalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Crear Meta</span>}
                </button>
              </div>
            </form>
          )}

          {/* PASO 6: FINALIZADO */}
          {step === 6 && (
            <div className="space-y-5 text-center py-2 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  ¡Todo Listo! 🎉
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Tu espacio en DUO está configurado y listo para registrar sus primeros movimientos en conjunto.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 active:scale-98 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Ir a mi Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}