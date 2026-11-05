import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Theme } from '../config/themes';

interface FeedbackDialogProps {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  theme: Theme;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ 
  isOpen, type, title, message, onClose, theme 
}) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const color = isSuccess ? '#10b981' : '#ef4444';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-sm rounded-3xl border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}
        >
          <div className="relative p-8 flex flex-col items-center text-center">
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors opacity-40 hover:opacity-100"
              style={{ color: theme.colors.textMuted }}
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {isSuccess ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </motion.div>

            <h3 className="text-lg font-black tracking-tight mb-2" style={{ color: theme.colors.textMain }}>
              {title}
            </h3>
            
            <p className="text-[13px] leading-relaxed opacity-60 mb-8" style={{ color: theme.colors.textMain }}>
              {message}
            </p>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
              style={{ 
                backgroundColor: color,
                boxShadow: `0 8px 24px -4px ${color}40`
              }}
            >
              Continuar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
