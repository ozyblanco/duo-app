import { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useLiveClock } from '@/hooks/useLiveClock';
import { useCoupleProfiles } from '@/hooks/useCoupleProfiles';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  netBalance: number; // Positivo: currentUser debe recibir. Negativo: currentUser debe pagar.
  onSubmit: (settlementTx: {
    title: string;
    amount: number;
    paidByUserId: string;
    category: string;
    createdAt: string;
  }) => Promise<void> | void;
}

export function SettleUpModal({ isOpen, onClose, netBalance, onSubmit }: SettleUpModalProps) {
  const { formattedIso, dateString, timeString } = useLiveClock();
  const { currentUser, partner } = useCoupleProfiles();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const userObj = currentUser || { id: 'user-id', name: 'Tú' };
  const partnerObj = partner || { id: 'partner-id', name: 'Pareja' };

  const absoluteAmount = Math.abs(netBalance);
  const isUserDebtor = netBalance < 0; // currentUser le debe a partner

  const debtor = isUserDebtor ? userObj : partnerObj;
  const creditor = isUserDebtor ? partnerObj : userObj;

  const debtorFirstName = debtor.name.split(' ')[0] || debtor.name;
  const creditorFirstName = creditor.name.split(' ')[0] || creditor.name;

  const handleConfirm = async () => {
    if (absoluteAmount === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: `Saldar Cuentas - Pago a ${creditorFirstName}`,
        amount: absoluteAmount,
        paidByUserId: debtor.id,
        category: 'Liquidación',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity">
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

        {/* Detalles */}
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
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                      {debtor.name[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {debtorFirstName}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-emerald-500" />

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                      {creditor.name[0]?.toUpperCase() || 'P'}
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

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                Al hacer clic en <strong className="text-slate-700 dark:text-slate-200">Confirmar Pago</strong>, se registrará un movimiento de liquidación por <strong>${absoluteAmount.toFixed(2)} USD</strong> y el balance mutuo volverá a <strong>$0.00</strong>.
              </p>
            </>
          )}

          {/* Botones */}
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