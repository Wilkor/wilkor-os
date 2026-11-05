import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Terminal, 
  FileCode, 
  Search,
  PenTool,
  Brain
} from 'lucide-react';
import { parseMessageActions } from '../../../shared/actionPatterns';

interface Action {
  type: string;
  path?: string;
  command?: string;
  id: string;
}

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

const ActivityStep: React.FC<{ action: Action; isLast: boolean; isStreaming: boolean }> = ({ action, isLast, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (action.type) {
      case 'patch_file': return <PenTool size={14} />;
      case 'write_file': return <FileCode size={14} />;
      case 'command': return <Terminal size={14} />;
      case 'read_file': return <Search size={14} />;
      case 'tool_call': return <Brain size={14} className="text-primary" />;
      default: return <Brain size={14} />;
    }
  };

  const getLabel = () => {
    switch (action.type) {
      case 'patch_file': return `Editando ${action.path}...`;
      case 'write_file': return `Criando ${action.path}...`;
      case 'command': return `Executando comando ${action.command?.split(' ')[0]}...`;
      case 'read_file': return `Lendo ${action.path}...`;
      case 'tool_call': {
        const cmd = action.command || '';
        if (cmd.includes('getCommitsByPeriod')) return 'Consultando commits recentes...';
        if (cmd.includes('getLocalCommitDetails')) return 'Analisando os arquivos alterados...';
        if (cmd.includes('auditCommitCode')) return 'Realizando auditoria de qualidade do código...';
        if (cmd.includes('sendDiscordMessage')) return 'Enviando dados para o Discord...';
        if (cmd.includes('getDiscordMentionId')) return 'Resolvendo usuário do Discord...';
        if (cmd.includes('getBitbucketCommits')) return 'Buscando commits do Bitbucket...';
        if (cmd.includes('getBitbucketPRs')) return 'Buscando Pull Requests do Bitbucket...';
        return `Executando processo: ${cmd}...`;
      }
      default: return `Ação: ${action.type}`;
    }
  };

  const isCurrent = isStreaming && isLast;

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center gap-3 py-1.5 cursor-pointer group hover:text-text-main transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`flex items-center justify-center w-5 h-5 ${isCurrent ? 'text-primary' : 'text-text-muted/40'}`}>
          {isCurrent ? (
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             >
               <Brain size={14} />
             </motion.div>
          ) : getIcon()}
        </div>
        
        <span className={`text-[13px] font-medium flex-1 ${isCurrent ? 'text-text-main' : 'text-text-muted'}`}>
          {getLabel()}
        </span>

        <ChevronRight 
          size={14} 
          className={`text-text-muted/20 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-8 pb-2 overflow-hidden"
          >
            <div className="text-[11px] text-text-muted/60 font-mono bg-white/[0.02] p-2 rounded-lg border border-white/5">
              {action.path && <div className="truncate">Path: {action.path}</div>}
              {action.command && <div className="break-all">Command: {action.command}</div>}
              <div className="mt-1 text-primary/40 italic">Processo concluído com sucesso.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content, isStreaming }) => {
  const parsed = parseMessageActions(content);
  const actions: Action[] = parsed.map((a: any) => ({
    id: Math.random().toString(36),
    type: a.type,
    path: a.path ? a.path.split(/[\\/]/).pop() : undefined,
    command: a.type === 'command' ? a.content : undefined
  }));

  // Capturar chamadas de ferramentas baseadas no padrão JSON de tool_call
  const toolCallRegex = /\{\s*"type"\s*:\s*"tool_call"\s*,\s*"name"\s*:\s*"([^"]+)"/g;
  let toolMatch;
  while ((toolMatch = toolCallRegex.exec(content)) !== null) {
    const toolName = toolMatch[1];
    
    // Evita duplicar a mesma chamada de ferramenta na lista de passos
    if (!actions.some(a => a.type === 'tool_call' && a.command === toolName)) {
      actions.push({
        id: Math.random().toString(36),
        type: 'tool_call',
        command: toolName
      });
    }
  }

  if (actions.length === 0) {
     if (isStreaming) {
        return (
          <div className="flex items-center gap-3 py-2 text-text-muted/60 italic text-[13px]">
             <motion.div 
               animate={{ opacity: [0.4, 1, 0.4] }} 
               transition={{ duration: 1.5, repeat: Infinity }}
             >
                <Brain size={14} className="animate-pulse text-primary" />
             </motion.div>
             Pensando...
          </div>
        );
     }
     return null;
  }

  return (
    <div className="flex flex-col space-y-1 mt-2 mb-4">
      {actions.map((action, i) => (
        <ActivityStep 
          key={action.id || i} 
          action={action} 
          isLast={i === actions.length - 1}
          isStreaming={!!isStreaming}
        />
      ))}
    </div>
  );
};


