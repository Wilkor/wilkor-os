import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CommitDiffLink } from './CommitDiffLink';
import { CodeBlock } from './CodeBlock';
import { preprocessMentions } from '../../utils/mentionFormatter';
import { DocumentPreview } from './DocumentPreview';

interface MarkdownProps {
  content: string;
}

const ListNestingContext = React.createContext(0);

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const processedContent = useMemo(() => {
    return preprocessMentions(content);
  }, [content]);

  const components = useMemo(() => ({
    code: CodeBlock,
    p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-relaxed text-text-main/90 font-medium">{children}</p>,
    ul: ({ children }: any) => {
      const depth = React.useContext(ListNestingContext);
      return (
        <ListNestingContext.Provider value={depth + 1}>
          <ul className={`list-none pl-1 mb-4 space-y-2 text-text-main/90 ${depth > 0 ? 'pl-4 border-l border-border bg-black/[0.02] dark:bg-white/[0.02] py-2 pr-3 rounded-r-2xl my-2 mt-0' : ''}`}>
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { isList: true, listType: 'ul', depth: depth + 1 });
              }
              return child;
            })}
          </ul>
        </ListNestingContext.Provider>
      );
    },
    ol: ({ children }: any) => {
      const depth = React.useContext(ListNestingContext);
      let liIndex = 0;
      const validChildren = React.Children.toArray(children).filter(React.isValidElement);
      const totalItems = validChildren.length;

      return (
        <ListNestingContext.Provider value={depth + 1}>
          <ol className="list-none pl-1 mb-4 space-y-4 text-text-main/90">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                liIndex++;
                return React.cloneElement(child as React.ReactElement<any>, { 
                  isList: true, 
                  listType: 'ol', 
                  index: liIndex, 
                  depth: depth + 1,
                  isLast: liIndex === totalItems
                });
              }
              return child;
            })}
          </ol>
        </ListNestingContext.Provider>
      );
    },
    li: ({ children, isList, listType, index, depth, isLast, checked }: any) => {
      const currentDepth = depth || React.useContext(ListNestingContext);

      // Detecta se é uma tarefa
      let textContent = '';
      React.Children.forEach(children, (c) => {
        if (typeof c === 'string') textContent += c;
        else if (c && typeof c === 'object' && (c as any).props && typeof (c as any).props.children === 'string') {
          textContent += (c as any).props.children;
        }
      });

      const hasInProgressMarker = textContent.trim().startsWith('[/]') || textContent.includes('[/]') || textContent.toLowerCase().includes('(in progress)') || textContent.toLowerCase().includes('(em progresso)');
      const isTask = (checked !== null && checked !== undefined) || hasInProgressMarker;

      if (isTask) {
        const isDone = checked === true;
        const isInProgress = !isDone && (hasInProgressMarker || textContent.includes('[/]'));

        // Limpar o checkbox original gerado pelo GFM e marcadores [/]
        const cleanChildren = React.Children.map(children, (child) => {
          if (React.isValidElement(child) && (child.type === 'input' || (child.props as any)?.type === 'checkbox')) {
            return null;
          }
          if (typeof child === 'string') {
            let s = child;
            if (s.trim().startsWith('[/]')) {
              s = s.replace(/^\s*\[\/\]\s*/, '');
            }
            if (s.trim() === '[/]') return null;
            return s;
          }
          return child;
        }).filter(Boolean);

        return (
          <div className={`flex items-start gap-3 p-3 rounded-xl border my-2 transition-all duration-300 ${
            isDone 
              ? 'bg-emerald-500/[0.02] border-emerald-500/10 text-text-muted/70' 
              : isInProgress 
                ? 'bg-blue-500/[0.02] border-blue-500/10 text-text-main'
                : 'bg-white/[0.01] border-white/5 text-text-main'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              {isDone ? (
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-fade-in">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : isInProgress ? (
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-400">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/5 border border-white/10 text-text-muted hover:border-primary/40 hover:bg-primary/5 transition-all">
                  {/* Círculo vazio/Checkbox vazio */}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <span className={`text-[13px] font-semibold leading-relaxed ${isDone ? 'line-through text-text-muted/60' : ''}`}>
                {cleanChildren}
              </span>
            </div>

            <div className="flex-shrink-0">
              {isDone ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Done
                </span>
              ) : isInProgress ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider animate-pulse">
                  In Progress
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Pending
                </span>
              )}
            </div>
          </div>
        );
      }

      if (!isList) {
        return <li className="text-[13px] leading-relaxed mb-1.5 font-medium">{children}</li>;
      }
      
      if (listType === 'ol') {
        return (
          <li className="flex gap-4 text-[13px] leading-relaxed items-start group mb-4 relative">
            {!isLast && <div className="absolute left-3 top-7 bottom-[-24px] w-[1.5px] bg-border/40 pointer-events-none" />}
            <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold font-mono shadow-sm group-hover:bg-primary/20 transition-all mt-0.5 select-none z-10">
              {index}
            </div>
            <div className="flex-1 min-w-0 font-medium pt-0.5">
              {children}
            </div>
          </li>
        );
      }
      
      if (currentDepth > 1) {
        return (
          <li className="text-[12px] leading-relaxed text-text-muted font-medium mb-1 pl-2 border-l border-border/40 hover:border-primary/40 transition-colors">
            {children}
          </li>
        );
      }
      
      return (
        <li className="flex gap-2.5 text-[13px] leading-relaxed items-start group mb-1.5">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary border border-primary/20 transition-all mt-2" />
          <div className="flex-1 min-w-0 font-medium">{children}</div>
        </li>
      );
    },
    h1: ({ children }: any) => (
      <h1 className="text-xl font-extrabold mb-6 mt-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 tracking-tight pb-1 border-b border-white/5">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold mb-4 mt-6 text-text-main/95 tracking-tight pb-0.5 border-b border-white/[0.03]">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => <h3 className="text-md font-semibold mb-3 mt-5 text-text-main/90">{children}</h3>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary/55 pl-4 py-3.5 my-6 italic bg-primary/[0.02] rounded-r-2xl text-text-main/70 border-dashed">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-6 rounded-2xl bg-white/[0.01] border border-white/5 shadow-inner">
        <table className="w-full text-left text-[12px] border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }: any) => <th className="p-3.5 bg-white/[0.03] font-bold text-primary/80 uppercase tracking-wider text-[10px] select-none border-b border-white/5">{children}</th>,
    td: ({ children }: any) => <td className="p-3.5 text-text-main/70 border-b border-white/[0.02]">{children}</td>,
    a: ({ children, href }: any) => {
      const hrefStr = href || '';
      
      // Intercepta documentos do wOs para preview no chat
      if (hrefStr.startsWith('wos-document://')) {
        const filePath = hrefStr.substring('wos-document://'.length);
        const fileName = String(children || '').trim() || filePath.substring(filePath.lastIndexOf('/') + 1);
        return <DocumentPreview filePath={filePath} fileName={fileName} />;
      }

      // Intercepta menções customizadas do wOs
      if (hrefStr.startsWith('mention://')) {
        const isAgent = hrefStr.includes('mention://agent/');
        return (
          <span 
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[11px] font-bold border transition-all my-0.5 align-middle select-text ${
              isAgent 
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}
          >
            {isAgent ? '🤖' : '👤'} {children}
          </span>
        );
      }

      if (hrefStr.startsWith('git-diff://')) {
        const pathPart = hrefStr.substring('git-diff://'.length);
        const slashIdx = pathPart.indexOf('/');
        if (slashIdx > -1) {
          const commitHash = pathPart.substring(0, slashIdx);
          const filePath = pathPart.substring(slashIdx + 1);
          return (
            <CommitDiffLink commitHash={commitHash} filePath={filePath}>
              {children}
            </CommitDiffLink>
          );
        }
      }

      const isCommitHash = typeof children === 'string' && /^[a-f0-9]{7,10}$/i.test(children.trim());
      const isCommitLink = hrefStr.includes('/commits/') || hrefStr.includes('/commit/') || isCommitHash;
      
      if (isCommitLink) {
        let displayText = children;
        if (typeof children === 'string' && (children.toLowerCase().includes('link') || children.toLowerCase().includes('commit'))) {
          const parts = hrefStr.split('/commits/');
          if (parts.length > 1) {
            displayText = parts[1].split('?')[0].substring(0, 7);
          } else {
            const part2 = hrefStr.split('/commit/');
            if (part2.length > 1) {
              displayText = part2[1].split('?')[0].substring(0, 7);
            }
          }
        }

        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/30 rounded-xl text-primary font-mono text-[12px] font-bold transition-all shadow-sm active:scale-95 my-0.5 align-middle hover:scale-[1.02]"
          >
            <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="3" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="21" />
            </svg>
            {displayText}
          </a>
        );
      }
      
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors font-bold underline underline-offset-4 decoration-primary/20 hover:decoration-primary/50">
          {children}
        </a>
      );
    },
    hr: () => <hr className="my-8 border-white/5" />
  }), []);

  if (!content) return null;

  return (
    <div className="markdown-container">
      <style>{`
        .markdown-container ul ul, 
        .markdown-container ol ul {
          margin-top: 0 !important;
          margin-bottom: 0.65rem;
          padding-left: 1rem;
          border-left: 1.5px solid var(--border-color);
          background-color: var(--bg-app);
          border-radius: 0 1rem 1rem 0;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          box-shadow: inset 2px 0 8px rgba(0,0,0,0.1);
        }
        .markdown-container ul ul li, 
        .markdown-container ol ul li {
          font-size: 12px !important;
          color: var(--text-muted) !important;
          margin-bottom: 0.35rem !important;
        }
        .markdown-container ul ul li strong, 
        .markdown-container ol ul li strong {
          color: var(--text-main) !important;
          font-weight: 600 !important;
        }
        .markdown-container ul ul li:last-child, 
        .markdown-container ol ul li:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
