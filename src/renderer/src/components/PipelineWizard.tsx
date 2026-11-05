import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ChevronRight, 
  Check, 
  Loader2,
  Sparkles,
  X,
  Send,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Brain,
  Wand2
} from 'lucide-react';
import { Theme } from '../config/themes';
import { DiscoveryChat } from './DiscoveryChat';
import { useAuth } from '../contexts/AuthContext';

interface IdeaPipelineProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onRefreshWorkspace: () => void;
  onClose: () => void;
  activeModel: string;
  theme: Theme;
  onStartSpecification?: (card: any) => void;
}

interface ParsedIdea {
  titulo: string;
  objetivo: string;
  impacto: string;
  prioridade: string;
  horizonte: string;
  hipotese: string;
  userStory?: string;
}

interface RefinementMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Step = 'idea' | 'generate' | 'refine' | 'review' | 'success';

export const PipelineWizard: React.FC<IdeaPipelineProps> = ({ onAddToast, onClose, activeModel, theme, onStartSpecification }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('idea');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<ParsedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ParsedIdea | null>(null);
  const [refinementChat, setRefinementChat] = useState<RefinementMessage[]>([]);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [brainContext, setBrainContext] = useState('');
  const [createdCard, setCreatedCard] = useState<any | null>(null);
  
  // Trello config
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState('');
  const [lists, setLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [trelloUrl, setTrelloUrl] = useState('');

  // Card editável
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const steps: Step[] = ['idea', 'generate', 'refine', 'review', 'success'];
  const stepLabels: Record<Step, string> = {
    idea: 'Ideia',
    generate: 'Gerar',
    refine: 'Refinar',
    review: 'Revisar',
    success: 'Pronto'
  };
  const currentStepIndex = steps.indexOf(step);

  // Carrega contexto da .brain ao abrir
  useEffect(() => {
    const loadContext = async () => {
      try {
        const contexts = await (window as any).api.workspace.getContext();
        let brainContent = '';
        for (const ctx of contexts) {
          if (ctx.brain && ctx.brain.length > 0) {
            for (const file of ctx.brain) {
              brainContent += `\n${file.content}\n`;
            }
          }
        }
        // Fallback: tenta ler .brain do diretório raiz do próprio wOs
        if (!brainContent) {
          try {
            const roots = await (window as any).api.workspace.getRoots();
            for (const root of roots) {
              const brainFiles = ['missao_tiabete.md', 'missao.md', 'context.md'];
              for (const fname of brainFiles) {
                try {
                  const result = await (window as any).api.fs.readFile(`${root}/.brain/${fname}`);
                  if (result.success && result.content) {
                    brainContent += `\n${result.content}\n`;
                  }
                } catch (_) {}
              }
            }
          } catch (_) {}
        }
        setBrainContext(brainContent);
      } catch (_) {}
    };

    const loadBoards = async () => {
      try {
        const result = await (window as any).api.pipeline.getTrelloBoards();
        if (result.success && result.boards) {
          setBoards(result.boards);
        }
      } catch (_) {}
    };

    loadContext();
    loadBoards();
  }, []);

  // Quando seleciona um board, carrega as listas
  useEffect(() => {
    if (!selectedBoard) return;
    const loadLists = async () => {
      try {
        const result = await (window as any).api.pipeline.getTrelloLists(selectedBoard);
        if (result.success && result.lists) {
          setLists(result.lists);
          // Auto-seleciona "Discovery" se existir
          const discovery = result.lists.find((l: any) => 
            l.name.toLowerCase().includes('discovery')
          );
          if (discovery) setSelectedList(discovery.id);
        }
      } catch (_) {}
    };
    loadLists();
  }, [selectedBoard]);

  const parseIdeas = (text: string): ParsedIdea[] => {
    const ideas: ParsedIdea[] = [];
    
    // Remove markdown bold/italic
    const cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Split por "TÍTULO:" ou variações comuns (## 1., ### Ideia 1, etc)
    const blocks = cleaned.split(/(?=T[ÍI]TULO\s*:)/gi).filter(b => b.trim());
    
    for (const block of blocks) {
      const getField = (key: string): string => {
        // Tenta capturar "KEY: valor" até a próxima chave ou fim do bloco
        const patterns = [
          new RegExp(`${key}\\s*:\\s*(.+?)(?=\\n\\s*(?:T[ÍI]TULO|OBJETIVO|IMPACTO|PRIORIDADE|HORIZONTE|HIP[ÓO]TESE|USER STORY)\\s*:|$)`, 'si'),
          new RegExp(`${key}\\s*:\\s*(.+)`, 'i'),
        ];
        for (const pattern of patterns) {
          const match = block.match(pattern);
          if (match && match[1]?.trim()) return match[1].trim();
        }
        return '';
      };
      
      const titulo = getField('T[ÍI]TULO');
      if (!titulo) continue;
      
      ideas.push({
        titulo,
        objetivo: getField('OBJETIVO'),
        impacto: getField('IMPACTO(?:\\s+NO\\s+USU[ÁA]RIO)?'),
        prioridade: getField('PRIORIDADE'),
        horizonte: getField('HORIZONTE'),
        hipotese: getField('HIP[ÓO]TESE'),
        userStory: getField('USER STORY'),
      });
    }
    
    console.log(`[IdeaPipeline] Parsed ${ideas.length} ideias de ${blocks.length} blocos`);
    return ideas;
  };



  const handleSelectIdea = (idea: ParsedIdea) => {
    setSelectedIdea(idea);
    setRefinementChat([{
      role: 'assistant',
      content: `Ótima escolha! Vamos refinar a ideia **"${idea.titulo}"** juntos.\n\nAtualmente temos:\n- **User Story:** ${idea.userStory}\n- **Objetivo:** ${idea.objetivo}\n- **Impacto:** ${idea.impacto}\n- **Prioridade:** ${idea.prioridade}\n- **Horizonte:** ${idea.horizonte}\n\nO que você gostaria de ajustar, aprofundar ou mudar? Posso ajudar a detalhar melhor o objetivo, redefinir a prioridade, ou explorar cenários alternativos.`
    }]);
    setStep('refine');
  };

  const handleSendRefinement = async () => {
    if (!refinementInput.trim() || isRefining) return;
    
    const userMsg: RefinementMessage = { role: 'user', content: refinementInput };
    setRefinementChat(prev => [...prev, userMsg]);
    setRefinementInput('');
    setIsRefining(true);

    try {
      const historyForAI = [
        ...refinementChat.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: refinementInput }
      ];

      const prompt = `${brainContext}\n\n---\n\nVocê está refinando a seguinte ideia de produto com o usuário:\n\nTÍTULO: ${selectedIdea?.titulo}\nUSER STORY: ${selectedIdea?.userStory}\nOBJETIVO: ${selectedIdea?.objetivo}\nIMPACTO NO USUÁRIO: ${selectedIdea?.impacto}\nPRIORIDADE: ${selectedIdea?.prioridade}\nHORIZONTE: ${selectedIdea?.horizonte}\nHIPÓTESE: ${selectedIdea?.hipotese}\n\nHistórico da conversa de refinamento:\n${historyForAI.map(m => `${m.role === 'user' ? 'USUÁRIO' : 'ASSISTENTE'}: ${m.content}`).join('\n')}\n\nResponda de forma concisa e objetiva. Se o usuário pedir para finalizar ou se a ideia já estiver madura, retorne a versão final no formato:\nTÍTULO: ...\nUSER STORY: ...\nOBJETIVO: ...\nIMPACTO NO USUÁRIO: ...\nPRIORIDADE: ...\nHORIZONTE: ...\nHIPÓTESE: ...`;

      const response = await (window as any).api.chat.send(activeModel, [
        { role: 'user', content: prompt }
      ], undefined, 'Idea Pipeline: Refino');

      if (response.success && response.content) {
        setRefinementChat(prev => [...prev, { role: 'assistant', content: response.content }]);
        
        // Verifica se a IA retornou uma versão finalizada
        const updated = parseIdeas(response.content);
        if (updated.length > 0) {
          setSelectedIdea(updated[0]);
        }
      }
    } catch (err: any) {
      onAddToast(`Erro no refinamento: ${err.message}`, 'error');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGoToReview = () => {
    if (!selectedIdea) return;
    setEditTitle(selectedIdea.titulo);
    setEditDesc(
`### 📝 USER STORY

${selectedIdea.userStory || `Como [persona],\nEu quero [ação],\nPara que [benefício].`}

---

**OBJETIVO:** ${selectedIdea.objetivo}

**IMPACTO NO USUÁRIO:** ${selectedIdea.impacto}

**PRIORIDADE:** ${selectedIdea.prioridade}

**HORIZONTE:** ${selectedIdea.horizonte}

**HIPÓTESE:** ${selectedIdea.hipotese}

---

**CRIADOR:** ${user?.email || 'Sistema wOs'}`
    );
    setStep('review');
  };

  const handleSendToTrello = async () => {
    if (!selectedList || !editTitle.trim()) {
      onAddToast('Selecione o board/lista e preencha o título.', 'warning');
      return;
    }

    setIsSending(true);
    try {
      const finalDesc = editDesc.includes(user?.email || '')
        ? editDesc
        : `${editDesc}\n\n---\n**CRIADOR:** ${user?.email || 'Sistema wOs'}`;

      const result = await (window as any).api.pipeline.createTrelloCard({
        name: editTitle,
        desc: finalDesc,
        idList: selectedList,
        pos: 'top'
      });

      if (result.success) {
        setCreatedCard(result.data);
        setTrelloUrl(result.data?.shortUrl || result.data?.url || '');
        setStep('success');
        onAddToast('Card criado no Trello com sucesso!', 'success');
      } else {
        onAddToast(`Erro Trello: ${result.error}`, 'error');
      }
    } catch (err: any) {
      onAddToast(`Erro: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const prioridadeColor = (p: string) => {
    const lower = p.toLowerCase();
    const isLight = theme.type === 'light';
    if (lower.includes('urgente')) {
      return isLight 
        ? 'bg-red-500/10 text-red-600 border-red-500/20' 
        : 'bg-red-500/20 text-red-400 border-red-500/30';
    }
    if (lower.includes('importante')) {
      return isLight 
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
        : 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
    return isLight 
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent select-none overflow-hidden" style={{ color: theme.colors.textMain }}>
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: `${theme.colors.bgPanel}80`, borderColor: theme.colors.borderColor }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`, color: theme.colors.textInverse, borderColor: `${theme.colors.primary}33`, boxShadow: `0 0 20px -5px ${theme.colors.primary}50` }}>
            <Lightbulb size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter italic leading-none flex items-center gap-2">
                Idea Pipeline <span className="text-[8px] px-1.5 py-0.5 rounded-md not-italic tracking-widest font-bold border" style={{ backgroundColor: theme.colors.primaryMuted, color: theme.colors.primary, borderColor: `${theme.colors.primary}33` }}>DISCOVERY</span>
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1 opacity-80" style={{ color: theme.colors.primary }}>Product Discovery conduzido pelo wOs // Estruturando ideias</p>
          </div>
        </div>
        
        <button onClick={onClose} className="p-2 hover:bg-[var(--primary-muted)] rounded-full transition-all" style={{ color: theme.colors.textMuted }}>
          <X size={18} />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-10 py-4 flex items-center justify-between gap-2 max-w-2xl mx-auto w-full border-b mb-2" style={{ borderColor: theme.colors.borderColor }}>
        {steps.map((s, i) => {
          const active = i <= currentStepIndex;
          const current = i === currentStepIndex;
          return (
            <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${current ? 'scale-110' : ''}`}
                      style={{ 
                        backgroundColor: current ? theme.colors.primary : active ? `${theme.colors.primary}99` : theme.colors.borderColor,
                        boxShadow: current ? `0 0 0 2px ${theme.colors.primary}33` : 'none'
                      }} 
                    />
                    <span 
                      className="text-[7px] font-black uppercase tracking-[0.2em] transition-colors"
                      style={{ color: active ? theme.colors.primary : `${theme.colors.textMuted}33` }}
                    >
                      {stepLabels[s]}
                    </span>
                </div>
                {i < steps.length - 1 && (
                    <div 
                      className="h-[1px] flex-1 mx-2 transition-all duration-700" 
                      style={{ backgroundColor: i < currentStepIndex ? `${theme.colors.primary}4d` : theme.colors.borderColor }}
                    />
                )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-12 py-4 no-scrollbar relative">
        <AnimatePresence mode="wait">
          {/* OVERLAY DE LOADING IMERSIVO */}
          {(isLoading || isSending) && (
            <ProcessingView 
                key="loading-view"
                message={isLoading ? "Arquitetando Ideias" : "Enviando para o Trello"} 
                submessage={isLoading ? "Analisando contexto e gerando conceitos estratégicos..." : "Sincronizando com discovery board..."}
                theme={theme}
            />
          )}

          {/* STEP 1: Discovery Chat Guiado */}
          {step === 'idea' && !isLoading && (
            <DiscoveryChat 
              theme={theme}
              onDiscoveryComplete={async (consolidatedText) => {
                setIsLoading(true);
                try {
                  const formatoFallback = !brainContext.trim() ? `
Você é um especialista em produto digital. Gere ideias de funcionalidades baseadas no input de Discovery do usuário.

Cada ideia DEVE seguir EXATAMENTE este formato (sem markdown, sem bullets, sem **):

TÍTULO: [nome curto da funcionalidade]
USER STORY: Como [persona], Eu quero [ação], Para que [benefício].
OBJETIVO: [qual problema resolve ou valor gera]
IMPACTO NO USUÁRIO: [como muda a experiência do usuário]
PRIORIDADE: [URGENTE | IMPORTANTE | OPORTUNIDADE]
HORIZONTE: [Curto prazo (0-3m) | Médio prazo (3-12m) | Longo prazo (+12m)]
HIPÓTESE: [se implementarmos X, esperamos Y]
` : '';
                  
                  const prompt = `${brainContext}${formatoFallback}\n\n---\n\nINFORMAÇÕES DE DISCOVERY CONSOLIDADAS:\n${consolidatedText}\n\nCom base nas respostas do Discovery acima e no arquivo de contexto do wOs, gere entre 3 a 5 ideias de funcionalidades inovadoras. Cada ideia DEVE começar com "TÍTULO:" e conter os campos: TÍTULO, USER STORY, OBJETIVO, IMPACTO NO USUÁRIO, PRIORIDADE, HORIZONTE, HIPÓTESE. Não use markdown (**bold**), apenas texto plano. Separe cada ideia com uma linha em branco.`;
                  
                  const response = await (window as any).api.chat.send(activeModel, [
                    { role: 'user', content: prompt }
                  ], undefined, 'Idea Pipeline: Discovery');

                  console.log('[IdeaPipeline] Resposta do Discovery:', response?.content?.substring(0, 300));

                  if (response.success && response.content) {
                    const parsed = parseIdeas(response.content);
                    if (parsed.length > 0) {
                      setGeneratedIdeas(parsed);
                      setStep('generate');
                    } else {
                      onAddToast('Não consegui extrair ideias formatadas. Tente reiniciar o Discovery.', 'warning');
                    }
                  } else {
                    onAddToast(`Erro: ${response.error || 'Resposta vazia'}`, 'error');
                  }
                } catch (err: any) {
                  onAddToast(`Erro: ${err.message}`, 'error');
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )}

          {/* STEP 2: Ideias */}
          {step === 'generate' && !isLoading && !isSending && (
            <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                  <Sparkles size={18} style={{ color: theme.colors.primary }} />
                  {generatedIdeas.length} ideias estruturadas
                </h3>
                <button 
                  onClick={() => setStep('idea')} 
                  className="px-3 py-1.5 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border"
                  style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor, color: theme.colors.textMuted }}
                >
                  <RefreshCw size={12} /> Regerar
                </button>
              </div>
              
              <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                {generatedIdeas.map((idea, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectIdea(idea)}
                    className="w-full text-left p-4 border rounded-2xl hover:bg-[var(--primary-muted)] transition-all group relative overflow-hidden"
                    style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}
                  >
                    <div className="flex items-start gap-4">
                      <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: theme.colors.primaryMuted, color: theme.colors.primary }}>{i + 1}</span>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-black text-sm uppercase tracking-tight leading-none" style={{ color: theme.colors.primary }}>{idea.titulo}</h4>
                        <p className="text-[11px] font-bold italic leading-tight line-clamp-2" style={{ color: theme.colors.textMain }}>{idea.userStory}</p>
                        <p className="text-[10px] leading-tight line-clamp-1" style={{ color: theme.colors.textMuted }}>{idea.objetivo}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${prioridadeColor(idea.prioridade)}`}>
                            {idea.prioridade}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border" style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor, color: theme.colors.textMuted }}>
                            {idea.horizonte}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={16} style={{ color: theme.colors.primary }} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Refinamento */}
          {step === 'refine' && !isLoading && !isSending && (
            <motion.div key="refine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3 h-full">

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: theme.colors.primary }}>
                  <MessageSquare size={16} />
                  Refinando ideia
                </h3>
                <button onClick={() => setStep('generate')} className="text-[10px] font-black uppercase tracking-widest hover:text-[var(--primary)] transition-all" style={{ color: theme.colors.textMuted }}>
                  ← Voltar
                </button>
              </div>
 
              <div className="flex-1 border rounded-2xl p-4 overflow-y-auto no-scrollbar space-y-4 min-h-[300px] max-h-[360px] shadow-inner" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
                {refinementChat.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap border ${
                        msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                      }`}
                      style={
                        msg.role === 'user' 
                          ? { backgroundColor: theme.colors.primaryMuted, color: theme.colors.primary, borderColor: `${theme.colors.primary}33` }
                          : { backgroundColor: theme.colors.bgApp, color: theme.colors.textMain, borderColor: theme.colors.borderColor }
                      }
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isRefining && (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border rounded-xl rounded-tl-none" style={{ backgroundColor: theme.colors.primaryMuted, borderColor: `${theme.colors.primary}33` }}>
                      <div className="relative">
                        <Brain size={14} className="animate-pulse" style={{ color: theme.colors.primary }} />
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute -inset-1 border-t rounded-full"
                          style={{ borderTopColor: theme.colors.primary }}
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest flex gap-1" style={{ color: `${theme.colors.primary}99` }}>
                        Thinking
                        <span className="flex gap-0.5">
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                        </span>
                      </span>
                    </div>
                  </motion.div>
                )}

              </div>
 
              <div className="flex gap-2">
                <input
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendRefinement()}
                  placeholder="Seu ajuste..."
                  className="flex-1 border rounded-xl px-4 py-3 text-xs outline-none transition-all backdrop-blur-sm"
                  style={{ 
                    backgroundColor: theme.colors.bgPanel, 
                    borderColor: theme.colors.borderColor, 
                    color: theme.colors.textMain, 
                    caretColor: theme.colors.primary 
                  }}
                />
                <button 
                  onClick={handleSendRefinement}
                  disabled={!refinementInput.trim() || isRefining}
                  className="p-3 rounded-xl transition-all disabled:opacity-30 border"
                  style={{ 
                    backgroundColor: theme.colors.primaryMuted, 
                    color: theme.colors.primary, 
                    borderColor: `${theme.colors.primary}33` 
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
 
              <button 
                onClick={handleGoToReview}
                className="w-full py-3.5 font-black uppercase tracking-[0.1em] text-[10px] rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`, 
                  color: theme.colors.textInverse,
                  boxShadow: `0 10px 15px -3px ${theme.colors.primary}20`
                }}
              >
                Ideia pronta — Revisar <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 4: Review */}
          {step === 'review' && !isLoading && !isSending && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                  <Check size={20} style={{ color: theme.colors.primary }} />
                  Finalizar Card
                </h3>
              </div>
 
              <div className="border rounded-2xl p-5 space-y-3" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-black tracking-widest pl-1" style={{ color: `${theme.colors.textMuted}99` }}>Título</label>
                  <input 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2.5 text-xs font-black outline-none transition-all backdrop-blur-sm"
                    style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor, color: theme.colors.textMain, caretColor: theme.colors.primary }}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-black tracking-widest pl-1" style={{ color: `${theme.colors.textMuted}99` }}>Descrição Detalhada</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full h-36 border rounded-xl px-4 py-3 text-[11px] outline-none transition-all resize-none no-scrollbar font-sans leading-normal backdrop-blur-sm"
                    style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor, color: theme.colors.textMain, caretColor: theme.colors.primary }}
                  />
                </div>
              </div>
 
              <div className="border rounded-2xl p-5 space-y-3" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
                <label className="text-[8px] uppercase font-black tracking-widest flex items-center gap-1.5 pl-1" style={{ color: `${theme.colors.textMuted}99` }}>
                  <ExternalLink size={10} /> Destino no Discovery
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select 
                      value={selectedBoard}
                      onChange={(e) => setSelectedBoard(e.target.value)}
                      className="w-full border rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none cursor-pointer appearance-none backdrop-blur-sm"
                      style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor, color: theme.colors.textMain }}
                    >

                      <option value="" style={{ backgroundColor: theme.colors.bgPanel, color: theme.colors.textMain }}>Board</option>
                      {boards.map(b => (
                        <option key={b.id} value={b.id} style={{ backgroundColor: theme.colors.bgPanel, color: theme.colors.textMain }}>{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textMuted }} />
                  </div>
                  
                  <div className="relative">
                    <select 
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.target.value)}
                      disabled={!selectedBoard}
                      className="w-full border rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none cursor-pointer appearance-none disabled:opacity-30 backdrop-blur-sm"
                      style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor, color: theme.colors.textMain }}
                    >

                      <option value="" style={{ backgroundColor: theme.colors.bgPanel, color: theme.colors.textMain }}>Lista</option>
                      {lists.map(l => (
                        <option key={l.id} value={l.id} style={{ backgroundColor: theme.colors.bgPanel, color: theme.colors.textMain }}>{l.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: theme.colors.textMuted }} />
                  </div>
                </div>
              </div>
 
              <button 
                onClick={handleSendToTrello}
                disabled={isSending || !selectedList || !editTitle.trim()}
                className="w-full py-4 font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg"
                style={{ 
                  background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`, 
                  color: theme.colors.textInverse,
                  boxShadow: `0 10px 15px -3px ${theme.colors.primary}20`
                }}
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <>Criar Card Discovery <Send size={18}/></>}
              </button>
            </motion.div>
          )}

          {/* STEP 5: Sucesso */}
          {step === 'success' && !isLoading && !isSending && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full gap-10 text-center py-12">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: 'spring', bounce: 0.5 }}
                className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`, 
                  color: theme.colors.textInverse,
                  borderColor: theme.colors.bgPanel,
                  boxShadow: `0 0 80px -10px ${theme.colors.primary}99`
                }}
              >
                <Check size={56} />
              </motion.div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Card Criado!</h2>
                <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: theme.colors.textMuted }}>
                    A ideia <strong style={{ color: theme.colors.primary }}>"{editTitle}"</strong> foi enviada para o Discovery no Trello.
                </p>
              </div>
              <div className="flex gap-4">
                {trelloUrl && (
                  <button 
                    onClick={() => window.open(trelloUrl, '_blank')}
                    className="px-8 py-4 border font-bold uppercase tracking-widest rounded-2xl hover:bg-[var(--primary-muted)] transition-all flex items-center gap-3"
                    style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor, color: theme.colors.textMain }}
                  >
                    <ExternalLink size={18} /> Ver no Trello
                  </button>
                )}
                {onStartSpecification && createdCard && (
                  <button 
                    onClick={() => onStartSpecification(createdCard)}
                    className="px-8 py-4 font-black uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all flex items-center gap-3 shadow-lg"
                    style={{ 
                      background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`, 
                      color: theme.colors.textInverse,
                      boxShadow: `0 10px 15px -3px ${theme.colors.primary}20`
                    }}
                  >
                    <Wand2 size={18} /> Detalhamento Técnico
                  </button>
                )}
                <button 
                  onClick={() => { setStep('idea'); setGeneratedIdeas([]); setSelectedIdea(null); setRefinementChat([]); setCreatedCard(null); }}
                  className="px-8 py-4 font-bold uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all flex items-center gap-3"
                  style={{ backgroundColor: theme.colors.primaryMuted, color: theme.colors.primary }}
                >
                  <Lightbulb size={18} /> Nova Ideia
                </button>
                <button 
                  onClick={onClose} 
                  className="px-8 py-4 font-black uppercase tracking-widest rounded-2xl hover:brightness-110 transition-all border"
                  style={{ 
                    borderColor: theme.colors.borderColor,
                    backgroundColor: theme.colors.bgPanel,
                    color: theme.colors.textMain
                  }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="p-6 border-t flex justify-between items-center opacity-40" style={{ borderColor: theme.colors.borderColor, backgroundColor: `${theme.colors.bgApp}33` }}>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] italic" style={{ color: theme.colors.primary }}>wOs // Idea Pipeline</span>
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60" style={{ color: theme.colors.textMuted }}>Conduzido pelo wOs + Trello</span>
      </div>
    </div>
  );
};

// --- Helper Components para o Pipeline ---

const ProcessingView: React.FC<{ message: string; submessage?: string; theme: Theme }> = ({ message, submessage, theme }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    className="flex flex-col items-center justify-center h-full gap-8 py-20 text-center"
  >
    <div className="relative">
      {/* Outer Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 blur-[40px] rounded-full"
        style={{ backgroundColor: `${theme.colors.primary}33` }}
      />
      
      {/* Icon Container */}
      <div 
        className="relative w-24 h-24 rounded-[32px] flex items-center justify-center shadow-2xl border-2 border-white/20"
        style={{ 
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent || theme.colors.primary})`, 
          color: theme.colors.textInverse,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary}33`
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Lightbulb size={40} strokeWidth={2.5} />
        </motion.div>
      </div>

      {/* Orbiting Dots */}
      {[0, 120, 240].map((angle, i) => (
        <motion.div
          key={i}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
          style={{ rotate: angle }}
        >
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" 
            style={{ backgroundColor: theme.colors.primary, boxShadow: `0 0 10px ${theme.colors.primary}` }}
          />
        </motion.div>
      ))}
    </div>

    <div className="space-y-3 z-10">
      <div className="flex items-center justify-center gap-2">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: theme.colors.primary }}>{message}</h3>
        <span className="flex gap-1">
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
        </span>
      </div>
      {submessage && (
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] max-w-xs mx-auto animate-pulse" style={{ color: `${theme.colors.textMuted}99` }}>
          {submessage}
        </p>
      )}
    </div>

    {/* Shimmer Line */}
    <div className="w-48 h-[1px] relative overflow-hidden rounded-full" style={{ backgroundColor: `${theme.colors.borderColor}50` }}>
      <motion.div 
        animate={{ x: [-200, 200] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{ background: `linear-gradient(to right, transparent, ${theme.colors.primary}66, transparent)` }}
      />
    </div>
  </motion.div>
);

export default PipelineWizard;
