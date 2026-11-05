import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface ScaffoldOptions {
  projectPath: string;
  projectName: string;
  prd: string;
  stack: string;
  files?: ScaffoldFile[]; // Lista de arquivos gerados dinamicamente pela IA
}

export async function generateScaffold(
  options: ScaffoldOptions, 
  onProgress?: (path: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const { projectPath, projectName, prd, stack, files = [] } = options;

    // Helper para notificar e escrever
    const writeWithProgress = async (relPath: string, content: string) => {
      const fullPath = join(projectPath, relPath);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
      if (onProgress) onProgress(relPath);
      // Pequeno sleep para dar tempo da UI respirar e o usuário ver
      await new Promise(r => setTimeout(r, 40)); 
    };

    // 1. Criar pasta raiz se não existir
    if (!existsSync(projectPath)) {
      await mkdir(projectPath, { recursive: true });
    }

    // 2. Criar README.md (Sempre necessário)
    const readmeContent = `# ${projectName}\n\n## Requisitos (PRD)\n\n${prd}\n\n---\n*Gerado automaticamente pelo Pipeline de Ideias do wOs.*`;
    await writeWithProgress('README.md', readmeContent);

    // 3. Criar structure.json
    const structure = {
      name: projectName,
      stack: stack,
      createdAt: new Date().toISOString(),
      blueprint: {
        root: projectPath,
        files: files.map(f => f.path)
      }
    };
    await writeWithProgress('structure.json', JSON.stringify(structure, null, 2));

    // 4. Criar pastas básicas auxiliares
    const baseFolders = ['docs', '.wilkor'];
    for (const folder of baseFolders) {
      const folderPath = join(projectPath, folder);
      if (!existsSync(folderPath)) await mkdir(folderPath, { recursive: true });
    }

    // 5. Escrever arquivos dinâmicos
    for (const file of files) {
      await writeWithProgress(file.path, file.content);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro no Scaffolding Dinâmico:', err);
    return { success: false, error: err.message };
  }
}
