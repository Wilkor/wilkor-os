import { useState, useRef, useEffect, useMemo } from 'react'
import { AgentActivity } from '../../../shared/types';
import { MODEL_LIMITS } from '../config/models';
import { normalizePath } from '../utils/pathUtils';
import { parseMessageActions } from '../../../shared/actionPatterns';
import { buildAgentContext } from '../utils/promptGenerator';
import { useAgentActivities } from './useAgentActivities';
import { useAudioRecorder } from './useAudioRecorder';
import { speakText } from '../utils/ttsPlayer';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  senderName?: string;
  senderEmoji?: string;
  senderColor?: string;
  isInvisible?: boolean;
}

export const useAIChat = (
  activeModel: string, 
  settings: any, 
  addToast: (msg: string, type: any) => void,
  tabs: any[],
  setTabs: React.Dispatch<React.SetStateAction<any[]>>,
  activeTabPath: string | null,
  fileTrees: Record<string, any[]>,
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá Wilkor! Sou seu assistente wOs com Inteligência de Roteamento. Como vamos codar hoje?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [streamingActivity, setStreamingActivity] = useState<{ path: string, content: string } | null>(null);
  const [maxContext, setMaxContext] = useState(128000)
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(() => {
    return localStorage.getItem('wos_voice_mode') === 'true';
  });
  const [isPlanningMode, setIsPlanningMode] = useState<boolean>(() => {
    return localStorage.getItem('wos_planning_mode') === 'true';
  });
  const [isHandsFreeRecording, setIsHandsFreeRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    localStorage.setItem('wos_planning_mode', String(isPlanningMode))
  }, [isPlanningMode])

  // Limpa agentActivities antigas para evitar acúmulo infinito
  useEffect(() => {
    if (agentActivities.length > 50) {
      setAgentActivities((prev) => prev.slice(-50))
    }
  }, [agentActivities])

  const preventNextLoadRef = useRef(false)

  // Cache para parsing de ações para evitar reparsing do mesmo conteúdo
  const parseCacheRef = useRef<Map<string, any[]>>(new Map())

  useEffect(() => {
    const handleVADEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      setIsHandsFreeRecording(!!customEvent.detail?.recording);
    };
    window.addEventListener('wos-vad-recording', handleVADEvent);
    return () => {
      window.removeEventListener('wos-vad-recording', handleVADEvent);
    };
  }, []);

  const isVoiceModeRef = useRef(isVoiceModeEnabled);
  const isLastMessageFromVoiceRef = useRef(false);

  useEffect(() => {
    isVoiceModeRef.current = isVoiceModeEnabled;
    localStorage.setItem('wos_voice_mode', String(isVoiceModeEnabled));
  }, [isVoiceModeEnabled]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);



  const {
    handleApplyAgentActivity,
    handleRejectAgentActivity,
    handleUndoAgentActivity,
    handleAcceptAllActivities,
    handleRejectAllActivities
  } = useAgentActivities({
    agentActivities,
    setAgentActivities,
    setTabs,
    setIsTerminalOpen,
    addToast
  });

  // Memoiza o cálculo de contextChars para evitar recálculos desnecessários
  const contextChars = useMemo(() => {
    let total = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0)
    attachments.forEach((att) => {
      if (att.content) total += att.content.length
    })
    return total
  }, [messages, attachments])

  useEffect(() => {
    setMaxContext(MODEL_LIMITS[activeModel] || 128000);
  }, [activeModel]);

  // Carrega a conversa mais recente do banco ao inicializar o wOs
  useEffect(() => {
    const restoreLastSession = async () => {
      if (!window.api?.chat?.listConversations) return;
      try {
        const result = await window.api.chat.listConversations();
        if (result.success && result.conversations?.length > 0) {
          const mostRecent = result.conversations[0];
          preventNextLoadRef.current = true; // evita duplo carregamento
          setActiveConversationId(mostRecent.id);
        } else {
          // Nenhuma conversa anterior — dispara boas-vindas
          setIsInitializing(false);
          setTimeout(() => {
            handleSendMessage("Aja de forma proativa: o sistema (wOs) acabou de inicializar. Dê as boas-vindas ao Wilkor de forma muito amigável (me chame de amigão), informe a data atual e pergunte como estão as coisas hoje ou o que vamos codar. Aja naturalmente, como uma IA assistente autônoma, e não mencione que este é um prompt automático.", true);
          }, 500);
        }
      } catch {
        setIsInitializing(false);
      }
    };
    restoreLastSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadConversation = async () => {
      if (activeConversationId && window.api?.chat?.getConversation) {
        // Se preventNextLoadRef estiver ligado, limpamos a flag e carregamos normalmente
        if (preventNextLoadRef.current) {
          preventNextLoadRef.current = false;
        }
        setIsLoading(true);
        try {
          const resp = await window.api.chat.getConversation(activeConversationId);
          if (resp.success && resp.conversation) {
            setMessages(resp.conversation.messages || []);
          }
        } catch (err) {
          addToast('Falha na comunicação com o banco.', 'error');
        } finally {
          setIsLoading(false);
          setIsInitializing(false);
        }
      } else if (!activeConversationId && !isInitializing) {
        // Novo chat explícito (usuário clicou em "Nova Conversa")
        setMessages([]);
        setTimeout(() => {
          handleSendMessage("Aja de forma proativa: o sistema (wOs) acabou de inicializar. Dê as boas-vindas ao Wilkor de forma muito amigável (me chame de amigão), informe a data atual e pergunte como estão as coisas hoje ou o que vamos codar. Aja naturalmente, como uma IA assistente autônoma, e não mencione que este é um prompt automático.", true);
        }, 500);
      }
    };
    loadConversation();
  }, [activeConversationId]);

  useEffect(() => {
    let removeChunkListener: (() => void) | undefined;
    let removeDoneListener: (() => void) | undefined;

    if (window.api?.chat?.onChunk) {
      removeChunkListener = window.api.chat.onChunk((chunk: string) => {
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const newContent = last.content === '...' ? chunk : last.content + chunk;
            const hasOpenAction = /<(?:wos|wilkor)_action[^>]*>(?![\s\S]*<\/(?:wos|wilkor)_action>)/.test(newContent) ||
                                  /<(?:wos|wilkor)_command[^>]*>(?![\s\S]*<\/(?:wos|wilkor)_command>)/.test(newContent);
            setIsGeneratingAction(hasOpenAction);
            return [...prev.slice(0, -1), { ...last, content: newContent }];
          }
          return prev;
        });
      });
    }

    if (window.api?.chat?.onDone) {
      removeDoneListener = window.api.chat.onDone(async (res: any) => {
        setIsLoading(false);
        setIsGeneratingAction(false);
        if (res.success) {
          const agentsResp = await window.api.agents.list().catch(() => ({ success: false, agents: [] }));
          const registeredAgents = agentsResp.success ? agentsResp.agents : [];

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              // Usa cache para parsing de ações
              const cacheKey = last.content.slice(-500) // Usa últimos 500 chars como chave
              let actions = parseCacheRef.current.get(cacheKey)
              if (!actions) {
                actions = parseMessageActions(last.content)
                parseCacheRef.current.set(cacheKey, actions)
                // Limpa cache se ficar muito grande
                if (parseCacheRef.current.size > 100) {
                  const firstKey = parseCacheRef.current.keys().next().value
                  if (firstKey) {
                    parseCacheRef.current.delete(firstKey)
                  }
                }
              }
              if (actions.length > 0) {
                setAgentActivities(prevActs => {
                  const newActs = [...prevActs];
                  const newCreatedActs: any[] = [];
                  actions.forEach(a => {
                    const isCommand = a.type === 'command';
                    const exists = newActs.find(act => {
                      if (!act.data) return false;
                      if (isCommand) return act.type === 'command' && (act.data as any).command === a.command;
                      return act.type === a.type && normalizePath((act.data as any).path || '') === normalizePath(a.path || '');
                    });
                    if (!exists) {
                      const act = {
                        id: Math.random().toString(36).substring(7),
                        type: isCommand ? 'command' : (a.type as any),
                        status: 'pending' as const,
                        timestamp: Date.now(),
                        data: a as any
                      };
                      newActs.push(act);
                      newCreatedActs.push(act);
                    }
                  });

                  if (isLastMessageFromVoiceRef.current && newCreatedActs.length > 0) {
                    setTimeout(() => {
                      newCreatedActs.forEach(async (act) => {
                        if (act.type === 'command') {
                          console.log(`[useAIChat] Auto-executing voice command: ${act.data.command}`);
                          setAgentActivities(current => current.map(a => a.id === act.id ? { ...a, status: 'running' } : a));
                          const resp = await window.api.agent.runCommand({ command: act.data.command });
                          if (resp.success) {
                            setTimeout(() => {
                              setAgentActivities(current => current.map(a => a.id === act.id ? { ...a, status: 'success' } : a));
                            }, 3000);
                          } else {
                            setAgentActivities(current => current.map(a => a.id === act.id ? { ...a, status: 'error' } : a));
                          }
                        }
                      });
                    }, 50);
                  }

                  return newActs;
                });
              }

              // Detecção e encadeamento de menção a agente especialista
              let matchedAgent: any = null;
              for (const agent of registeredAgents) {
                const tag = `@${agent.name.replace(/\s+/g, '')}`.toLowerCase();
                if (last.content.toLowerCase().includes(tag)) {
                  const secondLast = prev[prev.length - 2];
                  const wasJustAnsweredByThisAgent = secondLast && secondLast.role === 'user' && secondLast.content.includes(tag) && secondLast.isInvisible;
                  if (!wasJustAnsweredByThisAgent) {
                    matchedAgent = agent;
                    break;
                  }
                }
              }

              if (matchedAgent) {
                console.log(`💬 [useAIChat] Encadeando resposta do agente: ${matchedAgent.name}`);
                setTimeout(() => {
                  triggerAgentMentionChain(matchedAgent, prev);
                }, 500);
              }

            }
            return prev;
          });

          // J.A.R.V.I.S Mode (Text-to-Speech) - Executado fora do setMessages (efeito colateral limpo)
          if (isVoiceModeRef.current && res.text) {
            speakText(res.text);
          }
        } else {
          addToast(res.error || 'Erro desconhecido na resposta', 'error');
        }
      });
    }

    return () => {
      if (removeChunkListener) removeChunkListener();
      if (removeDoneListener) removeDoneListener();
    };
  }, [activeConversationId]);

  const triggerAgentMentionChain = async (agent: any, currentMessages: Message[]) => {
    setIsLoading(true);
    const invisibleUserMsg: Message = {
      role: 'user',
      content: `@${agent.name.replace(/\s+/g, '')} dê sua opinião sobre o código e discussão acima.`,
      isInvisible: true
    };
    const temporaryAssistantMsg: Message = {
      role: 'assistant',
      content: '...',
      senderName: agent.name,
      senderEmoji: agent.emoji,
      senderColor: agent.color
    };

    setMessages(prev => [...prev, invisibleUserMsg, temporaryAssistantMsg]);

    let conversationId = activeConversationId || Math.random().toString(36).substring(2, 15);
    if (!activeConversationId) setActiveConversationId(conversationId);

    try {
      const projectContexts = await window.api.workspace.getContext();
      const workspaceContext = buildAgentContext(projectContexts, tabs, activeTabPath, fileTrees)
      const userGlobalRules = settings.systemRules ? `\n## ⚠️ REGRAS GLOBAIS\n${settings.systemRules}\n` : '';

      const agentSystemContent = `${agent.systemPrompt}\n\nVocê é o agente "${agent.name}" com o papel de "${agent.role}". Você foi mencionado no chat principal e deve responder diretamente ao usuário.`;
      
      const contextMessage: Message = {
        role: 'system',
        content: `# Sistema Operacional de Workspace (wOs)
Você é o agente especialista "${agent.name}" com a função de "${agent.role}".
Quando precisar realizar ações no workspace, você DEVE usar os seguintes blocos XML.

### Formatos de Ação Permitidos:
1. Criar/reescrever arquivo: <wos_action type="write_file" path="caminho">...</wos_action>
2. Modificar trecho: <wos_action type="patch_file" path="caminho">...</wos_action>
3. Executar comando: <wos_command>...</wos_command>

### Regras de Contexto do Workspace:
${workspaceContext}
${userGlobalRules}

### Instrução da Persona:
${agentSystemContent}`,
      };

      const messagesWithContext: Message[] = [contextMessage, ...currentMessages.slice(-20), invisibleUserMsg];
      await window.api.chat.stream(agent.modelId, messagesWithContext, conversationId);
    } catch (err) {
      setIsLoading(false);
      addToast('Erro ao processar menção do agente.', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [...prev, { name: file.name, type: file.type, content: event.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (name: string) => {
    setAttachments(prev => prev.filter(a => a.name !== name));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachments(prev => [...prev, { name: `image-${Date.now()}.png`, type: file.type, content: event.target?.result as string }]);
            addToast('Imagem colada!', 'success');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleChatDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(file => {
        const path = (file as any).path;
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachments(prev => [...prev, { name: file.name, type: file.type, path, content: event.target?.result as string }]);
          addToast(`Arquivo ${file.name} anexado.`, 'info');
        };
        reader.readAsText(file);
      });
    } else {
      const internalPath = e.dataTransfer.getData('application/wos-file-path');
      if (internalPath) {
        const fileName = internalPath.split(/[\\/]/).pop() || internalPath;
        setAttachments(prev => [...prev, { name: fileName, path: internalPath, type: 'internal' }]);
        addToast(`Referência de ${fileName} adicionada.`, 'info');
      }
    }
  };

  const handleSendMessage = async (
    overridePrompt?: string,
    isInvisible?: boolean,
    isVoiceCommand?: boolean,
    bypassPlanning?: boolean
  ) => {
    isLastMessageFromVoiceRef.current = !!isVoiceCommand;
    const textToSend = overridePrompt || inputText;
    if ((!textToSend.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: textToSend.trim() || (attachments.length > 0 ? '[Arquivos Anexados]' : ''),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      isInvisible
    };

    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '...' }]);
    if (!overridePrompt) {
      setInputText('');
      setAttachments([]);
    }
    setIsLoading(true);

    let conversationId = activeConversationId || Math.random().toString(36).substring(2, 15);
    if (!activeConversationId) setActiveConversationId(conversationId);

    try {
      const projectContexts = await window.api.workspace.getContext();
      let globalSkillContext = '';
      const skillMatch = textToSend.match(/^@([\w-]+)\s*(.*)/);
      if (skillMatch && window.api.workspace.getSkillContent) {
        const skillContent = await window.api.workspace.getSkillContent(skillMatch[1]);
        if (skillContent) globalSkillContext = `\n## 🛠️ Skill Global Ativa: @${skillMatch[1]}\n${skillContent}`;
      }

      const workspaceContext = buildAgentContext(projectContexts, tabs, activeTabPath, fileTrees)
      const userGlobalRules = settings.systemRules ? `\n## ⚠️ REGRAS GLOBAIS\n${settings.systemRules}\n` : '';

      let planningSystemInstruction = '';
      if (isPlanningMode && !bypassPlanning) {
        planningSystemInstruction = `\n\n## ⚠️ MODO PLANEJAMENTO ATIVO ⚠️
Você está no MODO PLANEJAMENTO. O usuário quer que você planeje a tarefa antes de executá-la.
Sua única responsabilidade agora é analisar a solicitação e montar um plano de implementação detalhado em formato Markdown.
Você DEVE salvar este plano em um novo arquivo com extensão '.md' dentro do diretório de artefatos local 'artifacts/' (ex: 'artifacts/planning_nome_tarefa.md').
Para fazer isso, utilize EXCLUSIVAMENTE a tag write_file do wOs, assim:
<wos_action type="write_file" path="artifacts/planning_minha_tarefa.md">
# Plano de Implementação: [Nome da Tarefa]
...
</wos_action>

REGRAS CRÍTICAS:
1. NÃO faça NENHUMA alteração em outros arquivos do projeto.
2. NÃO execute NENHUM comando (wos_command).
3. Salve apenas o arquivo .md de planejamento em 'artifacts/'.
4. Seja extremamente detalhado sobre quais arquivos serão modificados, criados ou excluídos, e quais comandos precisarão ser rodados para testar/validar o build.
5. Após você gerar o planejamento em artifacts/, o usuário poderá revisar e aprovar o "Build do Planejado" para que você execute as ações reais no chat.
`;
      }

      const contextMessage: Message = {
        role: 'system',
        content: `# Sistema Operacional de Workspace (wOs)
Você é um engenheiro de software de elite operando via wOs.
Quando precisar realizar ações no workspace, você DEVE usar os seguintes blocos XML.

### Formatos de Ação Permitidos:
1. Criar/reescrever arquivo: <wos_action type="write_file" path="caminho">...</wos_action>
2. Modificar trecho: <wos_action type="patch_file" path="caminho">...</wos_action>
3. Executar comando: <wos_command>...</wos_command>

### Regras de Contexto do Workspace:
${workspaceContext}
${userGlobalRules}
${globalSkillContext}
${planningSystemInstruction}`,
      };

      const messagesWithContext: Message[] = [contextMessage, ...messages.slice(-20), userMessage];
      await window.api.chat.stream(activeModel, messagesWithContext, conversationId);
      setIsLoading(false);
      setIsGeneratingAction(false);
    } catch (err) {
      setIsLoading(false);
      setIsGeneratingAction(false);
      addToast('Erro ao processar requisição.', 'error');
    }
  };

  const { isRecording, handleToggleRecording } = useAudioRecorder({ 
    setInputText, 
    addToast,
    handleSendMessage: (text?: string) => handleSendMessage(text, false, true)
  });

  const handleStopGeneration = () => {
    if (window.api?.chat?.stop) window.api.chat.stop();
    setIsLoading(false);
    setIsGeneratingAction(false);
  };

  const handleAIAction = async (action: string, terminalId?: string) => {
    let prompt = "";
    if (terminalId && window.api?.terminal) {
      try {
        const buffer = await (window.api.terminal as any).getBuffer(terminalId);
        if (buffer) prompt = `Analise o erro no terminal abaixo:\n\n\`\`\`\n${buffer}\n\`\`\``;
      } catch (err) {
        console.error('Erro ao buscar buffer do terminal:', err);
      }
    }
    if (!prompt) {
      const tab = tabs.find(t => normalizePath(t.path) === normalizePath(activeTabPath || ''));
      if (!tab) {
        if (action === 'fix' && !terminalId) addToast('Abra um arquivo ou use o terminal', 'warning');
        return;
      }
      switch (action) {
        case 'explain': prompt = `Explique o código:\n\n\`\`\`\n${tab.content}\n\`\`\``; break;
        case 'refactor': prompt = `Refatore o código:\n\n\`\`\`\n${tab.content}\n\`\`\``; break;
        case 'fix': prompt = `Corrija bugs no código:\n\n\`\`\`\n${tab.content}\n\`\`\``; break;
      }
    }
    if (prompt) handleSendMessage(prompt);
  };

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isLoading,
    setIsLoading,
    attachments,
    setAttachments,
    activeConversationId,
    setActiveConversationId,
    agentActivities,
    setAgentActivities,
    streamingActivity,
    setStreamingActivity,
    contextChars,
    maxContext,
    chatEndRef,
    fileInputRef,
    textAreaRef,
    handleSendMessage,
    handleApplyAgentActivity,
    handleRejectAgentActivity,
    handleUndoAgentActivity,
    handleAIAction,
    handleAcceptAllActivities,
    handleRejectAllActivities,
    handleStopGeneration,
    handleFileSelect,
    handleRemoveAttachment,
    handleToggleRecording,
    handleChatDrop,
    handlePaste,
    isDragging,
    setIsDragging,
    isRecording,
    isGeneratingAction,
    isVoiceModeEnabled,
    setIsVoiceModeEnabled,
    isHandsFreeRecording,
    isPlanningMode,
    setIsPlanningMode,
  }
}
