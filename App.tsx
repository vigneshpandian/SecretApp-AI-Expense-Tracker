
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TransactionTable from './components/TransactionTable';
import SenderManager from './components/SenderManager';
import Login from './components/Login';
import Reports from './components/Reports';
import ManualTransactions from './components/ManualTransactions';
import Portfolio from './components/Portfolio';
import PortfolioData from './components/PortfolioData';
import { api } from './services/apiService';
import { Transaction, User, ViewType, Sender } from './types';
import { Activity, BarChart3, LogOut, Search, Scan, Database, Info, Calendar, RefreshCcw, Sparkles, TrendingUp } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('scanner');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Transaction Scanner Date Range
  const [scanDateFrom, setScanDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [scanDateTo, setScanDateTo] = useState(new Date().toISOString().split('T')[0]);

  const isDemo = user?.isDemo || false;

  // Helper to decode JWT payload
  const decodeJWT = (token: string) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Check for existing token and restore user
    const token = sessionStorage.getItem('auth_token');
    if (token && !user) {
      const payload = decodeJWT(token);
      if (payload) {
        const restoredUser: User = {
          id: payload.jti,
          username: payload.sub,
          name: `${payload.FirstName} ${payload.LastName}`,
          isDemo: false
        };
        setUser(restoredUser);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialAppData();
    }
  }, [user]);

  const loadInitialAppData = async () => {
    const [s, c] = await Promise.all([
      api.getSenders(isDemo), 
      api.getCategories(isDemo)
    ]);
    setSenders(s);
    setCategories(c);
  };

  const processEmails = useCallback(async () => {
    if (senders.length === 0) return;
    
    setLoading(true);
    setTransactions([]);
    setSelectedTransactionIds([]);
    try {
      const txs = await api.scanEmails(scanDateFrom, scanDateTo, isDemo);
      setTransactions(txs);
    } catch (error) {
      console.error("Workflow error:", error);
    } finally {
      setLoading(false);
    }
  }, [senders, scanDateFrom, scanDateTo, isDemo]);

  const handleToggleTransactionSelection = (id: string) => {
    setSelectedTransactionIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedTransactionIds(checked ? transactions.map(t => t.id) : []);
  };

  const handleSync = async (tx: Transaction) => {
    setSyncing(true);
    try {
      const result = await api.syncTransactions([tx.id], isDemo);
      if (result[tx.id]) {
        setTransactions(prev => prev.map(t => (t.id === tx.id) ? { ...t, status: 'synced' } : t));
      } else {
        setTransactions(prev => prev.map(t => (t.id === tx.id) ? { ...t, status: 'failed' } : t));
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkSync = async () => {
    const rowKeys = selectedTransactionIds.length > 0
      ? selectedTransactionIds
      : transactions.filter(t => t.status !== 'synced').map(t => t.id);

    if (rowKeys.length === 0) return;
    
    setSyncing(true);
    try {
      const result = await api.syncTransactions(rowKeys, isDemo);
      setTransactions(prev => prev.map(t => {
        if (!rowKeys.includes(t.id)) return t;
        const success = result[t.id];
        return success ? { ...t, status: 'synced' } : { ...t, status: 'failed' };
      }));
      setSelectedTransactionIds(prevSelected => prevSelected.filter(id => !rowKeys.includes(id)));
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

  const removeSender = async (rowKey: string) => {
    await api.deleteSender(rowKey, isDemo);
    const s = await api.getSenders(isDemo);
    setSenders(s);
  };

  const toggleDemoMode = () => {
    if (user) {
      setUser({ ...user, isDemo: !user.isDemo });
      setTransactions([]); 
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token');
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header demoMode={isDemo} onToggleDemo={toggleDemoMode} />
      
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <nav className="flex -mb-px">
              <button 
                onClick={() => setActiveView('scanner')}
                className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'scanner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Scan size={18} /> Transaction Scanner
              </button>
              <button 
                onClick={() => setActiveView('manual')}
                className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Database size={18} /> Manual Transactions
              </button>
            
              <button 
                onClick={() => setActiveView('portfolio')}
                className={`flex items-center gap-2 py-4 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeView === 'portfolio' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingUp size={18} /> Portfolio
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
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-xs font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
          {(activeView === 'portfolio' || activeView === 'portfolioData') && (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('portfolio')}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    activeView === 'portfolio' ? 'bg-white text-slate-900 border-slate-300 shadow-sm' : 'text-slate-500 border-transparent hover:border-slate-200 hover:text-slate-900'
                  }`}
                >
                  Portfolio Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('portfolioData')}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    activeView === 'portfolioData' ? 'bg-white text-slate-900 border-slate-300 shadow-sm' : 'text-slate-500 border-transparent hover:border-slate-200 hover:text-slate-900'
                  }`}
                >
                  Portfolio Data
                </button>
              </div>
            </div>
          )}
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
              <p className="text-xs text-indigo-700 mt-0.5">Mocking your future .NET API responses. Ready for deployment.</p>
            </div>
          </div>
        )}

        {activeView === 'scanner' ? (
          <div className="animate-in fade-in duration-500">
            <SenderManager senders={senders} onAdd={addSender} onRemove={removeSender} />

            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Scan & Extract</h2>
                    <p className="text-slate-500 text-sm mt-1">AI-powered ledger from your bank emails</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">From Date</label>
                    <input 
                      type="date" 
                      value={scanDateFrom}
                      onChange={(e) => setScanDateFrom(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">To Date</label>
                    <input 
                      type="date" 
                      value={scanDateTo}
                      onChange={(e) => setScanDateTo(e.target.value)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={processEmails}
                      disabled={loading}
                      className="px-6 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <RefreshCcw size={18} className="animate-spin" /> : <Search size={18} />}
                      Scan Inbox
                    </button>
                    <button 
                      onClick={handleBulkSync}
                      disabled={syncing || transactions.length === 0 || (selectedTransactionIds.length === 0 && transactions.every(t => t.status === 'synced'))}
                      className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Database size={18} />
                      {selectedTransactionIds.length > 0 ? `Sync Selected (${selectedTransactionIds.length})` : 'Sync All'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-24 flex flex-col items-center gap-6 shadow-sm">
                <div className="relative">
                  <Activity size={64} className="text-indigo-600 animate-pulse" />
                  <Sparkles size={24} className="text-purple-500 absolute -top-2 -right-2 animate-bounce" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">Retrieving Transactions...</p>
                  <p className="text-slate-400 text-sm mt-2 font-medium">Communicating with your .NET secure endpoint</p>
                </div>
              </div>
            ) : (
              <TransactionTable 
                transactions={transactions} 
                selectedIds={selectedTransactionIds}
                onToggleSelect={handleToggleTransactionSelection}
                onToggleSelectAll={handleToggleSelectAll}
                onSync={handleSync} 
                onUpdate={handleUpdateTransaction}
                isSyncing={syncing}
                categories={categories}
              />
            )}
          </div>
        ) : activeView === 'portfolioData' ? (
          <PortfolioData />
        ) : activeView === 'portfolio' ? (
          <Portfolio demoMode={isDemo} />
        ) : activeView === 'reports' ? (
          <Reports demoMode={isDemo} />
        ) : activeView === 'manual' ? (
          <ManualTransactions user={user} isDemo={isDemo} />
        ) : null}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Status: Operational • v2.1-Ready</span>
          </div>
          <div>© 2026 SecretApp Ai • Enterprise Edition</div>
          <div className="flex gap-6">
            <span className="text-indigo-600">User Context: {user.name}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
