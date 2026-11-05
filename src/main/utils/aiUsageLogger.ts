import { saveAIUsage } from './database';
import { randomUUID } from 'crypto';

/**
 * Registra o consumo de recursos de IA calculando tokens estimados e custos com base no modelo.
 */
export async function logAIUsage(
  modelId: string,
  promptText: string,
  responseText: string,
  durationMs: number,
  success: boolean,
  taskName: string
) {
  try {
    let tokensInput = 0;
    let tokensOutput = 0;
    let costUSD = 0;

    if (modelId.toLowerCase().includes('dall-e')) {
      costUSD = 0.040; // Custo oficial DALL-E 3
      tokensInput = 0;
      tokensOutput = 0;
    } else if (modelId.toLowerCase().includes('whisper')) {
      // No whisper, promptText representará a duração em segundos em formato string
      const seconds = parseFloat(promptText) || 0;
      costUSD = seconds * 0.0001; // $0.006 por minuto ($0.0001 por segundo)
      tokensInput = Math.ceil(seconds);
      tokensOutput = Math.ceil(responseText.length / 3.8);
    } else {
      // Estimativa rápida de tokens baseada em contagem de caracteres (1 token ~ 3.8 caracteres)
      tokensInput = Math.ceil(promptText.length / 3.8);
      tokensOutput = Math.ceil(responseText.length / 3.8);

      // Tabela de taxas oficiais por 1 Milhão de Tokens (USD)
      const costs: Record<string, { input: number; output: number }> = {
        'gpt-4o-mini': { input: 0.15, output: 0.60 },
        'gpt-4o': { input: 2.50, output: 10.00 },
        'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
        'claude-3-5-haiku': { input: 0.80, output: 4.00 },
        'claude-3-haiku': { input: 0.25, output: 1.25 },
        'gemini-1.5-flash': { input: 0.075, output: 0.30 },
        'gemini-1.5-pro': { input: 1.25, output: 5.00 },
        'gemini-2.0-flash': { input: 0.075, output: 0.30 }
      };

      // Identificar taxas adequadas baseando-se no ID do modelo
      const modelKey = Object.keys(costs).find(k => modelId.toLowerCase().includes(k)) || 'gpt-4o-mini';
      const rate = costs[modelKey];
      
      const costInput = (tokensInput / 1000000) * rate.input;
      const costOutput = (tokensOutput / 1000000) * rate.output;
      costUSD = costInput + costOutput;
    }

    await saveAIUsage({
      id: randomUUID(),
      taskName: taskName || 'Chamada Geral',
      modelId,
      tokensInput,
      tokensOutput,
      costUSD,
      durationMs,
      timestamp: new Date(),
      success
    });
  } catch (err) {
    console.error('[Usage Logger] Erro ao registrar consumo de IA:', err);
  }
}
