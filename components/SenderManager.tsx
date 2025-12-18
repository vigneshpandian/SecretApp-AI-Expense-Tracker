
import React, { useState } from 'react';

interface Props {
  senders: string[];
  onAdd: (sender: string) => void;
  onRemove: (sender: string) => void;
}

const SenderManager: React.FC<Props> = ({ senders, onAdd, onRemove }) => {
  const [newSender, setNewSender] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSender && !senders.includes(newSender)) {
      onAdd(newSender.toLowerCase());
      setNewSender('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800">Manage Senders</h3>
            <p className="text-xs text-slate-500">{senders.length} active {senders.length === 1 ? 'source' : 'sources'}</p>
          </div>
        </div>
        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input 
              type="email" 
              value={newSender}
              onChange={(e) => setNewSender(e.target.value)}
              placeholder="Enter bank alert email (e.g. alerts@bank.com)"
              className="flex-grow px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {senders.map(sender => (
              <div key={sender} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full group">
                <span className="text-xs font-medium text-slate-600">{sender}</span>
                <button 
                  onClick={() => onRemove(sender)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove sender"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {senders.length === 0 && (
              <p className="text-xs text-slate-400 italic">No senders configured. Add one to start tracking.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SenderManager;
