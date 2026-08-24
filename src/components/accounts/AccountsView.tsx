import React, { useState } from 'react';
import { Landmark, CreditCard, Wallet, Coins, Plus, ShieldCheck, X } from 'lucide-react';
import { mockAccounts as initialAccounts, currentUser, partnerUser } from '@/data/mockData';
import type { Account } from '@/types';

export function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nueva cuenta
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [ownerId, setOwnerId] = useState<string>('joint');
  const [type, setType] = useState<string>('bank');

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
    if (owner === currentUser.id) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/20">
          {currentUser.name.split(' ')[0]}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-pink-500/20">
        {partnerUser.name.split(' ')[0]}
      </span>
    );
  };

  // Cálculo de totales separados por moneda
  const totalUSD = accounts
    .filter((a) => a.currency === 'USD')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const totalVES = accounts
    .filter((a) => a.currency === 'VES')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(balance);
    if (!name || isNaN(parsedBalance)) return;

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name,
      balance: parsedBalance,
      currency,
      ownerId,
      type,
    };

    setAccounts([newAcc, ...accounts]);
    setName('');
    setBalance('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Resumen Patrimonio */}
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
          Suma total de saldos disponibles en cuentas individuales y compartidas.
        </p>
      </div>

      {/* Lista de Cuentas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Cuentas Vinculadas ({accounts.length})
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex items-center justify-between shadow-2xs"
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

              <div className="text-right">
                <span className={`text-sm font-bold font-numeric ${
                  acc.balance < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                }`}>
                  {acc.currency === 'USD' ? '$' : 'Bs. '}{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                  {acc.currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nueva Cuenta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity">
          <div 
            className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl p-6 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Añadir Nueva Cuenta
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="mt-5 space-y-4">
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold font-numeric text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'VES')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="joint">Compartida (50/50)</option>
                    <option value={currentUser.id}>{currentUser.name.split(' ')[0]} (Individual)</option>
                    <option value={partnerUser.id}>{partnerUser.name.split(' ')[0]} (Individual)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}