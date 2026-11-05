import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { FileNode, FileItem } from './FileItem';
import { ConfirmationDialog } from './ConfirmationDialog';
import { Theme } from '../config/themes';

interface FileTreeProps {
  tree: FileNode[];
  activeTabPath: string | null;
  onFileClick: (path: string) => void;
  onNewFile?: (path: string) => void;
  onNewFolder?: (path: string) => void;
  onDeleteFile?: (path: string) => void;
  lastCreatedPath?: string | null;
  workspaceVersion?: number;
  embedded?: boolean;
  theme: Theme;
  workspaceRoots?: string[];
  onRemoveFolder?: (path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ 
  tree, 
  activeTabPath, 
  onFileClick,
  onNewFile,
  onNewFolder,
  onDeleteFile,
  lastCreatedPath,
  workspaceVersion,
  embedded = false,
  theme,
  workspaceRoots = [],
  onRemoveFolder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileNode | null>(null);

  useEffect(() => {
    if (lastCreatedPath) {
      const parts = lastCreatedPath.split(/[\\/]/);
      const pathsToExpand: string[] = [];
      let currentPath = '';
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (i === 0 && lastCreatedPath.startsWith('/')) {
          currentPath = '/' + parts[i];
        } else {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        }
        pathsToExpand.push(currentPath);
      }
      
      setExpandedPaths(prev => {
        const next = { ...prev };
        pathsToExpand.forEach(p => {
          next[p] = true;
        });
        return next;
      });
    }
  }, [lastCreatedPath, workspaceVersion]);

  const searchTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();
    
    return nodes
      .map(node => {
        const isDir = node.type === 'directory' || (node as any).isDirectory === true;
        if (isDir) {
          const matchingChildren = node.children ? searchTree(node.children, query) : [];
          const matchesFolder = node.name.toLowerCase().includes(lowerQuery);
          
          if (matchingChildren.length > 0 || matchesFolder) {
            return {
              ...node,
              children: matchingChildren
            };
          }
          return null;
        } else {
          return node.name.toLowerCase().includes(lowerQuery) ? node : null;
        }
      })
      .filter((node): node is FileNode => node !== null);
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleContextMenuOpen = (x: number, y: number, node: FileNode) => {
    setContextMenu({ x, y, node });
  };

  const filteredTree = searchTree(tree, searchQuery);

  return (
    <div className={`flex flex-col h-full ${embedded ? '' : 'bg-[var(--bg-panel)] border-r border-[var(--border-color)]'}`}>
      {!embedded && (
        <>
          <div className="px-4 py-2 flex items-center justify-between group border-b border-[var(--border-color)]">
            <h2 className="text-[11px] font-bold uppercase tracking-tight text-[var(--text-muted)]">Explorer</h2>
            <button 
              onClick={() => onNewFile?.('')}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors opacity-0 group-hover:opacity-100" 
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-30" />
              <input 
                type="text" 
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-[var(--border-color)] rounded px-8 py-1 text-[11px] text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-30 focus:outline-none focus:border-[var(--primary)]/30 transition-all"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar py-1">
        {filteredTree.length === 0 ? (
          <div className="px-6 py-10 flex flex-col items-center justify-center text-center opacity-20">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">No files found</div>
          </div>
        ) : (
          filteredTree
            .sort((a, b) => {
              const aDir = a.type === 'directory' || (a as any).isDirectory === true;
              const bDir = b.type === 'directory' || (b as any).isDirectory === true;
              if (aDir === bDir) return a.name.localeCompare(b.name);
              return aDir ? -1 : 1;
            })
            .map(node => (
              <FileItem 
                key={node.path} 
                node={node} 
                depth={0} 
                activeTabPath={activeTabPath}
                onFileClick={onFileClick}
                expandedPaths={expandedPaths}
                onToggleExpand={toggleExpand}
                onContextMenuOpen={handleContextMenuOpen}
              />
            ))
        )}
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div 
            className="fixed z-50 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg shadow-xl py-1 min-w-[150px] backdrop-blur-md"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          >
            <button 
              onClick={() => { onNewFile?.(contextMenu.node.path); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-[var(--text-main)] hover:bg-white/[0.04]"
            >
              Novo Arquivo
            </button>
            <button 
              onClick={() => { onNewFolder?.(contextMenu.node.path); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-[var(--text-main)] hover:bg-white/[0.04]"
            >
              Nova Pasta
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.node.path);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[11px] text-[var(--text-main)] hover:bg-white/[0.04]"
            >
              Copiar Caminho
            </button>
            {!workspaceRoots.includes(contextMenu.node.path) && (
              <button 
                onClick={async () => {
                  const oldPath = contextMenu.node.path;
                  const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
                  const currentName = contextMenu.node.name;
                  const newName = prompt('Digite o novo nome:', currentName);
                  if (newName && newName.trim() && newName.trim() !== currentName) {
                    const newPath = `${dir}/${newName.trim()}`;
                    if (window.api?.fs) {
                      const res = await window.api.fs.rename(oldPath, newPath);
                      if (res.success && window.api?.workspace) {
                        window.electron.ipcRenderer.send('workspace:updated');
                      }
                    }
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[var(--text-main)] hover:bg-white/[0.04]"
              >
                Renomear
              </button>
            )}
            {onRemoveFolder && workspaceRoots.includes(contextMenu.node.path) && (
              <>
                <div className="border-t border-[var(--border-color)] my-1" />
                <button 
                  onClick={() => {
                    onRemoveFolder(contextMenu.node.path);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-500/10"
                >
                  Remover do Workspace
                </button>
              </>
            )}
            {onDeleteFile && !workspaceRoots.includes(contextMenu.node.path) && (
              <>
                <div className="border-t border-[var(--border-color)] my-1" />
                <button 
                  onClick={() => {
                    setDeleteTarget(contextMenu.node);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-500/10"
                >
                  Excluir
                </button>
              </>
            )}
          </div>
        </>
      )}

      {deleteTarget && (
        <ConfirmationDialog
          isOpen={!!deleteTarget}
          title="Excluir Arquivo/Pasta"
          message={`Tem certeza que deseja excluir ${deleteTarget.name}? Esta ação não poderá ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          type="danger"
          theme={theme}
          onConfirm={() => {
            if (onDeleteFile && deleteTarget) {
              onDeleteFile(deleteTarget.path);
            }
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default FileTree;
