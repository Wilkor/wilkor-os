import OpenAI from 'openai';
import { logAIUsage } from '../utils/aiUsageLogger';

export async function transcribeAudio(apiKey: string, audioBuffer: Buffer, fileName: string): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const startTime = Date.now();
  
  // Estimativa de segundos com base no tamanho do buffer (aproximadamente 32KB/segundo)
  const durationSec = Math.max(1, audioBuffer.length / 32000);
  
  try {
    const file = await OpenAI.toFile(audioBuffer, fileName);
    
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    const text = transcription.text;
    
    // Registrar uso com sucesso
    logAIUsage('whisper-1', durationSec.toFixed(2), text, Date.now() - startTime, true, 'Transcrição de Áudio').catch(() => null);

    return text;
  } catch (error: any) {
    console.error('Erro na transcrição Whisper:', error);
    
    // Registrar uso com falha
    logAIUsage('whisper-1', durationSec.toFixed(2), error.message || 'Erro', Date.now() - startTime, false, 'Transcrição de Áudio').catch(() => null);
    
    throw new Error(`Falha ao transcrever áudio: ${error.message}`);
  }
}
