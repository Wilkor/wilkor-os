import { useState, useEffect, useRef } from 'react';
import { GitBranch, ChevronDown, Check, Search, Plus, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BranchSelectorProps {
  current: string;
  all: string[];
  onSelect: (branch: string) => Promise<void> | void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const BranchSelector = ({ current, all, onSelect, addToast }: BranchSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredBranches = all.filter(branch =>
    branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exactMatch = all.some(
    branch => branch.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleSelectBranch = async (branchName: string) => {
    if (isCheckingOut) return;
    setIsCheckingOut(true);
    try {
      await onSelect(branchName);
      setIsOpen(false);
    } catch (err) {
      console.error('Erro no checkout de branch:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCreateBranch = async () => {
    const branchName = searchQuery.trim();
    if (!branchName || exactMatch || isCreating) return;

    setIsCreating(true);
    if (addToast) addToast(`Criando branch "${branchName}"...`, 'info');
    try {
      const result = await window.api.git.createBranch(branchName);
      if (result.success) {
        if (addToast) addToast(`Branch "${branchName}" criada com sucesso! 🌿`, 'success');
        await onSelect(branchName);
        setIsOpen(false);
      } else {
        if (addToast) addToast(`Erro ao criar branch: ${result.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err: any) {
      console.error('Erro ao criar branch:', err);
      if (addToast) addToast(`Erro ao criar branch: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => !isCheckingOut && setIsOpen(!isOpen)}
        disabled={isCheckingOut}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group ${
          isCheckingOut ? 'opacity-80 cursor-not-allowed' : ''
        }`}
      >
        {isCheckingOut ? (
          <Loader size={13} className="animate-spin text-primary shrink-0" />
        ) : (
          <GitBranch size={13} strokeWidth={2.5} className="shrink-0" />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
          {isCheckingOut ? 'Alterando...' : current}
        </span>
        <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute left-0 top-full mt-2 w-60 bg-bg-panel border border-border rounded-2xl overflow-hidden shadow-2xl z-[150] p-1.5 flex flex-col gap-1.5"
          >
            {/* Input de Busca */}
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar ou criar branch..."
                className="w-full bg-bg-app border border-border rounded-xl pl-8 pr-3 py-2 text-[10px] text-text-main outline-none focus:border-primary/40 transition-all font-medium"
              />
            </div>

            {/* Listagem */}
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
              {filteredBranches.map(branch => (
                <button
                  key={branch}
                  onClick={() => handleSelectBranch(branch)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all group ${
                    branch === current
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted/60 hover:bg-bg-app hover:text-text-main'
                  }`}
                >
                  <span className="text-[11px] font-black truncate">{branch}</span>
                  {branch === current && <Check size={11} />}
                </button>
              ))}

              {/* Botão de Criação de nova branch */}
              {searchQuery.trim() && !exactMatch && (
                <button
                  onClick={handleCreateBranch}
                  disabled={isCreating}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left bg-primary/5 hover:bg-primary/15 text-primary transition-all border border-primary/20 font-black text-[10px] uppercase tracking-wider"
                >
                  {isCreating ? (
                    <Loader size={12} className="animate-spin shrink-0" />
                  ) : (
                    <Plus size={12} className="shrink-0" />
                  )}
                  Criar "{searchQuery.trim()}"
                </button>
              )}

              {filteredBranches.length === 0 && !searchQuery.trim() && (
                <div className="px-3 py-4 text-center text-text-muted/30 text-[9px] font-bold uppercase tracking-wider">
                  Nenhuma branch encontrada
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
