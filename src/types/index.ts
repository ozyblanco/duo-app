export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  ownerId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  iconName?: string;
}

export interface SplitRatio {
  userA: number;
  userB: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date?: string;
  category?: string;
  categoryId?: string;
  paidBy?: string;
  paidByUserId?: string;
  splitRatio?: SplitRatio;
  currency?: string;
  createdAt?: string;
  note?: string;
  type?: 'income' | 'expense' | string;
  ownership?: 'joint' | 'individual' | string;
  accountId?: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  userContribution: number;
  partnerContribution: number;
  isCompleted?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'expense' | 'settlement' | 'goal' | 'system';
  link?: string;
}

export interface ExchangeRates {
  bcvUsd: number;
  bcvEur: number;
  binanceUsdt: number;
  lastUpdated: string;
}