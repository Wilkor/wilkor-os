import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Power, Terminal, Wrench, Loader2, Layers, Edit2 } from 'lucide-react';
import { MCPServerConfig } from '../../../shared/types';

interface MCPServerCardProps {
  server: MCPServerConfig;
  onToggle: (id: string, current: boolean) => void;
  onRemove: (id: string) => void;
  onEdit: (server: MCPServerConfig) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const MCPServerCard: React.FC<MCPServerCardProps> = ({
  server,
  onToggle,
  onRemove,
  onEdit,
  onAddToast,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [tools, setTools] = useState<any[] | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);

  const handleToggleTools = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (tools !== null) {
      setExpanded(true);
      return;
    }
    setLoadingTools(true);
    try {
      if (window.api?.mcp) {
        const result = await window.api.mcp.getTools(server.id);
        setTools(result || []);
        setExpanded(true);
      }
    } catch {
      onAddToast('Erro ao carregar ferramentas.', 'error');
    } finally {
      setLoadingTools(false);
    }
  };

  const renderIcon = () => {
    if (server.icon) {
      const isUrl = server.icon.startsWith('http');
      if (isUrl) {
        return <img src={server.icon} alt={server.name} className="w-5 h-5 rounded object-cover" />;
      }
      return <span className="text-base leading-none">{server.icon}</span>;
    }
    return <Terminal size={16} />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative rounded-[22px] border transition-all duration-300 overflow-hidden ${
        server.enabled
          ? 'bg-bg-app/50 border-primary/20 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
          : 'bg-black/10 border-border/30 grayscale opacity-60'
      }`}
    >
      {/* Accent bar */}
      {server.enabled && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 to-transparent" />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Info */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-[14px] bg-black/40 flex items-center justify-center border border-white/5 transition-all duration-500 shrink-0 ${
                server.enabled ? 'text-primary border-primary/10' : 'text-text-muted'
              }`}
            >
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-[11px] font-black text-text-main tracking-tight uppercase truncate">
                {server.name}
              </h3>
              {server.description && (
                <p className="text-[8px] text-text-muted/50 font-medium italic truncate mt-0.5">
                  {server.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <code className="text-[7px] font-mono text-text-muted/70 bg-black/30 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                  {server.command || server.url}
                </code>
                {server.args && server.args.length > 0 && (
                  <>
                    <span className="text-[10px] text-text-muted/20 font-bold shrink-0">•</span>
                    <span className="text-[7px] text-text-muted/40 font-black uppercase tracking-widest italic truncate">
                      {server.args.join(' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(server)}
              className="p-2.5 bg-white/5 text-text-muted hover:bg-white/10 rounded-xl transition-all"
              title="Editar"
            >
              <Edit2 size={12} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(server.id, server.enabled)}
              className={`p-2.5 rounded-xl transition-all ${
                server.enabled
                  ? 'bg-primary text-black'
                  : 'bg-white/5 text-text-muted hover:bg-white/10'
              }`}
            >
              <Power size={12} strokeWidth={3} />
            </motion.button>
            <button
              onClick={() => onRemove(server.id)}
              className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
              title="Remover"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Connected status + tools */}
        {server.enabled && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-75" />
                </div>
                <span className="text-[8px] text-green-500/80 font-black uppercase tracking-[0.2em]">
                  Connected
                </span>
              </div>

              <button
                onClick={handleToggleTools}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5"
              >
                {loadingTools ? (
                  <Loader2 size={10} className="animate-spin text-primary" />
                ) : (
                  <>
                    <Wrench size={10} className="text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">
                      {expanded ? 'Hide' : 'Tools'}
                    </span>
                    {tools !== null && (
                      <span className="text-[8px] text-primary font-black ml-0.5">{tools.length}</span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Tools list */}
            <AnimatePresence>
              {expanded && tools !== null && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                    {tools.length === 0 ? (
                      <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-center italic text-[9px] text-text-muted/30 font-bold uppercase tracking-widest">
                        Empty toolkit
                      </div>
                    ) : (
                      tools.map((tool: any, idx: number) => (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          key={tool.name || idx}
                          className="flex items-start gap-2.5 p-2.5 bg-black/20 rounded-[16px] border border-white/5 hover:border-primary/20 group/tool transition-all"
                        >
                          <div className="w-7 h-7 rounded-[10px] bg-primary/5 flex items-center justify-center text-primary group-hover/tool:bg-primary group-hover/tool:text-black transition-all duration-300 shrink-0">
                            <Layers size={10} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black text-text-main uppercase tracking-tight truncate">
                              {tool.name}
                            </p>
                            {tool.description && (
                              <p className="text-[8px] text-text-muted/50 leading-relaxed mt-0.5 line-clamp-2 italic font-medium">
                                {tool.description}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
