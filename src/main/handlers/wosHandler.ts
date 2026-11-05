import { existsSync } from 'fs';
import { readdir, readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { getRoots } from '../utils/fs';

interface WosItem {
  name: string;
  path: string;
  content?: string;
}

/**
 * Handler para gerenciar itens do .wos (skills, rules, workflows)
 */
export class WosHandler {
  private getWosPath(): string {
    const roots = getRoots();
    const systemRoot = process.cwd();
    const rootToUse = roots.includes(systemRoot) ? systemRoot : roots[0];
    return join(rootToUse, '.wos');
  }

  private getItemsPath(type: 'skills' | 'rules' | 'workflows'): string {
    return join(this.getWosPath(), type);
  }

  /**
   * Lista todos os itens de um tipo (skills, rules, workflows)
   */
  async listItems(type: 'skills' | 'rules' | 'workflows'): Promise<{ success: boolean; items?: WosItem[]; error?: string }> {
    try {
      const itemsPath = this.getItemsPath(type);
      if (!existsSync(itemsPath)) {
        return { success: true, items: [] };
      }

      const items = await readdir(itemsPath, { withFileTypes: true });
      const dirs = items.filter(item => item.isDirectory());

      const result: WosItem[] = dirs.map(dir => ({
        name: dir.name,
        path: join(itemsPath, dir.name)
      }));

      return { success: true, items: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém o conteúdo de um item
   */
  async getItem(type: 'skills' | 'rules' | 'workflows', name: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const itemsPath = this.getItemsPath(type);
      const itemPath = join(itemsPath, name);

      if (!existsSync(itemPath)) {
        return { success: false, error: `Item ${name} não encontrado` };
      }

      // Tenta ler SKILL.md, README.md ou o primeiro arquivo .md
      const possibleFiles = ['SKILL.md', 'README.md', 'skill.md', 'readme.md'];
      let content: string | null = null;

      for (const file of possibleFiles) {
        const filePath = join(itemPath, file);
        if (existsSync(filePath)) {
          const fileContent = await readFile(filePath, 'utf-8');
          content = fileContent;
          break;
        }
      }

      if (!content) {
        // Se não encontrar os arquivos padrão, lista todos os arquivos .md
        const files = await readdir(itemPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        if (mdFiles.length > 0) {
          content = await readFile(join(itemPath, mdFiles[0]), 'utf-8');
        }
      }

      if (!content) {
        return { success: false, error: `Nenhum arquivo .md encontrado em ${name}` };
      }

      return { success: true, content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria um novo item
   */
  async createItem(
    type: 'skills' | 'rules' | 'workflows',
    name: string,
    content: string,
    filename: string = 'SKILL.md'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const itemsPath = this.getItemsPath(type);
      const itemPath = join(itemsPath, name);

      if (existsSync(itemPath)) {
        return { success: false, error: `Item ${name} já existe` };
      }

      // Cria o diretório
      await mkdir(itemPath, { recursive: true });

      // Cria o arquivo
      const filePath = join(itemPath, filename);
      await writeFile(filePath, content, 'utf-8');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza um item existente
   */
  async updateItem(
    type: 'skills' | 'rules' | 'workflows',
    name: string,
    content: string,
    filename: string = 'SKILL.md'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const itemsPath = this.getItemsPath(type);
      const itemPath = join(itemsPath, name);

      if (!existsSync(itemPath)) {
        return { success: false, error: `Item ${name} não encontrado` };
      }

      // Atualiza o arquivo
      const filePath = join(itemPath, filename);
      await writeFile(filePath, content, 'utf-8');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Deleta um item
   */
  async deleteItem(type: 'skills' | 'rules' | 'workflows', name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const itemsPath = this.getItemsPath(type);
      const itemPath = join(itemsPath, name);

      if (!existsSync(itemPath)) {
        return { success: false, error: `Item ${name} não encontrado` };
      }

      // Remove o diretório recursivamente
      await rm(itemPath, { recursive: true, force: true });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Valida o conteúdo de um item antes de salvar
   */
  validateItem(type: 'skills' | 'rules' | 'workflows', content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Conteúdo não pode estar vazio');
    }

    // Validação específica para cada tipo
    if (type === 'skills') {
      if (!content.includes('---')) {
        errors.push('Skill deve ter frontmatter com ---');
      }
    } else if (type === 'rules') {
      if (!content.includes('trigger:')) {
        errors.push('Rule deve ter um trigger definido');
      }
    } else if (type === 'workflows') {
      if (!content.includes('trigger:')) {
        errors.push('Workflow deve ter um trigger definido');
      }
      if (!content.includes('## Passo')) {
        errors.push('Workflow deve ter pelo menos um passo definido');
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

// Instância singleton
export const wosHandler = new WosHandler();
