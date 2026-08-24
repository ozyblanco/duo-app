import React from 'react';
import { ShieldCheck, Heart, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: 'login' | 'register';
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  const isLogin = mode === 'login';

  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Columna Izquierda: Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-5 sm:p-8 lg:p-10 h-full overflow-y-auto lg:overflow-hidden">
        {/* Cabecera / Logo Original DUO */}
        <div className="flex items-center">
          <img
            src="/logos/duologoconisotipo.png"
            alt="DUO - Our Money, Our Goals"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </div>

        {/* Contenido Central (Formulario) */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-2">
          {children}
        </div>

        {/* Footer de Seguridad */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Privado y seguro • Sincronizado en tiempo real</span>
        </div>
      </div>

      {/* Columna Derecha: Ilustración Visual & Branding */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-[#161B22] dark:via-[#1c2331] dark:to-[#161B22] p-8 flex-col justify-between items-center border-l border-slate-200/60 dark:border-slate-800 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-12 right-12 w-64 h-64 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Finanzas en Pareja
          </span>
        </div>

        {/* Ilustración ajustada para adaptarse al alto disponible */}
        <div className="relative w-full max-w-md my-auto flex flex-col items-center flex-1 justify-center max-h-[62vh]">
          <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden shadow-xl border border-white/50 dark:border-slate-700/50 group max-h-[40vh]">
            <img
              src={isLogin ? "/imagenes/DUO_login_illustration.jpg" : "/imagenes/DUO_registro_illustration.jpg"}
              alt="DUO App Preview"
              className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
          </div>

          {/* Copy Promocional */}
          <div className="text-center mt-4 space-y-1 max-w-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              {isLogin ? "Construyan sus sueños juntos" : "El comienzo de algo increíble"}
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isLogin 
                ? "DUO les ayuda a tomar el control de sus finanzas, ahorrar para sus metas y crecer como pareja."
                : "Administren su dinero, ahorren para sus metas y vivan la vida que sueñan juntos."
              }
            </p>
          </div>
        </div>

        {/* Badges al Pie */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-md pt-2">
          {isLogin ? (
            <>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Finanzas claras</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-xs">
                <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>Metas en pareja</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Futuro juntos</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-xs">
                <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>Solo ustedes dos</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Sincronizados</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}