import { getRoots } from '../utils/fs';
import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { exec } from 'child_process';

interface InstallSkillArgs {
  name: string;
  type: 'markdown' | 'npx' | 'npm';
  content?: string;
  command?: string;
  args?: string[];
  description?: string;
  env?: Record<string, string>;
}

export async function installSkill(args: InstallSkillArgs): Promise<string> {
  if (!args.name || !args.type) {
    return 'Erro: installSkill requer "name" e "type".';
  }

  const roots = getRoots();
  const baseRoot = roots[0] || process.cwd();
  const skillDir = join(baseRoot, '.agent', 'skills', args.name);
  const skillFilePath = join(skillDir, 'SKILL.md');

  // Cria a pasta da skill se não existir
  if (!existsSync(skillDir)) {
    mkdirSync(skillDir, { recursive: true });
  }

  if (args.type === 'markdown') {
    if (!args.content) {
      return 'Erro: O parâmetro "content" com o markdown da skill é obrigatório para o tipo "markdown".';
    }
    writeFileSync(skillFilePath, args.content, 'utf8');
    return `Skill "${args.name}" instalada com sucesso em ${skillFilePath}!`;
  }

  if (args.type === 'npx' || args.type === 'npm') {
    const cmd = args.command || (args.type === 'npx' ? 'npx' : 'npm');
    const finalArgs = args.args || [];
    
    // 1. Cadastra o MCP no banco de dados MongoDB
    const mcpManager = (global as any).mcpManager;
    if (mcpManager) {
      const config = {
        id: `mcp-${args.name}`,
        name: args.name,
        type: 'stdio' as const,
        command: cmd,
        args: finalArgs,
        env: args.env || {},
        enabled: true,
        description: args.description || `MCP server para a skill ${args.name}`,
        icon: '🔌'
      };
      await mcpManager.addServer(config);
    }

    // 2. Gera o SKILL.md explicativo para que a IA adquira o contexto de uso das ferramentas
    const prefixName = args.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    const generatedContent = `# Skill: ${args.name}\n\nEsta skill fornece ferramentas externas integradas via Model Context Protocol (MCP).\n\n## Comando\n\`${cmd} ${finalArgs.join(' ')}\`\n\n## Descrição\n${args.description || 'Habilidade instalada via comando npm/npx.'}\n\n## Instruções para a IA\nTodas as ferramentas deste servidor MCP foram expostas sob o prefixo \`${prefixName}__[ferramenta]\`. Use-as quando precisar executar ações vinculadas a esta habilidade.`;
    
    writeFileSync(skillFilePath, generatedContent, 'utf8');

    // Se for npm e houver um pacote específico para instalação física
    if (args.type === 'npm' && args.command && !args.command.startsWith('npm') && !args.command.startsWith('node')) {
      return new Promise((resolve) => {
        const installCmd = `npm install ${args.command}`;
        console.log(`[Skill Installer] Rodando: ${installCmd} em ${baseRoot}`);
        exec(installCmd, { cwd: baseRoot }, (error: any, stdout: string, stderr: string) => {
          if (error) {
            resolve(`MCP registrado e SKILL.md criado, mas falhou ao instalar pacote npm localmente: ${error.message}\nStderr: ${stderr}`);
          } else {
            resolve(`Skill "${args.name}" e servidor MCP instalados com sucesso! Pacote npm instalado localmente.\nSaída: ${stdout}`);
          }
        });
      });
    }

    return `Skill "${args.name}" instalada com sucesso! O servidor MCP foi cadastrado no banco e o arquivo ${skillFilePath} foi gerado.`;
  }

  return 'Erro: Tipo de skill inválido.';
}
