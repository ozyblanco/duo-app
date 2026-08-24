import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { AppLayout } from './components/layout/AppLayout';
import { BalanceOverview } from './components/dashboard/BalanceOverview';
import { MonthlyAnalytics } from './components/dashboard/MonthlyAnalytics';
import { TransactionList } from './components/dashboard/TransactionList';
import { NewTransactionModal } from './components/modals/NewTransactionModal';
import { SettleUpModal } from './components/modals/SettleUpModal';
import { MonthEndBanner } from './components/common/MonthEndBanner';
import { AccountsView } from './components/accounts/AccountsView';
import { GoalsView } from './components/goals/GoalsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { RatesWidget } from './components/currency/RatesWidget';
import { AuthView } from './components/auth/AuthView';
import { PartnerConnectView } from './components/auth/PartnerConnectView';
import { currentUser } from './data/mockData';
import type { SplitRatio } from './types';

export default function App() {
  const { user, loading } = useAuth();
  const { transactions, addTransaction } = useTransactions();
  
  // Estado local para vincular pareja
  const [isPartnerConnected, setIsPartnerConnected] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Totales generales
  const totalJointSpent = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const userPaidTotal = transactions
    .filter((tx) => tx.paidByUserId === currentUser.id)
    .reduce((acc, curr) => acc + curr.amount, 0);
  const partnerPaidTotal = totalJointSpent - userPaidTotal;

  // Cálculo de Balance Neto de Deudas entre la pareja
  const netBalance = transactions.reduce((acc, tx) => {
    if (tx.categoryId === 'Liquidación') return acc;

    const isUserPayer = tx.paidByUserId === currentUser.id;
    const split = tx.splitRatio || { userA: 50, userB: 50 };

    if (isUserPayer) {
      return acc + (tx.amount * split.userB) / 100;
    } else {
      return acc - (tx.amount * split.userA) / 100;
    }
  }, 0);

  // Registrar Gasto con Fecha y Hora exacta
  const handleAddTransaction = (data: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    accountId?: string;
    currency?: string;
    splitRatio?: SplitRatio;
    createdAt?: string;
  }) => {
    addTransaction({
      title: data.title,
      amount: data.amount,
      currency: data.currency || 'USD',
      type: 'expense',
      ownership: 'joint',
      paidByUserId: data.paidByUserId,
      categoryId: data.category,
      accountId: data.accountId || 'acc_1',
      splitRatio: data.splitRatio || { userA: 50, userB: 50 },
      createdAt: data.createdAt || new Date().toISOString(),
    });
  };

  // Registrar Liquidación ("Saldar Cuentas")
  const handleSettleUp = (settlementData: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    createdAt: string;
  }) => {
    addTransaction({
      title: settlementData.title,
      amount: settlementData.amount,
      currency: 'USD',
      type: 'expense',
      ownership: 'joint',
      paidByUserId: settlementData.paidByUserId,
      categoryId: settlementData.category,
      accountId: 'acc_1',
      splitRatio: { userA: 50, userB: 50 },
      createdAt: settlementData.createdAt,
    });
  };

  // PANTALLA DE CARGA: Espera a verificar si hay una sesión activa en Supabase
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1117]">
        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-xs font-semibold">Cargando DUO...</span>
        </div>
      </div>
    );
  }

  // PASO 1: Si no hay usuario autenticado en Supabase
  if (!user) {
    return <AuthView />;
  }

  // PASO 2: Si está autenticado pero no vinculado con su pareja
  const rawUser = user as unknown as { partnerId?: string; partner_id?: string };
  const hasPartner = isPartnerConnected || Boolean(rawUser.partnerId) || Boolean(rawUser.partner_id);

  if (!hasPartner) {
    return (
      <PartnerConnectView 
        onComplete={() => setIsPartnerConnected(true)} 
      />
    );
  }

  // PASO 3: Vista principal del Dashboard cuando el usuario ya se autenticó y vinculó
  return (
    <AppLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onNewTransaction={() => setIsModalOpen(true)}
      onOpenSettleUp={() => setIsSettleModalOpen(true)}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <MonthEndBanner 
            netBalance={netBalance} 
            onOpenSettleModal={() => setIsSettleModalOpen(true)} 
          />

          <BalanceOverview 
            totalJointSpent={totalJointSpent}
            userPaidTotal={userPaidTotal}
            partnerPaidTotal={partnerPaidTotal}
          />
          <RatesWidget />
          <TransactionList transactions={transactions} />
          <MonthlyAnalytics />
        </div>
      )}

      {activeTab === 'accounts' && <AccountsView />}

      {activeTab === 'transactions' && (
        <TransactionsView 
          transactions={transactions} 
          onNewTransaction={() => setIsModalOpen(true)} 
        />
      )}

      {activeTab === 'goals' && <GoalsView />}

      {activeTab === 'analytics' && <AnalyticsView transactions={transactions} />}

      {activeTab === 'profile' && <ProfileView />}

      {activeTab === 'settings' && <SettingsView />}

      {/* Modal Nuevo Gasto */}
      <NewTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

      {/* Modal Saldar Cuentas */}
      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        netBalance={netBalance}
        onSettle={handleSettleUp}
      />
    </AppLayout>
  );
}