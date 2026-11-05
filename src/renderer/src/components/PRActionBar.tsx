import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, AlertTriangle, XCircle, Send, Info, ChevronDown, GitMerge } from 'lucide-react';
import { Theme } from '../config/themes';

interface PRActionBarProps {
  pr: any;
  expanded: boolean;
  setExpanded: (v: boolean | ((p: boolean) => boolean)) => void;
  prStatus: string | null;
  actioning: string | null;
  analyzing: boolean;
  handleAnalyze: (e: React.MouseEvent, selectedAgentIds?: string[]) => void;
  triggerActionConfirm: (action: 'approve' | 'request-changes' | 'decline' | 'merge') => void;
  comment: string;
  setComment: (v: string) => void;
  sendingComment: boolean;
  handleComment: () => void;
  theme: Theme;
  analysis: any;
  agents: any[];
}

export const PRActionBar: React.FC<PRActionBarProps> = ({
  pr, expanded, setExpanded, prStatus, actioning, analyzing, handleAnalyze,
  triggerActionConfirm, comment, setComment, sendingComment, handleComment, theme, analysis, agents
}) => {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (agents && agents.length > 0 && selectedIds.length === 0) {
      setSelectedIds(agents.map(a => a.id));
    }
  }, [agents]);

  return (
    <div className="flex items-center gap-2">
      {!expanded && !analysis && (
        <div className="relative">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (agents.length > 0) {
                setShowAgentSelector(prev => !prev);
              } else {
                setExpanded(true); 
                handleAnalyze(e, []);
              }
            }}
            className="px-4 py-2 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <div className="flex items-center gap-1.5">
              {analyzing ? <Loader2 size={12} className="animate-spin" /> : <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-primary rounded-full"/></div>}
              <span>{analyzing ? 'Analyzing...' : (agents.length > 0 ? 'Review With IA' : 'Review')}</span>
            </div>
          </button>

          {showAgentSelector && agents.length > 0 && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-2 w-72 p-4 rounded-xl border shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
              style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b" style={{ borderColor: theme.colors.borderColor }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMain }}>Select Reviewers</span>
                <button 
                  onClick={() => {
                    const allSelected = selectedIds.length === agents.length;
                    setSelectedIds(allSelected ? [] : agents.map(a => a.id));
                  }}
                  className="text-[9px] font-bold uppercase tracking-wider hover:opacity-80"
                  style={{ color: theme.colors.primary }}
                >
                  {selectedIds.length === agents.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {agents.map((agent) => {
                  const isChecked = selectedIds.includes(agent.id);
                  return (
                    <label 
                      key={agent.id}
                      className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                      style={{ borderColor: isChecked ? `${agent.color}50` : theme.colors.borderColor }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{agent.emoji || '🤖'}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold truncate" style={{ color: theme.colors.textMain }}>{agent.name}</span>
                          <span className="text-[8px] font-bold truncate opacity-40 uppercase">{agent.role}</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedIds(prev => 
                            prev.includes(agent.id) 
                              ? prev.filter(id => id !== agent.id)
                              : [...prev, agent.id]
                          );
                        }}
                        className="w-3.5 h-3.5 rounded border outline-none accent-primary cursor-pointer"
                        style={{ accentColor: theme.colors.primary }}
                      />
                    </label>
                  );
                })}
              </div>

              <button 
                onClick={(e) => {
                  setShowAgentSelector(false);
                  setExpanded(true);
                  handleAnalyze(e, selectedIds);
                }}
                disabled={selectedIds.length === 0}
                className="mt-4 w-full py-2 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:scale-100"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Start Analysis ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      )}

      {expanded && !prStatus && pr.isRealPR && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => triggerActionConfirm('approve')} disabled={!!actioning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm"
            style={{ backgroundColor: '#10b98110', borderColor: '#10b98120', color: '#10b981' }}>
            {actioning === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
            <span>Approve</span>
          </button>
          <button onClick={() => triggerActionConfirm('request-changes')} disabled={!!actioning}
            className="p-2 rounded-lg border transition-all shadow-sm"
            style={{ backgroundColor: '#f59e0b10', borderColor: '#f59e0b20', color: '#f59e0b' }}>
            {actioning === 'request-changes' ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={14} />}
          </button>
          <button onClick={() => triggerActionConfirm('decline')} disabled={!!actioning}
            className="p-2 rounded-lg border transition-all shadow-sm"
            style={{ backgroundColor: '#ef444410', borderColor: '#ef444420', color: '#ef4444' }}>
            {actioning === 'decline' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={14} />}
          </button>

          <button onClick={() => triggerActionConfirm('merge')} disabled={!!actioning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm"
            style={{ backgroundColor: '#3b82f610', borderColor: '#3b82f620', color: '#3b82f6' }}>
            {actioning === 'merge' ? <Loader2 size={12} className="animate-spin" /> : <GitMerge size={12} />}
            <span>Merge</span>
          </button>

          <div className="flex items-center gap-2 border-l pl-3 ml-1.5" style={{ borderColor: theme.colors.borderColor }}>
            <div className="relative">
              <input 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Adicionar comentário..."
                className="bg-white/5 border rounded-lg px-3 py-1.5 text-[10px] w-48 outline-none focus:border-primary transition-all"
                style={{ borderColor: theme.colors.borderColor }}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
              />
              <button 
                onClick={handleComment}
                disabled={sendingComment || !comment.trim()}
                className="absolute right-1 top-1 p-1 rounded-md hover:bg-primary/20 text-primary disabled:opacity-30"
              >
                {sendingComment ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && !prStatus && !pr.isRealPR && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600">
          <Info size={12} />
          <span className="text-[10px] font-bold uppercase">Local Branch (No PR)</span>
        </div>
      )}

      {prStatus && (
        <div className="flex items-center gap-1.5">
          <div className="px-4 py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider"
               style={{ 
                 backgroundColor: prStatus === 'APPROVED' ? '#10b98110' : prStatus === 'DECLINED' ? '#ef444410' : '#3b82f610',
                 borderColor: prStatus === 'APPROVED' ? '#10b98120' : prStatus === 'DECLINED' ? '#ef444420' : '#3b82f620',
                 color: prStatus === 'APPROVED' ? '#10b981' : prStatus === 'DECLINED' ? '#ef4444' : '#3b82f6'
               }}>
            {prStatus}
          </div>
          {prStatus === 'APPROVED' && pr.isRealPR && (
            <button onClick={() => triggerActionConfirm('merge')} disabled={!!actioning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#3b82f610', borderColor: '#3b82f620', color: '#3b82f6' }}>
              {actioning === 'merge' ? <Loader2 size={12} className="animate-spin" /> : <GitMerge size={12} />}
              <span>Merge</span>
            </button>
          )}
        </div>
      )}

      <button 
        onClick={() => setExpanded(p => !p)} 
        className="p-2 rounded-lg border transition-all hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: theme.colors.borderColor, color: theme.colors.textMuted }}
      >
        <ChevronDown size={16} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
