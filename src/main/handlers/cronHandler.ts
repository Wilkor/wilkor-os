import { ipcMain } from 'electron';
import * as db from '../utils/database';
import { cronManager } from '../utils/cronManager';

export function registerCronHandlers() {
  ipcMain.handle('cron:list', async () => {
    try {
      const list = await db.getCronJobs();
      return { success: true, cronJobs: list };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('cron:save', async (_event, job) => {
    try {
      await db.saveCronJob(job);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('cron:delete', async (_event, id) => {
    try {
      await db.deleteCronJob(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('cron:toggle', async (_event, { id, enabled }) => {
    try {
      await db.toggleCronJob(id, enabled);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('cron:run', async (_event, id) => {
    try {
      const activeJobs = await db.getCronJobs();
      const job = activeJobs.find(j => j.id === id);
      if (!job) throw new Error('Tarefa agendada não encontrada.');

      // Roda a tarefa em background para não travar a chamada IPC do renderer
      cronManager.executeJob(job as any).catch(err => {
        console.error(`[Cron IPC Trigger] Erro na execução da cron "${job.name}":`, err);
      });

      return { success: true, message: 'Execução agendada iniciada em background!' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
