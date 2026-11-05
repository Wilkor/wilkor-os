/**
 * DashboardCache.ts
 * Cache em memória por sessão para o Dashboard do wOs.
 * Evita chamadas repetidas à API Trello, Git e Bitbucket enquanto os dados
 * ainda são considerados frescos (TTL configurável por tipo de dado).
 */

export type CacheKey = string;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // TTL em milissegundos
}

// TTLs padrão por tipo de dado
export const CACHE_TTL = {
  TRELLO_BOARDS: 10 * 60 * 1000,   // 10 min — boards mudam raramente
  TRELLO_CARDS: 5 * 60 * 1000,     // 5 min — cards mudam com mais frequência
  GIT_STATS: 5 * 60 * 1000,        // 5 min — commits são pontuais
  PULL_REQUESTS: 5 * 60 * 1000,    // 5 min — PRs costumam ser estáveis
  AGENTS: 15 * 60 * 1000,          // 15 min — lista de agentes é muito estável
  TREND_STATS: 10 * 60 * 1000,     // 10 min — histórico não muda frequentemente
} as const;

class DashboardCacheStore {
  private store = new Map<CacheKey, CacheEntry<unknown>>();

  /** Salva um item no cache */
  set<T>(key: CacheKey, data: T, ttl: number): void {
    this.store.set(key, { data, timestamp: Date.now(), ttl });
  }

  /** Recupera item do cache se ainda for válido; retorna null se expirado ou ausente */
  get<T>(key: CacheKey): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  /** Verifica se o cache contém o item válido */
  has(key: CacheKey): boolean {
    return this.get(key) !== null;
  }

  /** Invalida uma chave específica */
  invalidate(key: CacheKey): void {
    this.store.delete(key);
  }

  /** Invalida todas as chaves que comecem com determinado prefixo */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Invalida todo o cache (útil no botão "Forçar Atualização") */
  clear(): void {
    this.store.clear();
  }

  /** Retorna quanto tempo falta para o item expirar (em segundos) */
  ttlRemaining(key: CacheKey): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    const remaining = entry.ttl - (Date.now() - entry.timestamp);
    return Math.max(0, Math.round(remaining / 1000));
  }
}

// Singleton exportado — um único cache por processo renderer
export const DashboardCache = new DashboardCacheStore();
