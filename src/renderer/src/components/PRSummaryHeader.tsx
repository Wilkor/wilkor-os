import React from 'react';
import { Sparkles, Lightbulb, RefreshCw, Users } from 'lucide-react';
import { Theme } from '../config/themes';

interface PRSummaryHeaderProps {
  analysis: any;
  theme: Theme;
  onPostAIReview?: () => void;
  isPosting?: boolean;
}

export const PRSummaryHeader: React.FC<PRSummaryHeaderProps> = ({
  analysis, theme, onPostAIReview, isPosting
}) => {
  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Revisores Participantes */}
      {analysis.reviewers && analysis.reviewers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border shadow-sm" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
          <span className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5" style={{ color: theme.colors.textMain }}>
            <Users size={12} className="text-primary" />
            Revisores Ativos
          </span>
          <div className="flex flex-wrap gap-2">
            {analysis.reviewers.map((rev: string, idx: number) => (
              <span 
                key={idx} 
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold border flex items-center gap-1.5 transition-all hover:scale-105"
                style={{ 
                  backgroundColor: `${theme.colors.primary}0d`, 
                  borderColor: `${theme.colors.primary}25`,
                  color: theme.colors.primary 
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {rev}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analysis Summary */}
        <div className="flex flex-col p-4 rounded-xl border shadow-sm animate-fadeIn" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">AI Review</span>
          </div>
          <p className="text-[11px] font-medium leading-relaxed mb-4" style={{ color: theme.colors.textMain }}>{analysis.summary}</p>
          <div className="mt-auto flex items-center gap-4">
            <div className="flex flex-col flex-1">
              <span className="text-[8px] font-bold uppercase opacity-40">Risk & Justification</span>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase" style={{ color: analysis.risk === 'Critical' ? '#ef4444' : analysis.risk === 'High' ? '#f59e0b' : '#10b981' }}>{analysis.risk}</span>
                <p className="text-[9px] leading-tight opacity-70 italic" style={{ color: theme.colors.textMain }}>{analysis.risk_justification || 'Análise técnica concluída.'}</p>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase opacity-40">Score</span>
              <span className="text-[10px] font-bold" style={{ color: theme.colors.primary }}>{analysis.score || 0}/100</span>
            </div>
            {onPostAIReview && (
              <button 
                onClick={onPostAIReview}
                disabled={isPosting}
                className={`ml-auto px-3 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-tighter border flex items-center gap-2 ${isPosting ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-primary/10 hover:bg-primary hover:text-white text-primary border-primary/20'}`}
              >
                {isPosting ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {isPosting ? 'Posting...' : 'Post Review'}
              </button>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex flex-col p-4 rounded-xl border shadow-sm" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Top Suggestions</span>
          </div>
          <div className="space-y-2">
            {analysis.suggestions?.map((s: string, i: number) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-none" />
                <p className="text-[10px] leading-snug" style={{ color: theme.colors.textMain }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Report Area */}
      {analysis.full_report && (
        <div className="p-4 rounded-xl border shadow-inner overflow-hidden flex flex-col" style={{ backgroundColor: '#0d1117', borderColor: theme.colors.borderColor }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Senior Tech Lead Full Report</span>
            </div>
            <div className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-bold uppercase">Opinionated Review</div>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-4 text-[11px] leading-relaxed font-mono whitespace-pre-wrap text-slate-300">
            {analysis.full_report}
          </div>
        </div>
      )}
    </div>
  );
};
