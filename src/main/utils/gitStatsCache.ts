import Store from 'electron-store';
import { getCommitStats } from './gitHandler';

const store = new Store();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos em milissegundos

export interface CachedGitStats {
  stats: Record<string, number>;
  timestamp: number;
}

export async function getGitStatsWithCache(
  repoPaths: string[],
  since: string,
  forceRefresh: boolean = false
): Promise<Record<string, number>> {
  // Gera uma assinatura única baseada nos repositórios para evitar colisões
  const repoSig = Buffer.from(repoPaths.join(',')).toString('base64').substring(0, 16);
  const cacheKey = `git_stats_cache_${repoSig}_${since || 'all'}`;

  if (!forceRefresh) {
    const cached = store.get(cacheKey) as CachedGitStats | undefined;
    if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`⚡ [GitStatsCache] Retornando estatísticas memorizadas para: ${since || 'all'}`);
      return cached.stats;
    }
  }

  console.log(`🔍 [GitStatsCache] Executando varredura real Git local para: ${since || 'all'}`);
  const stats = await getCommitStats(repoPaths, since);

  // Salva no cache
  store.set(cacheKey, {
    stats,
    timestamp: Date.now()
  });

  return stats;
}
