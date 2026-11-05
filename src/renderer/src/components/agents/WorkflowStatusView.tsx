import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Square, Circle, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkflowTaskState {
  taskId: string;
  status: 'idle' | 'preparing_worktree' | 'planning' | 'executing' | 'committing' | 'completed' | 'error';
  agentName: string;
  agentEmoji: string;
  agentColor: string;
  branchName: string;
  worktreePath?: string;
  progress: number;
}

interface WorkflowStatusViewProps {
  tasks: WorkflowTaskState[];
  logs: Record<string, string[]>;
  onStop: () => void;
}

export const WorkflowStatusView: React.FC<WorkflowStatusViewProps> = ({ tasks, logs, onStop }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll nos logs do console expandido
  useEffect(() => {
    if (expandedTaskId) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [expandedTaskId, logs]);

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(prev => (prev === taskId ? null : taskId));
  };

  const getStatusLabel = (status: WorkflowTaskState['status']) => {
    switch (status) {
      case 'idle': return 'Aguardando';
      case 'preparing_worktree': return 'Preparando Worktree';
      case 'planning': return 'Planejando';
      case 'executing': return 'Escrevendo Código';
      case 'committing': return 'Salvando & Subindo';
      case 'completed': return 'Concluído';
      case 'error': return 'Falha';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: WorkflowTaskState['status']) => {
    switch (status) {
      case 'completed': return '#A855F7'; // Roxo/Neon
      case 'error': return '#EF4444'; // Vermelho
      case 'preparing_worktree': return '#3B82F6'; // Azul
      case 'planning': return '#F59E0B'; // Amarelo
      case 'executing': return '#10B981'; // Verde Esmeralda
      case 'committing': return '#06B6D4'; // Ciano
      default: return '#6B7280';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#090a0d]/90">
      {/* Header do Painel de Workflow */}
      <div className="p-3 border-b border-white/[0.04] bg-[#0c0d12]/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 animate-pulse">
          <Circle size={8} fill="#10B981" className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-text-main">Execução Paralela</span>
        </div>
        <button
          onClick={onStop}
          className="flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[9px] rounded-lg border border-red-500/20 transition-all uppercase tracking-wider"
        >
          <Square size={9} fill="currentColor" /> Parar
        </button>
      </div>

      {/* Lista de Processos dos Agentes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tasks.map(task => {
          const isExpanded = expandedTaskId === task.taskId;
          const statusColor = getStatusColor(task.status);
          const taskLogs = logs[task.taskId] || [];

          return (
            <div
              key={task.taskId}
              className="bg-white/[0.01] border border-white/[0.04] rounded-xl overflow-hidden transition-all hover:bg-white/[0.02]"
            >
              {/* Header do Card de Agente */}
              <div className="p-2.5 flex items-center justify-between cursor-pointer select-none" onClick={() => toggleExpand(task.taskId)}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{task.agentEmoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[10px] text-text-main line-clamp-1 leading-none mb-0.5">{task.agentName}</p>
                    <span className="text-[8px] font-mono text-text-muted/50 truncate block">wt-{task.taskId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border"
                    style={{
                      color: statusColor,
                      borderColor: `${statusColor}30`,
                      backgroundColor: `${statusColor}10`
                    }}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                  {isExpanded ? <ChevronUp size={11} className="text-text-muted/60" /> : <ChevronDown size={11} className="text-text-muted/60" />}
                </div>
              </div>

              {/* Barra de Progresso Animada */}
              <div className="px-2.5 pb-2.5">
                <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${task.progress}%`,
                      backgroundColor: statusColor,
                      boxShadow: `0 0 8px ${statusColor}`
                    }}
                  />
                </div>
                {task.worktreePath && (
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[7.5px] font-mono text-[#06B6D4] truncate max-w-[130px]">
                      {task.branchName}
                    </span>
                    <span className="text-[7.5px] text-text-muted/30 font-medium">
                      {task.progress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Console de Logs Expansível */}
              {isExpanded && (
                <div className="border-t border-white/[0.03] bg-black/60 font-mono text-[9px] text-[#00FF66]/80 p-2.5 max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.04] pb-1.5 mb-1.5 text-text-muted/40 uppercase tracking-widest text-[8px] font-bold">
                    <Terminal size={9} /> Console Logs do Agente
                  </div>
                  {taskLogs.length > 0 ? (
                    <div className="space-y-1 select-text">
                      {taskLogs.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap leading-tight break-all">
                          {line}
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  ) : (
                    <p className="text-text-muted/30 italic">Nenhum log gerado ainda...</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted/30">
            <Terminal size={24} className="mb-2 opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-wider">Aguardando Tarefas...</p>
          </div>
        )}
      </div>
    </div>
  );
};
