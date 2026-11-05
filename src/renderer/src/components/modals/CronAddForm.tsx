import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { IAgent } from '../../../../shared/types';

interface CronAddFormProps {
  isOpen: boolean;
  name: string;
  setName: (name: string) => void;
  cronExpr: string;
  setCronExpr: (expr: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  model: string;
  setModel: (model: string) => void;
  agents: IAgent[];
  selectedAgentIds: string[];
  toggleAgentSelection: (id: string) => void;
  onSubmit: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export const CronAddForm: React.FC<CronAddFormProps> = ({
  isOpen,
  name,
  setName,
  cronExpr,
  setCronExpr,
  prompt,
  setPrompt,
  model,
  setModel,
  agents,
  selectedAgentIds,
  toggleAgentSelection,
  onSubmit,
  isEditing = false,
  onCancelEdit
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }} 
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-bg-app border border-border rounded-2xl p-6 space-y-4"
    >
      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">
        {isEditing ? 'Editar Agendamento' : 'Configurar Novo Agendamento'}
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase tracking-widest text-text-muted">Nome da Tarefa</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Consultar commits recentes"
            className="w-full bg-bg-panel border border-border rounded-xl p-3 text-xs outline-none focus:border-primary/50 text-text-main"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase tracking-widest text-text-muted">Expressão Cron (5 campos)</label>
          <input
            type="text"
            value={cronExpr}
            onChange={(e) => setCronExpr(e.target.value)}
            placeholder="Ex: 0 18 * * * (todos os dias as 18h)"
            className="w-full bg-bg-panel border border-border rounded-xl p-3 text-xs outline-none focus:border-primary/50 text-text-main font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[8px] font-black uppercase tracking-widest text-text-muted">Prompt para a IA (O que ela deve fazer)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Faça uma consulta de todos os commits feitos hoje..."
          className="w-full bg-bg-panel border border-border rounded-xl p-3 text-xs h-20 outline-none focus:border-primary/50 text-text-main resize-none"
        />
      </div>

      <div className="space-y-2 relative">
        <label className="text-[8px] font-black uppercase tracking-widest text-text-muted">
          Agentes Especialistas Associados (Opcional - Debaterão sequencialmente)
        </label>
        
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-bg-panel border border-border rounded-xl p-3 text-xs outline-none focus:border-primary/50 text-text-main flex items-center justify-between text-left font-bold"
        >
          <span>
            {selectedAgentIds.length === 0 
              ? 'Selecionar agentes especialistas...' 
              : selectedAgentIds.length === 1 
                ? '1 agente especialista selecionado' 
                : `${selectedAgentIds.length} agentes especialistas selecionados`}
          </span>
          <span className="text-[10px] text-text-muted transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
        </button>

        {dropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 cursor-default" 
              onClick={() => setDropdownOpen(false)} 
            />
            <div className="absolute left-0 right-0 mt-1 bg-bg-panel/95 backdrop-blur-md border border-border rounded-xl p-2 z-50 max-h-48 overflow-y-auto space-y-1 shadow-2xl">
              {agents && agents.length > 0 ? (
                agents.map((agent) => {
                  const isSelected = selectedAgentIds.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => toggleAgentSelection(agent.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 text-left text-xs ${
                        isSelected ? 'bg-white/5 font-bold' : ''
                      }`}
                    >
                      <div 
                        style={{ 
                          borderColor: isSelected ? agent.color : 'var(--border)',
                          backgroundColor: isSelected ? agent.color : 'transparent' 
                        }}
                        className="w-3.5 h-3.5 border rounded flex items-center justify-center transition-all"
                      >
                        {isSelected && <span className="text-[9px] text-black font-black leading-none">✓</span>}
                      </div>

                      <span className="text-base">{agent.emoji || '🤖'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-text-main truncate">{agent.name}</p>
                        <p className="text-[9px] text-text-muted truncate">{agent.role}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-[10px] text-text-muted italic p-3 text-center">
                  Nenhum agente especialista cadastrado no wOs.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-3">
          <label className="text-[8px] font-black uppercase tracking-widest text-text-muted">Modelo de IA</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-bg-panel border border-border rounded-xl px-3 py-2 text-xs text-text-main outline-none focus:border-primary/50 font-bold"
          >
            <option value="auto">Auto Router (Recomendado)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-text-main rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Check size={12} /> {isEditing ? 'Salvar Alterações' : 'Salvar Agendamento'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
