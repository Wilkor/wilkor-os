import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { ModelProvider } from './types';

export const PROVIDER_MAP: Record<string, (keys: Record<string, string>) => ModelProvider | null> = {
  // Google Gemini
  'gemini-1.5-pro':    (k) => k.geminiKey ? new GeminiProvider(k.geminiKey, 'gemini-1.5-pro') : null,
  'gemini-1.5-flash':  (k) => k.geminiKey ? new GeminiProvider(k.geminiKey, 'gemini-1.5-flash') : null,
  'gemini-2.0-flash':  (k) => k.geminiKey ? new GeminiProvider(k.geminiKey, 'gemini-2.0-flash') : null,
  // OpenAI
  'gpt-4o':            (k) => k.openAIKey ? new OpenAIProvider(k.openAIKey, 'gpt-4o-mini') : null,
  'gpt-4o-mini':       (k) => k.openAIKey ? new OpenAIProvider(k.openAIKey, 'gpt-4o-mini') : null,
  'gpt-4-turbo':       (k) => k.openAIKey ? new OpenAIProvider(k.openAIKey, 'gpt-4-turbo') : null,
  'o1':                (k) => k.openAIKey ? new OpenAIProvider(k.openAIKey, 'o1') : null,
  'o1-mini':           (k) => k.openAIKey ? new OpenAIProvider(k.openAIKey, 'o1-mini') : null,
  // Anthropic
  'claude-3-5-sonnet-20241022': (k) => k.anthropicKey ? new AnthropicProvider(k.anthropicKey, 'claude-3-5-sonnet-20241022') : null,
  'claude-3-5-haiku-20241022':  (k) => k.anthropicKey ? new AnthropicProvider(k.anthropicKey, 'claude-3-5-haiku-20241022') : null,
  'claude-3-opus-20240229':     (k) => k.anthropicKey ? new AnthropicProvider(k.anthropicKey, 'claude-3-opus-20240229') : null,
  // Ollama (local)
  'ollama:llama3':        () => new OllamaProvider('llama3'),
  'ollama:codellama':     () => new OllamaProvider('codellama'),
  'ollama:deepseek-coder':() => new OllamaProvider('deepseek-coder'),
};
