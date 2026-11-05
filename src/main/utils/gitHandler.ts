import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  coAuthors?: string[];
}

export const getGitCommits = async (
  repoPath: string,
  limit: number = 10000,
  since?: string,
  until?: string,
  allBranches: boolean = true
): Promise<GitCommit[]> => {
  try {
    const sinceFlag = since ? `--since="${since}"` : '';
    const untilFlag = until ? `--until="${until}"` : '';
    const allFlag = allBranches ? '--all' : '';
    const { stdout } = await execAsync(
      `git log ${allFlag} ${sinceFlag} ${untilFlag} -n ${limit} --pretty=format:"%H|%an|%ad|%B%n--END_COMMIT--" --date=short`,
      { cwd: repoPath, timeout: 5000 }
    ).catch(() => ({ stdout: '' }));

    if (!stdout) return [];
    // ... restante da lógica mantida

    const rawCommits = stdout.split('--END_COMMIT--');
    const commits: GitCommit[] = [];

    for (const raw of rawCommits) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const lines = trimmed.split(/\r?\n/);
      const firstLine = lines[0];
      
      const parts = firstLine.split('|');
      if (parts.length < 3) continue;

      const [hash, author, date] = parts;
      const body = lines.slice(1).join('\n');
      
      const coAuthors: string[] = [];
      const coAuthRegex = /Co-authored-by: ([^<]*)/gi;
      let match;
      while ((match = coAuthRegex.exec(body)) !== null) {
        if (match[1]) coAuthors.push(match[1].trim());
      }

      commits.push({ hash, author, date, message: body, coAuthors });
    }

    console.log(`Git: ${repoPath} -> Found ${commits.length} commits`);
    return commits;
  } catch (error) {
    console.error(`Error fetching git commits for ${repoPath}:`, error);
    return [];
  }
};

export const getGitRemoteInfo = async (repoPath: string): Promise<{ workspace: string; repo: string } | null> => {
  try {
    // Tenta via git local primeiro, mas com timeout e silenciando erros de spawn
    const { stdout } = await execAsync('git remote get-url origin', { 
      cwd: repoPath,
      timeout: 3000 
    }).catch(() => ({ stdout: '' }));

    const url = stdout.trim();
    if (url) {
      const match = url.match(/bitbucket\.org[:/]([^/]+)\/([^/.]+)(\.git)?$/i);
      if (match) {
        return { workspace: match[1], repo: match[2] };
      }
    }

    // FALLBACK: Se falhar o git ou não for bitbucket, tenta deduzir pelo path
    const normalizedPath = repoPath.replace(/\\/g, '/');
    const pathParts = normalizedPath.split('/');
    const bitbucketIndex = pathParts.findIndex(part => part.toLowerCase() === 'bitbucket');

    if (bitbucketIndex !== -1 && pathParts.length > bitbucketIndex + 1) {
      // O nome do repositório é a pasta logo após "BitBucket"
      const repoName = pathParts[bitbucketIndex + 1];
      return {
        workspace: 'tia_bete',
        repo: repoName
      };
    }

    return null;
  } catch (error) {
    // Silencia o erro para não quebrar o fluxo, apenas loga internamente
    console.warn(`[Git Remote] Fallback para dedução de repo em ${repoPath}`);
    const parts = repoPath.split(/[\\/]/);
    const repoName = parts.pop() || parts.pop();
    if (repoName) return { workspace: 'tia_bete', repo: repoName };
    return null;
  }
};

export const getActiveBranches = async (repoPath: string): Promise<any[]> => {
  try {
    const repoName = repoPath.split(/[\\/]/).pop() || '';
    const getProjectLabel = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('gateway')) return 'GATEWAY';
      if (lower.includes('bff')) return 'BFF';
      if (lower.includes('front')) return 'FRONTEND';
      if (lower.includes('medical-portal')) return 'PORTAL';
      if (lower.includes('flows')) return 'FLOWS';
      return name.toUpperCase();
    };

    // Busca apenas branches que NÃO foram mergeadas na developer (PRs abertos)
    const { stdout } = await execAsync(
      `git for-each-ref --no-merged origin/developer --format="%(refname:short)|%(committerdate:short)|%(authorname)|%(subject)" --sort=-committerdate refs/remotes/origin`,
      { cwd: repoPath }
    );

    if (!stdout) return [];

    const lines = stdout.trim().split('\n');
    const branches: any[] = [];

    for (const line of lines) {
      const [ref, date, author, subject] = line.split('|');
      const name = ref.replace('origin/', '');
      
      // Ignora branches principais e tags
      if (['main', 'master', 'developer', 'HEAD', 'staging', 'production', 'hml'].includes(name) || name.includes('tags/')) continue;

      branches.push({
        repo: repoName,
        projectLabel: getProjectLabel(repoName),
        fullPath: repoPath,
        name,
        author,
        date,
        subject,
        status: 'Unmerged', // Alterado de 'Open' para refletir que é uma branch pendente de merge
        risk: 'Pending Analysis'
      });
    }

    return branches; // Agora trazemos todos os PRs abertos (limite removido para o frontend lidar se necessário)
  } catch (error) {
    console.error(`Error fetching branches for ${repoPath}:`, error);
    return [];
  }
};

export const getCommitStats = async (repoPaths: string[], since?: string) => {
  const allStats: Record<string, number> = {};
  
  for (const repo of repoPaths) {
    try {
      // Sincroniza com o remoto para garantir que o dashboard mostre dados reais do time
      await execAsync('git fetch origin', { cwd: repo, timeout: 5000 }).catch(() => null);
    } catch (e) {
      // Silencioso
    }

    const commits = await getGitCommits(repo, 10000, since);
    commits.forEach(c => {
      // Crédito para o autor principal
      const author = c.author.toLowerCase().trim();
      allStats[author] = (allStats[author] || 0) + 1;

      // Crédito para os co-autores
      c.coAuthors?.forEach(co => {
        const coAuthor = co.toLowerCase().trim();
        allStats[coAuthor] = (allStats[coAuthor] || 0) + 1;
      });
    });
  }
  
  return allStats;
};
export const getBranchDiff = async (repoPath: string, branchName: string, baseBranch: string = 'developer'): Promise<string> => {
  try {
    // Tenta primeiro com origin/
    const { stdout } = await execAsync(`git diff origin/${baseBranch}...origin/${branchName} -- . ":!node_modules" ":!package-lock.json" ":!dist"`, { cwd: repoPath });
    return stdout;
  } catch (error) {
    try {
      // Fallback para branches locais
      const { stdout } = await execAsync(`git diff ${baseBranch}...${branchName} -- . ":!node_modules" ":!package-lock.json" ":!dist"`, { cwd: repoPath });
      return stdout;
    } catch (e) {
      console.error(`Error fetching diff for ${branchName}:`, e);
      return '';
    }
  }
};

export const getChangedFiles = async (repoPath: string, branchName: string, baseBranch: string = 'developer'): Promise<any[]> => {
  try {
    const { stdout } = await execAsync(`git diff --numstat origin/${baseBranch}...origin/${branchName}`, { cwd: repoPath });
    return parseNumstat(stdout);
  } catch (error) {
     try {
       const { stdout } = await execAsync(`git diff --numstat ${baseBranch}...${branchName}`, { cwd: repoPath });
       return parseNumstat(stdout);
     } catch (e) {
       return [];
     }
  }
};

const parseNumstat = (stdout: string): any[] => {
  return stdout.trim().split('\n')
    .filter(line => line && line.trim() !== '')
    .map(line => {
      const [add, del, ...pathParts] = line.split(/\s+/);
      return {
        path: pathParts.join(' '),
        additions: parseInt(add) || 0,
        deletions: parseInt(del) || 0
      };
    });
};

/**
 * Retorna a lista de arquivos alterados em um commit específico com stats de linhas.
 */
export const getGitCommitFiles = async (repoPath: string, commitHash: string): Promise<any[]> => {
  try {
    const { stdout: numstat } = await execAsync(
      `git show --numstat --format="" ${commitHash}`,
      { cwd: repoPath, timeout: 10000 }
    ).catch(() => ({ stdout: '' }));

    const { stdout: nameStatus } = await execAsync(
      `git show --name-status --format="" ${commitHash}`,
      { cwd: repoPath, timeout: 10000 }
    ).catch(() => ({ stdout: '' }));

    const stats = parseNumstat(numstat);
    const statusLines = nameStatus.trim().split('\n').filter(Boolean);

    // Mapear status (A=added, M=modified, D=deleted, R=renamed)
    const statusMap: Record<string, string> = {};
    for (const line of statusLines) {
      const parts = line.split(/\t/);
      if (parts.length >= 2) {
        const status = parts[0].charAt(0);
        const filePath = parts[parts.length - 1];
        statusMap[filePath] = status === 'A' ? 'added'
          : status === 'M' ? 'modified'
          : status === 'D' ? 'deleted'
          : status === 'R' ? 'renamed'
          : 'changed';
      }
    }

    return stats.map(s => ({
      path: s.path,
      additions: s.additions,
      deletions: s.deletions,
      status: statusMap[s.path] || 'changed'
    }));
  } catch (error) {
    console.error(`[GitCommitFiles] Erro ao obter arquivos do commit ${commitHash}:`, error);
    return [];
  }
};

/**
 * Retorna o diff completo de um commit (todos os arquivos ou um arquivo específico).
 */
export const getGitCommitDiff = async (
  repoPath: string,
  commitHash: string,
  filePath?: string
): Promise<string> => {
  try {
    const fileFilter = filePath ? `-- "${filePath}"` : '';
    const { stdout } = await execAsync(
      `git show ${commitHash} ${fileFilter}`,
      { cwd: repoPath, timeout: 15000 }
    ).catch(() => ({ stdout: '' }));
    return stdout;
  } catch (error) {
    console.error(`[GitCommitDiff] Erro ao obter diff do commit ${commitHash}:`, error);
    return '';
  }
};
