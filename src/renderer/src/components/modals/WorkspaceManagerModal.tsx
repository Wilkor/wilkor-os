import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderGit2, X, Plus, Trash2, FolderOpen } from 'lucide-react';

interface WorkspaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceRoots: string[];
  onAddFolder: () => void;
  onRemoveFolder: (path: string) => void;
}

export const WorkspaceManagerModal: React.FC<WorkspaceManagerModalProps> = ({
  isOpen,
  onClose,
  workspaceRoots,
  onAddFolder,
  onRemoveFolder
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-bg-panel border border-border rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
          >
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FolderGit2 size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-text-main uppercase tracking-widest">Projetos do Workspace</h2>
                  <p className="text-[9px] text-text-muted mt-0.5">
                    {workspaceRoots.length} projeto{workspaceRoots.length !== 1 ? 's' : ''} ativo{workspaceRoots.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-app text-text-muted hover:text-text-main transition-all">
                <X size={15} />
              </button>
            </div>

            {/* List and Actions */}
            <div className="p-5 max-h-[380px] overflow-y-auto no-scrollbar space-y-4">
              <div className="flex justify-between items-center px-2 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted/50">Caminho do Projeto</span>
                <button
                  onClick={() => {
                    onAddFolder();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                >
                  <Plus size={12} className="mr-0.5" />
                  Adicionar Projeto
                </button>
              </div>

              <div className="space-y-1.5">
                {workspaceRoots.length === 0 ? (
                  <div className="py-12 text-center">
                    <FolderOpen size={36} className="mx-auto text-text-muted/20 mb-3" />
                    <p className="text-[11px] text-text-muted/40 font-bold">Nenhum projeto adicionado ao workspace.</p>
                  </div>
                ) : (
                  workspaceRoots.map((root, index) => {
                    const name = root.split(/[\\\/]/).pop() || root;
                    return (
                      <motion.div
                        key={root}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.02] border border-border/40 text-left transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className="w-8 h-8 rounded-xl bg-bg-app border border-border flex items-center justify-center shrink-0">
                            <FolderOpen size={14} className="text-text-muted/40" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[12px] font-bold text-text-main truncate">{name}</span>
                            <span className="text-[9px] text-text-muted/40 truncate font-mono mt-0.5">{root}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveFolder(root)}
                          className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 hover:text-red-400 transition-all shrink-0"
                          title="Remover do Workspace"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-border flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-bg-app hover:bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WorkspaceManagerModal;
