import * as fs from '../utils/fs';
import { BrowserWindow } from 'electron';
import { getRoots } from '../utils/fs';

export async function executeAgentTool(name: string, args: any, signal?: AbortSignal): Promise<string> {
  const mcpManager = (global as any).mcpManager;
  if (signal) {
    void signal.aborted;
  }
  
  try {
    switch (name) {
      case 'writeFile':
        if (!args.path || args.content === undefined) return 'Erro: writeFile requer "path" e "content".';
        return await fs.writeProjectFile(args.path, args.content);
        
      case 'readFile':
        if (!args.path) return 'Erro: readFile requer "path".';
        if (/\.\w{1,5}[\\/]/.test(args.path) && !/node_modules|\.git|\.agent/.test(args.path)) return `Erro: O caminho "${args.path}" parece inválido.`;
        return await fs.readProjectFile(args.path);
        
      case 'listFiles':
        return JSON.stringify(await fs.listProjectFiles(args.path || '.'));
        
      case 'deleteFile':
        if (!args.path) return 'Erro: deleteFile requer "path".';
        await fs.deleteProjectFile(args.path);
        return 'Arquivo deletado com sucesso.';
        
      case 'getWorkspaceStructure':
        return JSON.stringify(await fs.getRecursiveTree());
        
      case 'runTerminalCommand':
        if (!args.command) return 'Erro: runTerminalCommand requer "command".';
        return `Comando [${args.command}] sugerido ao usuário no painel de atividades.`;
        
      case 'executeOSCommand':
        if (!args.command) return 'Erro: executeOSCommand requer "command".';
        return new Promise((r) => {
          require('child_process').exec(args.command, (err: any, out: string, src: string) => {
            r(err ? `Falha no comando OS: ${err.message}\nStderr: ${src}` : `Sucesso.\nSaída: ${out || '(sem saída)'}`);
          });
        });
      
      case 'getWorkspaceInfo': {
        const repoPaths = getRoots();
        const { getGitRemoteInfo } = await import('../utils/gitHandler');
        
        const repos = await Promise.all(repoPaths.map(async (path) => {
          const remote = await getGitRemoteInfo(path);
          return {
            name: path.split(/[\\/]/).pop(),
            path: path,
            remote: remote ? `${remote.workspace}/${remote.repo}` : 'Local only'
          };
        }));
        
        return JSON.stringify({
          activeRepos: repos,
          total: repos.length,
          systemRoot: process.cwd()
        }, null, 2);
      }

      case 'sendDiscordMessage': {
        if (!args.message) return 'Erro: sendDiscordMessage requer "message".';
        const { sendDiscordMessage } = await import('../utils/discordHandler');
        const result = await sendDiscordMessage(args.message, args.channelId, args.token, args.filePath);
        return result.success ? 'Mensagem enviada com sucesso para o Discord. 🚀' : `Erro: ${result.error}`;
      }

      case 'getDiscordMentionId': {
        const mentions: Record<string, string> = {};

        try {
          const fsNode = await import('fs');
          const pathNode = await import('path');
          const configPath = pathNode.default.join(process.cwd(), 'discord-mentions.json');
          if (fsNode.default.existsSync(configPath)) {
            const parsed = JSON.parse(fsNode.default.readFileSync(configPath, 'utf8'));
            Object.assign(mentions, parsed);
          }
        } catch { /* silencioso */ }

        try {
          const { default: Store } = await import('electron-store');
          const localStore = new Store(
            process.versions.electron 
              ? undefined 
              : ({ projectName: 'wilkor-os' } as any)
          );
          const token = (localStore.get('discordBotToken') as string || '').trim();
          const channelId = (localStore.get('discordChannelId') as string || '').trim();
          if (token && channelId) {
            const { resolveDynamicMembers } = await import('../utils/discordMemberResolver');
            const channelIds = channelId.split(',').map(id => id.trim()).filter(id => id.length > 0 && /^\d+$/.test(id));
            await resolveDynamicMembers(channelIds, token, mentions);
          }
        } catch { /* silencioso */ }

        const nameFilter = args.name?.toLowerCase().replace('@', '');
        if (nameFilter) {
          const id = mentions[nameFilter];
          if (id) {
            return JSON.stringify({ alias: nameFilter, discordId: id, usage: `Para enviar DM, use channelId: "${nameFilter}"` });
          }
          return `Apelido "${nameFilter}" não encontrado. Disponíveis: ${Object.keys(mentions).join(', ')}`;
        }

        return JSON.stringify({
          availableAliases: Object.keys(mentions),
          map: mentions,
          usage: 'Passe um dos apelidos diretamente no channelId do sendDiscordMessage. Ex: channelId="wilkor"'
        }, null, 2);
      }

      case 'getDiscordChannelInfo': {
        try {
          const { default: Store } = await import('electron-store');
          const localStore = new Store(
            process.versions.electron 
              ? undefined 
              : ({ projectName: 'wilkor-os' } as any)
          );
          const activeToken = (args.token || localStore.get('discordBotToken') as string || '').trim();
          const channelId = (args.channelId || localStore.get('discordChannelId') as string || '').trim();
          if (!activeToken) return 'Erro: Discord Bot Token não configurado.';
          if (!channelId) return 'Erro: Discord Channel ID não configurado.';

          const { fetchDiscordChannelAndGuildInfo } = await import('../utils/discordInfoHelper');
          const result = await fetchDiscordChannelAndGuildInfo(channelId, activeToken);
          return JSON.stringify(result, null, 2);

        } catch (e: any) {
          return `Erro ao buscar informações do Discord: ${e.response?.data?.message || e.message}`;
        }
      }

      case 'createImage': {
        if (!args.description) return 'Erro: createImage requer o parâmetro "description".';
        const { generateImage } = await import('../utils/imageGenerator');
        const res = await generateImage(args.description, args.style, args.output);
        return res.success ? `Imagem gerada com sucesso e salva em: ${res.filePath}` : `Erro ao gerar imagem: ${res.error}`;
      }

      case 'generateCustomReportPDF': {
        if (!args.title || !args.sections) return 'Erro: generateCustomReportPDF requer "title" e "sections".';
        const { generateCustomReportPDF } = await import('../utils/customPdfGenerator');
        const res = await generateCustomReportPDF({ title: args.title, subtitle: args.subtitle, author: args.author, sections: args.sections });
        return JSON.stringify({ success: true, filePath: res.filePath, fileName: res.fileName }, null, 2);
      }

      case 'generateDocument': {
        if (!args.type || !args.title || args.content === undefined) return 'Erro: generateDocument requer "type", "title" e "content".';
        const { generateDocumentFile } = await import('../utils/documentGenerator');
        const res = await generateDocumentFile({ type: args.type, title: args.title, subtitle: args.subtitle, author: args.author, fileName: args.fileName, content: args.content });
        return JSON.stringify({ success: true, filePath: res.filePath, fileName: res.fileName }, null, 2);
      }

      case 'searchWeb': {
        if (!args.query) return 'Erro: searchWeb requer "query".';
        const { default: Store } = await import('electron-store');
        const localStore = new Store(
          process.versions.electron 
            ? undefined 
            : ({ projectName: 'wilkor-os' } as any)
        );

        const options = {
          tavilyKey: (localStore.get('tavilyApiKey') as string || '').trim(),
          braveKey: (localStore.get('braveSearchApiKey') as string || '').trim(),
          googleKey: (localStore.get('googleSearchApiKey') as string || '').trim(),
          googleCx: (localStore.get('googleSearchCx') as string || '').trim(),
          limit: args.limit ? parseInt(args.limit, 10) : 5
        };

        const { searchInternet } = await import('../utils/webSearch');
        const results = await searchInternet(args.query, options);

        const formatted = results.map((r, i) => `[${i + 1}] Título: ${r.title}\nURL: ${r.url}\nResumo: ${r.snippet}\n`).join('\n---\n\n');
        return formatted || 'Nenhum resultado encontrado.';
      }

      case 'installSkill': {
        const { installSkill } = await import('./skillInstaller');
        return await installSkill(args);
      }

      // Redireciona as ferramentas do Trello para o executor modular
      case 'getTrelloBoards':
      case 'getTrelloLists':
      case 'getTrelloCards':
      case 'getTrelloCardDetails':
      case 'updateTrelloCard':
      case 'addTrelloCardComment':
      case 'manageTrelloChecklist': {
        const { executeTrelloTool } = await import('./trelloToolExecutor');
        return await executeTrelloTool(name, args);
      }

      // Redireciona todas as ferramentas de Git/Bitbucket para o executor modular
      case 'getBitbucketPRs':
      case 'getBitbucketCommits':
      case 'getBitbucketCommitDetails':
      case 'addBitbucketPRComment':
      case 'addBitbucketCommitComment':
      case 'generateGitReportPDF':
      case 'getBitbucketPipelines':
      case 'getLocalGitCommits':
      case 'getCommitsByPeriod':
      case 'getLocalCommitDetails':
      case 'auditCommitCode': {
        const { executeGitTool } = await import('./gitToolExecutor');
        return await executeGitTool(name, args, signal);
      }

      // Redireciona todas as ferramentas de Cron para o executor modular
      case 'listAgents':
      case 'listCronJobs':
      case 'createCronJob':
      case 'updateCronJob':
      case 'deleteCronJob':
      case 'toggleCronJob':
      case 'runCronJob': {
        const { executeCronTool } = await import('./cronToolExecutor');
        return await executeCronTool(name, args);
      }

      default: {
        if (mcpManager) {
          const { getMcpPrefix } = await import('./managerUtils');
          const allTools = await mcpManager.getAllTools();
          
          let mcpTool: any = null;
          let realToolName = name;
          let targetServerId: any = null;

          for (const t of allTools) {
            const prefix = getMcpPrefix(t.mcpServerName);
            const exposedName = `${prefix}__${t.name}`;
            if (exposedName === name) {
              mcpTool = t;
              realToolName = t.name;
              targetServerId = t.mcpServerId;
              break;
            }
          }

          // Fallback caso a IA chame a ferramenta sem o prefixo
          if (!mcpTool) {
            mcpTool = allTools.find((t: any) => t.name === name);
            if (mcpTool) {
              realToolName = mcpTool.name;
              targetServerId = mcpTool.mcpServerId;
            }
          }

          if (mcpTool && targetServerId) {
            console.log(`🤖 [MCP] Executando ferramenta ${realToolName} em ${mcpTool.mcpServerName} (ID: ${targetServerId})`);
            const result = await mcpManager.callTool(targetServerId, realToolName, args);
            if (result && result.content) {
              return result.content.map((c: any) => c.text || c.data || JSON.stringify(c)).join('\n');
            }
            return JSON.stringify(result);
          }
        }
        return `Erro: Ferramenta "${name}" não encontrada.`;
      }
    }
  } catch (err: any) {
    console.error(`[Tool Execution] Erro ao executar ${name}:`, err);
    return `Erro ao executar ${name}: ${err.message}`;
  }
}

export function notifyFrontendOfActivity(name: string, args: any) {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;

  if (name === 'runTerminalCommand') {
    win.webContents.send('agent:newActivity', {
      type: 'command',
      data: { command: args.command, description: args.description }
    });
  } else if (name === 'writeFile') {
    win.webContents.send('agent:newActivity', {
      type: 'write_file',
      data: { path: args.path, content: args.content }
    });
    win.webContents.send('agent:fileWritten', { path: args.path, content: args.content });
  }
}
