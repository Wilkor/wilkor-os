import { app, shell, BrowserWindow } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'

function initializeDefaultSettings(): void {
  const store = new Store();
  
  const defaults = {
    mongodbUri: '',
    discordBotToken: '',
    discordChannelId: '',
    trelloApiKey: '',
    trelloToken: '',
    agyPath: '',
    skillsPath: '',
    techLeader: ''
  };

  Object.entries(defaults).forEach(([key, val]) => {
    if (store.get(key) === undefined) {
      store.set(key, val);
      console.log(`[Settings Init] Inicializada configuração padrão: ${key}`);
    }
  });
}

import { TerminalManager } from './terminal';
import { MCPManager } from './mcp/manager';
import { getRoots } from './utils/fs';
import { connectDB } from './utils/database';

// Handlers Modularizados
import { registerChatHandlers } from './handlers/chatHandler';
import { registerFSHandlers } from './handlers/fsHandler';
import { registerGitHandlers } from './handlers/gitHandler';
import { registerMCPHandlers } from './handlers/mcpHandler';
import { registerMiscHandlers } from './handlers/miscHandler';
import { registerPipelineHandlers } from './handlers/pipelineHandler';
import { registerTerminalHandlers } from './handlers/terminalHandler';
import { registerWorkspaceHandlers, setupWatcher } from './handlers/workspaceHandler';
import { registerAnalyticsHandlers } from './handlers/analyticsHandler';
import { registerDiffAnalysisHandlers } from './handlers/diffAnalysisHandler';
import { registerCronHandlers } from './handlers/cronHandler';
import { registerTrelloIPCHandlers } from './handlers/trelloIPCHandler';
import { registerAgentHandlers } from './handlers/agentHandler';
import { registerAgyHandlers } from './handlers/agyHandler';
import { registerAuthHandlers } from './handlers/authHandler';
import { cronManager } from './utils/cronManager';
import { setupAudioActivationIPC } from './audioActivation';

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let terminalManager: TerminalManager | null = null;
let mcpManager: MCPManager | null = null;
let mainWindow: BrowserWindow | null = null;
let handlersRegistered = false;

function createWindow(): void {
  let preloadPath = join(__dirname, '../preload/index.mjs')
  if (!existsSync(preloadPath)) {
    preloadPath = join(__dirname, '../preload/index.js')
  }
  
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })

  // Inicializar ou Atualizar Managers
  if (!terminalManager) {
    terminalManager = new TerminalManager(mainWindow);
  } else {
    terminalManager.setWindow(mainWindow);
  }

  if (!mcpManager) {
    mcpManager = new MCPManager(mainWindow);
    (global as any).mcpManager = mcpManager;
  } else {
    mcpManager.setWindow(mainWindow);
  }

  // Registrar todos os IPC Handlers APENAS UMA VEZ
  if (!handlersRegistered) {
    const getWin = () => mainWindow;
    registerChatHandlers(getWin);
    registerFSHandlers();
    registerGitHandlers(getWin);
    registerMCPHandlers(mcpManager);
    registerMiscHandlers(terminalManager);
    registerPipelineHandlers(getWin);
    registerTerminalHandlers(terminalManager);
    registerWorkspaceHandlers(getWin, terminalManager);
    registerAnalyticsHandlers();
    registerDiffAnalysisHandlers();
    registerCronHandlers();
    registerTrelloIPCHandlers();
    registerAgentHandlers(getWin);
    registerAgyHandlers(getWin);
    registerAuthHandlers();
    setupAudioActivationIPC();
    handlersRegistered = true;
  }

  // Inicializar Watchers para as pastas do workspace
  getRoots().forEach(root => setupWatcher(root, mainWindow));

  mainWindow.on('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initializeDefaultSettings()
  electronApp.setAppUserModelId('com.wilkor.os')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  connectDB().then(() => {
    cronManager.start();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('quit', () => {
  cronManager.stop();
  if (terminalManager) terminalManager.killAll();
  if (mcpManager) mcpManager.shutdown();
})
