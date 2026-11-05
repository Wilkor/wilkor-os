import React, { useState } from 'react';

interface CommitDiffLinkProps {
  commitHash: string;
  filePath: string;
  children: React.ReactNode;
}

export const CommitDiffLink: React.FC<CommitDiffLinkProps> = ({ commitHash, filePath, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState('');
  const [error, setError] = useState('');

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
    if (diff || error) return;

    setLoading(true);
    try {
      const result = await (window as any).api.git.commitDiff(commitHash, filePath);
      if (result.success && result.diff) {
        setDiff(result.diff);
      } else {
        setError(result.error || 'Não foi possível carregar o diff deste arquivo.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar o diff.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-3 border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01] dark:bg-black/10 backdrop-blur-md transition-all shadow-md">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] active:bg-white/[0.04] transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <span className="text-[12px] font-bold text-text-main/90 font-mono tracking-tight block">
              {children}
            </span>
            <span className="text-[9px] text-text-muted/65 font-mono tracking-wider uppercase">
              Git Commit Diff • {commitHash.substring(0, 7)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
          )}
          <svg
            className={`w-4 h-4 text-text-muted/60 transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 bg-[#070707]/95 relative">
          {loading ? (
            <div className="p-6 flex items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted/60 animate-pulse">
                Carregando Diff do Commit...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 text-[11px] text-red-400 font-mono">
              ❌ {error}
            </div>
          ) : diff ? (
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed p-4 bg-black/40">
              {diff.split('\n').map((line, i) => {
                const isAdded = line.startsWith('+') && !line.startsWith('+++');
                const isRemoved = line.startsWith('-') && !line.startsWith('---');
                const isHeader = line.startsWith('@@') || line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++');

                let bgColor = 'transparent';
                let textColor = 'var(--text-main)';

                if (isAdded) {
                  bgColor = 'rgba(16, 185, 129, 0.08)';
                  textColor = '#10b981';
                } else if (isRemoved) {
                  bgColor = 'rgba(239, 68, 68, 0.08)';
                  textColor = '#ef4444';
                } else if (isHeader) {
                  bgColor = 'rgba(59, 130, 246, 0.05)';
                  textColor = '#3b82f6';
                }

                return (
                  <div
                    key={i}
                    style={{ backgroundColor: bgColor, color: textColor }}
                    className="px-2 py-0.5 rounded transition-all whitespace-pre-wrap select-text"
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-[11px] text-text-muted/40 font-mono italic">
              Nenhuma alteração encontrada ou arquivo inalterado neste commit.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
