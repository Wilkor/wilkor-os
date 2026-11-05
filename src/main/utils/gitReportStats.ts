import fs from 'fs';
import { getCommitStats, getActiveBranches } from './gitHandler';
import { getRoots } from './fs';

export interface ContributorStats {
  name: string;
  commits: number;
  prs: number;
}

export interface CompiledGitData {
  reposToScan: string[];
  totalCommits: number;
  totalPRs: number;
  topCommitter: { name: string; count: number };
  topPRContributor: { name: string; count: number };
  contributors: ContributorStats[];
  activePRsList: any[];
}

export interface GitReportSummary {
  period: string;
  totalCommits: number;
  totalPRs: number;
  topCommitter: { name: string; count: number };
  topPRContributor: { name: string; count: number };
  contributors: ContributorStats[];
  filePath: string;
}

/**
 * Compila todas as estatísticas Git de commits e Pull Requests de repositórios ativos.
 */
export async function compileGitStats(
  since: string = '7 days ago',
  customRepos?: string[]
): Promise<CompiledGitData> {
  const fallbackRepos = getRoots();

  const reposToScan = (customRepos || fallbackRepos).filter(repoPath => {
    try {
      return fs.existsSync(repoPath) && fs.statSync(repoPath).isDirectory();
    } catch {
      return false;
    }
  });

  if (reposToScan.length === 0) {
    throw new Error('Nenhum repositório Git válido foi encontrado para análise.');
  }

  console.log(`[wOs Stats] Analisando ${reposToScan.length} repositórios Git desde: ${since}...`);

  // 1. Busca estatísticas de commits em paralelo
  const commitStats = await getCommitStats(reposToScan, since);

  // 2. Busca branches ativas (PRs) de todos os repositórios em paralelo
  const activePRsList: any[] = [];
  const prStatsByAuthor: Record<string, number> = {};

  const prPromises = reposToScan.map(async repoPath => {
    try {
      const branches = await getActiveBranches(repoPath);
      activePRsList.push(...branches);
      branches.forEach(b => {
        const author = (b.author || 'Desconhecido').toLowerCase().trim();
        prStatsByAuthor[author] = (prStatsByAuthor[author] || 0) + 1;
      });
    } catch (err) {
      console.warn(`[wOs Stats] Falha ao ler branches de ${repoPath}:`, err);
    }
  });
  await Promise.all(prPromises);

  // 3. Consolida colaboradores e estatísticas gerais
  const contributorsMap: Record<string, { commits: number; prs: number }> = {};
  
  // Consolida commits
  Object.entries(commitStats).forEach(([author, count]) => {
    const key = author.toLowerCase().trim();
    if (!contributorsMap[key]) contributorsMap[key] = { commits: 0, prs: 0 };
    contributorsMap[key].commits += count;
  });

  // Consolida PRs
  Object.entries(prStatsByAuthor).forEach(([author, count]) => {
    const key = author.toLowerCase().trim();
    if (!contributorsMap[key]) contributorsMap[key] = { commits: 0, prs: 0 };
    contributorsMap[key].prs += count;
  });

  const contributors = Object.entries(contributorsMap).map(([name, data]) => ({
    name: name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    commits: data.commits,
    prs: data.prs
  })).sort((a, b) => b.commits - a.commits || b.prs - a.prs);

  let totalCommits = 0;
  let totalPRs = activePRsList.length;
  let topCommitter = { name: 'Ninguém', count: 0 };
  let topPRContributor = { name: 'Ninguém', count: 0 };

  contributors.forEach(c => {
    totalCommits += c.commits;
    if (c.commits > topCommitter.count) {
      topCommitter = { name: c.name, count: c.commits };
    }
    if (c.prs > topPRContributor.count) {
      topPRContributor = { name: c.name, count: c.prs };
    }
  });

  return {
    reposToScan,
    totalCommits,
    totalPRs,
    topCommitter,
    topPRContributor,
    contributors,
    activePRsList
  };
}
