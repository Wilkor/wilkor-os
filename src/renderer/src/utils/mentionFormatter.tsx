import React from 'react';

/**
 * Utilitários para formatação e estilização de menções (@Agente, @Usuário) 
 * e comandos (/Comando) em inputs e visualizações de chat.
 */

// Lista de agentes conhecidos no wOs para correspondência de cor roxa
const AGENTS_LIST = ['React', 'Nodejs', 'MongoDB', 'Seguranca', 'Segurança', 'wOs', 'Database'];

/**
 * Verifica se o nome da menção (sem o @) corresponde a um Agente Especialista.
 */
export function isAgentMention(name: string): boolean {
  return AGENTS_LIST.includes(name) || /^[A-Z]/.test(name);
}

/**
 * Formata o texto de input em tempo real no overlay do textarea ou input,
 * colorindo menções e comandos.
 */
export function renderFormattedInputText(text: string, isAgentInput: boolean = false): React.ReactNode[] | string {
  if (!text) return '';
  
  // Divide o texto mantendo delimitadores de espaço e pontuação básica
  const parts = text.split(/(\s+)/);
  
  return parts.map((part, index) => {
    // 1. Identificação de Menções (@)
    if (part.startsWith('@') && part.length > 1) {
      const name = part.substring(1).replace(/[,.:;?!=+()\[\]{}'"]/g, '');
      const isAgent = isAgentMention(name);
      
      return (
        <span 
          key={index} 
          className={`inline-block px-1 rounded font-bold border transition-all ${
            isAgent 
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          } ${isAgentInput ? 'text-[11px]' : 'text-[14px]'}`}
        >
          {part}
        </span>
      );
    }
    
    // 2. Identificação de Comandos (/) - apenas para input geral
    if (!isAgentInput && part.startsWith('/') && part.length > 1) {
      return (
        <span 
          key={index} 
          className="inline-block px-1 rounded text-[14px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        >
          {part}
        </span>
      );
    }
    
    // 3. Texto comum
    return (
      <span key={index} className="text-text-main/90">
        {part}
      </span>
    );
  });
}

/**
 * Renderiza o texto do usuário na transcrição do chat com as menções coloridas.
 */
export function renderTextWithMentions(text: string): React.ReactNode[] | string {
  if (!text) return '';
  
  const parts = text.split(/(\s+)/);
  
  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      const name = part.substring(1).replace(/[,.:;?!=+()\[\]{}'"]/g, '');
      const isAgent = isAgentMention(name);
      
      return (
        <span 
          key={index} 
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-bold border transition-all my-0.5 align-middle select-text ${
            isAgent 
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}
        >
          {isAgent ? '🤖' : '👤'} {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Pré-processa o Markdown convertendo menções livres em links Markdown especiais
 * para serem interceptados pelo componente de Markdown.
 */
export function preprocessMentions(content: string): string {
  if (!content) return '';
  
  // Captura menções livres que não estejam em links existentes [ex](url)
  return content.replace(/(?<!\[)@([a-zA-Z0-9_\u00C0-\u00FF-]+)/g, (_match, name) => {
    const isAgent = isAgentMention(name);
    const type = isAgent ? 'agent' : 'discord';
    return `[@${name}](mention://${type}/${name})`;
  });
}
