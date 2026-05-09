import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SlidersHorizontal } from 'lucide-react';

interface Props {
  demoMode: boolean;
}

const ExpenseBudgetReport: React.FC<Props> = ({ demoMode }) => {
  const today = new Date();
  const defaultDateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultDateTo = today.toISOString().split('T')[0];

  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [filterType, setFilterType] = useState<TransactionType[]>([TransactionType.DEBIT]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryThresholds, setCategoryThresholds] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleCategoryToggle = (category: string) => {
    setFilterCategory(prev => {
      if (prev.includes(category)) {
        setCategoryThresholds(thresholds => {
          const next = { ...thresholds };
          delete next[category];
          return next;
        });
        return prev.filter(cat => cat !== category);
      }

      setCategoryThresholds(thresholds => ({
        ...thresholds,
        [category]: thresholds[category] || 5000
      }));
      return [...prev, category];
    });
  };

  const handleThresholdChange = (category: string, value: number) => {
    setCategoryThresholds(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const filteredData = data.filter(t => {
    const matchesSearch = (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      t.amount.toString().includes(searchTerm);
    return matchesSearch;
  });

  const categorySpend = filterCategory.reduce<Record<string, number>>((acc, category) => {
    const amount = filteredData
      .filter(tx => tx.category === category)
      .reduce((sum, tx) => sum + tx.amount, 0);
    acc[category] = amount;
    return acc;
  }, {});

  const selectedThresholdedCategories = filterCategory.filter(category => categoryThresholds[category] !== undefined);

  const totalSpend = selectedThresholdedCategories.reduce((sum, category) => sum + (categorySpend[category] || 0), 0);
  const totalThreshold = selectedThresholdedCategories.reduce((sum, category) => sum + (categoryThresholds[category] || 0), 0);
  const budgetBalance = totalThreshold - totalSpend;

  const budgetChartData = selectedThresholdedCategories.map(category => ({
    name: category,
    spent: categorySpend[category] || 0,
    threshold: categoryThresholds[category] || 0
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1e7) return '₹' + (value / 1e7).toFixed(2) + 'Cr';
    if (value >= 1e5) return '₹' + (value / 1e5).toFixed(2) + 'L';
    return '₹' + value.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
          <SlidersHorizontal size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expense Budget Report</h2>
          <p className="text-slate-500 text-sm mt-0.5">Track category budgets and compare spending against thresholds.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Types</label>
          <div className="relative">
            <div
              className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-amber-500"
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
              className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-amber-500"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            >
              {filterCategory.length === 0 ? 'Select categories' : filterCategory.join(', ')}
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
                        onChange={() => handleCategoryToggle(c)}
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

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Search Transactions</label>
          <input
            type="text"
            placeholder="Search in descriptions or amounts"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-xs bg-white text-slate-900 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Selected categories</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{filterCategory.length || 0} selected</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setFilterCategory([])}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              Clear categories
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Budget Categories</p>
              <p className="text-xl font-black text-slate-900">{selectedThresholdedCategories.length}</p>
              <p className="text-xs text-slate-500 mt-1">Categories with thresholds</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Spend</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(totalSpend)}</p>
              <p className="text-xs text-slate-500 mt-1">Within selected categories</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Threshold</p>
              <p className="text-xl font-black text-amber-700">{formatCurrency(totalThreshold)}</p>
              <p className="text-xs text-slate-500 mt-1">Planned budget amount</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Budget Balance</p>
              <p className={`text-xl font-black ${budgetBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(budgetBalance)}</p>
              <p className="text-xs text-slate-500 mt-1">Remaining vs threshold</p>
            </div>
          </div>

          {selectedThresholdedCategories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Budget Comparison</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetChartData}>
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Spent" />
                        <Bar dataKey="threshold" fill="#10b981" radius={[4, 4, 0, 0]} name="Threshold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Category Thresholds</h3>
                  <div className="space-y-4">
                    {selectedThresholdedCategories.map(category => {
                      const threshold = categoryThresholds[category] || 0;
                      const spent = categorySpend[category] || 0;
                      const progress = threshold > 0 ? Math.min(100, (spent / threshold) * 100) : 0;
                      const status = spent <= threshold ? 'Under Budget' : 'Over Budget';
                      return (
                        <div key={category} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{category}</p>
                              <p className="text-xs text-slate-500">{status}</p>
                            </div>
                            <p className={`text-sm font-bold ${spent <= threshold ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(spent)} / {formatCurrency(threshold)}
                            </p>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-3">
                            <div className="h-full bg-amber-500" style={{ width: `${progress}%` }}></div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                            <span>{Math.round(progress)}% used</span>
                            <span>{status === 'Under Budget' ? `${formatCurrency(threshold - spent)} left` : `${formatCurrency(spent - threshold)} over`}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={200000}
                            step={100}
                            value={threshold}
                            onChange={e => handleThresholdChange(category, Number(e.target.value))}
                            className="w-full accent-amber-500"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                            <span>0</span>
                            <span>200k</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center text-slate-500">
              <p className="font-semibold">Choose one or more expense categories to set budget thresholds.</p>
              <p className="text-sm mt-2">Sliders and comparison tiles will appear once categories are selected.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseBudgetReport;
