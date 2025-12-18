
import { Transaction, TransactionType, User } from "../types";

/**
 * PRODUCTION SIMULATION
 * These represent the "Real" database state.
 */
const PROD_DB = {
  senders: ['credit_cards@icicibank.com'],
  transactions: [] as Transaction[],
  categories: ['Shopping', 'Food & Dining', 'Salary', 'Groceries', 'Utilities', 'Travel', 'Entertainment', 'Healthcare'],
  users: [{ id: '1', username: 'admin', password: 'password123', name: 'John Doe' }]
};

/**
 * DEMO DATA GENERATION
 */
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

// Lazy initialization for demo data
let DEMO_CACHE: Transaction[] | null = null;

/**
 * API SERVICE
 * In a real app, 'isDemo' logic would branch between 'fetch()' calls 
 * and local state management.
 */
export const api = {
  login: async (username: string, password: string): Promise<User | null> => {
    // REST: GET /api/auth/login
    await new Promise(r => setTimeout(r, 800));
    const user = PROD_DB.users.find(u => u.username === username && u.password === password);
    return user ? { ...user, isDemo: false } : null;
  },

  getSenders: async (isDemo: boolean = false): Promise<string[]> => {
    if (isDemo) return ['demo@secretapp.ai', 'alerts@bank.com'];
    // REST: GET /api/senders
    await new Promise(r => setTimeout(r, 400));
    return [...PROD_DB.senders];
  },

  postSender: async (sender: string, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return; // Don't persist in demo
    // REST: POST /api/senders
    await new Promise(r => setTimeout(r, 400));
    if (!PROD_DB.senders.includes(sender)) PROD_DB.senders.push(sender);
  },

  deleteSender: async (sender: string, isDemo: boolean = false): Promise<void> => {
    if (isDemo) return;
    // REST: DELETE /api/senders/${sender}
    PROD_DB.senders = PROD_DB.senders.filter(s => s !== sender);
  },

  getCategories: async (): Promise<string[]> => {
    // REST: GET /api/meta/categories
    return [...PROD_DB.categories];
  },

  getTransactions: async (filters: { dateFrom?: string; dateTo?: string; isDemo?: boolean }): Promise<Transaction[]> => {
    await new Promise(r => setTimeout(r, 600));
    
    let baseData: Transaction[] = [];
    if (filters.isDemo) {
      if (!DEMO_CACHE) DEMO_CACHE = generateDemoData();
      baseData = [...DEMO_CACHE];
    } else {
      // REST: GET /api/transactions?from=${dateFrom}&to=${dateTo}
      baseData = [...PROD_DB.transactions];
    }
    
    if (filters.dateFrom) {
      baseData = baseData.filter(t => t.transactionDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      baseData = baseData.filter(t => t.transactionDate <= filters.dateTo!);
    }
    
    return baseData;
  },

  postTransactions: async (txs: Transaction[], isDemo: boolean = false): Promise<void> => {
    if (isDemo) {
      // Just simulate success
      await new Promise(r => setTimeout(r, 400));
      return;
    }
    // REST: POST /api/transactions/bulk
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
    // REST: PATCH /api/transactions/${id}
    const idx = PROD_DB.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      PROD_DB.transactions[idx] = { ...PROD_DB.transactions[idx], ...updates };
    }
  }
};
