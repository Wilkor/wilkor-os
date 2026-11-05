import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Database, GitBranch, Search, FileCode, Mail, Edit2, Trash2 } from 'lucide-react';
import { MCPServerConfig } from '../../../shared/types';

interface Preset {
  id: string;
  name: string;
  command: string;
  args: string[];
  icon: React.ElementType;
  color: string;
  category: string;
  description: string;
  requiredEnv?: string[];
}

export const PRESETS: Preset[] = [
  {
    id: 'github',
    name: 'GitHub',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    icon: Globe,
    color: 'text-white',
    category: 'Dev',
    description: 'Repos, PRs, issues e mais',
    requiredEnv: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    icon: FileCode,
    color: 'text-blue-400',
    category: 'System',
    description: 'Leitura e escrita de arquivos',
    requiredEnv: [],
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    icon: Database,
    color: 'text-cyan-400',
    category: 'Database',
    description: 'Queries e schema do banco',
    requiredEnv: ['POSTGRES_CONNECTION_STRING'],
  },
  {
    id: 'git',
    name: 'Git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    icon: GitBranch,
    color: 'text-orange-400',
    category: 'Dev',
    description: 'Histórico, commits e diffs',
    requiredEnv: [],
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    icon: Search,
    color: 'text-orange-300',
    category: 'Search',
    description: 'Pesquisa web privada',
    requiredEnv: ['BRAVE_API_KEY'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gmail'],
    icon: Mail,
    color: 'text-red-400',
    category: 'Comm',
    description: 'Leitura e envio de e-mails',
    requiredEnv: ['GMAIL_CREDENTIALS'],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    command: 'npx',
    args: ['-y', 'mongodb-mcp-server@latest'],
    icon: Database,
    color: 'text-green-500',
    category: 'Database',
    description: 'Queries no MongoDB',
    requiredEnv: ['MDB_MCP_CONNECTION_STRING'],
  },
];

interface MCPPresetGridProps {
  customPresets: MCPServerConfig[];
  searchQuery: string;
  onSelectPreset: (preset: any) => void;
  onEditPreset: (preset: MCPServerConfig) => void;
  onDeletePreset: (id: string) => void;
}

export const MCPPresetGrid: React.FC<MCPPresetGridProps> = ({
  customPresets,
  searchQuery,
  onSelectPreset,
  onEditPreset,
  onDeletePreset,
}) => {
  const allPresets = useMemo(() => [
    ...PRESETS.map(p => ({
      id: p.id,
      name: p.name,
      command: p.command,
      args: p.args,
      icon: p.icon,
      color: p.color,
      category: p.category,
      description: p.description,
      requiredEnv: p.requiredEnv
    })),
    ...customPresets.map(p => ({
      id: p.id,
      name: p.name,
      command: p.command,
      args: p.args,
      icon: p.icon || '🔌',
      color: 'text-primary',
      category: 'Custom',
      description: p.description || 'Imported MCP Server',
      requiredEnv: p.env ? Object.keys(p.env) : []
    }))
  ], [customPresets]);

  const filteredPresets = useMemo(() => {
    if (!searchQuery) return allPresets;
    const lower = searchQuery.toLowerCase();
    return allPresets.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
    );
  }, [allPresets, searchQuery]);

  return (
    <div className="pt-2">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">
          Plugins Marketplace
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-border/30 to-transparent" />
      </div>
      {filteredPresets.length === 0 ? (
        <div className="py-6 text-center bg-black/20 rounded-[20px] border border-white/5">
          <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">
            Nenhum preset encontrado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filteredPresets.map((preset, i) => (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPreset(preset as any)}
              className="flex flex-col items-center gap-2 p-3.5 bg-bg-panel/50 border border-border/30 hover:border-primary/30 hover:bg-black/20 rounded-[20px] transition-all text-center group relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300" />

              {preset.category === 'Custom' && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const original = customPresets.find((p) => p.id === preset.id);
                      if (original) onEditPreset(original);
                    }}
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors border border-white/5"
                    title="Editar Preset"
                  >
                    <Edit2 size={10} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(preset.id);
                    }}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-500/10"
                    title="Deletar Preset"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}

              <div
                className={`p-2.5 rounded-[12px] bg-black/40 group-hover:scale-110 transition-transform duration-300 ${preset.color}`}
              >
                {typeof preset.icon === 'string' ? (
                  preset.icon.startsWith('http') ? (
                    <img src={preset.icon} alt={preset.name} className="w-[18px] h-[18px] rounded object-cover" />
                  ) : (
                    <span className="text-base leading-none">{preset.icon}</span>
                  )
                ) : (
                  <preset.icon size={18} />
                )}
              </div>
              <div className="min-w-0 w-full text-center">
                <span className="text-[10px] font-black text-text-main block leading-tight tracking-tight uppercase truncate">
                  {preset.name}
                </span>
                <span className="text-[7px] text-text-muted/30 font-black uppercase tracking-tighter mt-0.5 block">
                  {preset.category}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};
