import React, { useState, useEffect } from 'react';
import { Folder, User, Zap, Image as ImageIcon } from 'lucide-react';

interface Suggestion {
  id: string;
  label: string;
  value: string;
  type: 'discord' | 'file' | 'command' | 'agent';
  icon: any;
}

interface AutocompleteDropdownProps {
  query: string;
  onSelect: (value: string) => void;
  selectedIndex: number;
  setSuggestionsCount: (count: number) => void;
}

export const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  query,
  onSelect,
  selectedIndex,
  setSuggestionsCount
}) => {
  const [discordMentions, setDiscordMentions] = useState<Record<string, string>>({});
  const [workspaceFiles, setWorkspaceFiles] = useState<{ name: string; isDirectory: boolean; path: string }[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Comandos IA rápidos
  const commands: Suggestion[] = [
    { id: 'explain', label: '/explain', value: '/explain ', type: 'command', icon: Zap },
    { id: 'refactor', label: '/refactor', value: '/refactor ', type: 'command', icon: Zap },
    { id: 'fix', label: '/fix', value: '/fix ', type: 'command', icon: Zap },
    { id: 'image', label: '/image', value: '/image ', type: 'command', icon: ImageIcon },
    { id: 'report', label: '/report', value: '/report ', type: 'command', icon: Zap }
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (window.api?.discord?.getMentions) {
          const res = await window.api.discord.getMentions();
          if (res.success && res.mentions) {
            setDiscordMentions(res.mentions);
          }
        }
        if (window.api?.fs?.listFiles) {
          const files = await window.api.fs.listFiles();
          if (Array.isArray(files)) {
            setWorkspaceFiles(files);
          }
        }
        if (window.api?.agents?.list) {
          const res = await window.api.agents.list();
          if (res.success && res.agents) {
            setAgents(res.agents);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do autocomplete:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const allSuggestions: Suggestion[] = [
    ...commands,
    ...agents.map(agent => ({
      id: `agent-${agent.id}`,
      label: `@${agent.name.replace(/\s+/g, '')} (${agent.role})`,
      value: `@${agent.name.replace(/\s+/g, '')} `,
      type: 'agent' as const,
      icon: () => React.createElement('span', { className: "text-xs select-none" }, agent.emoji || '🤖')
    })),
    ...Object.keys(discordMentions).map(name => ({
      id: `discord-${name}`,
      label: `@${name}`,
      value: `@${name} `,
      type: 'discord' as const,
      icon: User
    })),
    ...workspaceFiles.map(file => ({
      id: `file-${file.path}`,
      label: `${file.isDirectory ? '📁' : '📄'} ${file.name}`,
      value: file.path,
      type: 'file' as const,
      icon: Folder
    }))
  ];

  const normalizedQuery = query.toLowerCase().replace(/[\/@]/, '');
  
  // Se a query começa com '@', filtramos apenas agentes e contatos do discord para evitar poluição
  const isAgentQuery = query.startsWith('@');
  const candidates = isAgentQuery
    ? allSuggestions.filter(item => item.type === 'agent' || item.type === 'discord')
    : allSuggestions.filter(item => item.type === 'command' || item.type === 'file');

  const filtered = candidates.filter(item => 
    item.label.toLowerCase().includes(normalizedQuery) ||
    item.value.toLowerCase().includes(normalizedQuery)
  ).slice(0, 8);

  useEffect(() => {
    setSuggestionsCount(filtered.length);
  }, [filtered.length, setSuggestionsCount]);

  const handleItemSelect = (item: Suggestion) => {
    console.log('[AutocompleteDropdown] Item selecionado via clique/teclado:', item);
    onSelect(item.value);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && filtered.length > 0 && selectedIndex >= 0 && selectedIndex < filtered.length) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(filtered[selectedIndex].value);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedIndex, filtered, onSelect]);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute left-4 right-4 bottom-[calc(100%+8px)] z-50 bg-[#0c0c0e]/95 backdrop-blur-md border border-white/[0.08] shadow-[0_15px_35px_rgba(0,0,0,0.6)] rounded-3xl max-h-60 overflow-y-auto custom-scrollbar font-sans transition-all duration-300 pointer-events-auto select-none">
      <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between shrink-0 select-none">
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
          Sugestões contextuais
        </span>
        {loading && <span className="text-[9px] text-[var(--primary)] animate-pulse font-bold">Carregando...</span>}
      </div>
      <div className="p-2 flex flex-col gap-1">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleItemSelect(item);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleItemSelect(item);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-[var(--primary)] text-black font-bold shadow-md shadow-[var(--primary)]/10 scale-[1.01]' 
                  : 'text-[var(--text-main)] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {typeof Icon === 'function' && item.type === 'agent' ? (
                  <Icon />
                ) : (
                  <Icon size={14} className={isSelected ? 'text-black' : 'text-[var(--text-muted)]'} />
                )}
                <span className="text-xs truncate select-none">{item.label}</span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg shrink-0 ${
                isSelected 
                  ? 'bg-black/20 text-black' 
                  : item.type === 'command'
                    ? 'bg-purple-500/10 text-purple-400'
                    : item.type === 'agent'
                      ? 'bg-purple-500/10 text-purple-400'
                      : item.type === 'discord'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-green-500/10 text-green-400'
              }`}>
                {item.type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
