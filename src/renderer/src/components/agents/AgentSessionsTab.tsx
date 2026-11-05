import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Users, MessageCircle } from 'lucide-react';
import { IAgent, IAgentSession } from '../../../../shared/types';
import { CreateSessionForm } from './CreateSessionForm';

interface AgentSessionsTabProps {
  sessions: IAgentSession[];
  agents: IAgent[];
  onCreateSession: (
    title: string,
    agentIds: string[],
    maxRounds?: number,
    topic?: string,
    repoPath?: string,
    trelloCardId?: string,
    trelloCardName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteSession: (id: string) => Promise<void>;
  onSelectSession: (session: IAgentSession) => void;
}

const STATUS_STYLES: Record<string, string> = {
  running: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 animate-pulse',
  paused: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/20',
  concluded: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/20',
};

const STATUS_LABELS: Record<string, string> = {
  running: 'Rodando',
  paused: 'Pausado',
  concluded: 'Concluído',
};

export const AgentSessionsTab: React.FC<AgentSessionsTabProps> = ({
  sessions,
  agents,
  onCreateSession,
  onDeleteSession,
  onSelectSession
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceRoots, setWorkspaceRoots] = useState<string[]>([]);

  useEffect(() => {
    window.api.workspace.getRoots().then((roots) => {
      setWorkspaceRoots(roots || []);
    });
  }, []);

  const handleOpenCreate = () => {
    setIsFormOpen(true);
  };

  const getAgentInfo = (id: string) => agents.find(a => a.id === id);

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1">
      {/* Lista de Sessões */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-muted/60 uppercase tracking-wider">
            Salas de Debate ({sessions.length})
          </h3>
          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={agents.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Criar Sala
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-white/[0.04] rounded-2xl bg-white/[0.01] p-8 text-center">
            <MessageSquare size={40} className="text-text-muted/20 mb-3" />
            <p className="text-sm text-text-muted">Nenhuma sala de debate criada.</p>
            <p className="text-xs text-text-muted/50 mt-1">
              {agents.length === 0 ? 'Cadastre pelo menos um agente na aba ao lado para começar!' : 'Crie uma sala de debate para colocar seus agentes para interagir!'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="group border border-white/[0.04] bg-[#0d0e12]/80 hover:bg-[#121319] hover:border-primary/20 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-main group-hover:text-primary transition-colors line-clamp-1">{session.title}</h4>
                        <span className="text-[9px] text-text-muted/50">Atualizado em {new Date(session.lastUpdated).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                      className="p-1.5 hover:bg-red-500/10 text-text-muted hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-text-muted/60">Participantes:</span>
                    <div className="flex -space-x-2.5 overflow-hidden">
                      {session.agentIds.map((agentId, idx) => {
                        const ag = getAgentInfo(agentId);
                        if (!ag) return null;
                        return (
                          <div
                            key={agentId}
                            style={{ backgroundColor: ag.color, zIndex: 10 - idx }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-[#0d0e12] select-none cursor-help"
                            title={`${ag.name} (${ag.role})`}
                          >
                            {ag.emoji}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {session.repoPath && (
                    <div className="text-[9px] text-text-muted/60 mb-1 truncate">
                      📁 Projeto: <span className="text-primary font-semibold">{session.repoPath.split(/[\\/]/).pop()}</span>
                    </div>
                  )}

                  {session.trelloCardName && (
                    <div className="text-[9px] text-emerald-400/80 mb-2 truncate">
                      📌 Card: <span className="font-semibold">{session.trelloCardName}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/[0.03] pt-3 flex items-center justify-between text-[10px]">
                  <span className="text-text-muted flex items-center gap-1">
                    <Users size={11} /> {session.agentIds.length} agente{session.agentIds.length !== 1 ? 's' : ''}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider border ${STATUS_STYLES[session.status] || 'bg-white/[0.04] text-text-muted border-white/[0.02]'}`}>
                    {STATUS_LABELS[session.status] || 'Ocioso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário Lateral Modularizado */}
      {isFormOpen && (
        <CreateSessionForm
          agents={agents}
          workspaceRoots={workspaceRoots}
          isLoading={isLoading}
          onClose={() => setIsFormOpen(false)}
          onCreate={async (opts) => {
            setIsLoading(true);
            try {
              const res = await onCreateSession(
                opts.title,
                opts.agentIds,
                opts.maxRounds,
                opts.topic,
                opts.repoPath,
                opts.trelloCardId,
                opts.trelloCardName
              );
              if (res.success) {
                setIsFormOpen(false);
              } else {
                alert(res.error || 'Erro ao criar a sala.');
              }
            } catch (err: any) {
              alert(err.message || 'Erro inesperado ao criar sala.');
            } finally {
              setIsLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};
