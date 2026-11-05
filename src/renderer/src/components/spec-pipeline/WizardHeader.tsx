import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Theme } from '../../config/themes';

interface WizardHeaderProps {
  cardName: string;
  onClose: () => void;
  theme: Theme;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  cardName,
  onClose,
  theme
}) => {
  return (
    <div
      className="p-6 border-b flex items-center justify-between"
      style={{
        backgroundColor: `${theme.colors.bgPanel}CC`,
        borderColor: theme.colors.borderColor
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white border-violet-500/20">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-base font-black uppercase tracking-tighter italic leading-none flex items-center gap-1.5">
            Spec-Driven Pipeline{' '}
            <span className="text-[8px] px-1.5 py-0.5 rounded-md not-italic tracking-widest font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              AGENT ENGINE
            </span>
          </h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">
            Especificação Técnica Automatizada para Card: {cardName}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-[var(--primary-muted)] rounded-full transition-all text-text-muted"
      >
        <X size={18} />
      </button>
    </div>
  );
};
