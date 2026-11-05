import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, RotateCcw } from 'lucide-react';
import { IAgent, IAgentSession, IAgentMessage, ISessionStats, IAgentTask } from '../../../../shared/types';
import Markdown from '../chat/Markdown';
import { AgentMonitorPanel } from './AgentMonitorPanel';
import { AgentChatInput } from './AgentChatInput';

interface AgentSessionRoomProps {
  session: IAgentSession;
  agents: IAgent[];
  onBack: () => void;
  onRefresh?: () => void;
}

export const AgentSessionRoom: React.FC<AgentSessionRoomProps> = ({ session, agents, onBack, onRefresh }) => {
  const [localMessages, setLocalMessages] = useState<IAgentMessage[]>([]);
  const [streamingData, setStreamingData] = useState<Record<string, string>>({});
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'running' | 'paused' | 'concluded'>('idle');
  const [activeAgentId, setActiveAgentId] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<ISessionStats | undefined>(session.stats);
  const [localTasks, setLocalTasks] = useState<IAgentTask[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [localAgentIds, setLocalAgentIds] = useState<string[]>([]);
  
  // Estados para o Workflow Paralelo com Git Worktree
  const [workflowTasks, setWorkflowTasks] = useState<any[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<Record<string, string[]>>({});
  const [isWorkflowActive, setIsWorkflowActive] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMessages(session.messages);
    setSessionStatus(session.status);
    setActiveAgentId(session.activeAgentId);
    setStats(session.stats);
    setLocalTasks(session.tasks || []);
    setLocalAgentIds(session.agentIds || []);

    // Carrega estado inicial do workflow paralelo
    window.api.agents.getWorkflowState().then(res => {
      if (res.success && res.state) {
        if (res.state.sessionId === session.id) {
          setWorkflowTasks(res.state.tasks);
          setWorkflowLogs(res.state.logs || {});
          setIsWorkflowActive(res.state.tasks.some((t: any) => t.status !== 'completed' && t.status !== 'error'));
        }
      }
    });
  }, [session]);

  // IPC Event Listeners para sincronização em tempo real do loop
  useEffect(() => {
    const cleanChunk = window.api.agents.onSessionChunk((data) => {
      if (data.sessionId !== session.id) return;
      setStreamingData(prev => ({
        ...prev,
        [data.agentId]: (prev[data.agentId] || '') + data.chunk
      }));
    });

    const cleanDone = window.api.agents.onSessionMessageDone((data) => {
      if (data.sessionId !== session.id) return;
      setStreamingData(prev => {
        const next = { ...prev };
        delete next[data.message.agentId || ''];
        return next;
      });
      setLocalMessages(prev => [...prev, data.message]);
    });

    const cleanStatus = window.api.agents.onSessionStatusChange((data) => {
      if (data.sessionId !== session.id) return;
      setSessionStatus(data.status);
      setActiveAgentId(data.activeAgentId);
    });

    const cleanStats = window.api.agents.onSessionStats((data) => {
      if (data.sessionId !== session.id) return;
      setStats(data.stats);
    });

    const cleanTasks = window.api.agents.onSessionTasksUpdated((data) => {
      if (data.sessionId !== session.id) return;
      setLocalTasks(data.tasks);
    });

    // Listeners do Workflow Paralelo
    const cleanWorkflowUpdate = window.api.agents.onWorkflowUpdate((data) => {
      if (data.sessionId !== session.id) return;
      setWorkflowTasks(data.tasks);
      setIsWorkflowActive(data.tasks.some(t => t.status !== 'completed' && t.status !== 'error'));
      if (onRefresh) onRefresh();
    });

    const cleanWorkflowLogs = window.api.agents.onWorkflowLogs((data) => {
      setWorkflowLogs(prev => ({
        ...prev,
        [data.taskId]: [...(prev[data.taskId] || []), ...data.lines]
      }));
    });

    return () => {
      cleanChunk();
      cleanDone();
      cleanStatus();
      cleanStats();
      cleanTasks();
      cleanWorkflowUpdate();
      cleanWorkflowLogs();
    };
  }, [session.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, streamingData]);

  const handleStartWorkflow = async (taskIds: string[]) => {
    setIsWorkflowActive(true);
    await window.api.agents.startParallelWorkflow(session.id, taskIds);
  };

  const handleStopWorkflow = async () => {
    setIsWorkflowActive(false);
    await window.api.agents.stopParallelWorkflow(session.id);
  };

  const handleStart = async () => { setSessionStatus('running'); await window.api.agents.startInteraction(session.id); };
  const handlePause = async () => { setSessionStatus('paused'); await window.api.agents.stopInteraction(session.id); };

  const handleSendUserMessage = async () => {
    if (!inputVal.trim()) return;
    const userMsg: IAgentMessage = {
      id: Math.random().toString(36).substring(2, 11),
      senderName: 'Wilkor',
      senderRole: 'Humano',
      senderEmoji: '👤',
      senderColor: '#10B981',
      content: inputVal.trim(),
      timestamp: new Date()
    };
    const updatedMessages = [...localMessages, userMsg];
    setLocalMessages(updatedMessages);
    setInputVal('');

    const updatedSession = { ...session, messages: updatedMessages, lastUpdated: new Date() };
    const res = await window.api.agents.saveSession(updatedSession);
    if (!res.success) console.error('[AgentSessionRoom] Erro ao salvar mensagem:', res.error);

    if (sessionStatus !== 'running') {
      setSessionStatus('running');
      await window.api.agents.startInteraction(session.id);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: completed ? 'completed' : 'pending' } : t));
    await window.api.agents.toggleTask(session.id, taskId, completed);
  };

  const handleAddAgent = async (agentId: string) => {
    if (localAgentIds.includes(agentId)) return;
    const updatedAgentIds = [...localAgentIds, agentId];
    setLocalAgentIds(updatedAgentIds);
    const updatedSession = { ...session, agentIds: updatedAgentIds, lastUpdated: new Date() };
    const res = await window.api.agents.saveSession(updatedSession);
    if (res.success && onRefresh) onRefresh();
    else if (!res.success) console.error('[AgentSessionRoom] Erro ao adicionar agente:', res.error);
  };

  const handleTruncateHistory = async (messageId: string) => {
    const successRes = await window.api.agents.truncateSession(session.id, messageId);
    if (successRes.success) {
      const msgIndex = localMessages.findIndex(m => m.id === messageId);
      if (msgIndex !== -1) {
        setLocalMessages(localMessages.slice(0, msgIndex + 1));
      }
    }
  };

  const getAgent = (id: string) => agents.find(a => a.id === id);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-bg-app border border-white/[0.03] rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
      
      {/* Container Principal do Chat */}
      <div className="flex-1 flex flex-col min-w-0 h-full border-r border-white/[0.04]">
        
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/[0.04] bg-[#090a0d]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-white/[0.06] rounded-xl text-text-muted transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div>
              <h2 className="font-bold text-sm text-text-main line-clamp-1">{session.title}</h2>
              <span className="text-[9px] text-text-muted/50 uppercase tracking-widest font-black">Sala de Colaboração</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionStatus === 'running' ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/20 transition-all"
              >
                <Pause size={12} fill="currentColor" /> Pausar
              </button>
            ) : sessionStatus === 'concluded' ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all"
              >
                <RotateCcw size={12} /> Reiniciar Debate
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                <Play size={12} fill="currentColor" /> Iniciar Debate
              </button>
            )}
          </div>
        </div>

        {/* Histórico do Chat */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-white/[0.005]">
          {localMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group relative max-w-full">
              <div
                style={{ backgroundColor: `${msg.senderColor}15`, color: msg.senderColor }}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/[0.03] select-none"
              >
                {msg.senderEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-bold text-xs text-text-main">{msg.senderName}</span>
                  <span className="text-[9px] text-text-muted/65 font-medium px-1.5 py-0.2 bg-white/[0.04] rounded-md border border-white/[0.02]">
                    {msg.senderRole}
                  </span>
                  <span className="text-[8px] text-text-muted/30 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-text-muted leading-relaxed font-sans prose prose-invert max-w-none">
                  <Markdown content={msg.content} />
                </div>
              </div>

              {/* Botão de Truncar para Re-run ao passar o mouse */}
              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleTruncateHistory(msg.id)}
                  className="p-1 hover:bg-white/[0.08] text-text-muted/50 hover:text-red-400 rounded-lg transition-all"
                  title="Recomeçar debate a partir desta mensagem"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Streaming de IA ativa */}
          {activeAgentId && streamingData[activeAgentId] && (
            <div className="flex gap-3 max-w-full animate-fade-in">
              <div
                style={{
                  backgroundColor: `${getAgent(activeAgentId)?.color}15`,
                  color: getAgent(activeAgentId)?.color
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/[0.03] select-none"
              >
                {getAgent(activeAgentId)?.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-bold text-xs text-text-main">{getAgent(activeAgentId)?.name}</span>
                  <span className="text-[9px] text-text-muted/65 font-medium px-1.5 py-0.2 bg-white/[0.04] rounded-md border border-white/[0.02]">
                    {getAgent(activeAgentId)?.role}
                  </span>
                  <span className="text-[8px] text-primary uppercase font-bold tracking-wider animate-pulse ml-2">
                    escrevendo...
                  </span>
                </div>
                <div className="text-xs text-text-muted leading-relaxed font-sans">
                  <Markdown content={streamingData[activeAgentId]} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input de Envio Humano */}
        <AgentChatInput
          value={inputVal}
          onChange={setInputVal}
          onSend={handleSendUserMessage}
          activeAgents={agents.filter(a => localAgentIds.includes(a.id))}
        />
      </div>

      {/* Painel Lateral de Trabalho dos Agentes (Agent Monitor Panel) */}
      <AgentMonitorPanel
        agentIds={localAgentIds}
        agents={agents}
        activeAgentId={activeAgentId}
        streamingData={streamingData}
        status={sessionStatus}
        stats={stats}
        maxRounds={session.maxRounds}
        tasks={localTasks}
        onToggleTask={handleToggleTask}
        onAddAgent={handleAddAgent}
        workflowTasks={workflowTasks}
        workflowLogs={workflowLogs}
        isWorkflowActive={isWorkflowActive}
        onStartWorkflow={handleStartWorkflow}
        onStopWorkflow={handleStopWorkflow}
      />
    </div>
  );
};
