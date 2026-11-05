import React from 'react';
import { Theme } from '../../config/themes';

interface ProgressTrackerProps {
  steps: { label: string; desc: string }[];
  currentStep: number;
  theme: Theme;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  currentStep,
  theme
}) => {
  return (
    <div
      className="px-10 py-5 flex items-center justify-between gap-2 max-w-3xl mx-auto w-full border-b"
      style={{ borderColor: theme.colors.borderColor }}
    >
      {steps.map((s, idx) => {
        const active = idx <= currentStep;
        const current = idx === currentStep;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  current ? 'scale-125' : ''
                }`}
                style={{
                  backgroundColor: current
                    ? theme.colors.primary
                    : active
                      ? `${theme.colors.primary}B3`
                      : theme.colors.borderColor,
                  boxShadow: current ? `0 0 10px ${theme.colors.primary}` : 'none'
                }}
              />
              <span
                className="text-[8px] font-black uppercase tracking-widest"
                style={{
                  color: active ? theme.colors.primary : `${theme.colors.textMuted}40`
                }}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="h-[1px] flex-1 mx-2"
                style={{
                  backgroundColor:
                    idx < currentStep ? `${theme.colors.primary}66` : theme.colors.borderColor
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
