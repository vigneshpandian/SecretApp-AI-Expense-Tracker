
import React, { useState } from 'react';
import { api } from '../services/apiService';
import { User } from '../types';
import { Lock, User as UserIcon, Loader2, Play } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await api.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Hint: admin / password123');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startDemo = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'demo-user',
        username: 'demo',
        name: 'Demo Account',
        isDemo: true
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl text-white mb-4 shadow-xl shadow-indigo-100">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 leading-none">SecretApp <span className="text-indigo-600">Ai</span></h1>
          <p className="text-slate-500 text-sm mt-3 font-medium">Enterprise Intelligence Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <UserIcon size={18} />
              </span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </span>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Secure Sign In'}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or</span></div>
            </div>

            <button 
              type="button"
              onClick={startDemo}
              disabled={loading}
              className="w-full py-3 bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-2xl hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Play size={18} className="fill-current" />
              Try Demo Mode
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          End-to-End Encryption Enabled
        </p>
      </div>
    </div>
  );
};

export default Login;
