import React from 'react';
import { X, FileCode, Save, Zap, GitCompare } from 'lucide-react';
import { SlidingDiffPanel } from './git/SlidingDiffPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentPreview } from './chat/DocumentPreview';
import { WosPixelLogo } from './WosPixelLogo';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { goToDefinition } from '../extensions/goToDefinition';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';

interface Tab {
  path: string;
  name: string;
  content: string;
  isModified: boolean;
}

interface EditorStageProps {
  tabs: Tab[];
  activeTabPath: string | null;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
  onTabCloseAll?: () => void;
  onTabCloseOthers?: (path: string) => void;
  onContentChange: (path: string, content: string) => void;
  onAIAction?: (action: string, terminalId?: string) => void;
  onSave: (path: string) => void;
  onNavigateToFile: (path: string) => void;
  themeId: string;
  streamingActivity?: { path: string, content: string } | null;
  prAnalysis?: any | null;
  agentActivities?: any[];
  onAcceptActivity?: (id: string) => void;
  onRejectActivity?: (id: string) => void;
  onUndoActivity?: (id: string) => void;
}

export const EditorStage: React.FC<EditorStageProps> = ({ 
  tabs, 
  activeTabPath, 
  onTabClick, 
  onTabClose,
  onTabCloseAll,
  onContentChange,
  onAIAction,
  onSave,
  onNavigateToFile,
  themeId,
  streamingActivity,
  prAnalysis,
  agentActivities = [],
  onUndoActivity
}) => {
  const [showPRContext, setShowPRContext] = React.useState(true);
  const [showDiff, setShowDiff] = React.useState(false);
  const activeTab = tabs.find(t => t.path === activeTabPath);


  const getLanguageExtension = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx': return [javascript({ jsx: true, typescript: true })];
      case 'html': return [html()];
      case 'css': return [css()];
      case 'json': return [json()];
      default: return [javascript()];
    }
  };

  const getTheme = (id: string) => {
    switch (id) {
      case 'dracula': return dracula;
      case 'github-dark': return githubDark;
      case 'github-light': return githubLight;
      case 'monokai': return monokai;
      case 'tokyo-night': return tokyoNight;
      default: return oneDark;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-editor">
      {/* Tabs Bar */}
      <div className="flex items-center bg-bg-panel border-b border-white/[0.03] overflow-x-auto no-scrollbar h-9">
        {tabs.map(tab => (
          <div
            key={tab.path}
            onClick={() => onTabClick(tab.path)}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer border-r border-white/[0.03] min-w-[120px] max-w-[200px] transition-all relative group ${
              activeTabPath === tab.path ? 'bg-bg-editor text-primary' : 'text-text-muted hover:bg-white/[0.02]'
            }`}
          >
            {activeTabPath === tab.path && (
              <motion.div layoutId="active-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
            <FileCode size={14} className={activeTabPath === tab.path ? 'text-primary' : 'text-text-muted/40'} />
            <span className="text-[12px] font-medium truncate flex-1">{tab.name}</span>
            {tab.isModified && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onTabClose(tab.path); }}
              className="p-0.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {tabs.length > 0 && (
          <div className="ml-auto px-2 flex items-center gap-1">
             <button 
               onClick={() => onTabCloseAll?.()}
               className="p-1.5 text-text-muted/40 hover:text-text-main transition-colors"
               title="Fechar Todos"
             >
               <X size={14} />
             </button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {!activeTab ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-text-muted/10 p-12 text-center"
            >
              <WosPixelLogo />
              <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-2">Workspace Ativo</h2>
              <p className="text-[10px] max-w-xs uppercase tracking-widest font-bold">Use o explorer para abrir arquivos ou peça ao wOs para criar algo novo.</p>
            </motion.div>
          ) : (
            <motion.div 
              key={activeTab.path}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Editor Header Info */}
              <div className="px-4 py-2 bg-bg-editor/50 flex items-center justify-between border-b border-white/[0.02]">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-muted/40 uppercase tracking-widest">{activeTab.path}</span>
                 </div>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setShowDiff(true)}
                       className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all flex items-center gap-1.5"
                       title="Visualizar alterações locais do Git"
                     >
                        <GitCompare size={12} /> Diff
                     </button>
                     <button 
                       onClick={() => onAIAction?.('explain')}
                       className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all flex items-center gap-1.5"
                     >
                        <Zap size={12} /> Explain
                     </button>
                     <button 
                       onClick={() => onSave(activeTab.path)}
                       className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-main transition-all flex items-center gap-1.5"
                     >
                        <Save size={12} /> Save
                     </button>
                  </div>
              </div>

              {/* Activity Diff Overlay */}
              {agentActivities.filter(a => (a.status === 'applied' || a.status === 'applying') && (a.data as any).path === activeTab.path).length > 0 && (
                <div className="bg-primary/5 border-b border-primary/10 px-4 py-1.5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-tight text-primary">Alterações Aplicadas pela IA</span>
                   </div>
                   <button 
                    onClick={() => {
                      const act = agentActivities.find(a => a.status === 'applied' && (a.data as any).path === activeTab.path);
                      if (act) onUndoActivity?.(act.id);
                    }}
                    className="text-[10px] font-bold text-primary hover:underline"
                   >
                     Reverter
                   </button>
                </div>
              )}

              <div className="flex-1 overflow-auto no-scrollbar relative">
                {activeTab.name && ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.xlsx', '.xls', '.docx', '.doc'].includes(activeTab.name.substring(activeTab.name.lastIndexOf('.')).toLowerCase()) ? (
                  <div className="p-4 h-full overflow-y-auto no-scrollbar bg-bg-editor">
                    <DocumentPreview filePath={activeTab.path} fileName={activeTab.name} />
                  </div>
                ) : (
                  <CodeMirror
                    value={activeTab.content}
                    height="100%"
                    theme={getTheme(themeId)}
                    extensions={[
                      ...getLanguageExtension(activeTab.path),
                      goToDefinition({ currentFilePath: activeTab.path, onNavigate: (path: string) => onNavigateToFile(path) })
                    ]}
                    onChange={(val) => onContentChange(activeTab.path, val)}
                    basicSetup={{
                      lineNumbers: true,
                      foldGutter: true,
                      dropCursor: true,
                      allowMultipleSelections: true,
                      indentOnInput: true,
                    }}
                    className="text-[13px] h-full"
                  />
                )}

                {/* AI Streaming Suggestions Overlay */}
                <AnimatePresence>
                  {streamingActivity && streamingActivity.path === activeTab.path && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute top-4 right-4 z-50 max-w-sm"
                    >
                      <div className="bg-bg-panel border border-primary/20 rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary">IA Editando...</span>
                        </div>
                        <div className="text-[11px] text-text-muted/60 font-mono line-clamp-3 bg-black/20 p-2 rounded-lg">
                           {streamingActivity.content}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PR Context Overlay */}
      {prAnalysis && showPRContext && (
        <div className="absolute bottom-8 right-8 z-40 w-80 bg-bg-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl">
           <div className="p-4 bg-primary/10 flex items-center justify-between border-b border-primary/10">
              <span className="text-[11px] font-black uppercase tracking-widest text-primary">Análise de PR Ativa</span>
              <button onClick={() => setShowPRContext(false)}><X size={14} className="text-primary" /></button>
           </div>
           <div className="p-4 flex flex-col gap-3">
              <div className="text-[11px] text-text-muted/80 leading-relaxed italic">
                 "{prAnalysis.summary || 'Analisando alterações do repositório para contexto de engenharia...'}"
              </div>
              <div className="flex flex-col gap-1.5">
                 {prAnalysis.files?.slice(0, 3).map((f: any) => (
                    <div key={f.path} className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/5">
                       <FileCode size={10} className="text-primary/40" />
                       <span className="text-[10px] text-text-muted truncate flex-1">{f.path}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab && (
        <SlidingDiffPanel 
          file={{ path: activeTab.path, status: 'modified', staged: false } as any}
          isOpen={showDiff}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
};
