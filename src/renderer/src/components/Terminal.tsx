import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, X, ChevronDown, AlertCircle, Terminal as TerminalIcon, Layout, Info, Bot, FolderOpen } from 'lucide-react'
import TerminalInstance from './TerminalInstance'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'problems' | 'output' | 'debug' | 'terminal' | 'ports'

interface TerminalTab {
  id: string;
  name: string;
  shell: string;
  cwd: string;
}

interface TerminalProps {
  workspaceFolders?: string[];
  themeId?: string;
  onAnalyzeError?: (terminalId: string) => void;
}

export default function Terminal({ workspaceFolders = [], themeId, onAnalyzeError }: TerminalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('terminal')
  const [terminals, setTerminals] = useState<TerminalTab[]>([
    { id: 'default', name: 'pwsh', shell: 'powershell.exe', cwd: '.' }
  ])
  const [activeTerminalId, setActiveTerminalId] = useState('default')
  const [showFolderModal, setShowFolderModal] = useState(false)

  useEffect(() => {
    const initDefaultTerminal = async () => {
      if (window.api && window.api.terminal) {
        try {
          await window.api.terminal.create('default', 'powershell.exe', '.');
        } catch (err) {
          console.error('Erro ao instanciar terminal padrão:', err);
        }
      }
    };
    initDefaultTerminal();
  }, []);

  const [problems] = useState([
    { id: 1, file: 'App.tsx', message: 'Unexpected semicolon', line: 42, severity: 'error' },
    { id: 2, file: 'fs.ts', message: 'Variable "unused" is never read', line: 12, severity: 'warning' }
  ])

  const createTerminal = async (cwd: string = '.', shell: string = 'powershell.exe') => {
    const id = `term-${Date.now()}`;
    const folderName = cwd === '.' ? 'pwsh' : cwd.split(/[\\\/]/).pop() || 'pwsh';
    const name = folderName;

    if (window.api && window.api.terminal) {
      await window.api.terminal.create(id, shell, cwd);
      setTerminals(prev => [...prev, { id, name, shell, cwd }]);
      setActiveTerminalId(id);
      setActiveTab('terminal');
    }
    setShowFolderModal(false);
  };

  const handlePlusClick = () => {
    if (workspaceFolders.length > 0) {
      setShowFolderModal(true);
    } else {
      createTerminal('.');
    }
  };

  const killTerminal = async (id: string) => {
    if (terminals.length <= 1) return;

    if (window.api && window.api.terminal) {
      await window.api.terminal.kill(id);
      const newTerminals = terminals.filter(t => t.id !== id);
      setTerminals(newTerminals);
      if (activeTerminalId === id) {
        setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
      }
    }
  };

  const mainTabs = [
    { id: 'problems', name: 'Problems', count: 2 },
    { id: 'output', name: 'Output' },
    { id: 'debug', name: 'Debug Console' },
    { id: 'terminal', name: 'Terminal' },
    { id: 'ports', name: 'Ports' },
  ]

  return (
    <div className="h-full flex flex-col bg-bg-app rounded-none overflow-hidden">
      {/* VS Code Style Header */}
      <div className="flex items-center justify-between px-4 h-9 bg-bg-panel">
        <div className="flex items-center gap-4 h-full ml-2">
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative h-full flex items-center gap-1.5 px-2 text-[12px] font-medium transition-all ${
                activeTab === tab.id ? 'text-primary' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <span className="whitespace-nowrap">{tab.name}</span>
              {tab.count !== undefined && (
                <span className="flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-primary/20 text-primary">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div layoutId="terminal-tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Right-side Actions */}
        <div className="flex items-center gap-0.5">
          {activeTab === 'terminal' && (
            <div className="flex items-center mr-2">
              {onAnalyzeError && (
                <button
                  onClick={() => onAnalyzeError(activeTerminalId)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-[10px] font-bold uppercase tracking-wider mr-2 flex shrink-0"
                  title="Analisar erro no terminal com IA"
                >
                  <Bot size={12} className="animate-pulse mr-1" />
                  Analisar com IA
                </button>
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer group transition-all">
                <TerminalIcon size={12} className="text-text-muted group-hover:text-primary" />
                <span className="text-[11px] font-medium text-text-muted group-hover:text-text-main truncate max-w-[120px]">
                  {terminals.find(t => t.id === activeTerminalId)?.name || 'pwsh'} - wilkorOs
                </span>
                <ChevronDown size={12} className="text-text-muted/40" />
              </div>

              <div className="flex items-center ml-1">
                <button onClick={handlePlusClick} className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-primary transition-all" title="Novo Terminal"><Plus size={16} /></button>
                <button className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-text-main transition-all"><ChevronDown size={12} /></button>
              </div>

              <div className="w-px h-3 bg-white/5 mx-1" />

              <button className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-primary transition-all" title="Dividir Terminal"><Layout size={16} /></button>
              <button onClick={() => killTerminal(activeTerminalId)} className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-red-400 transition-all" title="Fechar Terminal"><Trash2 size={16} /></button>
            </div>
          )}
          <button className="p-1.5 rounded hover:bg-white/5 text-text-muted hover:text-text-main transition-all"><Plus size={14} className="rotate-45" /></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-bg-editor">
        <AnimatePresence mode="wait">
          {activeTab === 'terminal' && (
            <motion.div
              key="term"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full w-full flex"
            >
              {/* Left: terminal session list */}
              <div className="w-48 border-r border-border mr-2 pr-2 hidden md:flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {terminals.map(t => {
                  const folderName = t.cwd === '.' ? 'pwsh' : (t.cwd.split(/[\\\/]/).pop() || t.name)
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTerminalId(t.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all ${
                        activeTerminalId === t.id ? 'bg-primary/10 text-primary' : 'text-text-muted/60 hover:bg-bg-app'
                      }`}
                    >
                      <TerminalIcon size={12} className="shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[11px] font-bold italic truncate block">{folderName}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Main Terminal Area */}
              <div className="flex-1 h-full overflow-hidden">
                {terminals.map(t => (
                  <TerminalInstance key={t.id} id={t.id} isActive={activeTerminalId === t.id} themeId={themeId} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'problems' && (
            <motion.div
              key="problems"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="h-full w-full flex flex-col p-4 font-mono text-xs overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center gap-2 mb-4 text-text-muted/40">
                <Info size={14} />
                <span className="uppercase tracking-widest text-[9px] font-black italic">Issues in Workspace</span>
              </div>
              {problems.map(p => (
                <div key={p.id} className="flex items-start gap-4 p-2 hover:bg-bg-app rounded-xl cursor-not-allowed group transition-all">
                  <AlertCircle size={14} className={p.severity === 'error' ? 'text-red-500' : 'text-yellow-500'} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-text-main font-bold">{p.message}</span>
                      <span className="text-text-muted/40 text-[10px]">{p.file}:{p.line}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {(activeTab === 'output' || activeTab === 'debug' || activeTab === 'ports') && (
            <motion.div
              key="other"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full w-full flex items-center justify-center text-text-muted/20 flex-col gap-4 italic"
            >
              <Bot size={40} className="animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Painel em construção pelo wOs AI</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal centralizado de seleção de pasta */}
      {createPortal(
        <AnimatePresence>
          {showFolderModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center p-8"
              onClick={() => setShowFolderModal(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-bg-panel border border-border rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
              >
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <TerminalIcon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-text-main uppercase tracking-widest">Novo Terminal</h2>
                      <p className="text-[10px] text-text-muted/60 font-medium mt-0.5">Escolha a pasta de trabalho</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="p-2 rounded-xl hover:bg-bg-app text-text-muted/40 hover:text-text-main transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Lista de pastas */}
                <div className="p-4 max-h-80 overflow-y-auto no-scrollbar">
                  {workspaceFolders.map((folder, index) => {
                    const name = folder.split(/[\\\/]/).pop() || folder
                    return (
                      <motion.button
                        key={folder}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => createTerminal(folder)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-primary/8 hover:border-primary/20 border border-transparent text-left transition-all group mb-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-bg-app border border-border group-hover:bg-primary/10 group-hover:border-primary/20 flex items-center justify-center transition-all shrink-0">
                          <FolderOpen size={18} className="text-text-muted/40 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                          <span className="text-[13px] font-bold text-text-main/80 group-hover:text-text-main truncate transition-colors">{name}</span>
                          <span className="text-[10px] text-text-muted/40 truncate font-mono mt-0.5">{folder}</span>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-white/0 group-hover:bg-primary/20 flex items-center justify-center transition-all shrink-0">
                          <Plus size={12} className="text-white/0 group-hover:text-primary transition-all" />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-text-muted/40 font-medium">{workspaceFolders.length} {workspaceFolders.length === 1 ? 'pasta disponível' : 'pastas disponíveis'}</span>
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="text-[10px] font-bold text-text-muted/40 hover:text-text-main uppercase tracking-widest transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
