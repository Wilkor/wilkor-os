import { ipcMain, dialog } from 'electron';
import * as git from '../utils/git';

export function registerGitHandlers(getWin: () => any) {
  ipcMain.handle('git:status', async () => {
    return await git.getGitStatus();
  });

  ipcMain.handle('git:stage', async (_event, { path }) => {
    try {
      await git.gitStageFile(path);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:unstage', async (_event, { path }) => {
    try {
      await git.gitUnstageFile(path);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:commit', async (_event, { message }) => {
    try {
      await git.gitCommit(message);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:diff', async (_event, { path }) => {
    try {
      const diff = await git.getGitDiff(path);
      return { success: true, diff };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:push', async () => {
    try {
      await git.gitPush();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:pull', async () => {
    try {
      await git.gitPull();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:fetch', async () => {
    try {
      await git.gitFetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:stage-all', async () => {
    try {
      await git.gitStageAll();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:unstage-all', async () => {
    try {
      await git.gitUnstageAll();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:get-branches', async () => {
    try {
      const branches = await git.gitGetBranches();
      return { success: true, ...branches };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:checkout', async (_event, { branch, options }) => {
    try {
      await git.gitCheckout(branch, options);
      const mainWindow = getWin();
      if (mainWindow) {
        mainWindow.webContents.send('workspace:updated');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:create-branch', async (_event, { branch }) => {
    try {
      await git.gitCreateBranch(branch);
      const mainWindow = getWin();
      if (mainWindow) {
        mainWindow.webContents.send('workspace:updated');
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:set-root', async (_event, { path }) => {
    try {
      git.setGitProjectRoot(path);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:clone', async (_event, { url }) => {
    const mainWindow = getWin();
    if (!mainWindow) return { success: false, error: 'Janela não disponível' };

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Escolha a pasta onde o repositório será clonado',
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }

    const destFolder = result.filePaths[0];
    const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';
    const destPath = `${destFolder}\\${repoName}`;

    try {
      const cloneResult = await git.gitClone(url, destPath, mainWindow);

      if (cloneResult.success) {
        const { addRoot } = await import('../utils/fs');
        addRoot(destPath);
        mainWindow.webContents.send('workspace:updated');
      }

      return cloneResult;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('git:commit-diff', async (_event, { commitHash, path }) => {
    try {
      const diff = await git.getGitCommitDiff(commitHash, path);
      return { success: true, diff };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
