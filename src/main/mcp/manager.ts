import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MCPServerConfig } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { connectDB } from '../utils/database';
import { MCPServerModel } from '../utils/mcpDatabase';
import { getActiveUser } from '../utils/userPermissionDatabase';
import { encryptEnvVars, decryptEnvVars } from '../utils/encryption';

interface ActiveServer {
  config: MCPServerConfig;
  client: Client;
  transport: StdioClientTransport;
}

export class MCPManager {
  private activeServers: Map<string, ActiveServer> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private pendingToolRequests: Map<string, { resolve: (approved: boolean) => void }> = new Map();

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.initializeServers();
  }

  public setWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private async initializeServers(): Promise<void> {
    await connectDB();
    const activeUser = getActiveUser();
    const filter: any = { isPreset: false, enabled: true };
    if (activeUser) {
      filter.userId = activeUser.id;
    } else {
      // Se não há usuário ativo ainda, não inicializa servidores privados
      return;
    }
    const servers = await MCPServerModel.find(filter).lean();
    for (const server of servers) {
      try {
        // Descriptografa env vars se existirem
        const serverConfig = server as any;
        if (serverConfig.encryptedEnv && activeUser) {
          serverConfig.env = decryptEnvVars(serverConfig.encryptedEnv, activeUser.id, activeUser.email);
        }
        await this.startServer(serverConfig);
      } catch (error) {
        console.error(`[MCP] Erro ao iniciar servidor ${server.name}:`, error);
      }
    }
  }

  public async reloadUserServers(): Promise<void> {
    console.log(`[MCP] Recarregando servidores MCP para nova sessão...`);
    await this.shutdown();
    await this.initializeServers();
  }

  public async listServers(): Promise<MCPServerConfig[]> {
    await connectDB();
    const activeUser = getActiveUser();
    const filter: any = { isPreset: false };
    if (activeUser) {
      filter.userId = activeUser.id;
    }
    const servers = await MCPServerModel.find(filter).lean();
    const decryptedServers = (servers as any[]).map((server) => {
      if (server.encryptedEnv && activeUser) {
        server.env = decryptEnvVars(server.encryptedEnv, activeUser.id, activeUser.email);
      }
      return server;
    });
    return decryptedServers || [];
  }

  public async addServer(config: MCPServerConfig): Promise<void> {
    await connectDB();
    const activeUser = getActiveUser();
    const userId = activeUser?.id;
    const userEmail = activeUser?.email;

    // Se já estiver na lista de servidores ativos rodando, para ele primeiro
    if (this.activeServers.has(config.id)) {
      await this.stopServer(config.id);
    }

    // 1. Salva/Atualiza o servidor ativo
    const activeData: any = { ...config, isPreset: false, userId };
    
    // Criptografa env vars se houver usuário e variáveis de ambiente
    if (activeUser && config.env && Object.keys(config.env).length > 0 && userEmail) {
      const cleanEnv: Record<string, string> = {};
      Object.entries(config.env).forEach(([k, v]) => {
        if (v !== undefined) cleanEnv[k] = v;
      });
      if (Object.keys(cleanEnv).length > 0) {
        const encryptedEnv = encryptEnvVars(cleanEnv, userId, userEmail);
        activeData.encryptedEnv = encryptedEnv;
        activeData.env = {}; // Limpa env plain text
      }
    }
    
    const query: any = { id: config.id, isPreset: false };
    if (activeUser) {
      query.userId = userId;
    }
    await MCPServerModel.findOneAndUpdate(
      query,
      activeData,
      { upsert: true, new: true }
    );

    // 2. Salva/Atualiza a cópia como preset no Marketplace
    const presetId = `preset-${userId || 'global'}-${config.name.toLowerCase().replace(/\s+/g, '-')}`;
    const presetData: any = {
      ...config,
      id: presetId,
      isPreset: true,
      enabled: false, // presets do marketplace são apenas templates
      userId
    };
    
    // Presets não armazenam env vars criptografados (são templates)
    presetData.env = {};
    presetData.encryptedEnv = undefined;
    
    const presetQuery: any = { id: presetId, isPreset: true };
    if (activeUser) {
      presetQuery.userId = userId;
    }
    await MCPServerModel.findOneAndUpdate(
      presetQuery,
      presetData,
      { upsert: true, new: true }
    );

    if (config.enabled) {
      try {
        await this.startServer(config);
      } catch (err: any) {
        throw new Error(`Salvo, mas não conectou: ${err.message}`);
      }
    }
  }

  public async removeServer(id: string): Promise<void> {
    await this.stopServer(id);
    await connectDB();
    const activeUser = getActiveUser();
    const filter: any = { id, isPreset: false };
    if (activeUser) {
      filter.userId = activeUser.id;
    }
    await MCPServerModel.deleteOne(filter);
  }

  public async toggleServer(id: string, enabled: boolean): Promise<void> {
    await connectDB();
    const activeUser = getActiveUser();
    const filter: any = { id, isPreset: false };
    if (activeUser) {
      filter.userId = activeUser.id;
    }
    await MCPServerModel.updateOne(filter, { $set: { enabled } });
    
    const serverToToggle = await MCPServerModel.findOne(filter).lean();
    if (serverToToggle) {
      const serverConfig = serverToToggle as any;
      if (serverConfig.encryptedEnv && activeUser) {
        serverConfig.env = decryptEnvVars(serverConfig.encryptedEnv, activeUser.id, activeUser.email);
      }
      if (enabled) {
        await this.startServer(serverConfig);
      } else {
        await this.stopServer(id);
      }
    }
  }

  public async listPresets(): Promise<MCPServerConfig[]> {
    await connectDB();
    const activeUser = getActiveUser();
    const filter: any = { isPreset: true };
    if (activeUser) {
      filter.$or = [{ userId: activeUser.id }, { userId: null }, { userId: { $exists: false } }];
    }
    const customPresets = await MCPServerModel.find(filter).lean();
    return (customPresets as any[]) || [];
  }

  public async savePreset(config: MCPServerConfig): Promise<void> {
    await connectDB();
    const activeUser = getActiveUser();
    const userId = activeUser?.id;
    const presetData = { ...config, isPreset: true, enabled: false, userId };
    const filter: any = { id: config.id, isPreset: true };
    if (activeUser) {
      filter.userId = userId;
    }
    await MCPServerModel.findOneAndUpdate(
      filter,
      presetData,
      { upsert: true, new: true }
    );
  }

  public async removePreset(id: string): Promise<void> {
    await connectDB();
    const activeUser = getActiveUser();
    const filter: any = { id, isPreset: true };
    if (activeUser) {
      filter.userId = activeUser.id;
    }
    await MCPServerModel.deleteOne(filter);
  }

  public async getTools(serverId: string): Promise<any[]> {
    const active = this.activeServers.get(serverId);
    if (!active) return [];
    try {
      const result = await active.client.listTools();
      return result.tools || [];
    } catch (e) {
      console.error(`[MCP] Erro ao listar ferramentas para ${serverId}:`, e);
      return [];
    }
  }

  public respondToTool(requestId: string, approved: boolean): void {
    const request = this.pendingToolRequests.get(requestId);
    if (request) {
      request.resolve(approved);
      this.pendingToolRequests.delete(requestId);
    }
  }

  public async startServer(config: MCPServerConfig): Promise<void> {
    if (this.activeServers.has(config.id)) return;

    console.log(`[MCP] Iniciando servidor: ${config.name} (${config.command})`);

    try {
      const transport = new StdioClientTransport({
        command: config.command || 'npx',
        args: config.args || [],
        env: { ...process.env, ...config.env } as any,
        // @ts-ignore - A tipagem do SDK pode variar, mas no Windows shell é crucial para npx
        shell: true 
      });

      const client = new Client({
        name: "wOs-Client",
        version: "1.0.0",
      }, {
        capabilities: {}
      });

      // Captura erros do processo filho para diagnóstico
      (transport as any).stderr?.on('data', (data: Buffer) => {
        console.error(`[MCP][${config.name} Stderr]:`, data.toString());
      });

      await client.connect(transport);
      this.activeServers.set(config.id, { config, client, transport });
      console.log(`[MCP] Servidor ${config.name} conectado com sucesso.`);
    } catch (error) {
      console.error(`[MCP] Falha ao conectar ao servidor ${config.name}:`, error);
      throw error;
    }
  }

  public async stopServer(id: string): Promise<void> {
    const active = this.activeServers.get(id);
    if (active) {
      try {
        await active.transport.close();
      } catch (e) {}
      this.activeServers.delete(id);
      console.log(`[MCP] Servidor ${active.config.name} parado.`);
    }
  }

  public async getAllTools(): Promise<any[]> {
    let allTools: any[] = [];
    for (const [id, active] of this.activeServers) {
      try {
        const result = await active.client.listTools();
        // Adiciona um prefixo ou metadados para saber qual servidor chamamos
        const toolsWithMetadata = result.tools.map(tool => ({
          ...tool,
          mcpServerId: id,
          mcpServerName: active.config.name
        }));
        allTools.push(...toolsWithMetadata);
      } catch (e) {}
    }
    return allTools;
  }

  public async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const active = this.activeServers.get(serverId);
    if (!active) throw new Error(`Servidor MCP ${serverId} não está ativo.`);

    // Verificação de Segurança (Action Consent)
    const dangerousKeywords = ['write', 'delete', 'create', 'update', 'remove', 'patch', 'post', 'put', 'execute'];
    const isDangerous = dangerousKeywords.some(k => toolName.toLowerCase().includes(k)) || 
                        dangerousKeywords.some(k => JSON.stringify(args).toLowerCase().includes(k));

    if (isDangerous && this.mainWindow) {
      const requestId = Math.random().toString(36).substring(7);
      
      this.mainWindow.webContents.send('mcp:toolRequest', {
        id: requestId,
        serverName: active.config.name,
        toolName,
        args
      });

      const approved = await new Promise<boolean>((resolve) => {
        this.pendingToolRequests.set(requestId, { resolve });
      });

      if (!approved) {
        throw new Error("Ação cancelada pelo usuário por motivos de segurança.");
      }
    }

    return await active.client.callTool({
      name: toolName,
      arguments: args
    });
  }

  public async shutdown(): Promise<void> {
    for (const id of this.activeServers.keys()) {
      await this.stopServer(id);
    }
  }
}
