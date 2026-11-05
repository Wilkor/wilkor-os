import { useState, useEffect, useRef } from 'react';
import { Play, Square, Sparkles, ChevronDown, ChevronUp, Trash2, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgyLog {
  text: string;
  type: 'stdout' | 'stderr';
}

interface AgyConsoleProps {
  workspacePath: string;
  onExecutionFinish: () => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AgyConsole = ({ workspacePath, onExecutionFinish, addToast }: AgyConsoleProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<AgyLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Registra os listeners de dados do agy
    const unsubscribeData = window.api.agy.onData((data) => {
      setLogs((prev) => [...prev, data]);
      setIsExpanded(true); // Auto-expande ao receber dados
    });

    const unsubscribeExit = window.api.agy.onExit((code) => {
      setIsRunning(false);
      if (addToast) {
        if (code === 0) {
          addToast('Execução do Antigravity concluída com sucesso!', 'success');
        } else if (code !== null) {
          addToast(`Antigravity encerrado com código de erro ${code}.`, 'error');
        }
      }
      onExecutionFinish();
    });

    return () => {
      unsubscribeData();
      unsubscribeExit();
    };
  }, [onExecutionFinish, addToast]);

  // Autoscroll para o fim dos logs
  useEffect(() => {
    if (isExpanded) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const runAgy = async (prompt: string, actionName: string) => {
    if (!workspacePath) {
      if (addToast) addToast('Selecione um workspace ativo primeiro.', 'warning');
      return;
    }

    setLogs([]);
    setIsRunning(true);
    setIsExpanded(true);

    if (addToast) {
      addToast(`Iniciando tarefa: ${actionName}...`, 'info');
    }

    try {
      const res = await window.api.agy.run({
        workspacePath,
        prompt,
        skipPermissions: true,
      });

      if (!res.success) {
        setIsRunning(false);
        setLogs([{ text: `❌ Erro ao iniciar: ${res.error}\r\n`, type: 'stderr' }]);
        if (addToast) addToast(`Falha ao disparar Antigravity: ${res.error}`, 'error');
      }
    } catch (err: any) {
      setIsRunning(false);
      setLogs([{ text: `❌ Erro ao iniciar: ${err.message}\r\n`, type: 'stderr' }]);
      if (addToast) addToast(`Falha: ${err.message}`, 'error');
    }
  };

  const handleGeneratePlan = () => {
    const prompt = 'Analise detalhadamente a estrutura do projeto neste diretório e seus arquivos chave. Escreva uma proposta clara de plano de implementação no arquivo implementation_plan.md seguindo a estrutura padrão de planejamento (Goal Description, Proposed Changes, Verification Plan). Não altere nenhum outro arquivo do projeto além do implementation_plan.md.';
    runAgy(prompt, 'Gerar Plano de Implementação');
  };

  const handleExecutePlan = () => {
    const prompt = 'Leia com atenção o arquivo implementation_plan.md e as tarefas descritas em task.md. Execute fisicamente todas as alterações necessárias nos arquivos do código fonte do projeto de forma cirúrgica, seguindo as diretrizes e salvando as modificações. Após concluir, valide o código e atualize os arquivos task.md marcando os itens concluídos.';
    runAgy(prompt, 'Executar Plano do Workspace');
  };

  const handleKill = async () => {
    try {
      await window.api.agy.kill();
      setIsRunning(false);
      if (addToast) addToast('Processo do Antigravity interrompido pelo usuário.', 'info');
    } catch (err: any) {
      if (addToast) addToast(`Erro ao parar processo: ${err.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="border-t border-border bg-bg-app/40 flex flex-col transition-all">
      {/* Barra de Ações do Agy */}
      <div className="p-3 flex items-center justify-between gap-3 flex-wrap bg-bg-panel/40">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-text-main">
            Agy CLI Integration
          </span>
          {isRunning && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping ml-1" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePlan}
            disabled={isRunning || !workspacePath}
            className="px-3 py-1.5 rounded-lg border border-border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-white/5 hover:border-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-border text-text-main"
          >
            <Sparkles size={11} className="text-primary" />
            Gerar Plano
          </button>

          <button
            onClick={handleExecutePlan}
            disabled={isRunning || !workspacePath}
            className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:brightness-110 disabled:opacity-40"
          >
            <Play size={11} />
            Executar Plano
          </button>

          {isRunning && (
            <button
              onClick={handleKill}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:bg-red-500/20"
            >
              <Square size={11} />
              Interromper
            </button>
          )}

          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              title="Limpar Console"
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
            >
              <Trash2 size={11} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>
      </div>

      {/* Janela de Logs Colapsável */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 160 }}
            exit={{ height: 0 }}
            className="bg-black/80 font-mono text-[10px] p-3 overflow-y-auto border-t border-border flex flex-col gap-1 select-text leading-relaxed"
          >
            {logs.length === 0 ? (
              <div className="text-text-muted/40 italic text-center py-8">
                Nenhum log de execução recente. Clique em "Gerar Plano" ou "Executar Plano" para iniciar o agy.
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={log.type === 'stderr' ? 'text-red-400 font-bold' : 'text-zinc-300'}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {log.text}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
