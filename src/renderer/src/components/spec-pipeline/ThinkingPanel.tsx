import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface ThinkingPanelProps {
  agentColor: string;
  theme: any;
  isThinking: boolean;
}

export const ThinkingPanel: React.FC<ThinkingPanelProps> = ({ agentColor, theme, isThinking }) => {
  const thinkingMessages = [
    "Analisando o PRD...",
    "Validando requisitos...",
    "Checando consistência...",
    "Consultando contexto técnico...",
    "Finalizando análise..."
  ];
  const [thinkingMsgIndex, setThinkingMsgIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isThinking) {
      interval = setInterval(() => {
        setThinkingMsgIndex((prev) => (prev + 1) % thinkingMessages.length);
      }, 2500);
    } else {
      setThinkingMsgIndex(0);
    }
    return () => clearInterval(interval);
  }, [isThinking]);

  return (
    <motion.div
      key="thinking-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full py-10 gap-4"
    >
      <div className="relative">
        <Brain size={32} className="text-primary animate-pulse" style={{ color: agentColor }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-3 border-t-2 rounded-full"
          style={{ borderTopColor: agentColor }}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={thinkingMsgIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[10px] font-black uppercase tracking-widest opacity-80 h-4"
            style={{ color: theme.colors.textMuted }}
          >
            {thinkingMessages[thinkingMsgIndex]}
          </motion.span>
        </AnimatePresence>
        <div className="w-32 h-1 bg-black/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: agentColor }}
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingPanel;
