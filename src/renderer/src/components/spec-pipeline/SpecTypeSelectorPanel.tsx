import React from 'react';
import { Sparkles, Bug, ArrowRight, Folder, FolderPlus, HelpCircle } from 'lucide-react';
import { Theme } from '../../config/themes';

interface SpecTypeSelectorPanelProps {
  taskType: 'feat' | 'fix' | 'outros';
  setTaskType: (val: 'feat' | 'fix' | 'outros') => void;
  repositories: string[];
  selectedRepo: string;
  setSelectedRepo: (val: string) => void;
  customFolderName: string;
  setCustomFolderName: (val: string) => void;
  onStart: () => void;
  theme: Theme;
}

export const SpecTypeSelectorPanel: React.FC<SpecTypeSelectorPanelProps> = ({
  taskType,
  setTaskType,
  repositories,
  selectedRepo,
  setSelectedRepo,
  customFolderName,
  setCustomFolderName,
  onStart,
  theme
}) => {
  const getFriendlyRepoName = (pathStr: string) => {
    if (!pathStr) return '';
    const parts = pathStr.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || pathStr;
  };

  return (
    <div
      className="flex flex-col h-full border rounded-3xl p-6 backdrop-blur-md shadow-xl justify-between"
      style={{
        backgroundColor: `${theme.colors.bgPanel}B3`,
        borderColor: theme.colors.borderColor,
        color: theme.colors.textMain
      }}
    >
      <div className="space-y-6">
        {/* Header de Boas Vindas */}
        <div className="space-y-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-violet-400">
            Engine de Especificação 🚀
          </h2>
          <p className="text-[11px]" style={{ color: theme.colors.textMuted }}>
            Configure o pipeline de agentes inteligentes antes de iniciar a análise.
          </p>
        </div>

        {/* Pergunta 1: Tipo de Especificação */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-80" style={{ color: theme.colors.textMuted }}>
            1. O que vamos desenvolver hoje, amigão?
          </label>
          <div className="grid grid-cols-3 gap-4">
            {/* Opção Feature */}
            <button
              onClick={() => setTaskType('feat')}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                taskType === 'feat'
                  ? 'border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/5 scale-[1.02]'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.01]'
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className={`p-2 rounded-xl w-fit mb-3 transition-colors ${
                taskType === 'feat' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-text-muted group-hover:text-white'
              }`}>
                <Sparkles size={16} />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-wider mb-1">Feature</h3>
              <p className="text-[9px] leading-relaxed opacity-60">
                Nova funcionalidade ou recursos.
              </p>
            </button>

            {/* Opção Bug/Fix */}
            <button
              onClick={() => setTaskType('fix')}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                taskType === 'fix'
                  ? 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/5 scale-[1.02]'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.01]'
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className={`p-2 rounded-xl w-fit mb-3 transition-colors ${
                taskType === 'fix' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-text-muted group-hover:text-white'
              }`}>
                <Bug size={16} />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-wider mb-1">Bug / Fix</h3>
              <p className="text-[9px] leading-relaxed opacity-60">
                Corrigir erros ou falhas.
              </p>
            </button>

            {/* Opção Outros */}
            <button
              onClick={() => setTaskType('outros')}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                taskType === 'outros'
                  ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/5 scale-[1.02]'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.01]'
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className={`p-2 rounded-xl w-fit mb-3 transition-colors ${
                taskType === 'outros' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-text-muted group-hover:text-white'
              }`}>
                <HelpCircle size={16} />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-wider mb-1">Outros</h3>
              <p className="text-[9px] leading-relaxed opacity-60">
                Investigações, documentações, etc.
              </p>
            </button>
          </div>

          {taskType === 'outros' && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 block text-amber-500">
                Nome da Pasta Customizada
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/60 pointer-events-none">
                  <FolderPlus size={14} />
                </div>
                <input
                  type="text"
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value.replace(/[^a-z0-9_-]/gi, '-').toLowerCase())}
                  placeholder="ex: pesquisa-mercado"
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border rounded-2xl text-xs font-semibold outline-none transition-all focus:border-amber-500/50 placeholder:opacity-30"
                  style={{
                    borderColor: theme.colors.borderColor,
                    color: theme.colors.textMain
                  }}
                />
              </div>
              <p className="text-[9px] mt-2 opacity-50">
                Os artefatos serão salvos na pasta <strong className="opacity-100">{selectedRepo}/docs/{customFolderName || '...'}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Pergunta 2: Repositório Alvo */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-80" style={{ color: theme.colors.textMuted }}>
            2. Em qual repositório salvar os artefatos?
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <Folder size={14} className="opacity-60" />
            </div>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-black/30 border rounded-2xl text-xs font-semibold outline-none transition-all appearance-none cursor-pointer focus:border-violet-500/50"
              style={{
                borderColor: theme.colors.borderColor,
                color: theme.colors.textMain
              }}
            >
              {repositories.length === 0 ? (
                <option value="">Carregando repositórios...</option>
              ) : (
                repositories.map((repoPath) => (
                  <option key={repoPath} value={repoPath} className="bg-[#1a1b26] text-white">
                    {getFriendlyRepoName(repoPath)}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[8px] font-bold">
              ▼
            </div>
          </div>
          {selectedRepo && (
            <div className="px-1 text-[9px] font-medium leading-normal opacity-50 truncate" title={selectedRepo}>
              Caminho: {selectedRepo}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Início */}
      <button
        onClick={onStart}
        className="w-full mt-6 py-4 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg shadow-indigo-500/10"
      >
        Confirmar e Iniciar Especificação <ArrowRight size={14} />
      </button>
    </div>
  );
};
