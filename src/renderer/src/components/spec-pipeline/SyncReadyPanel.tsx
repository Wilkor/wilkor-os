import React from 'react';
import { Database, Save } from 'lucide-react';
import { Theme } from '../../config/themes';

interface SyncReadyPanelProps {
  onSync: () => void;
  theme: Theme;
}

export const SyncReadyPanel: React.FC<SyncReadyPanelProps> = ({
  onSync,
  theme
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center border rounded-3xl p-8 text-center h-full gap-6 bg-white/5"
      style={{ borderColor: theme.colors.borderColor }}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
        <Database size={32} />
      </div>
      <div>
        <h3 className="text-lg font-black uppercase tracking-wider">Pronto para Sincronizar</h3>
        <p className="text-xs text-text-muted max-w-sm mt-2 leading-relaxed">
          Todos os documentos técnicos e tarefas de sprint foram validados e aprovados pelos agentes sequenciais.
        </p>
      </div>
      <button
        onClick={onSync}
        className="px-8 py-4 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center gap-2 shadow-lg"
      >
        Sincronizar Workspace & Trello <Save size={16} />
      </button>
    </div>
  );
};
