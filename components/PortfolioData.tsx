import React, { useEffect, useState } from 'react';
import {
  createPortfolioData,
  deletePortfolioData,
  getAllPortfolioData,
  updatePortfolioData,
} from '../services/portfolioService';
import { PortfolioDataItem } from '../types';

const emptyPortfolioItem: PortfolioDataItem = {
  portfolioId: '',
  isDeleted: false,
  emailId: '',
  fundName: '',
  isninCode: '',
  plan: 'Direct',
  units: '0',
  unitValue: '0',
  investedValue: '0',
  tags: [],
  notes: '',
  fundType: '',
  currentMarketValue: '0',
  source: '',
  folioNo: '',
  riskLevel: '',
  createdOn: new Date().toISOString(),
  modifiedOn: new Date().toISOString(),
  rowKey: '',
  transactionNotes: '',
};

const PortfolioData: React.FC = () => {
  const [items, setItems] = useState<PortfolioDataItem[]>([]);
  const [form, setForm] = useState<PortfolioDataItem>({ ...emptyPortfolioItem });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPortfolioData();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError('Unable to load portfolio data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setForm({
      ...emptyPortfolioItem,
      createdOn: new Date().toISOString(),
      modifiedOn: new Date().toISOString(),
    });
    setIsEditing(false);
    setError(null);
  };

  const parseTags = (value: string) => value.split(',').map(tag => tag.trim()).filter(Boolean);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = event.target;
    if (name === 'tags') {
      setForm(prev => ({ ...prev, tags: parseTags(value) }));
      return;
    }

    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked } as PortfolioDataItem));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value } as PortfolioDataItem));
  };

  const ensureRowKey = (payload: PortfolioDataItem) => {
    const rowKey = payload.rowKey || `portfolio_${Date.now()}`;
    return {
      ...payload,
      rowKey,
      portfolioId: payload.portfolioId || `portfolio-${rowKey}`,
      createdOn: payload.createdOn || new Date().toISOString(),
      modifiedOn: new Date().toISOString(),
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = ensureRowKey({
      ...form,
      modifiedOn: new Date().toISOString(),
    });

    try {
      if (isEditing && payload.rowKey) {
        await updatePortfolioData(payload.rowKey, payload);
      } else {
        await createPortfolioData(payload);
      }
      await loadItems();
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      setError('Unable to save portfolio item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: PortfolioDataItem) => {
    setForm({ ...item });
    setIsEditing(true);
    setError(null);
  };

  const handleDelete = async (rowKey: string) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    setSubmitting(true);
    setError(null);
    try {
      await deletePortfolioData(rowKey);
      await loadItems();
      if (form.rowKey === rowKey) resetForm();
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Unable to delete portfolio item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portfolio Data</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit, delete and view persisted portfolio entries.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] mb-10">
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Portfolio Item</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Fund Name</span>
                <input
                  name="fundName"
                  value={form.fundName}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">ISIN Code</span>
                <input
                  name="isninCode"
                  value={form.isninCode}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Plan</span>
                <select
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Direct">Direct</option>
                  <option value="Regular">Regular</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Folio No</span>
                <input
                  name="folioNo"
                  value={form.folioNo}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Units</span>
                <input
                  name="units"
                  value={form.units}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Unit Value</span>
                <input
                  name="unitValue"
                  value={form.unitValue}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Invested Value</span>
                <input
                  name="investedValue"
                  value={form.investedValue}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Current Market Value</span>
                <input
                  name="currentMarketValue"
                  value={form.currentMarketValue}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Email Id</span>
                <input
                  name="emailId"
                  value={form.emailId}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Fund Type</span>
                <input
                  name="fundType"
                  value={form.fundType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Risk Level</span>
                <input
                  name="riskLevel"
                  value={form.riskLevel}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Tags</span>
              <input
                name="tags"
                value={form.tags.join(', ')}
                onChange={handleChange}
                placeholder="direct, elss"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Source</span>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Transaction Notes</span>
              <textarea
                name="transactionNotes"
                value={form.transactionNotes}
                onChange={handleChange}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            {error && <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isEditing ? 'Update item' : 'Add item'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Active Portfolio Entries</h2>
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">Loading portfolio items…</div>
          ) : !Array.isArray(items) || items.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">No portfolio items found.</div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.rowKey} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.fundName || 'Untitled Fund'}</p>
                      <p className="text-xs text-slate-500 mt-1">ISIN: {item.isninCode || 'n/a'} · Plan: {item.plan || 'Direct'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.rowKey)}
                        className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-slate-500">
                    <div>Invested: {item.investedValue}</div>
                    <div>Current Market Value: {item.currentMarketValue}</div>
                    <div>Folio No: {item.folioNo || '—'}</div>
                    <div>Tags: {item.tags.join(', ') || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PortfolioData;
