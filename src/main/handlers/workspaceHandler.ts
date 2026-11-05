import { ipcMain, dialog } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import chokidar from 'chokidar';
import * as git from '../utils/git';
import Store from 'electron-store';
import { wosHandler } from './wosHandler';

const store = new Store(
  process.versions.electron 
    ? undefined 
    : ({ projectName: 'wilkor-os' } as any)
);

let watchers: Map<string, chokidar.FSWatcher> = new Map();

export function setupWatcher(path: string, mainWindow: any) {
  if (watchers.has(path)) return;
  const watcher = chokidar.watch(path, {
    ignored: /(^|[\/\\])\..|node_modules|dist|out|build/,
    persistent: true,
    ignoreInitial: true
  });
  watcher.on('all', (event, filePath) => {
    if (mainWindow) {
      mainWindow.webContents.send('workspace:updated', { event, path: filePath });
    }
  });
  watchers.set(path, watcher);
}

export function registerWorkspaceHandlers(getWin: () => any, terminalManager: any) {
  ipcMain.handle('workspace:getContext', async () => {
    const { getRoots } = await import('../utils/fs');
    const roots = getRoots();
    const CONTEXT_FILES = [
      'sdd.md', 'SDD.md', 'skill.md', 'SKILL.md', 'roles.md', 'ROLES.md',
      'AGENTS.md', 'agents.md', 'CLAUDE.md', 'claude.md', 'README.md', 'readme.md',
      'package.json', '.wilkor/context.md', 'docs/architecture.md', 'docs/sdd.md',
    ];
    const projectContexts: any[] = [];
    for (const root of roots) {
      const files: any[] = [];
      const brain: any[] = [];
      const seen = new Set<string>();
      for (const fileName of CONTEXT_FILES) {
        const fullPath = join(root, fileName);
        if (seen.has(fullPath.toLowerCase()) || !existsSync(fullPath)) continue;
        seen.add(fullPath.toLowerCase());
        try {
          const raw = await readFile(fullPath, 'utf-8');
          files.push({ name: fileName, content: fileName === 'package.json' ? raw.slice(0, 2000) : raw.slice(0, 8000) });
        } catch (_) {}
      }
      const brainPath = join(root, '.brain');
      if (existsSync(brainPath)) {
        try {
          const entries = await readdir(brainPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
              const raw = await readFile(join(brainPath, entry.name), 'utf-8');
              brain.push({ name: entry.name, content: raw.slice(0, 4000) });
            }
          }
        } catch (_) {}
      }
      projectContexts.push({ root, files, brain });
    }
    return projectContexts;
  });

  const getGlobalSkillsPath = async () => {
    const { getProjectRoot } = await import('../utils/fs');
    const localPath = join(getProjectRoot(), '.agent/skills');
    if (existsSync(localPath)) return localPath;

    const storedPath = store.get('skillsPath') as string;
    if (storedPath && existsSync(storedPath)) return storedPath;

    const userProfile = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\Wilkor';
    const fallbackPath = join(userProfile, '.gemini', 'antigravity', '.agent', 'skills', 'skills');
    if (existsSync(fallbackPath)) return fallbackPath;

    return 'C:\\Users\\Wilkor\\.gemini\\antigravity\\.agent\\skills\\skills';
  };

  ipcMain.handle('workspace:getGlobalSkills', async () => {
    const skillsPath = await getGlobalSkillsPath();
    if (!existsSync(skillsPath)) return [];
    try {
      const items = await readdir(skillsPath, { withFileTypes: true });
      return items.filter(item => item.isDirectory()).map(item => item.name);
    } catch (_) { return []; }
  });

  ipcMain.handle('workspace:getSkillContent', async (_event, skillName: string) => {
    const skillsPath = await getGlobalSkillsPath();
    const skillDir = join(skillsPath, skillName);
    if (!existsSync(skillDir)) return null;
    const possibleFiles = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];
    for (const file of possibleFiles) {
      const fullPath = join(skillDir, file);
      if (existsSync(fullPath)) {
        try { return await readFile(fullPath, 'utf-8'); } catch (_) {}
      }
    }
    return null;
  });

  ipcMain.handle('workspace:set', async (_event, newPath) => {
    try {
      if (!existsSync(newPath)) return { success: false, error: 'Caminho não existe.' };
      const { setProjectRoot } = await import('../utils/fs');
      setProjectRoot(newPath);
      git.setGitProjectRoot(newPath);
      const mainWindow = getWin();
      setupWatcher(newPath, mainWindow);
      if (terminalManager) terminalManager.restart('default', newPath);
      return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
  });

  ipcMain.handle('workspace:addFolder', async (_event, targetPath?: string) => {
    const mainWindow = getWin();
    if (!mainWindow) return { success: false };
    
    let newPath = targetPath;
    
    if (!newPath) {
      const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
      if (result.canceled || result.filePaths.length === 0) return { success: false };
      newPath = result.filePaths[0];
    }
    
    if (newPath && existsSync(newPath)) {
      const { addRoot } = await import('../utils/fs');
      addRoot(newPath);
      setupWatcher(newPath, mainWindow);
      return { success: true, path: newPath };
    }
    return { success: false, error: 'Diretório não encontrado ou inválido.' };
  });

  ipcMain.handle('workspace:removeFolder', async (_event, path) => {
    const { removeRoot } = await import('../utils/fs');
    removeRoot(path);
    if (watchers.has(path)) {
      await watchers.get(path)?.close();
      watchers.delete(path);
    }
    return { success: true };
  });

  ipcMain.handle('workspace:getRoots', async () => {
    const { getRoots } = await import('../utils/fs');
    return getRoots();
  });

  // WOS Skills handlers
  ipcMain.handle('workspace:listWosSkills', async () => {
    return await wosHandler.listItems('skills');
  });

  ipcMain.handle('workspace:getWosSkill', async (_event, name: string) => {
    return await wosHandler.getItem('skills', name);
  });

  ipcMain.handle('workspace:createWosSkill', async (_event, name: string, description: string, instructions: string) => {
    const content = `---
description: ${description}
---

${instructions}`;
    return await wosHandler.createItem('skills', name, content, 'SKILL.md');
  });

  ipcMain.handle('workspace:updateWosSkill', async (_event, name: string, description: string, instructions: string) => {
    const content = `---
description: ${description}
---

${instructions}`;
    return await wosHandler.updateItem('skills', name, content, 'SKILL.md');
  });

  ipcMain.handle('workspace:deleteWosSkill', async (_event, name: string) => {
    return await wosHandler.deleteItem('skills', name);
  });

  ipcMain.handle('workspace:validateWosSkill', async (_event, content: string) => {
    return wosHandler.validateItem('skills', content);
  });

  // WOS Rules handlers
  ipcMain.handle('workspace:listWosRules', async () => {
    return await wosHandler.listItems('rules');
  });

  ipcMain.handle('workspace:getWosRule', async (_event, name: string) => {
    return await wosHandler.getItem('rules', name);
  });

  ipcMain.handle('workspace:createWosRule', async (_event, name: string, trigger: string, priority: number, instructions: string) => {
    const content = `---
trigger: ${trigger}
priority: ${priority}
---

${instructions}`;
    return await wosHandler.createItem('rules', name, content, 'RULE.md');
  });

  ipcMain.handle('workspace:updateWosRule', async (_event, name: string, trigger: string, priority: number, instructions: string) => {
    const content = `---
trigger: ${trigger}
priority: ${priority}
---

${instructions}`;
    return await wosHandler.updateItem('rules', name, content, 'RULE.md');
  });

  ipcMain.handle('workspace:deleteWosRule', async (_event, name: string) => {
    return await wosHandler.deleteItem('rules', name);
  });

  ipcMain.handle('workspace:validateWosRule', async (_event, content: string) => {
    return wosHandler.validateItem('rules', content);
  });

  // WOS Workflows handlers
  ipcMain.handle('workspace:listWosWorkflows', async () => {
    return await wosHandler.listItems('workflows');
  });

  ipcMain.handle('workspace:getWosWorkflow', async (_event, name: string) => {
    return await wosHandler.getItem('workflows', name);
  });

  ipcMain.handle('workspace:createWosWorkflow', async (_event, name: string, trigger: string, steps: string) => {
    const content = `---
trigger: ${trigger}
---

${steps}`;
    return await wosHandler.createItem('workflows', name, content, 'WORKFLOW.md');
  });

  ipcMain.handle('workspace:updateWosWorkflow', async (_event, name: string, trigger: string, steps: string) => {
    const content = `---
trigger: ${trigger}
---

${steps}`;
    return await wosHandler.updateItem('workflows', name, content, 'WORKFLOW.md');
  });

  ipcMain.handle('workspace:deleteWosWorkflow', async (_event, name: string) => {
    return await wosHandler.deleteItem('workflows', name);
  });

  ipcMain.handle('workspace:validateWosWorkflow', async (_event, content: string) => {
    return wosHandler.validateItem('workflows', content);
  });
}
