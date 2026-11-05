/**
 * Utilitário modular para sintetizar e reproduzir áudio do wOs usando TTS (Text-to-Speech).
 */
export async function speakText(text: string): Promise<void> {
  if (!text) return;

  // Limpa as tags de formatação e tags XML para que a IA não soletre-as na fala
  const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
  if (!cleanText) return;

  const chatApi = (window as any).api?.chat;
  if (!chatApi || typeof chatApi.speak !== 'function') {
    console.warn('⚠️ [TTS] API chat.speak não disponível no preload.');
    return;
  }

  try {
    console.log(`🎙️ [TTS] Solicitando síntese de voz para: "${cleanText.substring(0, 60)}..."`);
    const resp = await chatApi.speak(cleanText);

    if (!resp || !resp.success) {
      throw new Error(resp?.error || 'Erro na resposta do serviço de fala');
    }

    if (!resp.buffer) {
      throw new Error('Nenhum buffer de áudio foi retornado');
    }

    // Identifica e trata a serialização de Buffers vindos do Electron IPC
    let audioData = resp.buffer;
    if (audioData && audioData.type === 'Buffer' && Array.isArray(audioData.data)) {
      console.log('🔄 [TTS] Convertendo buffer JSON serializado para Uint8Array...');
      audioData = new Uint8Array(audioData.data);
    } else if (audioData instanceof ArrayBuffer) {
      audioData = new Uint8Array(audioData);
    }

    console.log(`🔊 [TTS] Reproduzindo áudio. Tamanho: ${audioData.byteLength || audioData.length} bytes.`);
    
    const blob = new Blob([audioData], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    // Evita memory leak liberando a URL gerada após o áudio terminar ou falhar
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeEventListener('ended', cleanup);
      audio.removeEventListener('error', cleanup);
    };
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', cleanup);

    await audio.play();
    console.log('✅ [TTS] Reprodução de áudio iniciada.');
  } catch (error) {
    console.error('❌ [TTS] Falha ao sintetizar/tocar áudio:', error);
  }
}
