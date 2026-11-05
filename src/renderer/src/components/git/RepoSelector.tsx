import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RepoSelectorProps {
  roots: string[];
  current: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}

export const RepoSelector = ({ roots, current, onSelect, onClose }: RepoSelectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="absolute left-0 right-0 top-full mt-2 bg-bg-panel border border-border rounded-2xl overflow-hidden shadow-2xl z-[150] p-1.5"
    >
      <div className="px-3 py-2 border-b border-border mb-1">
        <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest">Mudar de Projeto</span>
      </div>
      <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
        {roots.map(root => {
          const name = root.split(/[\\\/]/).pop() || root;
          const active = root.toLowerCase() === current.toLowerCase();
          return (
            <button
              key={root}
              onClick={() => {
                onSelect(root);
              }}
              className={`w-full flex flex-col px-3 py-2 rounded-xl text-left transition-all group ${
                active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-bg-app border border-transparent'
              }`}
            >
              <span className={`text-[11px] font-black ${active ? 'text-primary' : 'text-text-main/60 group-hover:text-text-main'}`}>
                {name}
              </span>
              <span className="text-[8px] text-text-muted/40 font-mono truncate w-full" title={root}>
                {root}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
