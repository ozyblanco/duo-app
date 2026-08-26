import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  Wallet,
  Coins,
  Plus,
  ShieldCheck,
  X,
  Pencil,
  Trash2,
  RotateCcw,
  Trash,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { currentUser, partnerUser } from '@/data/mockData';
import { useAccounts } from './useAccounts';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import type { Account } from '@/types';

export function AccountsView() {
  const {
    accounts,
    trashAccounts,
    isLoading,
    addAccount,
    updateAccount,
    softDeleteAccount,
    restoreAccount,
    permanentDeleteAccount,
    totalUSD,
    totalVES,
    refetch,
  } = useAccounts();

  const { currentUser: authUser, partner } = useCoupleProfiles();
  const { rates } = useExchangeRates();

  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [ownerId, setOwnerId] = useState<string>('joint');
  const [type, setType] = useState<string>('bank');

  const currentUserName = authUser?.name || currentUser.name;
  const partnerName = partner?.name || partnerUser.name;

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setBalance('');
    setCurrency('USD');
    setOwnerId('joint');
    setType('bank');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBalance(acc.balance.toString());
    setCurrency((acc.currency as 'USD' | 'VES') || 'USD');
    setOwnerId(acc.ownerId || 'joint');
    setType(acc.type);
    setIsModalOpen(true);
  };

  const getAccountIcon = (accType: string) => {
    switch (accType) {
      case 'bank':
        return <Landmark className="w-5 h-5 text-blue-500" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'wallet':
        return <Wallet className="w-5 h-5 text-emerald-500" />;
      case 'cash':
      default:
        return <Coins className="w-5 h-5 text-amber-500" />;
    }
  };

  const getOwnerBadge = (accOwnerId?: string) => {
    const owner = accOwnerId || 'joint';
    if (owner === 'joint') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-500/20">
          Compartida 50/50
        </span>
      );
    }
    if (authUser && owner === authUser.id) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/20">
          {currentUserName.split(' ')[0]}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-pink-500/20">
        {partnerName.split(' ')[0]}
      </span>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(balance);
    if (!name.trim() || isNaN(parsedBalance)) return;

    try {
      setIsSubmitting(true);
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: name.trim(),
          balance: parsedBalance,
          currency,
          ownerId,
          type,
        });
      } else {
        await addAccount({
          name: name.trim(),
          balance: parsedBalance,
          currency,
          ownerId,
          type,
        });
      }
      setIsModalOpen(false);
    } catch {
      alert('Hubo un error al guardar la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEquivalent = (amount: number, curr: string) => {
    if (curr === 'USD') {
      const equivalentVes = amount * rates.bcvUsd;
      return (
        <span className="text-[10px] text-slate-400 block font-medium">
          ≈ Bs. {equivalentVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (BCV)
        </span>
      );
    } else {
      const equivalentUsd = rates.bcvUsd > 0 ? amount / rates.bcvUsd : 0;
      return (
        <span className="text-[10px] text-slate-400 block font-medium">
          ≈ ${equivalentUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            Patrimonio Líquido Total
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Verificado</span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-6 mt-1">
          <div>
            <span className="text-3xl font-extrabold font-numeric tracking-tight">
              ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-blue-200 ml-1.5">USD</span>
          </div>

          {totalVES > 0 && (
            <div className="pl-6 border-l border-white/20">
              <span className="text-2xl font-bold font-numeric tracking-tight text-blue-100">
                Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-blue-200 ml-1.5">VES</span>
            </div>
          )}
        </div>

        <p className="text-xs text-blue-100/80 mt-3">
          Suma total de saldos activos en cuentas individuales y compartidas.
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Cuentas Activas ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trash')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trash'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Papelera ({trashAccounts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refetch}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Recargar Cuentas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {activeTab === 'active' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cuenta</span>
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      {!isLoading && activeTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-2 text-center py-8">
              No tienes cuentas activas registradas. Haz clic en "+ Nueva Cuenta".
            </p>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex items-center justify-between shadow-xs group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                      {acc.name}
                    </h3>
                    {getOwnerBadge(acc.ownerId)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-numeric ${
                        acc.balance < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {acc.currency === 'USD' ? '$' : 'Bs. '}
                      {acc.balance.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {renderEquivalent(acc.balance, acc.currency)}
                  </div>

                  <div className="flex flex-col gap-1 opacity-80 group-hover:opacity-100 transition-opacity border-l border-slate-100 dark:border-slate-800 pl-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors cursor-pointer"
                      title="Editar cuenta"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => softDeleteAccount(acc.id)}
                      className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Mover a papelera"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && activeTab === 'trash' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trashAccounts.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-2 text-center py-8">
              La papelera está vacía.
            </p>
          ) : (
            trashAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-slate-50/50 dark:bg-[#161B22]/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 flex items-center justify-between opacity-75"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0B0F17]">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 line-through">
                      {acc.name}
                    </h3>
                    <span className="text-[10px] text-rose-500 font-semibold">En Papelera</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => restoreAccount(acc.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar permanentemente esta cuenta?')) {
                        permanentDeleteAccount(acc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                    title="Eliminar definitivamente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl p-6 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingAccount ? 'Editar Cuenta' : 'Añadir Nueva Cuenta'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre de la Cuenta / Banco
                </label>
                <input
                  type="text"
                  placeholder="Ej. Banesco Pago Móvil, Binance USD, Zelle..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Saldo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold font-numeric text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'VES')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="VES">VES (Bs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Tipo
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="bank">Banco / Cuenta</option>
                    <option value="wallet">Billetera Digital</option>
                    <option value="card">Tarjeta de Crédito</option>
                    <option value="cash">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Titular
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="joint">Compartida (50/50)</option>
                    {authUser && (
                      <option value={authUser.id}>{currentUserName.split(' ')[0]} (Individual)</option>
                    )}
                    {partner && (
                      <option value={partner.id}>{partnerName.split(' ')[0]} (Individual)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingAccount ? 'Actualizar Cuenta' : 'Crear Cuenta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}