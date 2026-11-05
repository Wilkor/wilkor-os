import { useState } from 'react';
import { Layers, ChevronDown, ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { BranchSelector } from './BranchSelector';
import { RepoSelector } from './RepoSelector';

interface GitHeaderProps {
  repoRoot?: string;
  roots: string[];
  currentBranch: string;
  allBranches: string[];
  isPulling: boolean;
  isPushing: boolean;
  onSetRepo: (path: string) => void;
  onCheckout: (branch: string) => void;
  onPull: () => void;
  onPush: () => void;
  onRefresh: () => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const GitHeader = ({
  repoRoot,
  roots,
  currentBranch,
  allBranches,
  isPulling,
  isPushing,
  onSetRepo,
  onCheckout,
  onPull,
  onPush,
  onRefresh,
  addToast
}: GitHeaderProps) => {
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  const repoName = repoRoot?.split(/[\\\/]/).pop() || 'Selecionar Repositório';

  return (
    <div className="px-5 pt-5 pb-2">
      {/* Seletor de Repositório no Cabeçalho */}
      <div className="relative mb-4 group/repo">
        <button
          onClick={() => setShowRepoDropdown(!showRepoDropdown)}
          className="w-full flex items-center justify-between p-3.5 bg-bg-panel hover:bg-bg-panel/80 border border-border hover:border-primary/25 rounded-2xl transition-all text-left group"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Layers size={16} className="text-primary" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-[11px] font-black text-white uppercase tracking-widest truncate">
                {repoName}
              </h2>
              <p className="text-[9px] text-white/30 font-mono truncate max-w-[200px]" title={repoRoot}>
                {repoRoot}
              </p>
            </div>
          </div>
          <ChevronDown
            size={13}
            className={`text-white/20 group-hover:text-white/50 transition-transform duration-300 ${
              showRepoDropdown ? 'rotate-180 text-primary' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showRepoDropdown && (
            <RepoSelector
              roots={roots}
              current={repoRoot || ''}
              onSelect={(path) => {
                onSetRepo(path);
                setShowRepoDropdown(false);
              }}
              onClose={() => setShowRepoDropdown(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Seletor de Branch e Controles Rápidos */}
      <div className="flex items-center justify-between bg-bg-panel border border-border rounded-2xl p-1.5">
        <BranchSelector current={currentBranch} all={allBranches} onSelect={onCheckout} addToast={addToast} />
        
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPull}
            disabled={isPulling}
            className={`p-2 rounded-xl transition-all ${
              isPulling ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-white/30 hover:text-white'
            }`}
            title="Sincronizar (Pull)"
          >
            <ArrowDown size={14} className={isPulling ? 'animate-bounce text-primary' : ''} />
          </button>
          
          <button
            onClick={onPush}
            disabled={isPushing}
            className={`p-2 rounded-xl transition-all ${
              isPushing ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-white/30 hover:text-white'
            }`}
            title="Publicar (Push)"
          >
            <ArrowUp size={14} className={isPushing ? 'animate-bounce text-primary' : ''} />
          </button>
          
          <div className="w-px h-4 bg-white/10 mx-1.5" />
          
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
            title="Atualizar Status"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
