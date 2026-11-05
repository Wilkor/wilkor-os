import React, { useState } from 'react';
import { Monitor, Circle, Clock, BarChart2, DollarSign, RefreshCw, ListTodo, Layout, Terminal, Database, Shield, CheckSquare, Square, UserPlus, Play } from 'lucide-react';
import { IAgent, ISessionStats, IAgentTask } from '../../../../shared/types';
import { WorkflowStatusView } from './WorkflowStatusView';

interface AgentMonitorPanelProps {
  agentIds: string[];
  agents: IAgent[];
  activeAgentId?: string;
  streamingData: Record<string, string>;
  status: 'idle' | 'running' | 'paused' | 'concluded';
  stats?: ISessionStats;
  maxRounds?: number;
  tasks?: IAgentTask[];
  onToggleTask?: (taskId: string, completed: boolean) => void;
  onAddAgent?: (agentId: string) => void;

  // Props adicionais para o workflow paralelo e git worktree
  workflowTasks?: any[];
  workflowLogs?: Record<string, string[]>;
  isWorkflowActive?: boolean;
  onStartWorkflow?: (taskIds: string[]) => void;
  onStopWorkflow?: () => void;
}

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rest = secs % 60;
  return `${mins}m ${rest}s`;
}

function formatCost(cost: number): string {
  if (cost < 0.0001) return '<$0.0001';
  return `$${cost.toFixed(4)}`;
}

export const AgentMonitorPanel: React.FC<AgentMonitorPanelProps> = ({
  agentIds, agents, activeAgentId, streamingData, status, stats, maxRounds, tasks, onToggleTask, onAddAgent,
  workflowTasks, workflowLogs, isWorkflowActive, onStartWorkflow, onStopWorkflow
}) => {
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const availableAgents = agents.filter(a => !agentIds.includes(a.id));
  const getAgent = (id: string) => agents.find(a => a.id === id);

  const statusColors: Record<string, string> = {
    idle: '#6B7280',
    running: '#10B981',
    paused: '#F59E0B',
    concluded: '#A855F7',
  };

  const statusLabels: Record<string, string> = {
    idle: 'Ocioso',
    running: 'Rodando',
    paused: 'Pausado',
    concluded: '✅ Concluído',
  };

  return (
    <div className="w-64 bg-[#090a0d]/80 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-primary" />
          <h3 className="text-xs font-black uppercase tracking-wider text-text-main">Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          {availableAgents.length > 0 && (
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="p-1 hover:bg-white/[0.06] text-text-muted hover:text-primary rounded-lg transition-all border border-white/[0.04]"
              title="Adicionar Agente ao debate"
            >
              <UserPlus size={12} />
            </button>
          )}
          <span
            className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ color: statusColors[status], borderColor: `${statusColors[status]}40`, backgroundColor: `${statusColors[status]}15` }}
          >
            {statusLabels[status]}
          </span>
        </div>

        {/* Dropdown flutuante de adição de agentes */}
        {showAddDropdown && (
          <div className="absolute top-full right-4 mt-1 w-56 bg-black/90 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 p-1.5 animate-fade-in max-h-48 overflow-y-auto">
            <p className="px-2 py-1 text-[8px] font-black uppercase tracking-widest text-text-muted/40 mb-1 border-b border-white/[0.04]">Adicionar Agente</p>
            {availableAgents.map(ag => (
              <button
                key={ag.id}
                onClick={() => {
                  onAddAgent?.(ag.id);
                  setShowAddDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[10px] text-text-muted hover:text-text-main hover:bg-white/[0.04] transition-all"
              >
                <span>{ag.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-none line-clamp-1">{ag.name}</p>
                  <p className="text-[8px] text-text-muted/65 leading-tight truncate">{ag.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Corpo do Painel: Alterna entre Workflow Paralelo e Vista Normal */}
      {isWorkflowActive ? (
        <WorkflowStatusView
          tasks={workflowTasks || []}
          logs={workflowLogs || {}}
          onStop={onStopWorkflow || (() => {})}
        />
      ) : (
        <>
          {/* Agents list */}
          <div className="h-[170px] shrink-0 overflow-y-auto p-3 space-y-2 border-b border-white/[0.04]">
            {agentIds.map((id) => {
              const ag = getAgent(id);
              if (!ag) return null;
              const isActive = activeAgentId === id;
              const isStreaming = isActive && !!streamingData[id];
              return (
                <div
                  key={id}
                  className={`p-2 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-primary/10 border-primary/30 shadow-md shadow-primary/5'
                      : 'bg-white/[0.01] border-white/[0.03] opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm select-none">{ag.emoji}</span>
                      <div>
                        <p className="font-bold text-[10px] text-text-main line-clamp-1">{ag.name}</p>
                        <p className="text-[8px] text-text-muted/65">{ag.role}</p>
                      </div>
                    </div>
                    <Circle
                      size={5}
                      fill={isActive ? ag.color : '#6B7280'}
                      style={{ color: isActive ? ag.color : '#6B7280' }}
                      className={isActive ? 'animate-ping' : ''}
                    />
                  </div>
                  <div className="text-[9px] bg-black/35 rounded-md px-1.5 py-1 font-mono text-text-muted/70 flex items-center gap-1 border border-white/[0.02]">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    {isStreaming ? (
                      <span className="text-primary font-semibold">Digitando...</span>
                    ) : isActive ? (
                      <span className="text-amber-400 font-semibold animate-pulse">Processando...</span>
                    ) : (
                      <span>Aguardando turno</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checklist de Tarefas */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col border-b border-white/[0.04] bg-white/[0.002]">
            <div className="flex items-center gap-2 mb-3 w-full">
              <ListTodo size={13} className="text-primary" />
              <h4 className="text-[10px] font-black uppercase tracking-wider text-text-muted/60">Checklist do Debate</h4>
              {tasks && tasks.filter(t => t.status === 'pending').length > 0 && onStartWorkflow && (
                <button
                  onClick={() => onStartWorkflow(tasks.filter(t => t.status === 'pending').map(t => t.id))}
                  className="ml-auto flex items-center gap-1 px-2 py-0.8 bg-primary/20 hover:bg-primary/30 text-[#00E5FF] font-bold text-[8px] rounded-lg border border-primary/30 transition-all uppercase tracking-wider shadow-md shadow-primary/5"
                  title="Executar tarefas pendentes em paralelo com múltiplos agentes e git worktree"
                >
                  <Play size={8} fill="currentColor" /> Auto-Run
                </button>
              )}
            </div>
            
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {tasks.map((task) => {
                  const categoryDetails = {
                    front: { label: 'Front', icon: Layout, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
                    back: { label: 'Back', icon: Terminal, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
                    database: { label: 'DB', icon: Database, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
                    security: { label: 'Sec', icon: Shield, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
                  }[task.category] || { label: 'Geral', icon: ListTodo, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };

                  const IconComponent = categoryDetails.icon;
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                        isCompleted
                          ? 'bg-white/[0.01] border-white/[0.02] opacity-50'
                          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                      }`}
                    >
                      <button
                        onClick={() => onToggleTask && onToggleTask(task.id, !isCompleted)}
                        className={`mt-0.5 shrink-0 transition-colors ${isCompleted ? 'text-emerald-400' : 'text-text-muted/40 hover:text-primary'}`}
                      >
                        {isCompleted ? <CheckSquare size={13} /> : <Square size={13} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] leading-tight font-medium break-words ${isCompleted ? 'line-through text-text-muted/50' : 'text-text-main'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span
                            className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded border flex items-center gap-0.5"
                            style={{ color: categoryDetails.color, borderColor: `${categoryDetails.color}30`, backgroundColor: categoryDetails.bg }}
                          >
                            <IconComponent size={7} />
                            {categoryDetails.label}
                          </span>
                          <span className="text-[7.5px] text-text-muted/40 uppercase tracking-wider font-semibold">
                            Para: {task.assignedTo}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.04] rounded-2xl p-4 text-center">
                <ListTodo size={18} className="text-text-muted/20 mb-1.5" />
                <p className="text-[9px] text-text-muted/40 font-bold uppercase tracking-wider">Nenhuma tarefa</p>
                <p className="text-[8px] text-text-muted/30 mt-0.5">Os agentes criarão tarefas quando identificarem itens necessários.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Stats bar */}
      {stats && (
        <div className="p-4 border-t border-white/[0.04] space-y-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 mb-3">Estatísticas</p>

          <div className="flex items-center justify-between text-[10px] text-text-muted/70">
            <span className="flex items-center gap-1"><Clock size={10} /> Duração</span>
            <span className="font-bold text-text-main">{formatDuration(stats.durationMs)}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-muted/70">
            <span className="flex items-center gap-1"><RefreshCw size={10} /> Rodadas</span>
            <span className="font-bold text-text-main">
              {stats.totalRounds}/{maxRounds || 20}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-muted/70">
            <span className="flex items-center gap-1"><BarChart2 size={10} /> ~Tokens</span>
            <span className="font-bold text-text-main">{stats.estimatedTokens.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-muted/70">
            <span className="flex items-center gap-1"><DollarSign size={10} /> Custo est.</span>
            <span className="font-bold text-emerald-400">{formatCost(stats.estimatedCost)}</span>
          </div>

          {/* Progress bar de rodadas */}
          <div className="mt-2">
            <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.totalRounds / (maxRounds || 20)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
