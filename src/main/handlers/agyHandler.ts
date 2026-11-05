import { ipcMain } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import Store from 'electron-store';

const store = new Store(
  process.versions.electron 
    ? undefined 
    : ({ projectName: 'wilkor-os' } as any)
);

let currentProcess: ChildProcess | null = null;

export function resolveAgyPath(): string {
  // 1. Tenta obter o caminho personalizado do store
  const storedPath = store.get('agyPath') as string;
  if (storedPath && fs.existsSync(storedPath)) {
    return storedPath;
  }

  // 2. Tenta resolver a partir de LOCALAPPDATA do Windows
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const defaultWinPath = path.join(localAppData, 'agy', 'bin', 'agy.exe');
    if (fs.existsSync(defaultWinPath)) {
      return defaultWinPath;
    }
  }

  // 3. Tenta resolver do perfil de usuário caso o anterior falhe
  const userProfile = process.env.USERPROFILE;
  if (userProfile) {
    const alternativeWinPath = path.join(userProfile, 'AppData', 'Local', 'agy', 'bin', 'agy.exe');
    if (fs.existsSync(alternativeWinPath)) {
      return alternativeWinPath;
    }
  }

  // Se tudo falhar, assume que está global no PATH (o executável 'agy')
  return 'agy';
}

export function registerAgyHandlers(getWin: () => any) {
  ipcMain.handle('agy:run', async (_event, { workspacePath, prompt, skipPermissions = true }) => {
    // 1. Se já existir um processo rodando, encerra ele antes de começar outro
    if (currentProcess) {
      try {
        currentProcess.kill('SIGINT');
      } catch (err) {
        console.error('[AgyHandler] Falha ao interromper processo anterior:', err);
      }
      currentProcess = null;
    }

    const mainWindow = getWin();
    if (!mainWindow) {
      return { success: false, error: 'MainWindow não disponível.' };
    }

    const agyExecutable = resolveAgyPath();
    const args = ['--prompt', prompt];
    if (skipPermissions) {
      args.push('--dangerously-skip-permissions');
    }

    console.log(`[AgyHandler] Iniciando agy em: ${workspacePath}`);
    console.log(`[AgyHandler] Executável: ${agyExecutable}`);
    console.log(`[AgyHandler] Argumentos:`, args);

    try {
      currentProcess = spawn(agyExecutable, args, {
        cwd: workspacePath,
        shell: true,
        env: {
          ...process.env,
          PAGER: 'cat', // Desabilita o paginador interativo (evita travar)
          FORCE_COLOR: '1' // Tenta preservar as cores no log
        }
      });

      // Stream do stdout
      currentProcess.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        mainWindow.webContents.send('agy:data', { text, type: 'stdout' });
      });

      // Stream do stderr
      currentProcess.stderr?.on('data', (chunk) => {
        const text = chunk.toString();
        mainWindow.webContents.send('agy:data', { text, type: 'stderr' });
      });

      // Evento de fechamento
      currentProcess.on('close', (code) => {
        console.log(`[AgyHandler] Processo finalizado com código: ${code}`);
        mainWindow.webContents.send('agy:exit', code);
        currentProcess = null;
      });

      currentProcess.on('error', (err) => {
        console.error('[AgyHandler] Erro no processo:', err);
        mainWindow.webContents.send('agy:data', { text: `\r\n❌ Erro ao iniciar processo: ${err.message}\r\n`, type: 'stderr' });
        mainWindow.webContents.send('agy:exit', -1);
        currentProcess = null;
      });

      return { success: true };
    } catch (error: any) {
      console.error('[AgyHandler] Falha ao disparar o agy:', error);
      currentProcess = null;
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('agy:kill', async () => {
    if (currentProcess) {
      try {
        currentProcess.kill('SIGINT');
        const proc = currentProcess;
        setTimeout(() => {
          try {
            proc.kill('SIGKILL');
          } catch (e) {}
        }, 1000);
        
        currentProcess = null;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true, message: 'Nenhum processo em execução.' };
  });
}
