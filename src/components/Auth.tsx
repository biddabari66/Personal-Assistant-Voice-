import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Auth({ onAuthChange }: { onAuthChange: (session: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      onAuthChange(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      onAuthChange(session);
    });

    return () => subscription?.unsubscribe();
  }, [onAuthChange]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ text: error.error_description || error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Elegant Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/90"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-executive-gold rounded-2xl flex items-center justify-center shadow-lg shadow-executive-gold/20">
            <span className="text-white text-2xl font-bold font-serif">A</span>
          </div>
          <span className="text-white text-2xl font-serif font-bold tracking-widest uppercase">Aria</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
            Executive Intelligence <br />
            <span className="text-executive-gold italic">Command Center</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-md">
            Your personalized secure environment for strategic oversight, task management, and executive insights.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 relative">
        <div className="w-full max-w-md space-y-10">
          <div className="text-left mb-10">
            <div className="lg:hidden w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
               <span className="text-executive-gold text-3xl font-bold font-serif">A</span>
            </div>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-3">Welcome, Sir</h2>
            <p className="text-lg text-slate-500 font-medium">Please sign in to access your dashboard.</p>
          </div>

          {!import.meta.env.VITE_SUPABASE_URL && (
            <div className="p-4 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
              ⚠️ Missing Supabase Configuration. Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to the Environment Variables.
            </div>
          )}

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-executive-gold transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-executive-gold focus:ring-0 outline-none transition-all text-slate-900 font-medium shadow-sm hover:border-slate-300"
                  placeholder="md@company.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-executive-gold transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-executive-gold focus:ring-0 outline-none transition-all text-slate-900 font-medium shadow-sm hover:border-slate-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold text-lg py-4 px-6 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-xl shadow-slate-900/20 disabled:opacity-70 mt-8 group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <><LogIn size={20} className="mr-3 group-hover:scale-110 transition-transform" /> Access Dashboard</>
              )}
            </button>
          </form>
          
          <div className="pt-8">
            <div className="mt-8 text-sm text-center text-slate-500 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Authorized Accounts</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">Super Admin</p>
                  <p className="text-xs text-slate-500 mt-1">md@company.com</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-bold text-slate-900">Admin</p>
                  <p className="text-xs text-slate-500 mt-1">admin@company.com</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
                Password: <strong className="text-slate-900 bg-slate-100 px-2 py-1 rounded">password123</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
