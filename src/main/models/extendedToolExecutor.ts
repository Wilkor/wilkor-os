import * as fsExtended from '../utils/fsExtended';
import { BrowserWindow } from 'electron';
import { getFullPath } from '../utils/fs';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

async function notifyEditorOfWrittenFile(path: string) {
  try {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    const fullPath = getFullPath(path);
    if (existsSync(fullPath)) {
      const content = await readFile(fullPath, 'utf8');
      win.webContents.send('agent:fileWritten', { path, content });
    }
  } catch (e) {
    console.error(`[extendedToolExecutor] Erro ao notificar editor do arquivo ${path}:`, e);
  }
}

export async function executeExtendedAgentTool(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'searchInFile': {
        if (!args.path || !args.pattern) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path ou pattern.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.searchInFile(args.path, args.pattern, args.isRegex, args.caseSensitive);
        return JSON.stringify(result);
      }
      case 'searchInProject': {
        if (!args.directory || !args.pattern) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: directory ou pattern.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.searchInProject(args.directory, args.pattern, args.isRegex, args.fileExtensions, args.excludeDirs);
        return JSON.stringify(result);
      }
      case 'getFileLines': {
        if (!args.path || args.startLine === undefined || args.endLine === undefined) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path, startLine ou endLine.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.getFileLines(args.path, args.startLine, args.endLine);
        return JSON.stringify(result);
      }
      case 'replaceInFile': {
        if (!args.path || !args.search || args.replace === undefined) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path, search ou replace.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.replaceInFile(args.path, args.search, args.replace, args.isRegex, args.replaceAll);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.path);
        }
        return JSON.stringify(result);
      }
      case 'replaceLineInFile': {
        if (!args.path || args.lineNumber === undefined || args.newContent === undefined) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path, lineNumber ou newContent.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.replaceLineInFile(args.path, args.lineNumber, args.newContent);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.path);
        }
        return JSON.stringify(result);
      }
      case 'insertLineInFile': {
        if (!args.path || args.lineNumber === undefined || args.content === undefined) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path, lineNumber ou content.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.insertLineInFile(args.path, args.lineNumber, args.content);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.path);
        }
        return JSON.stringify(result);
      }
      case 'deleteLineInFile': {
        if (!args.path || args.startLine === undefined) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path ou startLine.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.deleteLineInFile(args.path, args.startLine, args.endLine);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.path);
        }
        return JSON.stringify(result);
      }
      case 'appendToFile': {
        if (!args.path || args.content === undefined) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: path ou content.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.appendToFile(args.path, args.content, args.newLine);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.path);
        }
        return JSON.stringify(result);
      }
      case 'getFileInfo': {
        if (!args.path) {
          return JSON.stringify({ success: false, error: 'Parâmetro obrigatório ausente: path.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.getFileInfo(args.path);
        return JSON.stringify(result);
      }
      case 'moveFile': {
        if (!args.sourcePath || !args.destinationPath) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: sourcePath ou destinationPath.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.moveFile(args.sourcePath, args.destinationPath, args.overwrite);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.destinationPath);
        }
        return JSON.stringify(result);
      }
      case 'copyFile': {
        if (!args.sourcePath || !args.destinationPath) {
          return JSON.stringify({ success: false, error: 'Parâmetros obrigatórios ausentes: sourcePath ou destinationPath.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.copyExtendedFile(args.sourcePath, args.destinationPath, args.overwrite);
        if (result && result.success) {
          await notifyEditorOfWrittenFile(args.destinationPath);
        }
        return JSON.stringify(result);
      }
      case 'createDirectory': {
        if (!args.path) {
          return JSON.stringify({ success: false, error: 'Parâmetro obrigatório ausente: path.', code: 'INVALID_PATH' });
        }
        const result = await fsExtended.createDirectory(args.path, args.recursive);
        return JSON.stringify(result);
      }
      default: {
        return JSON.stringify({ success: false, error: `Ferramenta estendida desconhecida: ${name}`, code: 'METHOD_NOT_FOUND' });
      }
    }
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message || 'Erro inesperado.',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
}
