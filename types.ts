
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

export type ViewType = 'scanner' | 'transactions' | 'reports' | 'senders' | 'manual' | 'portfolio' | 'portfolioData' | 'investmentsReport';

export interface MutualFundHolding {
  folio: string;
  isin: string;
  name: string;
  plan: 'Direct' | 'Regular';
  units: number;
  costValue: number;
  schemeCode: string;
  tags: string[];
  nav?: number;
  currentValue?: number;
  navSource?: 'live' | 'fallback';
}

export interface PortfolioSummary {
  totalPortfolioValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  directPlansValue: number;
  directPlansCount: number;
  regularPlansValue: number;
  regularPlansCount: number;
}

export interface PortfolioDataItem {
  portfolioId: string;
  isDeleted: boolean;
  emailId: string;
  fundName: string;
  isninCode: string;
  plan: string;
  units: string;
  unitValue: string;
  investedValue: string;
  tags: string[];
  notes: string;
  fundType: string;
  currentMarketValue: string;
  source: string;
  folioNo: string;
  riskLevel: string;
  createdOn: string;
  modifiedOn: string;
  rowKey: string;
  transactionNotes: string;
}
