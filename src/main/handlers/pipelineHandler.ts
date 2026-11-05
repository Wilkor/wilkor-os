import { ipcMain } from 'electron';
import { analyzePR } from '../utils/prAnalyzer';

export function registerPipelineHandlers(getWin: () => any) {
  ipcMain.handle('pipeline:generateScaffold', async (_event, options) => {
    const { generateScaffold } = await import('../utils/scaffoldUtility');
    return await generateScaffold(options, (path) => {
      const mainWindow = getWin();
      if (mainWindow) {
        mainWindow.webContents.send('pipeline:file-progress', path);
      }
    });
  });

  ipcMain.handle('pipeline:getGitStats', async (_event, data) => {
    try {
      console.log('IPC: pipeline:getGitStats', data);
      const { repoPaths, since, forceRefresh } = JSON.parse(JSON.stringify(data || {}));
      if (!repoPaths || !Array.isArray(repoPaths)) {
        return { success: false, error: 'repoPaths deve ser um array válido.' };
      }

      const { getGitStatsWithCache } = await import('../utils/gitStatsCache');
      const stats = await getGitStatsWithCache(repoPaths, since, forceRefresh);
      return JSON.parse(JSON.stringify({ success: true, stats }));
    } catch (err: any) {
      console.error('Erro em pipeline:getGitStats:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pipeline:getPullRequests', async (_event, data) => {
    try {
      console.log('IPC: pipeline:getPullRequests', data);
      const { repoPaths } = JSON.parse(JSON.stringify(data || {}));
      if (!repoPaths || !Array.isArray(repoPaths)) {
        return { success: false, error: 'repoPaths deve ser um array válido.' };
      }

      // Tentar buscar via API do BitBucket primeiro
      const { getBitBucketPRs } = await import('../utils/bitbucketHandler');
      const apiResult = await getBitBucketPRs(repoPaths);

      if (apiResult.success && apiResult.prs && apiResult.prs.length > 0) {
        apiResult.prs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { success: true, prs: apiResult.prs };
      }

      // Se falhou ou não tem token, mas o usuário quer ser estrito, 
      // poderíamos retornar vazio. Por enquanto, se não houver token, 
      // usamos o fallback de branch do Git.
      const Store = (await import('electron-store')).default;
      const store = new Store();
      if (store.get('bitbucketToken')) {
        // Se tem token mas a lista veio vazia da API, significa que realmente NÃO tem PRs abertos.
        return { success: true, prs: [] };
      }

      const { getActiveBranches } = await import('../utils/gitHandler');
      const allPRs: any[] = [];
      for (const repo of repoPaths) {
        try {
          const prs = await getActiveBranches(repo);
          allPRs.push(...prs);
        } catch (repoErr) {
          console.error(`Erro ao ler PRs do repo ${repo}:`, repoErr);
        }
      }
      allPRs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { success: true, prs: allPRs };
    } catch (err: any) {
      console.error('Erro em pipeline:getPullRequests:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pipeline:analyzePR', async (_event, options) => {
    try {
      return await analyzePR(options);
    } catch (err: any) {
      console.error('Erro em pipeline:analyzePR:', err);
      return { 
        success: false, 
        error: err.message,
        analysis: {
          score: 0,
          risk: 'Critical',
          risk_justification: 'Falha técnica catastrófica.',
          summary: 'Erro na análise da IA.',
          full_report: `#### 🚨 Erro Crítico\nFalha ao conectar com o motor de IA: ${err.message}`
        }
      };
    }
  });

  ipcMain.handle('pipeline:actionPR', async (_event, { repoPath, prId, action }) => {
    try {
      console.log(`🚀 Executando ação BitBucket: ${action} no PR #${prId}`);
      const { actionBitBucketPR } = await import('../utils/bitbucketHandler');
      const result = await actionBitBucketPR(repoPath, prId, action);

      // DISCORD NOTIFICATION
      try {
        if (result && result.success) {
          const { notifyPRAction } = await import('../utils/discordNotificationService');
          await notifyPRAction(repoPath, String(prId), action);
        }
      } catch (notifyErr: any) {
        console.error('[Discord Notification] Falha ao notificar ação PR:', notifyErr.message);
      }

      return result;
    } catch (err: any) {
      console.error('Erro em pipeline:actionPR:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pipeline:commentPR', async (_event, { repoPath, prId, text }) => {
    try {
      console.log(`💬 Enviando comentário no PR #${prId}`);
      const { addBitBucketPRComment } = await import('../utils/bitbucketCommentsHandler');
      const result = await addBitBucketPRComment(repoPath, prId, text);

      // DISCORD NOTIFICATION
      try {
        if (result && result.success) {
          const { notifyPRComment } = await import('../utils/discordNotificationService');
          await notifyPRComment(repoPath, String(prId), text);
        }
      } catch (notifyErr: any) {
        console.error('[Discord Notification] Falha ao notificar comentário no PR:', notifyErr.message);
      }

      return result;
    } catch (err: any) {
      console.error('Erro em pipeline:commentPR:', err);
      return { success: false, error: err.message };
    }
  });
}

