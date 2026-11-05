import { ipcMain, BrowserWindow, app } from 'electron';

export function setupAudioActivationIPC() {
  // Remove existing handler to support Hot Module Replacement (HMR) safely
  ipcMain.removeHandler('window:focus');

  ipcMain.handle('window:focus', async () => {
    console.log('[Main] Recebido comando window:focus');
    const wins = BrowserWindow.getAllWindows();
    console.log(`[Main] Janelas ativas encontradas: ${wins.length}`);
    
    if (wins.length > 0) {
      wins.forEach((win, i) => {
        console.log(`[Main] Focando janela index ${i}`);
        if (!win.isDestroyed()) {
          if (win.isMinimized()) {
            console.log(`[Main] Janela ${i} estava minimizada. Restaurando...`);
            win.restore();
          }
          
          win.setAlwaysOnTop(true, 'screen-saver');
          win.show();
          app.focus({ steal: true });
          win.focus();
          
          // O Windows as vezes precisa de uns milissegundos para renderizar a janela no topo 
          // antes de tirarmos a prioridade dela.
          setTimeout(() => {
            if (!win.isDestroyed()) {
              win.setAlwaysOnTop(false);
            }
          }, 200);
        }
      });
      app.focus({ steal: true });
      console.log('[Main] Comando de foco finalizado com sucesso.');
      return { success: true };
    }
    return { success: false, error: 'No windows available' };
  });
}
