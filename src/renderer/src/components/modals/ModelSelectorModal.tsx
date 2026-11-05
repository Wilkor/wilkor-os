import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Settings as SettingsIcon, Check } from 'lucide-react';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: any[];
  modelsByProvider: Record<string, any[]>;
  activeModel: string;
  setActiveModel: (id: string) => void;
  onOpenSettings: (tab: string) => void;
}

const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  availableModels,
  modelsByProvider,
  activeModel,
  setActiveModel,
  onOpenSettings
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
            className="relative w-full max-w-md bg-bg-panel border border-border rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
          >
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-text-main uppercase tracking-widest">Selecionar Modelo</h2>
                  <p className="text-[9px] text-text-muted mt-0.5">{availableModels.length} modelo{availableModels.length !== 1 ? 's' : ''} disponível{availableModels.length !== 1 ? 'is' : ''}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-app text-text-muted hover:text-text-main transition-all">
                <X size={15} />
              </button>
            </div>

            {/* Grupos de Providers */}
            <div className="p-4 max-h-[420px] overflow-y-auto no-scrollbar space-y-4">
              {availableModels.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-[11px] text-text-muted/40 font-bold">Nenhuma chave API configurada.</p>
                  <button
                    onClick={() => { onClose(); onOpenSettings('ai'); }}
                    className="mt-3 text-[10px] text-primary/60 font-black uppercase tracking-widest hover:text-primary transition-colors"
                  >
                    Abrir Configurações →
                  </button>
                </div>
              )}

              {Object.entries(modelsByProvider).map(([provider, models]) => (
                <div key={provider}>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/40 px-3 mb-2">{provider}</p>
                  <div className="space-y-0.5">
                    {models.map(model => {
                      const isActive = activeModel === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => { setActiveModel(model.id); onClose(); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-white/[0.04] border border-transparent'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/20 text-primary' : 'bg-bg-app text-text-muted/40'
                            }`}>
                            <model.icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-bold truncate ${isActive ? 'text-primary' : 'text-text-main/70'}`}>{model.name}</p>
                            <p className="text-[9px] text-text-muted/30 font-mono">{model.id}</p>
                          </div>
                          {isActive && (
                            <Check size={14} className="text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 border-t border-border flex items-center justify-between">
              <span className="text-[9px] text-text-muted font-medium">Configure chaves em Settings →</span>
              <button
                onClick={() => { onClose(); onOpenSettings('ai'); }}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-text-muted hover:text-primary transition-colors"
              >
                <SettingsIcon size={11} /> Gerenciar APIs
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModelSelectorModal;
