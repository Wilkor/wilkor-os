import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, X, Users2 } from 'lucide-react';
import { IAgent, IAgentSession } from '../../../../shared/types';
import { AgentListTab } from './AgentListTab';
import { AgentSessionsTab } from './AgentSessionsTab';
import { AgentSessionRoom } from './AgentSessionRoom';

interface AgentStudioProps {
  onClose: () => void;
}

export const AgentStudio: React.FC<AgentStudioProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'sessions'>('sessions');
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [sessions, setSessions] = useState<IAgentSession[]>([]);
  
  // Gerenciamento de Múltiplas Abas de Discussões Paralelas
  const [openSessions, setOpenSessions] = useState<IAgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Carrega agentes e sessões ao montar
  const loadData = async () => {
    try {
      const agentsRes = await window.api.agents.list();
      if (agentsRes.success) setAgents(agentsRes.agents);

      const sessionsRes = await window.api.agents.listSessions();
      if (sessionsRes.success) setSessions(sessionsRes.sessions);
    } catch (err) {
      console.error('Erro ao carregar dados do AgentStudio:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sincroniza as abas abertas com as atualizações do banco
  useEffect(() => {
    setOpenSessions(prev => prev.map(openSession => {
      const updated = sessions.find(s => s.id === openSession.id);
      return updated || openSession;
    }).filter(openSession => sessions.some(s => s.id === openSession.id)));
  }, [sessions]);

  const handleSaveAgent = async (agent: IAgent) => {
    const res = await window.api.agents.save(agent);
    if (res.success) {
      await loadData();
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este agente?')) {
      const res = await window.api.agents.delete(id);
      if (res.success) {
        await loadData();
      }
    }
  };

  const handleCreateSession = async (
    title: string,
    agentIds: string[],
    maxRounds?: number,
    topic?: string,
    repoPath?: string,
    trelloCardId?: string,
    trelloCardName?: string
  ) => {
    const newSession: IAgentSession = {
      id: Math.random().toString(36).substring(2, 11),
      title,
      agentIds,
      messages: [],
      status: 'idle',
      lastUpdated: new Date(),
      maxRounds: maxRounds || 20,
      repoPath,
      trelloCardId,
      trelloCardName
    };

    if (topic) {
      newSession.messages.push({
        id: Math.random().toString(36).substring(2, 11),
        senderName: 'Wilkor',
        senderRole: 'Humano',
        senderEmoji: '👤',
        senderColor: '#10B981',
        content: topic,
        timestamp: new Date()
      });
    }

    const res = await window.api.agents.saveSession(newSession);
    if (res.success) {
      await loadData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro desconhecido ao salvar sessão' };
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Deseja excluir esta sala de debate de forma definitiva?')) {
      const res = await window.api.agents.deleteSession(id);
      if (res.success) {
        await loadData();
        setOpenSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId(null);
        }
      }
    }
  };

  const handleSelectSession = (session: IAgentSession) => {
    if (!openSessions.some(s => s.id === session.id)) {
      setOpenSessions(prev => [...prev, session]);
    }
    setActiveSessionId(session.id);
  };

  const handleCloseTab = (id: string) => {
    setOpenSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050507] text-text-main font-sans overflow-hidden p-6 relative">
      {/* Header Central de Controle */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.04] mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Users2 size={18} />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-text-main">
              Agent Studio
            </h1>
            <p className="text-[10px] text-text-muted/60 uppercase tracking-widest font-black">
              Espaço de Agentes Autônomos & Discussões
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-white/[0.06] rounded-xl text-text-muted hover:text-text-main transition-colors border border-transparent hover:border-white/[0.04]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Barra de Abas de Discussões Paralelas */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-3 mb-5 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => setActiveSessionId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg border transition-all shrink-0 ${
            activeSessionId === null
              ? 'bg-primary/10 border-primary/30 text-primary font-black shadow-inner shadow-primary/5'
              : 'bg-white/[0.01] border-white/[0.04] text-text-muted hover:bg-white/[0.03]'
          }`}
        >
          🏠 Painel Principal
        </button>

        {openSessions.map((s) => {
          const isActive = activeSessionId === s.id;
          const isRunning = s.status === 'running';
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all shrink-0 ${
                isActive
                  ? 'bg-white/[0.03] border-white/[0.08] text-text-main font-bold'
                  : 'bg-black/35 border-white/[0.02] text-text-muted hover:bg-white/[0.02] hover:text-text-main'
              }`}
            >
              <button
                onClick={() => setActiveSessionId(s.id)}
                className="flex items-center gap-1.5 pr-1 focus:outline-none"
              >
                {isRunning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-400/30" />
                )}
                <span className="max-w-[110px] truncate">{s.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(s.id);
                }}
                className="p-0.5 rounded-md hover:bg-white/[0.08] text-text-muted/40 hover:text-text-main transition-all"
              >
                <X size={9} />
              </button>
            </div>
          );
        })}
      </div>

      {activeSessionId !== null ? (
        // Renderiza a sala ativa do debate
        (() => {
          const current = openSessions.find(s => s.id === activeSessionId) || sessions.find(s => s.id === activeSessionId);
          if (!current) return <p className="text-xs text-text-muted">Discussão não encontrada.</p>;
          return (
            <AgentSessionRoom
              session={current}
              agents={agents}
              onBack={() => {
                setActiveSessionId(null);
                loadData();
              }}
              onRefresh={loadData}
            />
          );
        })()
      ) : (
        // Renderiza a listagem de agentes ou sessões
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navegação por Abas do Painel */}
          <div className="flex gap-2 mb-6 shrink-0">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === 'sessions'
                  ? 'bg-primary/10 border-primary/30 text-primary font-black shadow-inner shadow-primary/5'
                  : 'bg-white/[0.01] border-white/[0.04] text-text-muted hover:bg-white/[0.03]'
              }`}
            >
              <MessageSquare size={14} /> Salas de Debate
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === 'agents'
                  ? 'bg-primary/10 border-primary/30 text-primary font-black shadow-inner shadow-primary/5'
                  : 'bg-white/[0.01] border-white/[0.04] text-text-muted hover:bg-white/[0.03]'
              }`}
            >
              <Bot size={14} /> Cadastro de Agentes
            </button>
          </div>

          {/* Conteúdo da Aba */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'agents' ? (
              <AgentListTab
                agents={agents}
                onSaveAgent={handleSaveAgent}
                onDeleteAgent={handleDeleteAgent}
              />
            ) : (
              <AgentSessionsTab
                sessions={sessions}
                agents={agents}
                onCreateSession={handleCreateSession}
                onDeleteSession={handleDeleteSession}
                onSelectSession={handleSelectSession}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentStudio;
