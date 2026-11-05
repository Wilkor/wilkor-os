import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldAlert, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { SpecAgent } from './AgentOrchestrator';
import { AgentPanelHeader } from './AgentPanelHeader';
import { ThinkingPanel } from './ThinkingPanel';

interface AgentStatusPanelProps {
  agent: SpecAgent;
  isThinking: boolean;
  status: 'APROVADO' | 'INCOMPLETO' | 'IDLE';
  questions?: string[];
  refinementInput: string;
  setRefinementInput: (val: string) => void;
  onSendRefinement: (answer: string) => void;
  retryCount: number;
  maxRetryReached: boolean;
  theme: any;
  prdContent?: string;
  requirements?: string;
  design?: string;
}

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({
  agent,
  isThinking,
  status,
  questions,
  refinementInput,
  setRefinementInput,
  onSendRefinement,
  retryCount,
  maxRetryReached,
  theme,
  prdContent,
  requirements,
  design
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});
  const [loadingAiAnswer, setLoadingAiAnswer] = useState<Record<number, boolean>>({});

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questions, isThinking]);

  useEffect(() => {
    setLocalAnswers({});
  }, [questions]);

  const handleFillWithAi = async (idx: number, question: string) => {
    setLoadingAiAnswer(prev => ({ ...prev, [idx]: true }));
    try {
      const prompt = `Você é um assistente de engenharia do wOs. O usuário solicitou que você preencha a resposta para uma pergunta de refinamento feita por um agente do pipeline de especificação técnica.

CONTEXTO ATUAL DO PROJETO:
- PRD Base: ${prdContent || ''}
${requirements ? `- Requisitos (requirements.md): ${requirements}` : ''}
${design ? `- Arquitetura (design.md): ${design}` : ''}

PERGUNTA A SER RESPONDIDA:
"${question}"

Instruções para a resposta:
- Responda de forma curta, objetiva, realista e profissional em português do Brasil.
- Baseie-se estritamente nas informações fornecidas no contexto do projeto.
- Se o contexto não tiver informações para responder com certeza, proponha uma resposta plausível ou um padrão técnico coerente (ex: se perguntar por métricas e não houver, sugira métricas padrão de performance/engajamento adequadas ao tipo de sistema).
- Retorne APENAS a sugestão de preenchimento gerada, sem explicações extras, sem introdução e sem aspas.`;

      const response = await (window as any).api.chat.send('gpt-4o-mini', [
        { role: 'user', content: prompt }
      ], undefined, 'Spec: Auto-fill Pergunta');

      if (response.success && response.content) {
        setLocalAnswers(prev => ({ ...prev, [idx]: response.content.trim() }));
      }
    } catch (err) {
      console.error('Erro no Auto-fill com IA:', err);
    } finally {
      setLoadingAiAnswer(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleSendStructured = () => {
    const consolidated = Object.entries(localAnswers)
      .filter(([_, ans]) => ans.trim())
      .map(([idx, ans]) => `Pergunta: ${questions ? questions[Number(idx)] : ''}\nResposta: ${ans.trim()}`)
      .join('\n\n');
    
    if (consolidated.trim()) {
      onSendRefinement(consolidated);
      setLocalAnswers({});
    }
  };

  // A logica do estado pensando foi delegada ao componente modular ThinkingPanel

  return (
    <div
      className="flex flex-col flex-1 min-h-0 border rounded-3xl p-6 backdrop-blur-md shadow-xl"
      style={{
        backgroundColor: `${theme.colors.bgPanel}B3`,
        borderColor: theme.colors.borderColor
      }}
    >
      {/* Cabeçalho do Agente */}
      <AgentPanelHeader agent={agent} isThinking={isThinking} status={status} theme={theme} />

      {/* Área Central / Perguntas / Chat */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar min-h-[180px]">
        <AnimatePresence mode="wait">
          {isThinking ? (
            <ThinkingPanel agentColor={agent.color} theme={theme} isThinking={isThinking} />
          ) : status === 'INCOMPLETO' ? (
            <motion.div
              key="incomplete-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {maxRetryReached && (
                <div className="p-4 border-2 border-red-500/30 rounded-2xl bg-red-500/5 text-center space-y-2">
                  <div className="flex justify-center text-red-500">
                    <ShieldAlert size={20} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">
                    Escala ao Usuário (Múltiplas Tentativas)
                  </h4>
                  <p className="text-[10px] leading-relaxed" style={{ color: theme.colors.textMuted }}>
                    O agente tentou processar esta etapa por {retryCount} vezes. Por favor, revise o PRD/requisitos gerados ou responda com detalhes adicionais abaixo para destravar a esteira.
                  </p>
                </div>
              )}

              {questions && questions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500">
                    <HelpCircle size={14} /> Detalhes solicitados pelo Agente:
                  </div>
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 border rounded-2xl flex flex-col gap-2.5 bg-white/5"
                        style={{ borderColor: theme.colors.borderColor }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] bg-amber-500/10 text-amber-500">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-semibold leading-relaxed" style={{ color: theme.colors.textMain }}>
                              {q}
                            </span>
                          </div>
                          <button
                            onClick={() => handleFillWithAi(idx, q)}
                            disabled={loadingAiAnswer[idx] || isThinking}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 hover:scale-105 transition-all disabled:opacity-40"
                          >
                            {loadingAiAnswer[idx] ? (
                              <>
                                <Loader2 size={10} className="animate-spin text-violet-400" />
                                Pensando...
                              </>
                            ) : (
                              <>
                                <Sparkles size={10} />
                                Sugerir IA
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          value={localAnswers[idx] || ''}
                          onChange={(e) => setLocalAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          placeholder="Digite aqui os detalhes para esta pergunta..."
                          className="w-full min-h-[50px] p-3 border rounded-xl text-[11px] outline-none transition-all resize-y"
                          style={{
                            backgroundColor: theme.colors.bgApp,
                            borderColor: theme.colors.borderColor,
                            color: theme.colors.textMain,
                            caretColor: agent.color
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={handleSendStructured}
                    disabled={isThinking || Object.values(localAnswers).every(ans => !ans.trim())}
                    className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-md disabled:opacity-30 disabled:hover:scale-100"
                  >
                    Enviar Detalhes <Send size={12} fill="white" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full py-10 text-center opacity-60"
            >
              <Sparkles size={20} style={{ color: agent.color }} className="mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>
                {status === 'APROVADO' ? 'Etapa concluída e aprovada com sucesso!' : 'Aguardando início do processo...'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input de Refinamento Livre Fallback */}
      {status === 'INCOMPLETO' && (!questions || questions.length === 0) && (
        <div className="pt-4 border-t flex gap-2" style={{ borderColor: theme.colors.borderColor }}>
          <input
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendRefinement(refinementInput)}
            placeholder="Digite os detalhes adicionais para o agente..."
            disabled={isThinking}
            className="flex-1 border rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
            style={{
              backgroundColor: theme.colors.bgApp,
              borderColor: theme.colors.borderColor,
              color: theme.colors.textMain,
              caretColor: agent.color
            }}
          />
          <button
            onClick={() => onSendRefinement(refinementInput)}
            disabled={!refinementInput.trim() || isThinking}
            className="p-2.5 rounded-xl transition-all disabled:opacity-30 border"
            style={{
              backgroundColor: `${agent.color}1A`,
              color: agent.color,
              borderColor: `${agent.color}33`
            }}
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

