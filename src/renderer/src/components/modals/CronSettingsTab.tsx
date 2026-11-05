import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus } from 'lucide-react';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { Theme } from '../../config/themes';
import { CronAddForm } from './CronAddForm';
import { CronCard } from './CronCard';
import { IAgent } from '../../../../shared/types';

interface CronSettingsTabProps {
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  theme: Theme;
}

export const CronSettingsTab: React.FC<CronSettingsTabProps> = ({ addToast, theme }) => {
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCronName, setNewCronName] = useState('');
  const [newCronExpr, setNewCronExpr] = useState('0 18 * * *');
  const [newCronPrompt, setNewCronPrompt] = useState('Consulte os commits recentes de todos os projetos no wOs e gere um relatório das últimas novidades.');
  const [newCronModel, setNewCronModel] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const resetFormFields = () => {
    setNewCronName('');
    setNewCronExpr('0 18 * * *');
    setNewCronPrompt('Consulte os commits recentes de todos os projetos no wOs e gere um relatório das últimas novidades.');
    setNewCronModel('auto');
    setSelectedAgentIds([]);
  };

  const handleEditCron = (job: any) => {
    setEditingJobId(job.id);
    setNewCronName(job.name);
    setNewCronExpr(job.cronExpr);
    setNewCronPrompt(job.prompt);
    setNewCronModel(job.modelId || 'auto');
    setSelectedAgentIds(job.agentIds || []);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    resetFormFields();
    setShowAddForm(false);
  };

  const fetchCrons = async () => {
    try {
      setLoading(true);
      const res = await window.api.cron.list();
      if (res && res.success) {
        setCronJobs(res.cronJobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await window.api.agents.list();
      if (res?.success) setAgents(res.agents || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCrons();
    fetchAgents();

    if (window.api && window.api.cron && window.api.cron.onStatus) {
      const cleanup = window.api.cron.onStatus((data: any) => {
        fetchCrons();
        if (data.status === 'success') {
          if (addToast) {
            addToast('Tarefa agendada finalizada com sucesso! Relatório disponível no histórico de conversas 🕒', 'success');
          }
        } else if (data.status === 'error') {
          if (addToast) {
            addToast(`Falha crítica ao rodar tarefa agendada: ${data.error}`, 'error');
          }
        }
      });
      return cleanup;
    }
    return undefined;
  }, []);

  const handleToggleAgentSelection = (id: string) => {
    setSelectedAgentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateCron = async () => {
    if (!newCronName.trim() || !newCronExpr.trim() || !newCronPrompt.trim()) {
      if (addToast) addToast('Por favor, preencha todos os campos.', 'warning');
      return;
    }
    const targetJob = editingJobId ? cronJobs.find(j => j.id === editingJobId) : null;
    const newJob = {
      id: editingJobId || Math.random().toString(36).substring(2, 11),
      name: newCronName,
      cronExpr: newCronExpr,
      prompt: newCronPrompt,
      modelId: newCronModel,
      agentIds: selectedAgentIds,
      enabled: targetJob ? targetJob.enabled : true,
      createdAt: targetJob ? targetJob.createdAt : new Date(),
      lastRun: targetJob ? targetJob.lastRun : null
    };
    try {
      const res = await window.api.cron.save(newJob);
      if (res && res.success) {
        resetFormFields();
        setEditingJobId(null);
        setShowAddForm(false);
        if (addToast) {
          addToast(
            editingJobId
              ? 'Agendamento atualizado com sucesso! ⏰'
              : 'Nova tarefa agendada cadastrada com sucesso! ⏰',
            'success'
          );
        }
        fetchCrons();
      } else {
        if (addToast) addToast('Erro ao salvar agendamento: ' + res.error, 'error');
      }
    } catch (e: any) {
      if (addToast) addToast('Erro: ' + e.message, 'error');
    }
  };

  const handleToggleCron = async (id: string, enabled: boolean) => {
    try {
      const res = await window.api.cron.toggle(id, enabled);
      if (res?.success) {
        fetchCrons();
        if (addToast) addToast(enabled ? 'Agendamento reativado com sucesso!' : 'Agendamento pausado temporariamente.', 'info');
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleDeleteCron = async (id: string) => {
    setDeleteJobId(id);
  };

  const handleRunCron = async (id: string) => {
    try {
      if (addToast) addToast('Disparando tarefa agendada em background...', 'info');
      const res = await window.api.cron.run(id);
      if (res?.success) {
        if (addToast) addToast('Tarefa iniciada! Acompanhe o andamento no histórico de conversas 🕒', 'success');
      } else if (addToast) addToast('Falha ao iniciar tarefa: ' + res?.error, 'error');
    } catch (e: any) {
      if (addToast) addToast('Erro: ' + e.message, 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black italic text-text-main leading-tight">Tarefas Agendadas (Crons)</h3>
          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Automatize rotinas de IA e relatórios</p>
        </div>
        <button
          onClick={() => {
            if (showAddForm) {
              handleCancelEdit();
            } else {
              setShowAddForm(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black rounded-2xl font-black uppercase text-[9px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
        >
          <Plus size={12} /> {showAddForm ? 'Fechar Form' : 'Nova Cron'}
        </button>
      </div>

      <CronAddForm
        isOpen={showAddForm}
        name={newCronName}
        setName={setNewCronName}
        cronExpr={newCronExpr}
        setCronExpr={setNewCronExpr}
        prompt={newCronPrompt}
        setPrompt={setNewCronPrompt}
        model={newCronModel}
        setModel={setNewCronModel}
        agents={agents}
        selectedAgentIds={selectedAgentIds}
        toggleAgentSelection={handleToggleAgentSelection}
        onSubmit={handleCreateCron}
        isEditing={editingJobId !== null}
        onCancelEdit={handleCancelEdit}
      />

      <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Clock className="animate-spin text-primary" size={24} />
          </div>
        ) : cronJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-border rounded-2xl text-center">
            <Clock size={32} className="text-text-muted opacity-40 mb-3" />
            <p className="text-xs text-text-muted font-bold">Nenhuma tarefa agendada.</p>
            <p className="text-[10px] text-text-muted opacity-60 mt-1 uppercase tracking-wider">Use o botão "Nova Cron" acima para criar sua primeira rotina!</p>
          </div>
        ) : (
          cronJobs.map((job) => (
            <CronCard
              key={job.id}
              job={job}
              agents={agents}
              onToggle={handleToggleCron}
              onRun={handleRunCron}
              onEdit={handleEditCron}
              onDelete={handleDeleteCron}
            />
          ))
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteJobId !== null}
        title="Confirmar Exclusão"
        message="Deseja realmente deletar esta tarefa agendada? Essa ação é definitiva e removerá a cron permanentemente."
        confirmLabel="Deletar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (!deleteJobId) return;
          try {
            const res = await window.api.cron.delete(deleteJobId);
            if (res?.success) {
              if (addToast) addToast('Tarefa agendada deletada com sucesso!', 'success');
              fetchCrons();
            } else if (addToast) addToast('Erro ao deletar: ' + res.error, 'error');
          } catch (e: any) {
            if (addToast) addToast('Erro: ' + e.message, 'error');
          } finally {
            setDeleteJobId(null);
          }
        }}
        onCancel={() => setDeleteJobId(null)}
        theme={theme}
        type="danger"
      />
    </motion.div>
  );
};
