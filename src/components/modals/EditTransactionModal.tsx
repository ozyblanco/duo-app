import React, { useState, useRef } from 'react';
import { X, DollarSign, Tag, User, CreditCard, PieChart, ArrowLeftRight, RefreshCw, Loader2, ImagePlus } from 'lucide-react';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useAccounts } from '@/components/accounts/useAccounts';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { uploadReceipt } from '@/utils/uploadReceipt';
import type { Transaction, SplitRatio } from '@/types';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Omit<Transaction, 'id'>>) => Promise<boolean>;
}

export function EditTransactionModal({ transaction, isOpen, onClose, onUpdate }: EditTransactionModalProps) {
  const { currentUser, partner } = useCoupleProfiles();
  const { accounts } = useAccounts();
  const { rates, isLoading: ratesLoading, refetch } = useExchangeRates();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(transaction?.title || '');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [selectedPayerId, setSelectedPayerId] = useState(transaction?.paidByUserId || '');
  const [category, setCategory] = useState(transaction?.categoryId || transaction?.category || 'Comida');
  const [accountId, setAccountId] = useState(transaction?.accountId || '');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [rateType, setRateType] = useState<'binance' | 'bcv'>('binance');
  const [splitType, setSplitType] = useState<'50/50' | '100_USER' | '100_PARTNER'>(() => {
    if (transaction?.splitRatio?.userA === 100) return '100_USER';
    if (transaction?.splitRatio?.userB === 100) return '100_PARTNER';
    return '50/50';
  });
  const [createdAt, setCreatedAt] = useState(() => {
    if (transaction?.createdAt) return transaction.createdAt.substring(0, 10);
    return new Date().toISOString().substring(0, 10);
  });

  // Comprobante
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(transaction?.receiptUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !transaction) return null;

  const currentUserId = currentUser?.id || '';
  const partnerId = partner?.id || '';
  const currentUserName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú';
  const partnerName = partner?.name ? partner.name.split(' ')[0] : 'Pareja';

  const activePayerId = selectedPayerId || transaction.paidByUserId || currentUserId;
  const activeAccountId = accountId || transaction.accountId || (accounts[0]?.id ?? '');

  const numericAmount = parseFloat(amount) || 0;
  const activeRate = (rateType === 'bcv' ? rates.bcvUsd : rates.binanceUsdt) || 36.5;

  const equivalentCalculated =
    currency === 'VES'
      ? numericAmount > 0
        ? (numericAmount / activeRate).toFixed(2)
        : '0.00'
      : (numericAmount * activeRate).toFixed(2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericAmount <= 0) return;

    try {
      setIsSubmitting(true);

      let finalReceiptUrl: string | undefined = receiptPreview || undefined;

      if (receiptFile) {
        const uploaded = await uploadReceipt(receiptFile);
        if (uploaded) finalReceiptUrl = uploaded;
      } else if (!receiptPreview) {
        finalReceiptUrl = undefined;
      }

      const finalAmountInUsd =
        currency === 'VES' ? Number((numericAmount / activeRate).toFixed(2)) : numericAmount;

      let splitRatio: SplitRatio = { userA: 50, userB: 50 };
      if (splitType === '100_USER') {
        splitRatio = { userA: 100, userB: 0 };
      } else if (splitType === '100_PARTNER') {
        splitRatio = { userA: 0, userB: 100 };
      }

      const success = await onUpdate(transaction.id, {
        title: title.trim(),
        amount: finalAmountInUsd,
        paidByUserId: activePayerId,
        categoryId: category,
        accountId: activeAccountId || undefined,
        splitRatio,
        receiptUrl: finalReceiptUrl,
        createdAt: new Date(createdAt).toISOString(),
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity">
      <div
        className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl p-6 transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Editar Movimiento
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Monto y Moneda
              </label>
              <button
                type="button"
                onClick={refetch}
                disabled={ratesLoading}
                className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin text-blue-400' : ''}`} />
                <span>Tasa: Bs. {activeRate.toFixed(2)}</span>
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
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm font-bold font-numeric text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
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
          </div>

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
                placeholder="Ej. Mercado semanal..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              ¿Quién pagó?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPayerId(currentUserId)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  activePayerId === currentUserId
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{currentUserName}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayerId(partnerId)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  activePayerId === partnerId
                    ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-500/50 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{partnerName}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cuenta</span>
              </label>
              <select
                value={activeAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                {accounts.length === 0 ? (
                  <option value="">General / Efectivo</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))
                )}
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
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
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
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Solo {currentUserName}
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_PARTNER')}
                className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '100_PARTNER'
                    ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Solo {partnerName}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            />
          </div>

          {/* Comprobante en Edición */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Comprobante / Captura
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!receiptPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Adjuntar nuevo comprobante</span>
              </button>
            ) : (
              <div className="relative inline-block mt-1">
                <img
                  src={receiptPreview}
                  alt="Comprobante"
                  className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 shadow-md cursor-pointer"
                  title="Eliminar comprobante"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}