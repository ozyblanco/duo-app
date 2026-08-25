import type { Transaction } from '@/types';

export interface CalculatedBalances {
  totalJointSpent: number; // Total de gastos compartidos reales
  userPaidTotal: number;   // Total pagado por el usuario actual
  partnerPaidTotal: number;// Total pagado por la pareja
  netBalance: number;      // Positivo: le deben al usuario. Negativo: el usuario debe.
}

export function calculateBalances(
  transactions: Transaction[],
  currentUserId: string
): CalculatedBalances {
  let totalJointSpent = 0;
  let userPaidTotal = 0;
  let partnerPaidTotal = 0;
  let netBalance = 0;

  for (const tx of transactions) {
    const isUserPayer = tx.paidByUserId === currentUserId;

    // 1. Caso especial: Liquidación ("Saldar Cuentas")
    if (tx.category === 'Liquidación') {
      if (isUserPayer) {
        // El usuario pagó para saldar su deuda -> su balance mejora (debe menos)
        netBalance += tx.amount;
        userPaidTotal += tx.amount;
      } else {
        // La pareja le pagó al usuario para saldar -> el balance del usuario disminuye (le deben menos)
        netBalance -= tx.amount;
        partnerPaidTotal += tx.amount;
      }
      continue;
    }

    // 2. Gastos normales (Compras, Servicios, Comida, etc.)
    if (isUserPayer) {
      userPaidTotal += tx.amount;
    } else {
      partnerPaidTotal += tx.amount;
    }

    // Determinar la proporción de cada uno
    const userRatio = tx.splitRatio ? tx.splitRatio.userA / 100 : 0.5;
    const partnerRatio = tx.splitRatio ? tx.splitRatio.userB / 100 : 0.5;

    // Si ambos participan en el gasto (ej. 50/50), suma al total compartido
    if (userRatio > 0 && partnerRatio > 0) {
      totalJointSpent += tx.amount;
    }

    // Cálculo del impacto en el balance mutuo:
    // Lo que pagó el usuario (-) lo que le correspondía asumir
    const userShare = tx.amount * userRatio;
    const paidByAmount = isUserPayer ? tx.amount : 0;
    
    netBalance += (paidByAmount - userShare);
  }

  return {
    totalJointSpent,
    userPaidTotal,
    partnerPaidTotal,
    netBalance,
  };
}