import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  DollarSign, 
  Tag, 
  User, 
  CreditCard, 
  PieChart, 
  ArrowLeftRight, 
  RefreshCw, 
  Paperclip, 
  Loader2, 
  Calendar,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useAccounts } from '@/components/accounts/useAccounts';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCategories } from '@/hooks/useCategories';
import { uploadReceipt } from '@/utils/uploadReceipt';
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
    receiptUrl?: string;
    createdAt: string;
  }) => void;
}

export function NewTransactionModal({ isOpen, onClose, onSubmit }: NewTransactionModalProps) {
  const { currentUser, partner } = useCoupleProfiles();
  const { accounts } = useAccounts();
  const { rates, isLoading: ratesLoading, refetch: refetchRates } = useExchangeRates();
  const { categories } = useCategories();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [rateType, setRateType] = useState<'binance' | 'bcv'>('binance');
  const [splitType, setSplitType] = useState<'50/50' | '100_USER' | '100_PARTNER'>('50/50');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Comprobante
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Asignar primera categoría disponible si no hay ninguna seleccionada
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Datos dinámicos de los participantes
  const currentUserId = currentUser?.id || '';
  const partnerId = partner?.id || '';
  const currentUserName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Tú';
  const partnerName = partner?.name ? partner.name.split(' ')[0] : 'Pareja';

  const userInitial = currentUser?.name ? currentUser.name[0].toUpperCase() : 'U';
  const partnerInitial = partner?.name ? partner.name[0].toUpperCase() : 'P';

  const activePayerId = selectedPayerId || currentUserId;
  const activeAccountId = accountId || (accounts[0]?.id ?? '');
  const activeCategory = category || (categories[0]?.name ?? 'General');

  // Cálculos de conversión de moneda
  const numericAmount = parseFloat(amount) || 0;
  const activeRate = (rateType === 'bcv' ? rates.bcvUsd : rates.binanceUsdt) || 36.5;

  const finalAmountInUsd =
    currency === 'VES'
      ? numericAmount > 0
        ? Number((numericAmount / activeRate).toFixed(2))
        : 0
      : numericAmount;

  const equivalentCalculated =
    currency === 'VES'
      ? numericAmount > 0
        ? (numericAmount / activeRate).toFixed(2)
        : '0.00'
      : (numericAmount * activeRate).toFixed(2);

  // Manejo de archivo comprobante
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

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || numericAmount <= 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);

      let uploadedUrl: string | undefined = undefined;
      if (receiptFile) {
        const url = await uploadReceipt(receiptFile);
        if (url) uploadedUrl = url;
      }

      let splitRatio: SplitRatio = { userA: 50, userB: 50 };
      if (splitType === '100_USER') {
        splitRatio = { userA: 100, userB: 0 };
      } else if (splitType === '100_PARTNER') {
        splitRatio = { userA: 0, userB: 100 };
      }

      // Combinar fecha seleccionada con hora actual
      const selectedDateTime = new Date(expenseDate);
      const now = new Date();
      selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      onSubmit({
        title: title.trim(),
        amount: finalAmountInUsd,
        paidByUserId: activePayerId,
        category: activeCategory,
        accountId: activeAccountId || undefined,
        currency: 'USD',
        splitRatio,
        receiptUrl: uploadedUrl,
        createdAt: selectedDateTime.toISOString(),
      });

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        // Limpiar estado
        setTitle('');
        setAmount('');
        setSelectedPayerId('');
        handleRemoveReceipt();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al registrar gasto:', err);
      setIsSubmitting(false);
    }
  };

  // Contenido del modal montado en Portal
  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#161B22] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Registrar Gasto
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Añade un pago individual o compartido
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 1. Monto & Moneda (Hero Input) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Monto del Gasto</span>
              {currency === 'VES' && (
                <button
                  type="button"
                  onClick={refetchRates}
                  disabled={ratesLoading}
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin' : ''}`} />
                  <span>Tasa: Bs. {activeRate.toFixed(2)}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {currency === 'USD' ? (
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-bold text-blue-500">Bs</span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                  className="w-full pl-9 pr-3 py-2 text-xl font-black font-numeric text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder-slate-300 dark:placeholder-slate-700"
                />
              </div>

              {/* Selector de moneda */}
              <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('VES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'VES'
                      ? 'bg-white dark:bg-[#161B22] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  VES
                </button>
              </div>
            </div>

            {/* Fila de conversión si se usa VES */}
            {currency === 'VES' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Tasa:</span>
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
                <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold font-numeric">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                  <span>≈ ${equivalentCalculated} USD</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Concepto */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Concepto / Título
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ej. Supermercado, Cena, Gasolina..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* 3. Quién Pagó */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>¿Quién pagó el gasto?</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPayerId(currentUserId)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activePayerId === currentUserId
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">
                  {userInitial}
                </div>
                <span>{currentUserName}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPayerId(partnerId)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  activePayerId === partnerId
                    ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-black">
                  {partnerInitial}
                </div>
                <span>{partnerName}</span>
              </button>
            </div>
          </div>

          {/* 4. Cuenta y Categoría (2 columnas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cuenta Origen</span>
              </label>
              <select
                value={activeAccountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                {accounts.length === 0 ? (
                  <option value="">Efectivo / General</option>
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
                value={activeCategory}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              >
                {categories.length === 0 ? (
                  <option value="General">General</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 5. División del Gasto con Desglose en Vivo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <PieChart className="w-3.5 h-3.5 text-blue-500" />
                <span>División del Gasto</span>
              </label>
              {numericAmount > 0 && (
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-numeric">
                  {splitType === '50/50' && `$${(finalAmountInUsd / 2).toFixed(2)} c/u`}
                  {splitType === '100_USER' && `${currentUserName} asume $${finalAmountInUsd.toFixed(2)}`}
                  {splitType === '100_PARTNER' && `${partnerName} asume $${finalAmountInUsd.toFixed(2)}`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('50/50')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '50/50'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                50 / 50
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_USER')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '100_USER'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Solo {currentUserName}
              </button>
              <button
                type="button"
                onClick={() => setSplitType('100_PARTNER')}
                className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  splitType === '100_PARTNER'
                    ? 'bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Solo {partnerName}
              </button>
            </div>
          </div>

          {/* 6. Fecha y Comprobante (Fila Secundaria Limpia) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Fecha */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Fecha</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
              />
            </div>

            {/* Comprobante Opcional (Botón Compacto) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Comprobante (Opcional)
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
                  className="w-full py-2 px-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Adjuntar captura</span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-1.5 px-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 truncate">
                      {receiptFile?.name || 'Comprobante adjunto'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Eliminar comprobante"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback de Éxito */}
          {showSuccessToast && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>¡Gasto registrado correctamente!</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0 || !title.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Gasto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}