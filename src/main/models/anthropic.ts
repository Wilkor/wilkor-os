import Anthropic from '@anthropic-ai/sdk';
import { ModelProvider, ChatMessage, ToolDefinition } from './types';

export class AnthropicProvider implements ModelProvider {
  private client: Anthropic;
  public id: string;
  public name: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.modelId = modelId;
    this.id = modelId;
    this.name = modelId;
  }

  private formatTools(tools?: ToolDefinition[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters || { type: 'object', properties: {} }
    }));
  }

  private formatMessages(messages: ChatMessage[]): any[] {
    return messages
      .filter(m => m.role !== 'system')
      .map(msg => {
        const role = msg.role === 'assistant' ? ('assistant' as const) : ('user' as const);
        
        if (!msg.attachments || msg.attachments.length === 0) {
          return { role, content: msg.content };
        }

        const content: any[] = [{ type: 'text', text: msg.content }];
        let attachmentNotes = '';

        msg.attachments.forEach(att => {
          if (att.type.startsWith('image/')) {
            const parts = att.content.split(',');
            const base64Data = parts[1] || parts[0];
            const mediaType = att.type as any;
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data
              }
            });
          } else {
            attachmentNotes += `\n[Arquivo Anexo: ${att.name} (${att.type})]`;
          }
        });

        if (attachmentNotes) {
          content[0].text += `\n\n${attachmentNotes}\n(Nota: Este arquivo foi anexado e está disponível para análise multimodal se o provedor suportar).`;
        }

        return { role, content };
      });
  }

  async sendMessage(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system');
    const userAssistantMessages = this.formatMessages(messages);
    const formattedTools = this.formatTools(tools);

    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: userAssistantMessages as any,
      ...(formattedTools ? { tools: formattedTools } : {}),
    }, { signal });

    // Verifica se o Claude solicitou uso de uma tool
    const toolUseBlock = response.content.find((block: any) => block.type === 'tool_use');
    if (toolUseBlock && toolUseBlock.type === 'tool_use') {
      return JSON.stringify({
        type: 'tool_call',
        name: (toolUseBlock as any).name,
        args: (toolUseBlock as any).input
      });
    }

    const textBlock = response.content.find((block: any) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text;
    }
    
    return 'Erro: Resposta não textual do Claude.';
  }

  async sendMessageStream(messages: ChatMessage[], onChunk: (chunk: string) => void, tools?: ToolDefinition[], signal?: AbortSignal): Promise<void> {
    const systemMessage = messages.find(m => m.role === 'system');
    const userAssistantMessages = this.formatMessages(messages);
    const formattedTools = this.formatTools(tools);

    const stream = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: userAssistantMessages as any,
      stream: true,
      ...(formattedTools ? { tools: formattedTools } : {}),
    }, { signal });

    let toolCallName = '';
    let toolCallArgsStr = '';

    for await (const event of stream) {
      if (signal?.aborted) break;

      if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
        toolCallName = event.content_block.name;
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          onChunk(event.delta.text);
        } else if (event.delta.type === 'input_json_delta') {
          toolCallArgsStr += event.delta.partial_json;
        }
      }
    }

    if (toolCallName && !signal?.aborted) {
      try {
        const parsedArgs = toolCallArgsStr ? JSON.parse(toolCallArgsStr) : {};
        onChunk(JSON.stringify({
          type: 'tool_call',
          name: toolCallName,
          args: parsedArgs
        }));
      } catch (err) {
        console.error('[Anthropic Stream] Erro ao parsear argumentos da tool call:', err, toolCallArgsStr);
      }
    }
  }
}
