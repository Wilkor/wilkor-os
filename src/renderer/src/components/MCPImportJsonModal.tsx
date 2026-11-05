import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { MCPServerConfig } from '../../../shared/types';

interface MCPImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (config: Partial<MCPServerConfig>) => void;
}

const EXAMPLE_JSON = `// Claude Desktop / Windsurf:
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@example/mcp-server"],
      "env": { "API_KEY": "your-key" }
    }
  }
}

// Formato "servers" (GitHub MCP, etc.):
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}`;

/** Normaliza o tipo: "http" e "sse" → websocket, demais → stdio */
function normalizeType(type?: string): 'stdio' | 'websocket' {
  if (type === 'websocket' || type === 'http' || type === 'sse') return 'websocket';
  return 'stdio';
}

function parseServerEntry(name: string, cfg: any): Partial<MCPServerConfig> {
  const serverType = normalizeType(cfg.type);
  return {
    name: String(name),
    type: serverType,
    command: serverType === 'stdio' ? (cfg.command || 'npx') : undefined,
    args: serverType === 'stdio' ? (cfg.args || []) : undefined,
    url: serverType === 'websocket' ? cfg.url : undefined,
    env: cfg.env || {},
    description: cfg.description,
    icon: cfg.icon,
  };
}

function parseJsonConfig(raw: string): Partial<MCPServerConfig> | null {
  try {
    const parsed = JSON.parse(raw);

    // Formato Claude Desktop / Windsurf: { mcpServers: { name: { command, args, env } } }
    if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
      const entries = Object.entries(parsed.mcpServers as Record<string, any>);
      if (entries.length > 0) {
        const [name, cfg] = entries[0];
        return parseServerEntry(name, cfg);
      }
    }

    // Formato "servers": { name: { type, url | command, args } } — GitHub MCP, Devin CLI, etc.
    if (parsed.servers && typeof parsed.servers === 'object') {
      const entries = Object.entries(parsed.servers as Record<string, any>);
      if (entries.length > 0) {
        const [name, cfg] = entries[0];
        return parseServerEntry(name, cfg);
      }
    }

    // Formato direto: { command, args, env, name } ou { url, type, name }
    if (parsed.command || parsed.url || parsed.name) {
      return {
        name: parsed.name || 'Imported Server',
        type: normalizeType(parsed.type),
        command: normalizeType(parsed.type) === 'stdio' ? (parsed.command || 'npx') : undefined,
        args: normalizeType(parsed.type) === 'stdio' ? (parsed.args || []) : undefined,
        url: normalizeType(parsed.type) === 'websocket' ? parsed.url : undefined,
        env: parsed.env || {},
        description: parsed.description,
        icon: parsed.icon,
      };
    }

    return null;
  } catch {
    return null;
  }
}


export const MCPImportJsonModal: React.FC<MCPImportJsonModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImport = () => {
    setError(null);
    if (!jsonText.trim()) {
      setError('Cole um JSON válido antes de importar.');
      return;
    }
    const config = parseJsonConfig(jsonText);
    if (!config) {
      setError(
        'Formato inválido. Suporte: Claude Desktop, Windsurf, Devin CLI ou configuração direta.'
      );
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onImport(config);
      setJsonText('');
      setSuccess(false);
      onClose();
    }, 600);
  };

  const handleClose = () => {
    setJsonText('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-[28px] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-[0.15em]">
                  Import JSON config
                </h3>
                <p className="text-[9px] text-white/30 font-medium mt-1 leading-relaxed max-w-[280px]">
                  Cole uma config de servidor MCP. Suporta Claude Desktop, Windsurf, Devin CLI e configs diretas.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all group shrink-0"
              >
                <X size={14} className="text-white/40 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Textarea */}
            <div className="relative mb-4">
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setError(null);
                }}
                placeholder={EXAMPLE_JSON}
                rows={10}
                className="w-full bg-black/40 border border-white/10 rounded-[16px] px-4 py-3 text-[11px] font-mono text-white/70 outline-none focus:border-primary/40 resize-none leading-relaxed transition-all placeholder:text-white/15"
              />
              {/* Upload icon decorativo */}
              <div className="absolute bottom-3 right-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Upload size={10} className="text-primary" />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-[12px]"
                >
                  <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[9px] text-red-400 font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-[12px]"
                >
                  <CheckCircle size={12} className="text-green-400 shrink-0" />
                  <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest">
                    Importado com sucesso!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-[16px] text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImport}
                className="flex-1 py-3 bg-primary text-black rounded-[16px] text-[10px] font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(var(--primary-rgb),0.25)] transition-all"
              >
                Import
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
