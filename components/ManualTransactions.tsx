import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Transaction, TransactionType } from '../types';
import { Save, X, Edit, Trash2, Search, Activity, Sparkles } from 'lucide-react';

interface ManualTransactionsProps {
  user: any;
  isDemo: boolean;
}

const ManualTransactions: React.FC<ManualTransactionsProps> = ({ user, isDemo }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    category: '',
    type: TransactionType.DEBIT,
    description: '',
    amount: 0
  });

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, [isDemo]);

  const loadCategories = async () => {
    const cats = await api.getCategories(isDemo);
    // if formData already has a category (e.g. when editing) make sure it's included
    if (formData.category && !cats.includes(formData.category)) {
      cats.unshift(formData.category);
    }
    setCategories(cats);
    if (cats.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: cats[0] }));
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const dateFrom = threeDaysAgo.toISOString().split('T')[0];
    const dateTo = new Date().toISOString().split('T')[0];

    const { transactions: txs } = await api.getTransactions({ dateFrom, dateTo, isDemo });
    setTransactions(txs);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.transactionDate || !formData.category || !formData.description || formData.amount <= 0) {
      alert('Please fill all fields');
      return;
    }

    try {
      if (editingTransaction) {
        await api.updateManualTransaction(editingTransaction.id, {
          transactionDate: formData.transactionDate,
          amount: formData.amount,
          type: formData.type,
          description: formData.description,
          category: formData.category
        }, isDemo);
      } else {
        await api.createTransaction({
          transactionDate: formData.transactionDate,
          amount: formData.amount,
          type: formData.type,
          description: formData.description,
          category: formData.category
        }, isDemo);
      }
      resetForm();
      loadTransactions();
    } catch (error) {
      alert('Failed to save transaction');
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    // make sure the selected category is available in the dropdown
    if (transaction.category && !categories.includes(transaction.category)) {
      setCategories(prev => [transaction.category, ...prev]);
    }
    // date inputs expect YYYY-MM-DD only, strip any time portion we may have received
    const dateOnly = transaction.transactionDate ? transaction.transactionDate.split('T')[0] : '';
    setFormData({
      transactionDate: dateOnly,
      category: transaction.category,
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.deleteTransaction(id, isDemo);
      loadTransactions();
    } catch (error) {
      alert('Failed to delete transaction');
    }
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      transactionDate: new Date().toISOString().split('T')[0],
      category: categories[0] || '',
      type: TransactionType.DEBIT,
      description: '',
      amount: 0
    });
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            {/* <Database size={24} /> */}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manual Transactions</h2>
            <p className="text-slate-500 text-sm mt-1">Add and manage your manual expense entries</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Transaction Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Ledger Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TransactionType }))}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
              >
                <option value={TransactionType.CREDIT}>Credit</option>
                <option value={TransactionType.DEBIT}>Debit</option>
                <option value={TransactionType.INVESTMENT}>Investment</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none"
              rows={3}
            />
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
              <Save size={18} /> Save
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2">
              <X size={18} /> Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-24 flex flex-col items-center gap-6">
            <div className="relative">
              <Activity size={64} className="text-indigo-600 animate-pulse" />
              <Sparkles size={24} className="text-purple-500 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">Loading Transactions...</p>
              <p className="text-slate-400 text-sm mt-2 font-medium">Retrieving your manual entries</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{tx.transactionDate.split('T')[0]}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.description}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">${tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(tx)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManualTransactions;