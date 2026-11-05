/**
 * Utilitário para realizar o parse robusto de chamadas de ferramenta (tool calls) 
 * a partir das respostas do LLM (stream ou síncronas).
 */

export interface ToolCallPayload {
  type?: string;
  name?: string;
  functionName?: string;
  args?: any;
  arguments?: any;
}

/**
 * Tenta extrair uma chamada de ferramenta válida em formato JSON de uma string.
 * É tolerante a caracteres adicionais ou ruídos inseridos após a estrutura do JSON.
 *
 * @param content Conteúdo bruto retornado pela IA.
 * @returns O objeto JSON da chamada de ferramenta ou null caso não seja encontrado.
 */
export function extractToolCall(content: string): ToolCallPayload | null {
  if (!content) return null;
  const trimmed = content.trim();

  // Se não contiver indícios de chamada de ferramenta, evita o processamento
  if (!trimmed.includes('tool_call') && !trimmed.includes('functionName')) {
    return null;
  }

  // 1. Tenta o parse direto do conteúdo
  try {
    const parsed = JSON.parse(trimmed);
    if (isValidToolCall(parsed)) {
      return parsed;
    }
  } catch (e) {
    // Falhou, tentaremos extrair por balanceamento de chaves
  }

  // 2. Extração baseada em chaves balanceadas { ... }
  const startIdx = trimmed.indexOf('{');
  if (startIdx === -1) return null;

  let depth = 0;
  for (let i = startIdx; i < trimmed.length; i++) {
    if (trimmed[i] === '{') {
      depth++;
    } else if (trimmed[i] === '}') {
      depth--;
      if (depth === 0) {
        const jsonCandidate = trimmed.substring(startIdx, i + 1);
        try {
          const parsed = JSON.parse(jsonCandidate);
          if (isValidToolCall(parsed)) {
            return parsed;
          }
        } catch (e) {
          // Ignora e continua o loop caso seja um fechamento de bloco interno inválido
        }
      }
    }
  }

  return null;
}

/**
 * Valida se um objeto JSON possui estrutura compatível com uma chamada de ferramenta.
 */
function isValidToolCall(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Estruturas válidas geradas por nossos providers:
  // - { type: 'tool_call', name: '...', args: {...} }
  // - { tool_call: ... }
  // - { name: '...', args: {...} }
  // - { functionName: '...', arguments: {...} }
  
  const hasName = typeof obj.name === 'string' || typeof obj.functionName === 'string';
  const hasTypeOrToolCall = obj.type === 'tool_call' || obj.tool_call !== undefined;
  
  return hasName || hasTypeOrToolCall;
}
