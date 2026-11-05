import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = inline || (!match && !String(children).includes('\n'));
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = Array.isArray(children) ? children.join('') : String(children);
    navigator.clipboard.writeText(textToCopy.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isInline) {
    return (
      <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono text-[11px] font-medium" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-8 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 py-3 bg-[#121212]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.3)]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.3)]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.3)]" />
          </div>
          <div className="flex items-center gap-2.5">
            <Terminal size={14} className="text-primary/70" />
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-text-muted/40">
              {match ? match[1] : 'code'}
            </span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/0 hover:bg-white/5 text-text-muted hover:text-primary transition-all active:scale-95 group/copy"
          title="Copiar código"
        >
          {copied ? (
            <div className="flex items-center gap-2 text-primary">
              <span className="text-[10px] font-bold uppercase tracking-wider">Copied</span>
              <Check size={14} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover/copy:opacity-100 transition-opacity">Copy</span>
              <Copy size={14} />
            </div>
          )}
        </button>
      </div>
      <div className="relative">
        <SyntaxHighlighter
          style={oneDark}
          language={match ? match[1] : 'text'}
          PreTag="div"
          className="!m-0 !bg-transparent !p-6 !text-[13px] custom-scrollbar leading-relaxed font-mono"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
};
