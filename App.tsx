
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TransactionTable from './components/TransactionTable';
import SenderManager from './components/SenderManager';
import Login from './components/Login';
import Reports from './components/Reports';
import { fetchTodayEmails } from './services/gmailService';
import { extractTransactionsFromEmail } from './services/geminiService';
import { api } from './services/apiService';
import { Transaction, User, ViewType } from './types';
import { Activity, BarChart3, LogOut, Search, Scan, Database, Info } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('scanner');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [senders, setSenders] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const isDemo = user?.isDemo || false;

  useEffect(() => {
    if (user) {
      loadInitialAppData();
    }
  }, [user]);

  const loadInitialAppData = async () => {
    const [s, c] = await Promise.all([
      api.getSenders(isDemo), 
      api.getCategories()
    ]);
    setSenders(s);
    setCategories(c);
  };

  const processEmails = useCallback(async () => {
    if (senders.length === 0) return;
    
    setLoading(true);
    setTransactions([]);
    try {
      const emails = await fetchTodayEmails(senders);
      if (emails.length > 0) {
        setExtracting(true);
        const allTransactions: Transaction[] = [];
        for (const email of emails) {
          const extracted = await extractTransactionsFromEmail(email.body);
          allTransactions.push(...extracted);
        }
        setTransactions(allTransactions);
        setExtracting(false);
      }
    } catch (error) {
      console.error("Workflow error:", error);
    } finally {
      setLoading(false);
    }
  }, [senders]);

  const handleSync = async (tx: Transaction) => {
    setSyncing(true);
    try {
      await api.postTransactions([tx], isDemo);
      setTransactions(prev => prev.map(t => (t.id === tx.id) ? { ...t, status: 'synced' } : t));
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await api.updateTransaction(id, updates, isDemo);
  };

  const addSender = async (email: string) => {
    await api.postSender(email, isDemo);
    const s = await api.getSenders(isDemo);
    setSenders(s);
  };

  const removeSender = async (email: string) => {
    await api.deleteSender(email, isDemo);
    const s = await api.getSenders(isDemo);
    setSenders(s);
  };

  const toggleDemoMode = () => {
    if (user) {
      setUser({ ...user, isDemo: !user.isDemo });
      setTransactions([]); // Clear current view
    }
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header demoMode={isDemo} onToggleDemo={toggleDemoMode} />
      
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <nav className="flex -mb-px">
              <button 
                onClick={() => setActiveView('scanner')}
                className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'scanner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Scan size={18} /> Daily Scanner
              </button>
              <button 
                onClick={() => setActiveView('reports')}
                className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <BarChart3 size={18} /> Reports & Analytics
              </button>
            </nav>
            <button 
              onClick={() => setUser(null)}
              className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-xs font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isDemo && (
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <Info size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">Demo Environment Active</p>
              <p className="text-xs text-indigo-700 mt-0.5">You are viewing sample data. Changes made here will not affect your real accounts.</p>
            </div>
          </div>
        )}

        {activeView === 'scanner' ? (
          <div className="animate-in fade-in duration-500">
            <SenderManager senders={senders} onAdd={addSender} onRemove={removeSender} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Today's Extractions</h2>
                <p className="text-slate-500 text-sm">Automated scan results from configured bank senders</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={processEmails}
                  disabled={loading || extracting}
                  className="flex-grow sm:flex-grow-0 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Search size={16} /> Scan Inbox
                </button>
                <button 
                  onClick={() => {
                    const pending = transactions.filter(t => t.status !== 'synced');
                    api.postTransactions(pending, isDemo).then(() => {
                      setTransactions(prev => prev.map(t => ({ ...t, status: 'synced' })));
                    });
                  }}
                  disabled={syncing || transactions.length === 0 || transactions.every(t => t.status === 'synced')}
                  className="flex-grow sm:flex-grow-0 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  <Database size={16} className="inline mr-2" /> Sync to Records
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center gap-4 shadow-sm">
                <Activity size={48} className="text-indigo-600 animate-pulse" />
                <p className="text-slate-500 font-medium italic">Fetching emails from {senders.length} sources...</p>
              </div>
            ) : (
              <TransactionTable 
                transactions={transactions} 
                onSync={handleSync} 
                onUpdate={handleUpdateTransaction}
                isSyncing={syncing}
                categories={categories}
              />
            )}
          </div>
        ) : (
          <Reports demoMode={isDemo} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <div>© 2024 SecretApp Ai • v2.0 Enterprise</div>
          <div className="flex gap-4">
            <span className="text-indigo-600">Active User: {user.name}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
