import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useCoupleProfiles } from './hooks/useCoupleProfiles';
import { NotificationProvider } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { useNotifications } from './hooks/useNotifications';
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
import type { SplitRatio } from './types';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, addTransaction } = useTransactions();
  const { currentUser, partner, loading: profilesLoading } = useCoupleProfiles();
  const { addNotification } = useNotifications();

  const [isPartnerConnected, setIsPartnerConnected] = useState(false);
  const [checkingPartner, setCheckingPartner] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const partnerNotifiedRef = useRef(false);
  const budgetNotifiedRef = useRef(false);

  useEffect(() => {
    async function checkPartnerStatus() {
      if (!user) {
        setCheckingPartner(false);
        return;
      }

      try {
        setCheckingPartner(true);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('couple_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && profile?.couple_id) {
          setIsPartnerConnected(true);
          if (!partnerNotifiedRef.current) {
            partnerNotifiedRef.current = true;
          }
        } else {
          setIsPartnerConnected(false);
        }
      } catch (err: unknown) {
        console.error('Error consultando vínculo de pareja:', err);
        setIsPartnerConnected(false);
      } finally {
        setCheckingPartner(false);
      }
    }

    checkPartnerStatus();
  }, [user]);

  const currentUserId = currentUser?.id || user?.id || '';

  const totalJointSpent = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const userPaidTotal = transactions
    .filter((tx) => tx.paidByUserId === currentUserId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const partnerPaidTotal = Math.max(0, totalJointSpent - userPaidTotal);

  const netBalance = transactions.reduce((acc, tx) => {
    if (tx.categoryId === 'Liquidación') return acc;

    const isUserPayer = tx.paidByUserId === currentUserId;
    const split = tx.splitRatio || { userA: 50, userB: 50 };

    if (isUserPayer) {
      return acc + (tx.amount * split.userB) / 100;
    } else {
      return acc - (tx.amount * split.userA) / 100;
    }
  }, 0);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('duo_couple_settings');
      if (savedSettings && totalJointSpent > 0) {
        const { budget } = JSON.parse(savedSettings);
        const numBudget = Number(budget);
        if (numBudget > 0 && totalJointSpent > numBudget && !budgetNotifiedRef.current) {
          budgetNotifiedRef.current = true;
          addNotification({
            title: '⚠️ Límite de Presupuesto Excedido',
            message: `El gasto acumulado ($${totalJointSpent.toFixed(2)}) ha superado el presupuesto fijado de $${numBudget.toFixed(2)}.`,
            type: 'system',
          });
        }
      }
    } catch (e) {
      console.error('Error verificando presupuesto:', e);
    }
  }, [totalJointSpent, addNotification]);

  const handleAddTransaction = async (data: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    accountId?: string;
    currency?: string;
    splitRatio?: SplitRatio;
    createdAt?: string;
  }) => {
    const payerId = data.paidByUserId || currentUserId;

    const success = await addTransaction({
      title: data.title,
      amount: data.amount,
      currency: data.currency || 'USD',
      type: 'expense',
      ownership: 'joint',
      paidByUserId: payerId,
      categoryId: data.category,
      accountId: data.accountId,
      splitRatio: data.splitRatio || { userA: 50, userB: 50 },
      createdAt: data.createdAt || new Date().toISOString(),
    });

    if (success) {
      const isMe = payerId === currentUserId;
      const payerName = isMe 
        ? (currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú') 
        : (partner?.name ? partner.name.split(' ')[0] : 'Tu pareja');

      addNotification({
        title: 'Nuevo gasto registrado',
        message: `${payerName} agregó "${data.title}" por $${data.amount.toFixed(2)} ${data.currency || 'USD'}`,
        type: 'expense',
      });
    }
  };

  const handleSettleUp = async (settlementData: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    createdAt: string;
  }) => {
    const payerId = settlementData.paidByUserId || currentUserId;

    const success = await addTransaction({
      title: settlementData.title,
      amount: settlementData.amount,
      currency: 'USD',
      type: 'expense',
      ownership: 'joint',
      paidByUserId: payerId,
      categoryId: settlementData.category,
      splitRatio: { userA: 50, userB: 50 },
      createdAt: settlementData.createdAt,
    });

    if (success) {
      addNotification({
        title: 'Saldos al día 🎉',
        message: `Se liquidaron las cuentas pendientes por un total de $${settlementData.amount.toFixed(2)} USD.`,
        type: 'settlement',
      });
    }
  };

  if (authLoading || (user && (checkingPartner || profilesLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1117]">
        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-xs font-semibold">Cargando DUO...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (!isPartnerConnected) {
    return (
      <PartnerConnectView 
        onComplete={() => {
          setIsPartnerConnected(true);
          addNotification({
            title: '¡Pareja Vinculada con Éxito!',
            message: 'Ahora ambos perfiles están sincronizados en tiempo real.',
            type: 'system',
          });
        }} 
      />
    );
  }

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
            netBalance={netBalance}
          />
          <RatesWidget />
          <TransactionList 
            transactions={transactions} 
            onViewAll={() => setActiveTab('transactions')}
            onNewTransaction={() => setIsModalOpen(true)}
          />
          {/* Aquí pasamos las transacciones reales */}
          <MonthlyAnalytics transactions={transactions} />
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

      <NewTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        netBalance={netBalance}
        onSubmit={handleSettleUp}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <CurrencyProvider>
        <MainApp />
      </CurrencyProvider>
    </NotificationProvider>
  );
}