import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, RefreshCw, Folder, Clock, Database, Sparkles, Bug, HelpCircle } from 'lucide-react';
import { Theme } from '../../config/themes';

interface TechBacklogViewProps {
  onStartSpecification: (card: any, pendingTask: any) => void;
  theme: Theme;
}

export const TechBacklogView: React.FC<TechBacklogViewProps> = ({ onStartSpecification, theme }) => {
  const [pendings, setPendings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPendings = async () => {
    setIsLoading(true);
    try {
      if ((window as any).api?.pipeline?.getTechPendings) {
        const res = await (window as any).api.pipeline.getTechPendings();
        if (Array.isArray(res)) {
          setPendings(res);
        }
      }
    } catch (err) {
      console.error('[TechBacklog] Erro ao buscar pendencias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendings();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir esta especificação pendente?')) return;
    try {
      if ((window as any).api?.pipeline?.deleteTechPending) {
        const res = await (window as any).api.pipeline.deleteTechPending(id);
        if (res.success || res.deletedCount > 0) {
          setPendings(prev => prev.filter(p => p.id !== id));
        }
      }
    } catch (err) {
      console.error('[TechBacklog] Erro ao deletar pendencia:', err);
    }
  };

  const getRepoName = (path: string) => {
    if (!path) return 'Não selecionado';
    return path.split(/[\\/]/).pop() || path;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return 'Data inválida';
    }
  };

  return (
    <div className="px-10 py-6 max-w-[1600px] mx-auto w-full h-full flex flex-col gap-6" style={{ color: theme.colors.textMain }}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Database size={18} style={{ color: theme.colors.primary }} />
            Fila de Pendências de Desenvolvimento
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.colors.textMuted }}>
            Especificações de negócio concluídas aguardando refinamento técnico (Tech)
          </p>
        </div>
        <button
          onClick={fetchPendings}
          disabled={isLoading}
          className="p-2.5 rounded-xl border hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
          style={{ borderColor: theme.colors.borderColor, backgroundColor: theme.colors.bgPanel }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin text-primary" size={32} style={{ color: theme.colors.primary }} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Buscando pendências...</span>
            </motion.div>
          ) : pendings.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl p-8" style={{ borderColor: theme.colors.borderColor }}>
              <div className="p-4 bg-white/5 rounded-full mb-3 opacity-40">
                <Database size={32} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider mb-1">Nenhuma pendência técnica</h3>
              <p className="text-xs text-text-muted max-w-sm">
                Excelente! Todas as especificações de negócio foram tratadas pela equipe técnica e já estão no Trello.
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendings.map((pending, i) => (
                <motion.div
                  key={pending.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col p-5 border rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 relative overflow-hidden group border-white/5 hover:border-white/10"
                  style={{ backgroundColor: theme.colors.bgPanel }}
                >
                  {/* Glow top right based on taskType */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none group-hover:scale-125 transition-transform ${
                    pending.taskType === 'fix' ? 'bg-red-500' : pending.taskType === 'outros' ? 'bg-amber-500' : 'bg-primary'
                  }`} />
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg text-xs ${
                        pending.taskType === 'fix' ? 'bg-red-500/10 text-red-400' : pending.taskType === 'outros' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-muted text-primary'
                      }`}>
                        {pending.taskType === 'fix' ? <Bug size={14} /> : pending.taskType === 'outros' ? <HelpCircle size={14} /> : <Sparkles size={14} />}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-60">
                        {pending.taskType === 'fix' ? 'BUG / FIX' : pending.taskType === 'outros' ? 'OUTROS' : 'FEATURE'}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => handleDelete(pending.id, e)}
                      className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-text-muted transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir Pendência"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-primary transition-colors" style={{ color: theme.colors.primary }}>
                    {pending.card?.name || 'Sem Título'}
                  </h3>
                  
                  <p className="text-[10px] leading-relaxed opacity-60 line-clamp-3 mb-4 flex-1">
                    {pending.prdContent || 'Sem descrição de requisitos cadastrada.'}
                  </p>

                  <div className="border-t pt-3 flex flex-col gap-2 border-white/5">
                    <div className="flex items-center gap-2 text-[9px] text-text-muted">
                      <Folder size={11} className="opacity-60" />
                      <span className="font-semibold truncate">Repo: {getRepoName(pending.repoPath)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-text-muted">
                      <Clock size={11} className="opacity-60" />
                      <span>Gerado em: {formatDate(pending.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartSpecification(pending.card, pending)}
                    className="w-full mt-4 py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                    style={{ color: theme.colors.primary, borderColor: `${theme.colors.primary}33` }}
                  >
                    <Play size={10} fill="currentColor" />
                    Iniciar Detalhamento Técnico
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
