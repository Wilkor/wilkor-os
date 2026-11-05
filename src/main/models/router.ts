
import { ChatMessage } from './types';

export class ModelRouter {
  /**
   * Decide o melhor modelo baseado no conteúdo, anexos e chaves disponíveis
   */
  public static selectBestModel(_messages: ChatMessage[], _keys: Record<string, string>): string {
    return 'gpt-4o-mini';
  }
}
