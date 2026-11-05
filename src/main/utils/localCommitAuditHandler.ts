import { getGitCommits, getGitRemoteInfo, getGitCommitFiles, getGitCommitDiff } from './gitHandler';

interface PeriodRange {
  since?: string;
  until?: string;
}

/**
 * Converte period em parâmetros --since e --until compatíveis com git log.
 */
function resolvePeriodRange(period: string): PeriodRange {
  const now = new Date();
  switch (period) {
    case 'today': {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return {
        since: `${year}-${month}-${day} 00:00:00`,
        until: `${year}-${month}-${day} 23:59:59`
      };
    }
    case 'yesterday': {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      return {
        since: `${year}-${month}-${day} 00:00:00`,
        until: `${year}-${month}-${day} 23:59:59`
      };
    }
    case 'week':     return { since: '1 week ago' };
    case 'month':    return { since: '1 month ago' };
    case 'all':      return {};
    default:         return { since: period }; // aceita strings livres como "3 days ago"
  }
}

/**
 * Conta e lista commits de todos os repositórios por período.
 * Retorna total consolidado + breakdown por projeto + lista de commits.
 */
export async function getCommitsByPeriod(
  repoPaths: string[],
  period: string = 'today',
  author?: string
) {
  const { since, until } = resolvePeriodRange(period);
  const results = await Promise.all(repoPaths.map(async (repoPath) => {
    const projectName = repoPath.split(/[\\/]/).pop() || repoPath;
    try {
      // Tenta sincronizar com o remote (fetch) de forma rápida e silenciosa antes do log
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('git fetch origin', { cwd: repoPath, timeout: 5000 }).catch(() => null);

      const commits = await getGitCommits(repoPath, 500, since, until);
      const filtered = author
        ? commits.filter(c =>
            c.author.toLowerCase().includes(author.toLowerCase()) ||
            (c.coAuthors || []).some(co => co.toLowerCase().includes(author.toLowerCase()))
          )
        : commits;

      return {
        project: projectName,
        path: repoPath,
        count: filtered.length,
        commits: filtered.map(c => ({
          hash: c.hash.substring(0, 7),
          author: c.author,
          date: c.date,
          message: (c.message || '').split('\n')[0].trim().substring(0, 120)
        }))
      };
    } catch {
      return { project: projectName, path: repoPath, count: 0, commits: [], error: true };
    }
  }));

  const totalCommits = results.reduce((sum, r) => sum + r.count, 0);
  const periodLabel = period === 'today' ? 'hoje'
    : period === 'yesterday' ? 'ontem'
    : period === 'week' ? 'esta semana'
    : period === 'month' ? 'este mês'
    : period === 'all' ? 'todo o histórico'
    : `desde ${period}`;

  return {
    period: periodLabel,
    totalCommits,
    totalProjects: results.filter(r => r.count > 0).length,
    summary: results.map(r => ({ project: r.project, count: r.count })),
    details: results
  };
}

/**
 * Busca metadados completos de um commit específico:
 * autor, data, mensagem e lista de arquivos com stats.
 * Varre todos os repos ativos se repoPath não informado.
 */
export async function getLocalCommitDetails(
  repoPaths: string[],
  commitHash: string,
  repoPath?: string
) {
  const pathsToSearch = repoPath
    ? [repoPath]
    : repoPaths;

  for (const path of pathsToSearch) {
    try {
      const projectName = path.split(/[\\/]/).pop() || path;
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Busca metadados do commit
      const { stdout: meta } = await execAsync(
        `git show --no-patch --format="%H|%an|%ae|%ad|%s|%b" --date=short ${commitHash}`,
        { cwd: path, timeout: 8000 }
      ).catch(() => ({ stdout: '' }));

      if (!meta.trim()) continue;

      const [hash, author, email, date, subject, ...bodyParts] = meta.trim().split('|');
      const body = bodyParts.join('|').trim();

      const files = await getGitCommitFiles(path, commitHash);
      const remote = await getGitRemoteInfo(path);

      return {
        found: true,
        project: projectName,
        path: path,
        remote: remote ? `${remote.workspace}/${remote.repo}` : null,
        commit: {
          hash: (hash || commitHash).substring(0, 7),
          fullHash: hash || commitHash,
          author,
          email,
          date,
          subject,
          body,
          totalFilesChanged: files.length,
          totalAdditions: files.reduce((s, f) => s + f.additions, 0),
          totalDeletions: files.reduce((s, f) => s + f.deletions, 0),
          files
        }
      };
    } catch {
      continue;
    }
  }

  return { found: false, error: `Commit ${commitHash} não encontrado nos repositórios ativos.` };
}

/**
 * Auditoria profunda do código alterado em um commit.
 * Retorna diff completo por arquivo para análise de qualidade e segurança pela IA.
 */
export async function auditCommitCode(
  repoPaths: string[],
  commitHash: string,
  repoPath?: string,
  filePath?: string
) {
  const pathsToSearch = repoPath ? [repoPath] : repoPaths;

  for (const path of pathsToSearch) {
    try {
      const projectName = path.split(/[\\/]/).pop() || path;
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Verifica se o commit existe no repo
      const { stdout: check } = await execAsync(
        `git cat-file -t ${commitHash}`,
        { cwd: path, timeout: 5000 }
      ).catch(() => ({ stdout: '' }));

      if (!check.trim().includes('commit')) continue;

      const files = await getGitCommitFiles(path, commitHash);
      if (files.length === 0 && !filePath) continue;

      // Busca o diff (por arquivo específico ou todos)
      const diff = await getGitCommitDiff(path, commitHash, filePath);

      // Metadados do commit para contexto
      const { stdout: meta } = await execAsync(
        `git show --no-patch --format="%an|%ad|%s" --date=short ${commitHash}`,
        { cwd: path, timeout: 5000 }
      ).catch(() => ({ stdout: '|||' }));

      const [author, date, subject] = meta.trim().split('|');

      return {
        found: true,
        project: projectName,
        commitHash: commitHash.substring(0, 7),
        author,
        date,
        subject,
        filePath: filePath || null,
        totalFilesChanged: files.length,
        files,
        diff: diff.substring(0, 20000) // Limita a 20k chars para não estourar tokens
      };
    } catch {
      continue;
    }
  }

  return {
    found: false,
    error: `Commit ${commitHash} não encontrado. Verifique o hash e o repositório.`
  };
}
