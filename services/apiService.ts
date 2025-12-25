
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

  getCategories: async (): Promise<string[]> => {
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

  getTransactions: async (filters: { dateFrom?: string; dateTo?: string; categories?: string[]; ledgerType?: string[]; isDemo?: boolean }): Promise<Transaction[]> => {
    if (filters.isDemo) {
      if (!DEMO_CACHE) DEMO_CACHE = generateDemoData();
      let base = [...DEMO_CACHE];
      if (filters.dateFrom) base = base.filter(t => t.transactionDate >= filters.dateFrom!);
      if (filters.dateTo) base = base.filter(t => t.transactionDate <= filters.dateTo!);
      return base;
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
        description: item.transactionNotes,
        category: item.categoryName,
        status: 'synced',
        createdAt: item.createdDate
      }));

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
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

  logout: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('categories');
  },
};
