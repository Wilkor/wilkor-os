import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';

import Store from 'electron-store';

const store = new Store();
const execAsync = promisify(exec);

export interface GitStatusFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
}

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  files: GitStatusFile[];
  repoRoot?: string;
}

let projectRoot = ((store as any).get('projectPath') as string) || process.cwd();

export const setGitProjectRoot = (path: string) => {
  projectRoot = path;
};

const runGit = async (args: string): Promise<string> => {
  try {
    const { stdout } = await execAsync(`git ${args}`, { 
      cwd: projectRoot,
      timeout: 5000 
    }).catch((err) => {
      if (err.code === 'ENOENT') {
        console.warn(`[Git] Executável 'git' ou 'cmd.exe' não encontrado para: git ${args}`);
        return { stdout: 'NOT_A_REPO' };
      }
      throw err;
    });
    return (stdout || '').trim();
  } catch (error: any) {
    if (error.message?.includes('not a git repository') || error.stdout === 'NOT_A_REPO') {
      return 'NOT_A_REPO';
    }
    throw error;
  }
};

export const getGitStatus = async (): Promise<GitStatus> => {
  try {
    const statusOutput = await runGit('status --porcelain');
    
    if (statusOutput === 'NOT_A_REPO') {
      return { isRepo: false, branch: '', files: [] };
    }

    const branch = await runGit('rev-parse --abbrev-ref HEAD');
    
    const files: GitStatusFile[] = statusOutput.split('\n').filter(line => line.length > 0).map(line => {
      const statusCode = line.substring(0, 2);
      let filePath = line.substring(3);
      
      if (filePath.startsWith('"') && filePath.endsWith('"')) {
        filePath = filePath.substring(1, filePath.length - 1);
      }
      
      let status: GitStatusFile['status'] = 'modified';
      let staged = false;

      // Porcelain status codes explanation:
      // X = status of index, Y = status of work tree
      // '??' = untracked
      // 'M ' = modified in index (staged)
      // ' M' = modified in work tree (not staged)
      // 'A ' = added to index (staged)
      
      if (statusCode === '??') status = 'untracked';
      else if (statusCode.startsWith('A')) status = 'added';
      else if (statusCode.startsWith('D') || statusCode.endsWith('D')) status = 'deleted';
      else if (statusCode.startsWith('R')) status = 'renamed';
      else status = 'modified';

      // If X (first char) is not space and not ?, it's staged
      if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
        staged = true;
      }

      return { path: filePath, status, staged };
    });

    return { isRepo: true, branch, files, repoRoot: projectRoot };
  } catch (err) {
    return { isRepo: false, branch: '', files: [], repoRoot: projectRoot };
  }
};

export const gitStageFile = async (path: string) => {
  await runGit(`add "${path}"`);
};

export const gitUnstageFile = async (path: string) => {
  await runGit(`reset HEAD "${path}"`);
};

export const gitCommit = async (message: string) => {
  await runGit(`commit -m "${message}"`);
};

export const getGitDiff = async (path: string): Promise<string> => {
  try {
    const statusOutput = await runGit(`status --porcelain "${path}"`);
    
    if (!statusOutput) {
      return await runGit(`diff "${path}"`);
    }

    const statusCode = statusOutput.substring(0, 2);

    if (statusCode === '??') {
      const devNull = process.platform === 'win32' ? 'NUL' : '/dev/null';
      const diff = await runGit(`diff --no-index -- ${devNull} "${path}"`);
      return diff;
    }

    if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
      return await runGit(`diff --cached "${path}"`);
    }

    return await runGit(`diff "${path}"`);
  } catch (error) {
    return '';
  }
};


export const gitPush = async () => {
  await runGit('push');
};

export const gitPull = async () => {
  await runGit('pull');
};

export const gitFetch = async () => {
  await runGit('fetch');
};

export const gitStageAll = async () => {
  await runGit('add .');
};

export const gitUnstageAll = async () => {
  // Reset de todos os arquivos staged para o ponto do HEAD
  await runGit('reset HEAD .');
};

export const gitGetBranches = async (): Promise<{ current: string; all: string[] }> => {
  try {
    const current = await runGit('rev-parse --abbrev-ref HEAD');
    const allOutput = await runGit('branch -a --format="%(refname:short)"');
    const rawBranches = allOutput.split('\n').filter(b => b.trim().length > 0);
    
    const branchesSet = new Set<string>();
    rawBranches.forEach(b => {
      let name = b.trim();
      if (name.includes('origin/HEAD')) return;
      if (name.startsWith('remotes/')) {
        name = name.replace('remotes/', '');
      }
      branchesSet.add(name);
    });
    
    if (current && current !== 'NOT_A_REPO') branchesSet.add(current);
    return { current, all: Array.from(branchesSet) };
  } catch (err) {
    return { current: '', all: [] };
  }
};

export const gitCheckout = async (branch: string, options?: { force?: boolean; stash?: boolean }) => {
  let targetBranch = branch;
  if (branch.startsWith('origin/')) {
    targetBranch = branch.replace('origin/', '');
  }

  // 1. Se pediu Stash, cria stash temporário se houver modificações locais
  let stashCreated = false;
  if (options?.stash) {
    try {
      const currentStatus = await runGit('status --porcelain');
      // Ignora linhas vazias
      const hasChanges = currentStatus && currentStatus !== 'NOT_A_REPO' && currentStatus.trim().length > 0;
      if (hasChanges) {
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        await runGit(`stash save "wos-auto-stash-${dateStr}"`);
        stashCreated = true;
      }
    } catch (err) {
      console.warn('[Git] Erro ao tentar criar stash automático:', err);
    }
  }

  // 2. Executa o checkout
  try {
    const checkoutFlag = options?.force ? '-f' : '';
    if (branch.startsWith('origin/')) {
      try {
        await runGit(`checkout ${checkoutFlag} -b "${targetBranch}" --track "${branch}"`);
      } catch (err) {
        await runGit(`checkout ${checkoutFlag} "${targetBranch}"`);
      }
    } else {
      await runGit(`checkout ${checkoutFlag} "${branch}"`);
    }

    // 3. Se fez stash, tenta aplicar na nova branch
    if (stashCreated) {
      try {
        await runGit('stash pop');
      } catch (popErr) {
        console.warn('[Git] Conflito ou aviso ao aplicar stash pop na nova branch:', popErr);
      }
    }
  } catch (error) {
    // Se falhar o checkout e a gente fez stash, reverte voltando o stash para a branch de origem
    if (stashCreated) {
      try {
        await runGit('stash pop');
      } catch (popErr) {
        console.error('[Git] Falha ao reverter stash após falha de checkout:', popErr);
      }
    }
    throw error;
  }
};

export const gitCreateBranch = async (branch: string) => {
  await runGit(`checkout -b "${branch}"`);
};

export const gitClone = (url: string, destPath: string, mainWindow: BrowserWindow): Promise<{ success: boolean; path?: string; error?: string }> => {
  return new Promise((resolve) => {
    mainWindow.webContents.send('git:clone:progress', { percent: 0, message: 'Iniciando clone...' });

    // Clonar em um novo processo para capturar progresso real
    const process = spawn('git', ['clone', '--progress', url, destPath], {
      env: { ...global.process.env },
    });

    process.stderr.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (!line) return;

      const match = line.match(/(\d+)%/);
      const percent = match ? parseInt(match[1]) : -1;

      mainWindow.webContents.send('git:clone:progress', { percent, message: line });
    });

    process.on('close', (code) => {
      if (code === 0) {
        mainWindow.webContents.send('git:clone:progress', { percent: 100, message: '✅ Clone concluído!' });
        resolve({ success: true, path: destPath });
      } else {
        resolve({ success: false, error: `Processo encerrou com código ${code}` });
      }
    });

    process.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
};

export const getGitCommitDiff = async (commitHash: string, path: string): Promise<string> => {
  try {
    // Retorna o diff do arquivo específico naquele commit
    return await runGit(`show "${commitHash}" -- "${path}"`);
  } catch (error) {
    return '';
  }
};
