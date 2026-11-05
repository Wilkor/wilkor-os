export interface ApiExpose {
  chat: {
    send: (modelId: string, messages: any[], conversationId?: string) => Promise<any>;
    stream: (modelId: string, messages: any[], conversationId?: string) => Promise<any>;
    onChunk: (callback: (chunk: string) => void) => () => void;
    onDone: (callback: (result: { success: boolean; error?: string }) => void) => () => void;
    stop: () => Promise<void>;
    transcribe: (audio: ArrayBuffer) => Promise<any>;
    listConversations: () => Promise<{ success: boolean; conversations: any[] }>;
    getConversation: (id: string) => Promise<{ success: boolean; conversation: any }>;
    deleteConversation: (id: string) => Promise<{ success: boolean }>;
  };
  settings: {
    save: (settings: any) => Promise<any>;
    get: () => Promise<any>;
  };
  fs: {
    getTree: (rootPath?: string) => Promise<any>;
    readFile: (path: string) => Promise<any>;
    writeFile: (path: string, content: string) => Promise<any>;
    deleteFile: (path: string) => Promise<any>;
    mkdir: (path: string) => Promise<any>;
    rename: (oldPath: string, newPath: string) => Promise<any>;
    getStats: (path: string) => Promise<any>;
    listFiles: (path?: string) => Promise<any>;
    reveal: (path: string) => Promise<any>;
  };
  terminal: {
    create: (id: string, shell: string, cwd: string) => Promise<any>;
    kill: (id: string) => Promise<any>;
    input: (id: string, data: string) => void;
    resize: (id: string, cols: number, rows: number) => void;
  };
  discord: {
    send: (message: string, channelId?: string, filePath?: string) => Promise<{ success: boolean; error?: string }>;
    getMentions: () => Promise<{ success: boolean; mentions?: Record<string, string>; error?: string }>;
  };
  workspace: {
    set: (path: string) => Promise<any>;
    addFolder: (path?: string) => Promise<any>;
    removeFolder: (path: string) => Promise<any>;
    getRoots: () => Promise<string[]>;
    getContext: () => Promise<any[]>;
    getGlobalSkills: () => Promise<string[]>;
    getSkillContent: (name: string) => Promise<string | null>;
    getArtifacts: () => Promise<{ success: boolean; artifacts?: any[]; error?: string }>;
    getArtifactContent: (path: string) => Promise<any>;
    openFileInSystem: (path: string) => Promise<{ success: boolean; error?: string }>;
    getFileThumbnail: (path: string) => Promise<{ success: boolean; thumbnail?: string; error?: string }>;
    deleteArtifact: (path: string) => Promise<{ success: boolean; error?: string }>;
    saveArtifact: (name: string, content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    listWosSkills: () => Promise<{ success: boolean; items?: any[]; error?: string }>;
    getWosSkill: (name: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    createWosSkill: (name: string, description: string, instructions: string) => Promise<{ success: boolean; error?: string }>;
    updateWosSkill: (name: string, description: string, instructions: string) => Promise<{ success: boolean; error?: string }>;
    deleteWosSkill: (name: string) => Promise<{ success: boolean; error?: string }>;
    validateWosSkill: (content: string) => Promise<{ valid: boolean; errors: string[] }>;
    listWosRules: () => Promise<{ success: boolean; items?: any[]; error?: string }>;
    getWosRule: (name: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    createWosRule: (name: string, trigger: string, priority: number, instructions: string) => Promise<{ success: boolean; error?: string }>;
    updateWosRule: (name: string, trigger: string, priority: number, instructions: string) => Promise<{ success: boolean; error?: string }>;
    deleteWosRule: (name: string) => Promise<{ success: boolean; error?: string }>;
    validateWosRule: (content: string) => Promise<{ valid: boolean; errors: string[] }>;
    listWosWorkflows: () => Promise<{ success: boolean; items?: any[]; error?: string }>;
    getWosWorkflow: (name: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    createWosWorkflow: (name: string, trigger: string, steps: string) => Promise<{ success: boolean; error?: string }>;
    updateWosWorkflow: (name: string, trigger: string, steps: string) => Promise<{ success: boolean; error?: string }>;
    deleteWosWorkflow: (name: string) => Promise<{ success: boolean; error?: string }>;
    validateWosWorkflow: (content: string) => Promise<{ valid: boolean; errors: string[] }>;
  };
  git: {
    status: () => Promise<any>;
    stage: (path: string) => Promise<any>;
    unstage: (path: string) => Promise<any>;
    commit: (message: string) => Promise<any>;
    diff: (path: string) => Promise<any>;
    clone: (url: string) => Promise<any>;
    push: () => Promise<any>;
    pull: () => Promise<any>;
    fetch: () => Promise<any>;
    stageAll: () => Promise<any>;
    unstageAll: () => Promise<any>;
    getBranches: () => Promise<{ success: boolean; current?: string; all?: string[]; error?: string }>;
    checkout: (branch: string, options?: { force?: boolean; stash?: boolean }) => Promise<any>;
    setRoot: (path: string) => Promise<any>;
    createBranch: (branch: string) => Promise<any>;
    commitDiff: (commitHash: string, path: string) => Promise<{ success: boolean; diff?: string; error?: string }>;
    onCloneProgress: (callback: (data: any) => void) => () => void;
  };
  mcp: {
    listServers: () => Promise<MCPServerConfig[]>;
    listPresets: () => Promise<MCPServerConfig[]>;
    addServer: (config: MCPServerConfig) => Promise<void>;
    removeServer: (id: string) => Promise<void>;
    toggleServer: (id: string, enabled: boolean) => Promise<void>;
    getTools: (serverId: string) => Promise<any[]>;
    onToolRequest: (callback: (request: any) => void) => () => void;
    respondToTool: (requestId: string, approved: boolean) => Promise<void>;
    removePreset: (id: string) => Promise<void>;
    savePreset: (config: MCPServerConfig) => Promise<void>;
  };
  agent: {
    applyFileEdit: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
    runCommand: (data: { command: string }) => Promise<{ success: boolean; output?: string; error?: string }>;
  };
  cron: {
    list: () => Promise<{ success: boolean; cronJobs?: any[]; error?: string }>;
    save: (job: any) => Promise<{ success: boolean; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; error?: string }>;
    toggle: (id: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
    run: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    onStatus: (callback: (data: { jobId: string; status: 'running' | 'success' | 'error'; conversationId?: string; error?: string }) => void) => () => void;
  };
  window: {
    focus: () => Promise<any>;
  };
  agents: {
    list: () => Promise<{ success: boolean; agents: IAgent[]; error?: string }>;
    save: (agent: IAgent) => Promise<{ success: boolean; error?: string }>;
    delete: (id: string) => Promise<{ success: boolean; error?: string }>;
    listSessions: () => Promise<{ success: boolean; sessions: IAgentSession[]; error?: string }>;
    getSession: (id: string) => Promise<{ success: boolean; session: IAgentSession; error?: string }>;
    saveSession: (session: IAgentSession) => Promise<{ success: boolean; error?: string }>;
    deleteSession: (id: string) => Promise<{ success: boolean; error?: string }>;
    truncateSession: (sessionId: string, messageId: string) => Promise<{ success: boolean; error?: string }>;
    startInteraction: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
    stopInteraction: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
    toggleTask: (sessionId: string, taskId: string, completed: boolean) => Promise<{ success: boolean; error?: string }>;
    onSessionTasksUpdated: (callback: (data: { sessionId: string; tasks: IAgentTask[] }) => void) => () => void;
    onSessionChunk: (callback: (data: { sessionId: string; agentId: string; chunk: string }) => void) => () => void;
    onSessionMessageDone: (callback: (data: { sessionId: string; message: IAgentMessage }) => void) => () => void;
    onSessionStatusChange: (callback: (data: { sessionId: string; status: 'idle' | 'running' | 'paused' | 'concluded'; activeAgentId?: string }) => void) => () => void;
    onSessionStats: (callback: (data: { sessionId: string; stats: ISessionStats }) => void) => () => void;
    startParallelWorkflow: (sessionId: string, taskIds: string[]) => Promise<{ success: boolean; error?: string }>;
    stopParallelWorkflow: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
    getWorkflowState: () => Promise<{ success: boolean; state: any }>;
    onWorkflowUpdate: (callback: (data: { sessionId: string; tasks: any[] }) => void) => () => void;
    onWorkflowLogs: (callback: (data: { taskId: string; lines: string[] }) => void) => () => void;
  };
  pipeline: {
    generateScaffold: (options: any) => Promise<any>;
    createTrelloCard: (options: any) => Promise<any>;
    getTrelloLists: (boardId: string) => Promise<any>;
    getTrelloBoards: () => Promise<any>;
    getTrelloCards: (listId: string) => Promise<any>;
    getTrelloCardDetails: (cardId: string) => Promise<any>;
    createTrelloCardChecklist: (cardId: string, name: string) => Promise<any>;
    createTrelloChecklistItem: (checklistId: string, name: string) => Promise<any>;
    addTrelloCardAttachment: (cardId: string, url: string) => Promise<any>;
    getTrelloBoardCustomFields: (boardId: string) => Promise<any>;
    updateTrelloCardCustomFieldItem: (cardId: string, customFieldId: string, value: any) => Promise<any>;
    getGitStats?: (repoPaths: string[], since?: string, forceRefresh?: boolean) => Promise<any>;
    getPullRequests?: (repoPaths: string[]) => Promise<any>;
    analyzePR?: (options: any) => Promise<any>;
    analyzeFileDiff?: (options: any) => Promise<any>;
    actionPR?: (options: any) => Promise<any>;
    commentPR?: (options: any) => Promise<any>;
    onFileProgress?: (callback: (path: string) => void) => () => void;
  };
  auth?: {
    setUser: (user: any) => Promise<any>;
    getPermissions: () => Promise<any>;
    adminGetUsers: () => Promise<any>;
    adminSaveUserPermissions: (userId: string, permissions: any) => Promise<any>;
  };
  agy: {
    run: (options: { workspacePath: string; prompt: string; skipPermissions?: boolean }) => Promise<{ success: boolean; error?: string }>;
    kill: () => Promise<{ success: boolean; error?: string }>;
    onData: (callback: (data: { text: string; type: 'stdout' | 'stderr' }) => void) => () => void;
    onExit: (callback: (code: number | null) => void) => () => void;
  };
}

export interface IAgentTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  category: 'front' | 'back' | 'database' | 'security';
  status: 'pending' | 'completed';
  createdBy: string;
  createdAt?: Date;
}

export interface IAgent {
  _id?: any;
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelId: string;
  emoji: string;
  color: string;
  createdAt?: Date;
}

export interface IAgentMessage {
  id: string;
  agentId?: string; // undefined se for o humano
  senderName: string;
  senderRole: string;
  senderEmoji: string;
  senderColor: string;
  content: string;
  timestamp: Date;
  thought?: string;
  toolCalls?: any[];
}

export interface ISessionStats {
  startedAt?: Date;
  totalRounds: number;
  totalChars: number;
  estimatedTokens: number;
  estimatedCost: number;
  durationMs: number;
}

export interface IAgentSession {
  _id?: any;
  id: string;
  title: string;
  agentIds: string[];
  messages: IAgentMessage[];
  status: 'idle' | 'running' | 'paused' | 'concluded';
  activeAgentId?: string;
  lastUpdated: Date;
  maxRounds?: number;
  stats?: ISessionStats;
  tasks?: IAgentTask[];
  repoPath?: string;
  trelloCardId?: string;
  trelloCardName?: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  type: 'stdio' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string | undefined>;
  enabled: boolean;
  icon?: string;        // emoji ou URL de imagem
  description?: string; // Descrição curta do servidor
}

export interface AgentActivity {
  id: string;
  type: 'file_edit' | 'command' | 'write_file' | 'patch_file';
  status: 'pending' | 'applied' | 'rejected' | 'running' | 'success' | 'error' | 'applying' | 'ready';
  timestamp: number;
  data: FileEditActivity | CommandActivity;
}

export interface FileEditActivity {
  path: string;
  content: string;
  originalContent?: string;
  range?: string;
  diffStats?: {
    additions: number;
    deletions: number;
  };
}

export interface CommandActivity {
  command: string;
  cwd?: string;
  output?: string;
}
