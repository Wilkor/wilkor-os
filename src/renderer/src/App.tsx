import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { ExplorerPanel } from './components/layout/ExplorerPanel';
import { CenterPanel } from './components/layout/CenterPanel';
import { ChatPanel } from './components/layout/ChatPanel';
import HistoryPanel from './components/HistoryPanel';
import { ToastContainer } from './components/Toast';
import ProjectDashboard from './components/ProjectDashboard';
import PipelineWizard from './components/PipelineWizard';
import SettingsModal from './components/modals/SettingsModal';
import { useAIChat } from './hooks/useAIChat';
import { useWorkspace } from './hooks/useWorkspace';
import { useSettings } from './hooks/useSettings';
import { useToasts } from './hooks/useToasts';
import { useIPCListeners } from './hooks/useIPCListeners';
import { InputDialog } from './components/InputDialog';
import { initAudioActivation, stopAudioActivation, AudioActivationConfig } from './audioActivation';
import { THEMES } from './config/themes';
import { ALL_MODELS } from './config/models';
import ModelSelectorModal from './components/modals/ModelSelectorModal';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import AgentStudio from './components/agents/AgentStudio';
import SpecPipelineWizard from './components/SpecPipelineWizard';
import AdminPanel from './components/AdminPanel';
import WosManagerModal from './components/modals/WosManagerModal';

export default function App() {
  // Hooks Reais
  const { notifications, addToast, removeToast } = useToasts();
  const { 
    settings, 
    setSettings, 
    saveSettings, 
    currentThemeId, 
    setCurrentThemeId,
    activeSettingsTab,
    setActiveSettingsTab 
  } = useSettings(addToast);
  
  const {
    fileTrees,
    tabs,
    setTabs,
    activeTabPath,
    setActiveTabPath,
    isExplorerOpen,
    setIsExplorerOpen,
    refreshWorkspace,
    handleOpenFile,
    handleAddFolder,
    handleRemoveFolder,
    handleTabClose,
    handleContentChange,
    handleSaveFile,
    handleDeleteFile,
    handleNewFile,
    handleNewFolder,
    lastCreatedPath,
    workspaceVersion,
    inputDialog
  } = useWorkspace(addToast);

  const currentTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];

  // Autenticação Real do Sistema
  const { user, logout, isAuthenticated, isLoading: authLoading, isApproved, allowedTabs, refreshPermissions } = useAuth();

  // Estados de UI locais
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'git' | 'mcp' | 'artifacts' | 'planning'>('explorer');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [chatWidth, setChatWidth] = useState(400);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(240);
  
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isProjectDashboardOpen, setIsProjectDashboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isAgentStudioOpen, setIsAgentStudioOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isWosManagerOpen, setIsWosManagerOpen] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  
  const [activeSpecCard, setActiveSpecCard] = useState<any | null>(null);
  const [activeSpecPendingTask, setActiveSpecPendingTask] = useState<any | null>(null);
  
  const [activeModelId, setActiveModelId] = useState('auto');
  
  const activeModel = ALL_MODELS.find(m => m.id === activeModelId) || ALL_MODELS[0];

  const activeModelInfo = {
    id: activeModelId,
    name: activeModel.name,
    icon: activeModel.icon,
    color: activeModelId === 'auto' ? '#A855F7' : '#4285F4'
  };

  // Filtrar modelos baseados nas chaves disponíveis
  const availableModels = ALL_MODELS.filter(m => {
    if (m.id === 'auto') return true;
    if (!m.providerKey) return true; // Ollama/Local
    return !!(settings as any)[m.providerKey];
  });

  const modelsByProvider = availableModels.reduce((acc, m) => {
    const provider = m.provider || 'Outros';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  const {
    messages,
    isLoading,
    inputText,
    setInputText,
    attachments,
    contextChars,
    maxContext,
    agentActivities,
    streamingActivity,
    textAreaRef,
    fileInputRef,
    chatEndRef,
    handleSendMessage,
    handleApplyAgentActivity,
    handleRejectAgentActivity,
    handleUndoAgentActivity,
    handleAIAction,
    handleFileSelect,
    handleRemoveAttachment,
    handleToggleRecording,
    handleChatDrop,
    handlePaste,
    handleAcceptAllActivities,
    handleRejectAllActivities,
    handleStopGeneration,
    isDragging,
    setIsDragging,
    setActiveConversationId,
    activeConversationId,
    isRecording,
    setAgentActivities,
    setAttachments,
    isVoiceModeEnabled,
    setIsVoiceModeEnabled,
    isHandsFreeRecording,
    isPlanningMode,
    setIsPlanningMode
  } = useAIChat(
    activeModelId,
    settings,
    addToast,
    tabs,
    setTabs,
    activeTabPath,
    fileTrees,
    setIsTerminalOpen
  );

  // Ativa os ouvintes IPC globais do Electron
  useIPCListeners(refreshWorkspace, setAgentActivities, setTabs, setActiveTabPath, handleOpenFile);

  // Ativação por Áudio (palmas/voz)
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const defaultConfig: AudioActivationConfig = {
      enabled: true,
      wakeWord: 'hey wos',
      clapThreshold: 0.3,
      clapMaxGapMs: 800,
      cooldownMs: 3000
    };

    const config: AudioActivationConfig = settings?.audioActivation || defaultConfig;

    // Se o usuário estiver gravando manualmente na UI, desliga a escuta contínua temporariamente para evitar conflitos
    if (config.enabled && !isRecording) {
      initAudioActivation(config, (command?: string) => {
        console.log('[App] Solicitando foco da janela via IPC...');
        if (window.api && window.api.window) {
          window.api.window.focus().then(res => {
            console.log('[App] Foco aplicado:', res);
          }).catch(err => {
            console.error('[App] Erro ao focar janela:', err);
          });
        }
        if (command && command.trim()) {
          console.log('[App] Executando comando de voz hands-free:', command);
          handleSendMessage(command, false, true);
        }
      }, (errText: string) => {
        addToast(errText, 'error');
      });
    } else {
      stopAudioActivation();
    }

    return () => {
      stopAudioActivation();
    };
  }, [settings?.audioActivation, isAuthenticated, isRecording]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] text-white font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00A884] border-t-transparent"></div>
      </div>
    );
  }

  const isMaster = !!(user && (user.email === 'wilkor.almeida@gmail.com' || user.id === '69fbc369036a60001cddd998'));
 
  if (!isAuthenticated || !user) {
    return <Login />;
  }
 
  if (!isApproved && !isMaster) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#07070a] text-white font-sans p-6">
        <div className="max-w-md w-full bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl shadow-black/50">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 tracking-wide">Acesso Pendente de Liberação</h2>
          <p className="text-sm text-white/50 mb-6 leading-relaxed">
            Olá, amigão! O seu cadastro foi registrado no sistema. Por favor, aguarde enquanto o administrador Wilkor aprova o seu acesso e configura as suas abas.
          </p>
          <div className="text-xs text-white/30 border-t border-white/5 pt-4 w-full flex flex-col gap-1 select-none">
            <span>E-mail: <strong className="text-white/60">{user.email}</strong></span>
            <span>ID: <strong className="text-white/40">{user.id}</strong></span>
          </div>
          <div className="flex gap-3 w-full mt-8">
            <button
              onClick={async () => {
                setIsCheckingPermissions(true);
                try {
                  await refreshPermissions();
                } catch (err) {
                  console.error('Falha ao re-checar permissões:', err);
                } finally {
                  setIsCheckingPermissions(false);
                }
              }}
              disabled={isCheckingPermissions}
              className="flex-1 px-5 py-2.5 rounded-xl bg-primary hover:brightness-110 text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              {isCheckingPermissions ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
              <span>Verificar Acesso</span>
            </button>
            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-semibold text-white/80 transition-all cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsHistoryOpen(false);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setIsHistoryOpen(false);
  };

  const startResizingSidebar = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setSidebarWidth(Math.max(150, Math.min(500, startWidth + deltaX)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startResizingChat = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = chatWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      setChatWidth(Math.max(300, Math.min(800, startWidth + deltaX)));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-app text-text-main overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground">
      <ToastContainer notifications={notifications} onClose={removeToast} />
      
      <HistoryPanel 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        currentId={activeConversationId} 
        onSelectConversation={handleSelectConversation} 
        onNewChat={handleNewChat} 
        theme={currentTheme} 
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        saveSettings={saveSettings}
        currentThemeId={currentThemeId}
        setCurrentThemeId={setCurrentThemeId}
        activeSettingsTab={activeSettingsTab}
        setActiveSettingsTab={setActiveSettingsTab}
        setActiveSidebarTab={setActiveSidebarTab}
        addToast={addToast}
      />

      <ModelSelectorModal 
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        availableModels={availableModels}
        modelsByProvider={modelsByProvider}
        activeModel={activeModelId}
        setActiveModel={setActiveModelId}
        onOpenSettings={(tab) => {
          setActiveSettingsTab(tab as any);
          setIsSettingsOpen(true);
        }}
      />
 
      {isAdminOpen && (
        <div className="fixed inset-0 z-[80] bg-bg-app">
          <AdminPanel 
            onClose={() => setIsAdminOpen(false)}
            onAddToast={addToast}
          />
        </div>
      )}

      {isProjectDashboardOpen && (
        <div className="fixed inset-0 z-[80] bg-bg-app">
          <ProjectDashboard 
            onAddToast={addToast}
            onClose={() => setIsProjectDashboardOpen(false)}
            onOpenFile={handleOpenFile}
            theme={currentTheme}
            onStartSpecification={(card, pendingTask) => {
              setActiveSpecCard(card);
              setActiveSpecPendingTask(pendingTask || null);
            }}
          />
        </div>
      )}

      {isPipelineOpen && (
        <div className="fixed inset-0 z-[80]" style={{ backgroundColor: currentTheme.colors.bgApp }}>
          <PipelineWizard 
            onClose={() => setIsPipelineOpen(false)}
            onAddToast={addToast}
            onRefreshWorkspace={refreshWorkspace}
            activeModel={activeModelId}
            theme={currentTheme}
            onStartSpecification={(card) => {
              setIsPipelineOpen(false);
              setActiveSpecCard(card);
              setActiveSpecPendingTask(null);
            }}
          />
        </div>
      )}

      {activeSpecCard && (
        <div className="fixed inset-0 z-[90]" style={{ backgroundColor: currentTheme.colors.bgApp }}>
          <SpecPipelineWizard
            card={activeSpecCard}
            initialPendingTask={activeSpecPendingTask}
            onClose={() => {
              setActiveSpecCard(null);
              setActiveSpecPendingTask(null);
            }}
            onAddToast={addToast}
            theme={currentTheme}
          />
        </div>
      )}

      {isAgentStudioOpen && (
        <div className="fixed inset-0 z-[80] bg-[#050507]">
          <AgentStudio 
            onClose={() => setIsAgentStudioOpen(false)}
          />
        </div>
      )}

      {isWosManagerOpen && (
        <WosManagerModal
          isOpen={isWosManagerOpen}
          onClose={() => setIsWosManagerOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          user={user} 
          activeSidebarTab={activeSidebarTab} 
          setActiveSidebarTab={setActiveSidebarTab} 
          isExplorerOpen={isExplorerOpen} 
          setIsExplorerOpen={setIsExplorerOpen} 
          isPipelineOpen={isPipelineOpen} 
          setIsPipelineOpen={setIsPipelineOpen} 
          isProjectDashboardOpen={isProjectDashboardOpen} 
          setIsProjectDashboardOpen={setIsProjectDashboardOpen} 
          isChatOpen={isChatOpen} 
          setIsChatOpen={setIsChatOpen} 
          isSettingsOpen={isSettingsOpen} 
          setIsSettingsOpen={setIsSettingsOpen} 
          isAgentStudioOpen={isAgentStudioOpen}
          setIsAgentStudioOpen={setIsAgentStudioOpen}
          logout={logout} 
          allowedTabs={allowedTabs}
          isMaster={isMaster}
          isAdminOpen={isAdminOpen}
          setIsAdminOpen={setIsAdminOpen}
          isWosManagerOpen={isWosManagerOpen}
          setIsWosManagerOpen={setIsWosManagerOpen}
        />

        <ExplorerPanel 
          isExplorerOpen={isExplorerOpen} 
          sidebarWidth={sidebarWidth} 
          activeSidebarTab={activeSidebarTab} 
          fileTrees={fileTrees} 
          tabs={tabs}
          handleOpenFile={handleOpenFile} 
          refreshWorkspace={refreshWorkspace} 
          handleNewFile={handleNewFile} 
          handleNewFolder={handleNewFolder} 
          handleAddFolder={handleAddFolder} 
          handleRemoveFolder={handleRemoveFolder}
          handleDeleteFile={handleDeleteFile}
          addToast={addToast} 
          activeTabPath={activeTabPath}
          lastCreatedPath={lastCreatedPath}
          workspaceVersion={workspaceVersion}
          theme={currentTheme}
          onAttachFile={(file) => {
            setAttachments(prev => {
              if (prev.some(att => att.path === file.path)) return prev;
              return [...prev, { name: file.name, path: file.path, type: file.type }];
            });
          }}
        />

        {/* Resize Handle Sidebar */}
        {isExplorerOpen && (
          <div
            onMouseDown={startResizingSidebar}
            className="w-0.5 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-50 shrink-0 bg-transparent"
          />
        )}

        <CenterPanel 
          isChatOpen={isChatOpen}
          isExplorerOpen={isExplorerOpen}
          sidebarWidth={sidebarWidth}
          chatWidth={chatWidth}
          tabs={tabs} 
          activeTabPath={activeTabPath} 
          onTabClick={handleOpenFile}
          onTabClose={handleTabClose}
          onTabCloseAll={() => setTabs([])}
          onTabCloseOthers={(path) => setTabs(prev => prev.filter(t => t.path === path))}
          onContentChange={handleContentChange}
          isTerminalOpen={isTerminalOpen} 
          terminalHeight={terminalHeight} 
          setTerminalHeight={setTerminalHeight}
          workspaceFolders={Object.keys(fileTrees)}
          prAnalysis={null}
          agentActivities={agentActivities}
          handleApplyAgentActivity={handleApplyAgentActivity}
          handleRejectAgentActivity={handleRejectAgentActivity}
          handleUndoAgentActivity={handleUndoAgentActivity}
          handleAIAction={handleAIAction}
          onSave={handleSaveFile}
          onNavigateToFile={handleOpenFile}
          themeId={currentThemeId}
          streamingActivity={streamingActivity}
        />

        {/* Resize Handle Chat */}
        {isChatOpen && (
          <div
            onMouseDown={startResizingChat}
            className="w-0.5 h-full cursor-col-resize hover:bg-primary/40 transition-colors z-[60] shrink-0 bg-transparent"
          />
        )}

        <ChatPanel 
          isChatOpen={isChatOpen} 
          chatWidth={chatWidth} 
          messages={messages} 
          isLoading={isLoading} 
          fileTrees={fileTrees} 
          handleChatDrop={handleChatDrop} 
          chatEndRef={chatEndRef} 
          inputText={inputText} 
          setInputText={setInputText} 
          isRecording={isRecording}
          attachments={attachments} 
          contextChars={contextChars} 
          maxContext={maxContext} 
          agentActivities={agentActivities} 
          textAreaRef={textAreaRef} 
          fileInputRef={fileInputRef} 
          handleSendMessage={handleSendMessage} 
          handleFileSelect={handleFileSelect} 
          handleRemoveAttachment={handleRemoveAttachment} 
          handleToggleRecording={handleToggleRecording} 
          handleStopGeneration={handleStopGeneration} 
          handlePaste={handlePaste}
          handleAcceptAllActivities={handleAcceptAllActivities} 
          handleRejectAllActivities={handleRejectAllActivities} 
          handleApplyAgentActivity={handleApplyAgentActivity}
          handleRejectAgentActivity={handleRejectAgentActivity}
          handleUndoAgentActivity={handleUndoAgentActivity}
          activeModelInfo={activeModelInfo}
          setIsModelSelectorOpen={setIsModelSelectorOpen} 
          setIsHistoryOpen={setIsHistoryOpen}
          handleNewChat={handleNewChat}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          isVoiceModeEnabled={isVoiceModeEnabled}
          setIsVoiceModeEnabled={setIsVoiceModeEnabled}
          isHandsFreeRecording={isHandsFreeRecording}
          isHandsFreeEnabled={settings?.audioActivation?.enabled ?? true}
          isPlanningMode={isPlanningMode}
          setIsPlanningMode={setIsPlanningMode}
        />
      </div>
      {inputDialog && inputDialog.isOpen && (
        <InputDialog
          isOpen={inputDialog.isOpen}
          title={inputDialog.title}
          placeholder={inputDialog.placeholder}
          onConfirm={inputDialog.onConfirm}
          onCancel={inputDialog.onCancel}
        />
      )}
    </div>
  );
}
