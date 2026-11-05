export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: {
    name: string;
    type: string;
    content: string; // Base64 ou Content string
    path?: string;   // Caminho absoluto opcional
  }[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

export interface ModelProvider {
  id: string;
  name: string;
  sendMessage(messages: ChatMessage[], tools?: ToolDefinition[], signal?: AbortSignal): Promise<string>;
  sendMessageStream(messages: ChatMessage[], onChunk: (chunk: string) => void, tools?: ToolDefinition[], signal?: AbortSignal): Promise<void>;
}

export interface AppSettings {
  geminiKey?: string;
  openAIKey?: string;
  activeModel: string;
}
