import React from 'react';
import { Play, Trash2, Pencil } from 'lucide-react';
import { IAgent } from '../../../../shared/types';

interface CronCardProps {
  job: any;
  agents: IAgent[];
  onToggle: (id: string, enabled: boolean) => void;
  onRun: (id: string) => void;
  onEdit: (job: any) => void;
  onDelete: (id: string) => void;
}

export const CronCard: React.FC<CronCardProps> = ({
  job,
  agents,
  onToggle,
  onRun,
  onEdit,
  onDelete
}) => {
  return (
    <div
      className="p-5 bg-white/5 border border-border/60 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-white/10 hover:border-border"
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-3">
          <h4 className="text-xs font-black text-text-main leading-none">{job.name}</h4>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
            {job.cronExpr}
          </span>
          <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-white/10 text-text-muted rounded-md font-bold">
            {job.modelId}
          </span>
        </div>
        <p className="text-[10px] text-text-muted line-clamp-2 italic pr-6">
          "{job.prompt}"
        </p>
        {job.agentIds && job.agentIds.length > 0 && (
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="text-[8px] font-black uppercase text-text-muted">Agentes vinculados:</span>
            <div className="flex items-center -space-x-1.5">
              {job.agentIds.map((aId: string) => {
                const agent = agents.find((a) => a.id === aId);
                if (!agent) return null;
                return (
                  <span
                    key={aId}
                    title={`${agent.name} (${agent.role})`}
                    style={{ 
                      backgroundColor: agent.color || '#A855F7', 
                      borderColor: '#1e1e2e'
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-black/40 font-bold shadow-sm cursor-help hover:scale-110 transition-all select-none"
                  >
                    {agent.emoji || '🤖'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 text-[8px] text-text-muted font-bold uppercase tracking-wider">
          <span>Criado em: {new Date(job.createdAt).toLocaleDateString()}</span>
          {job.lastRun && (
            <span className="text-primary">Última Execução: {new Date(job.lastRun).toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(job.id, !job.enabled)}
          className={`text-[9px] font-black uppercase px-3 py-2 rounded-xl transition-all ${
            job.enabled
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {job.enabled ? 'Ativo' : 'Pausado'}
        </button>

        <button
          onClick={() => onRun(job.id)}
          title="Executar Agora"
          className="p-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-xl transition-all"
        >
          <Play size={14} />
        </button>

        <button
          onClick={() => onEdit(job)}
          title="Editar Cron"
          className="p-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all"
        >
          <Pencil size={14} />
        </button>

        <button
          onClick={() => onDelete(job.id)}
          title="Deletar Cron"
          className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
