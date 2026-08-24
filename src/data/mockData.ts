import type { UserProfile, Account, Category, Transaction } from '../types';

export const currentUser: UserProfile = {
  id: 'user_1',
  name: 'Oscar',
  color: '#388BFD'
};

export const partnerUser: UserProfile = {
  id: 'user_2',
  name: 'Pareja',
  color: '#EC4899'
};

export const mockAccounts: Account[] = [
  { id: 'acc_1', name: 'Banco Personal', balance: 1250.00, currency: 'USD', ownerId: 'user_1', type: 'bank' },
  { id: 'acc_2', name: 'Cuenta Compartida', balance: 3400.50, currency: 'USD', ownerId: 'joint', type: 'bank' },
  { id: 'acc_3', name: 'Efectivo / Wallet', balance: 180.00, currency: 'USD', ownerId: 'user_2', type: 'wallet' },
];

export const mockCategories: Category[] = [
  { id: 'cat_1', name: 'Supermercado', iconName: 'ShoppingCart', color: '#10B981' },
  { id: 'cat_2', name: 'Servicios & Hogar', iconName: 'Home', color: '#6366F1' },
  { id: 'cat_3', name: 'Salidas & Restaurantes', iconName: 'Utensils', color: '#F59E0B' },
  { id: 'cat_4', name: 'Suscripciones', iconName: 'Tv', color: '#8B5CF6' },
  { id: 'cat_5', name: 'Transporte & Gasolina', iconName: 'Car', color: '#EF4444' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    title: 'Supermercado Mensual',
    amount: 145.20,
    currency: 'USD',
    type: 'expense',
    ownership: 'joint',
    paidByUserId: 'user_1',
    categoryId: 'cat_1',
    accountId: 'acc_2',
    date: '2026-08-22T14:30:00Z',
    note: 'Compras en el mercado central'
  },
  {
    id: 'tx_2',
    title: 'Internet & Luz',
    amount: 60.00,
    currency: 'USD',
    type: 'expense',
    ownership: 'joint',
    paidByUserId: 'user_2',
    categoryId: 'cat_2',
    accountId: 'acc_2',
    date: '2026-08-20T09:15:00Z'
  },
  {
    id: 'tx_3',
    title: 'Cena de Aniversario',
    amount: 85.00,
    currency: 'USD',
    type: 'expense',
    ownership: 'joint',
    paidByUserId: 'user_1',
    categoryId: 'cat_3',
    accountId: 'acc_1',
    date: '2026-08-18T20:45:00Z'
  },
  {
    id: 'tx_4',
    title: 'Suscripción Netflix & Spotify',
    amount: 22.99,
    currency: 'USD',
    type: 'expense',
    ownership: 'joint',
    paidByUserId: 'user_2',
    categoryId: 'cat_4',
    accountId: 'acc_3',
    date: '2026-08-15T11:00:00Z'
  }
];