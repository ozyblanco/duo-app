import { LayoutDashboard, Wallet, Target, Plus, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewTransaction: () => void;
}

export function BottomNav({ activeTab, onTabChange, onNewTransaction }: BottomNavProps) {
  const getItemClasses = (tabName: string) =>
    activeTab === tabName
      ? 'text-blue-600 dark:text-blue-400 font-bold'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-4 py-2 z-40">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <button 
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${getItemClasses('dashboard')}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        <button 
          onClick={() => onTabChange('accounts')}
          className={`flex flex-col items-center gap-1 transition-colors ${getItemClasses('accounts')}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">Cuentas</span>
        </button>

        <button
          onClick={onNewTransaction}
          className="flex items-center justify-center -mt-6 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all"
          aria-label="Nuevo gasto"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button 
          onClick={() => onTabChange('goals')}
          className={`flex flex-col items-center gap-1 transition-colors ${getItemClasses('goals')}`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px]">Metas</span>
        </button>

        <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${getItemClasses('profile')}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </button>
      </div>
    </div>
  );
}