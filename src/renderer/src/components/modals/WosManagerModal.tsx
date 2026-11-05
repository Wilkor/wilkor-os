import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit, Save, Eye, Check, XCircle } from 'lucide-react';

interface WosItem {
  name: string;
  path: string;
  content?: string;
}

interface WosManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'skills' | 'rules' | 'workflows';

export const WosManagerModal: React.FC<WosManagerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('skills');
  const [items, setItems] = useState<WosItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<WosItem | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state for skills
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillInstructions, setSkillInstructions] = useState('');

  // Form state for rules
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('');
  const [rulePriority, setRulePriority] = useState(5);
  const [ruleInstructions, setRuleInstructions] = useState('');

  // Form state for workflows
  const [workflowName, setWorkflowName] = useState('');
  const [workflowTrigger, setWorkflowTrigger] = useState('');
  const [workflowSteps, setWorkflowSteps] = useState('');

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, activeTab]);

  const loadItems = async () => {
    try {
      const methodName = activeTab === 'skills' ? 'listWosSkills' : activeTab === 'rules' ? 'listWosRules' : 'listWosWorkflows';
      const result = await (window as any).api.workspace[methodName]();
      if (result.success && result.items) {
        setItems(result.items);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    resetForm();
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleEdit = (item: WosItem) => {
    setEditingItem(item);
    loadItemContent(item);
    setIsEditing(true);
    setPreviewMode(false);
  };

  const loadItemContent = async (item: WosItem) => {
    try {
      const methodName = activeTab === 'skills' ? 'getWosSkill' : activeTab === 'rules' ? 'getWosRule' : 'getWosWorkflow';
      const result = await (window as any).api.workspace[methodName](item.name);
      if (result.success && result.content) {
        parseContent(result.content);
      }
    } catch (error) {
      console.error('Error loading item content:', error);
    }
  };

  const parseContent = (content: string) => {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const body = frontmatterMatch[2];

      if (activeTab === 'skills') {
        const descMatch = frontmatter.match(/description:\s*(.*)/);
        setSkillDescription(descMatch ? descMatch[1].trim() : '');
        setSkillInstructions(body.trim());
        setSkillName(editingItem?.name || '');
      } else if (activeTab === 'rules') {
        const triggerMatch = frontmatter.match(/trigger:\s*(.*)/);
        const priorityMatch = frontmatter.match(/priority:\s*(\d+)/);
        setRuleTrigger(triggerMatch ? triggerMatch[1].trim() : '');
        setRulePriority(priorityMatch ? parseInt(priorityMatch[1], 10) : 5);
        setRuleInstructions(body.trim());
        setRuleName(editingItem?.name || '');
      } else if (activeTab === 'workflows') {
        const triggerMatch = frontmatter.match(/trigger:\s*(.*)/);
        setWorkflowTrigger(triggerMatch ? triggerMatch[1].trim() : '');
        setWorkflowSteps(body.trim());
        setWorkflowName(editingItem?.name || '');
      }
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}?`)) return;

    try {
      const methodName = activeTab === 'skills' ? 'deleteWosSkill' : activeTab === 'rules' ? 'deleteWosRule' : 'deleteWosWorkflow';
      const result = await (window as any).api.workspace[methodName](name);
      if (result.success) {
        loadItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSave = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    try {
      const methodName = editingItem
        ? activeTab === 'skills' ? 'updateWosSkill' : activeTab === 'rules' ? 'updateWosRule' : 'updateWosWorkflow'
        : activeTab === 'skills' ? 'createWosSkill' : activeTab === 'rules' ? 'createWosRule' : 'createWosWorkflow';

      let result;
      if (activeTab === 'skills') {
        result = await (window as any).api.workspace[methodName](
          editingItem?.name || skillName,
          skillDescription,
          skillInstructions
        );
      } else if (activeTab === 'rules') {
        result = await (window as any).api.workspace[methodName](
          editingItem?.name || ruleName,
          ruleTrigger,
          rulePriority,
          ruleInstructions
        );
      } else {
        result = await (window as any).api.workspace[methodName](
          editingItem?.name || workflowName,
          workflowTrigger,
          workflowSteps
        );
      }

      if (result.success) {
        setIsEditing(false);
        resetForm();
        loadItems();
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (activeTab === 'skills') {
      if (!skillName.trim()) errors.push('Nome é obrigatório');
      if (!skillDescription.trim()) errors.push('Descrição é obrigatória');
      if (!skillInstructions.trim()) errors.push('Instruções são obrigatórias');
    } else if (activeTab === 'rules') {
      if (!ruleName.trim()) errors.push('Nome é obrigatório');
      if (!ruleTrigger.trim()) errors.push('Trigger é obrigatório');
      if (rulePriority < 1 || rulePriority > 10) errors.push('Prioridade deve ser entre 1 e 10');
      if (!ruleInstructions.trim()) errors.push('Instruções são obrigatórias');
    } else if (activeTab === 'workflows') {
      if (!workflowName.trim()) errors.push('Nome é obrigatório');
      if (!workflowTrigger.trim()) errors.push('Trigger é obrigatório');
      if (!workflowSteps.trim()) errors.push('Passos são obrigatórios');
    }

    return { valid: errors.length === 0, errors };
  };

  const resetForm = () => {
    setSkillName('');
    setSkillDescription('');
    setSkillInstructions('');
    setRuleName('');
    setRuleTrigger('');
    setRulePriority(5);
    setRuleInstructions('');
    setWorkflowName('');
    setWorkflowTrigger('');
    setWorkflowSteps('');
    setValidationErrors([]);
  };

  const generatePreview = () => {
    if (activeTab === 'skills') {
      return `---
description: ${skillDescription}
---

${skillInstructions}`;
    } else if (activeTab === 'rules') {
      return `---
trigger: ${ruleTrigger}
priority: ${rulePriority}
---

${ruleInstructions}`;
    } else {
      return `---
trigger: ${workflowTrigger}
---

${workflowSteps}`;
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'skills':
        return '🎯';
      case 'rules':
        return '📋';
      case 'workflows':
        return '🔄';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-bg-panel border border-border rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]"
          >
            {/* Header */}
            <div className="px-7 pt-7 pb-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-lg">{getTabIcon(activeTab)}</span>
                </div>
                <div>
                  <h2 className="text-[13px] font-black text-text-main uppercase tracking-widest">
                    Gerenciar {activeTab === 'skills' ? 'Skills' : activeTab === 'rules' ? 'Rules' : 'Workflows'}
                  </h2>
                  <p className="text-[9px] text-text-muted mt-0.5">
                    {items.length} {activeTab === 'skills' ? 'skill' : activeTab === 'rules' ? 'rule' : 'workflow'}
                    {items.length !== 1 ? 's' : ''} encontrado{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-app text-text-muted hover:text-text-main transition-all">
                <X size={15} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['skills', 'rules', 'workflows'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsEditing(false);
                    resetForm();
                  }}
                  className={`flex-1 px-6 py-3 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-text-muted hover:text-text-main hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="mr-2">{getTabIcon(tab)}</span>
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto no-scrollbar">
              {!isEditing ? (
                /* List View */
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted/50">
                      {activeTab === 'skills' ? 'Skills' : activeTab === 'rules' ? 'Rules' : 'Workflows'}
                    </span>
                    <button
                      onClick={handleCreate}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                      <Plus size={12} className="mr-0.5" />
                      Novo {activeTab === 'skills' ? 'Skill' : activeTab === 'rules' ? 'Rule' : 'Workflow'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {items.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-[11px] text-text-muted/40 font-bold">
                          Nenhum {activeTab === 'skills' ? 'skill' : activeTab === 'rules' ? 'rule' : 'workflow'} encontrado.
                        </p>
                      </div>
                    ) : (
                      items.map((item, index) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-2xl hover:bg-white/[0.02] border border-border/40 text-left transition-all"
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="w-8 h-8 rounded-xl bg-bg-app border border-border flex items-center justify-center shrink-0">
                              <span className="text-sm">{getTabIcon(activeTab)}</span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[12px] font-bold text-text-main truncate">{item.name}</span>
                              <span className="text-[9px] text-text-muted/40 truncate font-mono mt-0.5">{item.path}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 text-blue-500 hover:text-blue-400 transition-all shrink-0"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.name)}
                              className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 hover:text-red-400 transition-all shrink-0"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Edit Form */
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted/50">
                      {editingItem ? 'Editar' : 'Criar'} {activeTab === 'skills' ? 'Skill' : activeTab === 'rules' ? 'Rule' : 'Workflow'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-wider ${
                          previewMode
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-bg-app border-border text-text-muted hover:text-text-main'
                        }`}
                      >
                        <Eye size={12} className="mr-0.5" />
                        {previewMode ? 'Editar' : 'Preview'}
                      </button>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      {validationErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-[10px] text-red-400">
                          <XCircle size={12} />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {!previewMode ? (
                    /* Form Fields */
                    <div className="space-y-4">
                      {activeTab === 'skills' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Nome</label>
                            <input
                              type="text"
                              value={skillName}
                              onChange={(e) => setSkillName(e.target.value)}
                              disabled={!!editingItem}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                              placeholder="nome-do-skill"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Descrição</label>
                            <input
                              type="text"
                              value={skillDescription}
                              onChange={(e) => setSkillDescription(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all"
                              placeholder="Descrição breve do skill"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Instruções</label>
                            <textarea
                              value={skillInstructions}
                              onChange={(e) => setSkillInstructions(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all min-h-[200px] resize-none"
                              placeholder="Instruções detalhadas do skill em markdown..."
                            />
                          </div>
                        </>
                      )}

                      {activeTab === 'rules' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Nome</label>
                            <input
                              type="text"
                              value={ruleName}
                              onChange={(e) => setRuleName(e.target.value)}
                              disabled={!!editingItem}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                              placeholder="nome-da-rule"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Trigger</label>
                            <input
                              type="text"
                              value={ruleTrigger}
                              onChange={(e) => setRuleTrigger(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all"
                              placeholder="palavra-chave ou /regex/"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Prioridade (1-10)</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={rulePriority}
                              onChange={(e) => setRulePriority(parseInt(e.target.value, 10))}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Instruções</label>
                            <textarea
                              value={ruleInstructions}
                              onChange={(e) => setRuleInstructions(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all min-h-[200px] resize-none"
                              placeholder="Instruções da rule em markdown..."
                            />
                          </div>
                        </>
                      )}

                      {activeTab === 'workflows' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Nome</label>
                            <input
                              type="text"
                              value={workflowName}
                              onChange={(e) => setWorkflowName(e.target.value)}
                              disabled={!!editingItem}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                              placeholder="nome-do-workflow"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Trigger</label>
                            <input
                              type="text"
                              value={workflowTrigger}
                              onChange={(e) => setWorkflowTrigger(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all"
                              placeholder="palavra-chave ou /regex/"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Passos</label>
                            <textarea
                              value={workflowSteps}
                              onChange={(e) => setWorkflowSteps(e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-bg-app border border-border text-[12px] text-text-main focus:outline-none focus:border-primary/50 transition-all min-h-[200px] resize-none"
                              placeholder="Passos do workflow em markdown (use ## Passo 1, ## Passo 2, etc.)..."
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Preview */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-bg-app border border-border">
                        <pre className="text-[11px] text-text-muted font-mono whitespace-pre-wrap overflow-x-auto">
                          {generatePreview()}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="px-7 py-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-bg-app hover:bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <Save size={12} className="mr-0.5" />
                  Salvar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WosManagerModal;
