import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelProvider, ChatMessage } from './types';

export class GeminiProvider implements ModelProvider {
  id = 'google';
  name: string;
  private genAI: GoogleGenerativeAI;
  private modelId: string;

  constructor(apiKey: string, modelId: string = 'gemini-1.5-pro') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelId = modelId;
    this.name = modelId;
  }

  private formatContent(msg: ChatMessage): any[] {
    const parts: any[] = [{ text: msg.content }];
    
    if (msg.attachments) {
      msg.attachments.forEach(att => {
        const fileName = att.name.toLowerCase();
        const isImage = att.type.startsWith('image/');
        const isPdf = att.type === 'application/pdf' || fileName.endsWith('.pdf');
        const isVideo = att.type.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm');
        const isAudio = !isVideo && (att.type.startsWith('audio/') || fileName.includes('.m4a') || fileName.includes('.mp3') || fileName.includes('.wav'));

        if (isImage || isPdf || isAudio || isVideo) {
          const base64Data = att.content.split(',')[1] || att.content;
          // Se o tipo for genérico ou vazio, tentamos inferir um básico para o Gemini não rejeitar
          let mimeType = att.type;
          if (!mimeType || mimeType === 'application/octet-stream') {
            if (isImage) mimeType = 'image/png';
            else if (isPdf) mimeType = 'application/pdf';
            else if (isAudio) {
              if (fileName.endsWith('.m4a')) mimeType = 'audio/mp4';
              else if (fileName.endsWith('.wav')) mimeType = 'audio/wav';
              else mimeType = 'audio/mpeg';
            }
            else if (isVideo) {
              if (fileName.endsWith('.webm')) mimeType = 'video/webm';
              else mimeType = 'video/mp4';
            }
          }

          console.log(`[Gemini] Enviando anexo: ${att.name} (${mimeType}), Tamanho: ${base64Data.length} bytes`);
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      });
    }
    
    return parts;
  }

  async sendMessage(messages: ChatMessage[], tools?: any[], _signal?: AbortSignal): Promise<string> {
    const systemMessages = messages.filter(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');
    
    const systemInstruction = systemMessages.map(m => m.content).join('\n\n');

    const model = this.genAI.getGenerativeModel({ 
      model: this.modelId,
      tools: tools ? [{ functionDeclarations: tools }] : undefined,
      systemInstruction: systemInstruction || undefined
    }, { apiVersion: 'v1beta' });

    // Filtra o histórico e garante que comece com 'user'
    // Se o primeiro item do chatMessages for 'assistant', removemos-lo do histórico inicial 
    // para satisfazer a exigência do Gemini de começar com 'user'.
    let baseMessages = [...chatMessages];
    if (baseMessages.length > 0 && baseMessages[0].role === 'assistant') {
      baseMessages.shift();
    }

    if (baseMessages.length === 0) {
      return 'Erro: Nenhuma mensagem de usuário encontrada para enviar ao Gemini.';
    }

    // Converte histórico para o formato do Gemini (todos exceto o último)
    const history = baseMessages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: this.formatContent(m)
    }));

    const chat = model.startChat({ history });
    const lastMessage = baseMessages[baseMessages.length - 1];
    
    const result = await chat.sendMessage(this.formatContent(lastMessage));
    const response = await result.response;
    
    const call = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall);
    if (call && call.functionCall) {
      return JSON.stringify({ type: 'tool_call', ...call.functionCall });
    }

    return response.text();
  }

  async sendMessageStream(messages: ChatMessage[], onChunk: (chunk: string) => void, tools?: any[], signal?: AbortSignal): Promise<void> {
    const systemMessages = messages.filter(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');
    
    const systemInstruction = systemMessages.map(m => m.content).join('\n\n');

    const model = this.genAI.getGenerativeModel({ 
      model: this.modelId,
      tools: tools ? [{ functionDeclarations: tools }] : undefined,
      systemInstruction: systemInstruction || undefined
    }, { apiVersion: 'v1beta' });

    let baseMessages = [...chatMessages];
    if (baseMessages.length > 0 && baseMessages[0].role === 'assistant') {
      baseMessages.shift();
    }

    if (baseMessages.length === 0) return;

    const history = baseMessages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: this.formatContent(m)
    }));

    const chat = model.startChat({ history });
    const lastMessage = baseMessages[baseMessages.length - 1];
    const result = await chat.sendMessageStream(this.formatContent(lastMessage));

    for await (const chunk of result.stream) {
      if (signal?.aborted) break;
      
      const calls = chunk.functionCalls;
      if (calls && calls.length > 0) {
        onChunk(JSON.stringify({ type: 'tool_call', name: calls[0].name, args: calls[0].args }));
        continue;
      }

      try {
        const chunkText = chunk.text();
        if (chunkText) onChunk(chunkText);
      } catch (e) {
        // Ignora erros ao obter texto de chunks de metadados ou de chamadas de funções
      }
    }
  }
}
