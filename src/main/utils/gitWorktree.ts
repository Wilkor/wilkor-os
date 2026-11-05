import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface WorktreeInfo {
  taskId: string;
  path: string;
  branch: string;
}

/**
 * Cria um diretório Git Worktree dedicado e isolado para um agente trabalhar.
 * @param repoPath Caminho absoluto do repositório Git principal.
 * @param taskId ID único da tarefa.
 * @param branchName Nome da branch a ser criada ou associada.
 */
export async function createWorktree(
  repoPath: string,
  taskId: string,
  branchName: string
): Promise<string> {
  const worktreesDir = path.join(repoPath, '.wos-worktrees');
  const targetPath = path.join(worktreesDir, `wt-${taskId}`);

  // Garante que o diretório .wos-worktrees existe
  await fs.mkdir(worktreesDir, { recursive: true });

  // Adiciona .wos-worktrees ao .gitignore do repositório principal para não subir acidentalmente
  try {
    const gitignorePath = path.join(repoPath, '.gitignore');
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8').catch(() => '');
    if (!gitignoreContent.includes('.wos-worktrees')) {
      const separator = gitignoreContent.endsWith('\n') || gitignoreContent.length === 0 ? '' : '\n';
      await fs.writeFile(gitignorePath, `${gitignoreContent}${separator}\n# wOs Agent Worktrees\n.wos-worktrees/\n`);
      console.log('[GitWorktree] Adicionado .wos-worktrees ao .gitignore');
    }
  } catch (err) {
    console.warn('[GitWorktree] Erro ao atualizar .gitignore:', err);
  }

  // Verifica se a branch local ou remota já existe
  let branchExists = false;
  try {
    const { stdout } = await execAsync(`git branch -a`, { cwd: repoPath });
    const cleanBranch = branchName.replace('origin/', '');
    branchExists = stdout.split('\n').some(line => line.trim().endsWith(cleanBranch));
  } catch (err) {
    console.warn('[GitWorktree] Erro ao listar branches:', err);
  }

  console.log(`[GitWorktree] Criando worktree em "${targetPath}" na branch "${branchName}" (Branch existe: ${branchExists})`);

  // Executa o comando de criação do worktree
  try {
    if (branchExists) {
      // Se a branch já existe, associa o worktree a ela
      await execAsync(`git worktree add "${targetPath}" "${branchName}"`, { cwd: repoPath });
    } else {
      // Se não existe, cria a branch a partir da HEAD atual
      await execAsync(`git worktree add -b "${branchName}" "${targetPath}"`, { cwd: repoPath });
    }
  } catch (error: any) {
    console.error('[GitWorktree] Erro ao rodar git worktree add:', error.message);
    // Fallback: se der erro de branch já existente, tenta criar sem a flag -b
    try {
      await execAsync(`git worktree add "${targetPath}" "${branchName}"`, { cwd: repoPath });
    } catch (fallbackError: any) {
      throw new Error(`Falha ao criar git worktree: ${fallbackError.message || error.message}`);
    }
  }

  return targetPath;
}

/**
 * Realiza o commit e o push das alterações no worktree.
 */
export async function commitAndPushWorktree(
  worktreePath: string,
  commitMessage: string,
  branchName: string
): Promise<void> {
  console.log(`[GitWorktree] Fazendo commit & push no worktree: "${worktreePath}"`);
  
  try {
    // 1. Git add
    await execAsync('git add .', { cwd: worktreePath });
    
    // 2. Verifica se há mudanças para commitar
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: worktreePath });
    if (!status.trim()) {
      console.log('[GitWorktree] Nenhuma alteração pendente para commitar no worktree.');
      return;
    }

    // 3. Git commit
    await execAsync(`git commit -m "${commitMessage}"`, { cwd: worktreePath });

    // 4. Git push
    await execAsync(`git push --set-upstream origin "${branchName}"`, { cwd: worktreePath });
    console.log(`[GitWorktree] Commit e Push concluídos para a branch "${branchName}"`);
  } catch (error: any) {
    console.error(`[GitWorktree] Erro durante commit/push no worktree:`, error.message);
    throw error;
  }
}

/**
 * Remove o worktree e limpa os diretórios.
 */
export async function removeWorktree(repoPath: string, worktreePath: string): Promise<void> {
  console.log(`[GitWorktree] Removendo worktree em "${worktreePath}" no repositório "${repoPath}"`);
  
  try {
    // Remove o worktree via Git
    await execAsync(`git worktree remove --force "${worktreePath}"`, { cwd: repoPath });
    
    // Limpa metadados do git
    await execAsync('git worktree prune', { cwd: repoPath });
  } catch (error: any) {
    console.error(`[GitWorktree] Erro ao remover worktree via git:`, error.message);
  }

  // Garante a remoção da pasta do disco se ainda sobrou algo
  try {
    await fs.rm(worktreePath, { recursive: true, force: true });
  } catch (err: any) {
    console.warn(`[GitWorktree] Erro ao forçar remoção da pasta física do worktree:`, err.message);
  }
}
