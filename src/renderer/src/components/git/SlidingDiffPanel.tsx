import { useState, useEffect } from 'react';
import { FileCode, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiffViewer } from '../DiffViewer';

interface GitStatusFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
}

interface SlidingDiffPanelProps {
  file: GitStatusFile | null;
  isOpen: boolean;
  onClose: () => void;
}

const normalizePath = (p: string) => p.replace(/\\/g, '/');

export const SlidingDiffPanel = ({ file, isOpen, onClose }: SlidingDiffPanelProps) => {
  const [diffContent, setDiffContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      const loadDiff = async () => {
        setIsLoading(true);
        const result = await window.api.git.diff(normalizePath(file.path));
        if (result.success) {
          setDiffContent(result.diff);
        }
        setIsLoading(false);
      };
      loadDiff();
    }
  }, [file?.path, file?.status, file?.staged, isOpen]);

  // Fechar com ESC (Elite UX)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && file && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[85%] max-w-2xl bg-bg-app border-l border-border shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-[101] flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-bg-panel">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCode size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">{file.path.split(/[\\\/]/).pop()}</h3>
                  <p className="text-[9px] text-white/20 font-mono truncate max-w-xs">{file.path}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-text-muted/20 italic">
                  <Loader size={40} className="animate-spin" />
                  <span className="text-[10px] uppercase font-black tracking-widest">Carregando Diff...</span>
                </div>
              ) : (
                <DiffViewer 
                  filename={file.path.split(/[\\\/]/).pop() || ''}
                  path={file.path}
                  oldCode="" 
                  newCode={diffContent} 
                />
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-bg-panel flex items-center justify-end gap-3">
              <span className="text-[10px] font-bold text-text-muted/40 mr-auto uppercase tracking-tighter italic">Pressione ESC para fechar</span>
              <button 
                onClick={onClose}
                className="px-6 py-2 rounded-xl border border-border text-text-muted text-[10px] font-black uppercase tracking-widest hover:bg-bg-panel transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
