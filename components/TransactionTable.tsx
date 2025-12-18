
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Edit2, Check, X } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onSync: (tx: Transaction) => void;
  onUpdate?: (id: string, updates: Partial<Transaction>) => void;
  isSyncing: boolean;
  categories?: string[];
}

const TransactionTable: React.FC<Props> = ({ transactions, onSync, onUpdate, isSyncing, categories = [] }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({ ...tx });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && onUpdate) {
      onUpdate(editingId, editForm);
      setEditingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
        <p className="text-slate-500">No transactions identified.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isEditing = editingId === tx.id;
              return (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={editForm.transactionDate} 
                        onChange={e => setEditForm({...editForm, transactionDate: e.target.value})}
                        className="bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : tx.transactionDate}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.description} 
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 w-full text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : tx.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {isEditing ? (
                      <select 
                        value={editForm.category} 
                        onChange={e => setEditForm({...editForm, category: e.target.value})}
                        className="bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-500">{tx.category}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                      tx.type === TransactionType.CREDIT ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                    ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16}/></button>
                          <button onClick={cancelEdit} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={16}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(tx)} className="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Edit"><Edit2 size={16}/></button>
                          {tx.status === 'synced' ? (
                            <span className="text-green-500 text-[10px] font-bold uppercase">Synced</span>
                          ) : (
                            <button 
                              onClick={() => onSync(tx)}
                              disabled={isSyncing}
                              className="text-[10px] font-bold uppercase bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 transition-all"
                            >
                              Sync
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
