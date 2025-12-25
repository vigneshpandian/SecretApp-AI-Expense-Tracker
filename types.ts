
export enum TransactionType {
  CREDIT = 'Credit',
  DEBIT = 'Debit',
  INVESTMENT = 'Investment'
}

export interface Transaction {
  id: string;
  transactionDate: string;
  amount: number;
  type: TransactionType;
  description: string;
  category: string;
  cardLast4?: string;
  status: 'pending' | 'synced' | 'failed';
  createdAt?: string;
}

export interface Sender {
  email: string;
  rowKey: string;
}

export interface EmailData {
  id: string;
  sender: string;
  snippet: string;
  date: string;
  body: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  isDemo?: boolean;
  token?: string;
}

export type ViewType = 'scanner' | 'reports';
