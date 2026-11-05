import React from 'react';
import { FileText, Eye } from 'lucide-react';

interface MarkdownPreviewPanelProps {
  title: string;
  markdown: string;
  theme: any;
}

export const MarkdownPreviewPanel: React.FC<MarkdownPreviewPanelProps> = ({
  title,
  markdown,
  theme
}) => {
  // Parser markdown simples para renderizar cabeçalhos, listas e blocos de código de forma bonita
  const renderMarkdown = (text: string) => {
    if (!text) return <p className="italic opacity-50">Nenhum conteúdo gerado ainda.</p>;

    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Blocos de código ```
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const content = codeContent.join('\n');
          codeContent = [];
          return (
            <pre
              key={idx}
              className="p-4 rounded-xl font-mono text-[11px] overflow-x-auto my-3 border bg-slate-950 text-slate-200"
              style={{ borderColor: theme.colors.borderColor }}
            >
              <code>{content}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      const trimmed = line.trim();

      // Títulos #, ##, ###
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-lg font-black uppercase tracking-tight italic mt-5 mb-3 text-primary">
            {trimmed.substring(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-sm font-black uppercase tracking-wider mt-4 mb-2 text-primary/80 border-b pb-1" style={{ borderColor: theme.colors.borderColor }}>
            {trimmed.substring(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-xs font-bold uppercase tracking-wide mt-3 mb-1 text-text-main/90">
            {trimmed.substring(4)}
          </h3>
        );
      }

      // Linhas divisórias ---
      if (trimmed === '---') {
        return <hr key={idx} className="my-4 border-t" style={{ borderColor: theme.colors.borderColor }} />;
      }

      // Listas - ou * ou +
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ')) {
        return (
          <li key={idx} className="text-[11px] ml-4 list-disc leading-relaxed my-1" style={{ color: theme.colors.textMain }}>
            {trimmed.substring(2)}
          </li>
        );
      }

      // Linhas em branco
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }

      // Parágrafo padrão
      return (
        <p key={idx} className="text-[11px] leading-relaxed my-1.5" style={{ color: theme.colors.textMain }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div
      className="flex flex-col h-full border rounded-3xl overflow-hidden shadow-xl"
      style={{
        backgroundColor: theme.colors.bgPanel,
        borderColor: theme.colors.borderColor
      }}
    >
      {/* Header do Preview */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between bg-black/5 dark:bg-white/[0.01]"
        style={{ borderColor: theme.colors.borderColor }}
      >
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>
            Preview: {title}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-60">
          <Eye size={12} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Documento Autogerado</span>
        </div>
      </div>

      {/* Conteúdo Markdown Renderizado */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-1 font-sans selection:bg-primary/20">
        {renderMarkdown(markdown)}
      </div>
    </div>
  );
};
