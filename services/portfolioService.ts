import { MutualFundHolding, PortfolioDataItem, PortfolioSummary } from '../types';
import { api } from './apiService';

// AMFI scheme codes for NAV fetching
const SCHEME_CODES: Record<string, string> = {
  'INF846K01EW2': '120503',  // Axis ELSS Tax Saver - Direct Growth
  'INF846K01EH3': '120465',  // Axis Mid Cap - Direct Growth
  'INF179K01WA6': '118989',  // HDFC Balanced Advantage - Direct Growth
  'INF109K01Q49': '120594',  // ICICI Prudential Liquid - Direct Growth
  'INF174KA1GA9': '147946',  // Kotak Nifty Next 50 Index - Direct Growth
  'INF769K01HH0': '135798',  // Mirae Asset NYSE FANG+ ETF FoF - Direct
  'INF204KB15W0': '145621',  // Nippon India Nifty Smallcap 250 - Direct Growth
  'INF663L01DV3': '120841',  // PGIM India Midcap - Direct Growth
  'INF879O01027': '122639',  // Parag Parikh Flexi Cap - Direct Growth
  'INF789F01XA0': '120716',  // UTI Nifty 50 Index - Direct Growth
  'INF846K01DP8': '120468',  // Axis Large Cap - Regular Growth
  'INF769K01HR9': '135800',  // Mirae Asset S&P 500 Top 50 ETF FoF - Direct
  'INF769K01DK3': '118385',  // Mirae Asset ELSS Tax Saver - Regular Growth
};

// Fallback NAVs from CAS (25-Mar-2026)
const FALLBACK_NAV: Record<string, number> = {
  'INF846K01EW2': 100.7319,
  'INF846K01EH3': 125.29,
  'INF179K01WA6': 541.367,
  'INF109K01Q49': 407.0899,
  'INF174KA1GA9': 18.5922,
  'INF769K01HH0': 33.897,
  'INF204KB15W0': 29.5919,
  'INF663L01DV3': 68.38,
  'INF879O01027': 87.8410,
  'INF789F01XA0': 162.9353,
  'INF846K01DP8': 65.10,
  'INF769K01HR9': 24.759,
  'INF769K01DK3': 45.666,
};

// Mock holdings data
const MOCK_HOLDINGS: MutualFundHolding[] = [
  // Direct Plans
  { folio: '91084994893/0', isin: 'INF846K01EW2', name: 'Axis ELSS Tax Saver Fund', plan: 'Direct', units: 792.337, costValue: 57000, schemeCode: '120503', tags: ['elss', 'direct'] },
  { folio: '91084994893/0', isin: 'INF846K01EH3', name: 'Axis Mid Cap Fund', plan: 'Direct', units: 32.818, costValue: 2500, schemeCode: '120465', tags: ['direct'] },
  { folio: '17981141/23', isin: 'INF179K01WA6', name: 'HDFC Balanced Advantage Fund', plan: 'Direct', units: 327.612, costValue: 180000, schemeCode: '118989', tags: ['direct'] },
  { folio: '16716320/40', isin: 'INF109K01Q49', name: 'ICICI Prudential Liquid Fund', plan: 'Direct', units: 0.002, costValue: 0.61, schemeCode: '120594', tags: ['direct'] },
  { folio: '16328508/58', isin: 'INF174KA1GA9', name: 'Kotak Nifty Next 50 Index Fund', plan: 'Direct', units: 10053.178, costValue: 195000, schemeCode: '147946', tags: ['direct'] },
  { folio: '79941559756/0', isin: 'INF769K01HH0', name: 'Mirae Asset NYSE FANG+ ETF FoF', plan: 'Direct', units: 1945.762, costValue: 22000, schemeCode: '135798', tags: ['direct'] },
  { folio: '499258705267/0', isin: 'INF204KB15W0', name: 'Nippon India Nifty Smallcap 250 Index Fund', plan: 'Direct', units: 18190.336, costValue: 547991, schemeCode: '145621', tags: ['direct'] },
  { folio: '91015608645/0', isin: 'INF663L01DV3', name: 'PGIM India Midcap Fund', plan: 'Direct', units: 6391.814, costValue: 391100, schemeCode: '120841', tags: ['direct'] },
  { folio: '18667260', isin: 'INF879O01027', name: 'Parag Parikh Flexi Cap Fund', plan: 'Direct', units: 754.671, costValue: 71000, schemeCode: '122639', tags: ['direct'] },
  { folio: '599350331125/0', isin: 'INF789F01XA0', name: 'UTI Nifty 50 Index Fund', plan: 'Direct', units: 6130.063, costValue: 899760, schemeCode: '120716', tags: ['direct'] },
  // Regular Plans
  { folio: '910111427822/0', isin: 'INF846K01DP8', name: 'Axis Large Cap Fund', plan: 'Regular', units: 19.868, costValue: 1000, schemeCode: '120468', tags: ['regular'] },
  { folio: '79938285081/0', isin: 'INF769K01HR9', name: 'Mirae Asset S&P 500 Top 50 ETF FoF', plan: 'Regular', units: 7163.509, costValue: 75600, schemeCode: '135800', tags: ['regular'] },
  { folio: '79938285081/0', isin: 'INF769K01DK3', name: 'Mirae Asset ELSS Tax Saver Fund', plan: 'Regular', units: 2258.105, costValue: 76000, schemeCode: '118385', tags: ['elss', 'regular'] },
];

interface NAVResult {
  nav: number | null;
  source: 'live' | 'fallback';
}

/**
 * Fetch NAV from external mfapi.in service
 */
async function fetchNAVFromExternal(isin: string): Promise<NAVResult> {
  const schemeCode = isin;
  console.log(`Fetching NAV for ISIN: ${isin}`);
  if (!schemeCode) {
    const fallback = FALLBACK_NAV[isin];
    return { nav: fallback || null, source: 'fallback' };
  }

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${isin}/latest`);
    if (!res.ok) throw new Error('API responded with error');

    const data = await res.json();
    if (data.status !== 'SUCCESS') throw new Error('Invalid API response');

    const nav = parseFloat(data.data?.[0]?.nav);
    if (isNaN(nav)) throw new Error('Invalid NAV value');

    return { nav, source: 'live' };
  } catch (error) {
    // Fallback to CAS value
    const fallback = FALLBACK_NAV[isin];
    return fallback ? { nav: fallback, source: 'fallback' } : { nav: null, source: 'fallback' };
  }
}

/**
 * Get all portfolio holdings with NAV data
 */
export const getPortfolioHoldings = async (isDemo: boolean = false): Promise<MutualFundHolding[]> => {
  console.log('getPortfolioHoldings called with isDemo:', isDemo);
  if (isDemo) {
    // Return mock data for demo mode
    const holdings = MOCK_HOLDINGS;
    // Fetch NAVs in parallel
    const navResults = await Promise.all(holdings.map(h => fetchNAVFromExternal(h.isin)));
    return holdings.map((h, i) => ({
      ...h,
      nav: navResults[i].nav,
      currentValue: navResults[i].nav ? h.units * navResults[i].nav : h.costValue,
      navSource: navResults[i].source,
    }));
  }

  // Fetch from API
  console.log('Fetching portfolio data from API');
  const data = await api.getPortfolioData(isDemo);
  console.log('API response:', data);
  
  // Filter out deleted items and map to MutualFundHolding
  const mappedHoldings: any[] = data
    .filter((item: any) => !item.isDeleted)
    .map((item: any) => {
      const units = parseFloat(item.units) || 0;
      const costValue = parseFloat(item.investedValue) || 0;
      
      return {
        folio: item.folioNo || '',
        isin: item.isninCode || '',
        name: item.fundName || '',
        plan: item.plan || 'Direct',
        units,
        costValue,
        schemeCode: SCHEME_CODES[item.isinCode] || '',
        tags: item.tags ?? [],
      };
    });

  // Fetch NAVs in parallel for all holdings (same as mock data)
  const navResults = await Promise.all(mappedHoldings.map(h => fetchNAVFromExternal(h.isin)));

  // Map holdings with NAV data
  const holdings: MutualFundHolding[] = mappedHoldings.map((h, i) => ({
    ...h,
    nav: navResults[i].nav,
    currentValue: navResults[i].nav ? h.units * navResults[i].nav : h.costValue,
    navSource: navResults[i].source,
  }));

  return holdings;
};

export const getAllPortfolioData = async (isDemo: boolean = false): Promise<PortfolioDataItem[]> => {
  const data = await api.getPortfolioData(isDemo);
  return Array.isArray(data) ? data : [];
};

export const createPortfolioData = async (item: PortfolioDataItem, isDemo: boolean = false): Promise<PortfolioDataItem> => {
  const data = await api.createPortfolioData(item, isDemo);
  return data as PortfolioDataItem;
};

export const updatePortfolioData = async (rowKey: string, item: PortfolioDataItem, isDemo: boolean = false): Promise<PortfolioDataItem> => {
  return api.updatePortfolioData(rowKey, item, isDemo);
};

export const deletePortfolioData = async (rowKey: string, isDemo: boolean = false): Promise<void> => {
  return api.deletePortfolioData(rowKey, isDemo);
};

/**
 * Calculate portfolio summary statistics
 */
export const calculatePortfolioSummary = (holdings: MutualFundHolding[]): PortfolioSummary => {
  const totalCost = holdings.reduce((sum, h) => sum + h.costValue, 0);
  const totalCurrent = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
  const totalPnL = totalCurrent - totalCost;
  const totalPnLPercent = (totalPnL / totalCost) * 100;

  const direct = holdings.filter(h => h.plan === 'Direct');
  const regular = holdings.filter(h => h.plan === 'Regular');

  const directValue = direct.reduce((sum, h) => sum + h.currentValue, 0);
  const regularValue = regular.reduce((sum, h) => sum + h.currentValue, 0);

  return {
    totalPortfolioValue: totalCurrent,
    totalInvested: totalCost,
    totalPnL,
    totalPnLPercent,
    directPlansValue: directValue,
    directPlansCount: direct.length,
    regularPlansValue: regularValue,
    regularPlansCount: regular.length,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number): string => {
  if (value >= 1e7) return '₹' + (value / 1e7).toFixed(2) + ' Cr';
  if (value >= 1e5) return '₹' + (value / 1e5).toFixed(2) + ' L';
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

/**
 * Get color based on P&L percentage
 */
export const getPnLColor = (pct: number): string => {
  return pct >= 0 ? '#22c55e' : '#ef4444'; // green or red
};
