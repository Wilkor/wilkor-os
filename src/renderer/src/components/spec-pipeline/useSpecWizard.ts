import React, { useState } from 'react';
import { FALLBACK_AGENTS, parseAgentResponse, loadReadmeFromWorkspace } from './AgentOrchestrator';
import { executeFullPipelineSync } from './TrelloSyncService';

interface UseSpecWizardProps {
  card: any;
  initialPendingTask?: any;
  onClose: () => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useSpecWizard({ card, initialPendingTask, onClose, onAddToast }: UseSpecWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialPendingTask ? 2 : 0);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [agentStatus, setAgentStatus] = useState<'APROVADO' | 'INCOMPLETO' | 'IDLE'>('IDLE');
  
  const [repositories, setRepositories] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(initialPendingTask?.repoPath || '');

  React.useEffect(() => {
    (window as any).api?.workspace?.getRoots?.().then((roots: string[]) => {
      if (Array.isArray(roots)) {
        setRepositories(roots);
        if (roots.length > 0 && !selectedRepo) setSelectedRepo(roots[0]);
      }
    }).catch(console.error);
  }, []);

  const [readmeContent, setReadmeContent] = useState<string>('');

  React.useEffect(() => {
    if (selectedRepo) {
      loadReadmeFromWorkspace(selectedRepo).then(setReadmeContent);
    }
  }, [selectedRepo]);
  
  const [prdContent, setPrdContent] = useState<string>(initialPendingTask?.prdContent || card.desc || '');
  const [taskType, setTaskType] = useState<'feat' | 'fix' | 'outros'>(initialPendingTask?.taskType || 'feat');
  const [customFolderName, setCustomFolderName] = useState<string>(initialPendingTask?.customFolderName || '');
  const [refinementInput, setRefinementInput] = useState<string>('');
  const [, setRefinementHistory] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [maxRetryReached, setMaxRetryReached] = useState<boolean>(false);

  // Documentos Gerados
  const [requirements, setRequirements] = useState<string>(initialPendingTask?.requirements || '');
  const [design, setDesign] = useState<string>('');
  const [tasksJson, setTasksJson] = useState<string>('');

  // Trello e Workspace Sync
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [isSyncComplete, setIsSyncComplete] = useState<boolean>(false);

  const activeAgent = FALLBACK_AGENTS[Math.min(currentStep, 3)];

  const runAgent = async (userAnswers?: string[]) => {
    setIsThinking(true);
    setAgentStatus('IDLE');
    try {
      let prompt = `CONTEXTO TÉCNICO E ESTRUTURA DO PROJETO (README.md):\n${readmeContent || 'Não disponível.'}\n\n`;
      prompt += `TIPO DE ESPECIFICAÇÃO: ${taskType === 'feat' ? 'NOVA FUNCIONALIDADE / FEATURE' : 'CORREÇÃO DE BUG / FIX'}\n\n${activeAgent.systemPrompt}\n\nPRD VALIDADO:\n${prdContent}`;
      if (currentStep === 0) prompt = `CONTEXTO TÉCNICO E ESTRUTURA DO PROJETO (README.md):\n${readmeContent || 'Não disponível.'}\n\nTIPO DE ESPECIFICAÇÃO: ${taskType === 'feat' ? 'NOVA FUNCIONALIDADE / FEATURE' : 'CORREÇÃO DE BUG / FIX'}\n\n${activeAgent.systemPrompt}\n\nPRD PARA ANÁLISE:\n${prdContent}`;
      if (currentStep === 2) prompt += `\n\nREQUISITOS (requirements.md):\n${requirements}`;
      if (currentStep === 3) prompt += `\n\nREQUISITOS (requirements.md):\n${requirements}\n\nDESIGN ARQUITETURAL (design.md):\n${design}`;

      if (userAnswers && userAnswers.length > 0) {
        prompt += `\n\nRESPOSTAS DO USUÁRIO PARA DETALHAMENTO:\n${userAnswers.join('\n')}`;
      }

      const response = await (window as any).api.chat.send('gpt-4o-mini', [
        { role: 'user', content: prompt }
      ], undefined, `Spec: ${activeAgent.name}`);

      if (response.success && response.content) {
        const parsed = parseAgentResponse(response.content);
        setAgentStatus(parsed.status);

        if (parsed.status === 'INCOMPLETO') {
          setQuestions(parsed.questions || []);
          const nextRetry = retryCount + 1;
          setRetryCount(nextRetry);
          if (nextRetry >= 3) setMaxRetryReached(true);
        } else {
          setQuestions([]);
          setRetryCount(0);
          setMaxRetryReached(false);
          if (currentStep === 0) {
            setPrdContent(prev => prev + (userAnswers ? `\n\nRefinamentos:\n${userAnswers.join('\n')}` : ''));
          } else if (currentStep === 1) setRequirements(parsed.content);
          else if (currentStep === 2) setDesign(parsed.content);
          else if (currentStep === 3) setTasksJson(parsed.content);
        }
      } else {
        onAddToast(`Erro do agente: ${response.error}`, 'error');
      }
    } catch (err: any) {
      onAddToast(`Erro: ${err.message}`, 'error');
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendRefinement = (customAnswer?: string) => {
    const answer = typeof customAnswer === 'string' ? customAnswer : refinementInput;
    if (!answer.trim()) return;
    if (typeof customAnswer !== 'string') {
      setRefinementInput('');
    }
    const updatedHistory = [answer];
    setRefinementHistory(updatedHistory);
    runAgent(updatedHistory);
  };

  const handleSyncWorkspaceAndTrello = async () => {
    setIsSyncing(true);
    setSyncProgress(5);
    setSyncMessage('Iniciando sincronização...');

    try {
      const syncRes = await executeFullPipelineSync(
        card,
        requirements,
        design,
        tasksJson,
        taskType,
        selectedRepo,
        customFolderName,
        (progress, msg) => {
          setSyncProgress(progress);
          setSyncMessage(msg);
        }
      );

      if (syncRes.success) {
        setIsSyncComplete(true);
        onAddToast(`Pipeline concluído! ${syncRes.createdCardsCount} tarefas criadas no Backlog.`, 'success');
        
        // Marca a pendência técnica como concluída
        if (initialPendingTask && (window as any).api?.pipeline?.saveTechPending) {
          try {
            await (window as any).api.pipeline.saveTechPending({
              ...initialPendingTask,
              status: 'completed'
            });
          } catch (e) {
            console.error('[SpecPipeline] Erro ao concluir pendência:', e);
          }
        }
      } else {
        throw new Error(syncRes.error || 'Erro na sincronização.');
      }
    } catch (err: any) {
      onAddToast(`Erro no Sync: ${err.message}`, 'error');
      setSyncMessage(`Falha: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAndSendToTech = async () => {
    try {
      const pendingData = {
        id: card.id + '-' + Date.now(),
        card: card,
        taskType: taskType,
        customFolderName: customFolderName,
        prdContent: prdContent,
        requirements: requirements,
        repoPath: selectedRepo,
        status: 'pending'
      };

      if ((window as any).api?.pipeline?.saveTechPending) {
        const res = await (window as any).api.pipeline.saveTechPending(pendingData);
        if (res) {
          onAddToast('Especificação de Negócio disponibilizada para Tech!', 'success');
          onClose();
        } else {
          onAddToast('Erro ao salvar pendência.', 'error');
        }
      } else {
        onAddToast('Banco de dados não disponível.', 'error');
      }
    } catch (err: any) {
      onAddToast(`Erro ao salvar: ${err.message}`, 'error');
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isThinking,
    agentStatus,
    setAgentStatus,
    repositories,
    selectedRepo,
    setSelectedRepo,
    prdContent,
    setPrdContent,
    taskType,
    setTaskType,
    customFolderName,
    setCustomFolderName,
    refinementInput,
    setRefinementInput,
    questions,
    setQuestions,
    retryCount,
    maxRetryReached,
    requirements,
    setRequirements,
    design,
    setDesign,
    tasksJson,
    setTasksJson,
    isSyncing,
    syncProgress,
    syncMessage,
    isSyncComplete,
    activeAgent,
    runAgent,
    handleSendRefinement,
    handleSyncWorkspaceAndTrello,
    handleSaveAndSendToTech,
    setRefinementHistory
  };
}
