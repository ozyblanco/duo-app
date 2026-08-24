import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewTransaction: () => void;
  onOpenSettleUp?: () => void;
}

export function AppLayout({
  children,
  activeTab,
  onTabChange,
  onNewTransaction,
  onOpenSettleUp,
}: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-100 font-sans">
      <div className="hidden md:flex shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onNewTransaction={onNewTransaction}
          onOpenSettleUp={onOpenSettleUp}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} onNewTransaction={onNewTransaction} />

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenSettleUp={onOpenSettleUp}
      />
    </div>
  );
}