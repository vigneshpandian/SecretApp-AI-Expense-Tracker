
import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Calendar, Download, Search, Filter } from 'lucide-react';

interface Props {
  demoMode: boolean;
}

const Reports: React.FC<Props> = ({ demoMode }) => {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState<'All' | TransactionType>('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [demoMode, dateFrom, dateTo]);

  const fetchInitialData = async () => {
    setLoading(true);
    const [txs, cats] = await Promise.all([
      api.getTransactions({ dateFrom, dateTo, isDemo: demoMode }),
      api.getCategories()
    ]);
    setData(txs);
    setCategories(cats);
    setLoading(false);
  };

  const filteredData = data.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.amount.toString().includes(searchTerm);
    const matchesType = filterType === 'All' || t.type === filterType;
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const chartData = [
    { name: 'Credits', value: filteredData.filter(t => t.type === TransactionType.CREDIT).reduce((acc, t) => acc + t.amount, 0) },
    { name: 'Debits', value: filteredData.filter(t => t.type === TransactionType.DEBIT).reduce((acc, t) => acc + t.amount, 0) },
  ];

  const categoryChartData = categories.map(cat => ({
    name: cat,
    value: filteredData.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0)
  })).filter(c => c.value > 0);

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
          <input 
            type="date" 
            value={dateTo} 
            onChange={e => setDateTo(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as any)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Types</option>
            <option value={TransactionType.CREDIT}>Credits</option>
            <option value={TransactionType.DEBIT}>Debits</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-white text-slate-900 border border-slate-200 rounded pl-7 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Cash Flow</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Category Spend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{tx.transactionDate}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{tx.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-tighter">{tx.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          tx.type === TransactionType.CREDIT ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-bold text-right ${tx.type === TransactionType.CREDIT ? 'text-green-600' : 'text-slate-900'}`}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No records found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
