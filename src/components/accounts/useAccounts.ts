import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Account } from '@/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccountsData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAccounts(
          data.map((acc) => ({
            id: acc.id,
            name: acc.name,
            balance: Number(acc.balance),
            currency: acc.currency,
            type: acc.type,
            ownerId: acc.owner_id,
            isDeleted: acc.is_deleted ?? false,
          }))
        );
      }
    } catch (err) {
      console.error('Error al cargar cuentas de Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const executeFetch = async () => {
      if (isMounted) {
        await fetchAccountsData();
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchAccountsData]);

  const refetch = async () => {
    setIsLoading(true);
    await fetchAccountsData();
  };

  // Crear nueva cuenta
  const addAccount = async (newAccountData: Omit<Account, 'id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: userData.user?.id || null,
            name: newAccountData.name,
            balance: newAccountData.balance,
            currency: newAccountData.currency,
            type: newAccountData.type,
            owner_id: newAccountData.ownerId || 'joint',
            is_deleted: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const created: Account = {
          id: data.id,
          name: data.name,
          balance: Number(data.balance),
          currency: data.currency,
          type: data.type,
          ownerId: data.owner_id,
          isDeleted: data.is_deleted,
        };
        setAccounts((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Error al añadir cuenta:', err);
      throw err;
    }
  };

  // Editar cuenta
  const updateAccount = async (id: string, updatedData: Partial<Account>) => {
    try {
      const payload: Record<string, unknown> = {};
      if (updatedData.name !== undefined) payload.name = updatedData.name;
      if (updatedData.balance !== undefined) payload.balance = updatedData.balance;
      if (updatedData.currency !== undefined) payload.currency = updatedData.currency;
      if (updatedData.type !== undefined) payload.type = updatedData.type;
      if (updatedData.ownerId !== undefined) payload.owner_id = updatedData.ownerId;

      const { error } = await supabase
        .from('accounts')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, ...updatedData } : acc))
      );
    } catch (err) {
      console.error('Error al actualizar cuenta:', err);
      throw err;
    }
  };

  // Mover a papelera (Soft delete)
  const softDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, isDeleted: true } : acc))
      );
    } catch (err) {
      console.error('Error al enviar cuenta a papelera:', err);
      throw err;
    }
  };

  // Restaurar de papelera
  const restoreAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_deleted: false })
        .eq('id', id);

      if (error) throw error;

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? { ...acc, isDeleted: false } : acc))
      );
    } catch (err) {
      console.error('Error al restaurar cuenta:', err);
      throw err;
    }
  };

  // Eliminar permanentemente
  const permanentDeleteAccount = async (id: string) => {
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;

      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (err) {
      console.error('Error al eliminar cuenta permanentemente:', err);
      throw err;
    }
  };

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.isDeleted), [accounts]);
  const trashAccounts = useMemo(() => accounts.filter((a) => a.isDeleted), [accounts]);

  const totalUSD = useMemo(() => {
    return activeAccounts
      .filter((a) => a.currency === 'USD')
      .reduce((acc, curr) => acc + curr.balance, 0);
  }, [activeAccounts]);

  const totalVES = useMemo(() => {
    return activeAccounts
      .filter((a) => a.currency === 'VES')
      .reduce((acc, curr) => acc + curr.balance, 0);
  }, [activeAccounts]);

  return {
    accounts: activeAccounts,
    trashAccounts,
    isLoading,
    addAccount,
    updateAccount,
    softDeleteAccount,
    restoreAccount,
    permanentDeleteAccount,
    totalUSD,
    totalVES,
    refetch,
  };
}