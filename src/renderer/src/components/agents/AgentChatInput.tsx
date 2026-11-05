import React, { useState, useEffect, useRef } from 'react';
import { Send, AtSign } from 'lucide-react';
import { IAgent } from '../../../../shared/types';

interface AgentChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  activeAgents: IAgent[];
  placeholder?: string;
}

export const AgentChatInput: React.FC<AgentChatInputProps> = ({
  value,
  onChange,
  onSend,
  activeAgents,
  placeholder = "Digite para intervir na discussão dos agentes..."
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownIndex, setDropdownIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredAgents = activeAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtOffset = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtOffset !== -1) {
      const isStartOfWord = lastAtOffset === 0 || textBeforeCursor[lastAtOffset - 1] === ' ';
      const textAfterAt = textBeforeCursor.slice(lastAtOffset + 1);
      
      if (isStartOfWord && !textAfterAt.includes(' ')) {
        setShowDropdown(true);
        setSearchQuery(textAfterAt);
        setMentionStartIndex(lastAtOffset);
        setDropdownIndex(0);
        return;
      }
    }
    
    setShowDropdown(false);
  };

  const selectAgent = (agent: IAgent) => {
    if (mentionStartIndex === -1 || !inputRef.current) return;
    
    const text = value;
    const cursorPosition = inputRef.current.selectionStart || 0;
    const tag = `@${agent.name.replace(/\s+/g, '')}`;
    const beforeMention = text.slice(0, mentionStartIndex);
    const afterCursor = text.slice(cursorPosition);
    
    const newValue = `${beforeMention}${tag} ${afterCursor}`;
    onChange(newValue);
    setShowDropdown(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeMention.length + tag.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setDropdownIndex(prev => (prev + 1) % filteredAgents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setDropdownIndex(prev => (prev - 1 + filteredAgents.length) % filteredAgents.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectAgent(filteredAgents[dropdownIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
      }
    } else if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/[0.04] bg-[#090a0d]/90 flex gap-3 relative">
      {showDropdown && filteredAgents.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-4 mb-2 w-64 max-h-48 overflow-y-auto bg-black/80 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 p-1.5 animate-fade-in"
        >
          <div className="px-2 py-1 text-[8px] font-black uppercase tracking-wider text-text-muted/40 mb-1 border-b border-white/[0.04] flex items-center gap-1">
            <AtSign size={8} /> Mencionar Agente
          </div>
          {filteredAgents.map((agent, index) => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                index === dropdownIndex
                  ? 'bg-primary/20 text-text-main border border-primary/20'
                  : 'text-text-muted hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <span className="text-sm select-none shrink-0">{agent.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[10px] text-text-main leading-tight line-clamp-1">{agent.name}</p>
                <p className="text-[8px] text-text-muted/65 truncate">{agent.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input de Envio Humano */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-colors"
      />

      <button
        onClick={onSend}
        className="p-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl shadow-lg shadow-primary/20 transition-all shrink-0"
      >
        <Send size={14} />
      </button>
    </div>
  );
};
