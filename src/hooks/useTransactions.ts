import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  // 1. Obtención asíncrona de datos desde Supabase
  const fetchTransactions = useCallback(async () => {
    try {
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
        categoryId: row.category_id,
        accountId: row.account_id || 'acc_1',
        splitRatio: row.split_ratio || { userA: 50, userB: 50 },
        createdAt: row.created_at,
        date: row.created_at,
      }));

      setTransactions(mappedTransactions);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar transacciones.';
      console.error('Error fetching transactions:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Carga inicial asíncrona respetando el ciclo de vida de React
  useEffect(() => {
    let isMounted = true;

    const executeFetch = async () => {
      if (isMounted) {
        await fetchTransactions();
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchTransactions]);

  // 3. Suscripción en Tiempo Real (Realtime)
  useEffect(() => {
    if (!coupleId) return;

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

  // 4. Registrar Transacción
  const addTransaction = async (
    newTxData: Omit<Transaction, 'id' | 'date'> & { createdAt?: string; date?: string }
  ) => {
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

      const createdAtVal = newTxData.createdAt || newTxData.date || new Date().toISOString();

      const newRow = {
        couple_id: currentCoupleId,
        title: newTxData.title,
        amount: newTxData.amount,
        currency: newTxData.currency || 'USD',
        type: newTxData.type || 'expense',
        ownership: newTxData.ownership || 'joint',
        paid_by_user_id: newTxData.paidByUserId || user.id,
        category_id: newTxData.categoryId,
        account_id: newTxData.accountId || 'acc_1',
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

      setTransactions((prev) => [formatted, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la transacción.';
      console.error('Error adding transaction:', msg);
      alert(`No se pudo guardar la transacción: ${msg}`);
    }
  };

  // 5. Eliminar Transacción
  const deleteTransaction = async (id: string) => {
    try {
      const { error: delError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (delError) throw delError;

      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar transacción.';
      console.error('Error deleting transaction:', msg);
    }
  };

  const resetTransactions = () => {
    setTransactions([]);
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    resetTransactions,
    refreshTransactions: fetchTransactions,
  };
}