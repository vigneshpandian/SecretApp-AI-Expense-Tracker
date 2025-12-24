
import { Transaction, TransactionType, User } from "../types";

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

  getSenders: async (isDemo: boolean = false): Promise<string[]> => {
    if (isDemo) return ['demo@secretapp.ai', 'alerts@bank.com'];
    
    // PRODUCTION: GET /api/v1/senders
    // const res = await fetch(`${BASE_URL}/senders`, { headers: getHeaders() });
    // return res.json();
    
    await new Promise(r => setTimeout(r, 400));
    return [...PROD_DB.senders];
  },

  postSender: async (sender: string, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return;
    // REAL: POST /api/v1/senders
    await new Promise(r => setTimeout(r, 400));
    if (!PROD_DB.senders.includes(sender)) PROD_DB.senders.push(sender);
  },

  deleteSender: async (sender: string, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return;
    // REAL: DELETE /api/v1/senders/${sender}
    PROD_DB.senders = PROD_DB.senders.filter(s => s !== sender);
  },

  getCategories: async (): Promise<string[]> => {
    return [...PROD_DB.categories];
  },

  getTransactions: async (filters: { dateFrom?: string; dateTo?: string; isDemo?: boolean }): Promise<Transaction[]> => {
    if (filters.isDemo) {
      if (!DEMO_CACHE) DEMO_CACHE = generateDemoData();
      let base = [...DEMO_CACHE];
      if (filters.dateFrom) base = base.filter(t => t.transactionDate >= filters.dateFrom!);
      if (filters.dateTo) base = base.filter(t => t.transactionDate <= filters.dateTo!);
      return base;
    }

    // PRODUCTION: GET /api/v1/transactions
    // const params = new URLSearchParams(filters as any).toString();
    // const res = await fetch(`${BASE_URL}/transactions?${params}`, { headers: getHeaders() });
    // return res.json();
    
    await new Promise(r => setTimeout(r, 600));
    let baseData = [...PROD_DB.transactions];
    if (filters.dateFrom) baseData = baseData.filter(t => t.transactionDate >= filters.dateFrom!);
    if (filters.dateTo) baseData = baseData.filter(t => t.transactionDate <= filters.dateTo!);
    return baseData;
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

  updateTransaction: async (id: string, updates: Partial<Transaction>, isDemo: boolean = false): Promise<void> => {
    if (isDemo) {
      if (DEMO_CACHE) {
        const idx = DEMO_CACHE.findIndex(t => t.id === id);
        if (idx !== -1) DEMO_CACHE[idx] = { ...DEMO_CACHE[idx], ...updates };
      }
      return;
    }
    // REAL: PATCH /api/v1/transactions/${id}
    const idx = PROD_DB.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      PROD_DB.transactions[idx] = { ...PROD_DB.transactions[idx], ...updates };
    }
  }
};
