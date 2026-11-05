import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Link, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CloneProgress {
  percent: number;
  message: string;
}

interface CloneModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const CloneModal = ({ onClose, onSuccess }: CloneModalProps) => {
  const [url, setUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isError, setIsError] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (window.api?.git?.onCloneProgress) {
      const cleanup = window.api.git.onCloneProgress((data: CloneProgress) => {
        if (data.message) setLogs(prev => [...prev, data.message]);
        if (data.percent >= 0) setProgress(data.percent);
        if (data.percent === 100) setIsDone(true);
      });
      return cleanup;
    }
    return undefined;
  }, []);

  const handleClone = async () => {
    if (!url.trim() || isCloning) return;
    setIsCloning(true);
    setLogs([]);
    setProgress(0);
    setIsDone(false);
    setIsError(false);

    const result = await window.api.git.clone(url.trim());

    if (!result.success && !result.canceled) {
      setIsError(true);
      setLogs(prev => [...prev, `❌ Erro: ${result.error}`]);
    } else if (result.canceled) {
      setIsCloning(false);
      return;
    }
    setIsCloning(false);
    if (result.success) {
      onSuccess?.();
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center p-8"
        onClick={isCloning ? undefined : onClose}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-bg-panel border border-border rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Download size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Clone Repositório</h2>
                <p className="text-[10px] text-white/30 font-medium mt-0.5">O seletor de pasta abrirá em seguida</p>
              </div>
            </div>
            {!isCloning && (
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white/60 transition-all">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                <Link size={14} />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleClone()}
                placeholder="https://github.com/usuario/repositorio.git"
                disabled={isCloning}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/40 transition-all placeholder:text-white/15 font-mono disabled:opacity-50"
              />
            </div>

            <AnimatePresence>
              {isCloning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Progresso do Git</span>
                    <span className="text-[10px] font-black text-primary">{progress > 0 ? `${progress}%` : '...'}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full"
                      animate={{ width: `${Math.max(progress, 5)}%` }}
                      transition={{ ease: 'easeOut' }}
                    />
                  </div>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 max-h-40 overflow-y-auto no-scrollbar font-mono text-[9px] text-white/30 leading-relaxed">
                    {logs.slice(-10).map((line, i) => <div key={i}>{line}</div>)}
                    <div ref={logsEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                >
                  <CheckCircle size={18} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-[12px] font-black text-green-300">Clone concluído!</p>
                    <p className="text-[10px] text-green-500/60">O projeto já foi adicionado ao seu Workspace.</p>
                  </div>
                </motion.div>
              )}
              {isError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <AlertCircle size={18} className="text-red-400 shrink-0" />
                  <p className="text-[12px] font-black text-red-300">Falha no clone. Verifique se o repo é público ou se você tem permissão.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-6 pb-6">
            {isDone ? (
              <button
                onClick={onClose}
                className="w-full py-3 bg-primary text-black rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <CheckCircle size={14} /> Começar a Trabalhar
              </button>
            ) : (
              <button
                onClick={handleClone}
                disabled={isCloning || !url.trim()}
                className="w-full py-3 bg-primary text-black rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
              >
                {isCloning ? (
                  <><Loader size={14} className="animate-spin" /> Processando...</>
                ) : (
                  <><Download size={14} /> Selecionar Pasta & Clonar</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
