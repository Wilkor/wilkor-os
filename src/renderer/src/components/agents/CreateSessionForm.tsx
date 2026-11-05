import React, { useState, useEffect } from 'react';
import { Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';
import { IAgent } from '../../../../shared/types';

interface CreateSessionFormProps {
  agents: IAgent[];
  workspaceRoots: string[];
  isLoading: boolean;
  onClose: () => void;
  onCreate: (options: {
    title: string;
    agentIds: string[];
    maxRounds: number;
    topic?: string;
    repoPath?: string;
    trelloCardId?: string;
    trelloCardName?: string;
  }) => Promise<void>;
}

export const CreateSessionForm: React.FC<CreateSessionFormProps> = ({
  agents,
  workspaceRoots,
  isLoading,
  onClose,
  onCreate,
}) => {
  const [debateType, setDebateType] = useState<'code' | 'trello'>('code');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [maxRounds, setMaxRounds] = useState(20);
  const [selectedRepoPath, setSelectedRepoPath] = useState(workspaceRoots[0] || '');
  const [error, setError] = useState<string | null>(null);

  // Estados do Trello
  const [boards, setBoards] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [loadingTrello, setLoadingTrello] = useState(false);

  useEffect(() => {
    if (debateType !== 'trello') return;
    setLoadingTrello(true);
    window.api.pipeline.getTrelloBoards()
      .then((res: any) => {
        if (res.success && Array.isArray(res.boards)) {
          setBoards(res.boards);
          const techBoard = res.boards.find((b: any) => b.name.toLowerCase() === 'tech');
          const defaultBoardId = techBoard ? techBoard.id : (res.boards[0]?.id || '');
          setSelectedBoardId(defaultBoardId);
        }
      })
      .catch((err: any) => console.error('Erro ao carregar boards do Trello:', err))
      .finally(() => setLoadingTrello(false));
  }, [debateType]);

  useEffect(() => {
    if (!selectedBoardId || debateType !== 'trello') {
      setLists([]);
      setSelectedListId('');
      return;
    }
    setLoadingTrello(true);
    window.api.pipeline.getTrelloLists(selectedBoardId)
      .then((res: any) => {
        if (res.success && Array.isArray(res.lists)) {
          setLists(res.lists);
          const backlogList = res.lists.find((l: any) => l.name.toLowerCase() === 'backlog');
          const defaultListId = backlogList ? backlogList.id : (res.lists[0]?.id || '');
          setSelectedListId(defaultListId);
        }
      })
      .catch((err: any) => console.error('Erro ao carregar listas do Trello:', err))
      .finally(() => setLoadingTrello(false));
  }, [selectedBoardId, debateType]);

  useEffect(() => {
    if (!selectedListId || debateType !== 'trello') {
      setCards([]);
      setSelectedCardId('');
      return;
    }
    setLoadingTrello(true);
    window.api.pipeline.getTrelloCards(selectedListId)
      .then((res: any) => {
        if (res.success && Array.isArray(res.cards)) {
          setCards(res.cards);
        }
      })
      .catch((err: any) => console.error('Erro ao carregar cards do Trello:', err))
      .finally(() => setLoadingTrello(false));
  }, [selectedListId, debateType]);

  const handleCardChange = (cardId: string) => {
    setSelectedCardId(cardId);
    if (cardId) {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        setTitle(`Documentar: ${card.name}`);
        if (card.desc) {
          setTopic(`Requisitos do Card do Trello:\n${card.desc}`);
        }
      }
    }
  };

  const handleToggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);
  };

  const handleCreateClick = async () => {
    if (debateType === 'trello' && !selectedCardId) {
      setError('Por favor, selecione um card do Trello para documentar.');
      return;
    }
    if (!title.trim()) { setError('O título da sala é obrigatório.'); return; }
    if (selectedAgentIds.length === 0) { setError('Selecione pelo menos um agente.'); return; }

    setError(null);
    const selectedCard = cards.find(c => c.id === selectedCardId);
    try {
      await onCreate({
        title: title.trim(),
        agentIds: selectedAgentIds,
        maxRounds,
        topic: topic.trim() || undefined,
        repoPath: selectedRepoPath || undefined,
        trelloCardId: debateType === 'trello' ? selectedCardId || undefined : undefined,
        trelloCardName: debateType === 'trello' && selectedCard ? selectedCard.name : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar a sala.');
    }
  };

  return (
    <div className="w-80 bg-[#0d0e12] border border-white/[0.05] rounded-2xl p-5 flex flex-col shrink-0 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-2">
          <Sparkles size={14} className="text-primary" /> Novo Debate de Agente
        </h3>
        <button type="button" onClick={onClose} className="p-1 hover:bg-white/[0.06] rounded-lg text-text-muted hover:text-text-main transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Seletor do Tipo de Foco/Debate */}
      <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-4">
        <button
          type="button"
          onClick={() => { setDebateType('code'); setError(null); }}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${debateType === 'code' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}
        >
          Análise de Código
        </button>
        <button
          type="button"
          onClick={() => { setDebateType('trello'); setError(null); }}
          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${debateType === 'trello' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}
        >
          Documentar Trello
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] leading-relaxed">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {/* Campos Condicionais do Trello */}
        {debateType === 'trello' && (
          <div className="space-y-2 border-b border-white/[0.03] pb-4">
            <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Selecione o Card do Trello <span className="text-red-400">*</span></label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[11px] text-text-main focus:outline-none focus:border-primary/50"
            >
              <option value="">-- Selecione o Quadro --</option>
              {boards.map(b => (
                <option key={b.id} value={b.id} className="bg-[#0d0e12]">{b.name}</option>
              ))}
            </select>

            <select
              value={selectedListId}
              disabled={!selectedBoardId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[11px] text-text-main focus:outline-none focus:border-primary/50 disabled:opacity-40"
            >
              <option value="">-- Selecione a Lista --</option>
              {lists.map(l => (
                <option key={l.id} value={l.id} className="bg-[#0d0e12]">{l.name}</option>
              ))}
            </select>

            <select
              value={selectedCardId}
              disabled={!selectedListId || cards.length === 0}
              onChange={(e) => handleCardChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[11px] text-text-main focus:outline-none focus:border-primary/50 disabled:opacity-40"
            >
              <option value="">-- Vincular Card do Backlog --</option>
              {cards.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0d0e12]">{c.name}</option>
              ))}
            </select>
            {loadingTrello && <p className="text-[9px] text-text-muted/60 animate-pulse">Sincronizando com o Trello...</p>}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">Título do Debate <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={debateType === 'trello' ? 'Preenchido ao escolher o card' : 'Ex: Refatoração do módulo de pagamento'}
            className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">Projeto / Repositório</label>
          <select
            value={selectedRepoPath}
            onChange={(e) => setSelectedRepoPath(e.target.value)}
            className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main focus:outline-none focus:border-primary/50 transition-colors"
          >
            {workspaceRoots.map((root) => (
              <option key={root} value={root} className="bg-[#0d0e12] text-text-main">
                {root.split(/[\\/]/).pop()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">Limite de Rodadas</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={50}
              value={maxRounds}
              onChange={(e) => setMaxRounds(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xs font-bold text-text-main w-8">{maxRounds}</span>
          </div>
        </div>

        {/* Campo de Contexto/Tópico - Exibido apenas no debate de código */}
        {debateType === 'code' && (
          <div>
            <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">Contexto / Tópico Inicial</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Descreva o problema ou contexto que os agentes vão analisar..."
              rows={3}
              className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>
        )}

        <div>
          <label className="flex justify-between text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-2">
            <span>Selecionar Agentes <span className="text-red-400">*</span></span>
            <span className="text-[9px] text-primary lowercase">({selectedAgentIds.length} selecionados)</span>
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {agents.map((agent) => {
              const isSelected = selectedAgentIds.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  onClick={() => handleToggleAgentSelection(agent.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer select-none transition-all ${isSelected ? 'bg-primary/10 border-primary/45' : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: `${agent.color}15`, color: agent.color }} className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.02] text-xs">
                      {agent.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-text-main line-clamp-1">{agent.name}</p>
                      <p className="text-[8px] text-text-muted/70">{agent.role}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-white/20'}`}>
                    {isSelected && <span className="w-1 h-1 bg-white rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreateClick}
        disabled={isLoading || !title.trim() || selectedAgentIds.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <><Loader2 size={14} className="animate-spin" /> Criando sala...</> : <><Sparkles size={14} /> Iniciar Discussão</>}
      </button>
    </div>
  );
};
