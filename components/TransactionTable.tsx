
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Edit2, Check, X, CreditCard } from 'lucide-react';

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
        <p className="text-slate-500 font-medium">No transactions identified from your emails.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isEditing = editingId === tx.id;
              return (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={editForm.transactionDate} 
                        onChange={e => setEditForm({...editForm, transactionDate: e.target.value})}
                        className="bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : tx.transactionDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm.description} 
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                            className="bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 w-full text-xs outline-none"
                          />
                        ) : tx.description}
                      </span>
                      {isEditing ? (
                        <select 
                          value={editForm.type} 
                          onChange={e => setEditForm({...editForm, type: e.target.value as TransactionType})}
                          className="bg-white text-slate-900 border border-slate-200 rounded px-2 py-1 text-xs outline-none mt-1"
                        >
                          <option value={TransactionType.CREDIT}>Credit</option>
                          <option value={TransactionType.DEBIT}>Debit</option>
                          <option value={TransactionType.INVESTMENT}>Investment</option>
                        </select>
                      ) : (
                        tx.cardLast4 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <CreditCard size={10} className="text-slate-400" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ICICI • {tx.cardLast4}</span>
                          </div>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <>
                        <input 
                          list={`categories-${tx.id}`}
                          value={editForm.category} 
                          onChange={e => setEditForm({...editForm, category: e.target.value})}
                          className="bg-white text-slate-900 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                          placeholder="Select or type category"
                        />
                        <datalist id={`categories-${tx.id}`}>
                          {categories.map(c => <option key={c} value={c} />)}
                        </datalist>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 bg-indigo-50 rounded text-[10px] font-black text-indigo-600 uppercase tracking-tighter border border-indigo-100">{tx.category}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black ${tx.type === TransactionType.CREDIT ? 'text-green-600' : 'text-slate-900'}`}>
                        {tx.type === TransactionType.CREDIT ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={saveEdit} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm"><Check size={14}/></button>
                          <button onClick={cancelEdit} className="p-1.5 text-white bg-red-400 hover:bg-red-500 rounded-lg shadow-sm"><X size={14}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(tx)} disabled={tx.status === 'synced'} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed" title={tx.status === 'synced' ? 'Cannot edit synced transactions' : 'Edit'}><Edit2 size={16}/></button>
                          {tx.status === 'synced' ? (
                            <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded border border-green-100">Synced</span>
                          ) : tx.status === 'failed' ? (
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded border border-red-100">Failed</span>
                          ) : (
                            <button 
                              onClick={() => onSync(tx)}
                              disabled={isSyncing}
                              className="text-[10px] font-black uppercase bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
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
