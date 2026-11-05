import { exec } from 'child_process';
import path from 'path';
import { getRoots } from '../utils/fs';
import { resolveAgyPath } from '../handlers/agyHandler';

interface RefactorArgs {
  path: string;
  instruction: string;
  repoPath?: string;
}

export async function executeAntigravityTool(name: string, args: RefactorArgs, customRoot?: string): Promise<string> {
  if (name !== 'delegateRefactorToAntigravity') {
    return `Erro: Ferramenta "${name}" desconhecida no Antigravity Executor.`;
  }

  if (!args.path || !args.instruction) {
    return 'Erro: delegateRefactorToAntigravity requer "path" e "instruction".';
  }

  const targetRoot = args.repoPath || customRoot || getRoots()[0];
  if (!targetRoot) {
    return 'Erro: Nenhuma raiz de projeto ativa encontrada para executar a refatoração.';
  }

  // Resolve o caminho absoluto do arquivo
  const absoluteFilePath = path.isAbsolute(args.path) 
    ? args.path 
    : path.resolve(targetRoot, args.path);

  // Resolve o caminho do executável dinamicamente
  const agyPath = resolveAgyPath();


  // Monta o comando de prompt não interativo passando skip-permissions e diretrizes estritas de edição
  const prompt = `Refatore o arquivo ${absoluteFilePath} de acordo com as seguintes instruções: ${args.instruction}. ATENÇÃO: O arquivo já existe. NÃO crie arquivos novos desnecessários e NÃO reescreva o arquivo inteiro do zero. Leia o conteúdo existente e faça edições pontuais (use ferramentas como replace_file_content ou multi_replace_file_content) alterando apenas o que for necessário e preservando toda a lógica original intacta. Modifique o arquivo fisicamente no disco.`;
  const safePrompt = prompt.replace(/"/g, '\\"');
  const command = `"${agyPath}" --prompt "${safePrompt}" --dangerously-skip-permissions`;

  console.log(`[Antigravity CLI Executor] 🚀 Executando comando de refatoração: ${command}`);

  return new Promise<string>((resolve) => {
    exec(command, { cwd: targetRoot }, (err, stdout, stderr) => {
      if (err) {
        console.error('[Antigravity CLI Executor] ❌ Erro ao rodar CLI:', stderr || err.message);
        resolve(`Erro na refatoração: ${stderr || err.message}`);
      } else {
        console.log('[Antigravity CLI Executor] ✅ Refatoração finalizada com sucesso!');
        resolve(`Refatoração executada com sucesso pelo Antigravity CLI!\n\nRetorno:\n${stdout}`);
      }
    });
  });
}
