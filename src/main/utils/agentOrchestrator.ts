import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import * as db from './agentDatabase';
import { modelManager } from '../models/manager';
import { IAgent, IAgentMessage, IAgentSession } from '../../shared/types';
import { ChatMessage } from '../models/types';
import { getRoots, getRecursiveTree } from './fs';
import { getSystemDateTimePrompt } from './dateUtils';
import { getTrelloCardDetails } from './trelloHandler';
import { getConclusionInstruction, actionInstruction, pipelineInstruction } from './agentPromptTemplates';
import { MODEL_COSTS, CONCLUSION_SIGNALS, formatFolderTree } from './orchestratorUtils';

interface SessionMeta {
  startedAt: number;
  totalChars: number;
  concludedAgentIds: Set<string>;
}

export class AgentOrchestrator {
  private activeSessions = new Set<string>();
  private sessionMeta = new Map<string, SessionMeta>();

  public isSessionRunning(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  public getActiveSessionId(): string | null {
    if (this.activeSessions.size === 0) return null;
    return Array.from(this.activeSessions)[0];
  }

  public async getActiveSessionRepoPath(): Promise<string | undefined> {
    const sessionId = this.getActiveSessionId();
    if (sessionId) {
      const session = await db.getAgentSession(sessionId);
      return session?.repoPath || undefined;
    }
    return undefined;
  }

  public async startInteraction(sessionId: string, getMainWindow: () => BrowserWindow | null): Promise<void> {
    if (this.activeSessions.has(sessionId)) return;
    this.activeSessions.add(sessionId);
    this.sessionMeta.set(sessionId, { startedAt: Date.now(), totalChars: 0, concludedAgentIds: new Set() });
    const mainWindow = getMainWindow();

    try {
      await db.AgentSessionModel.updateOne(
        { id: sessionId },
        { $set: { status: 'running', 'stats.startedAt': new Date() } }
      );

      while (this.activeSessions.has(sessionId)) {
        const session = await db.getAgentSession(sessionId);
        if (!session || session.status !== 'running' || session.agentIds.length === 0) break;

        // Se a última mensagem for do usuário humano, limpa conclusões antigas para reativar o debate
        const lastMsg = session.messages[session.messages.length - 1];
        const currentMeta = this.sessionMeta.get(sessionId);
        if (currentMeta && lastMsg && !lastMsg.agentId) {
          if (currentMeta.concludedAgentIds.size > 0) {
            console.log(`[Orchestrator] 👤 Intervenção humana detectada em "${session.title}". Resetando conclusões dos agentes.`);
            currentMeta.concludedAgentIds.clear();
          }
        }

        const allAgents = await db.getAgents();
        const activeAgents = allAgents.filter(a => session.agentIds.includes(a.id));
        if (activeAgents.length === 0) break;

        // --- LÓGICA DE CITAÇÃO DIRECIONADA ---
        const messages = session.messages;
        const lastHumanMsgIndex = [...messages].reverse().findIndex(m => !m.agentId);
        let nextAgent: IAgent | null = null;
        let shouldStopAfterReply = false;

        if (lastHumanMsgIndex !== -1) {
          const lastHumanMsg = messages[messages.length - 1 - lastHumanMsgIndex];
          const mentionedAgents = activeAgents.filter(agent => {
            const tagWithoutSpace = `@${agent.name.replace(/\s+/g, '')}`.toLowerCase();
            const tagWithSpace = `@${agent.name}`.toLowerCase();
            const msgContent = lastHumanMsg.content.toLowerCase();
            return msgContent.includes(tagWithoutSpace) || msgContent.includes(tagWithSpace);
          });

          if (mentionedAgents.length > 0) {
            const repliesAfterHuman = messages.slice(messages.length - lastHumanMsgIndex);
            const repliedAgentIds = repliesAfterHuman.map(m => m.agentId).filter(Boolean);
            const pendingMentionedAgents = mentionedAgents.filter(agent => !repliedAgentIds.includes(agent.id));

            if (pendingMentionedAgents.length > 0) {
              nextAgent = pendingMentionedAgents[0];
              if (pendingMentionedAgents.length === 1) {
                shouldStopAfterReply = true;
              }
            } else {
              console.log(`[Orchestrator] 🛑 Todos os agentes mencionados na intervenção humana responderam. Pausando debate.`);
              await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { status: 'paused', activeAgentId: null } });
              mainWindow?.webContents.send('agents:session-status-change', { sessionId, status: 'paused', activeAgentId: undefined });
              this.activeSessions.delete(sessionId);
              break;
            }
          }
        }

        if (!nextAgent) {
          nextAgent = this.determineNextAgent(session, activeAgents);
        }
        if (!nextAgent) break;

        // Calcula rodada atual
        const agentMsgCount = session.messages.filter(m => m.agentId).length;
        const currentRound = Math.floor(agentMsgCount / activeAgents.length) + 1;
        const maxRounds = session.maxRounds || 20;

        await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { activeAgentId: nextAgent.id } });
        mainWindow?.webContents.send('agents:session-status-change', { sessionId, status: 'running', activeAgentId: nextAgent.id });

        const formattedMessages = await this.buildLLMHistory(session, nextAgent, maxRounds);
        let fullResponse = '';
        try {
          fullResponse = await modelManager.handleAgentDirectChat(nextAgent.modelId, formattedMessages, (chunk) => {
            if (this.activeSessions.has(sessionId) && mainWindow) {
              mainWindow.webContents.send('agents:session-chunk', { sessionId, agentId: nextAgent.id, chunk });
            }
          }, `Debate: ${session.title || sessionId}`);
        } catch (err: any) {
          fullResponse = `[Erro na resposta de ${nextAgent.name}]: ${err.message}`;
        }

        if (!this.activeSessions.has(sessionId)) break;

        // Atualiza stats e detecta conclusão
        const meta = this.sessionMeta.get(sessionId)!;
        meta.totalChars += fullResponse.length;
        const hasConcluded = CONCLUSION_SIGNALS.some(s => fullResponse.toUpperCase().includes(s.toUpperCase()));
        if (hasConcluded) {
          meta.concludedAgentIds.add(nextAgent.id);
          console.log(`[Orchestrator] ✅ ${nextAgent.name} sinalizou conclusão.`);
        }

        const newMsg: IAgentMessage = {
          id: randomUUID(), agentId: nextAgent.id,
          senderName: nextAgent.name, senderRole: nextAgent.role,
          senderEmoji: nextAgent.emoji, senderColor: nextAgent.color,
          content: fullResponse, timestamp: new Date()
        };
        await db.addSessionMessage(sessionId, newMsg);
        mainWindow?.webContents.send('agents:session-message-done', { sessionId, message: newMsg });

        if (shouldStopAfterReply) {
          console.log(`[Orchestrator] 🛑 Resposta do agente mencionado concluída. Pausando debate.`);
          await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { status: 'paused', activeAgentId: null } });
          mainWindow?.webContents.send('agents:session-status-change', { sessionId, status: 'paused', activeAgentId: undefined });
          this.activeSessions.delete(sessionId);
          break;
        }

        // Publica stats atualizadas para o frontend
        const elapsedMs = Date.now() - meta.startedAt;
        const estimatedTokens = Math.round(meta.totalChars / 4);
        const costPerK = MODEL_COSTS[nextAgent.modelId] || 0.001;
        const estimatedCost = (estimatedTokens / 1000) * costPerK;
        const statsUpdate = { totalRounds: currentRound, totalChars: meta.totalChars, estimatedTokens, estimatedCost, durationMs: elapsedMs };
        await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { stats: { ...statsUpdate, startedAt: new Date(meta.startedAt) } } });
        mainWindow?.webContents.send('agents:session-stats', { sessionId, stats: statsUpdate });

        // Verifica se todos os agentes concluíram e se não há tarefas pendentes
        const updatedSession = await db.getAgentSession(sessionId);
        const hasPendingTasks = updatedSession?.tasks?.some((t: any) => t.status === 'pending');
        const allConcluded = activeAgents.every(a => meta.concludedAgentIds.has(a.id));
        if (allConcluded) {
          if (hasPendingTasks) {
            meta.concludedAgentIds.clear();
            console.log('[Orchestrator] ⚠️ Todos os agentes concluíram, mas existem tarefas pendentes. Mantendo debate ativo.');
          } else {
            console.log('[Orchestrator] 🎉 Todos os agentes concluíram e não há tarefas pendentes. Encerrando debate.');
            await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { status: 'concluded', activeAgentId: null } });
            mainWindow?.webContents.send('agents:session-status-change', { sessionId, status: 'concluded', activeAgentId: undefined });
            this.activeSessions.delete(sessionId);
            return;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error('[Orchestrator] Erro no loop:', err);
    } finally {
      this.activeSessions.delete(sessionId);
      this.sessionMeta.delete(sessionId);
      const session = await db.getAgentSession(sessionId);
      if (session && session.status === 'running') {
        await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { status: 'idle', activeAgentId: null } });
        getMainWindow()?.webContents.send('agents:session-status-change', { sessionId, status: 'idle', activeAgentId: undefined });
      }
    }
  }

  public async stopInteraction(sessionId: string): Promise<void> {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
      modelManager.stopChat();
      await db.AgentSessionModel.updateOne({ id: sessionId }, { $set: { status: 'paused', activeAgentId: null } });
    }
  }

  private determineNextAgent(session: IAgentSession, activeAgents: IAgent[]): IAgent | null {
    if (session.messages.length === 0) return activeAgents[0];
    const lastMsg = session.messages[session.messages.length - 1];
    for (const agent of activeAgents) {
      const tagWithoutSpace = `@${agent.name.replace(/\s+/g, '')}`.toLowerCase();
      const tagWithSpace = `@${agent.name}`.toLowerCase();
      const msgContent = lastMsg.content.toLowerCase();
      if (msgContent.includes(tagWithoutSpace) || msgContent.includes(tagWithSpace)) {
        return agent;
      }
    }
    if (lastMsg.agentId) {
      const lastIndex = activeAgents.findIndex(a => a.id === lastMsg.agentId);
      if (lastIndex !== -1) return activeAgents[(lastIndex + 1) % activeAgents.length];
    }
    return activeAgents[0];
  }

  private async buildLLMHistory(session: IAgentSession, nextAgent: IAgent, maxRounds: number): Promise<ChatMessage[]> {
    const activeRoots = getRoots();
    const selectedRoot = session.repoPath || activeRoots[0];
    let workspaceInfo = '';

    if (selectedRoot) {
      try {
        const tree = await getRecursiveTree(selectedRoot);
        const formattedTree = formatFolderTree(tree);
        workspaceInfo = `\n\n### 📁 ESTRUTURA E ARQUIVOS DO PROJETO ATUAL:\nRaiz do Projeto: "${selectedRoot}"\n\n${formattedTree}\n\nInstrução Importante: Use as ferramentas "listFiles" ou "readFile" para ler arquivos locais de código. Não se limite a commits. Faça uma varredura real do código fonte!`;
      } catch (err) {
        workspaceInfo = `\n\n### 📁 ESTRUTURA DO PROJETO ATUAL:\nRaiz do Projeto: "${selectedRoot}"\nInstrução Importante: Use as ferramentas "listFiles" ou "readFile" para entrar no source code real do repositório, ler o README.md e os arquivos locais de código. Não se limite a commits. Faça uma varredura real do código fonte!`;
      }
    }

    const tasksInfo = session.tasks && session.tasks.length > 0
      ? `\n\n### 📋 CHECKLIST DE TAREFAS DESTA DISCUSSÃO:\n` + session.tasks.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] ID: "${t.id}" | Categoria: ${t.category.toUpperCase()} | Atribuído a: "${t.assignedTo}" | Criado por: "${t.createdBy}"\n  Título: ${t.title}`).join('\n') + `\n\nDiretrizes de Tarefas: Se você identificar um problema, gargalo ou melhoria de Front (React), Back (Nodejs), Banco de dados (MongoDB) ou Segurança, crie uma tarefa para o especialista correspondente usando a ferramenta "createAgentTask". Quando terminar uma tarefa atribuída a você, marque-a como concluída usando a ferramenta "completeAgentTask" informando o "taskId" correspondente. O debate não terminará até que todas as tarefas sejam concluídas.`
      : `\n\n### 📋 CHECKLIST DE TAREFAS DESTA DISCUSSÃO:\nNenhuma tarefa criada ainda.\nDiretrizes de Tarefas: Use a ferramenta "createAgentTask" para criar tarefas para outros especialistas (atribuindo para "React" no Front, "Nodejs" no Back, "MongoDB" no Banco de Dados ou "Segurança" para segurança) assim que identificar itens pendentes de análise ou implementação. O debate permanecerá ativo enquanto houver tarefas pendentes em aberto.`;

    const conclusionInstruction = getConclusionInstruction(maxRounds);


    let trelloCardInfo = '';
    if (session.trelloCardId) {
      try {
        const trelloRes = await getTrelloCardDetails(session.trelloCardId);
        if (trelloRes.success && trelloRes.card) {
          const card = trelloRes.card;
          trelloCardInfo = `\n\n### 📌 CARD DO TRELLO SELECIONADO PARA TRABALHO:
Card ID: "${card.id}"
Nome da Tarefa: "${card.name}"
Descrição/Requisitos:
${card.desc || 'Sem descrição.'}

Instruções Técnicas da Tarefa:
1. Analise cuidadosamente a descrição do card acima.
2. Você deve de fato gerar a documentação correspondente (PRD.md, SDD.md, Specs.md) na pasta "docs/" do repositório local usando a ferramenta "writeFile". Crie uma pasta organizada ou salve no local adequado.
3. À medida que avança na documentação, crie as tarefas correspondentes no checklist e marque-as como concluídas.
4. Quando a documentação técnica estiver concluída, use a ferramenta "addTrelloCardComment" para postar no card um resumo do trabalho gerado e a estimativa de tempo de desenvolvimento (ex: 36 a 48 horas).`;
        }
      } catch (err: any) {
        console.error('[Orchestrator] Erro ao carregar card do Trello no prompt:', err.message);
      }
    }

    const dateTimePrompt = getSystemDateTimePrompt();

    // --- INJETAR DIRETRIZ DE PERGUNTA DIRECIONADA ---
    const lastMsg = session.messages[session.messages.length - 1];
    let directQuestionPrompt = '';
    if (lastMsg && !lastMsg.agentId) {
      const tagWithoutSpace = `@${nextAgent.name.replace(/\s+/g, '')}`.toLowerCase();
      const tagWithSpace = `@${nextAgent.name}`.toLowerCase();
      const msgContent = lastMsg.content.toLowerCase();
      if (msgContent.includes(tagWithoutSpace) || msgContent.includes(tagWithSpace)) {
        directQuestionPrompt = `\n\n⚠️ INSTRUÇÃO DE PRIORIDADE: O usuário humano "${lastMsg.senderName}" mencionou você diretamente e fez uma pergunta/comentário na última mensagem. Você DEVE responder diretamente a este comentário ou pergunta na sua resposta, respondendo à dúvida ou opinião solicitada de forma clara e amigável.`;
      }
    }

    return [
      {
        role: 'system',
        content: `${nextAgent.systemPrompt}\n\n${dateTimePrompt}${conclusionInstruction}${actionInstruction}${pipelineInstruction}${trelloCardInfo}${workspaceInfo}${tasksInfo}${directQuestionPrompt}\n\nVocê está em um debate multi-agente. Mensagens são prefixadas com "[Nome (Papel)]:". Seu nome é "${nextAgent.name}", papel: "${nextAgent.role}".`
      },
      ...session.messages.map(msg => ({
        role: (msg.agentId === nextAgent.id ? 'assistant' : 'user') as 'assistant' | 'user',
        content: `[${msg.senderName} (${msg.senderRole})]: ${msg.content}`
      }))
    ];
  }
}

export const agentOrchestrator = new AgentOrchestrator();
