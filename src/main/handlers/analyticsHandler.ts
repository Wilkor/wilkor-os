import { ipcMain } from 'electron';
import * as db from '../utils/database';

export function registerAnalyticsHandlers() {
  ipcMain.handle('analytics:saveSnapshot', async (_event, { boardId, stats }) => {
    try {
      const saved = await db.saveAnalyticsSnapshot(boardId, stats);
      return { success: true, snapshot: saved };
    } catch (error: any) {
      console.error('❌ [Analytics Handler] Erro ao salvar snapshot:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analytics:getTrend', async (_event, { boardId }) => {
    try {
      const oldStats = await db.getAnalyticsTrend(boardId);
      return { success: true, oldStats };
    } catch (error: any) {
      console.error('❌ [Analytics Handler] Erro ao buscar trend:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analytics:getAIUsage', async () => {
    try {
      const reports = await db.getAIUsageReports();
      return JSON.parse(JSON.stringify(reports));
    } catch (error: any) {
      console.error('❌ [Analytics Handler] Erro ao buscar telemetria de IA:', error);
      return [];
    }
  });

  ipcMain.handle('analytics:clearAIUsage', async () => {
    try {
      const result = await db.clearAIUsage();
      return { success: true, result };
    } catch (error: any) {
      console.error('❌ [Analytics Handler] Erro ao limpar telemetria de IA:', error);
      return { success: false, error: error.message };
    }
  });
}
