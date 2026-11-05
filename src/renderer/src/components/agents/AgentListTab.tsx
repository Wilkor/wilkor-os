import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit, X, Save, Bot } from 'lucide-react';
import { IAgent } from '../../../../shared/types';

interface AgentListTabProps {
  agents: IAgent[];
  onSaveAgent: (agent: IAgent) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
}

const PRESET_EMOJIS = ['🤖', '🎨', '💻', '🔍', '📋', '🚀', '🧠', '⚙️', '💡', '🧙‍♂️', '📊', '🛡️'];
const PRESET_COLORS = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1'];
const PRESET_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (OpenAI)' },
  { id: 'gpt-4o', name: 'GPT-4o (OpenAI)' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Google)' }
];

export const AgentListTab: React.FC<AgentListTabProps> = ({ agents, onSaveAgent, onDeleteAgent }) => {
  const [editingAgent, setEditingAgent] = useState<IAgent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelId, setModelId] = useState('gpt-4o-mini');
  const [emoji, setEmoji] = useState('🤖');
  const [color, setColor] = useState('#A855F7');

  const handleOpenCreate = () => {
    setEditingAgent(null);
    setName('');
    setRole('');
    setSystemPrompt('');
    setModelId('gpt-4o-mini');
    setEmoji('🤖');
    setColor('#A855F7');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (agent: IAgent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setRole(agent.role);
    setSystemPrompt(agent.systemPrompt);
    setModelId(agent.modelId);
    setEmoji(agent.emoji);
    setColor(agent.color);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !systemPrompt.trim()) return;

    const agentData: IAgent = {
      id: editingAgent ? editingAgent.id : Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      role: role.trim(),
      systemPrompt: systemPrompt.trim(),
      modelId,
      emoji,
      color,
      createdAt: editingAgent?.createdAt || new Date()
    };

    await onSaveAgent(agentData);
    setIsFormOpen(false);
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden p-1">
      {/* Lista de Agentes */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-muted/60 uppercase tracking-wider">
            Meus Agentes Autônomos ({agents.length})
          </h3>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={14} /> Novo Agente
          </button>
        </div>

        {agents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border border-white/[0.04] rounded-2xl bg-white/[0.01] p-8 text-center">
            <Bot size={40} className="text-text-muted/20 mb-3" />
            <p className="text-sm text-text-muted">Nenhum agente cadastrado ainda.</p>
            <p className="text-xs text-text-muted/50 mt-1">Crie seu primeiro agente para iniciar discussões!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{ borderColor: `${agent.color}15` }}
                className="group border bg-[#0d0e12]/80 rounded-2xl p-4 flex flex-col justify-between hover:bg-[#121319] hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)] transition-all duration-300 relative overflow-hidden"
              >
                <div
                  className="absolute right-0 top-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none transition-all group-hover:scale-125"
                  style={{ backgroundColor: agent.color }}
                />
                
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-white/[0.04]"
                      >
                        {agent.emoji}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">
                          {agent.name}
                        </h4>
                        <span className="text-[10px] font-medium text-text-muted bg-white/[0.04] border border-white/[0.02] px-2 py-0.5 rounded-md">
                          {agent.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(agent)}
                        className="p-1.5 hover:bg-white/[0.06] text-text-muted hover:text-text-main rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteAgent(agent.id)}
                        className="p-1.5 hover:bg-red-500/10 text-text-muted hover:text-red-400 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-text-muted line-clamp-3 mb-4 leading-relaxed font-sans select-none">
                    {agent.systemPrompt}
                  </p>
                </div>

                <div className="border-t border-white/[0.03] pt-2 flex items-center justify-between text-[9px] text-text-muted/60">
                  <span>Modelo: <strong className="text-text-muted/90">{agent.modelId}</strong></span>
                  <span style={{ color: agent.color }} className="font-semibold uppercase tracking-wider text-[8px]">
                    Ativo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de Cadastro/Edição Lateral */}
      {isFormOpen && (
        <div className="w-80 bg-[#0d0e12] border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between shrink-0 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-main flex items-center gap-2">
              <Bot size={14} className="text-primary" />
              {editingAgent ? 'Editar Agente' : 'Cadastrar Agente'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1 hover:bg-white/[0.06] rounded-lg text-text-muted hover:text-text-main transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">
                Nome do Agente
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CodeMaster"
                required
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">
                Papel / Especialidade
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Desenvolvedor Fullstack"
                required
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">
                Modelo de Linguagem
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-3 py-2 bg-[#090a0d] border border-white/[0.06] rounded-xl text-xs text-text-main focus:outline-none focus:border-primary/50 transition-colors"
              >
                {PRESET_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">
                Avatar (Emoji)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`h-9 border rounded-xl flex items-center justify-center text-lg transition-all ${
                      emoji === e ? 'bg-primary/20 border-primary scale-105' : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">
                Cor de Destaque
              </label>
              <div className="flex gap-2.5 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      color === c ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-transparent opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted/60 uppercase tracking-wider mb-1.5">
                Instruções do Sistema (System Prompt)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Defina as diretrizes, comportamento, personalidade e regras técnicas que este agente deve seguir..."
                required
                rows={5}
                className="w-full px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-colors font-sans leading-relaxed resize-none"
              />
            </div>
          </form>

          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 transition-all"
          >
            <Save size={14} /> Salvar Agente
          </button>
        </div>
      )}
    </div>
  );
};
