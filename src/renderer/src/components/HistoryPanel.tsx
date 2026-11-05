import React, { useEffect, useState } from 'react';
import { 
  History, 
  MessageSquare, 
  Trash2, 
  Plus, 
  X,
  Calendar,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Theme } from '../config/themes';

import { ConfirmationDialog } from './ConfirmationDialog';

interface Conversation {
  id: string;
  title: string;
  lastUpdated: string;
  modelId?: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  currentId: string | null;
  theme: Theme;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  isOpen, 
  onClose, 
  onSelectConversation, 
  onNewChat,
  currentId,
  theme
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const result = await window.api.chat.listConversations();
      if (result.success) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sem data';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data pendente';
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredConversations = conversations.filter((conv) => {
    const title = conv.title || 'Conversa sem título';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayedConversations = filteredConversations.slice(0, visibleCount);
  const hasMore = filteredConversations.length > visibleCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 z-[100] backdrop-blur-xl border-l shadow-2xl flex flex-col"
          style={{ 
            backgroundColor: `${theme.colors.bgPanel}F2`, // F2 = 95% opacity
            borderColor: theme.colors.borderColor 
          }}
        >
          {/* Header */}
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: theme.colors.borderColor }}>
            <div className="flex items-center gap-3 font-semibold" style={{ color: theme.colors.textMain }}>
              <History className="w-5 h-5" style={{ color: theme.colors.primary }} />
              <span>Histórico de Contexto</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              style={{ color: theme.colors.textMuted }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 pb-2">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-lg active:scale-95"
              style={{ 
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                boxShadow: `0 10px 15px -3px ${theme.colors.primary}33` // 33 = 20% opacity
              }}
            >
              <Plus className="w-4 h-4" />
              Nova Conversa
            </button>
          </div>

          {/* Campo de Busca Premium */}
          <div className="px-4 pb-3">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ color: theme.colors.textMuted }}>
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar conversas..."
                className="w-full bg-white/5 border rounded-xl py-2 pl-9 pr-9 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                style={{
                  color: theme.colors.textMain,
                  borderColor: theme.colors.borderColor,
                  backgroundColor: `${theme.colors.bgApp}60`
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                  style={{ color: theme.colors.textMuted }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3" style={{ color: theme.colors.textMuted }}>
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.colors.primary }} />
                <span className="text-sm font-medium">Carregando...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center px-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: theme.colors.bgApp }}>
                  <MessageSquare className="w-8 h-8" style={{ color: theme.colors.textMuted }} />
                </div>
                <h3 className="font-medium mb-1" style={{ color: theme.colors.textMain }}>
                  {searchTerm ? 'Nenhum resultado' : 'Nenhuma conversa'}
                </h3>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                  {searchTerm ? 'Tente outros termos de busca.' : 'Suas interações aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedConversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    layoutId={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className={`group p-4 rounded-xl cursor-pointer transition-all border ${
                      currentId === conv.id ? 'ring-1' : ''
                    }`}
                    style={{
                      backgroundColor: currentId === conv.id ? theme.colors.primaryMuted : 'transparent',
                      borderColor: currentId === conv.id ? theme.colors.primary : theme.colors.borderColor,
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`text-sm font-medium line-clamp-2 leading-snug flex-1 pr-2`}
                          style={{ color: currentId === conv.id ? theme.colors.primary : theme.colors.textMain }}>
                        {conv.title || 'Conversa sem título'}
                      </h4>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"
                        style={{ color: theme.colors.textMuted }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.colors.textMuted }}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(conv.lastUpdated)}
                      </div>
                      {conv.modelId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md border transition-colors"
                              style={{ 
                                backgroundColor: theme.colors.bgApp, 
                                color: theme.colors.textMuted,
                                borderColor: theme.colors.borderColor
                              }}>
                          {conv.modelId.split('-')[0]}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {hasMore && (
                  <div className="pt-3 pb-2 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 20)}
                      className="text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all active:scale-95 border"
                      style={{ 
                        color: theme.colors.textMuted,
                        borderColor: theme.colors.borderColor,
                        backgroundColor: `${theme.colors.bgApp}50`
                      }}
                    >
                      Carregar Mais ({filteredConversations.length - visibleCount} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <ConfirmationDialog
            isOpen={!!deleteTargetId}
            title="Excluir Conversa"
            message="Tem certeza que deseja excluir esta conversa? Esta ação não poderá ser desfeita."
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            type="danger"
            theme={theme}
            onConfirm={async () => {
              if (deleteTargetId) {
                try {
                  await window.api.chat.deleteConversation(deleteTargetId);
                  setConversations(prev => prev.filter(c => c.id !== deleteTargetId));
                  if (currentId === deleteTargetId) onNewChat();
                } catch (error) {
                  console.error('Erro ao deletar:', error);
                }
              }
            }}
            onCancel={() => setDeleteTargetId(null)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryPanel;
