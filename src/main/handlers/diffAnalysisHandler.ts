import { ipcMain } from 'electron';

export function registerDiffAnalysisHandlers() {
  ipcMain.handle('pipeline:analyzeFileDiff', async (_event, { repoPath, filePath, fileDiff }) => {
    try {
      console.log(`🤖 Iniciando AI File Diff Analysis para ${filePath} em ${repoPath}`);
      const { modelManager } = await import('../models/manager');
      modelManager.refreshProviders();

      const prompt = `Você é o wOs AI Reviewer, um Senior Tech Lead revisando uma alteração de código específica no arquivo "${filePath}".
      
      Aqui está o diff das alterações feitas neste arquivo:
      \`\`\`diff
      ${fileDiff}
      \`\`\`

      Seu objetivo é analisar esse diff e fornecer uma revisão técnica extremamente precisa, direta e construtiva (EM PORTUGUÊS BRASIL).
      Seu comentário final será postado diretamente no Bitbucket, então ele deve ser claro, formatado de forma limpa em markdown e ir direto ao ponto.

      ## Diretrizes da Revisão:
      1. Explique resumidamente o que foi alterado de forma clara e objetiva.
      2. Faça uma avaliação técnica rápida da qualidade da alteração (legibilidade, segurança, boas práticas).
      3. Aponte erros, bugs em potencial ou melhorias, se houver (se houver, explique o motivo e dê sugestão de correção). Se a alteração estiver excelente, elogie brevemente.
      4. Seja extremamente profissional e direto, sem enrolação.
      5. Nunca use o nome "WilkorOs" ou "Wilkor Os". Seu nome de assinatura de IA é exclusivamente "wOs".

      Por favor, retorne uma resposta em markdown bem formatada contendo a sua análise detalhada e conclusões de forma que possa ser usada diretamente como comentário.`;

      const response = await modelManager.handleChat('auto', [
        { role: 'system', content: 'Você é um revisor de código sênior focado em qualidade e estabilidade de produção. Responda SEMPRE em Português (Brasil).' },
        { role: 'user', content: prompt }
      ], undefined, 'Git Diff Analysis');

      return { success: true, analysis: response };
    } catch (err: any) {
      console.error('Erro em pipeline:analyzeFileDiff:', err);
      return { success: false, error: err.message };
    }
  });
}
