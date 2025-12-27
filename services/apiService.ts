
import { Transaction, TransactionType, User, Sender } from "../types";

/**
 * PRODUCTION API CONFIGURATION
 */
const BASE_URL = import.meta.env.VITE_BASE_URL || '/api/v1';
console.log('BASE_URL:', BASE_URL);

// Helper to get headers with OAuth token
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
    // In production, the token would be stored in a secure cookie or session
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * MOCK DB FOR DEMO MODE
 */
const PROD_DB = {
  senders: ['credit_cards@icicibank.com'],
  transactions: [] as Transaction[],
  categories: ['Shopping', 'Food & Dining', 'Salary', 'Groceries', 'Utilities', 'Travel', 'Entertainment', 'Healthcare']
};

let DEMO_CACHE: Transaction[] | null = null;

const generateDemoData = (): Transaction[] => {
  const categories = PROD_DB.categories;
  const data: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    for (let j = 0; j < 2; j++) {
      const isCredit = Math.random() > 0.8;
      data.push({
        id: `demo_${i}_${j}`,
        transactionDate: dateStr,
        amount: isCredit ? Math.floor(Math.random() * 50000) + 10000 : Math.floor(Math.random() * 2000) + 50,
        type: isCredit ? TransactionType.CREDIT : TransactionType.DEBIT,
        description: isCredit ? "Salary Disbursement" : `Merchant Ref: ${Math.random().toString(36).substring(7)}`,
        category: isCredit ? "Salary" : categories[Math.floor(Math.random() * (categories.length - 1))],
        status: 'synced',
        createdAt: new Date().toISOString()
      });
    }
  }
  return data;
};

// Helper to decode JWT payload
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const api = {
  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/Authorize?name=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      const token = data.access_token;
      
      sessionStorage.setItem('auth_token', token);
      
      // Decode token to extract user info
      const payload = decodeJWT(token);
      if (!payload) return null;
      
      const user: User = {
        id: payload.jti,
        username: payload.sub,
        name: `${payload.FirstName} ${payload.LastName}`,
        isDemo: false
      };
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  },

  getSenders: async (isDemo: boolean = false): Promise<Sender[]> => {
    if (isDemo) return [{ email: 'demo@secretapp.ai', rowKey: 'demo1' }, { email: 'alerts@bank.com', rowKey: 'demo2' }];
    
    try {
      const res = await fetch(`${BASE_URL}/configuration/trackers`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch senders');
      const data = await res.json();
      return data.map((item: any) => ({ email: item.senderEmail, rowKey: item.rowKey }));
    } catch (error) {
      console.error('Error fetching senders:', error);
      return [];
    }
  },

  postSender: async (sender: string, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return;
    try {
      const res = await fetch(`${BASE_URL}/configuration/trackers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ TrackingEmail: sender })
      });
      if (!res.ok) throw new Error('Failed to add sender');
    } catch (error) {
      console.error('Error adding sender:', error);
      throw error;
    }
  },

  deleteSender: async (rowKey: string, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return;
    try {
      const res = await fetch(`${BASE_URL}/configuration/trackers/${rowKey}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete sender');
    } catch (error) {
      console.error('Error deleting sender:', error);
      throw error;
    }
  },

  getCategories: async (isDemo: boolean = false): Promise<string[]> => {
    if (isDemo) {
      return PROD_DB.categories;
    }
    
    const cached = sessionStorage.getItem('categories');
    if (cached) {
      return JSON.parse(cached);
    }
    
    try {
      const res = await fetch(`${BASE_URL}/configuration/category/all`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      const categories = data.map((item: any) => item.categoryName);
      sessionStorage.setItem('categories', JSON.stringify(categories));
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  getTransactions: async (filters: { dateFrom?: string; dateTo?: string; categories?: string[]; ledgerType?: string[]; isDemo?: boolean }): Promise<{ transactions: Transaction[]; totals: { totalIncome: number; totalExpense: number; totalInvestments: number } }> => {
    if (filters.isDemo) {
      if (!DEMO_CACHE) DEMO_CACHE = generateDemoData();
      let base = [...DEMO_CACHE];
      if (filters.dateFrom) base = base.filter(t => t.transactionDate >= filters.dateFrom!);
      if (filters.dateTo) base = base.filter(t => t.transactionDate <= filters.dateTo!);
      const totalIncome = base.filter(t => t.type === TransactionType.CREDIT).reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = base.filter(t => t.type === TransactionType.DEBIT).reduce((sum, t) => sum + t.amount, 0);
      const totalInvestments = base.filter(t => t.type === TransactionType.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);
      return { transactions: base, totals: { totalIncome, totalExpense, totalInvestments } };
    }

    try {
      const startDate = filters.dateFrom ? `${filters.dateFrom}T00:00:00` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] + 'T00:00:00';
      const endDate = filters.dateTo ? `${filters.dateTo}T00:00:00` : new Date().toISOString().split('T')[0] + 'T00:00:00';

      const body = {
        startDate,
        endDate,
        isCCTransaction: false,
        isCashTransaction: false,
        categories: filters.categories || [],
        ledgerType: filters.ledgerType || []
      };

      const res = await fetch(`${BASE_URL}/statistics/ledgerReport`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed to fetch transactions');

      const data = await res.json();
      const transactions: Transaction[] = data.secretUserTransactions.map((item: any) => ({
        id: item.ledgerId,
        transactionDate: item.transactionDate,
        amount: parseFloat(item.transactionAmount),
        type: item.ledgerType === 'Expense' ? TransactionType.DEBIT : item.ledgerType === 'Income' ? TransactionType.CREDIT : item.ledgerType === 'Investments' ? TransactionType.INVESTMENT : TransactionType.DEBIT,
        description: item.transactionNotes || '',
        category: item.categoryName || '',
        status: 'synced',
        createdAt: item.createdDate
      }));

      const totals = {
        totalIncome: data.totalIncome || 0,
        totalExpense: data.totalExpense || 0,
        totalInvestments: data.totalInvestments || 0
      };

      return { transactions, totals };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { transactions: [], totals: { totalIncome: 0, totalExpense: 0, totalInvestments: 0 } };
    }
  },

  postTransactions: async (txs: Transaction[], isDemo: boolean = false): Promise<void> => {
    if (isDemo) {
      await new Promise(r => setTimeout(r, 400));
      return;
    }
    // REAL: POST /api/v1/transactions/bulk
    await new Promise(r => setTimeout(r, 600));
    txs.forEach(tx => {
      const exists = PROD_DB.transactions.find(existing => 
        existing.transactionDate === tx.transactionDate && 
        existing.amount === tx.amount && 
        existing.description === tx.description
      );
      if (!exists) {
        PROD_DB.transactions.push({ ...tx, status: 'synced', createdAt: new Date().toISOString() });
      }
    });
  },

  extractTransactionsFromEmail: async (emailText: string, isDemo: boolean = false): Promise<Transaction[]> => {
    if (isDemo) {
      // In demo mode, return mock extracted transactions
      await new Promise(r => setTimeout(r, 800));
      const mockTransactions: Transaction[] = [
        {
          id: `extracted_demo_${Date.now()}_1`,
          transactionDate: new Date().toISOString().split('T')[0],
          amount: 2500,
          type: TransactionType.DEBIT,
          description: "AMAZON INDIA",
          category: "Shopping",
          status: 'pending',
          cardLast4: '1234'
        },
        {
          id: `extracted_demo_${Date.now()}_2`,
          transactionDate: new Date().toISOString().split('T')[0],
          amount: 450,
          type: TransactionType.DEBIT,
          description: "ZOMATO",
          category: "Food & Dining",
          status: 'pending',
          cardLast4: '4321'
        }
      ];
      return mockTransactions;
    }

    try {
      const res = await fetch(`${BASE_URL}/ai/extract-transactions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ emailText })
      });

      if (!res.ok) throw new Error('Failed to extract transactions');

      const data = await res.json();
      const transactions: Transaction[] = data.transactions.map((item: any) => ({
        id: item.id || Math.random().toString(36).substring(2, 11),
        transactionDate: item.transactionDate,
        amount: item.amount,
        type: item.type === 'Credit' ? TransactionType.CREDIT : TransactionType.DEBIT,
        description: item.description,
        category: item.category,
        cardLast4: item.cardLast4,
        status: 'pending'
      }));

      return transactions;
    } catch (error) {
      console.error('Error extracting transactions:', error);
      return [];
    }
  },

  scanEmails: async (startDate: string, endDate: string, isDemo: boolean = false): Promise<Transaction[]> => {
    if (isDemo) {
      // In demo mode, return demo transactions
      if (!DEMO_CACHE) DEMO_CACHE = generateDemoData();
      let base = [...DEMO_CACHE];
      base = base.filter(t => t.transactionDate >= startDate && t.transactionDate <= endDate);
      return base.map(t => ({ ...t, status: 'pending' }));
    }

    try {
      const res = await fetch(`${BASE_URL}/transaction/ScanEmails?startDate=${startDate}&endDate=${endDate}T23:59:59`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to scan emails');
      const data = await res.json();
      const transactions: Transaction[] = data.map((item: any) => ({
        id: item.rowKey,
        transactionDate: item.transactionDate,
        amount: parseFloat(item.transactionAmount),
        type: item.transactionType === 'Debit' ? TransactionType.DEBIT : TransactionType.CREDIT,
        description: item.transactionNotes,
        category: item.category || '',
        status: item.status === 'Synced' ? 'synced' : 'pending',
      }));
      return transactions;
    } catch (error) {
      console.error('Error scanning emails:', error);
      return [];
    }
  },

  updateTransaction: async (rowKey: string, updates: Partial<Transaction>, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return;
    try {
      const body = {
        RowKey: rowKey,
        Category: updates.category,
        TransactionNotes: updates.description,
        TransactionDate: updates.transactionDate,
        TransactionAmount: updates.amount?.toString(),
        TransactionType: updates.type === TransactionType.DEBIT ? 'Debit' : 'Credit'
      };
      const res = await fetch(`${BASE_URL}/transaction/ScanEmails`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to update transaction');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  syncTransactions: async (rowKeys: string[], isDemo: boolean = false): Promise<Record<string, boolean>> => {
    if (isDemo) {
      // Simulate sync
      const result: Record<string, boolean> = {};
      rowKeys.forEach(key => result[key] = true);
      await new Promise(r => setTimeout(r, 1000));
      return result;
    }

    try {
      const res = await fetch(`${BASE_URL}/transaction/ScanEmails/Sync`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(rowKeys)
      });
      if (!res.ok) throw new Error('Failed to sync transactions');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      return {};
    }
  },

  logout: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('categories');
  },
};
