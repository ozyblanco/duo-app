import { useState, useMemo } from 'react';
import { X, CheckCircle2, ArrowRight, Loader2, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';
import { useAccounts } from '@/components/accounts/useAccounts';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  netBalance: number; // Positivo: currentUser recibe. Negativo: currentUser paga.
  onSubmit: (settlementTx: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    accountId?: string;
    deductAmount?: number;
    createdAt: string;
  }) => Promise<void> | void;
}

export function SettleUpModal({ isOpen, onClose, netBalance, onSubmit }: SettleUpModalProps) {
  const { formattedIso, dateString, timeString } = useLiveClock();
  const { currentUser, partner } = useCoupleProfiles();
  const { accounts } = useAccounts();
  const { rates, isLoading: ratesLoading, refetch: refetchRates } = useExchangeRates();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [rateType, setRateType] = useState<'binance' | 'bcv'>('binance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const absoluteAmount = Math.abs(netBalance);
  const isUserDebtor = netBalance < 0;

  const debtor = isUserDebtor ? (currentUser || { id: '', name: 'Tú' }) : (partner || { id: '', name: 'Pareja' });
  const creditor = isUserDebtor ? (partner || { id: '', name: 'Pareja' }) : (currentUser || { id: '', name: 'Tú' });

  const debtorFirstName = debtor.name ? debtor.name.split(' ')[0] : 'Deudor';
  const creditorFirstName = creditor.name ? creditor.name.split(' ')[0] : 'Acreedor';

  const activeAccountId = selectedAccountId || (accounts[0]?.id ?? '');
  const selectedAccount = useMemo(() => accounts.find((a) => a.id === activeAccountId), [accounts, activeAccountId]);

  const activeRate = (rateType === 'bcv' ? rates.bcvUsd : rates.binanceUsdt) || 36.5;

  // Cálculo del monto exacto a debitar de la cuenta seleccionada
  const { debitAmount, isVesAccount } = useMemo(() => {
    if (!selectedAccount) {
      return { debitAmount: absoluteAmount, isVesAccount: false };
    }

    if (selectedAccount.currency === 'VES') {
      return {
        debitAmount: Number((absoluteAmount * activeRate).toFixed(2)),
        isVesAccount: true,
      };
    }

    return {
      debitAmount: absoluteAmount,
      isVesAccount: false,
    };
  }, [selectedAccount, absoluteAmount, activeRate]);

  if (!isOpen) return null;

  const hasInsufficientFunds = selectedAccount ? selectedAccount.balance < debitAmount : false;

  const handleConfirm = async () => {
    if (absoluteAmount === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: `Saldar Cuentas - Pago a ${creditorFirstName}`,
        amount: absoluteAmount,
        paidByUserId: debtor.id,
        category: 'Liquidación',
        accountId: activeAccountId || undefined,
        deductAmount: activeAccountId ? debitAmount : undefined,
        createdAt: formattedIso,
      });
      onClose();
    } catch (error) {
      console.error('Error al saldar cuentas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity">
      <div
        className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Saldar Cuentas ("Ya Pagamos")
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="mt-5 space-y-4">
          {absoluteAmount < 0.01 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F17] text-center space-y-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ¡Están al día!
              </p>
              <p className="text-xs text-slate-400">
                No hay deudas pendientes entre ustedes en este momento.
              </p>
            </div>
          ) : (
            <>
              {/* Resumen del movimiento de pago */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Transferencia de Saldos</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                    {dateString} • {timeString}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 uppercase">
                      {debtor.name ? debtor.name[0] : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {debtorFirstName}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-emerald-500" />

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 uppercase">
                      {creditor.name ? creditor.name[0] : 'P'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {creditorFirstName}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-500/20 text-center">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-numeric">
                    ${absoluteAmount.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Selector de Cuenta para Débito Automático */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    <span>Descontar saldo de la cuenta:</span>
                  </span>
                  {isVesAccount && (
                    <button
                      type="button"
                      onClick={refetchRates}
                      disabled={ratesLoading}
                      className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${ratesLoading ? 'animate-spin text-blue-400' : ''}`} />
                      <span>Tasa: Bs. {activeRate.toFixed(2)}</span>
                    </button>
                  )}
                </label>

                <select
                  value={activeAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="">No descontar de ninguna cuenta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — Saldo: {acc.currency === 'USD' ? '$' : 'Bs. '}{acc.balance.toFixed(2)} {acc.currency}
                    </option>
                  ))}
                </select>

                {isVesAccount && (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Tasa aplicada:</span>
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Débito: Bs. {debitAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                {hasInsufficientFunds && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>El saldo de la cuenta quedará en negativo tras este pago.</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center pt-1">
                Al confirmar, se registrará la liquidación en el historial, el balance volverá a <strong>$0.00</strong> y se actualizará el saldo de la cuenta bancaria.
              </p>
            </>
          )}

          {/* Botones de acción */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            {absoluteAmount >= 0.01 && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Confirmar Pago ("Ya pagamos")</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}