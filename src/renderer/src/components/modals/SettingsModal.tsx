import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Folder, 
  Bot, 
  Sparkles, 
  Puzzle, 
  ShieldAlert, 
  Check, 
  X,
  Eye,
  EyeOff,
  Clock,
  Database
} from 'lucide-react';
import { THEMES } from '../../config/themes';
import { CronSettingsTab } from './CronSettingsTab';
import { ServicesSettingsTab } from './ServicesSettingsTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  setSettings: (settings: any) => void;
  saveSettings: (settings: any) => void;
  currentThemeId: string;
  setCurrentThemeId: (id: string) => void;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: any) => void;
  setActiveSidebarTab: (tab: any) => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const SettingsTab: React.FC<{ id: string, label: string, icon: any, active: boolean, onClick: (id: any) => void }> = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-white/5 hover:text-text-main'}`}
  >
    <Icon size={18} />
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const SectionTitle: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-2">
    <h3 className="text-xl font-black italic text-text-main leading-tight">{title}</h3>
    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{subtitle}</p>
  </div>
);

const ApiKeyInput: React.FC<{ label: string, value: string, type?: string, onChange: (val: string) => void }> = ({ label, value, type = "password", onChange }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const finalType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-80">{label}</label>
      <div className="relative">
        <input
          type={finalType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-bg-app border border-border rounded-2xl p-4 text-sm font-mono outline-none focus:border-primary/50 text-text-main pr-12"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isPassword && (
            <button 
              onClick={() => setShow(!show)}
              className="text-text-muted hover:text-primary transition-colors p-1"
              title={show ? "Esconder Token" : "Mostrar Token"}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <div className="text-primary opacity-30 pointer-events-none">
            <ShieldAlert size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeButton: React.FC<{ theme: any, active: boolean, onClick: () => void }> = ({ theme, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${active
      ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
      : 'bg-bg-app border-transparent hover:border-border'
      }`}
  >
    <div
      className="w-4 h-4 rounded-full border border-border shrink-0"
      style={{ backgroundColor: theme.colors.primary }}
    />
    <span className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-primary' : 'text-text-muted'}`}>
      {theme.name}
    </span>
    {active && <Check size={12} className="ml-auto text-primary" />}
  </button>
);

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  saveSettings,
  currentThemeId,
  setCurrentThemeId,
  activeSettingsTab,
  setActiveSettingsTab,
  setActiveSidebarTab,
  addToast
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 backdrop-blur-md bg-bg-overlay">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-6xl h-[75vh] min-h-[700px] bg-bg-panel border border-border rounded-[32px] overflow-hidden shadow-2xl flex"
          >
            {/* Internal Sidebar */}
            <div className="w-64 bg-bg-app border-r border-border p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-primary/20 text-primary rounded-2xl">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic text-text-main">Ajustes</h2>
                  <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest leading-none">Settings v2.0</p>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <SettingsTab id="general" label="Geral" icon={Folder} active={activeSettingsTab === 'general'} onClick={setActiveSettingsTab} />
                <SettingsTab id="ai" label="Modelos de IA" icon={Bot} active={activeSettingsTab === 'ai'} onClick={setActiveSettingsTab} />
                <SettingsTab id="themes" label="Temas & UI" icon={Sparkles} active={activeSettingsTab === 'themes'} onClick={setActiveSettingsTab} />
                <SettingsTab id="mcp" label="Integrações MCP" icon={Puzzle} active={activeSettingsTab === 'mcp'} onClick={setActiveSettingsTab} />
                <SettingsTab id="services" label="Serviços & APIs" icon={Database} active={activeSettingsTab === 'services'} onClick={setActiveSettingsTab} />
                <SettingsTab id="advanced" label="Avançado" icon={ShieldAlert} active={activeSettingsTab === 'advanced'} onClick={setActiveSettingsTab} />
                <SettingsTab id="cron" label="Agendamentos" icon={Clock} active={activeSettingsTab === 'cron'} onClick={setActiveSettingsTab} />
              </div>

              <button
                onClick={() => saveSettings(settings)}
                className="w-full p-4 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.3)]"
              >
                <Check size={14} /> Salvar Alterações
              </button>

              <button
                onClick={onClose}
                className="mt-3 w-full p-4 bg-bg-panel border border-border hover:border-primary/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <X size={14} /> Fechar
              </button>
            </div>

            {/* Internal Content Area */}
            <div className="flex-1 p-10 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeSettingsTab === 'general' && (
                  <motion.div key="general" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <SectionTitle title="Regras Gerais" subtitle="Comportamento padrão do sistema" />
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-80">Regras do Sistema (System Instructions)</label>
                      <textarea
                        value={settings.systemRules || ''}
                        onChange={(e) => setSettings({ ...settings, systemRules: e.target.value })}
                        placeholder="Ex: 'Sempre responda em português', 'Use TypeScript por padrão'..."
                        className="w-full bg-bg-app border border-border rounded-2xl p-4 text-xs h-32 outline-none focus:border-primary/50 text-text-main resize-none"
                      />
                    </div>

                    <div className="pt-6 border-t border-border space-y-4">
                      <SectionTitle title="Ativação por Voz (Hands-Free)" subtitle="Controle o assistente wOs sem cliques" />
                      <div className="flex items-center justify-between p-4 bg-bg-app border border-border rounded-2xl">
                        <div>
                          <h4 className="text-[11px] font-black text-text-main uppercase">Ativação por Áudio Passiva</h4>
                          <p className="text-[9px] text-text-muted font-bold">O wOs escutará passivamente a wake-word ("hey wos", "ws", etc.) e executará comandos locais de forma automática</p>
                        </div>
                        <div 
                          onClick={() => {
                            const current = settings.audioActivation?.enabled ?? true;
                            setSettings({
                              ...settings,
                              audioActivation: {
                                ...(settings.audioActivation || {}),
                                enabled: !current
                              }
                            });
                          }}
                          className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors duration-200 ${
                            (settings.audioActivation?.enabled ?? true) ? 'bg-primary' : 'bg-white/10'
                          }`}
                        >
                          <div 
                            className={`w-4 h-4 bg-black rounded-full absolute transition-all duration-200 ${
                              (settings.audioActivation?.enabled ?? true) ? 'right-1' : 'left-1'
                            }`} 
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'ai' && (
                  <motion.div key="ai" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <SectionTitle title="Chaves de API" subtitle="Configuração de provedores de IA" />
                    <div className="space-y-6">
                      <ApiKeyInput label="Google Gemini Key" value={settings.geminiKey || ''} onChange={(val) => setSettings({ ...settings, geminiKey: val })} />
                      <ApiKeyInput label="OpenAI Key" value={settings.openAIKey || ''} onChange={(val) => setSettings({ ...settings, openAIKey: val })} />
                      <ApiKeyInput label="Anthropic Key" value={settings.anthropicKey || ''} onChange={(val) => setSettings({ ...settings, anthropicKey: val })} />
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'themes' && (
                  <motion.div key="themes" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <SectionTitle title="Aparência" subtitle="Personalize o visual da sua IDE Elite" />
                    <div className="grid grid-cols-2 gap-4">
                      {THEMES.map(theme => (
                        <ThemeButton key={theme.id} theme={theme} active={currentThemeId === theme.id} onClick={() => {
                          setCurrentThemeId(theme.id);
                          saveSettings({ ...settings, theme: theme.id });
                        }} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'mcp' && (
                  <motion.div key="mcp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <SectionTitle title="Model Context Protocol" subtitle="Expanda as capacidades da sua IA" />
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                      <p className="text-xs text-text-main leading-relaxed italic">
                        O MCP permite que a IA interaja de forma segura com ferramentas de terceiros (GitHub, etc). As instâncias integradas aparecem na aba MCP da barra lateral.
                      </p>
                    </div>
                    <button
                      onClick={() => { onClose(); setActiveSidebarTab('mcp'); }}
                      className="flex items-center gap-3 p-4 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Abrir Painel de Gestão MCP <Puzzle size={16} />
                    </button>
                  </motion.div>
                )}

                {activeSettingsTab === 'advanced' && (
                  <motion.div key="advanced" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <SectionTitle title="Segurança & Dev" subtitle="Ajustes finos para usuários especialistas" />
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-bg-app border border-border rounded-2xl">
                        <div>
                          <h4 className="text-[11px] font-black text-text-main uppercase">Confirmação de Ações</h4>
                          <p className="text-[9px] text-text-muted font-bold">Solicitar permissão antes de executar ferramentas de escrita via MCP</p>
                        </div>
                        <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                          <div className="w-4 h-4 bg-black rounded-full absolute right-1" />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border">
                        <SectionTitle title="BitBucket Cloud Integration" subtitle="Filtre apenas Pull Requests oficiais" />
                        <div className="space-y-4 mt-4">
                          <ApiKeyInput label="BitBucket Email" value={settings.bitbucketUser || ''} type="text" onChange={(val) => setSettings({ ...settings, bitbucketUser: val })} />
                          <ApiKeyInput label="BitBucket API Token (Atlassian)" value={settings.bitbucketToken || ''} onChange={(val) => setSettings({ ...settings, bitbucketToken: val })} />
                          <p className="text-[9px] text-text-muted italic">* Se configurado, o sistema buscará apenas PRs reais com status OPEN.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSettingsTab === 'cron' && (
                  <CronSettingsTab addToast={addToast} theme={THEMES.find(t => t.id === currentThemeId) || THEMES[0]} />
                )}

                {activeSettingsTab === 'services' && (
                  <ServicesSettingsTab settings={settings} setSettings={setSettings} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
