import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Brain, RefreshCw } from 'lucide-react';
import { Theme } from '../config/themes';

interface DiscoveryChatProps {
  theme: Theme;
  onDiscoveryComplete: (consolidatedContext: string) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

interface StepConfig {
  question: string;
  field: string;
  suggestions: string[];
}

export const DiscoveryChat: React.FC<DiscoveryChatProps> = ({ theme, onDiscoveryComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({
    dor: '',
    persona: '',
    beneficio: '',
    diretriz: ''
  });
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá, amigão! Sou seu co-piloto de Product Discovery no wOs. Vamos estruturar a sua próxima funcionalidade! Para começarmos, qual é a dor ou problema principal que você identificou hoje?'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const steps: StepConfig[] = [
    {
      question: 'Qual é a dor ou problema principal que você identificou hoje?',
      field: 'dor',
      suggestions: [
        'Usuários enfrentando fluxos manuais e demorados',
        'Complexidade excessiva em telas ou configurações',
        'Dificuldade de retenção ou engajamento de usuários',
        'Perda de dados ou falta de centralização operacional'
      ]
    },
    {
      question: 'Excelente! E quem é a persona principal afetada por essa dor? Quem usará essa funcionalidade?',
      field: 'persona',
      suggestions: [
        'O usuário final (ex: cliente, paciente, consumidor)',
        'O administrador do sistema / equipe de backoffice',
        'A equipe comercial e operacional do negócio',
        'O desenvolvedor / time de suporte técnico'
      ]
    },
    {
      question: 'Perfeito! E qual é o maior benefício ou resultado esperado ao resolvermos esse problema?',
      field: 'beneficio',
      suggestions: [
        'Economia de tempo e esforço operacional massivo',
        'Aumento expressivo na conversão ou faturamento',
        'Experiência de uso fluida, minimalista e encantadora (UX)',
        'Maior confiabilidade de relatórios e tomada de decisão'
      ]
    },
    {
      question: 'Compreendido! Para fechar a consolidação: você tem alguma diretriz inicial em mente de como quer resolver isso?',
      field: 'diretriz',
      suggestions: [
        'Quero que a IA proponha soluções inovadoras do zero!',
        'Uma automação inteligente com IA em background',
        'Um dashboard analítico com gráficos e visões dinâmicas',
        'Um painel de controle simples e minimalista'
      ]
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSuggestion = (suggestion: string) => {
    submitAnswer(suggestion);
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    submitAnswer(inputVal);
    setInputVal('');
  };

  const submitAnswer = (text: string) => {
    const currentConfig = steps[currentStep];
    
    // 1. Adiciona a resposta do usuário
    const userMsgId = `user-${currentStep}-${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text }
    ];
    
    // Atualiza as respostas coletadas
    const updatedAnswers = { ...answers, [currentConfig.field]: text };
    setAnswers(updatedAnswers);
    
    // 2. Transiciona para o próximo passo
    const nextStep = currentStep + 1;
    if (nextStep < steps.length) {
      setCurrentStep(nextStep);
      newMessages.push({
        id: `ai-${nextStep}-${Date.now()}`,
        sender: 'ai',
        text: steps[nextStep].question
      });
      setMessages(newMessages);
    } else {
      // Chat completo!
      setCurrentStep(steps.length);
      newMessages.push({
        id: `ai-complete-${Date.now()}`,
        sender: 'ai',
        text: 'Sensacional, amigão! Coletamos insumos de altíssimo nível para o Discovery. Veja o resumo estruturado que consolidei:'
      });
      setMessages(newMessages);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({ dor: '', persona: '', beneficio: '', diretriz: '' });
    setInputVal('');
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Olá, amigão! Sou seu co-piloto de Product Discovery no wOs. Vamos estruturar a sua próxima funcionalidade! Para começarmos, qual é a dor ou problema principal que você identificou hoje?'
      }
    ]);
  };

  const handleGenerate = () => {
    // Consolida tudo num bloco bem formatado para a IA
    const consolidated = `
DOR / PROBLEMA DO PRODUTO:
${answers.dor}

PERSONA ALVO / PÚBLICO:
${answers.persona}

BENEFÍCIO / VALOR ESPERADO:
${answers.beneficio}

DIRETRIZ DE SOLUÇÃO INICIAL:
${answers.diretriz}
`;
    onDiscoveryComplete(consolidated);
  };

  const isComplete = currentStep >= steps.length;
  const progressPercent = Math.min((currentStep / steps.length) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="flex flex-col h-[520px]"
    >
      {/* Progresso do Discovery */}
      <div className="flex flex-col gap-2 mb-4 px-2">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
          <span style={{ color: theme.colors.textMuted }}>
            {isComplete ? '✨ Discovery Consolidado' : `Etapa ${currentStep + 1} de ${steps.length}`}
          </span>
          <span style={{ color: theme.colors.primary }}>
            {isComplete ? '100% Pronto' : `${Math.round(progressPercent)}% Concluído`}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.borderColor }}>
          <motion.div 
            className="h-full" 
            style={{ 
              background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})` 
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Janela de Mensagens */}
      <div 
        className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar rounded-2xl border"
        style={{ backgroundColor: `${theme.colors.bgPanel}80`, borderColor: theme.colors.borderColor }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-start gap-2.5 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {isAI && (
                  <div 
                    className="p-1.5 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                    style={{ 
                      backgroundColor: theme.colors.bgPanel, 
                      borderColor: `${theme.colors.primary}33`,
                      color: theme.colors.primary 
                    }}
                  >
                    <Brain size={14} className="animate-pulse" />
                  </div>
                )}
                <div 
                  className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                    isAI 
                      ? 'rounded-tl-none border' 
                      : 'rounded-tr-none'
                  }`}
                  style={{ 
                    backgroundColor: isAI ? theme.colors.bgPanel : theme.colors.primary, 
                    borderColor: isAI ? theme.colors.borderColor : 'transparent',
                    color: isAI ? theme.colors.textMain : theme.colors.textInverse 
                  }}
                >
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {/* Resumo Final se completo */}
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border mx-2 space-y-3 shadow-inner"
            style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}
          >
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: theme.colors.borderColor }}>
              <Sparkles size={14} style={{ color: theme.colors.primary }} />
              <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.colors.textMain }}>
                Ficha Técnica do Discovery
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-medium leading-relaxed" style={{ color: theme.colors.textMain }}>
              <div className="p-2.5 rounded-xl border" style={{ borderColor: theme.colors.borderColor, backgroundColor: `${theme.colors.bgPanel}40` }}>
                <span className="text-[8px] font-black uppercase tracking-wider block mb-1" style={{ color: theme.colors.textMuted }}>
                  🚨 Dor/Problema
                </span>
                {answers.dor}
              </div>
              <div className="p-2.5 rounded-xl border" style={{ borderColor: theme.colors.borderColor, backgroundColor: `${theme.colors.bgPanel}40` }}>
                <span className="text-[8px] font-black uppercase tracking-wider block mb-1" style={{ color: theme.colors.textMuted }}>
                  👥 Persona Afetada
                </span>
                {answers.persona}
              </div>
              <div className="p-2.5 rounded-xl border" style={{ borderColor: theme.colors.borderColor, backgroundColor: `${theme.colors.bgPanel}40` }}>
                <span className="text-[8px] font-black uppercase tracking-wider block mb-1" style={{ color: theme.colors.textMuted }}>
                  💎 Impacto/Valor
                </span>
                {answers.beneficio}
              </div>
              <div className="p-2.5 rounded-xl border" style={{ borderColor: theme.colors.borderColor, backgroundColor: `${theme.colors.bgPanel}40` }}>
                <span className="text-[8px] font-black uppercase tracking-wider block mb-1" style={{ color: theme.colors.textMuted }}>
                  💡 Diretriz Inicial
                </span>
                {answers.diretriz}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleGenerate}
                className="flex-1 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:brightness-115 text-white"
                style={{ 
                  background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`
                }}
              >
                Gerar Ideias <Sparkles size={14} />
              </button>
              <button
                onClick={handleReset}
                title="Reiniciar Discovery"
                className="p-3 border rounded-xl hover:bg-[var(--primary-muted)] transition-all"
                style={{ borderColor: theme.colors.borderColor, color: theme.colors.textMuted }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chips de Sugestões de Resposta Rápida */}
      {!isComplete && (
        <div className="mt-3 px-1">
          <div className="text-[8px] font-black uppercase tracking-widest mb-1.5 opacity-80" style={{ color: theme.colors.textMuted }}>
            💡 Sugestões Rápidas:
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto no-scrollbar">
            {steps[currentStep]?.suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(sug)}
                className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:scale-[1.01] text-left leading-normal"
                style={{ 
                  backgroundColor: theme.colors.bgPanel, 
                  borderColor: theme.colors.borderColor, 
                  color: theme.colors.textMain 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.borderColor;
                  e.currentTarget.style.backgroundColor = theme.colors.bgPanel;
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campo de Digitação */}
      {!isComplete && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua resposta personalizada..."
            className="flex-1 px-4 py-3 rounded-xl text-xs outline-none border transition-all font-medium"
            style={{ 
              backgroundColor: theme.colors.bgPanel, 
              borderColor: theme.colors.borderColor, 
              color: theme.colors.textMain,
              caretColor: theme.colors.primary
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.borderColor}
          />
          <button
            onClick={handleSend}
            disabled={!inputVal.trim()}
            className="p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-white"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
};
