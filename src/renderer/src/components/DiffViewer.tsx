import React from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  filename?: string;
  path?: string;
  oldCode: string;
  newCode: string;
  onAccept?: () => void;
  onReject?: () => void;
  showLineActions?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ 
  filename, 
  path, 
  oldCode, 
  newCode, 
  onAccept, 
  onReject,
  showLineActions = false
}) => {
  // Proteção contra conteúdo vazio
  if (!newCode && !oldCode) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-text-muted/20 italic bg-bg-panel rounded-2xl border border-border">
        <span className="text-[10px] uppercase tracking-widest font-black">Nenhuma alteração detectada</span>
      </div>
    );
  }

  // Se newCode já parece um diff formatado, não calculamos o diff novamente
  const isRawDiff = typeof newCode === 'string' && (
    newCode.startsWith('diff --git') || 
    newCode.startsWith('diff --no-index') || 
    newCode.includes('@@ -') || 
    newCode.startsWith('--- ') || 
    newCode.startsWith('+++ ')
  );

  const diff = isRawDiff 
    ? newCode.split('\n').filter(l => l.length > 0 || l === '').map(line => ({
        value: line + '\n',
        added: line.startsWith('+') && !line.startsWith('+++'),
        removed: line.startsWith('-') && !line.startsWith('---'),
        header: line.startsWith('diff') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@') || line.startsWith('index ')
      }))
    : Diff.diffLines(oldCode || '', newCode || '');
  
  // Calcular estatísticas
  let addedCount = 0;
  let removedCount = 0;
  diff.forEach(part => {
    if (part.added) addedCount += (isRawDiff ? 1 : part.value.split('\n').filter(l => l !== '').length);
    if (part.removed) removedCount += (isRawDiff ? 1 : part.value.split('\n').filter(l => l !== '').length);
  });

  let oldLine = 1;
  let newLine = 1;

  return (
    <div className="bg-bg-panel border border-border/40 rounded-2xl overflow-hidden font-mono text-[11px] shadow-2xl">
      {/* Header do Diff */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d0f13] border-b border-border/40">
        <div className="flex items-center gap-3">
          <span className="text-text-main/80 font-bold">{filename || 'Arquivo'}</span>
          <span className="text-text-muted/40 text-[9px] truncate max-w-[200px]">{path || ''}</span>
        </div>
        <div className="flex items-center gap-2 font-black">
          <span className="text-emerald-500">+{addedCount}</span>
          <span className="text-red-500">-{removedCount}</span>
        </div>
      </div>

      <div className="flex flex-col max-h-[350px] overflow-y-auto no-scrollbar">
        {diff.map((part, index) => {
          // No modo isRawDiff, cada part já é uma linha individual tratada
          // No modo normal (diffLines), part.value pode ter múltiplas linhas
          const lines = part.value.split('\n');
          
          // Limpeza: remove a última string vazia se o bloco termina em \n
          if (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
          }

          return lines.map((line, lineIndex) => {
            const isAdded = (part as any).added;
            const isRemoved = (part as any).removed;
            const isHeader = (part as any).header;
            
            const bgColor = isAdded ? 'bg-[#10b981]/10' : isRemoved ? 'bg-[#ef4444]/10' : isHeader ? 'bg-blue-500/5' : '';
            const textColor = isHeader 
              ? 'text-blue-400/80' 
              : isAdded 
                ? 'text-[#34d399]' 
                : isRemoved 
                  ? 'text-[#f87171]' 
                  : 'text-text-muted/80';
            const numColor = 'text-text-muted/20';

            // Lógica de numeração de linha
            let currentOld: string | number = '';
            let currentNew: string | number = '';

            if (!isHeader) {
              if (isAdded) {
                currentNew = newLine++;
              } else if (isRemoved) {
                currentOld = oldLine++;
              } else {
                currentOld = oldLine++;
                currentNew = newLine++;
              }
            }

            return (
              <div 
                key={`${index}-${lineIndex}`} 
                className={`flex group ${bgColor} hover:bg-white/[0.02] transition-colors cursor-default`}
              >
                {/* Colunas de Números de Linha */}
                <div className={`w-10 flex-shrink-0 text-right pr-2 py-0.5 select-none ${numColor} border-r border-white/5`}>
                  {currentOld}
                </div>
                <div className={`w-10 flex-shrink-0 text-right pr-2 py-0.5 select-none ${numColor} border-r border-white/5`}>
                  {currentNew}
                </div>

                {/* Conteúdo do Código */}
                <div className="flex-1 px-4 py-0.5 relative flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-40 ${textColor}`}>
                      {isAdded ? '+' : isRemoved ? '-' : ''}
                    </span>
                    <span className={`${textColor} whitespace-pre-wrap break-all pl-2 ${isHeader ? 'font-bold' : ''}`}>
                      {isRawDiff ? (isHeader ? line : line.replace(/^[+-]/, '')) : line}
                    </span>
                  </div>

                  {showLineActions && (isAdded || isRemoved) && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-bg-panel/80 rounded-lg border border-white/10 p-1 shadow-xl">
                       <button 
                         onClick={(e) => { e.stopPropagation(); onReject?.(); }}
                         className="px-2 py-1 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                       >
                         Reject
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); onAccept?.(); }}
                         className="px-2 py-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-500/10 rounded transition-all"
                       >
                         Accept
                       </button>
                    </div>
                  )}
                </div>
              </div>
            )
          });
        })}
      </div>
    </div>
  );
};

