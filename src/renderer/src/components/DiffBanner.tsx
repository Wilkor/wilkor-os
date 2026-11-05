import React from 'react';

interface DiffBannerProps {
  path: string;
  viewMode: 'editor' | 'diff';
  onToggleViewMode: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export const DiffBanner: React.FC<DiffBannerProps> = ({
  viewMode,
  onToggleViewMode,
  onAccept,
  onReject
}) => {
  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center justify-between backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
          Alterações Pendentes (IA ou Externas)
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono">
        <button
          onClick={onToggleViewMode}
          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-text-main border border-white/5 hover:border-white/10 rounded-lg transition-all"
        >
          {viewMode === 'editor' ? 'Ver Comparação (Diff)' : 'Ver Código (Editor)'}
        </button>
        <button
          onClick={onReject}
          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all border border-rose-500/20"
        >
          Descartar / Reverter
        </button>
        <button
          onClick={onAccept}
          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all border border-emerald-500/20"
        >
          Aceitar Modificações
        </button>
      </div>
    </div>
  );
};
