import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Plus, ChevronDown, Paperclip, Compass } from 'lucide-react';
import MessageList from '../chat/MessageList';
import ChatInput from '../chat/ChatInput';

interface ChatPanelProps {
  isChatOpen: boolean;
  chatWidth: number;
  messages: any[];
  isLoading: boolean;
  fileTrees: any;
  handleChatDrop: (e: React.DragEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  inputText: string;
  setInputText: (text: string) => void;
  isRecording: boolean;
  attachments: any[];
  contextChars: number;
  maxContext: number;
  agentActivities: any[];
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleSendMessage: (overridePrompt?: string, isInvisible?: boolean, isVoiceCommand?: boolean, bypassPlanning?: boolean) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAttachment: (name: string) => void;
  handleToggleRecording: () => void;
  handleStopGeneration: () => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleAcceptAllActivities: () => void;
  handleRejectAllActivities: () => void;
  handleApplyAgentActivity: (id: string) => void;
  handleRejectAgentActivity: (id: string) => void;
  handleUndoAgentActivity: (id: string) => void;
  activeModelInfo: any;
  setIsModelSelectorOpen: (open: boolean) => void;
  setIsHistoryOpen: (open: boolean) => void;
  handleNewChat: () => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  isVoiceModeEnabled: boolean;
  setIsVoiceModeEnabled: (enabled: boolean) => void;
  isHandsFreeRecording: boolean;
  isHandsFreeEnabled?: boolean;
  isPlanningMode: boolean;
  setIsPlanningMode: (planning: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isChatOpen,
  chatWidth,
  messages,
  isLoading,
  fileTrees,
  handleChatDrop,
  chatEndRef,
  inputText,
  setInputText,
  isRecording,
  attachments,
  contextChars,
  maxContext,
  agentActivities,
  textAreaRef,
  fileInputRef,
  handleSendMessage,
  handleFileSelect,
  handleRemoveAttachment,
  handleToggleRecording,
  handleStopGeneration,
  handlePaste,
  handleAcceptAllActivities,
  handleRejectAllActivities,
  handleApplyAgentActivity,
  handleRejectAgentActivity,
  handleUndoAgentActivity,
  activeModelInfo,
  setIsModelSelectorOpen,
  setIsHistoryOpen,
  handleNewChat,
  isDragging,
  setIsDragging,
  isVoiceModeEnabled,
  setIsVoiceModeEnabled,
  isHandsFreeRecording,
  isHandsFreeEnabled,
  isPlanningMode,
  setIsPlanningMode
}) => {
  const pendingActivities = agentActivities.filter(a => a.status === 'pending');
  const planningActivity = pendingActivities.find(a => 
    a.type === 'write_file' && 
    a.data.path && 
    (a.data.path.toLowerCase().includes('artifacts/planning_') || a.data.path.toLowerCase().includes('artifacts\\planning_')) &&
    a.data.path.toLowerCase().endsWith('.md')
  );

  const handleBuildPlanejado = async () => {
    if (!planningActivity) return;
    
    // 1. Aplica o arquivo markdown nos artefatos locais
    await handleApplyAgentActivity(planningActivity.id);
    
    // 2. Envia a aprovação do plano pelo chat em modo bypass
    handleSendMessage("🔨 Build do Planejado: Plano de implementação aprovado! Prossiga com a execução das alterações de código e comandos definidos no plano.", false, false, true);
  };
  return (
    <motion.div 
      animate={{ width: isChatOpen ? chatWidth : 0, opacity: isChatOpen ? 1 : 0 }} 
      className="bg-bg-panel flex flex-col overflow-hidden relative border-l border-white/5"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={handleChatDrop}
    >
      {/* Background Pattern - Tied to primary color */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" 
           style={{ backgroundImage: `radial-gradient(circle, var(--primary) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-primary/10 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary/50 m-4 rounded-3xl"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-bounce">
              <Paperclip size={32} className="text-primary" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Solte para anexar</h3>
            <p className="text-[10px] text-primary/60 mt-1">O wOs vai analisar este arquivo com você</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col h-full relative z-10">
        {/* Header - Cursor Style */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.03]">
          <div className="flex flex-col">
            <h2 className="text-[13px] font-bold text-text-main truncate max-w-[200px]">
              {messages.length > 1 ? messages[1].content.slice(0, 30) + '...' : 'New Session'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlanningMode(!isPlanningMode)}
              className={`p-1.5 rounded-lg transition-all border flex items-center justify-center ${isPlanningMode ? 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]' : 'text-text-muted/40 hover:text-text-main border-transparent hover:bg-white/5'}`}
              title={isPlanningMode ? "Modo Planejamento: Ativado" : "Modo Planejamento: Desativado"}
            >
              <Compass size={15} className={isPlanningMode ? 'animate-[spin_10s_linear_infinite]' : ''} />
            </button>
            <button onClick={handleNewChat} className="p-1.5 text-text-muted/40 hover:text-text-main transition-colors hover:bg-white/5 rounded-lg" title="Nova Conversa">
              <Plus size={16} />
            </button>
            <button onClick={() => setIsHistoryOpen(true)} className="p-1.5 text-text-muted/40 hover:text-text-main transition-colors hover:bg-white/5 rounded-lg" title="Histórico">
              <History size={16} />
            </button>
            <button onClick={() => setIsModelSelectorOpen(true)} className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5 transition-colors">
               <activeModelInfo.icon size={12} className="text-primary" />
               <ChevronDown size={12} className="text-text-muted/40" />
            </button>
          </div>
        </div>

        <MessageList messages={messages} isLoading={isLoading} fileTrees={fileTrees} handleChatDrop={handleChatDrop} chatEndRef={chatEndRef} />

        {/* Banner do Build do Planejado */}
        <AnimatePresence>
          {planningActivity && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="mx-4 mb-3 p-3.5 bg-gradient-to-r from-purple-950/70 to-indigo-950/80 backdrop-blur-2xl border border-purple-500/30 rounded-2xl flex items-center justify-between shadow-[0_8px_32px_rgba(139,92,246,0.15)] z-20"
            >
              <div className="flex flex-col min-w-0 pr-4 select-none">
                <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest leading-none flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Planejamento Gerado
                </span>
                <span className="text-[11px] font-bold text-white truncate max-w-[220px]" title={planningActivity.data.path?.split(/[\\/]/).pop()}>
                  {planningActivity.data.path?.split(/[\\/]/).pop()}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleRejectAgentActivity(planningActivity.id)}
                  className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-200/60 hover:text-white transition-colors"
                >
                  Recusar
                </button>
                <button
                  onClick={handleBuildPlanejado}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-black font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-1"
                >
                  <span>🔨 Build do Planejado</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isLoading={isLoading}
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
          activeModelName={activeModelInfo.name}
          isVoiceModeEnabled={isVoiceModeEnabled}
          setIsVoiceModeEnabled={setIsVoiceModeEnabled}
          isHandsFreeRecording={isHandsFreeRecording}
          isHandsFreeEnabled={isHandsFreeEnabled}
        />
      </div>
    </motion.div>
  );
};
