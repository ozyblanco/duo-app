import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight,
  Target,
  PieChart, 
  Users, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { currentUser, partnerUser } from '@/data/mockData';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { theme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'accounts', label: 'Cuentas & Bancos', icon: Wallet },
    { id: 'transactions', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'goals', label: 'Metas & Ahorro', icon: Target },
    { id: 'analytics', label: 'Análisis Gastos', icon: PieChart },
    { id: 'profile', label: 'Ajustes Pareja', icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] flex flex-col justify-between p-5 h-full select-none transition-colors shrink-0">
      <div className="space-y-6">
        {/* Contenedor del Logo PNG */}
        <div className="px-1 py-1 h-9 flex items-center">
          <img
            src={theme === 'dark' ? '/logos/duologoyisotipoblanco.png' : '/logos/duologoconisotipo.png'}
            alt="DUO Finanzas Compartidas"
            className="h-8 max-w-full object-contain object-left"
          />
        </div>

        {/* Indicador / Selector de Pareja */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#0B0F17] bg-[#3B82F6] text-[10px] flex items-center justify-center font-bold text-white shrink-0">
                {currentUser.name[0]}
              </div>
              <div className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#0B0F17] bg-[#FF6B9D] text-[10px] flex items-center justify-center font-bold text-white shrink-0">
                {partnerUser.name[0]}
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {currentUser.name} & Pareja
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Navegación Principal Expandida */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pie con Configuración y Cerrar Sesión */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
        <button 
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Configuración</span>
        </button>

        <button 
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}