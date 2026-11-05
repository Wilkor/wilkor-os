import { TOOLS } from './tools';
import { PROVIDER_MAP } from './providers';

/**
 * Retorna uma mensagem de erro apropriada para o provedor ausente ou chave não configurada.
 */
export function handleMissingProvider(modelId: string, keys: Record<string, string>): string {
  if (!PROVIDER_MAP[modelId]) return `Erro: Modelo "${modelId}" desconhecido.`;
  if (modelId.startsWith('gemini') && !keys.geminiKey) return '⚠️ Chave da API Google não configurada.';
  if ((modelId.startsWith('gpt') || modelId.startsWith('o1')) && !keys.openAIKey) return '⚠️ Chave da API OpenAI não configurada.';
  if (modelId.startsWith('claude') && !keys.anthropicKey) return '⚠️ Chave da API Anthropic não configurada.';
  return `⚠️ O modelo "${modelId}" não pôde ser inicializado.`;
}

import { MCPServerModel } from '../utils/mcpDatabase';
import { connectDB } from '../utils/database';

/**
 * Normaliza o nome do servidor MCP para ser usado de forma segura como prefixo de ferramenta na LLM.
 */
export function getMcpPrefix(serverName: string): string {
  return serverName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '_')     // substitui tudo que não for letra/número por underline
    .replace(/_+/g, '_')            // condensa múltiplos underlines
    .replace(/^_+|_+$/g, '');       // apara underlines nas pontas
}

/**
 * Obtém a lista combinada de ferramentas do sistema (Built-in + MCP).
 */
export async function getCombinedTools(messages: any[]): Promise<any[]> {
  const mcpManager = (global as any).mcpManager;
  let combinedTools = [...TOOLS];
  if (mcpManager) {
    try {
      await connectDB();
      const mcpToolsList = await mcpManager.getAllTools();
      const normalizedMcpTools = mcpToolsList.map((t: any) => {
        const prefix = getMcpPrefix(t.mcpServerName);
        const exposedName = `${prefix}__${t.name}`;
        return {
          name: exposedName,
          description: t.description || `Tool from ${t.mcpServerName}`,
          parameters: t.inputSchema || t.parameters || { type: 'object', properties: {} },
          mcpServerId: t.mcpServerId,
          mcpServerName: t.mcpServerName
        };
      });
      combinedTools = [...combinedTools, ...normalizedMcpTools];

      const mcpToolsDescription = normalizedMcpTools.map((t: any) => `- ${t.name}: ${t.description || 'Sem descrição'} (Servidor: ${t.mcpServerName})`).join('\n');
      
      // Busca todos os servidores MCP cadastrados no banco MongoDB para contextualizar a IA
      const allMcpServers = await MCPServerModel.find({}).lean();
      const activeServersInfo = allMcpServers.filter((s: any) => !s.isPreset && s.enabled);
      const inactiveServersInfo = allMcpServers.filter((s: any) => !s.isPreset && !s.enabled);
      
      let mcpContextPrompt = `\n\n### 🔌 CONFIGURAÇÃO DO PROTOCOLO MCP (Model Context Protocol):`;
      mcpContextPrompt += `\nO wOs tem integração com servidores MCP externos. Abaixo está a visão completa da configuração do usuário:`;

      if (activeServersInfo.length > 0) {
        mcpContextPrompt += `\n- **Servidores MCP Ativos e Conectados:**`;
        activeServersInfo.forEach((s: any) => {
          mcpContextPrompt += `\n  - \`${s.name}\` (ID: \`${s.id}\`, Tipo: \`${s.type}\`): ${s.description || 'Sem descrição'}. As ferramentas deste servidor estão expostas no formato prefixado: \`${getMcpPrefix(s.name)}__[nome_da_ferramenta]\`.`;
        });
      } else {
        mcpContextPrompt += `\n- Não há servidores MCP ativos no momento.`;
      }
      
      if (inactiveServersInfo.length > 0) {
        mcpContextPrompt += `\n- **Servidores MCP Desativados (Instalados, mas que o usuário optou por desativar nas configurações do wOs. Sugira ativá-los se o usuário pedir algo relacionado a eles):**`;
        inactiveServersInfo.forEach((s: any) => {
          mcpContextPrompt += `\n  - \`${s.name}\` (ID: \`${s.id}\`, Tipo: \`${s.type}\`): ${s.description || 'Sem descrição'}.`;
        });
      }

      if (normalizedMcpTools.length > 0) {
        mcpContextPrompt += `\n\n- **Ferramentas de MCP Disponíveis para você executar:**\n${mcpToolsDescription}`;
      } else {
        mcpContextPrompt += `\n\n- **Nenhuma ferramenta de MCP ativa disponível para execução imediata.**`;
      }
      
      messages[0].content += mcpContextPrompt;
    } catch (e) {
      console.error('[MCP] Erro ao obter ferramentas:', e);
    }
  }
  return combinedTools;
}

/**
 * Trunca o resultado de uma execução de ferramenta para não estourar limite de tokens.
 */
export function truncateToolResult(result: any, maxChars: number = 120000): string {
  if (result === undefined || result === null) return 'Sem resposta da ferramenta.';
  const strResult = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  if (strResult.length > maxChars) {
    return strResult.substring(0, maxChars) + `\n\n[... Conteúdo truncado pelo wOs para otimizar custos de tokens. Total original: ${strResult.length} caracteres ...]`;
  }
  return strResult;
}
