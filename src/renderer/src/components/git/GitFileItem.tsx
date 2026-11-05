import { Plus, Minus } from 'lucide-react';

interface GitStatusFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
}

interface GitFileItemProps {
  file: GitStatusFile;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onClick: () => void;
}

export const GitFileItem = ({ file, onStage, onUnstage, onClick }: GitFileItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'modified': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'added': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'deleted': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'untracked': return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      case 'renamed': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-text-muted bg-text-muted/10 border-text-muted/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      case 'untracked': return 'U';
      case 'renamed': return 'R';
      default: return '?';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group flex items-center justify-between px-3 py-2 rounded-xl border border-transparent hover:bg-bg-app hover:border-border transition-all cursor-pointer mb-1"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black border uppercase shrink-0 ${getStatusColor(file.status)}`}>
          {getStatusLabel(file.status)}
        </span>
        <div className="overflow-hidden">
          <span className="text-[11px] font-bold text-text-main/70 group-hover:text-text-main truncate block transition-colors">
            {file.path.split(/[\\\/]/).pop()}
          </span>
          <span className="text-[8px] text-text-muted/40 group-hover:text-text-muted/60 truncate block font-mono transition-colors">
            {file.path}
          </span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (file.staged) {
            onUnstage(file.path);
          } else {
            onStage(file.path);
          }
        }}
        className={`w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 shrink-0 ${
          file.staged 
            ? 'hover:bg-rose-500/10 text-rose-500/40 hover:text-rose-500' 
            : 'hover:bg-emerald-500/10 text-emerald-500/40 hover:text-emerald-500'
        }`}
        title={file.staged ? "Desmarcar arquivo (Unstage)" : "Marcar arquivo (Stage)"}
      >
        {file.staged ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
      </button>
    </div>
  );
};
