import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Cpu, Activity, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCPServerConfig } from '../../../shared/types';
import { MCPServerCard } from './MCPServerCard';
import { MCPAddServerModal } from './MCPAddServerModal';
import { MCPPresetGrid, PRESETS } from './MCPPresetGrid';

interface MCPPanelProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const MCPPanel: React.FC<MCPPanelProps> = ({ onAddToast }) => {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [customPresets, setCustomPresets] = useState<MCPServerConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [presetData, setPresetData] = useState<Partial<MCPServerConfig> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<'server' | 'preset' | null>(null);

  useEffect(() => {
    loadServers();
    loadPresets();
  }, []);

  const loadServers = async () => {
    if (window.api?.mcp) {
      const list = await window.api.mcp.listServers();
      setServers(list);
    }
  };

  const loadPresets = async () => {
    if (window.api?.mcp) {
      const list = await window.api.mcp.listPresets();
      setCustomPresets(list);
    }
  };

  const handleOpenCustom = () => {
    setPresetData(null);
    setIsEditing(false);
    setEditType(null);
    setModalOpen(true);
  };

  const handleSelectPreset = (preset: (typeof PRESETS)[number]) => {
    setPresetData({
      name: preset.name,
      type: 'stdio',
      command: preset.command,
      args: preset.args,
      description: preset.description,
      env: preset.requiredEnv
        ? Object.fromEntries(preset.requiredEnv.map((k) => [k, '']))
        : {},
    });
    setIsEditing(false);
    setEditType(null);
    setModalOpen(true);
  };

  const handleEditServer = (server: MCPServerConfig) => {
    setPresetData(server);
    setIsEditing(true);
    setEditType('server');
    setModalOpen(true);
  };

  const handleEditPreset = (preset: MCPServerConfig) => {
    setPresetData(preset);
    setIsEditing(true);
    setEditType('preset');
    setModalOpen(true);
  };

  const handleDeletePreset = async (id: string) => {
    if (!window.api?.mcp) return;
    try {
      await window.api.mcp.removePreset(id);
      onAddToast('Preset removido do Marketplace.', 'info');
      await loadServers();
      await loadPresets();
    } catch (err: any) {
      onAddToast(`Erro ao remover preset: ${err.message}`, 'error');
    }
  };

  const handleSaveServer = async (config: MCPServerConfig) => {
    if (!window.api?.mcp) return;
    try {
      if (isEditing && editType === 'preset') {
        await window.api.mcp.savePreset(config);
        onAddToast(`Preset ${config.name} atualizado!`, 'success');
      } else {
        await window.api.mcp.addServer(config);
        onAddToast(
          isEditing ? `Servidor ${config.name} atualizado!` : `Servidor ${config.name} ativado!`,
          'success'
        );
      }
    } catch (err: any) {
      onAddToast(err.message, 'error');
    } finally {
      await loadServers();
      await loadPresets();
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!window.api?.mcp) return;
    try {
      await window.api.mcp.toggleServer(id, !current);
      await loadServers();
      await loadPresets();
    } catch (err: any) {
      onAddToast(`Erro ao alternar servidor: ${err.message}`, 'error');
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.api?.mcp) return;
    try {
      await window.api.mcp.removeServer(id);
      onAddToast('Servidor removido.', 'info');
      await loadServers();
      await loadPresets();
    } catch (err: any) {
      onAddToast(`Erro ao remover: ${err.message}`, 'error');
    }
  };

  const filteredServers = useMemo(() => {
    if (!searchQuery) return servers;
    const lower = searchQuery.toLowerCase();
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.description?.toLowerCase().includes(lower)
    );
  }, [servers, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-bg-app border-l border-border/40">
      {/* Header */}
      <div className="px-6 py-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
              <Cpu size={16} />
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-widest">
                Model Context
              </h2>
              <h2 className="text-xs font-black text-primary uppercase tracking-widest">
                Protocol
              </h2>
              <p className="text-[9px] text-text-muted/60 font-bold uppercase tracking-widest mt-0.5">
                Inteligência Distribuída
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCustom}
            className="w-10 h-10 bg-primary text-black rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={18} strokeWidth={3} />
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/50" />
          <input
            type="text"
            placeholder="Pesquisar servidores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-text-main placeholder:text-text-muted/40 focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 no-scrollbar pt-2">
        {/* Empty state */}
        {servers.length === 0 && !searchQuery && (
          <div className="py-10 px-6 border border-border/30 border-dashed rounded-[24px] text-center space-y-4 bg-black/5">
            <Activity size={28} className="mx-auto text-text-muted/20" />
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest leading-relaxed">
              Nenhum servidor instalado<br />
              <span className="opacity-40">Selecione um preset abaixo ou adicione um custom</span>
            </p>
          </div>
        )}

        {servers.length > 0 && filteredServers.length === 0 && (
          <div className="py-8 text-center bg-black/20 rounded-[20px] border border-white/5">
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
              Nenhum resultado
            </p>
          </div>
        )}

        {/* Server Cards */}
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredServers.map((server) => (
              <MCPServerCard
                key={server.id}
                server={server}
                onToggle={handleToggle}
                onRemove={handleRemove}
                onEdit={handleEditServer}
                onAddToast={onAddToast}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Presets */}
        <MCPPresetGrid
          customPresets={customPresets}
          searchQuery={searchQuery}
          onSelectPreset={handleSelectPreset}
          onEditPreset={handleEditPreset}
          onDeletePreset={handleDeletePreset}
        />
      </div>

      {/* Modal de adicionar servidor */}
      <MCPAddServerModal
        isOpen={modalOpen}
        presetData={presetData}
        isEditing={isEditing}
        onClose={() => {
          setModalOpen(false);
          setPresetData(null);
          setIsEditing(false);
          setEditType(null);
        }}
        onSave={handleSaveServer}
        onAddToast={onAddToast}
      />
    </div>
  );
};
