import React from 'react';
import { motion } from 'framer-motion';

interface ContextIndicatorProps {
  current: number;
  max: number;
  label?: string;
}

export const ContextIndicator: React.FC<ContextIndicatorProps> = ({ current, max, label = 'Context' }) => {
  const percentage = Math.min((current / max) * 100, 100);

  const getStatusColor = () => {
    if (percentage > 90) return 'text-red-500';
    if (percentage > 70) return 'text-yellow-500';
    return 'text-primary';
  };

  return (
    <div className="flex flex-col items-center justify-center group relative cursor-help" title={`${current.toLocaleString()} / ${max.toLocaleString()} chars`}>
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r={12}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-white/5"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="16"
            cy="16"
            r={12}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 12}
            initial={{ strokeDashoffset: 2 * Math.PI * 12 }}
            animate={{ strokeDashoffset: (2 * Math.PI * 12) - (percentage / 100) * (2 * Math.PI * 12) }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`${getStatusColor()} transition-colors duration-300`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Percentage or Icon in center */}
        <span className="absolute text-[9px] font-black tracking-tighter text-text-main/60 group-hover:text-primary transition-colors">
          {Math.round(percentage)}%
        </span>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-bg-panel border border-primary/20 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] backdrop-blur-md">
        <p className="text-[9px] font-black uppercase tracking-widest text-primary">{label}</p>
        <p className="text-[10px] font-mono text-white/80">{current.toLocaleString()} / {max.toLocaleString()}</p>
      </div>
    </div>
  );
};
