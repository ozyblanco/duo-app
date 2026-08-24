import { useState, useEffect } from 'react';
import type { Transaction } from '@/types';

const STORAGE_KEY = 'duo_transactions_v1';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error al guardar transacciones en localStorage:', error);
    }
  }, [transactions]);

  const addTransaction = (newTxData: Omit<Transaction, 'id' | 'date'> & { createdAt?: string; date?: string }) => {
    const newTx: Transaction = {
      ...newTxData,
      id: Date.now().toString(),
      date: newTxData.createdAt || newTxData.date || new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const resetTransactions = () => {
    setTransactions([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    resetTransactions,
  };
}