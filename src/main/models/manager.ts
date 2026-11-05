import { ModelProvider, ChatMessage } from './types';
import { PROVIDER_MAP } from './providers';
import Store from 'electron-store';
import { buildSystemPrompts } from './promptBuilder';
import { executeAgentTool, notifyFrontendOfActivity } from './toolExecutor';
import { extractToolCall } from './toolCallParser';
import { 
  handleMissingProvider, 
  getCombinedTools, 
  truncateToolResult 
} from './managerUtils';

const store = new Store();

export class ModelManager {
  private keys: Record<string, string> = {};
  private activeAbortController: AbortController | null = null;

  constructor() {
    this.refreshProviders();
  }

  public stopChat() {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
      console.log('🛑 Geração de chat interrompida pelo usuário.');
    }
  }

  public refreshProviders() {
    const getSafeKey = (name: string) => {
      const val = (store as any).get(name);
      return (typeof val === 'string' && val.trim().length > 0) ? val.trim() : '';
    };

    this.keys = {
      geminiKey:    getSafeKey('geminiKey'),
      openAIKey:    getSafeKey('openAIKey'),
      anthropicKey: getSafeKey('anthropicKey'),
    };
  }

  private getProvider(modelId: string): ModelProvider | null {
    const factory = PROVIDER_MAP[modelId];
    if (!factory) return null;
    return factory(this.keys);
  }

  async handleChat(_modelId: string, messages: ChatMessage[], onChunk?: (chunk: string) => void, taskName: string = 'Chat Principal'): Promise<string> {
    this.refreshProviders();
    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    try {
      console.log("\n>>> [wOs ModelManager] v1.4 ACTIVE - Modular & Robust JSON Tool Calls <<<");
      
      const frontendSystem = messages.find(m => m.role === 'system');
      let finalSystemPrompt = buildSystemPrompts(frontendSystem?.content, (store as any).get('systemRules'));

      const { getRoots } = await import('../utils/fs');
      const activeRoots = getRoots();
      if (activeRoots.length > 0) {
        finalSystemPrompt += `\n\n### 📁 ESTRUTURA DO PROJETO ATUAL:\nRaiz do Projeto: "${activeRoots[0]}"\nInstrução Importante: Use as ferramentas "listFiles" ou "readFile" para entrar no source code real do repositório, ler o README.md e os arquivos locais de código. Não se limite a commits. Faça uma varredura real do código fonte!`;
      }

      // Detecção inteligente de Skills para enriquecimento de contexto dinâmico
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        try {
          const { getSkillsContextForPrompt } = await import('./skillDetector');
          const skillContext = await getSkillsContextForPrompt(lastUserMsg.content);
          if (skillContext) {
            finalSystemPrompt += skillContext;
            console.log(`[SkillDetector] 🛠️ Injetadas instruções de skills relevantes no prompt.`);
          }
        } catch (err) {
          console.error('[SkillDetector] Erro ao buscar contexto de skills:', err);
        }
      }

      const nonSystemMessages = messages.filter(m => m.role !== 'system');
      const enhancedMessages: ChatMessage[] = [{ role: 'system', content: finalSystemPrompt }, ...nonSystemMessages];

      // 1. Roteamento Inteligente
      let finalModelId = 'gpt-4o-mini';
      console.log(`[Smart Routing] 🤖 Modelo selecionado: ${finalModelId}`);

      const provider = this.getProvider(finalModelId);
      if (!provider) return handleMissingProvider(finalModelId, this.keys);

      // 2. Processamento Multimodal
      const { processMultimodalAttachments } = await import('../utils/multimodalProcessor');
      await processMultimodalAttachments(enhancedMessages, finalModelId, this.keys.openAIKey);

      // 3. Coleta ferramentas (MCP + Built-in)
      const combinedTools = await getCombinedTools(enhancedMessages);

      // 4. Execução
      if (onChunk) {
        return await this.handleStreamingChat(provider, enhancedMessages, combinedTools, onChunk, signal, 0, taskName);
      } else {
        return await this.handleSyncChat(provider, enhancedMessages, combinedTools, signal, 0, taskName);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || signal.aborted) return 'Geração interrompida.';
      console.error('[ModelManager] Erro no chat:', error);
      return `Erro: ${error.message}`;
    } finally {
      this.activeAbortController = null;
    }
  }

  async handleAgentDirectChat(modelId: string, messages: ChatMessage[], onChunk?: (chunk: string) => void, taskName: string = 'Agente Autônomo'): Promise<string> {
    this.refreshProviders();
    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    try {
      console.log(`[Agent Chat] 🤖 Modelo selecionado pelo agente: ${modelId}`);

      const provider = this.getProvider(modelId);
      if (!provider) return handleMissingProvider(modelId, this.keys);

      const systemMessage = messages.find(m => m.role === 'system');
      if (systemMessage) {
        const { getRoots } = await import('../utils/fs');
        const activeRoots = getRoots();
        if (activeRoots.length > 0) {
          systemMessage.content += `\n\n### 📁 ESTRUTURA DO PROJETO ATUAL:\nRaiz do Projeto: "${activeRoots[0]}"\nInstrução Importante: Use as ferramentas "listFiles" ou "readFile" para entrar no source code real do repositório, ler o README.md e os arquivos locais de código. Não se limite a commits. Faça uma varredura real do código fonte!`;
        }
      }

      // Obter ferramentas combinadas (embutidas + MCP) para os agentes autônomos
      const tools = await getCombinedTools(messages);

      if (onChunk) {
        return await this.handleStreamingChat(provider, messages, tools, onChunk, signal, 0, taskName);
      } else {
        return await this.handleSyncChat(provider, messages, tools, signal, 0, taskName);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || signal.aborted) return 'Geração interrompida.';
      console.error('[ModelManager] Erro no chat do agente:', error);
      return `Erro: ${error.message}`;
    } finally {
      this.activeAbortController = null;
    }
  }

  private async handleStreamingChat(
    provider: ModelProvider, 
    messages: ChatMessage[], 
    tools: any[], 
    onChunk: (chunk: string) => void, 
    signal: AbortSignal,
    iteration: number = 0,
    taskName: string = 'Chat'
  ): Promise<string> {
    if (iteration >= 1000) {
      console.warn("⚠️ [ModelManager] Proteção contra loop infinito ativada (1000 iterações).");
      const warnMsg = "\n\n⚠️ **Aviso de Segurança wOs**: Proteção de recursão ativada após 1000 iterações de ferramentas para segurança de custos.";
      onChunk(warnMsg);
      return warnMsg;
    }

    let fullResponse = '';
    const startTime = Date.now();
    let success = false;
    
    try {
      // 1. Tenta usar o streaming real do provedor
      await provider.sendMessageStream(messages, (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      }, tools, signal);
      success = true;
    } catch (err: any) {
      fullResponse = err.message || 'Erro na chamada.';
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      const promptText = messages.map(m => m.content).join('\n');
      import('../utils/aiUsageLogger').then(mod => {
        mod.logAIUsage(provider.name, promptText, fullResponse, durationMs, success, taskName).catch(() => null);
      });
    }

    // 2. Se por algum motivo o streaming não retornar nada mas o sendMessage retornaria (raro, mas preventivo)
    if (!fullResponse && !signal.aborted) {
      const fallback = await provider.sendMessage(messages, tools, signal);
      if (fallback) {
        onChunk(fallback);
        fullResponse = fallback;
      }
    }

    // 3. Verificação de Tool Calls (se o streaming não tratou nativamente)
    const toolCall = extractToolCall(fullResponse);
    if (toolCall && !signal.aborted) {
      try {
        const name = toolCall.name || toolCall.functionName;
        const args = toolCall.args || toolCall.arguments;
        if (!name) {
          console.warn('⚠️ Nome da ferramenta ausente na chamada de ferramenta.');
          return fullResponse;
        }

        console.log(`🤖 [Stream][Iteração ${iteration + 1}] IA solicitou ferramenta: ${name}`);
        const toolResult = await executeAgentTool(name, args, signal);
        notifyFrontendOfActivity(name, args);

        const truncatedResult = truncateToolResult(toolResult);
        messages.push({ role: 'assistant', content: fullResponse });
        messages.push({ role: 'user', content: `RESPOSTA DA FERRAMENTA ${name}:\n${truncatedResult}` });

        // Chamada recursiva para processar a resposta da ferramenta (mantendo o streaming se possível)
        return await this.handleStreamingChat(provider, messages, tools, onChunk, signal, iteration + 1, taskName);
      } catch (e: any) {
        if (e.name === 'AbortError' || signal.aborted || e.message?.includes('abort') || e.constructor?.name?.includes('Abort')) throw e;
        console.error('[Stream] Erro ao processar tool call em stream:', e);
      }
    }

    return fullResponse;
  }

  private async handleSyncChat(
    provider: ModelProvider, 
    messages: ChatMessage[], 
    tools: any[], 
    signal: AbortSignal,
    iteration: number = 0,
    taskName: string = 'Chat'
  ): Promise<string> {
    if (iteration >= 1000) {
      console.warn("⚠️ [ModelManager] Proteção contra loop infinito ativada (1000 iterações).");
      return "⚠️ Execução interrompida pelo wOs após 1000 iterações de ferramentas para segurança de custos.";
    }

    let response = '';
    const startTime = Date.now();
    let success = false;

    try {
      response = await provider.sendMessage(messages, tools, signal);
      success = true;
    } catch (err: any) {
      response = err.message || 'Erro na chamada.';
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      const promptText = messages.map(m => m.content).join('\n');
      import('../utils/aiUsageLogger').then(mod => {
        mod.logAIUsage(provider.name, promptText, response, durationMs, success, taskName).catch(() => null);
      });
    }
    
    // Suporte recursivo a múltiplos tool calls para fluxos compostos (síncronos/cron)
    const toolCall = extractToolCall(response);
    if (toolCall && !signal.aborted) {
      try {
        const name = toolCall.name || toolCall.functionName;
        const args = toolCall.args || toolCall.arguments;
        if (!name) {
          console.warn('⚠️ Nome da ferramenta ausente na chamada de ferramenta.');
          return response;
        }

        console.log(`🤖 [Sync][Iteração ${iteration + 1}] IA solicitou ferramenta: ${name}`);
        const toolResult = await executeAgentTool(name, args, signal);
        notifyFrontendOfActivity(name, args);

        const truncatedResult = truncateToolResult(toolResult);
        messages.push({ role: 'assistant', content: response });
        messages.push({ 
          role: 'user', 
          content: `RESPOSTA DA FERRAMENTA ${name}:\n${truncatedResult}` 
        });

        // Chamada recursiva passando as ferramentas para permitir o próximo passo do fluxo composto!
        return await this.handleSyncChat(provider, messages, tools, signal, iteration + 1, taskName);
      } catch (e: any) {
        if (e.name === 'AbortError' || signal.aborted || e.message?.includes('abort') || e.constructor?.name?.includes('Abort')) throw e;
        console.error('[Sync] Erro ao processar tool call síncrono:', e);
      }
    }
    return response;
  }
}

export const modelManager = new ModelManager();
