import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { SpecAgent } from './AgentOrchestrator';

interface AgentPanelHeaderProps {
  agent: SpecAgent;
  isThinking: boolean;
  status: 'APROVADO' | 'INCOMPLETO' | 'IDLE';
  theme: any;
}

export const AgentPanelHeader: React.FC<AgentPanelHeaderProps> = ({
  agent,
  isThinking,
  status,
  theme
}) => {
  return (
    <div
      className="flex items-center justify-between pb-4 border-b"
      style={{ borderColor: theme.colors.borderColor }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border"
          style={{
            backgroundColor: `${agent.color}1A`,
            borderColor: `${agent.color}4D`,
            boxShadow: `0 0 15px -3px ${agent.color}33`
          }}
        >
          {agent.emoji}
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.colors.textMain }}>
            {agent.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: agent.color }}>
            {agent.role}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isThinking ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: agent.color }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
              <Brain size={11} className="animate-pulse" /> Pensando
            </span>
          </div>
        ) : status === 'APROVADO' ? (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
            ✓ Pronto
          </span>
        ) : status === 'INCOMPLETO' ? (
          <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
            ⚠️ Incompleto
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
            Aguardando
          </span>
        )}
      </div>
    </div>
  );
};
