import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Terminal,
  Check,
  X,
  ChevronDown,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentActivity } from '../../../shared/types';
import { DiffViewer } from './DiffViewer';
import { applySearchReplace } from '../utils/patcher';

interface AgentActivityItemProps {
  activity: AgentActivity;
  onApplyAction: (id: string) => void;
  onRejectAction: (id: string) => void;
  onUndoAction: (id: string) => void;
}

export const AgentActivityItem: React.FC<AgentActivityItemProps> = ({
  activity,
  onApplyAction,
  onRejectAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [diffStats, setDiffStats] = useState<{ added: number; removed: number }>({ added: 0, removed: 0 });

  const isFile = activity.type === 'file_edit' || activity.type === 'write_file' || activity.type === 'patch_file';
  const data = activity.data as any;

  useEffect(() => {
    if (!isFile) return;
    let isMounted = true;

    const load = async () => {
      setIsLoadingDiff(true);
      try {
        const fileResp = await window.api.fs.readFile(data.path);
        const orig = fileResp.success ? fileResp.content : '';
        const updated = activity.type === 'patch_file'
          ? applySearchReplace(orig, data.content)
          : data.content;

        const { diffLines } = await import('diff');
        const parts = diffLines(orig, updated);
        let added = 0, removed = 0;
        parts.forEach(p => {
          const count = p.value.split('\n').filter(l => l !== '').length;
          if (p.added) added += count;
          if (p.removed) removed += count;
        });

        if (isMounted) {
          setOriginalContent(orig);
          setNewContent(updated);
          setDiffStats({ added, removed });
        }
      } catch (err) {
        console.error('Erro ao ler arquivo para diff:', err);
      } finally {
        if (isMounted) setIsLoadingDiff(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [activity.id, data.path, data.content, activity.type, isFile]);

  useEffect(() => {
    if (activity.status !== 'pending') setIsExpanded(false);
  }, [activity.status]);

  const filename = isFile ? data.path.split(/[\\\/]/).pop() : '';

  return (
    <div className="rounded-xl overflow-hidden">
      {/* Compact single-row item */}
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group"
        onClick={() => isFile && setIsExpanded(prev => !prev)}
      >
        {/* Icon */}
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
          activity.type === 'command'
            ? 'bg-orange-500/10 text-orange-400'
            : 'bg-primary/10 text-primary/70'
        }`}>
          {activity.type === 'command'
            ? <Terminal size={11} />
            : <FileCode size={11} />}
        </div>

        {/* Name */}
        <span className="text-[12px] font-bold text-text-main/80 flex-1 truncate">
          {activity.type === 'command' ? data.command : filename}
        </span>

        {/* Stats */}
        {isFile && (
          <div className="flex items-center gap-1 text-[9px] font-black shrink-0">
            {isLoadingDiff
              ? <span className="text-text-muted/30">···</span>
              : <>
                  <span className="text-emerald-500">+{diffStats.added}</span>
                  <span className="text-red-500">-{diffStats.removed}</span>
                </>
            }
          </div>
        )}

        {/* Chevron */}
        {isFile && (
          <ChevronDown
            size={12}
            className={`text-text-muted/20 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}

        {/* Hover actions */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {activity.type === 'command' ? (
            <button
              onClick={() => onApplyAction(activity.id)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black hover:bg-primary/20 transition-colors"
            >
              <Play size={9} fill="currentColor" /> Run
            </button>
          ) : (
            <>
              <button
                onClick={() => onRejectAction(activity.id)}
                className="p-1 rounded-lg text-text-muted/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X size={12} />
              </button>
              <button
                onClick={() => onApplyAction(activity.id)}
                className="p-1 rounded-lg text-text-muted/30 hover:text-primary hover:bg-primary/10 transition-all"
              >
                <Check size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Accordion Diff */}
      <AnimatePresence initial={false}>
        {isFile && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mx-2 mb-2 rounded-xl overflow-hidden border border-white/5">
              {isLoadingDiff ? (
                <div className="flex items-center justify-center py-8 gap-2 text-text-muted/30">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] uppercase tracking-wider font-bold">Calculando diff...</span>
                </div>
              ) : (
                <>
                  <DiffViewer
                    filename={filename}
                    path={data.path}
                    oldCode={originalContent || ''}
                    newCode={newContent || ''}
                  />
                  {/* Actions inside accordion */}
                  <div className="flex items-center justify-end gap-2 p-3 border-t border-white/5 bg-black/20">
                    <button
                      onClick={() => onRejectAction(activity.id)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-text-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Recusar
                    </button>
                    <button
                      onClick={() => onApplyAction(activity.id)}
                      className="px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black hover:bg-primary/20 transition-all flex items-center gap-1.5"
                    >
                      <Check size={11} strokeWidth={3} />
                      Aceitar
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
