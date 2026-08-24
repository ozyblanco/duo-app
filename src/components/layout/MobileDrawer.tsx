import {
  X,
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  Target,
  User,
  Settings,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { currentUser, partnerUser } from '@/data/mockData';
import { useTheme } from '@/hooks/useTheme';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettleUp?: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onOpenSettleUp,
}: MobileDrawerProps) {
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'transactions', label: 'Movimientos', icon: Receipt },
    { id: 'accounts', label: 'Cuentas', icon: Wallet },
    { id: 'analytics', label: 'Análisis', icon: BarChart3 },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Fondo sombreado */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Menú Lateral */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white dark:bg-[#0D1117] border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xl z-10">
        <div className="space-y-6">
          {/* Cabecera Drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <img
              src={theme === 'dark' ? '/logos/duologoyisotipoblanco.png' : '/logos/duologoconisotipo.png'}
              alt="DUO"
              className="h-7 w-auto object-contain"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Indicador Pareja */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                <div className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#0B0F17] bg-[#3B82F6] text-xs flex items-center justify-center font-bold text-white">
                  {currentUser.name[0]}
                </div>
                <div className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#0B0F17] bg-[#FF6B9D] text-xs flex items-center justify-center font-bold text-white">
                  {partnerUser.name[0]}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {currentUser.name.split(' ')[0]} & {partnerUser.name.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Opciones de Navegación Completa */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#3B82F6] text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Acciones del Fondo */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {onOpenSettleUp && (
            <button
              onClick={() => {
                onClose();
                onOpenSettleUp();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Saldar Cuentas</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            <span>Tema {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}