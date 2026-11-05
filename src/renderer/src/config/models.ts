import { Cpu } from 'lucide-react'

export const MODEL_LIMITS: Record<string, number> = {
  'gemini-1.5-pro': 2000000,
  'gemini-1.5-flash': 1000000,
  'gemini-2.0-flash': 1000000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-haiku-20241022': 200000,
  'claude-3-opus-20240229': 200000,
  'ollama:llama3': 8192,
  'ollama:codellama': 16384,
  'ollama:deepseek-coder': 16384,
  'auto': 2000000
}

export const ALL_MODELS = [
  // Apenas o GPT-4o Mini
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', providerKey: 'openAIKey', icon: Cpu }
]
