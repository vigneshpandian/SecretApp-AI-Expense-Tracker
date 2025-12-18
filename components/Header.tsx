
import React from 'react';
import { ShieldCheck, Zap, ToggleLeft, ToggleRight } from 'lucide-react';

interface Props {
  demoMode: boolean;
  onToggleDemo: () => void;
}

const Header: React.FC<Props> = ({ demoMode, onToggleDemo }) => {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">SecretApp <span className="text-indigo-600">Ai</span></h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Smart Ledger Extraction</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleDemo}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider ${
                demoMode 
                ? 'bg-orange-50 text-orange-700 border-orange-200' 
                : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {demoMode ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              Demo Mode: {demoMode ? 'ON' : 'OFF'}
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-wider">Secured</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
