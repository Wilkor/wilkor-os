import * as db from '../utils/database';
import { cronManager } from '../utils/cronManager';
import { randomUUID } from 'crypto';
import { getAgents } from '../utils/agentDatabase';

export async function executeCronTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'listAgents': {
        const agents = await getAgents();
        if (agents.length === 0) {
          return 'Nenhum agente encontrado no sistema.';
        }

        const formatted = agents.map(agent => {
          return `- ${agent.emoji} **${agent.name}** (ID: ${agent.id})\n  Papel: ${agent.role}\n  Modelo: ${agent.modelId}`;
        }).join('\n\n');

        return `🤖 **Agentes Disponíveis (${agents.length}):**\n\n${formatted}`;
      }

      case 'listCronJobs': {
        const jobs = await db.getCronJobs();
        if (jobs.length === 0) {
          return 'Nenhuma tarefa agendada encontrada.';
        }
        
        const formatted = jobs.map(job => {
          const status = job.enabled ? '✅ Ativo' : '❌ Inativo';
          const lastRun = job.lastRun ? new Date(job.lastRun).toLocaleString('pt-BR') : 'Nunca executado';
          return `- **${job.name}** (ID: ${job.id})
  Status: ${status}
  Expressão Cron: ${job.cronExpr}
  Modelo: ${job.modelId || 'padrão'}
  Última execução: ${lastRun}
  Prompt: ${job.prompt.substring(0, 100)}${job.prompt.length > 100 ? '...' : ''}`;
        }).join('\n\n');
        
        return `📋 **Tarefas Agendadas (${jobs.length}):**\n\n${formatted}`;
      }

      case 'createCronJob': {
        if (!args.name || !args.cronExpr || !args.prompt) {
          return 'Erro: createCronJob requer "name", "cronExpr" e "prompt".';
        }

        // Valida e lista agentes se fornecidos
        let validatedAgentIds: string[] = [];
        if (args.agentIds && args.agentIds.length > 0) {
          const agents = await getAgents();
          const validAgentIds = agents.map(a => a.id);
          const invalidIds = args.agentIds.filter(id => !validAgentIds.includes(id));

          if (invalidIds.length > 0) {
            const agentList = agents.map(a => `- ${a.emoji} **${a.name}** (ID: ${a.id}) - ${a.role}`).join('\n');
            return `❌ Alguns IDs de agentes não foram encontrados: ${invalidIds.join(', ')}\n\n📋 **Agentes disponíveis:**\n\n${agentList}\n\nPor favor, forneça os IDs corretos dos agentes que deseja associar à tarefa.`;
          }

          validatedAgentIds = args.agentIds;
        }

        const newJob = {
          id: randomUUID(),
          name: args.name,
          cronExpr: args.cronExpr,
          prompt: args.prompt,
          modelId: args.modelId || null,
          enabled: args.enabled !== undefined ? args.enabled : true,
          agentIds: validatedAgentIds,
          createdAt: new Date(),
          lastRun: null
        };

        await db.saveCronJob(newJob);
        const agentInfo = validatedAgentIds.length > 0 ? `\nAgentes associados: ${validatedAgentIds.length}` : '';
        return `✅ Tarefa agendada "${args.name}" criada com sucesso!\n\nExpressão: ${args.cronExpr}\nStatus: ${newJob.enabled ? 'Ativo' : 'Inativo'}\nID: ${newJob.id}${agentInfo}`;
      }

      case 'updateCronJob': {
        if (!args.id) {
          return 'Erro: updateCronJob requer "id".';
        }

        const jobs = await db.getCronJobs();
        const job = jobs.find(j => j.id === args.id);

        if (!job) {
          return `Erro: Tarefa agendada com ID "${args.id}" não encontrada.`;
        }

        // Valida e lista agentes se fornecidos
        let validatedAgentIds: string[] = job.agentIds || [];
        if (args.agentIds !== undefined) {
          const agents = await getAgents();
          const validAgentIds = agents.map(a => a.id);
          const invalidIds = args.agentIds.filter(id => !validAgentIds.includes(id));

          if (invalidIds.length > 0) {
            const agentList = agents.map(a => `- ${a.emoji} **${a.name}** (ID: ${a.id}) - ${a.role}`).join('\n');
            return `❌ Alguns IDs de agentes não foram encontrados: ${invalidIds.join(', ')}\n\n📋 **Agentes disponíveis:**\n\n${agentList}\n\nPor favor, forneça os IDs corretos dos agentes que deseja associar à tarefa.`;
          }

          validatedAgentIds = args.agentIds;
        }

        const updatedJob = {
          ...job,
          name: args.name || job.name,
          cronExpr: args.cronExpr || job.cronExpr,
          prompt: args.prompt || job.prompt,
          modelId: args.modelId !== undefined ? args.modelId : job.modelId,
          enabled: args.enabled !== undefined ? args.enabled : job.enabled,
          agentIds: validatedAgentIds
        };

        await db.saveCronJob(updatedJob);
        const agentInfo = validatedAgentIds.length > 0 ? `\nAgentes associados: ${validatedAgentIds.length}` : '\nNenhum agente associado';
        return `✅ Tarefa agendada "${updatedJob.name}" atualizada com sucesso!\n\nExpressão: ${updatedJob.cronExpr}\nStatus: ${updatedJob.enabled ? 'Ativo' : 'Inativo'}${agentInfo}`;
      }

      case 'deleteCronJob': {
        if (!args.id) {
          return 'Erro: deleteCronJob requer "id".';
        }

        const jobs = await db.getCronJobs();
        const job = jobs.find(j => j.id === args.id);
        
        if (!job) {
          return `Erro: Tarefa agendada com ID "${args.id}" não encontrada.`;
        }

        await db.deleteCronJob(args.id);
        return `✅ Tarefa agendada "${job.name}" removida com sucesso.`;
      }

      case 'toggleCronJob': {
        if (!args.id || args.enabled === undefined) {
          return 'Erro: toggleCronJob requer "id" e "enabled".';
        }

        const jobs = await db.getCronJobs();
        const job = jobs.find(j => j.id === args.id);
        
        if (!job) {
          return `Erro: Tarefa agendada com ID "${args.id}" não encontrada.`;
        }

        await db.toggleCronJob(args.id, args.enabled);
        const status = args.enabled ? 'ativada' : 'desativada';
        return `✅ Tarefa agendada "${job.name}" ${status} com sucesso.`;
      }

      case 'runCronJob': {
        if (!args.id) {
          return 'Erro: runCronJob requer "id".';
        }

        const jobs = await db.getCronJobs();
        const job = jobs.find(j => j.id === args.id);
        
        if (!job) {
          return `Erro: Tarefa agendada com ID "${args.id}" não encontrada.`;
        }

        // Executa a tarefa em background
        cronManager.executeJob(job as any).catch(err => {
          console.error(`[Cron Tool Executor] Erro na execução da cron "${job.name}":`, err);
        });

        return `✅ Execução da tarefa agendada "${job.name}" iniciada em background!\n\nVocê pode acompanhar o resultado na conversa com título "🕒 [Cron] ${job.name}".`;
      }

      default:
        return `Erro: Ferramenta de cron "${name}" não reconhecida.`;
    }
  } catch (error: any) {
    console.error(`[Cron Tool Executor] Erro ao executar ${name}:`, error);
    return `Erro ao executar ${name}: ${error.message}`;
  }
}
