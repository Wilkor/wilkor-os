import { writeFile, readFile, readdir, unlink, rm, stat } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import Store from 'electron-store';

const store = new Store();
// Multi-root: stored as an array of absolute paths
let activeRoots: string[] = ((store as any).get('workspaceFolders') as string[]) || [];

// Identifica a raiz do próprio sistema wOs para bloqueio de segurança
const SYSTEM_ROOT = resolve(process.cwd());

// Fallback to legacy projectPath if activeRoots is empty
if (activeRoots.length === 0) {
  const legacyPath = (store as any).get('projectPath') as string;
  if (legacyPath && resolve(legacyPath) !== SYSTEM_ROOT) {
    activeRoots = [legacyPath];
  }
}

/**
 * Retorna apenas raízes que não sejam o diretório do sistema wOs
 */
export function getRoots() {
  return activeRoots.filter(r => resolve(r) !== SYSTEM_ROOT);
}

export function addRoot(path: string) {
  const normalizedPath = resolve(path);
  // Bloqueio de segurança: Não permite adicionar o próprio wOs como projeto editável
  if (normalizedPath === SYSTEM_ROOT) {
    console.warn('⚠️ [Segurança] Tentativa de adicionar o núcleo do wOs como root bloqueada.');
    return;
  }
  
  if (!existsSync(normalizedPath) || !require('fs').statSync(normalizedPath).isDirectory()) {
    console.warn(`⚠️ [Workspace] Tentativa de adicionar um arquivo ou caminho inexistente como root: ${normalizedPath}`);
    return;
  }
  
  if (!activeRoots.some(r => resolve(r) === normalizedPath)) {
    activeRoots.push(normalizedPath);
    (store as any).set('workspaceFolders', activeRoots);
  }
}

export function removeRoot(path: string) {
  const normalizedPath = resolve(path);
  activeRoots = activeRoots.filter(r => resolve(r) !== normalizedPath);
  (store as any).set('workspaceFolders', activeRoots);
}

// Para manter compatibilidade com sistemas que esperam uma raiz única "ativa"
export function setProjectRoot(path: string) {
  addRoot(path);
  if (resolve(path) !== SYSTEM_ROOT) {
    (store as any).set('projectPath', path); // Legacy support
  }
}

export function getProjectRoot() {
  const validRoots = getRoots();
  // Se não houver projetos, retorna um caminho nulo/vazio para o terminal e FS saberem que estão bloqueados
  return validRoots[0] || '';
}


/**
 * Resolve path against one of the active roots or treats as absolute
 */
export function getFullPath(path: string, customRoot?: string) {
  // Enhanced absolute path detection for Windows and Posix
  let resolvedPath = path;
  if (!(resolve(path) === path || /^([a-zA-Z]:[\\\/]|\/)/.test(path))) {
    const root = customRoot || getProjectRoot();
    if (!root) throw new Error('Acesso negado: Abra um projeto primeiro.');
    resolvedPath = resolve(root, path);
  } else {
    resolvedPath = resolve(path);
  }
  
  // Bloqueio de Segurança Final: Se o caminho resolvido estiver dentro do SYSTEM_ROOT, bloqueia
  if (resolvedPath.toLowerCase().startsWith(SYSTEM_ROOT.toLowerCase())) {
    throw new Error('Acesso negado: Não é permitido modificar arquivos do sistema wOs.');
  }

  return resolvedPath;
}

export async function writeProjectFile(path: string, content: string, customRoot?: string) {
  if (content === undefined || content === null) {
    console.warn(`⚠️ [FS] Tentativa de escrever no arquivo ${path} com conteúdo nulo/indefinido. Usando string vazia.`);
    content = '';
  }
  
  const fullPath = getFullPath(path, customRoot);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  await writeFile(fullPath, content, 'utf8');
  return fullPath;
}


export async function readProjectFile(path: string, customRoot?: string) {
  const fullPath = getFullPath(path, customRoot);
  return await readFile(fullPath, 'utf8');
}

export async function listProjectFiles(path: string = '.', customRoot?: string) {
  try {
    const fullPath = getFullPath(path, customRoot);
    if (!existsSync(fullPath)) {
      console.warn(`⚠️ [FS] listProjectFiles: Caminho não encontrado: ${fullPath}`);
      return [];
    }
    const files = await readdir(fullPath, { withFileTypes: true });
    return files.map(f => ({
      name: f.name,
      isDirectory: f.isDirectory(),
      path: join(path, f.name)
    }));
  } catch (error) {
    console.error(`❌ [FS] Erro ao executar listProjectFiles no caminho "${path}":`, error);
    return [];
  }
}

/**
 * Optimized for multi-root: returns tree starting from a specific base
 */
export async function getRecursiveTree(rootPath?: string, relPath: string = '.') {
  const base = rootPath || getProjectRoot();
  const fullPath = resolve(base, relPath);
  
  if (!existsSync(fullPath)) return [];
  
  try {
    const entries = await readdir(fullPath, { withFileTypes: true });
    const tree: any[] = [];
    
    const ignoredDirs = [
      '.git', 'node_modules', 'out', 'dist', '.next', '.nuxt', '.expo', 
      'build', 'coverage', '.idea', '.vscode', 'vendor', 'bower_components', '.DS_Store', '.agent'
    ];
    
    for (const entry of entries) {
      if (ignoredDirs.includes(entry.name)) continue;
      
      const currentRelPath = join(relPath, entry.name);
      const currentFullPath = join(base, currentRelPath);

      if (entry.isDirectory()) {
        tree.push({
          name: entry.name,
          isDirectory: true,
          path: currentFullPath,
          children: await getRecursiveTree(base, currentRelPath)
        });
      } else {
        tree.push({
          name: entry.name,
          isDirectory: false,
          path: currentFullPath
        });
      }
    }
    return tree;
  } catch (error) {
    return [];
  }
}

export async function deleteProjectFile(path: string, customRoot?: string) {
  const fullPath = getFullPath(path, customRoot);
  const stats = await stat(fullPath);
  if (stats.isDirectory()) {
    await rm(fullPath, { recursive: true, force: true });
  } else {
    await unlink(fullPath);
  }
}
