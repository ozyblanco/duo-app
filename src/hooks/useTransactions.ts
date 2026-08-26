import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { offlineQueue } from '@/lib/offlineQueue';
import type { Transaction } from '@/types';

const CACHE_KEY = 'duo_transactions_cache';

const isValidUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTransactions([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.couple_id) {
        setTransactions([]);
        return;
      }

      setCoupleId(profile.couple_id);

      // Sincronizar cola offline si existen elementos pendientes
      await offlineQueue.syncAll(profile.couple_id);

      const { data, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      const mappedTransactions: Transaction[] = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        amount: Number(row.amount),
        currency: row.currency || 'USD',
        type: row.type || 'expense',
        ownership: row.ownership || 'joint',
        paidByUserId: row.paid_by_user_id,
        categoryId: row.category_id || 'General',
        accountId: row.account_id,
        splitRatio: row.split_ratio || { userA: 50, userB: 50 },
        createdAt: row.created_at,
        date: row.created_at,
      }));

      setTransactions(mappedTransactions);
      localStorage.setItem(CACHE_KEY, JSON.stringify(mappedTransactions));
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar transacciones.';
      console.error('Error fetching transactions:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const executeFetch = async () => {
      if (isMounted) await fetchTransactions();
    };
    executeFetch();
    return () => {
      isMounted = false;
    };
  }, [fetchTransactions]);

  // Suscripción Realtime
  useEffect(() => {
    if (!coupleId || !navigator.onLine) return;

    const channel = supabase
      .channel(`realtime-transactions-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, fetchTransactions]);

  // Agregar Gasto
  const addTransaction = async (
    newTxData: Omit<Transaction, 'id' | 'date'> & { createdAt?: string; date?: string }
  ): Promise<boolean> => {
    const createdAtVal = newTxData.createdAt || newTxData.date || new Date().toISOString();

    if (!navigator.onLine) {
      const pending = offlineQueue.add({ ...newTxData, createdAt: createdAtVal });
      const optimisticTx: Transaction = {
        id: pending.tempId,
        title: newTxData.title,
        amount: Number(newTxData.amount),
        currency: newTxData.currency || 'USD',
        type: newTxData.type || 'expense',
        ownership: newTxData.ownership || 'joint',
        paidByUserId: newTxData.paidByUserId,
        categoryId: newTxData.categoryId || 'General',
        accountId: newTxData.accountId,
        splitRatio: newTxData.splitRatio || { userA: 50, userB: 50 },
        createdAt: createdAtVal,
        date: createdAtVal,
      };

      setTransactions((prev) => {
        const updated = [optimisticTx, ...prev];
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let currentCoupleId = coupleId;
      if (!currentCoupleId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('couple_id')
          .eq('id', user.id)
          .single();
        currentCoupleId = profile?.couple_id || null;
      }

      if (!currentCoupleId) {
        throw new Error('No tienes un espacio de pareja vinculado.');
      }

      const finalPaidBy = isValidUUID(newTxData.paidByUserId) ? newTxData.paidByUserId : user.id;
      const finalAccountId = isValidUUID(newTxData.accountId) ? newTxData.accountId : null;

      const newRow = {
        couple_id: currentCoupleId,
        title: newTxData.title,
        amount: Number(newTxData.amount),
        currency: newTxData.currency || 'USD',
        type: newTxData.type || 'expense',
        ownership: newTxData.ownership || 'joint',
        paid_by_user_id: finalPaidBy,
        category_id: newTxData.categoryId || 'General',
        account_id: finalAccountId,
        split_ratio: newTxData.splitRatio || { userA: 50, userB: 50 },
        created_at: createdAtVal,
      };

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert(newRow)
        .select()
        .single();

      if (insertError) throw insertError;

      const formatted: Transaction = {
        id: data.id,
        title: data.title,
        amount: Number(data.amount),
        currency: data.currency,
        type: data.type,
        ownership: data.ownership,
        paidByUserId: data.paid_by_user_id,
        categoryId: data.category_id,
        accountId: data.account_id,
        splitRatio: data.split_ratio,
        createdAt: data.created_at,
        date: data.created_at,
      };

      setTransactions((prev) => {
        const updated = [formatted, ...prev];
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err: unknown) {
      console.error('Error adding transaction online, fallback offline:', err);
      offlineQueue.add({ ...newTxData, createdAt: createdAtVal });
      return true;
    }
  };

  // Editar / Actualizar Gasto
  const updateTransaction = async (
    id: string,
    updatedFields: Partial<Omit<Transaction, 'id'>>
  ): Promise<boolean> => {
    try {
      if (navigator.onLine && !id.startsWith('offline-')) {
        const updatePayload: Record<string, unknown> = {};

        if (updatedFields.title !== undefined) updatePayload.title = updatedFields.title;
        if (updatedFields.amount !== undefined) updatePayload.amount = Number(updatedFields.amount);
        if (updatedFields.currency !== undefined) updatePayload.currency = updatedFields.currency;
        if (updatedFields.categoryId !== undefined) updatePayload.category_id = updatedFields.categoryId;
        if (updatedFields.paidByUserId !== undefined) {
          updatePayload.paid_by_user_id = isValidUUID(updatedFields.paidByUserId) ? updatedFields.paidByUserId : null;
        }
        if (updatedFields.accountId !== undefined) {
          updatePayload.account_id = isValidUUID(updatedFields.accountId) ? updatedFields.accountId : null;
        }
        if (updatedFields.splitRatio !== undefined) updatePayload.split_ratio = updatedFields.splitRatio;
        if (updatedFields.createdAt !== undefined) updatePayload.created_at = updatedFields.createdAt;

        const { error: updateError } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      setTransactions((prev) => {
        const updated = prev.map((tx) =>
          tx.id === id ? { ...tx, ...updatedFields } : tx
        );
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      return true;
    } catch (err: unknown) {
      console.error('Error updating transaction:', err);
      alert('No se pudo actualizar el movimiento');
      return false;
    }
  };

  // Eliminar Gasto
  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      if (id.startsWith('offline-')) {
        offlineQueue.remove(id);
      } else {
        const { error: delError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (delError) throw delError;
      }

      setTransactions((prev) => {
        const updated = prev.filter((tx) => tx.id !== id);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err: unknown) {
      console.error('Error deleting transaction:', err);
      return false;
    }
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
  };
}