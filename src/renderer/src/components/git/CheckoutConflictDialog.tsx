import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Archive, Trash2 } from 'lucide-react';

interface CheckoutConflictDialogProps {
  isOpen: boolean;
  branchName: string;
  errorMessage: string;
  onStash: () => void;
  onForce: () => void;
  onCancel: () => void;
}

export const CheckoutConflictDialog: React.FC<CheckoutConflictDialogProps> = ({
  isOpen,
  branchName,
  errorMessage,
  onStash,
  onForce,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Extrai opcionalmente a lista de arquivos afetados se vier no erro
  const filesList = errorMessage
    .split('\n')
    .filter(line => line.trim() && !line.includes('Your local changes') && !line.includes('Please commit') && !line.includes('Aborting') && !line.includes('error:'))
    .map(line => line.trim());

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[460px] rounded-3xl border border-border shadow-2xl overflow-hidden bg-bg-panel"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-text-main">
                  Conflito de checkout
                </h3>
                <p className="text-[10px] text-text-muted/60 mt-0.5 font-bold">
                  Branch destino: <span className="text-primary font-black uppercase tracking-wider">{branchName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg transition-all hover:bg-white/5 text-text-muted/60 hover:text-text-main"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-[11px] leading-relaxed font-medium text-text-muted">
              Você possui alterações locais em arquivos que seriam sobrescritos ao trocar de branch. O Git abortou a operação para evitar a perda de dados.
            </p>

            {/* Lista de Arquivos Conflitantes (se detectado) */}
            {filesList.length > 0 && (
              <div className="bg-bg-app/50 border border-border/65 rounded-2xl p-3 max-h-36 overflow-y-auto no-scrollbar space-y-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-text-muted/40 mb-1.5">
                  Arquivos afetados:
                </p>
                {filesList.map((file, idx) => (
                  <div key={idx} className="text-[10px] font-mono text-amber-400/80 truncate">
                    {file}
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/30">
              Escolha uma ação de elite para continuar:
            </p>
          </div>

          {/* Footer / Opções */}
          <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Opção 1: Stash Automático (Recomendado) */}
              <button
                onClick={onStash}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all text-center group cursor-pointer"
              >
                <Archive size={20} className="text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Auto Stash
                </span>
                <span className="text-[8px] text-text-muted/40 font-bold mt-1 max-w-[150px] leading-normal">
                  Salva alterações atuais, troca de branch e as reaplica
                </span>
              </button>

              {/* Opção 2: Descartar e Forçar */}
              <button
                onClick={onForce}
                className="flex flex-col items-center justify-center p-4 rounded-2xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 transition-all text-center group cursor-pointer"
              >
                <Trash2 size={20} className="text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  Forçar Troca
                </span>
                <span className="text-[8px] text-text-muted/40 font-bold mt-1 max-w-[150px] leading-normal">
                  Descarta permanentemente todas as alterações locais
                </span>
              </button>
            </div>

            {/* Opção 3: Cancelar */}
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-main cursor-pointer text-center mt-1"
            >
              Cancelar Operação
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
