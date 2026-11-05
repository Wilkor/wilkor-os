import { AgentActivity } from '../../../shared/types'
import { normalizePath } from '../utils/pathUtils'
import { applySearchReplace } from '../utils/patcher'
import { validateAction } from '../../../shared/actionValidator'

interface UseAgentActivitiesProps {
  agentActivities: AgentActivity[];
  setAgentActivities: React.Dispatch<React.SetStateAction<AgentActivity[]>>;
  setTabs: React.Dispatch<React.SetStateAction<any[]>>;
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addToast: (msg: string, type: any) => void;
}

export const useAgentActivities = ({
  agentActivities,
  setAgentActivities,
  setTabs,
  setIsTerminalOpen,
  addToast
}: UseAgentActivitiesProps) => {

  const handleApplyAgentActivity = async (id: string) => {
    const activity = agentActivities.find((a) => a.id === id)
    if (!activity) return

    try {
      // Valida a ação antes de executar
      const validation = validateAction(activity.data as any)
      if (!validation.valid) {
        addToast(`Erro de validação: ${validation.error}`, 'error')
        setAgentActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'error' } : a)))
        return
      }

      if (activity.type === 'file_edit' || activity.type === 'write_file' || activity.type === 'patch_file') {
        const data = activity.data as any
        setAgentActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'applying' } : a)))
        
        let newContent = data.content;
        let originalContent = '';

        if (activity.type === 'patch_file') {
          const fileResp = await window.api.fs.readFile(data.path);
          if (!fileResp.success) throw new Error(fileResp.error);
          originalContent = fileResp.content;
          newContent = applySearchReplace(originalContent, data.content);
        } else {
          const fileResp = await window.api.fs.readFile(data.path);
          if (fileResp.success) originalContent = fileResp.content;
        }

        const saveResp = await window.api.agent.applyFileEdit(data.path, newContent);
        if (saveResp.success) {
          setTabs(prev => prev.map(t => normalizePath(t.path) === normalizePath(data.path) ? { ...t, content: newContent, isModified: false } : t));
          addToast(`Arquivo ${data.path.split(/[\\/]/).pop()} atualizado!`, 'success');
          setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'applied', data: { ...a.data, originalContent } as any } : a));
        } else {
          throw new Error(saveResp.error);
        }
      } else if (activity.type === 'command') {
        const data = activity.data as any;
        setIsTerminalOpen(true);
        setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'running' } : a));
        const resp = await window.api.agent.runCommand({ command: data.command });
        if (resp.success) {
          setTimeout(() => setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'success' } : a)), 3000);
        } else {
          addToast(`Erro: ${resp.error}`, 'error');
          setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'error' } : a));
        }
      }
    } catch (err: any) {
      addToast(`Erro na ação: ${err.message}`, 'error');
      setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'error' } : a));
    }
  };

  const handleRejectAgentActivity = (id: string) => {
    setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
  };

  const handleUndoAgentActivity = async (id: string) => {
    const activity = agentActivities.find(a => a.id === id);
    if (!activity || activity.status !== 'applied') return;

    try {
      if (activity.type === 'file_edit' || activity.type === 'write_file' || activity.type === 'patch_file') {
        const data = activity.data as any;
        if (data.originalContent === undefined) {
          addToast('Não há backup para reverter esta ação.', 'warning');
          return;
        }

        const saveResp = await window.api.agent.applyFileEdit(data.path, data.originalContent);
        if (saveResp.success) {
          setTabs(prev => prev.map(t => normalizePath(t.path) === normalizePath(data.path) ? { ...t, content: data.originalContent, isModified: false } : t));
          addToast(`Arquivo ${data.path.split(/[\\/]/).pop()} revertido!`, 'success');
          setAgentActivities(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a));
        } else {
          throw new Error(saveResp.error);
        }
      }
    } catch (err: any) {
      addToast(`Erro ao reverter: ${err.message}`, 'error');
    }
  };

  const handleAcceptAllActivities = async () => {
    const pending = agentActivities.filter(a => a.status === 'pending');
    for (const act of pending) {
      await handleApplyAgentActivity(act.id);
    }
  };

  const handleRejectAllActivities = () => {
    setAgentActivities(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'rejected' } : a));
  };

  return {
    handleApplyAgentActivity,
    handleRejectAgentActivity,
    handleUndoAgentActivity,
    handleAcceptAllActivities,
    handleRejectAllActivities
  };
};
