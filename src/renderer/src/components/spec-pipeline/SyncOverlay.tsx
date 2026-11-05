import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Theme } from '../../config/themes';

interface SyncOverlayProps {
  isSyncing: boolean;
  isSyncComplete: boolean;
  syncMessage: string;
  syncProgress: number;
  onClose: () => void;
  theme: Theme;
}

export const SyncOverlay: React.FC<SyncOverlayProps> = ({
  isSyncing,
  isSyncComplete,
  syncMessage,
  syncProgress,
  onClose,
  theme
}) => {
  if (!isSyncing && !isSyncComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-50 bg-black/40 backdrop-blur-md"
    >
      {isSyncComplete ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-lg">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider">Sync Concluído com Sucesso!</h3>
          <p className="text-xs text-text-muted max-w-sm">
            Requisitos, Arquitetura e Tasks salvos na pasta /docs do workspace, e cards criados no Backlog do Trello.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all"
          >
            Voltar ao Kanban
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="animate-spin text-primary" size={48} />
          <h3 className="text-sm font-black uppercase tracking-widest">Sincronizando...</h3>
          <p
            className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80"
            style={{ color: theme.colors.primary }}
          >
            {syncMessage}
          </p>
          <div className="w-48 h-1.5 rounded-full overflow-hidden bg-white/10 mt-2">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
