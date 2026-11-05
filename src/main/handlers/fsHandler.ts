import { ipcMain, shell } from 'electron';
import { writeProjectFile, readProjectFile, listProjectFiles, deleteProjectFile } from '../utils/fs';

export function registerFSHandlers() {
  ipcMain.handle('fs:writeFile', async (_event, { path, content }) => {
    try {
      const fullPath = await writeProjectFile(path, content);
      return { success: true, path: fullPath };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:readFile', async (_event, { path }) => {
    try {
      const content = await readProjectFile(path);
      return { success: true, content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:listFiles', async (_event, { path = '.' }) => {
    try {
      const files = await listProjectFiles(path);
      return { success: true, files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:deleteFile', async (_event, { path }) => {
    try {
      await deleteProjectFile(path);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:getTree', async (_event, rootPath) => {
    try {
      const { getRecursiveTree, getProjectRoot } = await import('../utils/fs');
      const tree = await getRecursiveTree(rootPath || getProjectRoot());
      return { success: true, tree };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:mkdir', async (_event, { path }) => {
    try {
      const { mkdir } = await import('fs/promises');
      const { getFullPath } = await import('../utils/fs');
      const fullPath = getFullPath(path);
      await mkdir(fullPath, { recursive: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:rename', async (_event, { oldPath, newPath }) => {
    try {
      const { rename } = await import('fs/promises');
      const { getFullPath } = await import('../utils/fs');
      const fullOldPath = getFullPath(oldPath);
      const fullNewPath = getFullPath(newPath);
      await rename(fullOldPath, fullNewPath);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:getStats', async (_event, { path }) => {
    try {
      const { stat } = await import('fs/promises');
      const { getFullPath } = await import('../utils/fs');
      const fullPath = getFullPath(path);
      const stats = await stat(fullPath);
      return JSON.parse(JSON.stringify({ 
        success: true, 
        stats: {
          size: stats.size,
          birthtime: stats.birthtime,
          mtime: stats.mtime,
          isDirectory: stats.isDirectory()
        } 
      }));
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:reveal', async (_event, { path }) => {
    try {
      shell.showItemInFolder(path);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:resolveImport', async (_event, { importPath, fromFile }) => {
    try {
      const { existsSync } = await import('fs');
      const { dirname, resolve, join, extname } = await import('path');

      const dir = dirname(fromFile);
      const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.css', '.json', '.vue', '.svelte'];
      const INDEX_FILES = EXTENSIONS.map(ext => `index${ext}`);

      if (importPath.startsWith('.')) {
        const basePath = resolve(dir, importPath);
        if (extname(basePath) && existsSync(basePath)) return { success: true, resolvedPath: basePath };
        for (const ext of EXTENSIONS) {
          const candidate = basePath + ext;
          if (existsSync(candidate)) return { success: true, resolvedPath: candidate };
        }
        for (const indexFile of INDEX_FILES) {
          const candidate = join(basePath, indexFile);
          if (existsSync(candidate)) return { success: true, resolvedPath: candidate };
        }
        return { success: false, error: `Arquivo não encontrado: ${importPath}` };
      }

      if (importPath.startsWith('@/') || importPath.startsWith('~/')) {
        const { getRoots } = await import('../utils/fs');
        const roots = getRoots();
        const repoRoot = roots.find(r => fromFile.startsWith(r));
        if (repoRoot) {
          const aliasPath = importPath.replace(/^[@~]\//, '');
          const srcBases = ['src', '.'];
          for (const srcBase of srcBases) {
            const basePath = join(repoRoot, srcBase, aliasPath);
            if (extname(basePath) && existsSync(basePath)) return { success: true, resolvedPath: basePath };
            for (const ext of EXTENSIONS) {
              const candidate = basePath + ext;
              if (existsSync(candidate)) return { success: true, resolvedPath: candidate };
            }
            for (const indexFile of INDEX_FILES) {
              const candidate = join(basePath, indexFile);
              if (existsSync(candidate)) return { success: true, resolvedPath: candidate };
            }
          }
        }
        return { success: false, error: `Alias não resolvido: ${importPath}` };
      }
      return { success: false, error: 'Importação de pacote externo (node_modules)' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
