import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-app border border-primary/20 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.3)] border-b-primary/40 relative overflow-hidden group">
    {/* Background Glow Pulse */}
    <motion.div 
      animate={{ 
        opacity: [0.1, 0.3, 0.1],
        scale: [0.95, 1.05, 0.95]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none"
    />

    {/* Dots Container */}
    <div className="flex gap-1.5 relative z-10">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 1, 0.3],
            y: [0, -2, 0]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
          className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]"
        />
      ))}
    </div>

    {/* Text Label (Optional but looks professional) */}
    <motion.span 
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 italic"
    >
      Processando
    </motion.span>
    
    {/* Animated Shine Sweep */}
    <motion.div
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12 pointer-events-none"
    />
  </div>
);

export default TypingIndicator;
