import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, HelpCircle } from 'lucide-react';
import { Theme } from '../config/themes';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: Theme;
  type?: 'danger' | 'primary' | 'warning';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ 
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', 
  onConfirm, onCancel, theme, type = 'primary' 
}) => {
  if (!isOpen) return null;

  const accentColor = type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : theme.colors.primary;

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
          className="w-full max-w-[400px] rounded-2xl border shadow-2xl overflow-hidden"
          style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                 {type === 'danger' ? <AlertCircle size={18} /> : <HelpCircle size={18} />}
              </div>
              <h3 className="text-sm font-bold tracking-tight" style={{ color: theme.colors.textMain }}>
                {title}
              </h3>
            </div>
            <button 
              onClick={onCancel} 
              className="p-1.5 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: theme.colors.textMuted }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-[12px] leading-relaxed font-medium" style={{ color: theme.colors.textMuted }}>
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: theme.colors.textMuted }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onCancel(); }}
              className="px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
