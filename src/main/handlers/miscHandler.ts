import { ipcMain, shell } from 'electron';
import Store from 'electron-store';
import { modelManager } from '../models/manager';
import { writeProjectFile, getRoots } from '../utils/fs';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync, readFileSync } from 'fs';

const store = new Store();

export function registerMiscHandlers(terminalManager: any) {
  // Settings Handlers
  ipcMain.handle('settings:save', async (_event, settings) => {
    try {
      Object.entries(settings).forEach(([key, value]) => {
        (store as any).set(key, value);
      });
      modelManager.refreshProviders();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:get', async () => {
    return (store as any).store;
  });

  // Agent Activity Handlers
  ipcMain.handle('agent:applyFileEdit', async (_event, { path, content }) => {
    try {
      await writeProjectFile(path, content);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('agent:runCommand', async (_event, { command }) => {
    if (command.trim().startsWith('createImage')) {
      try {
        const cmdStr = command.trim();
        const descMatch = cmdStr.match(/--(?:description|prompt)\s+["']([^"']+)["']/i) || cmdStr.match(/--(?:description|prompt)\s+(\S+)/i);
        const styleMatch = cmdStr.match(/--style\s+["']([^"']+)["']/i) || cmdStr.match(/--style\s+(\S+)/i);
        const outputMatch = cmdStr.match(/--output\s+["']([^"']+)["']/i) || cmdStr.match(/--output\s+(\S+)/i);

        const description = descMatch ? descMatch[1] : '';
        const style = styleMatch ? styleMatch[1] : '';
        const output = outputMatch ? outputMatch[1] : '';

        if (!description) {
          return { success: false, error: 'O comando createImage requer o argumento --description "..."' };
        }

        const { generateImage } = await import('../utils/imageGenerator');
        const res = await generateImage(description, style, output);
        if (res.success) {
          return { success: true, output: `Imagem gerada com sucesso e salva em: ${res.filePath}` };
        } else {
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    if (terminalManager) {
      try {
        terminalManager.sendCommand(command);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Terminal Manager não disponível' };
  });

  // Discord Direct Notification Handler
  ipcMain.handle('discord:send', async (_event, { message, channelId, filePath }) => {
    try {
      const { sendDiscordMessage } = await import('../utils/discordHandler');
      return await sendDiscordMessage(message, channelId, undefined, filePath);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Obter artefatos gerados (imagens e PDFs)
  ipcMain.handle('workspace:getArtifacts', async () => {
    try {
      const artifacts: any[] = [];

      // 1. Buscar na pasta local 'artifacts' do wOs
      const localArtifactsDir = join(process.cwd(), 'artifacts');
      if (existsSync(localArtifactsDir)) {
        const files = await readdir(localArtifactsDir);
        for (const file of files) {
          const fullPath = join(localArtifactsDir, file);
          const stats = await stat(fullPath);
          if (stats.isFile()) {
            artifacts.push({
              name: file,
              path: fullPath,
              size: stats.size,
              mtime: stats.mtimeMs,
              source: 'local_artifacts',
              type: extname(file).toLowerCase()
            });
          }
        }
      }

      return { success: true, artifacts: artifacts.sort((a, b) => b.mtime - a.mtime) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Abrir arquivo nativamente no SO
  ipcMain.handle('workspace:openFileInSystem', async (_event, { path: filePath }) => {
    try {
      if (existsSync(filePath)) {
        await shell.openPath(filePath);
        return { success: true };
      }
      return { success: false, error: 'Arquivo não encontrado' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Obter miniatura em base64 para imagens locais
  ipcMain.handle('workspace:getFileThumbnail', async (_event, { path: filePath }) => {
    try {
      const { resolve } = await import('path');
      const { readFileSync } = await import('fs');
      const resolvedPath = resolve(filePath);
      
      const localArtifactsDir = resolve(process.cwd(), 'artifacts');
      const isLocalArtifact = resolvedPath.startsWith(localArtifactsDir);
      const roots = getRoots();
      const isInRoots = roots.some(root => resolvedPath.startsWith(resolve(root)));
      
      if (!isLocalArtifact && !isInRoots) {
        return { success: false, error: 'Acesso negado: Caminho fora do workspace' };
      }
      
      if (existsSync(resolvedPath)) {
        const fileContent = readFileSync(resolvedPath);
        const ext = extname(resolvedPath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
        const base64 = fileContent.toString('base64');
        return { success: true, thumbnail: `data:${mimeType};base64,${base64}` };
      }
      return { success: false, error: 'Arquivo não encontrado' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Excluir artefato com validação de segurança
  ipcMain.handle('workspace:deleteArtifact', async (_event, { path: filePath }) => {
    try {
      const { resolve } = await import('path');
      const { unlink } = await import('fs/promises');
      const resolvedPath = resolve(filePath);
      
      const localArtifactsDir = resolve(process.cwd(), 'artifacts');
      const isLocalArtifact = resolvedPath.startsWith(localArtifactsDir);
      const roots = getRoots();
      const isInRoots = roots.some(root => resolvedPath.startsWith(resolve(root)));
      
      if (!isLocalArtifact && !isInRoots) {
        return { success: false, error: 'Acesso negado: Caminho fora do workspace' };
      }
      
      if (existsSync(resolvedPath)) {
        await unlink(resolvedPath);
        return { success: true };
      }
      return { success: false, error: 'Arquivo não encontrado' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Obter conteúdo de artefato para preview
  ipcMain.handle('workspace:getArtifactContent', async (_event, { path: filePath }) => {
    try {
      const { resolve } = await import('path');
      const resolvedPath = resolve(filePath);
      
      const localArtifactsDir = resolve(process.cwd(), 'artifacts');
      const isLocalArtifact = resolvedPath.startsWith(localArtifactsDir);
      const roots = getRoots();
      const isInRoots = roots.some(root => resolvedPath.startsWith(resolve(root)));
      
      if (!isLocalArtifact && !isInRoots) {
        return { success: false, error: 'Acesso negado: Caminho fora do workspace' };
      }
      
      if (existsSync(resolvedPath)) {
        const { parseDocumentForPreview } = await import('../utils/documentParser');
        const res = await parseDocumentForPreview(resolvedPath);
        return res;
      }
      return { success: false, error: 'Arquivo não encontrado' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:saveArtifact', async (_event, { name, content }) => {
    try {
      const { existsSync, writeFileSync, mkdirSync } = await import('fs');
      const { join } = await import('path');
      const localArtifactsDir = join(process.cwd(), 'artifacts');
      if (!existsSync(localArtifactsDir)) {
        mkdirSync(localArtifactsDir, { recursive: true });
      }
      const fullPath = join(localArtifactsDir, name);
      writeFileSync(fullPath, content, 'utf8');

      // Notificar o frontend de que o workspace foi atualizado
      try {
        _event.sender.send('workspace:updated');
      } catch (sendErr) {
        console.warn('Erro ao notificar workspace:updated:', sendErr);
      }

      return { success: true, path: fullPath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Buscar menções/contatos do Discord cadastrados
  ipcMain.handle('discord:getMentions', async () => {
    try {
      const configPath = join(process.cwd(), 'discord-mentions.json');
      if (existsSync(configPath)) {
        const fileContent = readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        return { success: true, mentions: parsed };
      }
      return { success: true, mentions: {} };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}

