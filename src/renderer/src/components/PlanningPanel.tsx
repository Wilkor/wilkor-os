import { useState, useEffect } from 'react'
import { CheckSquare, FileText, Save, RefreshCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { AgyConsole } from './AgyConsole'

interface PlanningPanelProps {
  activeWorkspacePath?: string | null;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const PlanningPanel = ({ activeWorkspacePath, addToast }: PlanningPanelProps) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'tasks'>('plan');
  const [planContent, setPlanContent] = useState('');
  const [taskContent, setTaskContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getFilePath = (fileName: string) => {
    if (activeWorkspacePath) {
      // Normaliza as barras para evitar problemas no Windows
      const base = activeWorkspacePath.replace(/\\/g, '/');
      return base.endsWith('/') ? `${base}${fileName}` : `${base}/${fileName}`;
    }
    return fileName;
  };

  const loadPlanningFiles = async () => {
    setIsLoading(true);
    if (window.api && window.api.fs) {
      try {
        const planPath = getFilePath('implementation_plan.md');
        const planRes = await window.api.fs.readFile(planPath);
        if (planRes.success) setPlanContent(planRes.content);
        else setPlanContent('# Plano de Implementação\n\nDescreva seu plano aqui...');

        const taskPath = getFilePath('task.md');
        const taskRes = await window.api.fs.readFile(taskPath);
        if (taskRes.success) setTaskContent(taskRes.content);
        else setTaskContent('# Tarefas\n\n- [ ] Minha primeira tarefa');
      } catch (err) {
        console.error('Erro ao carregar arquivos de planejamento:', err);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPlanningFiles();
  }, [activeWorkspacePath]);

  const handleSave = async () => {
    const fileName = activeTab === 'plan' ? 'implementation_plan.md' : 'task.md';
    const path = getFilePath(fileName);
    const content = activeTab === 'plan' ? planContent : taskContent;
    
    if (window.api && window.api.fs) {
      const result = await window.api.fs.writeFile(path, content);
      if (result.success) {
        if (addToast) {
          addToast(`${fileName} salvo com sucesso!`, 'success');
        } else {
          alert(`✅ ${fileName} salvo com sucesso!`);
        }
      } else {
        if (addToast) {
          addToast(`Erro ao salvar ${fileName}: ${result.error}`, 'error');
        } else {
          alert(`❌ Erro ao salvar: ${result.error}`);
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-panel">
      <div className="p-6 border-b border-border flex items-center justify-between bg-bg-app/50">
        <div className="flex flex-col">
          <h2 className="text-sm font-black uppercase tracking-widest text-text-muted/40 italic leading-tight">Antigravity Planner</h2>
          <p className="text-[9px] text-primary/60 font-bold uppercase tracking-tighter">Project Structure</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={loadPlanningFiles}
             className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
           >
             <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
           </button>
           <button 
             onClick={handleSave}
             className="p-2 rounded-lg bg-[var(--primary-muted)] text-[var(--primary)] hover:bg-[var(--primary-muted)]/20 transition-colors"
           >
             <Save size={14} />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 bg-bg-app/50">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'plan' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          <FileText size={12} />
          Plan
          {activeTab === 'plan' && <motion.div layoutId="plan-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'tasks' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
        >
          <CheckSquare size={12} />
          Tasks
          {activeTab === 'tasks' && <motion.div layoutId="plan-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        {activeTab === 'plan' ? (
          <textarea
            value={planContent}
            onChange={(e) => setPlanContent(e.target.value)}
            className="flex-1 bg-transparent text-text-main font-mono text-xs leading-relaxed outline-none resize-none p-2 no-scrollbar"
            placeholder="Escreva seu plano de implementação..."
          />
        ) : (
          <textarea
            value={taskContent}
            onChange={(e) => setTaskContent(e.target.value)}
            className="flex-1 bg-transparent text-text-main font-mono text-xs leading-relaxed outline-none resize-none p-2 no-scrollbar"
            placeholder="Liste suas tarefas usando markdown: - [ ] Tarefa"
          />
        )}
      </div>

      <AgyConsole
        workspacePath={activeWorkspacePath || ''}
        onExecutionFinish={loadPlanningFiles}
        addToast={addToast}
      />

      <div className="p-4 bg-primary-muted border-t border-border">
        <p className="text-[9px] text-text-muted italic text-center font-medium">
          A IA do wOs tem acesso total a estes documentos e os usará para guiar o desenvolvimento.
        </p>
      </div>
    </div>
  );
};
