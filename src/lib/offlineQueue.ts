import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types';

const OFFLINE_QUEUE_KEY = 'duo_offline_tx_queue';

export interface PendingTransaction {
  tempId: string;
  data: Omit<Transaction, 'id' | 'date'> & { createdAt?: string };
}

export const offlineQueue = {
  getPending(): PendingTransaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  add(data: Omit<Transaction, 'id' | 'date'> & { createdAt?: string }): PendingTransaction {
    const pending: PendingTransaction = {
      tempId: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data,
    };
    const current = this.getPending();
    current.push(pending);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
    return pending;
  },

  remove(tempId: string) {
    const current = this.getPending().filter((item) => item.tempId !== tempId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(current));
  },

  clear() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  async syncAll(coupleId: string): Promise<number> {
    const pendingList = this.getPending();
    if (pendingList.length === 0) return 0;

    let syncedCount = 0;

    for (const item of pendingList) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) break;

        const newRow = {
          couple_id: coupleId,
          title: item.data.title,
          amount: Number(item.data.amount),
          currency: item.data.currency || 'USD',
          type: item.data.type || 'expense',
          ownership: item.data.ownership || 'joint',
          paid_by_user_id: item.data.paidByUserId || user.id,
          category_id: item.data.categoryId || 'General',
          account_id: item.data.accountId || null,
          split_ratio: item.data.splitRatio || { userA: 50, userB: 50 },
          created_at: item.data.createdAt || new Date().toISOString(),
        };

        const { error } = await supabase.from('transactions').insert(newRow);
        if (!error) {
          this.remove(item.tempId);
          syncedCount++;
        }
      } catch (e) {
        console.error('Error sincronizando movimiento offline:', e);
      }
    }

    return syncedCount;
  },
};