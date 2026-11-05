import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Image as ImageIcon, FileText } from 'lucide-react';
import { ThinkingBlock } from '../ThinkingBlock';
import Markdown from './Markdown';
import { renderTextWithMentions } from '../../utils/mentionFormatter';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: {
    name: string;
    type: string;
    content: string;
  }[];
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  fileTrees: Record<string, any[]>;
  handleChatDrop: (e: React.DragEvent) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  fileTrees = {},
  handleChatDrop,
  chatEndRef
}) => {
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ 
        behavior: isLoading ? 'auto' : 'smooth' 
      });
    }
  }, [messages, isLoading]);

  const cleanContent = (content: string) => {
    if (!content) return '';
    let cleaned = content
      .replace(/<wos_action[\s\S]*?>/g, '')
      .replace(/<\/wos_action>/g, '')
      .replace(/<wos_command[\s\S]*?>/g, '')
      .replace(/<\/wos_command>/g, '')
      .replace(/<wilkor_action[\s\S]*?>/g, '')
      .replace(/<\/wilkor_action>/g, '')
      .replace(/<wilkor_command[\s\S]*?>/g, '')
      .replace(/<\/wilkor_command>/g, '');

    // Remove tool calls com chaves simples e aninhadas de forma robusta
    cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"tool_call"[\s\S]*?\}\s*\}\s*/g, '');
    cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"tool_call"[\s\S]*?\}/g, '');

    // Remove chaves fechadas isoladas no início do texto que possam ter sobrado
    cleaned = cleaned.replace(/^[\s\}]+/, '');

    return cleaned.trim();
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar chat-container scroll-smooth relative z-10"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleChatDrop}
    >
      {/* Safe Mode Alert */}
      <AnimatePresence>
        {(!fileTrees || Object.keys(fileTrees).length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl flex items-center gap-3 mb-6 backdrop-blur-sm"
          >
            <ShieldAlert size={14} className="text-red-500" />
            <p className="text-[10px] text-text-muted font-medium">Sandbox Mode: Workspace not connected.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.map((message, index) => {
        if ((message as any).isInvisible) {
          return null;
        }
        const cleaned = cleanContent(message.content);
        const isUser = message.role === 'user';
        const isLast = index === messages.length - 1;

        if (isUser) {
           return (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={index}
               className="flex flex-col items-end mb-4 group"
             >
                <div className="relative max-w-[90%] bg-bg-panel border border-border/60 rounded-2xl px-4 py-2.5 shadow-lg group-hover:border-primary/20 transition-colors">
                   <div className="flex items-center justify-between gap-4">
                      <p className="text-[13px] text-text-main leading-relaxed font-medium flex flex-wrap items-center gap-1">
                        {renderTextWithMentions(cleaned)}
                      </p>
                      <button className="text-text-muted/20 hover:text-text-muted transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v.5"/></svg>
                      </button>
                   </div>
                </div>
             </motion.div>
           );
        }

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={index}
            className="flex flex-col pb-4"
          >
            {/* Cabeçalho do Agente Especialista */}
            {(message as any).senderName && (
              <div className="flex items-center gap-2 mb-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg w-fit">
                <span className="text-[12px]">{(message as any).senderEmoji || '🤖'}</span>
                <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: (message as any).senderColor || 'var(--color-primary)' }}>
                  {(message as any).senderName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold uppercase tracking-tight opacity-50">Agente Especialista</span>
              </div>
            )}

            {/* Thinking Block / Activities */}
            <ThinkingBlock
              content={message.content}
              isStreaming={isLoading && isLast}
            />

            {/* Assistant Content */}
            {cleaned !== '' && (
              <div className="markdown-container max-w-none text-[13px] text-text-main leading-relaxed">
                <Markdown content={cleaned} />
                
                {isLast && isLoading && (
                  <motion.span 
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-1.5 h-4 bg-primary/60 ml-1 rounded-sm align-middle"
                  />
                )}
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] rounded-md text-[10px] text-text-muted border border-white/5">
                    {att.type?.startsWith('image/') ? <ImageIcon size={10} /> : <FileText size={10} />}
                    <span className="truncate max-w-[100px]">{att.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
      <div ref={chatEndRef} className="h-4" />
    </div>
  );
};

export default MessageList;
