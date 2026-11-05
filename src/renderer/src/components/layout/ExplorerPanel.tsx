import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FilePlus, 
  FolderPlus, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  FolderCog
} from 'lucide-react';
import { FileTree } from '../FileTree';
import { GitPanel } from '../GitPanel';
import { MCPPanel } from '../MCPPanel';
import { FileIcon } from '../FileIcon';
import { Theme } from '../../config/themes';
import { WorkspaceManagerModal } from '../modals/WorkspaceManagerModal';
import { ArtifactsPanel } from '../ArtifactsPanel';
import { PlanningPanel } from '../PlanningPanel';

interface ExplorerPanelProps {
  isExplorerOpen: boolean;
  sidebarWidth: number;
  activeSidebarTab: 'explorer' | 'git' | 'mcp' | 'artifacts' | 'planning';
  fileTrees: any;
  tabs: any[];
  handleOpenFile: (path: string) => void;
  refreshWorkspace: () => void;
  handleNewFile: (path: string) => void;
  handleNewFolder: (path: string) => void;
  handleAddFolder: (path?: string) => any;
  handleRemoveFolder: (path: string) => void;
  handleDeleteFile?: (path: string) => void;
  addToast: (msg: string, type: any) => void;
  activeTabPath: string | null;
  lastCreatedPath?: string | null;
  workspaceVersion?: number;
  theme: Theme;
  onAttachFile?: (file: { name: string; path: string; type: string }) => void;
}

const ExplorerSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, isExpanded, onToggle, children, actions }) => (
  <div className="flex flex-col border-b border-[var(--border-color)]">
    <div 
      className="flex items-center gap-1 px-1 py-0.5 cursor-pointer hover:bg-white/[0.03] group transition-colors"
      onClick={onToggle}
    >
      {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
      <div className="flex-1 flex items-center justify-between pr-2">
        <span className="text-[11px] font-bold uppercase tracking-tight text-[var(--text-muted)]">{title}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      </div>
    </div>
    <AnimatePresence>
      {isExpanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  isExplorerOpen,
  sidebarWidth,
  activeSidebarTab,
  fileTrees,
  tabs,
  handleOpenFile,
  refreshWorkspace,
  handleNewFile,
  handleNewFolder,
  handleAddFolder,
  handleRemoveFolder,
  handleDeleteFile,
  addToast,
  activeTabPath,
  lastCreatedPath,
  workspaceVersion,
  theme,
  onAttachFile
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    openEditors: true,
    workspace: true
  });

  const toggleSection = (section: 'openEditors' | 'workspace') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const workspaceName = Object.keys(fileTrees).length > 0 
    ? Object.keys(fileTrees)[0].split(/[\\/]/).pop() || 'wilkor'
    : 'wilkor';

  return (
    <motion.div 
      animate={{ width: isExplorerOpen ? sidebarWidth : 0, opacity: isExplorerOpen ? 1 : 0 }} 
      className="bg-[var(--bg-panel)] flex flex-col overflow-hidden relative border-r border-[var(--border-color)] select-none"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDrop={async (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        let addedAny = false;
        for (const file of files) {
          if (file.path) {
            const success = await handleAddFolder(file.path);
            if (success) addedAny = true;
          }
        }
        if (addedAny) addToast('Projeto adicionado ao workspace!', 'success');
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--bg-panel)]/90 backdrop-blur-md border-2 border-dashed border-[var(--primary)] m-2 rounded-lg flex flex-col items-center justify-center gap-3 z-50 pointer-events-none"
          >
            <div className="p-3 bg-[var(--primary-muted)] rounded-full text-[var(--primary)] animate-pulse">
              <FolderPlus size={24} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">Solte para Adicionar</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 py-2.5 flex items-center justify-between shrink-0">
        <h2 className="text-[11px] font-medium text-[var(--text-muted)]">Explorer</h2>
        <button className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {activeSidebarTab === 'explorer' ? (
          <>
            <ExplorerSection 
              title="Open Editors" 
              isExpanded={expandedSections.openEditors}
              onToggle={() => toggleSection('openEditors')}
            >
              <div className="flex flex-col pb-1">
                {tabs.length === 0 ? (
                  <div className="px-6 py-1 text-[11px] italic text-[var(--text-muted)] opacity-40">No open editors</div>
                ) : (
                  tabs.map(tab => (
                    <div 
                      key={tab.path}
                      onClick={() => handleOpenFile(tab.path)}
                      className={`flex items-center gap-2 px-6 py-0.5 cursor-pointer transition-colors ${
                        activeTabPath === tab.path ? 'bg-[var(--primary-muted)] text-[var(--primary)]' : 'hover:bg-white/[0.03] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <FileIcon fileName={tab.name} size={14} />
                      <span className="text-[12px] truncate">{tab.name}</span>
                    </div>
                  ))
                )}
              </div>
            </ExplorerSection>

            <ExplorerSection 
              title={`${workspaceName} (Workspace)`}
              isExpanded={expandedSections.workspace}
              onToggle={() => toggleSection('workspace')}
              actions={
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsWorkspaceModalOpen(true); }}
                    className="p-1 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    title="Gerenciar Workspace"
                  ><FolderCog size={14} /></button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); const roots = Object.keys(fileTrees); if (roots.length > 0) handleNewFile(roots[0]); }}
                    className="p-1 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  ><FilePlus size={14} /></button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); const roots = Object.keys(fileTrees); if (roots.length > 0) handleNewFolder(roots[0]); }}
                    className="p-1 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  ><FolderPlus size={14} /></button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); refreshWorkspace(); }}
                    className="p-1 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  ><RefreshCw size={14} /></button>
                </>
              }
            >
              <div className="flex-1">
                <FileTree 
                  tree={(() => {
                    const roots = Object.keys(fileTrees);
                    if (roots.length > 1) {
                      return roots.map(rootPath => {
                        const folderName = rootPath.split(/[\\/]/).pop() || rootPath;
                        return {
                          name: folderName,
                          path: rootPath,
                          type: 'directory',
                          isDirectory: true,
                          children: fileTrees[rootPath] || []
                        } as any;
                      });
                    }
                    return Array.isArray(fileTrees) ? fileTrees : Object.values(fileTrees).flat();
                  })()} 
                  activeTabPath={activeTabPath}
                  onFileClick={handleOpenFile} 
                  onNewFile={(path) => {
                    const roots = Object.keys(fileTrees);
                    if (path) handleNewFile(path);
                    else if (roots.length > 0) handleNewFile(roots[0]);
                  }}
                  onNewFolder={(path) => {
                    const roots = Object.keys(fileTrees);
                    if (path) handleNewFolder(path);
                    else if (roots.length > 0) handleNewFolder(roots[0]);
                  }}
                  onDeleteFile={(path) => {
                    if (handleDeleteFile) handleDeleteFile(path);
                  }}
                  lastCreatedPath={lastCreatedPath}
                  workspaceVersion={workspaceVersion}
                  embedded={true}
                  theme={theme}
                  workspaceRoots={Object.keys(fileTrees)}
                  onRemoveFolder={handleRemoveFolder}
                />
              </div>
            </ExplorerSection>
          </>
        ) : activeSidebarTab === 'git' ? (
          <GitPanel activeTabPath={activeTabPath} addToast={addToast} />
        ) : activeSidebarTab === 'artifacts' ? (
          <ArtifactsPanel addToast={addToast} onAttachFile={onAttachFile} onOpenFile={handleOpenFile} />
        ) : activeSidebarTab === 'planning' ? (
          <PlanningPanel 
            activeWorkspacePath={Object.keys(fileTrees)[0]} 
            addToast={addToast} 
          />
        ) : (
          <MCPPanel onAddToast={addToast} />
        )}
      </div>
      {isWorkspaceModalOpen && (
        <WorkspaceManagerModal
          isOpen={isWorkspaceModalOpen}
          onClose={() => setIsWorkspaceModalOpen(false)}
          workspaceRoots={Object.keys(fileTrees)}
          onAddFolder={handleAddFolder}
          onRemoveFolder={handleRemoveFolder}
        />
      )}
    </motion.div>
  );
};


