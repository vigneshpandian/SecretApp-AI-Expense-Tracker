import React, { useState, useEffect } from 'react';
import { MutualFundHolding, PortfolioSummary } from '../types';
import { getPortfolioHoldings, calculatePortfolioSummary, formatCurrency, getPnLColor } from '../services/portfolioService';
import { TrendingUp, RefreshCw, Loader } from 'lucide-react';

interface Props {
  demoMode: boolean;
}

const Portfolio: React.FC<Props> = ({ demoMode }) => {
  console.log('Portfolio component rendered with demoMode:', demoMode);
  const [holdings, setHoldings] = useState<MutualFundHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    console.log('Portfolio useEffect triggered');
    loadPortfolio();
  }, [demoMode]);

  const loadPortfolio = async () => {
    console.log('Loading portfolio, demoMode:', demoMode);
    setLoading(true);
    try {
      const data = await getPortfolioHoldings(demoMode);
      console.log('Portfolio data received:', data);
      setHoldings(data);
      setSummary(calculatePortfolioSummary(data));
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-indigo-600" size={32} />
          <p className="text-slate-500 text-sm">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  const directHoldings = holdings.filter(h => h.plan === 'Direct');
  const regularHoldings = holdings.filter(h => h.plan === 'Regular');

  const allocationPercentages = holdings.map(h => (h.currentValue / summary.totalPortfolioValue * 100));

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Portfolio Tracker</h2>
              <p className="text-slate-500 text-sm mt-0.5">Mutual Fund Holdings · Live NAV Updates</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <button
            onClick={loadPortfolio}
            disabled={loading}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50 text-sm font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="text-xs text-slate-400 mt-2">
            {lastUpdated ? `Updated ${lastUpdated}` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Value</p>
          <p className="text-xl font-black text-slate-900">{formatCurrency(summary.totalPortfolioValue)}</p>
          <p className="text-xs text-slate-500 mt-1">Invested: {formatCurrency(summary.totalInvested)}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total P&L</p>
          <p
            className="text-xl font-black"
            style={{ color: getPnLColor(summary.totalPnLPercent) }}
          >
            {formatCurrency(Math.abs(summary.totalPnL))}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: getPnLColor(summary.totalPnLPercent) }}
          >
            {summary.totalPnL >= 0 ? '▲' : '▼'} {Math.abs(summary.totalPnLPercent).toFixed(2)}%
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Plans</p>
          <p className="text-xl font-black text-slate-900">{formatCurrency(summary.directPlansValue)}</p>
          <p className="text-xs text-slate-500 mt-1">{summary.directPlansCount} schemes</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Regular Plans</p>
          <p className="text-xl font-black text-slate-900">{formatCurrency(summary.regularPlansValue)}</p>
          <p className="text-xs text-slate-500 mt-1">{summary.regularPlansCount} schemes</p>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Asset Allocation</p>
        <div className="flex gap-1 h-3 rounded-lg overflow-hidden">
          {holdings.map((holding, idx) => {
            const colors = [
              '#6366f1', '#4f46e5', '#4338ca', '#7c3aed', '#a855f7',
              '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#fb923c',
              '#fbbf24', '#facc15', '#eab308', '#84cc16', '#22c55e',
            ];
            return (
              <div
                key={idx}
                className="transition-all duration-300"
                style={{
                  flex: allocationPercentages[idx],
                  backgroundColor: colors[idx % colors.length],
                }}
                title={`${holding.name}: ${allocationPercentages[idx].toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Direct Plan Holdings */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Direct Plan Holdings</span>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">
            {directHoldings.length}
          </span>
        </h3>
        <div className="space-y-3">
          {directHoldings.map((holding, idx) => (
            <FundRow key={idx} holding={holding} />
          ))}
        </div>
      </div>

      {/* Regular Plan Holdings */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Regular Plan Holdings</span>
          <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-bold">
            {regularHoldings.length}
          </span>
        </h3>
        <div className="space-y-3">
          {regularHoldings.map((holding, idx) => (
            <FundRow key={idx} holding={holding} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <div className="text-[10px] text-slate-400 space-y-1">
          <div>NAV data from mfapi.in · Cost values from CAS</div>
          <div>Past performance does not guarantee future returns</div>
        </div>
      </div>
    </div>
  );
};

const FundRow: React.FC<{ holding: MutualFundHolding }> = ({ holding }) => {
  const pnl = holding.currentValue - holding.costValue;
  const pctChange = (pnl / holding.costValue) * 100;
  const barWidth = Math.min(Math.abs(pctChange) * 2, 100);

  const getTagColor = (tag: string) => {
    if (tag === 'elss') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (tag === 'direct') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (tag === 'regular') return 'bg-slate-50 text-slate-700 border-slate-100';
    return '';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 mb-1">
            {holding.name}
            {holding.tags.map(tag => (
              <span
                key={tag}
                className={`inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-bold border ${getTagColor(tag)}`}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-slate-400">Units</p>
              <p className="font-semibold text-slate-700">{holding.units.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-400">NAV</p>
              <p className="font-semibold text-slate-700">
                ₹{holding.nav?.toFixed(4) || 'N/A'}
                {holding.navSource === 'live' ? (
                  <span className="ml-1 inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                ) : (
                  <span className="ml-1 inline-block w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Invested</p>
              <p className="font-semibold text-slate-700">{formatCurrency(holding.costValue)}</p>
            </div>
            <div>
              <p className="text-slate-400">Current</p>
              <p className="font-semibold text-slate-700">{formatCurrency(holding.currentValue)}</p>
            </div>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-lg font-black text-slate-900">{formatCurrency(holding.currentValue)}</p>
          <p
            className="text-sm font-bold mt-1"
            style={{ color: getPnLColor(pctChange) }}
          >
            {pctChange >= 0 ? '▲' : '▼'} {Math.abs(pctChange).toFixed(2)}%
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: getPnLColor(pctChange) }}
          >
            {formatCurrency(Math.abs(pnl))}
          </p>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${barWidth}%`,
            backgroundColor: getPnLColor(pctChange),
          }}
        />
      </div>
    </div>
  );
};

export default Portfolio;
