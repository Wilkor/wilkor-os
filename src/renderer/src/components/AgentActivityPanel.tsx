import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentActivity } from '../../../shared/types';
import { AgentActivityItem } from './AgentActivityItem';

interface AgentActivityPanelProps {
  activities: AgentActivity[];
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onApplyAction: (id: string) => void;
  onRejectAction: (id: string) => void;
  onUndoAction: (id: string) => void;
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  activities,
  onAcceptAll,
  onRejectAll,
  onApplyAction,
  onRejectAction,
  onUndoAction
}) => {
  const pendingActivities = activities.filter(a => a.status === 'pending');

  if (pendingActivities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.99 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mb-2 mx-1"
    >
      <div className="bg-[#0c0d11]/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

        {/* Thin header */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse" />
            <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest">
              {pendingActivities.length} {pendingActivities.length === 1 ? 'alteração pendente' : 'alterações pendentes'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onRejectAll}
              className="text-[10px] font-bold text-text-muted/30 hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Rejeitar tudo
            </button>
            <button
              onClick={onAcceptAll}
              className="text-[10px] font-black text-primary/80 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Aplicar tudo
            </button>
          </div>
        </div>

        {/* Compact file list */}
        <div className="py-1.5 px-2 space-y-0.5">
          <AnimatePresence mode="popLayout">
            {pendingActivities.map((activity) => (
              <motion.div
                layout
                key={activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <AgentActivityItem
                  activity={activity}
                  onApplyAction={onApplyAction}
                  onRejectAction={onRejectAction}
                  onUndoAction={onUndoAction}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};
