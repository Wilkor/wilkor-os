import * as pty from 'node-pty';
import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

function resolveAgyPath(): string | null {
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const defaultWinPath = path.join(localAppData, 'agy', 'bin', 'agy.exe');
    if (fs.existsSync(defaultWinPath)) {
      return defaultWinPath;
    }
  }

  const userProfile = process.env.USERPROFILE;
  if (userProfile) {
    const alternativeWinPath = path.join(userProfile, 'AppData', 'Local', 'agy', 'bin', 'agy.exe');
    if (fs.existsSync(alternativeWinPath)) {
      return alternativeWinPath;
    }
  }

  return null;
}

interface PTYInstance {
  id: string;
  process: pty.IPty;
  buffer: string;
}

export class TerminalManager {
  private ptyMap: Map<string, PTYInstance> = new Map();

  constructor(private mainWindow: BrowserWindow) {
    // Default terminal - Agora inicia bloqueado se não houver roots
    const initialCwd = process.cwd();
    this.createPty('default', 'powershell.exe', initialCwd);
  }

  public setWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  public getBuffer(id: string) {
    const pty = this.ptyMap.get(id);
    if (!pty) return '';
    // Remove ANSI escape codes para a IA ler melhor
    return pty.buffer.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
  }

  public input(id: string, data: string) {
    const ptyInstance = this.ptyMap.get(id);
    if (ptyInstance) {
      ptyInstance.process.write(data);
    }
  }

  public resize(id: string, cols: number, rows: number) {
    const ptyInstance = this.ptyMap.get(id);
    if (ptyInstance) {
      try {
        ptyInstance.process.resize(cols, rows);
      } catch (err) {
        console.error('[Terminal] Resize error:', err);
      }
    }
  }

  public create(id: string, shell: string, cwd: string) {
    return this.createPty(id, shell || 'powershell.exe', cwd);
  }

  private createPty(id: string, shell: string, cwd: string) {
    try {
      const systemPath = process.cwd();
      const isSystemPath = cwd.toLowerCase().startsWith(systemPath.toLowerCase());
      
      // Se for o caminho do sistema, só permite se houver algum root ativo que confirme ser para desenvolvimento do wOs (o que o usuário negou)
      // Mas para ser radical conforme o pedido do usuário: Bloqueia se for o systemPath.
      if (isSystemPath) {
        // Em vez de matar o processo, iniciamos em uma pasta neutra ou enviamos mensagem de erro
        cwd = process.env.USERPROFILE || process.env.HOME || 'C:\\'; 
        // No frontend, o Terminal component vai receber via stream que está bloqueado ou redirecionado
      }

      let shellToUse = shell || 'powershell.exe';
      let shouldInstallAgy = false;

      if (id !== 'default') {
        const agyPath = resolveAgyPath();
        if (agyPath) {
          shellToUse = agyPath;
        } else {
          shellToUse = 'powershell.exe';
          shouldInstallAgy = true;
        }
      }

      const ptyProcess = pty.spawn(shellToUse, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: cwd || process.cwd(),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        } as any,
      });

      this.ptyMap.set(id, { id, process: ptyProcess, buffer: '' });

      // Output do processo -> xterm no frontend
      ptyProcess.onData((data) => {
        const pty = this.ptyMap.get(id);
        if (pty) {
          pty.buffer += data;
          // Limita o buffer nas últimas 10k chars aprox
          if (pty.buffer.length > 10000) {
            pty.buffer = pty.buffer.slice(-10000);
          }
        }
        this.mainWindow.webContents.send(`terminal:data:${id}`, data);
      });

      ptyProcess.onExit(({ exitCode, signal: _signal }) => {
        this.mainWindow.webContents.send(`terminal:data:${id}`, `\r\n[Processo encerrado com código ${exitCode}]\r\n`);
        this.mainWindow.webContents.send(`terminal:exit:${id}`);
        this.ptyMap.delete(id);
      });

      // Dispara a instalação automática do agy se não for encontrado
      if (shouldInstallAgy) {
        setTimeout(() => {
          const currentPty = this.ptyMap.get(id);
          if (currentPty) {
            console.log(`[Terminal] CLI do Antigravity não encontrado. Iniciando instalação no terminal ${id}`);
            currentPty.process.write('irm https://antigravity.google/cli/install.ps1 | iex\r\n');
          }
        }, 1000);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Terminal] Create error:', err);
      if (this.mainWindow) {
        this.mainWindow.webContents.send(`terminal:data:${id}`, `\r\n\x1b[31m❌ Falha crítica ao iniciar terminal: ${err.message}\x1b[0m\r\n`);
      }
      return { success: false, error: err.message };
    }
  }

  public restart(id: string, newCwd: string, shell: string = 'powershell.exe') {
    this.kill(id);
    this.createPty(id, shell, newCwd);
  }

  public kill(id: string) {
    const ptyInstance = this.ptyMap.get(id);
    if (ptyInstance) {
      ptyInstance.process.kill();
      this.ptyMap.delete(id);
    }
  }

  public killAll() {
    for (const id of this.ptyMap.keys()) {
      this.kill(id);
    }
  }

  public sendCommand(command: string) {
    console.log(`[TerminalManager] Enviando comando: ${command}`);
    const ptyInstance = this.ptyMap.get('default');
    if (ptyInstance) {
      // Notifica o frontend que o log a seguir pertence a um comando do agente
      this.mainWindow.webContents.send('agent:commandLogStart', { command });
      ptyInstance.process.write(command + '\r\n');
    } else if (this.ptyMap.size > 0) {
      const firstId = this.ptyMap.keys().next().value;
      if (firstId) {
        const first = this.ptyMap.get(firstId);
        if (first) {
          console.log(`[TerminalManager] Usando terminal alternativo: ${firstId}`);
          this.mainWindow.webContents.send('agent:commandLogStart', { command });
          first.process.write(command + '\r\n');
        }
      }
    } else {
      console.warn('[TerminalManager] Nenhum terminal disponível para enviar comando.');
    }
  }
}
