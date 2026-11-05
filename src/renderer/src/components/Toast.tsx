import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ id, message, type, onClose }, ref) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const config = {
    success: { icon: Check, color: 'text-primary', border: 'border-primary/30', bg: 'bg-primary/5' },
    error: { icon: X, color: 'text-red-400', border: 'border-red-400/30', bg: 'bg-red-400/5' },
    info: { icon: Info, color: 'text-blue-400', border: 'border-blue-400/30', bg: 'bg-blue-400/5' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-400/30', bg: 'bg-yellow-400/5' },
  };

  const { icon: Icon, color, border, bg } = config[type];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 min-w-[320px] max-w-md ${bg} backdrop-blur-xl border ${border} rounded-2xl shadow-2xl z-[1000] pointer-events-auto group`}
    >
      <div className={`w-8 h-8 rounded-full ${bg} border ${border} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={color} />
      </div>
      
      <div className="flex-1">
        <p className="text-[13px] font-medium text-text-main leading-tight">
          {message}
        </p>
      </div>

      <button 
        onClick={() => onClose(id)}
        className="p-1.5 text-text-muted/40 hover:text-text-muted hover:bg-bg-panel rounded-lg transition-all"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
});

Toast.displayName = 'Toast';

interface ToastContainerProps {
  notifications: { id: string; message: string; type: ToastType }[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <Toast key={n.id} {...n} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};
