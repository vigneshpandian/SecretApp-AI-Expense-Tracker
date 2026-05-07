import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  demoMode: boolean;
}

interface MonthlyInvestment {
  month: string;
  amount: number;
  decline: number;
}

const InvestmentsReport: React.FC<Props> = ({ demoMode }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const defaultDateFrom = `${currentYear}-01-01`;
  const defaultDateTo = today.toISOString().split('T')[0];

  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filters
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [filterType, setFilterType] = useState<TransactionType[]>([TransactionType.INVESTMENT]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string[]>(['Investments']);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Investment slider
  const [investmentThreshold, setInvestmentThreshold] = useState(100000); // 1 lakh default

  useEffect(() => {
    fetchInitialData();
  }, [demoMode, dateFrom, dateTo, filterType, filterCategory]);

  const fetchInitialData = async () => {
    setLoading(true);
    const ledgerType = filterType.flatMap(t => 
      t === TransactionType.CREDIT ? ['Income'] : 
      t === TransactionType.DEBIT ? ['Expense'] : 
      ['Investments']
    );
    const cats = filterCategory;
    const [result, catsList] = await Promise.all([
      api.getTransactions({ dateFrom, dateTo, categories: cats, ledgerType, isDemo: demoMode }),
      api.getCategories(demoMode)
    ]);
    setData(result.transactions);
    setCategories(catsList);
    setLoading(false);
  };

  const generateMonthlyData = (): MonthlyInvestment[] => {
    const monthlyMap: Record<string, number> = {};
    const monthDates: Record<string, Date> = {};
    
    data.forEach(tx => {
      const date = new Date(tx.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = 0;
        monthDates[monthKey] = date;
      }
      monthlyMap[monthKey] += tx.amount;
    });

    return Object.entries(monthlyMap)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, amount]) => {
        const date = monthDates[key];
        const monthDisplay = date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
        const decline = Math.max(0, investmentThreshold - amount);
        
        return {
          month: monthDisplay,
          amount,
          decline
        };
      });
  };

  const monthlyData = generateMonthlyData();
  const totalInvestments = data.reduce((sum, tx) => sum + tx.amount, 0);
  const averageMonthlyInvestment = monthlyData.length > 0 ? totalInvestments / monthlyData.length : 0;
  const totalTarget = investmentThreshold * monthlyData.length;
  const balanceLeft = Math.max(0, totalTarget - totalInvestments);
  const momentum = monthlyData.length >= 2 
    ? ((monthlyData[monthlyData.length - 1].amount - monthlyData[monthlyData.length - 2].amount) / monthlyData[monthlyData.length - 2].amount) * 100 
    : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1e7) return '₹' + (value / 1e7).toFixed(2) + 'Cr';
    if (value >= 1e5) return '₹' + (value / 1e5).toFixed(2) + 'L';
    return '₹' + value.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
          <TrendingUp size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Investment Report</h2>
          <p className="text-slate-500 text-sm mt-0.5">Track your investment portfolio month by month</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
          <input 
            type="date" 
            value={dateTo} 
            onChange={e => setDateTo(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Types</label>
          <div className="relative">
            <div 
              className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-green-500"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            >
              {filterType.length === 0 ? 'All Types' : filterType.join(', ')}
            </div>
            {isTypeDropdownOpen && (
              <div className="absolute top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 w-full max-h-48 overflow-y-auto">
                <input 
                  type="text" 
                  placeholder="Search types..." 
                  value={typeSearch} 
                  onChange={e => setTypeSearch(e.target.value)} 
                  className="w-full px-2 py-1 text-xs border-b border-slate-200 outline-none"
                />
                <div className="p-2 space-y-1">
                  {[TransactionType.CREDIT, TransactionType.DEBIT, TransactionType.INVESTMENT]
                    .filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()))
                    .map(t => (
                    <label key={t} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                      <input 
                        type="checkbox" 
                        checked={filterType.includes(t)} 
                        onChange={() => {
                          if (filterType.includes(t)) {
                            setFilterType(filterType.filter(type => type !== t));
                          } else {
                            setFilterType([...filterType, t]);
                          }
                        }}
                        className="w-3 h-3"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Categories</label>
          <div className="relative">
            <div 
              className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-green-500"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            >
              {filterCategory.length === 0 ? 'All Categories' : filterCategory.join(', ')}
            </div>
            {isCategoryDropdownOpen && (
              <div className="absolute top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 w-full max-h-48 overflow-y-auto">
                <input 
                  type="text" 
                  placeholder="Search categories..." 
                  value={categorySearch} 
                  onChange={e => setCategorySearch(e.target.value)} 
                  className="w-full px-2 py-1 text-xs border-b border-slate-200 outline-none"
                />
                <div className="p-2 space-y-1">
                  {categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
                    <label key={c} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                      <input 
                        type="checkbox" 
                        checked={filterCategory.includes(c)} 
                        onChange={() => {
                          if (filterCategory.includes(c)) {
                            setFilterCategory(filterCategory.filter(cat => cat !== c));
                          } else {
                            setFilterCategory([...filterCategory, c]);
                          }
                        }}
                        className="w-3 h-3"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Investments</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalInvestments)}</p>
              <p className="text-xs text-slate-500 mt-1">{data.length} transactions</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Average Monthly</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(averageMonthlyInvestment)}</p>
              <p className="text-xs text-slate-500 mt-1">{monthlyData.length} months tracked</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Target</p>
              <p className="text-xl font-black text-green-600">{formatCurrency(investmentThreshold)}</p>
              <p className="text-xs text-slate-500 mt-1">Per month target</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Target</p>
              <p className="text-xl font-black text-blue-600">{formatCurrency(totalTarget)}</p>
              <p className="text-xs text-slate-500 mt-1">Cumulative target</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Balance Left</p>
              <p className="text-xl font-black text-orange-600">{formatCurrency(balanceLeft)}</p>
              <p className="text-xs text-slate-500 mt-1">To achieve target</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Momentum</p>
              <p className="text-xl font-black text-purple-600">{momentum > 0 ? '+' : ''}{momentum.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">Monthly change</p>
            </div>
          </div>

          {/* Investment Slider */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Monthly Investment Target</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={investmentThreshold}
                  onChange={e => setInvestmentThreshold(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="text-lg font-bold text-green-600 min-w-fit">
                  {formatCurrency(investmentThreshold)}
                </div>
              </div>
              <p className="text-xs text-slate-500">Adjust the slider to set your target monthly investment amount</p>
            </div>
          </div>

          {/* Monthly Investment Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Monthly Investment Trend</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    labelFormatter={label => `Month: ${label}`}
                    formatter={(value, name) => {
                      if (name === 'amount') return [formatCurrency(value), 'Investment'];
                      if (name === 'decline') return [formatCurrency(value), 'Below Target'];
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} name="Investment">
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.amount >= investmentThreshold ? '#10b981' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="decline" fill="#fca5a5" radius={[4, 4, 0, 0]} name="Below Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{tx.transactionDate.split('T')[0]}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{tx.description}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase tracking-tighter">{tx.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-green-600">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No investment records found for the selected filters.</td>
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

export default InvestmentsReport;
