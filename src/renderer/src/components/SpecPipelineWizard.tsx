import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Database } from 'lucide-react';
import { TrelloCard } from './DashboardUtils';
import { Theme } from '../config/themes';
import { STEPS } from './spec-pipeline/AgentOrchestrator';
import { AgentStatusPanel } from './spec-pipeline/AgentStatusPanel';
import { SpecPreviewsPanel } from './spec-pipeline/SpecPreviewsPanel';
import { SyncOverlay } from './spec-pipeline/SyncOverlay';
import { ProgressTracker } from './spec-pipeline/ProgressTracker';
import { WizardHeader } from './spec-pipeline/WizardHeader';
import { SyncReadyPanel } from './spec-pipeline/SyncReadyPanel';
import { SpecTypeSelectorPanel } from './spec-pipeline/SpecTypeSelectorPanel';
import { useSpecWizard } from './spec-pipeline/useSpecWizard';

interface SpecPipelineWizardProps {
  card: TrelloCard;
  initialPendingTask?: any;
  onClose: () => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  theme: Theme;
}

export const SpecPipelineWizard: React.FC<SpecPipelineWizardProps> = ({
  card,
  initialPendingTask,
  onClose,
  onAddToast,
  theme
}) => {
  const {
    currentStep,
    setCurrentStep,
    isThinking,
    agentStatus,
    setAgentStatus,
    repositories,
    selectedRepo,
    setSelectedRepo,
    prdContent,
    taskType,
    setTaskType,
    customFolderName,
    setCustomFolderName,
    refinementInput,
    setRefinementInput,
    questions,
    setQuestions,
    retryCount,
    maxRetryReached,
    requirements,
    setRequirements,
    design,
    setDesign,
    tasksJson,
    setTasksJson,
    isSyncing,
    syncProgress,
    syncMessage,
    isSyncComplete,
    activeAgent,
    runAgent,
    handleSendRefinement,
    handleSyncWorkspaceAndTrello,
    handleSaveAndSendToTech,
    setRefinementHistory
  } = useSpecWizard({ card, initialPendingTask, onClose, onAddToast });

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ color: theme.colors.textMain }}>
      {/* Header */}
      <WizardHeader cardName={card.name} onClose={onClose} theme={theme} />

      {/* Progress Line */}
      <ProgressTracker steps={STEPS} currentStep={currentStep} theme={theme} />

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-6 relative">
        <AnimatePresence mode="wait">
          <SyncOverlay
            isSyncing={isSyncing}
            isSyncComplete={isSyncComplete}
            syncMessage={syncMessage}
            syncProgress={syncProgress}
            onClose={onClose}
            theme={theme}
          />
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Painel de Controle / Agente */}
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            {currentStep < 4 ? (
              <>
                {currentStep === 0 && agentStatus === 'IDLE' ? (
                  <SpecTypeSelectorPanel
                    taskType={taskType}
                    setTaskType={setTaskType}
                    repositories={repositories}
                    selectedRepo={selectedRepo}
                    setSelectedRepo={setSelectedRepo}
                    customFolderName={customFolderName}
                    setCustomFolderName={setCustomFolderName}
                    onStart={() => runAgent()}
                    theme={theme}
                  />
                ) : (
                  <AgentStatusPanel
                    agent={activeAgent}
                    isThinking={isThinking}
                    status={agentStatus}
                    questions={questions}
                    refinementInput={refinementInput}
                    setRefinementInput={setRefinementInput}
                    onSendRefinement={handleSendRefinement}
                    retryCount={retryCount}
                    maxRetryReached={maxRetryReached}
                    theme={theme}
                    prdContent={prdContent}
                    requirements={requirements}
                    design={design}
                  />
                )}
                
                {currentStep === 0 && agentStatus === 'IDLE' ? null : (
                  agentStatus === 'APROVADO' ? (
                    currentStep === 1 ? (
                      <div className="flex flex-col gap-3 w-full">
                        <button 
                          onClick={handleSaveAndSendToTech}
                          className="w-full py-4 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg"
                        >
                          <Database size={16} /> Salvar Pendência para Tech (Dev)
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentStep(prev => prev + 1);
                            setAgentStatus('IDLE');
                            setQuestions([]);
                            setRefinementHistory([]);
                          }}
                          className="w-full py-3.5 border border-dashed border-white/20 hover:border-white/40 text-text-muted hover:text-text-main font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all bg-white/5 hover:bg-white/10"
                        >
                          Continuar como Tech (Fluxo Direto)
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setCurrentStep(prev => prev + 1);
                          setAgentStatus('IDLE');
                          setQuestions([]);
                          setRefinementHistory([]);
                        }}
                        className="w-full py-4 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg"
                      >
                        Avançar para {STEPS[currentStep + 1]?.label} <ChevronRight size={16} />
                      </button>
                    )
                  ) : agentStatus === 'IDLE' && !isThinking ? (
                    <button 
                      onClick={() => runAgent()}
                      className="w-full py-4 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg"
                    >
                      Ativar Agente {activeAgent.name} <Play size={14} fill="white" />
                    </button>
                  ) : agentStatus === 'INCOMPLETO' && !isThinking ? (
                    <button 
                      onClick={() => {
                        if (currentStep === 1 && !requirements) setRequirements('## Requisitos (Bypass)\n\nRequisitos validados manualmente pelo usuário.');
                        else if (currentStep === 2 && !design) setDesign('## Design Técnico (Bypass)\n\nDesign arquitetural aprovado pelo usuário.');
                        else if (currentStep === 3 && !tasksJson) setTasksJson(JSON.stringify({ fases: [{ nome: "Fase 01 — Execução", tarefas: [{ titulo: `Desenvolver ${card.name}`, estimativa_horas: 6 }] }] }));
                        setCurrentStep(prev => prev + 1);
                        setAgentStatus('IDLE');
                        setQuestions([]);
                        setRefinementHistory([]);
                      }}
                      className="w-full py-3.5 border border-dashed border-amber-500/30 hover:border-amber-500 text-amber-500/80 hover:text-amber-400 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all bg-amber-500/5 hover:bg-amber-500/10"
                    >
                      Ignorar Validação e Avançar Mesmo Assim
                    </button>
                  ) : null
                )}
              </>
            ) : (
              <SyncReadyPanel onSync={handleSyncWorkspaceAndTrello} theme={theme} />
            )}
          </div>

          {/* Painel de Visualização / Previews */}
          <SpecPreviewsPanel
            currentStep={currentStep}
            prdContent={prdContent}
            requirements={requirements}
            design={design}
            tasksJson={tasksJson}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
};

export default SpecPipelineWizard;
