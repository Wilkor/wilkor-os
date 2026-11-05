import { useEffect, useRef } from 'react';
import { normalizePath } from '../utils/pathUtils';

export const useIPCListeners = (
  refreshWorkspace: () => void,
  setAgentActivities: React.Dispatch<React.SetStateAction<any[]>>,
  setTabs: React.Dispatch<React.SetStateAction<any[]>>,
  _setActiveTabPath: React.Dispatch<React.SetStateAction<string | null>>,
  handleOpenFile?: (path: string, focus?: boolean, forceReload?: boolean) => any
) => {
  const refreshWorkspaceRef = useRef(refreshWorkspace);
  const handleOpenFileRef = useRef(handleOpenFile);
  const setAgentActivitiesRef = useRef(setAgentActivities);
  const setTabsRef = useRef(setTabs);

  // Sincroniza as referências mutáveis a cada renderização
  useEffect(() => {
    refreshWorkspaceRef.current = refreshWorkspace;
    handleOpenFileRef.current = handleOpenFile;
    setAgentActivitiesRef.current = setAgentActivities;
    setTabsRef.current = setTabs;
  });

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const handleWorkspaceUpdated = (_event: any, data?: { event: string; path: string }) => {
        refreshWorkspaceRef.current();
        if (data && (data.event === 'change' || data.event === 'add') && handleOpenFileRef.current) {
          const filePath = data.path;
          const extension = filePath.split('.').pop()?.toLowerCase();
          const ignoredExtensions = ['exe', 'dll', 'zip', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'mp3', 'wav', 'db', 'sqlite', 'log'];
          const isIgnored = ignoredExtensions.includes(extension || '') || 
                            filePath.includes('.git') || 
                            filePath.includes('node_modules') || 
                            filePath.includes('.brain') || 
                            filePath.includes('.agent') ||
                            filePath.includes('tsconfig') ||
                            filePath.includes('package-lock.json') ||
                            filePath.includes('auto-docs.md');
          
          if (!isIgnored) {
            handleOpenFileRef.current(filePath, false, true);
          }
        }
      };

      const handleNewActivity = (_event: any, data: any) => {
        const { type, data: activityData } = data;
        setAgentActivitiesRef.current(prev => {
          const exists = prev.find(a => 
            a.status === 'pending' && 
            a.type === type && 
            JSON.stringify(a.data) === JSON.stringify(activityData)
          );
          if (exists) return prev;

          return [...prev, {
            id: Math.random().toString(36).substring(7),
            type: type,
            status: 'pending',
            timestamp: Date.now(),
            data: activityData
          }];
        });
      };

      const handleFileWritten = (_event: any, data: any) => {
        const { path: writtenPath, content: writtenContent } = data;
        const normalizedPath = normalizePath(writtenPath);
        setTabsRef.current(prev => {
          const existingTab = prev.find(t => normalizePath(t.path) === normalizedPath);
          if (existingTab) {
            return prev.map(t => normalizePath(t.path) === normalizedPath
              ? { ...t, content: writtenContent, isModified: false }
              : t
            );
          }
          return prev;
        });
      };

      const handleTerminalData = (_event: any, data: string) => {
        setAgentActivitiesRef.current(prev => {
          const runningCmd = prev.find(a => a.type === 'command' && a.status === 'running');
          if (runningCmd) {
            const currentOutput = (runningCmd.data as any).output || '';
            const newOutput = (currentOutput + data).slice(-5000);
            return prev.map(a => a.id === runningCmd.id 
              ? { ...a, data: { ...a.data, output: newOutput } } 
              : a
            );
          }
          return prev;
        });
      };

      window.electron.ipcRenderer.on('workspace:updated', handleWorkspaceUpdated);
      window.electron.ipcRenderer.on('agent:newActivity', handleNewActivity);
      window.electron.ipcRenderer.on('agent:fileWritten', handleFileWritten);
      window.electron.ipcRenderer.on('terminal:data:default', handleTerminalData);

      return () => {
        window.electron.ipcRenderer.removeListener('workspace:updated', handleWorkspaceUpdated);
        window.electron.ipcRenderer.removeListener('agent:newActivity', handleNewActivity);
        window.electron.ipcRenderer.removeListener('agent:fileWritten', handleFileWritten);
        window.electron.ipcRenderer.removeListener('terminal:data:default', handleTerminalData);
      };
    }
    return undefined;
  }, []);
};

