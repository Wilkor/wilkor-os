import { BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import * as db from './database';
import { matchesCron } from './cronParser';
import { modelManager } from '../models/manager';
import * as agentDb from './agentDatabase';

class CronManager {
  private checkInterval: NodeJS.Timeout | null = null;
  private runningJobs: Set<string> = new Set();
  private lastMinuteRun: number = -1;

  public start() {
    if (this.checkInterval) return;

    console.log('⏰ [CronManager] Inicializando sistema de agendamento de tarefas...');
    
    // Roda a verificação de minuto em minuto
    this.checkInterval = setInterval(() => {
      this.checkScheduledJobs();
    }, 30000); // Roda a cada 30 segundos para garantir que não perca o minuto

    // Executa a primeira checagem após 5 segundos da inicialização
    setTimeout(() => this.checkScheduledJobs(), 5000);
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('⏰ [CronManager] Sistema de agendamento pausado.');
  }

  /**
   * Varre o banco de dados por crons ativas e executa as que casam com o horário atual.
   */
  private async checkScheduledJobs() {
    const now = new Date();
    const currentMinute = now.getMinutes();

    // Evita executar o mesmo job mais de uma vez no mesmo minuto
    if (currentMinute === this.lastMinuteRun) {
      return;
    }

    try {
      const activeJobs = await db.getCronJobs();
      const enabledJobs = activeJobs.filter(j => j.enabled);

      for (const job of enabledJobs) {
        if (matchesCron(job.cronExpr, now)) {
          console.log(`⏰ [CronManager] Executando tarefa agendada: "${job.name}" (${job.cronExpr})`);
          this.executeJob(job as any).catch(err => {
            console.error(`❌ [CronManager] Falha ao executar tarefa "${job.name}":`, err);
          });
        }
      }

      this.lastMinuteRun = currentMinute;
    } catch (error) {
      console.error('❌ [CronManager] Erro ao verificar tarefas agendadas:', error);
    }
  }

  /**
   * Executa uma tarefa cron específica (agendada ou sob demanda).
   */
  public async executeJob(job: db.ICronJob): Promise<string> {
    if (this.runningJobs.has(job.id)) {
      console.log(`⚠️ [CronManager] Tarefa "${job.name}" já está em execução. Pulando.`);
      return '';
    }

    this.runningJobs.add(job.id);
    const conversationId = randomUUID();
    const win = BrowserWindow.getAllWindows()[0];

    try {
      // 1. Salva a mensagem do usuário (o Prompt do job)
      await db.saveMessage(conversationId, {
        role: 'user',
        content: job.prompt,
        timestamp: new Date()
      }, job.modelId);

      // 2. Atualiza o título da conversa para identificar que é agendada
      const conversation = await db.ConversationModel.findOne({ id: conversationId });
      if (conversation) {
        conversation.title = `🕒 [Cron] ${job.name}`;
        await conversation.save();
      }

      // 3. Atualiza informações da cron no DB (última execução)
      await db.CronJobModel.updateOne(
        { id: job.id },
        { $set: { lastRun: new Date() } }
      );

      // Notifica o frontend de que o processamento começou
      if (win) {
        win.webContents.send('workspace:updated');
        win.webContents.send('cron:status', { jobId: job.id, status: 'running', conversationId });
      }

      // 4. Executa a inteligência artificial com suporte completo a ferramentas
      const response = await modelManager.handleChat(job.modelId, [{ role: 'user', content: job.prompt }], undefined, `Cron: ${job.name}`);

      // 5. Salva a resposta do assistente
      await db.saveMessage(conversationId, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }, job.modelId);

      // --- Encadeamento de Agentes e Menções para Cron ---
      try {
        let mentionText = response;
        let currentModelId = job.modelId;
        const mentionHistory = [
          { role: 'user', content: job.prompt },
          { role: 'assistant', content: response }
        ];

        const allAgents = await agentDb.getAgents();
        const executedAgentIds = new Set<string>();

        // Fila inicial baseada nos agentIds associados à cron
        const queue: any[] = [];
        if (job.agentIds && Array.isArray(job.agentIds)) {
          for (const aId of job.agentIds) {
            const ag = allAgents.find(a => a.id === aId);
            if (ag) {
              queue.push(ag);
            }
          }
        }

        // Executa primeiro os agentes definidos na fila
        for (const agent of queue) {
          console.log(`⏰ [CronManager] Executando agente associado: ${agent.name}...`);
          executedAgentIds.add(agent.id);

          // Salva pergunta invisível de intermediação
          const tag = `@${agent.name.replace(/\s+/g, '')}`;
          const intermediateMsg = {
            role: 'user',
            content: `${tag} dê sua opinião sobre o código e discussão acima.`,
            isInvisible: true,
            timestamp: new Date()
          };
          await db.saveMessage(conversationId, intermediateMsg, currentModelId);
          mentionHistory.push(intermediateMsg as any);

          // Prepara contexto para o agente
          const agentSystemContent = `${agent.systemPrompt}\n\nVocê é o agente "${agent.name}" com o papel de "${agent.role}". Você foi acionado via cron e deve opinar sobre a discussão acima.`;
          const agentHistory = [
            { role: 'system', content: agentSystemContent },
            ...mentionHistory
          ];

          // Roda chat do agente
          const agentResponse = await modelManager.handleAgentDirectChat(
            agent.modelId,
            agentHistory as any,
            undefined,
            `Cron Agente: ${agent.name}`
          );

          // Salva resposta do agente
          await db.saveMessage(conversationId, {
            role: 'assistant',
            content: agentResponse,
            senderName: agent.name,
            senderEmoji: agent.emoji,
            senderColor: agent.color,
            timestamp: new Date()
          }, agent.modelId);

          mentionText = agentResponse;
          currentModelId = agent.modelId;
          mentionHistory.push({ role: 'assistant', content: agentResponse } as any);
        }

        // Depois, executa fallback dinâmico de menções no texto se houver (max 3 menções dinâmicas)
        let maxMentions = 3;
        while (maxMentions > 0) {
          let matchedAgent: any = null;
          for (const agent of allAgents) {
            // Evita re-executar agentes já executados se for menção duplicada para evitar loops
            if (executedAgentIds.has(agent.id)) continue;

            const tag = `@${agent.name.replace(/\s+/g, '')}`.toLowerCase();
            if (mentionText.toLowerCase().includes(tag)) {
              matchedAgent = agent;
              break;
            }
          }

          if (!matchedAgent) break;

          console.log(`⏰ [CronManager] Agente ${matchedAgent.name} mencionado no texto. Executando resposta dele...`);
          executedAgentIds.add(matchedAgent.id);

          const tag = `@${matchedAgent.name.replace(/\s+/g, '')}`;
          const intermediateMsg = {
            role: 'user',
            content: `${tag} dê sua opinião sobre o código e discussão acima.`,
            isInvisible: true,
            timestamp: new Date()
          };
          await db.saveMessage(conversationId, intermediateMsg, currentModelId);
          mentionHistory.push(intermediateMsg as any);

          const agentSystemContent = `${matchedAgent.systemPrompt}\n\nVocê é o agente "${matchedAgent.name}" com o papel de "${matchedAgent.role}". Você foi mencionado via cron e deve opinar sobre a discussão acima.`;
          const agentHistory = [
            { role: 'system', content: agentSystemContent },
            ...mentionHistory
          ];

          const agentResponse = await modelManager.handleAgentDirectChat(
            matchedAgent.modelId,
            agentHistory as any,
            undefined,
            `Cron Menção: ${matchedAgent.name}`
          );

          await db.saveMessage(conversationId, {
            role: 'assistant',
            content: agentResponse,
            senderName: matchedAgent.name,
            senderEmoji: matchedAgent.emoji,
            senderColor: matchedAgent.color,
            timestamp: new Date()
          }, matchedAgent.modelId);

          mentionText = agentResponse;
          currentModelId = matchedAgent.modelId;
          mentionHistory.push({ role: 'assistant', content: agentResponse } as any);
          maxMentions--;
        }
      } catch (mErr) {
        console.error('❌ [CronManager] Erro no encadeamento de agentes/menções:', mErr);
      }

      console.log(`✅ [CronManager] Tarefa "${job.name}" concluída com sucesso!`);

      if (win) {
        win.webContents.send('workspace:updated');
        win.webContents.send('cron:status', { jobId: job.id, status: 'success', conversationId });
      }

      return conversationId;
    } catch (error: any) {
      console.error(`❌ [CronManager] Erro ao executar tarefa "${job.name}":`, error);
      
      // Salva mensagem de erro para que o usuário não fique no escuro
      await db.saveMessage(conversationId, {
        role: 'assistant',
        content: `❌ Falha crítica ao executar a tarefa agendada: ${error.message}`,
        timestamp: new Date()
      }, job.modelId);

      if (win) {
        win.webContents.send('workspace:updated');
        win.webContents.send('cron:status', { jobId: job.id, status: 'error', error: error.message, conversationId });
      }

      throw error;
    } finally {
      this.runningJobs.delete(job.id);
    }
  }
}

export const cronManager = new CronManager();
