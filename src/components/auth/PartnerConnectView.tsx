import { useState, useEffect } from 'react';
import { 
  Users, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2, 
  ArrowRight, 
  Sparkles, 
  Heart, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Ajusta la ruta a tu cliente de Supabase si varía

interface PartnerConnectViewProps {
  onComplete: (partnerData: { partnerName: string; pairCode: string }) => void;
}

const generatePairCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DUO-${result}`;
};

export function PartnerConnectView({ onComplete }: PartnerConnectViewProps) {
  const [step, setStep] = useState<'select' | 'create' | 'join' | 'success'>('select');
  const [myCode, setMyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedPartner, setConnectedPartner] = useState('Tu Pareja');

  // 1. Crear Espacio en Supabase
  const handleSelectCreate = async () => {
    setLoading(true);
    setError(null);
    const code = generatePairCode();
    setMyCode(code);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      // Crear pareja en tabla couples
      const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .insert({ pair_code: code })
        .select()
        .single();

      if (coupleErr) throw coupleErr;

      // Vincular el couple_id al perfil del creador
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      setCoupleId(couple.id);
      setStep('create');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el espacio.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Escuchar en Tiempo Real cuando la pareja ingrese el código
  useEffect(() => {
    if (step !== 'create' || !coupleId) return;

    const checkPartnerJoined = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('couple_id', coupleId)
        .neq('id', user.id)
        .maybeSingle();

      if (data) {
        setConnectedPartner(data.full_name || 'Tu Pareja');
        setStep('success');
      }
    };

    // Consulta periódica (Polling fallback) cada 2.5 segundos
    const interval = setInterval(checkPartnerJoined, 2500);

    // Suscripción Realtime
    const channel = supabase
      .channel(`couple-join-${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `couple_id=eq.${coupleId}` },
        () => checkPartnerJoined()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [step, coupleId]);

  // 3. Unirse mediante código ingresado
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formattedInput = inputCode.trim().toUpperCase();

    if (!formattedInput) {
      setError('Por favor ingresa el código de invitación.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      // Buscar el código en couples
      const { data: couple, error: coupleErr } = await supabase
        .from('couples')
        .select('id')
        .eq('pair_code', formattedInput)
        .single();

      if (coupleErr || !couple) {
        throw new Error('El código ingresado no existe o es incorrecto.');
      }

      // Actualizar el perfil actual con el couple_id
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      // Obtener el nombre de la pareja (el creador)
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('couple_id', couple.id)
        .neq('id', user.id)
        .maybeSingle();

      setConnectedPartner(partnerProfile?.full_name || 'Tu Pareja');
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo vincular la cuenta.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Únete a mi espacio en DUO para gestionar nuestras finanzas juntos 💗. Mi código de invitación es: ${myCode}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleFinish = () => {
    onComplete({
      partnerName: connectedPartner,
      pairCode: myCode || inputCode,
    });
  };

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 font-sans overflow-hidden items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex items-center justify-between mb-6">
          <img
            src="/logos/duologoconisotipo.png"
            alt="DUO"
            className="h-8 w-auto object-contain"
          />
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-900/60">
            <Sparkles className="w-3 h-3" /> Paso 2 de 2
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PASO 1: SELECCIÓN */}
        {step === 'select' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ¡Cuenta creada con éxito! 🎉
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Para comenzar a gestionar finanzas juntos, conecta tu cuenta con la de tu pareja.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSelectCreate}
                disabled={loading}
                className="w-full p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-[#0D1117]/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer group flex items-start gap-3.5 disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Crear nuevo espacio de pareja
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Genera un código único e invítala a unirse a ti.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('join')}
                className="w-full p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 hover:border-pink-500 dark:hover:border-pink-500 bg-slate-50/50 dark:bg-[#0D1117]/50 hover:bg-pink-50/30 dark:hover:bg-pink-950/20 text-left transition-all cursor-pointer group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    Tengo un código de invitación
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Mi pareja ya se registró y me dio su código.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASO 2A: CÓDIGO GENERADO */}
        {step === 'create' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Tu Código de Invitación 🔑
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comparte este código con tu pareja para vincular sus cuentas.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-pink-500/10 border border-indigo-500/20 text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                CÓDIGO ÚNICO
              </span>
              <div className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 select-all">
                {myCode}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1117] text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Esperando a que tu pareja ingrese el código...</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('select')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer pt-1"
            >
              Volver atrás
            </button>
          </div>
        )}

        {/* PASO 2B: INGRESAR CÓDIGO */}
        {step === 'join' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Ingresa el Código 🔗
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Escribe el código que te compartió tu pareja.
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Código de la Pareja
                </label>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Ej: DUO-8K9P2X"
                  maxLength={10}
                  required
                  className="w-full text-center py-3 text-lg font-black tracking-widest rounded-xl bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white uppercase placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando vínculo...</span>
                  </>
                ) : (
                  <>
                    <span>Vincular Cuentas</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setStep('select')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer pt-1"
            >
              Volver atrás
            </button>
          </div>
        )}

        {/* PASO 3: ÉXITO */}
        {step === 'success' && (
          <div className="text-center space-y-5 animate-in zoom-in-95 duration-300 py-2">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-pink-500 p-1 shadow-xl">
                <div className="w-full h-full bg-white dark:bg-[#161B22] rounded-full flex items-center justify-center">
                  <Heart className="w-9 h-9 text-pink-500 fill-pink-500 animate-bounce" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ¡Conexión Exitosa! 💕
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Ahora estás conectado con <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{connectedPartner}</strong>. Todos sus gastos y metas se sincronizarán en tiempo real.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Ir al Dashboard DUO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}