import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface ServicesSettingsTabProps {
  settings: any;
  setSettings: (settings: any) => void;
}

const ApiKeyInput: React.FC<{ label: string, value: string, type?: string, onChange: (val: string) => void }> = ({ label, value, type = "password", onChange }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const finalType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
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

const SectionTitle: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-2">
    <h3 className="text-xl font-black italic text-text-main leading-tight">{title}</h3>
    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{subtitle}</p>
  </div>
);

export const ServicesSettingsTab: React.FC<ServicesSettingsTabProps> = ({ settings, setSettings }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="space-y-8 max-h-[75vh] overflow-y-auto pr-2"
    >
      <SectionTitle title="Serviços & APIs" subtitle="Configurações de infraestrutura e credenciais locais" />
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <ApiKeyInput 
            label="MongoDB Connection URI" 
            value={settings.mongodbUri || ''} 
            type="text" 
            onChange={(val) => setSettings({ ...settings, mongodbUri: val })} 
          />
          <ApiKeyInput 
            label="Liderança Técnica (techLeader)" 
            value={settings.techLeader || ''} 
            type="text" 
            onChange={(val) => setSettings({ ...settings, techLeader: val })} 
          />
        </div>

        <div className="border-t border-border/30 pt-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-3">Trello Cloud API</h4>
          <div className="grid grid-cols-2 gap-6">
            <ApiKeyInput 
              label="Trello API Key" 
              value={settings.trelloApiKey || ''} 
              onChange={(val) => setSettings({ ...settings, trelloApiKey: val })} 
            />
            <ApiKeyInput 
              label="Trello Token" 
              value={settings.trelloToken || ''} 
              onChange={(val) => setSettings({ ...settings, trelloToken: val })} 
            />
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-3">Discord Bot & Mentions</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <ApiKeyInput 
                label="Discord Bot Token" 
                value={settings.discordBotToken || ''} 
                onChange={(val) => setSettings({ ...settings, discordBotToken: val })} 
              />
              <ApiKeyInput 
                label="Discord Default Channel ID" 
                value={settings.discordChannelId || ''} 
                type="text" 
                onChange={(val) => setSettings({ ...settings, discordChannelId: val })} 
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-3">Caminhos do Sistema</h4>
          <div className="grid grid-cols-2 gap-6">
            <ApiKeyInput 
              label="Caminho do agy.exe (opcional)" 
              value={settings.agyPath || ''} 
              type="text" 
              onChange={(val) => setSettings({ ...settings, agyPath: val })} 
            />
            <ApiKeyInput 
              label="Caminho da pasta de Skills (opcional)" 
              value={settings.skillsPath || ''} 
              type="text" 
              onChange={(val) => setSettings({ ...settings, skillsPath: val })} 
            />
          </div>
        </div>

        <div className="border-t border-border/30 pt-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-wider mb-3">Pesquisa na Internet (Web Search APIs)</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <ApiKeyInput 
                label="Tavily API Key (Recomendado)" 
                value={settings.tavilyApiKey || ''} 
                onChange={(val) => setSettings({ ...settings, tavilyApiKey: val })} 
              />
              <ApiKeyInput 
                label="Brave Search API Key" 
                value={settings.braveSearchApiKey || ''} 
                onChange={(val) => setSettings({ ...settings, braveSearchApiKey: val })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <ApiKeyInput 
                label="Google Search API Key" 
                value={settings.googleSearchApiKey || ''} 
                onChange={(val) => setSettings({ ...settings, googleSearchApiKey: val })} 
              />
              <ApiKeyInput 
                label="Google Search CX ID" 
                value={settings.googleSearchCx || ''} 
                type="text"
                onChange={(val) => setSettings({ ...settings, googleSearchCx: val })} 
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
