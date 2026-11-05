import { ipcMain, BrowserWindow } from 'electron';
import * as db from '../utils/agentDatabase';
import { agentOrchestrator } from '../utils/agentOrchestrator';

export function registerAgentHandlers(getWin: () => BrowserWindow | null) {
  // Handlers de Agentes
  ipcMain.handle('agents:list', async () => {
    try {
      const agents = await db.getAgents();
      return { success: true, agents };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:save', async (_event, agent) => {
    try {
      await db.saveAgent(agent);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:delete', async (_event, id) => {
    try {
      await db.deleteAgent(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Handlers de Sessões
  ipcMain.handle('agents:list-sessions', async () => {
    try {
      const sessions = await db.getAgentSessions();
      return { success: true, sessions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:get-session', async (_event, id) => {
    try {
      const session = await db.getAgentSession(id);
      if (!session) throw new Error('Sessão não encontrada');
      return { success: true, session };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:save-session', async (_event, session) => {
    try {
      await db.saveAgentSession(session);
      return { success: true };
    } catch (error: any) {
      console.error('[AgentHandler] Erro ao salvar sessão de agentes:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:delete-session', async (_event, id) => {
    try {
      await db.deleteAgentSession(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:truncate-session', async (_event, { sessionId, messageId }) => {
    try {
      await db.truncateSessionMessages(sessionId, messageId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:toggle-task', async (_event, { sessionId, taskId, completed }) => {
    try {
      const session = await db.getAgentSession(sessionId);
      if (!session) throw new Error('Sessão não encontrada');
      if (!session.tasks) session.tasks = [];
      const task = session.tasks.find((t: any) => t.id === taskId);
      if (task) {
        if (completed && task.description && task.description.startsWith('[PLANO_GERADO]')) {
          // Define como concluído provisoriamente e marca que está executando o plano
          task.status = 'completed';
          task.description = task.description.replace('[PLANO_GERADO]', '[PLANO_APROVADO_EXECUTANDO]');
          await db.saveAgentSession(session);
          getWin()?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: session.tasks });
          
          // Dispara a execução física das alterações em background via CLI do Antigravity
          const { runTaskExecutionPlan } = await import('../models/agentTaskToolExecutor');
          runTaskExecutionPlan(sessionId, task.id, session.repoPath).catch(err => {
            console.error('[Task Execution] Erro fatal no subprocesso de execução do plano:', err);
          });
          
          return { success: true };
        }

        if (!completed && task.description && (
          task.description.startsWith('[PLANO_GERADO]') ||
          task.description.startsWith('[PLANO_APROVADO_EXECUTANDO]') ||
          task.description.startsWith('[PLANO_EXECUTADO]')
        )) {
          // Volta do zero!
          task.status = 'pending';
          task.description = undefined;
          await db.saveAgentSession(session);
          getWin()?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: session.tasks });

          // Tenta remover o arquivo implementation_plan.md do repositório local
          try {
            const fsNode = await import('fs/promises');
            const pathNode = await import('path');
            const targetRoot = session.repoPath || (await import('../utils/fs')).getRoots()[0];
            if (targetRoot) {
              const planPath = pathNode.default.join(targetRoot, 'implementation_plan.md');
              await fsNode.default.unlink(planPath).catch(() => {});
            }
          } catch (e) {
            console.error('[Task Reset] Erro ao remover o arquivo de plano do disco:', e);
          }

          // Envia notificação de reinício no chat
          const { randomUUID } = await import('crypto');
          const resetMsg = {
            id: randomUUID(),
            agentId: 'antigravity-cli',
            senderName: 'Antigravity CLI',
            senderRole: 'Reinício de Planejamento',
            senderEmoji: '🔄',
            senderColor: '#E91E63',
            content: `[Antigravity CLI] A tarefa **"${task.title}"** foi desmarcada! O plano anterior foi descartado e a CLI iniciou o cálculo de um novo plano de implementação do zero em segundo plano...`,
            timestamp: new Date()
          };
          session.messages.push(resetMsg as any);
          await db.saveAgentSession(session);
          getWin()?.webContents.send('agents:session-message-done', { sessionId, message: resetMsg as any });

          // Dispara novamente o planejamento em background do zero
          const { runTaskPlanningPlan } = await import('../models/agentTaskToolExecutor');
          runTaskPlanningPlan(sessionId, task.id, session.repoPath).catch(err => {
            console.error('[Task Reset] Erro ao disparar re-planejamento:', err);
          });

          return { success: true };
        }

        task.status = completed ? 'completed' : 'pending';
        await db.saveAgentSession(session);
        getWin()?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: session.tasks });
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Controle de Interação / Orchestrator
  ipcMain.handle('agents:start-interaction', async (_event, sessionId) => {
    try {
      // Inicia em background de forma assíncrona para não travar a chamada IPC
      agentOrchestrator.startInteraction(sessionId, getWin);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:stop-interaction', async (_event, sessionId) => {
    try {
      await agentOrchestrator.stopInteraction(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Handlers do Workflow Autônomo e Paralelo com Git Worktree
  ipcMain.handle('agents:start-parallel-workflow', async (_event, { sessionId, taskIds }) => {
    try {
      const { agentWorkflowEngine } = await import('../models/agentWorkflowEngine');
      // Inicia em background
      agentWorkflowEngine.startParallelWorkflow(sessionId, taskIds).catch(err => {
        console.error('[Workflow IPC] Erro no subprocesso do workflow:', err);
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:stop-parallel-workflow', async (_event, sessionId) => {
    try {
      const { agentWorkflowEngine } = await import('../models/agentWorkflowEngine');
      await agentWorkflowEngine.stopWorkflow(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agents:get-workflow-state', async () => {
    try {
      const { agentWorkflowEngine } = await import('../models/agentWorkflowEngine');
      const state = await agentWorkflowEngine.getWorkflowState();
      return { success: true, state };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

