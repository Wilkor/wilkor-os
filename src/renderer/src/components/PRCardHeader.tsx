import React from 'react';
import { GitPullRequest, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Theme } from '../config/themes';

interface PRCardHeaderProps {
  pr: any;
  theme: Theme;
  imgError: boolean;
  setImgError: (err: boolean) => void;
}

export const PRCardHeader: React.FC<PRCardHeaderProps> = ({
  pr,
  theme,
  imgError,
  setImgError
}) => {
  const getDaysOpenLabel = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff}d ago`;
  };

  return (
    <div className="flex items-center gap-4 flex-1 min-w-0">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: theme.colors.bgApp }}>
          {pr.authorAvatar && !imgError ? (
            <img
              src={pr.authorAvatar}
              alt={pr.author}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 opacity-50 text-[10px] font-bold">
              {pr.author.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center bg-emerald-500" style={{ borderColor: theme.colors.bgPanel }}>
          <CheckCircle size={8} className="text-white" />
        </div>
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider opacity-40">{pr.repo}</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[8px] font-bold text-text-muted">
            <GitPullRequest size={8} />
            #{pr.id}
          </div>
        </div>
        <h3 className="text-[13px] font-bold truncate leading-tight mb-1" style={{ color: theme.colors.textMain }}>{pr.title}</h3>
        <div className="flex items-center gap-3 text-[10px] font-medium text-text-muted">
          <span>{pr.author}</span>
          <div className="flex items-center gap-1">
            <MessageSquare size={9} />
            <span>{pr.comment_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={9} />
            <span>{getDaysOpenLabel(pr.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
