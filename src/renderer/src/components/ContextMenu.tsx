import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Wand2, Bug, FileCode } from 'lucide-react'

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
  items?: ContextMenuItem[];
  title?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, onAction, items, title }) => {
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  useEffect(() => {
    // Basic screen overflow protection
    const maxX = window.innerWidth - 220;
    const maxY = window.innerHeight - 250;
    setAdjustedPos({
      x: x > maxX ? x - 200 : x,
      y: y > maxY ? y - 220 : y
    });

    const handleGlobalClick = () => onClose();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [x, y, onClose]);

  const defaultItems: ContextMenuItem[] = [
    { id: 'explain', label: 'Explicar Código', icon: HelpCircle, color: 'text-blue-400' },
    { id: 'refactor', label: 'Refatorar', icon: Wand2, color: 'text-primary' },
    { id: 'fix', label: 'Corrigir Bugs', icon: Bug, color: 'text-red-400' },
    { id: 'test', label: 'Gerar Unidade', icon: FileCode, color: 'text-purple-400' },
  ];

  const menuItems = items || defaultItems;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ top: adjustedPos.y, left: adjustedPos.x }}
        className="fixed z-[9999] w-56 bg-bg-panel border border-border rounded-2xl shadow-2xl p-2 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 mb-1 border-b border-border">
          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 italic">{title || 'Wilkor AI Actions'}</p>
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg-app transition-colors group ${item.id === 'delete' ? 'hover:bg-red-500/10' : ''}`}
          >
            <item.icon size={16} className={`${item.color} group-hover:scale-110 transition-transform`} />
            <span className={`text-xs font-bold transition-colors ${item.id === 'delete' ? 'text-red-400 group-hover:text-red-300' : 'text-text-main/70 group-hover:text-text-main'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
