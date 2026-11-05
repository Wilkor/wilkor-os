import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({ 
  isOpen, title, placeholder, defaultValue = '', onConfirm, onCancel 
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Foca o input após a animação do modal
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 backdrop-blur-md bg-black/60"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-bg-panel border border-border rounded-[24px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-black text-text-main uppercase tracking-widest">
            {title}
          </h3>
          <button 
            onClick={onCancel} 
            className="p-1.5 rounded-xl hover:bg-bg-app text-text-muted hover:text-text-main transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input */}
        <div className="px-6 pb-6">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Digite aqui...'}
            className="w-full bg-bg-app border border-border rounded-2xl px-4 py-3.5 text-sm text-text-main outline-none focus:border-primary/50 transition-all placeholder:text-text-muted/30 font-medium"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-main hover:bg-bg-app border border-transparent hover:border-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-5 py-2.5 bg-primary text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
