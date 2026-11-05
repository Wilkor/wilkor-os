import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Upload, Plus, Trash2, Eye, EyeOff, Zap } from 'lucide-react';
import { MCPServerConfig } from '../../../shared/types';
import { MCPImportJsonModal } from './MCPImportJsonModal';

interface MCPAddServerModalProps {
  isOpen: boolean;
  presetData?: Partial<MCPServerConfig> | null;
  isEditing?: boolean;
  onClose: () => void;
  onSave: (config: MCPServerConfig) => Promise<void>;
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface EnvPair {
  key: string;
  value: string;
}

const FIELD_CLS =
  'w-full bg-black/30 border border-white/10 rounded-[16px] px-4 py-3.5 text-[11px] text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20 font-medium';

export const MCPAddServerModal: React.FC<MCPAddServerModalProps> = ({
  isOpen,
  presetData,
  isEditing = false,
  onClose,
  onSave,
  onAddToast,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [serverType, setServerType] = useState<'stdio' | 'websocket'>('stdio');
  const [command, setCommand] = useState('npx');
  const [args, setArgs] = useState('');
  const [url, setUrl] = useState('');
  const [envPairs, setEnvPairs] = useState<EnvPair[]>([{ key: '', value: '' }]);
  const [showValues, setShowValues] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showImportJson, setShowImportJson] = useState(false);
  const [isPreset, setIsPreset] = useState(false);

  // Preenche formulário com preset ou dados importados via JSON
  useEffect(() => {
    if (presetData) {
      const nativePresetIds = ['github', 'filesystem', 'postgres', 'git', 'brave-search', 'gmail', 'mongodb'];
      const isNative = presetData.id ? nativePresetIds.includes(presetData.id) : false;
      setIsPreset(isNative);
      setName(presetData.name || '');
      setIcon(presetData.icon || '');
      setDescription(presetData.description || '');
      setServerType(presetData.type || 'stdio');
      setCommand(presetData.command || 'npx');
      setArgs(presetData.args?.join(' ') || '');
      setUrl(presetData.url || '');
      const envFromPreset = presetData.env
        ? Object.entries(presetData.env).map(([k, v]) => ({ key: k, value: v || '' }))
        : [];
      setEnvPairs(envFromPreset.length > 0 ? envFromPreset : [{ key: '', value: '' }]);
    } else {
      resetForm();
    }
  }, [presetData, isOpen]);

  const resetForm = () => {
    setName('');
    setIcon('');
    setDescription('');
    setServerType('stdio');
    setCommand('npx');
    setArgs('');
    setUrl('');
    setEnvPairs([{ key: '', value: '' }]);
    setIsPreset(false);
    setShowImportJson(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImportJson = (imported: Partial<MCPServerConfig>) => {
    setName(imported.name || '');
    setIcon(imported.icon || '');
    setDescription(imported.description || '');
    setServerType(imported.type || 'stdio');
    setCommand(imported.command || 'npx');
    setArgs(imported.args?.join(' ') || '');
    setUrl(imported.url || '');
    const envFromImport = imported.env
      ? Object.entries(imported.env).map(([k, v]) => ({ key: k, value: v || '' }))
      : [];
    setEnvPairs(envFromImport.length > 0 ? envFromImport : [{ key: '', value: '' }]);
    setShowImportJson(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      onAddToast('O nome do servidor é obrigatório.', 'error');
      return;
    }
    if (serverType === 'websocket' && !url.trim()) {
      onAddToast('URL é obrigatória para servidores WebSocket.', 'error');
      return;
    }

    const env: Record<string, string> = {};
    envPairs.forEach((p) => {
      if (p.key.trim()) env[p.key.trim()] = p.value;
    });

    const randomEmojis = ['🔌', '⚙️', '🛠️', '💻', '🧠', '⚡', '🔍', '📦', '🤖', '🌐', '📊', '💾', '🖥️', '🚀', '🛡️', '📡', '🎯', '🧪', '🔑', '🗺️'];
    const finalIcon = icon.trim() || (isEditing ? presetData?.icon : randomEmojis[Math.floor(Math.random() * randomEmojis.length)]);

    const config: MCPServerConfig = {
      id: isEditing && presetData?.id ? presetData.id : Math.random().toString(36).substring(7),
      name: name.trim(),
      type: serverType,
      command: serverType === 'stdio' ? command.trim() : undefined,
      args: serverType === 'stdio' ? args.split(/\s+/).filter(Boolean) : undefined,
      url: serverType === 'websocket' ? url.trim() : undefined,
      env,
      enabled: presetData && 'enabled' in presetData ? !!presetData.enabled : true,
      icon: finalIcon || undefined,
      description: description.trim() || undefined,
    };

    setLoading(true);
    try {
      await onSave(config);
      handleClose();
    } catch (err: any) {
      onAddToast(`Falha: ${err.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const previewCommand =
    serverType === 'stdio'
      ? `${command || 'npx'} ${args || '...'}`
      : `ws: ${url || '...'}`;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#111111] border border-white/10 rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.7)] overflow-hidden"
            >
              {/* Top glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              {/* Header */}
              <div className="flex items-start justify-between p-7 pb-0">
                <div>
                  <h3 className="text-[15px] font-black text-white leading-tight">
                    {isEditing ? 'Edit MCP server' : 'Add a custom MCP'}
                  </h3>
                  <p className="text-[9px] text-white/30 font-medium mt-1 tracking-wide">
                    {isEditing ? 'Modify your custom MCP server configuration' : 'Create a custom MCP server for your organization'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Import JSON btn */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowImportJson(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[12px] transition-all"
                  >
                    <Upload size={11} className="text-white/60" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                      Import JSON
                    </span>
                  </motion.button>
                  <button
                    onClick={handleClose}
                    className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-[12px] flex items-center justify-center transition-all group"
                  >
                    <X size={15} className="text-white/40 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-7 pt-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">

                {/* Server name */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
                    Server name
                  </label>
                  <input
                    placeholder="e.g., My Custom Server"
                    value={name}
                    disabled={isPreset && !!presetData?.name}
                    onChange={(e) => setName(e.target.value)}
                    className={FIELD_CLS}
                  />
                </div>

                {/* Icon + Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
                      Icon <span className="opacity-50 normal-case font-medium">(optional)</span>
                    </label>
                    <input
                      placeholder="Paste in an emoji or URL"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className={FIELD_CLS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1">
                      Type
                    </label>
                    <div className="flex gap-2 h-[46px]">
                      {(['stdio', 'websocket'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setServerType(t)}
                          className={`flex-1 rounded-[14px] text-[9px] font-black uppercase tracking-widest transition-all border ${
                            serverType === t
                              ? 'bg-primary text-black border-primary shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]'
                              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Short description */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    Short description
                    <span className="w-3 h-3 rounded-full bg-white/10 text-white/30 flex items-center justify-center text-[8px] font-bold cursor-help" title="Aparece no card do servidor">?</span>
                  </label>
                  <textarea
                    placeholder="Brief description of your custom MCP server..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`${FIELD_CLS} resize-none`}
                  />
                </div>

                {/* Connection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
                      Connection
                    </span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  {serverType === 'stdio' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
                          Command
                        </label>
                        <input
                          placeholder="npx"
                          value={command}
                          disabled={isPreset && !!presetData?.command}
                          onChange={(e) => setCommand(e.target.value)}
                          className={`${FIELD_CLS} font-mono`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
                          Args
                        </label>
                        <input
                          placeholder="-y @scope/package"
                          value={args}
                          disabled={isPreset && (presetData?.args?.length || 0) > 0}
                          onChange={(e) => setArgs(e.target.value)}
                          className={`${FIELD_CLS} font-mono`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
                        WebSocket URL
                      </label>
                      <input
                        placeholder="ws://localhost:3000"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className={`${FIELD_CLS} font-mono`}
                      />
                    </div>
                  )}
                </div>

                {/* Env Vars */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                      Environment Variables
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowValues((v) => !v)}
                        className="flex items-center gap-1 text-[8px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showValues ? <EyeOff size={10} /> : <Eye size={10} />}
                        <span>{showValues ? 'Hide' : 'Show'}</span>
                      </button>
                      <button
                        onClick={() => setEnvPairs([...envPairs, { key: '', value: '' }])}
                        className="flex items-center gap-1 text-[9px] font-black uppercase text-primary hover:underline"
                      >
                        <Plus size={10} />
                        Add Var
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar">
                    {envPairs.map((pair, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          placeholder="KEY"
                          value={pair.key}
                          disabled={isPreset && idx < (presetData?.env ? Object.keys(presetData.env).length : 0)}
                          className="flex-1 bg-black/20 border border-white/10 rounded-[12px] px-3 py-2.5 text-[10px] outline-none focus:border-primary/30 text-white font-mono disabled:opacity-50 transition-all"
                          onChange={(e) => {
                            const n = [...envPairs];
                            n[idx] = { ...n[idx], key: e.target.value };
                            setEnvPairs(n);
                          }}
                        />
                        <input
                          placeholder="VALUE"
                          type={showValues ? 'text' : 'password'}
                          value={pair.value}
                          className="flex-[1.5] bg-black/20 border border-white/10 rounded-[12px] px-3 py-2.5 text-[10px] outline-none focus:border-primary/30 text-white font-mono transition-all"
                          onChange={(e) => {
                            const n = [...envPairs];
                            n[idx] = { ...n[idx], value: e.target.value };
                            setEnvPairs(n);
                          }}
                        />
                        <button
                          onClick={() => setEnvPairs(envPairs.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-[16px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal size={11} className="text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">
                      Preview
                    </span>
                  </div>
                  <code className="text-[10px] font-mono text-white/40 break-all leading-relaxed">
                    {previewCommand}
                  </code>
                </div>

                {/* Install button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-primary text-black font-black uppercase py-4 rounded-[20px] text-[11px] tracking-[0.2em] shadow-[0_12px_28px_rgba(var(--primary-rgb),0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <span className="animate-pulse">{isEditing ? 'Salvando...' : 'Conectando...'}</span>
                  ) : (
                    <>
                      <Zap size={14} strokeWidth={2.5} />
                      {isEditing ? 'Save changes' : 'Install and enable'}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sub-modal: Import JSON */}
      <MCPImportJsonModal
        isOpen={showImportJson}
        onClose={() => setShowImportJson(false)}
        onImport={handleImportJson}
      />
    </>
  );
};
