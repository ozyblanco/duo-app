import React, { useState } from 'react';
import { X, DollarSign, Tag, User, CreditCard, PieChart, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { currentUser, partnerUser, mockAccounts } from '@/data/mockData';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import type { SplitRatio } from '@/types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    accountId?: string;
    currency?: string;
    splitRatio?: SplitRatio;
    createdAt: string; // Marcador de fecha y hora exacta
  }) => void;
}

export function NewTransactionModal({ isOpen, onClose, onSubmit }: NewTransactionModalProps) {
  const { rates, isLoading, refetch } = useExchangeRates();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUser.id);
  const [category, setCategory] = useState('Comida');
  const [accountId, setAccountId] = useState(mockAccounts[0]?.id || 'acc_1');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [rateType, setRateType] = useState<'binance' | 'bcv'>('binance');
  const [splitType, setSplitType] = useState<'50/50' | '100_USER' | '100_PARTNER'>('50/50');

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const activeRate = rateType === 'bcv' ? rates.bcvUsd : rates.binanceUsdt;

  // Cálculo equivalente dinámico
  const equivalentCalculated =
    currency === 'VES'
      ? numericAmount > 0
        ? (numericAmount / activeRate).toFixed(2)
        : '0.00'
      : (numericAmount * activeRate).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || numericAmount <= 0) return;

    // Normalizar a USD si el monto ingresado fue en VES
    const finalAmountInUsd =
      currency === 'VES' ? Number((numericAmount / activeRate).toFixed(2)) : numericAmount;

    let splitRatio: SplitRatio = { userA: 50, userB: 50 };
    if (splitType === '100_USER') {
      splitRatio = { userA: 100, userB: 0 };
    } else if (splitType === '100_PARTNER') {
      splitRatio = { userA: 0, userB: 100 };
    }

    onSubmit({
      title,
      amount: finalAmountInUsd,
      paidByUserId,
      category,
      accountId,
      currency: 'USD',
      splitRatio,
      createdAt: new Date().toISOString(), // Fecha y hora exacta en tiempo real
    });

    // Reset de estado
    setTitle('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Añadir Nuevo Gasto
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Monto y Moneda */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Monto y Moneda
              </label>
              <button
                type="button"
                onClick={refetch}
                disabled={isLoading}
                className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                title="Actualizar tasa"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                Tasa: Bs. {activeRate.toFixed(2)}
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {currency === 'USD' ? <DollarSign className="w-4 h-4" /> : <span className="text-xs font-bold pl-0.5">Bs</span>}
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm font-bold font-numeric text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'USD' | 'VES')}
                className="w-24 px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="VES">VES (Bs)</option>
              </select>
            </div>

            {/* Selector de Tasa y Cálculo Equivalente */}
            {currency === 'VES' && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Usar Tasa:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setRateType('binance')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        rateType === 'binance'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Binance
                    </button>
                    <button
                      type="button"
                      onClick={() => setRateType('bcv')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        rateType === 'bcv'
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      BCV
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold">
                  <ArrowLeftRight className="w-3 h-3 text-blue-400" />
                  <span>${equivalentCalculated} USD</span>
                </div>
              </div>
            )}

            {currency === 'USD' && numericAmount > 0 && (
              <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>Equivale a aproximadamente</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Bs. {equivalentCalculated}
                </span>
              </div>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Concepto / Descripción
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ej. Mercado semanal en Farmatodo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Quién Pagó */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              ¿Quién pagó?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaidByUserId(currentUser.id)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paidByUserId === currentUser.id
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{currentUser.name}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaidByUserId(partnerUser.id)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  paidByUserId === partnerUser.id
                    ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{partnerUser.name}</span>
              </button>
            </div>
          </div>

          {/* Cuenta Origen y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cuenta</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                {mockAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                <option value="Comida">Comida / Mercado</option>
                <option value="Hogar">Hogar & Luz</option>
                <option value="Servicios">Servicios / Suscripciones</option>
                <option value="Entretenimiento">Entretenimiento / Citas</option>
                <option value="Salud">Salud & Cuidado</option>
                <option value="Transporte">Transporte / Gasolina</option>
              </select>
            </div>
          </div>

          {/* Tipo de División */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              <PieChart className="w-3.5 h-3.5" />
              <span>División del Gasto</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('50/50')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '50/50'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                50 / 50
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_USER')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '100_USER'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Solo {currentUser.name.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_PARTNER')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '100_PARTNER'
                    ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Solo {partnerUser.name.split(' ')[0]}
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}