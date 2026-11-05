import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import * as db from '../utils/agentDatabase';
import { getRoots } from '../utils/fs';
import { resolveAgyPath } from '../handlers/agyHandler';
import { createWorktree, commitAndPushWorktree, removeWorktree } from '../utils/gitWorktree';
import { IAgentTask, IAgentMessage } from '../../shared/types';

export interface WorkflowTaskState {
  taskId: string;
  status: 'idle' | 'preparing_worktree' | 'planning' | 'executing' | 'committing' | 'completed' | 'error';
  agentName: string;
  agentEmoji: string;
  agentColor: string;
  branchName: string;
  worktreePath?: string;
  progress: number;
}

export class AgentWorkflowEngine {
  private activeProcesses = new Map<string, ChildProcess>();
  private taskLogs = new Map<string, string[]>();
  private taskStates = new Map<string, WorkflowTaskState>();
  private currentSessionId: string | null = null;

  public async getWorkflowState() {
    return {
      sessionId: this.currentSessionId,
      tasks: Array.from(this.taskStates.values()),
      logs: Object.fromEntries(this.taskLogs.entries())
    };
  }

  public async startParallelWorkflow(sessionId: string, selectedTaskIds: string[]): Promise<void> {
    this.currentSessionId = sessionId;
    const session = await db.getAgentSession(sessionId);
    if (!session) throw new Error('Sessão não encontrada.');

    const allAgents = await db.getAgents();
    const activeTasks = (session.tasks || []).filter(t => selectedTaskIds.includes(t.id));
    const repoPath = session.repoPath || getRoots()[0];

    if (!repoPath) throw new Error('Nenhuma raiz de projeto ativa encontrada para o repositório.');

    console.log(`[WorkflowEngine] 🚀 Iniciando workflow paralelo para ${activeTasks.length} tarefas.`);

    // Inicia cada tarefa em paralelo de forma assíncrona
    for (const task of activeTasks) {
      if (task.status === 'completed') continue;
      this.runTaskInWorkflow(sessionId, task, allAgents, repoPath).catch(err => {
        console.error(`[WorkflowEngine] Erro crítico na execução da tarefa "${task.title}":`, err);
      });
    }
  }

  public async stopWorkflow(sessionId: string): Promise<void> {
    console.log(`[WorkflowEngine] 🛑 Interrompendo todos os processos ativos no workflow.`);
    for (const [taskId, process] of this.activeProcesses.entries()) {
      process.kill();
      const state = this.taskStates.get(taskId);
      if (state) {
        state.status = 'error';
        this.emitStateUpdate();
      }
    }
    this.activeProcesses.clear();
    
    // Executa a limpeza física dos worktrees ativos de forma assíncrona
    const repoPath = (await db.getAgentSession(sessionId))?.repoPath || getRoots()[0];
    if (repoPath) {
      for (const state of this.taskStates.values()) {
        if (state.worktreePath) {
          removeWorktree(repoPath, state.worktreePath).catch(() => null);
        }
      }
    }
    
    this.currentSessionId = null;
    this.taskStates.clear();
    this.taskLogs.clear();
    this.emitStateUpdate();
  }

  private async runTaskInWorkflow(
    sessionId: string,
    task: IAgentTask,
    allAgents: any[],
    repoPath: string
  ): Promise<void> {
    const taskId = task.id;
    
    // Determina o agente adequado com base no cargo/atribuição ou categoria da tarefa
    const agent = allAgents.find(a => 
      a.name.toLowerCase().includes(task.assignedTo.toLowerCase()) || 
      a.role.toLowerCase().includes(task.assignedTo.toLowerCase())
    ) || allAgents[0] || { name: 'Agente Especialista', emoji: '🤖', color: '#A855F7' };

    const branchName = `feat/wos-${task.category}-${taskId}`;
    const state: WorkflowTaskState = {
      taskId,
      status: 'preparing_worktree',
      agentName: agent.name,
      agentEmoji: agent.emoji,
      agentColor: agent.color,
      branchName,
      progress: 10
    };

    this.taskStates.set(taskId, state);
    this.taskLogs.set(taskId, [`[wOs Engine] 📁 Criando git worktree na branch "${branchName}"...`]);
    this.emitStateUpdate();

    let worktreePath = '';
    try {
      // 1. Cria o Worktree físico isolado
      worktreePath = await createWorktree(repoPath, taskId, branchName);
      state.worktreePath = worktreePath;
      state.status = 'planning';
      state.progress = 25;
      this.appendLog(taskId, `[wOs Engine] ✅ Worktree criado com sucesso em: ${worktreePath}`);
      this.emitStateUpdate();

      // 2. Prepara o prompt da tarefa para o Antigravity CLI executar física das alterações
      const agyPath = resolveAgyPath();
      
      this.appendLog(taskId, `[wOs Engine] 📋 Iniciando planejamento de modificações e execução física via Antigravity CLI...`);
      state.status = 'executing';
      state.progress = 50;
      this.emitStateUpdate();

      const prompt = `No repositório localizado em ${worktreePath}, realize a execução das modificações físicas de código necessárias para completar a tarefa: "${task.title}". Diretrizes importantes: Analise os arquivos existentes e faça alterações incrementais de código (use replace_file_content ou multi_replace_file_content) para implementar os requisitos de forma robusta e limpa. Não delete arquivos existentes e não reescreva tudo do zero sem necessidade. Após concluir, certifique-se de que a implementação esteja funcional.`;
      
      // Spawna o Antigravity CLI como um processo filho no diretório do worktree
      const proc = spawn(agyPath, ['--prompt', prompt, '--dangerously-skip-permissions'], {
        cwd: worktreePath
      });

      this.activeProcesses.set(taskId, proc);

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        this.appendLog(taskId, text);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        this.appendLog(taskId, `[ERRO] ${text}`);
      });

      // Aguarda a conclusão do processo
      await new Promise<void>((resolve, reject) => {
        proc.on('close', (code) => {
          this.activeProcesses.delete(taskId);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`O executor Antigravity CLI falhou com código de saída ${code}`));
          }
        });
        proc.on('error', (err) => {
          this.activeProcesses.delete(taskId);
          reject(err);
        });
      });

      // 3. Commit e Push no Worktree
      state.status = 'committing';
      state.progress = 85;
      this.appendLog(taskId, `[wOs Engine] 🔄 Concluído com sucesso! Gravando alterações e fazendo push na branch "${branchName}"...`);
      this.emitStateUpdate();

      await commitAndPushWorktree(worktreePath, `feat(${task.category}): ${task.title} (resolvido por ${agent.name})`, branchName);

      // 4. Remove o Worktree físico para limpeza
      this.appendLog(taskId, `[wOs Engine] 🧹 Limpando worktree temporário...`);
      await removeWorktree(repoPath, worktreePath);

      // 5. Finaliza a tarefa no banco de dados e notifica
      state.status = 'completed';
      state.progress = 100;
      this.appendLog(taskId, `[wOs Engine] 🎉 Tarefa concluída com sucesso e branch enviada para o remoto!`);
      this.emitStateUpdate();

      // Atualiza tarefa no banco
      const currentSession = await db.getAgentSession(sessionId);
      if (currentSession) {
        const t = currentSession.tasks?.find(item => item.id === taskId);
        if (t) {
          t.status = 'completed';
          t.description = `[PLANO_EXECUTADO_WORKTREE]\nTarefa resolvida com sucesso na branch "${branchName}".`;
          await db.saveAgentSession(currentSession);
          
          // Envia notificação no chat principal
          const chatMsg: IAgentMessage = {
            id: randomUUID(),
            agentId: agent.id,
            senderName: agent.name,
            senderRole: agent.role,
            senderEmoji: agent.emoji,
            senderColor: agent.color,
            content: `📢 [Workflow Autônomo] Concluí com sucesso a implementação física da tarefa **"${task.title}"** na branch dedicada \`${branchName}\` e limpei meu ambiente isolado. O código está pronto para PR e merge!`,
            timestamp: new Date()
          };
          currentSession.messages.push(chatMsg);
          await db.saveAgentSession(currentSession);
          
          const win = BrowserWindow.getAllWindows()[0];
          win?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: currentSession.tasks });
          win?.webContents.send('agents:session-message-done', { sessionId, message: chatMsg });
        }
      }
    } catch (error: any) {
      console.error(`[WorkflowEngine] Erro ao executar tarefa "${task.title}":`, error.message);
      state.status = 'error';
      state.progress = 100;
      this.appendLog(taskId, `[ERRO FATAL] Falha no workflow: ${error.message}`);
      this.emitStateUpdate();

      // Limpa o worktree em caso de erro
      if (worktreePath) {
        removeWorktree(repoPath, worktreePath).catch(() => null);
      }

      // Atualiza o banco notificando erro
      const currentSession = await db.getAgentSession(sessionId);
      if (currentSession) {
        const t = currentSession.tasks?.find(item => item.id === taskId);
        if (t) {
          t.status = 'pending';
          t.description = `[ERRO_EXECUÇÃO_WORKTREE]\nOcorreu um erro ao rodar o agente: ${error.message}`;
          await db.saveAgentSession(currentSession);
          
          const chatMsg: IAgentMessage = {
            id: randomUUID(),
            agentId: agent.id,
            senderName: agent.name,
            senderRole: agent.role,
            senderEmoji: agent.emoji,
            senderColor: agent.color,
            content: `❌ [Workflow Autônomo] Falha ao tentar executar a tarefa **"${task.title}"**: \n\`\`\`\n${error.message}\n\`\`\``,
            timestamp: new Date()
          };
          currentSession.messages.push(chatMsg);
          await db.saveAgentSession(currentSession);

          const win = BrowserWindow.getAllWindows()[0];
          win?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: currentSession.tasks });
          win?.webContents.send('agents:session-message-done', { sessionId, message: chatMsg });
        }
      }
    }
  }

  private appendLog(taskId: string, text: string) {
    const logs = this.taskLogs.get(taskId) || [];
    const newLines = text.split('\n');
    logs.push(...newLines);
    this.taskLogs.set(taskId, logs);

    // Envia o log em tempo real via IPC
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send('agents:workflow-logs', { taskId, lines: newLines });
    }
  }

  private emitStateUpdate() {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send('agents:workflow-update', {
        sessionId: this.currentSessionId,
        tasks: Array.from(this.taskStates.values())
      });
    }
  }
}

export const agentWorkflowEngine = new AgentWorkflowEngine();
