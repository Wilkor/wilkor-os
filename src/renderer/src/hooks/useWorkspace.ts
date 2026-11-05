import { useState, useCallback, useEffect } from 'react';
import { normalizePath } from '../utils/pathUtils';

export const useWorkspace = (addToast: (msg: string, type: any) => void) => {
  const [fileTrees, setFileTrees] = useState<Record<string, any[]>>({});
  const [tabs, setTabs] = useState<any[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [lastCreatedPath, setLastCreatedPath] = useState<string | null>(null);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
  } | null>(null);

  const refreshWorkspace = useCallback(async () => {
    if (window.api && window.api.fs && window.api.workspace) {
      const roots = await window.api.workspace.getRoots();
      const newTrees: Record<string, any[]> = {};
      for (const root of roots) {
        const response = await window.api.fs.getTree(root);
        if (response.success) newTrees[root] = response.tree;
      }
      setFileTrees(newTrees);
      setWorkspaceVersion(v => v + 1);
    }
  }, []);

  // Carregar os arquivos do workspace automaticamente na inicialização
  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const handleOpenFile = async (path: string, focus: boolean = true, forceReload: boolean = false) => {
    const normalizedPath = normalizePath(path);
    const existingTab = tabs.find(t => normalizePath(t.path) === normalizedPath);
    if (existingTab && !forceReload) {
      if (focus) {
        setActiveTabPath(normalizedPath);
      }
      return;
    }

    const name = path.split(/[\\/]/).pop() || path;
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    const isBinary = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.xlsx', '.xls', '.docx', '.doc'].includes(ext);

    if (isBinary) {
      setTabs(prev => {
        const exists = prev.some(t => normalizePath(t.path) === normalizedPath);
        if (exists) return prev;
        return [...prev, { path: normalizedPath, name, content: '', isModified: false }];
      });
      if (focus) {
        setTimeout(() => {
          setActiveTabPath(normalizedPath);
        }, 0);
      }
      return;
    }

    if (window.api && window.api.fs) {
      const response = await window.api.fs.readFile(path);
      if (response.success) {
        setTabs(prev => {
          const exists = prev.some(t => normalizePath(t.path) === normalizedPath);
          if (exists) {
            return prev.map(t => normalizePath(t.path) === normalizedPath
              ? { ...t, content: response.content, isModified: false }
              : t
            );
          }
          return [...prev, { path: normalizedPath, name, content: response.content, isModified: false }];
        });
        if (focus) {
          setTimeout(() => {
            setActiveTabPath(normalizedPath);
          }, 0);
        }
      }
    }
  };

  const handleAddFolder = async (path?: string) => {
    if (window.api?.workspace) {
      const result = await window.api.workspace.addFolder(path);
      if (result.success) {
        refreshWorkspace();
        return true;
      }
    }
    return false;
  };

  const handleRemoveFolder = async (path: string) => {
    if (window.api?.workspace) {
      await window.api.workspace.removeFolder(path);
      refreshWorkspace();
    }
  };

  const handleTabClose = (path: string) => {
    const normalizedPath = normalizePath(path);
    const newTabs = tabs.filter(t => normalizePath(t.path) !== normalizedPath);
    setTabs(newTabs);
    if (normalizePath(activeTabPath || '') === normalizedPath) {
      setActiveTabPath(newTabs.length > 0 ? normalizePath(newTabs[newTabs.length - 1].path) : null);
    }
  };

  const handleContentChange = (path: string, content: string) => {
    const normalizedPath = normalizePath(path);
    setTabs(prev => prev.map(t => normalizePath(t.path) === normalizedPath ? { ...t, content, isModified: true } : t));
  };

  const handleSaveFile = async (path: string) => {
    const normalizedPath = normalizePath(path);
    const tab = tabs.find(t => normalizePath(t.path) === normalizedPath);
    if (tab && window.api?.fs) {
      const response = await window.api.fs.writeFile(path, tab.content);
      if (response.success) {
        setTabs(prev => prev.map(t => normalizePath(t.path) === normalizedPath ? { ...t, isModified: false } : t));
      }
    }
  };

  const handleDeleteFile = async (path: string) => {
    const normalizedPath = normalizePath(path);
    if (window.api?.fs) {
      const response = await window.api.fs.deleteFile(path);
      if (response.success) {
        handleTabClose(normalizedPath);
        refreshWorkspace();
        addToast('Arquivo removido com sucesso.', 'success');
      }
    }
  };

  const getTargetDir = async (path: string): Promise<string> => {
    if (window.api?.fs) {
      try {
        const res = await window.api.fs.getStats(path);
        if (res.success && res.stats && !res.stats.isDirectory) {
          const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
          if (lastSlash !== -1) {
            return path.substring(0, lastSlash);
          }
        }
      } catch (err) {
        console.error('Erro ao obter stats do path:', err);
      }
    }
    return path;
  };

  const handleNewFile = async (rootPath: string) => {
    setInputDialog({
      isOpen: true,
      title: 'Novo Arquivo',
      placeholder: 'nome-do-arquivo.ts',
      onConfirm: async (name) => {
        if (!name.trim()) return;
        if (window.api?.fs) {
          const targetDir = await getTargetDir(rootPath);
          const path = targetDir + '/' + name.trim();
          const response = await window.api.fs.writeFile(path, '');
          if (response.success) {
            refreshWorkspace();
            setLastCreatedPath(normalizePath(path));
            handleOpenFile(path);
          }
        }
        setInputDialog(null);
      },
      onCancel: () => setInputDialog(null)
    });
  };

  const handleNewFolder = async (rootPath: string) => {
    setInputDialog({
      isOpen: true,
      title: 'Nova Pasta',
      placeholder: 'nome-da-pasta',
      onConfirm: async (name) => {
        if (!name.trim()) return;
        if (window.api?.fs) {
          const targetDir = await getTargetDir(rootPath);
          const path = targetDir + '/' + name.trim();
          const response = await window.api.fs.mkdir(path);
          if (response.success) {
            refreshWorkspace();
            setLastCreatedPath(normalizePath(path));
          }
        }
        setInputDialog(null);
      },
      onCancel: () => setInputDialog(null)
    });
  };

  return {
    fileTrees, setFileTrees, tabs, setTabs, activeTabPath, setActiveTabPath,
    isExplorerOpen, setIsExplorerOpen, refreshWorkspace, handleOpenFile,
    handleAddFolder, handleRemoveFolder, handleTabClose, handleContentChange, handleSaveFile,
    handleDeleteFile, handleNewFile, handleNewFolder, lastCreatedPath, workspaceVersion,
    inputDialog, setInputDialog
  };
};

