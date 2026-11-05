import { ModelProvider, ChatMessage } from './types';

export class OllamaProvider implements ModelProvider {
  id = 'ollama';
  name = 'Ollama (Local)';
  private baseUrl = 'http://localhost:11434/api';
  private modelId: string;

  constructor(modelId: string = 'llama3') {
    this.modelId = modelId;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: this.modelId,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false
      })
    });

    const data = await response.json();
    if (!data?.message?.content) {
      throw new Error(`Erro na resposta do Ollama para o modelo ${this.modelId}: ${JSON.stringify(data)}`);
    }
    return data.message.content;
  }

  async sendMessageStream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: this.modelId,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true
      })
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (data.message?.content) {
          onChunk(data.message.content);
        }
      }
    }
  }
}
