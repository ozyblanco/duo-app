import { Menu, Plus, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { LiveClockWidget } from '@/components/widgets/LiveClockWidget';

interface HeaderProps {
  onNewTransaction: () => void;
  onOpenSettleUp?: () => void;
  onOpenMobileMenu?: () => void;
  pageTitle?: string;
}

export function Header({
  onNewTransaction,
  onOpenSettleUp,
  onOpenMobileMenu,
  pageTitle = 'Dashboard',
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F17]/80 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between transition-colors">
      {/* Lado Izquierdo */}
      <div className="flex items-center gap-3">
        {/* Botón Hamburguesa en Móvil */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo Móvil */}
        <div className="md:hidden flex items-center">
          <img
            src={theme === 'dark' ? '/logos/duologoyisotipoblanco.png' : '/logos/duologoconisotipo.png'}
            alt="DUO"
            className="h-6 w-auto object-contain"
          />
        </div>

        {/* Título en Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Reloj en Desktop */}
        <div className="hidden sm:block ml-2">
          <LiveClockWidget />
        </div>
      </div>

      {/* Lado Derecho */}
      <div className="flex items-center gap-2">
        {/* Saldar Cuentas (Desktop) */}
        {onOpenSettleUp && (
          <button
            onClick={onOpenSettleUp}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
            title="Saldar Cuentas"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Saldar Cuentas</span>
          </button>
        )}

        {/* Toggle Theme (Desktop) */}
        <button
          onClick={toggleTheme}
          className="hidden sm:flex p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          title="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notificaciones */}
        <NotificationsPopover />

        {/* Botón "+ Nuevo Gasto" */}
        <button
          onClick={onNewTransaction}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold px-3 py-2 md:px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Nuevo Gasto</span>
        </button>
      </div>
    </header>
  );
}