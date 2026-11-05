import { contextBridge, ipcRenderer } from 'electron'

// Log to confirm preload execution
console.log('🚀 [wOs] Preload script initializing...');

// Custom APIs for wOs (Vite/Electron Bridge)
const api = {
  chat: {
    send: (modelId: string, messages: any[], conversationId?: string, taskName?: string) => ipcRenderer.invoke('chat:send', { modelId, messages, conversationId, taskName }),
    stream: (modelId: string, messages: any[], conversationId?: string, taskName?: string) => ipcRenderer.invoke('chat:stream', { modelId, messages, conversationId, taskName }),
    stop: () => ipcRenderer.invoke('chat:stop'),
    transcribe: (buffer: ArrayBuffer) => ipcRenderer.invoke('chat:transcribe', buffer),
    listConversations: () => ipcRenderer.invoke('chat:list-conversations'),
    getConversation: (id: string) => ipcRenderer.invoke('chat:get-conversation', id),
    deleteConversation: (id: string) => ipcRenderer.invoke('chat:delete-conversation', id),
    speak: (text: string) => ipcRenderer.invoke('chat:speak', text),
    onChunk: (callback: (chunk: string) => void) => {
      const handler = (_event: any, chunk: string) => callback(chunk);
      ipcRenderer.on('chat:chunk', handler);
      // Retorna função de cleanup para evitar memory leak
      return () => ipcRenderer.removeListener('chat:chunk', handler);
    },
    onDone: (callback: (result: { success: boolean; error?: string }) => void) => {
      const handler = (_event: any, result: any) => callback(result);
      ipcRenderer.once('chat:done', handler);
      return () => ipcRenderer.removeListener('chat:done', handler);
    },
  },
  settings: {
    save: (settings: any) => ipcRenderer.invoke('settings:save', settings),
    get: () => ipcRenderer.invoke('settings:get'),
  },
  discord: {
    send: (message: string, channelId?: string, filePath?: string) => ipcRenderer.invoke('discord:send', { message, channelId, filePath }),
    getMentions: () => ipcRenderer.invoke('discord:getMentions'),
  },
  fs: {
    // rootPath opcional: permite buscar a árvore de um diretório específico (Multi-Root)
    getTree: (rootPath?: string) => ipcRenderer.invoke('fs:getTree', rootPath),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', { path }),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', { path, content }),
    deleteFile: (path: string) => ipcRenderer.invoke('fs:deleteFile', { path }),
    listFiles: (path?: string) => ipcRenderer.invoke('fs:listFiles', { path }),
    mkdir: (path: string) => ipcRenderer.invoke('fs:mkdir', { path }),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', { oldPath, newPath }),
    getStats: (path: string) => ipcRenderer.invoke('fs:getStats', { path }),
    reveal: (path: string) => ipcRenderer.invoke('fs:reveal', { path }),
    resolveImport: (importPath: string, fromFile: string) => ipcRenderer.invoke('fs:resolveImport', { importPath, fromFile }),
  },
  terminal: {
    create: (id: string, shell: string, cwd: string) => ipcRenderer.invoke('terminal:create', { id, shell, cwd }),
    kill: (id: string) => ipcRenderer.invoke('terminal:kill', id),
    getBuffer: (id: string) => ipcRenderer.invoke('terminal:getBuffer', id),
    input: (id: string, data: string) => ipcRenderer.send('terminal:input', { id, data }),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', { id, cols, rows }),
  },
  workspace: {
    set: (path: string) => ipcRenderer.invoke('workspace:set', path),
    addFolder: (path?: string) => ipcRenderer.invoke('workspace:addFolder', path),
    removeFolder: (path: string) => ipcRenderer.invoke('workspace:removeFolder', path),
    getRoots: () => ipcRenderer.invoke('workspace:getRoots'),
    getContext: () => ipcRenderer.invoke('workspace:getContext'),
    getGlobalSkills: () => ipcRenderer.invoke('workspace:getGlobalSkills'),
    getSkillContent: (name: string) => ipcRenderer.invoke('workspace:getSkillContent', name),
    getArtifacts: () => ipcRenderer.invoke('workspace:getArtifacts'),
    getArtifactContent: (path: string) => ipcRenderer.invoke('workspace:getArtifactContent', { path }),
    openFileInSystem: (path: string) => ipcRenderer.invoke('workspace:openFileInSystem', { path }),
    getFileThumbnail: (path: string) => ipcRenderer.invoke('workspace:getFileThumbnail', { path }),
    deleteArtifact: (path: string) => ipcRenderer.invoke('workspace:deleteArtifact', { path }),
    saveArtifact: (name: string, content: string) => ipcRenderer.invoke('workspace:saveArtifact', { name, content }),
  },
  git: {
    status: () => ipcRenderer.invoke('git:status'),
    stage: (path: string) => ipcRenderer.invoke('git:stage', { path }),
    unstage: (path: string) => ipcRenderer.invoke('git:unstage', { path }),
    commit: (message: string) => ipcRenderer.invoke('git:commit', { message }),
    diff: (path: string) => ipcRenderer.invoke('git:diff', { path }),
    clone: (url: string) => ipcRenderer.invoke('git:clone', { url }),
    push: () => ipcRenderer.invoke('git:push'),
    pull: () => ipcRenderer.invoke('git:pull'),
    fetch: () => ipcRenderer.invoke('git:fetch'),
    stageAll: () => ipcRenderer.invoke('git:stage-all'),
    unstageAll: () => ipcRenderer.invoke('git:unstage-all'),
    getBranches: () => ipcRenderer.invoke('git:get-branches'),
    checkout: (branch: string, options?: { force?: boolean; stash?: boolean }) => ipcRenderer.invoke('git:checkout', { branch, options }),
    setRoot: (path: string) => ipcRenderer.invoke('git:set-root', { path }),
    createBranch: (branch: string) => ipcRenderer.invoke('git:create-branch', { branch }),
    commitDiff: (commitHash: string, path: string) => ipcRenderer.invoke('git:commit-diff', { commitHash, path }),
    onCloneProgress: (callback: (data: { percent: number; message: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('git:clone:progress', handler);
      return () => ipcRenderer.removeListener('git:clone:progress', handler);
    },
  },
  mcp: {
    listServers: () => ipcRenderer.invoke('mcp:listServers'),
    listPresets: () => ipcRenderer.invoke('mcp:listPresets'),
    addServer: (config: any) => ipcRenderer.invoke('mcp:addServer', config),
    removeServer: (id: string) => ipcRenderer.invoke('mcp:removeServer', id),
    toggleServer: (id: string, enabled: boolean) => ipcRenderer.invoke('mcp:toggleServer', { id, enabled }),
    getTools: (serverId: string) => ipcRenderer.invoke('mcp:getTools', serverId),
    onToolRequest: (callback: (request: any) => void) => {
      const handler = (_event: any, request: any) => callback(request);
      ipcRenderer.on('mcp:toolRequest', handler);
      return () => ipcRenderer.removeListener('mcp:toolRequest', handler);
    },
    respondToTool: (requestId: string, approved: boolean) => ipcRenderer.invoke('mcp:respondToTool', { requestId, approved }),
    removePreset: (id: string) => ipcRenderer.invoke('mcp:removePreset', id),
    savePreset: (config: any) => ipcRenderer.invoke('mcp:savePreset', config),
  },
  agent: {
    applyFileEdit: (path: string, content: string) => ipcRenderer.invoke('agent:applyFileEdit', { path, content }),
    runCommand: (data: { command: string }) => ipcRenderer.invoke('agent:runCommand', data),
  },
  pipeline: {
    generateScaffold: (options: any) => ipcRenderer.invoke('pipeline:generateScaffold', options),
    createTrelloCard: (options: any) => ipcRenderer.invoke('pipeline:createTrelloCard', options),
    getTrelloLists: (boardId: string) => ipcRenderer.invoke('pipeline:getTrelloLists', boardId),
    getTrelloBoards: () => ipcRenderer.invoke('pipeline:getTrelloBoards'),
    getTrelloCards: (listId: string) => ipcRenderer.invoke('pipeline:getTrelloCards', listId),
    getTrelloCardDetails: (cardId: string) => ipcRenderer.invoke('pipeline:getTrelloCardDetails', cardId),
    createTrelloCardChecklist: (cardId: string, name: string) => ipcRenderer.invoke('pipeline:createTrelloCardChecklist', { cardId, name }),
    createTrelloChecklistItem: (checklistId: string, name: string) => ipcRenderer.invoke('pipeline:createTrelloChecklistItem', { checklistId, name }),
    addTrelloCardAttachment: (cardId: string, url: string) => ipcRenderer.invoke('pipeline:addTrelloCardAttachment', { cardId, url }),
    getTrelloBoardCustomFields: (boardId: string) => ipcRenderer.invoke('pipeline:getTrelloBoardCustomFields', boardId),
    updateTrelloCardCustomFieldItem: (cardId: string, customFieldId: string, value: any) => ipcRenderer.invoke('pipeline:updateTrelloCardCustomFieldItem', { cardId, customFieldId, value }),
    getGitStats: (repoPaths: string[], since?: string, forceRefresh?: boolean) => ipcRenderer.invoke('pipeline:getGitStats', { repoPaths, since, forceRefresh }),
    getPullRequests: (repoPaths: string[]) => ipcRenderer.invoke('pipeline:getPullRequests', { repoPaths }),
    analyzePR: (options: { repoPath: string, branchName: string }) => ipcRenderer.invoke('pipeline:analyzePR', options),
    analyzeFileDiff: (options: { repoPath: string, filePath: string, fileDiff: string }) => ipcRenderer.invoke('pipeline:analyzeFileDiff', options),
    actionPR: (options: { repoPath: string, prId: number, action: string }) => ipcRenderer.invoke('pipeline:actionPR', options),
    commentPR: (options: { repoPath: string, prId: number, text: string }) => ipcRenderer.invoke('pipeline:commentPR', options),
    saveTechPending: (pending: any) => ipcRenderer.invoke('pipeline:saveTechPending', pending),
    getTechPendings: () => ipcRenderer.invoke('pipeline:getTechPendings'),
    deleteTechPending: (id: string) => ipcRenderer.invoke('pipeline:deleteTechPending', id),
    onFileProgress: (callback: (path: string) => void) => {
      const handler = (_event: any, path: string) => callback(path);
      ipcRenderer.on('pipeline:file-progress', handler);
      return () => ipcRenderer.removeListener('pipeline:file-progress', handler);
    }
  },
  analytics: {
    saveSnapshot: (boardId: string, stats: any) => ipcRenderer.invoke('analytics:saveSnapshot', { boardId, stats }),
    getTrend: (boardId: string) => ipcRenderer.invoke('analytics:getTrend', { boardId }),
    getAIUsage: () => ipcRenderer.invoke('analytics:getAIUsage'),
    clearAIUsage: () => ipcRenderer.invoke('analytics:clearAIUsage')
  },
  cron: {
    list: () => ipcRenderer.invoke('cron:list'),
    save: (job: any) => ipcRenderer.invoke('cron:save', job),
    delete: (id: string) => ipcRenderer.invoke('cron:delete', id),
    toggle: (id: string, enabled: boolean) => ipcRenderer.invoke('cron:toggle', { id, enabled }),
    run: (id: string) => ipcRenderer.invoke('cron:run', id),
    onStatus: (callback: (data: any) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('cron:status', handler);
      return () => ipcRenderer.removeListener('cron:status', handler);
    }
  },
  window: {
    focus: () => ipcRenderer.invoke('window:focus')
  },
  agents: {
    list: () => ipcRenderer.invoke('agents:list'),
    save: (agent: any) => ipcRenderer.invoke('agents:save', agent),
    delete: (id: string) => ipcRenderer.invoke('agents:delete', id),
    listSessions: () => ipcRenderer.invoke('agents:list-sessions'),
    getSession: (id: string) => ipcRenderer.invoke('agents:get-session', id),
    saveSession: (session: any) => ipcRenderer.invoke('agents:save-session', session),
    deleteSession: (id: string) => ipcRenderer.invoke('agents:delete-session', id),
    truncateSession: (sessionId: string, messageId: string) => ipcRenderer.invoke('agents:truncate-session', { sessionId, messageId }),
    startInteraction: (sessionId: string) => ipcRenderer.invoke('agents:start-interaction', sessionId),
    stopInteraction: (sessionId: string) => ipcRenderer.invoke('agents:stop-interaction', sessionId),
    toggleTask: (sessionId: string, taskId: string, completed: boolean) => ipcRenderer.invoke('agents:toggle-task', { sessionId, taskId, completed }),
    onSessionTasksUpdated: (callback: (data: { sessionId: string; tasks: any[] }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:session-tasks-updated', handler);
      return () => ipcRenderer.removeListener('agents:session-tasks-updated', handler);
    },
    onSessionChunk: (callback: (data: { sessionId: string; agentId: string; chunk: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:session-chunk', handler);
      return () => ipcRenderer.removeListener('agents:session-chunk', handler);
    },
    onSessionMessageDone: (callback: (data: { sessionId: string; message: any }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:session-message-done', handler);
      return () => ipcRenderer.removeListener('agents:session-message-done', handler);
    },
    onSessionStatusChange: (callback: (data: { sessionId: string; status: 'idle' | 'running' | 'paused' | 'concluded'; activeAgentId?: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:session-status-change', handler);
      return () => ipcRenderer.removeListener('agents:session-status-change', handler);
    },
    onSessionStats: (callback: (data: { sessionId: string; stats: any }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:session-stats', handler);
      return () => ipcRenderer.removeListener('agents:session-stats', handler);
    },
    startParallelWorkflow: (sessionId: string, taskIds: string[]) => ipcRenderer.invoke('agents:start-parallel-workflow', { sessionId, taskIds }),
    stopParallelWorkflow: (sessionId: string) => ipcRenderer.invoke('agents:stop-parallel-workflow', sessionId),
    getWorkflowState: () => ipcRenderer.invoke('agents:get-workflow-state'),
    onWorkflowUpdate: (callback: (data: { sessionId: string; tasks: any[] }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:workflow-update', handler);
      return () => ipcRenderer.removeListener('agents:workflow-update', handler);
    },
    onWorkflowLogs: (callback: (data: { taskId: string; lines: string[] }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agents:workflow-logs', handler);
      return () => ipcRenderer.removeListener('agents:workflow-logs', handler);
    }
  },
  auth: {
    setUser: (user: any) => ipcRenderer.invoke('auth:setUser', user),
    getPermissions: () => ipcRenderer.invoke('auth:getPermissions'),
    adminGetUsers: () => ipcRenderer.invoke('auth:adminGetUsers'),
    adminSaveUserPermissions: (userId: string, permissions: any) => ipcRenderer.invoke('auth:adminSaveUserPermissions', { userId, permissions }),
  },
  agy: {
    run: (options: { workspacePath: string; prompt: string; skipPermissions?: boolean }) => ipcRenderer.invoke('agy:run', options),
    kill: () => ipcRenderer.invoke('agy:kill'),
    onData: (callback: (data: { text: string; type: 'stdout' | 'stderr' }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on('agy:data', handler);
      return () => ipcRenderer.removeListener('agy:data', handler);
    },
    onExit: (callback: (code: number | null) => void) => {
      const handler = (_event: any, code: any) => callback(code);
      ipcRenderer.on('agy:exit', handler);
      return () => ipcRenderer.removeListener('agy:exit', handler);
    }
  }
}

// Safer injection
try {
  contextBridge.exposeInMainWorld('api', api);
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      send: (channel: string, data: any) => ipcRenderer.send(channel, data),
      on: (channel: string, func: (event: any, ...args: any[]) => void) => {
        ipcRenderer.on(channel, func);
      },
      removeListener: (channel: string, func: (event: any, ...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, func);
      }
    }
  });
  console.log('✅ [wOs] Injection successful!');
} catch (error) {
  console.error('❌ [wOs] Preload injection failed:', error);
}
