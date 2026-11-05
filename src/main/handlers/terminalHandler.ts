import { ipcMain } from 'electron';

export function registerTerminalHandlers(terminalManager: any) {
  ipcMain.handle('terminal:create', async (_event, { id, shell, cwd }) => {
    if (terminalManager) {
      return terminalManager.create(id, shell, cwd);
    }
    return { success: false, error: 'Terminal Manager not available' };
  });

  ipcMain.handle('terminal:kill', async (_event, id) => {
    if (terminalManager) {
      terminalManager.kill(id);
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('terminal:getBuffer', async (_event, id) => {
    if (terminalManager) {
      return terminalManager.getBuffer(id);
    }
    return '';
  });

  ipcMain.on('terminal:input', (_event, { id, data }) => {
    if (terminalManager) {
      terminalManager.input(id, data);
    }
  });

  ipcMain.on('terminal:resize', (_event, { id, cols, rows }) => {
    if (terminalManager) {
      terminalManager.resize(id, cols, rows);
    }
  });
}
