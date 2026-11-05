import { ChatMessage } from '../models/types';
import fs from 'fs';

/**
 * Processa anexos de arquivos locais ou em formato base64 vindos do chat do wOs.
 * Caso o arquivo não possua o conteúdo carregado mas tenha o caminho (anexos internos/drag & drop),
 * o backend lê o arquivo do disco nativamente.
 */
export async function processMultimodalAttachments(messages: ChatMessage[], modelId: string, openAIKey: string) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg || !lastUserMsg.attachments) return;

  if (!lastUserMsg.content.trim()) {
    lastUserMsg.content = "Analise o(s) arquivo(s) anexo(s) e descreva seu conteúdo, por favor.";
  }

  const { processFileAttachment } = await import('./fileProcessor');
  const attachmentsToRemove: string[] = [];
  
  for (const attachment of lastUserMsg.attachments) {
    // 1. Se não possuir o conteúdo em memória (base64) mas tiver o caminho local absoluto (drag/artifacts), carrega do disco
    if (!attachment.content && attachment.path) {
      try {
        if (fs.existsSync(attachment.path)) {
          const fileBuffer = fs.readFileSync(attachment.path);
          const base64 = fileBuffer.toString('base64');
          if (attachment.type.startsWith('image/')) {
            attachment.content = `data:${attachment.type};base64,${base64}`;
          } else {
            attachment.content = base64;
          }
          console.log(`[MultimodalProcessor] Carregou conteúdo de anexo local: ${attachment.path}`);
        }
      } catch (err: any) {
        console.error(`[MultimodalProcessor] Erro ao ler anexo do disco em ${attachment.path}:`, err.message);
      }
    }

    const fileName = attachment.name.toLowerCase();
    const isVideo = attachment.type.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.webm') || fileName.endsWith('.mov');
    const isAudio = !isVideo && (attachment.type.startsWith('audio/') || fileName.includes('.m4a') || fileName.includes('.mp3') || fileName.includes('.wav') || fileName.includes('.ogg'));

    if (isAudio && openAIKey && !modelId.includes('gemini')) {
      try {
        const { transcribeAudio } = await import('../models/whisper');
        const buffer = Buffer.from(attachment.content.split(',')[1] || attachment.content, 'base64');
        const transcription = await transcribeAudio(openAIKey, buffer, attachment.name);
        lastUserMsg.content += `\n\n[Transcrição de Áudio (${attachment.name})]: ${transcription}`;
        attachmentsToRemove.push(attachment.name);
      } catch (err) {
        console.error('[Whisper] Erro na API de transcrição:', err);
        attachmentsToRemove.push(attachment.name);
        lastUserMsg.content += `\n\n[Áudio "${attachment.name}" recebido mas não pôde ser transcrito. Erro na API Whisper.]`;
      }
      continue;
    }

    if ((isAudio || isVideo) && !modelId.includes('gemini')) {
      attachmentsToRemove.push(attachment.name);
      const mediaType = isAudio ? 'Áudio' : 'Vídeo';
      lastUserMsg.content += `\n\n[${mediaType} "${attachment.name}" recebido. Modelo atual (${modelId}) não suporta análise nativa de ${mediaType.toLowerCase()}. Configure uma chave Gemini para análise multimodal.]`;
      continue;
    }

    if (attachment.type.startsWith('image/')) {
      // Injeta informações do caminho do arquivo no texto da mensagem para a IA saber
      const pathInfo = attachment.path ? ` localizado em ${attachment.path}` : '';
      lastUserMsg.content += `\n\n[Anexo de Imagem: ${attachment.name}${pathInfo}]`;
      continue;
    }

    if (isVideo) continue;

    const processed = await processFileAttachment(attachment);
    if (processed.text && (!modelId.includes('gemini') || (attachment.type !== 'application/pdf' && !attachment.name.endsWith('.pdf')))) {
      lastUserMsg.content += processed.text;
    }
  }

  if (attachmentsToRemove.length > 0 && lastUserMsg.attachments) {
    lastUserMsg.attachments = lastUserMsg.attachments.filter(a => !attachmentsToRemove.includes(a.name));
    if (lastUserMsg.attachments.length === 0) {
      delete lastUserMsg.attachments;
    }
  }
}
