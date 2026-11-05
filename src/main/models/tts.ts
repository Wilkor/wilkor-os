import OpenAI from 'openai';
import { logAIUsage } from '../utils/aiUsageLogger';

export async function generateSpeech(apiKey: string, text: string): Promise<Buffer> {
  const openai = new OpenAI({ apiKey });
  const startTime = Date.now();
  
  // Estimativa aproximada de tokens para registro (4 chars = 1 token)
  const estimatedTokens = Math.max(1, Math.ceil(text.length / 4));
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Registrar uso com sucesso
    logAIUsage('tts-1', estimatedTokens.toString(), 'Áudio Gerado', Date.now() - startTime, true, 'Text-to-Speech').catch(() => null);

    return buffer;
  } catch (error: any) {
    console.error('Erro na geração de TTS:', error);
    
    // Registrar uso com falha
    logAIUsage('tts-1', estimatedTokens.toString(), error.message || 'Erro', Date.now() - startTime, false, 'Text-to-Speech').catch(() => null);
    
    throw new Error(`Falha ao gerar fala: ${error.message}`);
  }
}
