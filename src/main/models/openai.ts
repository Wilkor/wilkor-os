import OpenAI from 'openai';
import { ModelProvider, ChatMessage } from './types';

export class OpenAIProvider implements ModelProvider {
  public id: string = 'OpenAI';
  public name: string;
  private client: OpenAI;
  private modelId: string;

  constructor(apiKey: string, modelId: string = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.modelId = modelId;
    this.name = modelId;
  }

  private formatMessages(messages: ChatMessage[]): any[] {
    return messages.map(msg => {
      if (!msg.attachments || msg.attachments.length === 0) {
        return { role: msg.role, content: msg.content };
      }

      const content: any[] = [{ type: 'text', text: msg.content }];
      let attachmentNotes = '';
      
      msg.attachments.forEach(att => {
        if (att.type.startsWith('image/')) {
          content.push({
            type: 'image_url',
            image_url: { url: att.content }
          });
        } else {
          // Nota para o modelo sobre arquivos que ele não vê nativamente
          attachmentNotes += `\n[Arquivo Anexo: ${att.name} (${att.type})]`;
        }
      });

      if (attachmentNotes) {
        content[0].text += `\n\n${attachmentNotes}\n(Nota: O sistema extraiu o texto deste arquivo ou ele foi enviado para análise multimodal se disponível no provedor).`;
      }

      return { role: msg.role, content };
    });
  }

  async sendMessage(messages: ChatMessage[], tools?: any[], signal?: AbortSignal): Promise<string> {
    const formattedMessages = this.formatMessages(messages);
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages: formattedMessages as any,
      tools: tools?.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      })) as any
    }, { signal });

    const toolCall = response.choices[0].message.tool_calls?.[0] as any;
    if (toolCall) {
      return JSON.stringify({
        type: 'tool_call',
        name: toolCall.function.name,
        args: JSON.parse(toolCall.function.arguments)
      });
    }

    return response.choices[0].message.content || '';
  }

  async sendMessageStream(messages: ChatMessage[], onChunk: (chunk: string) => void, tools?: any[], signal?: AbortSignal): Promise<void> {
    const formattedMessages = this.formatMessages(messages);
    const stream = await this.client.chat.completions.create({
      model: this.modelId,
      messages: formattedMessages as any,
      stream: true,
      tools: tools?.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      })) as any
    }, { signal });

    const toolCallsMap: Record<number, { name: string; argsStr: string }> = {};

    for await (const chunk of stream) {
      if (signal?.aborted) break;
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        onChunk(delta.content);
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index;
          if (index === undefined) continue;

          if (!toolCallsMap[index]) {
            toolCallsMap[index] = { name: '', argsStr: '' };
          }

          if (tc.function?.name) {
            toolCallsMap[index].name = tc.function.name;
          }
          if (tc.function?.arguments) {
            toolCallsMap[index].argsStr += tc.function.arguments;
          }
        }
      }
    }

    const toolCallKeys = Object.keys(toolCallsMap);
    if (toolCallKeys.length > 0 && !signal?.aborted) {
      const firstKey = Number(toolCallKeys[0]);
      const firstToolCall = toolCallsMap[firstKey];
      if (firstToolCall.name) {
        try {
          const parsedArgs = firstToolCall.argsStr ? JSON.parse(firstToolCall.argsStr) : {};
          onChunk(JSON.stringify({
            type: 'tool_call',
            name: firstToolCall.name,
            args: parsedArgs
          }));
        } catch (err) {
          console.error('[OpenAI Stream] Erro ao parsear argumentos da tool call:', err, firstToolCall.argsStr);
        }
      }
    }
  }
}
