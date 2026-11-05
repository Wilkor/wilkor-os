import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, List, X, Zap, Circle, Clock, CheckCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Theme } from '../config/themes';
import { TrelloCard, formatName, getAvatarColor } from './DashboardUtils';

interface KanbanViewProps {
  discoveryCards: TrelloCard[];
  backlogCards: TrelloCard[];
  despriorizadoCards: TrelloCard[];
  prioritizedCards: TrelloCard[];
  todoCards: TrelloCard[];
  doingCards: TrelloCard[];
  doneCards: TrelloCard[];
  bugsCards: TrelloCard[];
  theme: Theme;
  onOpenFile?: (path: string) => void;
  onStartSpecification?: (card: TrelloCard) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  discoveryCards, backlogCards, despriorizadoCards, prioritizedCards, todoCards, doingCards, doneCards, bugsCards, theme, onOpenFile, onStartSpecification
}) => {
  return (
    <motion.div 
      key="kanban"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full overflow-x-auto custom-scrollbar"
    >
      <div className="flex gap-6 p-6 pb-14 w-max min-w-full h-full">
        <Column title="Discovery" icon={Crosshair} cards={discoveryCards} color="#6366f1" theme={theme} onOpenFile={onOpenFile} onStartSpecification={onStartSpecification} />
        <Column title="Backlog" icon={List} cards={backlogCards} color="#94a3b8" theme={theme} onOpenFile={onOpenFile} />
        <Column title="Despriorizado" icon={X} cards={despriorizadoCards} color="#f87171" theme={theme} onOpenFile={onOpenFile} />
        <Column title="Prioritized" icon={Zap} cards={prioritizedCards} color="#a855f7" theme={theme} onOpenFile={onOpenFile} />
        <Column title="To Do" icon={Circle} cards={todoCards} color="#3b82f6" theme={theme} onOpenFile={onOpenFile} />
        <Column title="Doing" icon={Clock} cards={doingCards} color="#f59e0b" theme={theme} onOpenFile={onOpenFile} />
        <Column title="Done" icon={CheckCircle} cards={doneCards} color="#10b981" theme={theme} onOpenFile={onOpenFile} />
        <Column title="Bugs" icon={ShieldAlert} cards={bugsCards} color="#ef4444" theme={theme} onOpenFile={onOpenFile} />
      </div>
    </motion.div>
  );
};

const Column: React.FC<{ 
  title: string; 
  icon: any; 
  cards: TrelloCard[]; 
  color: string; 
  theme: Theme; 
  onOpenFile?: (path: string) => void;
  onStartSpecification?: (card: TrelloCard) => void;
}> = ({ title, icon: Icon, cards, color, theme, onOpenFile, onStartSpecification }) => {
  return (
    <div className="flex-none w-80 min-w-[320px] flex flex-col rounded-xl border shadow-sm" 
         style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
      <div className="p-4 border-b flex items-center justify-between bg-black/5 dark:bg-white/[0.02]" style={{ borderColor: theme.colors.borderColor }}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15`, color }}>
            <Icon size={16} />
          </div>
          <h3 className="text-[13px] font-bold tracking-tight" style={{ color: theme.colors.textMain }}>{title}</h3>
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.bgApp, color: theme.colors.textMuted }}>{cards.length}</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
        {cards.map((card, i) => (
          <motion.div 
            key={card.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }} 
            className="group p-4 border rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-primary/30" 
            style={{ 
              borderColor: theme.colors.borderColor,
              backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff'
            }}
            onClick={() => window.open(card.shortUrl, '_blank')}
          >
            <div className="flex flex-col gap-3">
              <h4 className="text-[12px] font-semibold leading-snug group-hover:text-primary transition-colors" style={{ color: theme.colors.textMain }}>{card.name}</h4>
              
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.colors.borderColor }}>
                <div className="flex -space-x-2">
                  {card.members?.slice(0, 3).map(m => (
                    <div 
                      key={m.id} 
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" 
                      style={{ 
                        backgroundColor: getAvatarColor(m.fullName), 
                        borderColor: theme.type === 'dark' ? '#1a1a1a' : '#ffffff', 
                        color: 'white' 
                      }} 
                      title={formatName(m.fullName)}
                    >
                      {m.fullName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {title === 'Discovery' && onStartSpecification && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartSpecification(card);
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm hover:shadow active:scale-95"
                    >
                      <Zap size={10} fill="white" /> Especificar
                    </button>
                  )}
                  {card.due && (
                    <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: theme.colors.textMuted }}>
                      <Clock size={12} className="text-amber-500" /> 
                      {new Date(card.due).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenFile) onOpenFile('.'); 
                    }}
                    className="p-1.5 rounded-lg hover:bg-primary/20 text-text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                    title="Open in Editor"
                  >
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
