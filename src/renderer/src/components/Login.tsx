import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Mail, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/api';
import wosLogo from './wos_logo.png';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastUser = JSON.parse(localStorage.getItem('wOs_lastUser') || 'null');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.login({ email, phone });
      
      if (res.status === 200) {
        const { accessToken, refreshToken, ...userData } = res.data;
        login(accessToken, refreshToken, userData as any);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050505] overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00A884]/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00A884]/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] p-8"
      >
        {/* Form Container with Glassmorphism */}
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00A884]/[0.05] to-transparent pointer-events-none" />

          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-10 relative">
            <motion.div 
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-[#00A884] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                <img 
                  src={wosLogo} 
                  alt="wOs Logo" 
                  className="w-24 h-24 rounded-2xl object-cover relative z-10 shadow-2xl shadow-emerald-500/20"
                />
              </div>
            </motion.div>
            
            <div className="mt-6 text-center">
              <h1 className="text-3xl font-black tracking-tighter text-white mb-1">wOs</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">
                {lastUser ? `Bem-vindo de volta, Wilkor` : 'Autenticação do Sistema'}
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="group relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#00A884]/60 ml-1 mb-1 block">E-mail Corporativo</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00A884] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00A884]/20 focus:border-[#00A884]/40 transition-all text-sm font-medium"
                    placeholder="E-mail"
                    required
                  />
                </div>
              </div>

              {/* Whatsapp/Phone Field */}
              <div className="group relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#00A884]/60 ml-1 mb-1 block">Whatsapp de Acesso</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00A884] transition-colors">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00A884]/20 focus:border-[#00A884]/40 transition-all text-sm font-medium"
                    placeholder="Whatsapp"
                    required
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode='wait'>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2"
                >
                  <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full bg-[#00A884] hover:bg-[#00C298] text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,132,0.2)] hover:shadow-[0_0_30px_rgba(0,168,132,0.4)] active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  ACESSAR TERMINAL
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-slate-500/50">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <Sparkles size={10} className="text-[#00A884]" />
              Vibe Powered Intelligence
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest">
              Rel. 2026.04.16.A
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
