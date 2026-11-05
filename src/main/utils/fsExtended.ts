import { writeFile, readFile, readdir, stat, mkdir, rename, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import { getFullPath } from './fs';

export class ExtendedFSError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ExtendedFSError';
  }
}

function handleFSError(error: any): never {
  if (error instanceof ExtendedFSError) throw error;
  const msg = error.message || '';
  if (msg.includes('Acesso negado')) throw new ExtendedFSError(msg, 'PERMISSION_DENIED');
  if (msg.includes('ENOENT')) throw new ExtendedFSError(msg, 'FILE_NOT_FOUND');
  throw new ExtendedFSError(msg, 'INVALID_PATH');
}

export async function searchInFile(path: string, pattern: string, isRegex = false, caseSensitive = true) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const content = await readFile(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const results: any[] = [];

    let regex: RegExp;
    if (isRegex) {
      try {
        regex = new RegExp(pattern, caseSensitive ? '' : 'i');
      } catch (err: any) {
        throw new ExtendedFSError(`Regex inválido: ${err.message}`, 'INVALID_REGEX');
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isRegex) {
        const match = regex!.exec(line);
        if (match) {
          results.push({ lineNumber: i + 1, lineContent: line, matchStart: match.index, matchEnd: match.index + match[0].length });
        }
      } else {
        const targetLine = caseSensitive ? line : line.toLowerCase();
        const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
        const matchStart = targetLine.indexOf(searchPattern);
        if (matchStart !== -1) {
          results.push({ lineNumber: i + 1, lineContent: line, matchStart, matchEnd: matchStart + pattern.length });
        }
      }
    }
    return results;
  } catch (error) { handleFSError(error); }
}

export async function searchInProject(directory: string, pattern: string, isRegex = false, fileExtensions?: string[], excludeDirs?: string[]) {
  try {
    const fullDir = getFullPath(directory);
    if (!existsSync(fullDir)) throw new ExtendedFSError(`Diretório não encontrado: ${directory}`, 'FILE_NOT_FOUND');

    let regex: RegExp;
    if (isRegex) {
      try { regex = new RegExp(pattern); } catch (err: any) { throw new ExtendedFSError(`Regex inválido: ${err.message}`, 'INVALID_REGEX'); }
    }

    const results: any[] = [];
    const absoluteExcludes = (excludeDirs || []).map(d => getFullPath(join(directory, d)).toLowerCase());
    const ignoredDirs = ['.git', 'node_modules', 'dist', 'build', 'out', '.agent', '.next', 'coverage'];

    async function scan(currentDir: string) {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (fullPath.toLowerCase().startsWith(process.cwd().toLowerCase())) {
          if (fullPath.toLowerCase() !== getFullPath(directory).toLowerCase() && !fullPath.toLowerCase().includes('workspace')) {
            continue;
          }
        }
        if (ignoredDirs.includes(entry.name) || absoluteExcludes.includes(fullPath.toLowerCase())) continue;

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          if (fileExtensions && fileExtensions.length > 0) {
            const ext = entry.name.substring(entry.name.lastIndexOf('.'));
            if (!fileExtensions.includes(ext)) continue;
          }
          try {
            const content = await readFile(fullPath, 'utf8');
            const lines = content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (isRegex ? regex.test(line) : line.includes(pattern)) {
                results.push({ filePath: relative(fullDir, fullPath), lineNumber: i + 1, lineContent: line });
              }
            }
          } catch {}
        }
      }
    }
    await scan(fullDir);
    return results;
  } catch (error) { handleFSError(error); }
}

export async function getFileLines(path: string, startLine: number, endLine: number) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const content = await readFile(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const totalLines = lines.length;

    if (startLine < 1 || endLine < startLine || startLine > totalLines) {
      throw new ExtendedFSError(`Intervalo de linhas inválido. Total de linhas: ${totalLines}`, 'LINE_OUT_OF_RANGE');
    }
    return { lines: lines.slice(startLine - 1, Math.min(endLine, totalLines)), totalLines };
  } catch (error) { handleFSError(error); }
}

export async function replaceInFile(path: string, search: string, replace: string, isRegex = false, replaceAll = true) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const originalContent = await readFile(fullPath, 'utf8');
    
    // Detectar quebras de linha originais do Windows (CRLF)
    const useCRLF = originalContent.includes('\r\n');
    
    // Normalizar conteúdo e strings de busca/substituição para \n para matching perfeito
    const content = originalContent.replace(/\r\n/g, '\n');
    const searchPattern = search.replace(/\r\n/g, '\n');
    const replacePattern = replace.replace(/\r\n/g, '\n');
    
    let replacementsCount = 0, newContent = '';

    if (isRegex) {
      try {
        const regex = new RegExp(searchPattern, replaceAll ? 'g' : '');
        replacementsCount = (content.match(regex) || []).length;
        newContent = content.replace(regex, replacePattern);
      } catch (err: any) { throw new ExtendedFSError(`Regex inválido: ${err.message}`, 'INVALID_REGEX'); }
    } else {
      if (replaceAll) {
        const escaped = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        replacementsCount = (content.match(regex) || []).length;
        newContent = content.replace(regex, replacePattern);
      } else {
        const idx = content.indexOf(searchPattern);
        if (idx !== -1) {
          replacementsCount = 1;
          newContent = content.replace(searchPattern, replacePattern);
        } else { newContent = content; }
      }
    }
    
    if (replacementsCount > 0) {
      // Reconverter para CRLF se o arquivo original utilizava CRLF
      const finalContent = useCRLF ? newContent.replace(/\n/g, '\r\n') : newContent;
      await writeFile(fullPath, finalContent, 'utf8');
    }
    return { replacementsCount, success: true };
  } catch (error) { handleFSError(error); }
}

export async function replaceLineInFile(path: string, lineNumber: number, newContent: string) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const content = await readFile(fullPath, 'utf8');
    const useCRLF = content.includes('\r\n');
    const separator = useCRLF ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    if (lineNumber < 1 || lineNumber > lines.length) {
      throw new ExtendedFSError(`Linha ${lineNumber} fora do intervalo. Total: ${lines.length}`, 'LINE_OUT_OF_RANGE');
    }
    const previousContent = lines[lineNumber - 1];
    lines[lineNumber - 1] = newContent;
    await writeFile(fullPath, lines.join(separator), 'utf8');
    return { success: true, previousContent };
  } catch (error) { handleFSError(error); }
}

export async function insertLineInFile(path: string, lineNumber: number, content: string) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const fileContent = await readFile(fullPath, 'utf8');
    const useCRLF = fileContent.includes('\r\n');
    const separator = useCRLF ? '\r\n' : '\n';
    const lines = fileContent.split(/\r?\n/);
    if (lineNumber < 1 || lineNumber > lines.length + 1) {
      throw new ExtendedFSError(`Linha ${lineNumber} inválida para inserção. Limite: 1 a ${lines.length + 1}`, 'LINE_OUT_OF_RANGE');
    }
    lines.splice(lineNumber - 1, 0, content);
    await writeFile(fullPath, lines.join(separator), 'utf8');
    return { success: true, newTotalLines: lines.length };
  } catch (error) { handleFSError(error); }
}

export async function deleteLineInFile(path: string, startLine: number, endLine?: number) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const content = await readFile(fullPath, 'utf8');
    const useCRLF = content.includes('\r\n');
    const separator = useCRLF ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    const finalEnd = endLine ?? startLine;
    if (startLine < 1 || finalEnd < startLine || finalEnd > lines.length) {
      throw new ExtendedFSError(`Intervalo ${startLine}-${finalEnd} fora do limite. Total: ${lines.length}`, 'LINE_OUT_OF_RANGE');
    }
    const count = finalEnd - startLine + 1;
    lines.splice(startLine - 1, count);
    await writeFile(fullPath, lines.join(separator), 'utf8');
    return { success: true, deletedLines: count };
  } catch (error) { handleFSError(error); }
}

export async function appendToFile(path: string, content: string, newLine = true) {
  try {
    const fullPath = getFullPath(path);
    const exists = existsSync(fullPath);
    const previousContent = exists ? await readFile(fullPath, 'utf8') : '';
    let appendContent = content;
    if (exists && newLine && !previousContent.endsWith('\n') && previousContent.length > 0) {
      appendContent = '\n' + content;
    }
    const dir = dirname(fullPath);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(fullPath, previousContent + appendContent, 'utf8');
    const stats = await stat(fullPath);
    return { success: true, newSize: stats.size };
  } catch (error) { handleFSError(error); }
}

export async function getFileInfo(path: string) {
  try {
    const fullPath = getFullPath(path);
    if (!existsSync(fullPath)) throw new ExtendedFSError(`Arquivo não encontrado: ${path}`, 'FILE_NOT_FOUND');
    const stats = await stat(fullPath);
    const isDirectory = stats.isDirectory();
    const lineCount = isDirectory ? 0 : (await readFile(fullPath, 'utf8')).split(/\r?\n/).length;
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      permissions: (stats.mode & 0o777).toString(8),
      encoding: 'utf-8',
      lineCount,
      isDirectory
    };
  } catch (error) { handleFSError(error); }
}

export async function moveFile(sourcePath: string, destinationPath: string, overwrite = false) {
  try {
    const fullSource = getFullPath(sourcePath);
    const fullDest = getFullPath(destinationPath);
    if (!existsSync(fullSource)) throw new ExtendedFSError(`Origem não encontrada: ${sourcePath}`, 'FILE_NOT_FOUND');
    if (existsSync(fullDest) && !overwrite) throw new ExtendedFSError(`Destino já existe: ${destinationPath}`, 'FILE_ALREADY_EXISTS');
    const dir = dirname(fullDest);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await rename(fullSource, fullDest);
    return { success: true, newPath: fullDest };
  } catch (error) { handleFSError(error); }
}

export async function copyExtendedFile(sourcePath: string, destinationPath: string, overwrite = false) {
  try {
    const fullSource = getFullPath(sourcePath);
    const fullDest = getFullPath(destinationPath);
    if (!existsSync(fullSource)) throw new ExtendedFSError(`Origem não encontrada: ${sourcePath}`, 'FILE_NOT_FOUND');
    if (existsSync(fullDest) && !overwrite) throw new ExtendedFSError(`Destino já existe: ${destinationPath}`, 'FILE_ALREADY_EXISTS');
    const dir = dirname(fullDest);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await copyFile(fullSource, fullDest);
    return { success: true, newPath: fullDest };
  } catch (error) { handleFSError(error); }
}

export async function createDirectory(path: string, recursive = true) {
  try {
    const fullPath = getFullPath(path);
    await mkdir(fullPath, { recursive });
    return { success: true, path: fullPath };
  } catch (error) { handleFSError(error); }
}
