import { BrowserWindow } from 'electron';
import { getAgentSession, saveAgentSession } from '../utils/agentDatabase';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
import { getRoots } from '../utils/fs';
import { IAgentMessage } from '../../shared/types';
import { resolveAgyPath } from '../handlers/agyHandler';


export async function executeAgentTaskTool(name: string, args: any, sessionId: string): Promise<string> {
  const session = await getAgentSession(sessionId);
  if (!session) return 'Erro: Sessão não encontrada no banco de dados.';

  if (!session.tasks) session.tasks = [];

  switch (name) {
    case 'createAgentTask': {
      const newTask = {
        id: Math.random().toString(36).substring(2, 11),
        title: args.title,
        assignedTo: args.assignedTo,
        category: args.category as 'front' | 'back' | 'database' | 'security',
        status: 'pending' as 'pending',
        createdBy: args.createdBy || 'Sistema',
        createdAt: new Date()
      };
      session.tasks.push(newTask);
      await saveAgentSession(session);
      
      const targetRoot = session.repoPath || getRoots()[0];
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: session.tasks });

      // Filtro inteligente para rodar a CLI do Antigravity em background
      const lowercaseTitle = args.title.toLowerCase();
      const isAnalysisTask = lowercaseTitle.includes('analisar') || 
                             lowercaseTitle.includes('mapear') || 
                             lowercaseTitle.includes('leitura') || 
                             lowercaseTitle.includes('varrer') || 
                             lowercaseTitle.includes('explorar') ||
                             lowercaseTitle.includes('verificar') ||
                             lowercaseTitle.includes('scan');

      if (!isAnalysisTask && targetRoot) {
        runTaskPlanningPlan(sessionId, newTask.id, targetRoot).catch(err => {
          console.error('[Task Planning] Erro ao disparar planejamento em background:', err);
        });
      }

      return `Tarefa "${args.title}" criada para "${args.assignedTo}" com ID ${newTask.id}.`;
    }

    case 'completeAgentTask': {
      const task = session.tasks.find((t: any) => t.id === args.taskId);
      if (!task) return `Erro: Tarefa ${args.taskId} não encontrada na discussão atual.`;
      task.status = 'completed';
      await saveAgentSession(session);
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: session.tasks });
      return `Tarefa "${task.title}" marcada como concluída.`;
    }

    case 'listAgentTasks': {
      return JSON.stringify(session.tasks, null, 2);
    }

    default:
      return `Erro: Ferramenta de tarefa "${name}" não reconhecida.`;
  }
}

export async function runTaskExecutionPlan(sessionId: string, taskId: string, repoPath?: string): Promise<void> {
  const currentSession = await getAgentSession(sessionId);
  if (!currentSession) return;

  const task = currentSession.tasks?.find((t: any) => t.id === taskId);
  if (!task) return;

  const targetRoot = repoPath || getRoots()[0];
  if (!targetRoot) {
    console.error('[Antigravity CLI Task Execution] Nenhuma raiz de projeto encontrada para executar.');
    return;
  }

  // Notifica no chat que a execução física começou
  const startMsg: IAgentMessage = {
    id: randomUUID(),
    agentId: 'antigravity-cli',
    senderName: 'Antigravity CLI',
    senderRole: 'Executor de Plano',
    senderEmoji: '⚙️',
    senderColor: '#FF9800',
    content: `[Antigravity CLI] 🚀 **Plano Aprovado!** Iniciando a execução das alterações de código físicas no repositório para a tarefa **"${task.title}"**...`,
    timestamp: new Date()
  };
  currentSession.messages.push(startMsg);
  await saveAgentSession(currentSession);
  BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-message-done', { sessionId, message: startMsg });

  const agyPath = resolveAgyPath();
  const prompt = `No repositório localizado em ${targetRoot}, realize a execução das modificações físicas de código conforme planejado no arquivo implementation_plan.md para a tarefa: ${task.title}. Diretrizes importantes: Leia o plano em implementation_plan.md e os arquivos existentes antes de modificá-los. Se o arquivo já existe, NÃO o reescreva inteiramente do zero, use edições pontuais/incrementais (como replace_file_content ou multi_replace_file_content) alterando apenas o que for necessário e preservando toda a lógica original intacta. Crie novos arquivos somente se for estritamente planejado no plano. Modifique os arquivos fisicamente no disco.`;
  const safePrompt = prompt.replace(/"/g, '\\"');
  const command = `"${agyPath}" --prompt "${safePrompt}" --dangerously-skip-permissions`;

  console.log(`[Antigravity CLI Task Execution] 🚀 Rodando comando de execução: ${command}`);

  exec(command, { cwd: targetRoot }, async (err, stdout, stderr) => {
    const sessionToUpdate = await getAgentSession(sessionId);
    if (!sessionToUpdate) return;

    const taskToUpdate = sessionToUpdate.tasks?.find((t: any) => t.id === taskId);
    if (!taskToUpdate) return;

    if (err) {
      console.error(`[Antigravity CLI Task Execution] ❌ Erro ao executar plano da tarefa "${taskToUpdate.title}":`, stderr || err.message);
      
      // Restaura a descrição e volta status para pending em caso de erro
      taskToUpdate.description = taskToUpdate.description?.replace('[PLANO_APROVADO_EXECUTANDO]', '[PLANO_GERADO]') || '[PLANO_GERADO]';
      taskToUpdate.status = 'pending';
      
      const errorMsg: IAgentMessage = {
        id: randomUUID(),
        agentId: 'antigravity-cli',
        senderName: 'Antigravity CLI',
        senderRole: 'Erro na Execução',
        senderEmoji: '❌',
        senderColor: '#FF5252',
        content: `[Antigravity CLI] Erro ao executar o plano da tarefa "${taskToUpdate.title}":\n\`\`\`\n${stderr || err.message}\n\`\`\``,
        timestamp: new Date()
      };
      sessionToUpdate.messages.push(errorMsg);
      await saveAgentSession(sessionToUpdate);
      
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: sessionToUpdate.tasks });
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-message-done', { sessionId, message: errorMsg });
    } else {
      console.log(`[Antigravity CLI Task Execution] ✅ Execução física concluída com sucesso via CLI!`);
      taskToUpdate.status = 'completed';
      taskToUpdate.description = `[PLANO_EXECUTADO]\n` + (taskToUpdate.description?.replace('[PLANO_APROVADO_EXECUTANDO]\n', '') || '');
      
      const successMsg: IAgentMessage = {
        id: randomUUID(),
        agentId: 'antigravity-cli',
        senderName: 'Antigravity CLI',
        senderRole: 'Execução Concluída',
        senderEmoji: '✅',
        senderColor: '#00BFA5',
        content: `[Antigravity CLI] Concluiu com sucesso a execução física do plano para a tarefa: **"${taskToUpdate.title}"**!\n\n**Logs de Execução:**\n\`\`\`\n${stdout.trim()}\n\`\`\``,
        timestamp: new Date()
      };
      sessionToUpdate.messages.push(successMsg);
      await saveAgentSession(sessionToUpdate);
      
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: sessionToUpdate.tasks });
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-message-done', { sessionId, message: successMsg });
    }
  });
}

export async function runTaskPlanningPlan(sessionId: string, taskId: string, repoPath?: string): Promise<void> {
  const currentSession = await getAgentSession(sessionId);
  if (!currentSession) return;

  const task = currentSession.tasks?.find((t: any) => t.id === taskId);
  if (!task) return;

  const targetRoot = repoPath || currentSession.repoPath || getRoots()[0];
  if (!targetRoot) {
    console.error('[Antigravity CLI Task Planning] Nenhuma raiz de projeto ativa encontrada para planejar.');
    return;
  }

  const agyPath = resolveAgyPath();
  const prompt = `No repositório localizado em ${targetRoot}, analise a tarefa de desenvolvimento/segurança: "${task.title}". ATENÇÃO: Você está na fase de planejamento. NÃO faça nenhuma modificação física em arquivos de código de produção e NÃO crie arquivos de código. Crie apenas o arquivo 'implementation_plan.md' na raiz do repositório detalhando o plano de implementação completo (quais arquivos serão criados, modificados ou deletados, e as alterações específicas). Responda com o plano de implementação detalhado em markdown.`;
  const safePrompt = prompt.replace(/"/g, '\\"');
  const command = `"${agyPath}" --prompt "${safePrompt}" --dangerously-skip-permissions`;
  
  console.log(`[Antigravity CLI Task Automation] 🚀 Iniciando fase de PLANEJAMENTO em background para a tarefa "${task.title}" (ID: ${task.id}) no repositório: ${targetRoot}`);
  
  exec(command, { cwd: targetRoot }, async (err, stdout, stderr) => {
    const sessionToUpdate = await getAgentSession(sessionId);
    if (!sessionToUpdate) return;
    
    const taskToUpdate = sessionToUpdate.tasks?.find((t: any) => t.id === taskId);
    if (!taskToUpdate) return;
    
    if (err) {
      console.error(`[Antigravity CLI Task Automation] ❌ Erro ao planejar tarefa "${taskToUpdate.title}":`, stderr || err.message);
      const errorMsg: IAgentMessage = {
        id: randomUUID(),
        agentId: 'antigravity-cli',
        senderName: 'Antigravity CLI',
        senderRole: 'Erro de Planejamento',
        senderEmoji: '❌',
        senderColor: '#FF5252',
        content: `[Antigravity CLI] Erro ao tentar planejar a tarefa "${taskToUpdate.title}":\n\`\`\`\n${stderr || err.message}\n\`\`\``,
        timestamp: new Date()
      };
      sessionToUpdate.messages.push(errorMsg);
      await saveAgentSession(sessionToUpdate);
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-message-done', { sessionId, message: errorMsg });
    } else {
      console.log(`[Antigravity CLI Task Automation] ✅ Plano de implementação gerado com sucesso via CLI para a tarefa "${taskToUpdate.title}"`);
      
      let planContent = '';
      try {
        const fsNode = await import('fs/promises');
        const pathNode = await import('path');
        const planPath = pathNode.default.join(targetRoot, 'implementation_plan.md');
        planContent = await fsNode.default.readFile(planPath, 'utf8');
      } catch {
        planContent = stdout.trim() || 'Plano de implementação gerado na raiz do repositório.';
      }

      taskToUpdate.description = `[PLANO_GERADO]\n${planContent}`;
      taskToUpdate.status = 'pending';
      await saveAgentSession(sessionToUpdate);
      
      const successMsg: IAgentMessage = {
        id: randomUUID(),
        agentId: 'antigravity-cli',
        senderName: 'Antigravity CLI',
        senderRole: 'Planejamento de Tarefa',
        senderEmoji: '📋',
        senderColor: '#3F51B5',
        content: `[Antigravity CLI] O plano de implementação para a tarefa **"${taskToUpdate.title}"** foi gerado com sucesso!\n\n**Por favor, revise o plano de implantação em \`implementation_plan.md\` e clique no checkbox da tarefa no monitor lateral para aprovar e iniciar a execução física.**\n\n### Plano de Implementação Proposto:\n\n${planContent}`,
        timestamp: new Date()
      };
      sessionToUpdate.messages.push(successMsg);
      await saveAgentSession(sessionToUpdate);
      
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-tasks-updated', { sessionId, tasks: sessionToUpdate.tasks });
      BrowserWindow.getAllWindows()[0]?.webContents.send('agents:session-message-done', { sessionId, message: successMsg });
    }
  });
}
