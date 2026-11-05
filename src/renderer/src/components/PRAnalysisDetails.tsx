import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, ExternalLink, FileCode, RefreshCw, MessageSquare, Check } from 'lucide-react';
import { Theme } from '../config/themes';
import { PRFileTree } from './PRFileTree';
import { PRSummaryHeader } from './PRSummaryHeader';

interface PRAnalysisDetailsProps {
  analysis: any;
  theme: Theme;
  selectedFile: any | null;
  setSelectedFile: (file: any) => void;
  onOpenFile?: (path: string, analysis?: any) => void;
  onPostAIReview?: () => void;
  isPosting?: boolean;
  fullPath: string;
  prId?: number;
}

// Helper para construir a árvore de arquivos com segurança
const buildSafeFileTree = (files: any[]) => {
  try {
    const root: any = { name: 'root', children: {}, files: [] };
    if (!Array.isArray(files)) return root;

    files.forEach(file => {
      if (!file || !file.path) return;
      const parts = file.path.split('/');
      let current = root;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current.children[part]) {
          current.children[part] = { name: part, children: {}, files: [] };
        }
        current = current.children[part];
      }
      current.files.push(file);
    });
    return root;
  } catch (err) {
    console.error('[FileTree Error]', err);
    return { name: 'root', children: {}, files: [] };
  }
};

const splitDiffSafely = (fullDiff: string): Record<string, string> => {
  const fileDiffs: Record<string, string> = {};
  if (!fullDiff) return fileDiffs;

  try {
    const sections = fullDiff.split(/(?=diff --git )/);
    sections.forEach(section => {
      if (!section.trim()) return;
      const lines = section.split('\n');
      const diffLine = lines[0];
      
      const match = diffLine.match(/ b\/(.+)$/);
      if (match) {
        let filePath = match[1].trim();
        filePath = filePath.replace(/^"|"$/g, '').split(' ')[0];
        fileDiffs[filePath] = section;
      }
    });
  } catch (err) {
    console.error('[SplitDiff Error]', err);
  }
  return fileDiffs;
};

export const PRAnalysisDetails: React.FC<PRAnalysisDetailsProps> = ({ 
  analysis, theme, selectedFile, setSelectedFile, onOpenFile, onPostAIReview, isPosting, fullPath, prId
}) => {
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<string | null>(null);
  const [commentPosted, setCommentPosted] = useState(false);

  const fileDiffs = useMemo(() => splitDiffSafely(analysis?.diff), [analysis?.diff]);
  
  const displayFiles = useMemo(() => {
    const files = (analysis && analysis.files && Array.isArray(analysis.files)) ? analysis.files : [];
    if (files.length === 0 && analysis?.diff) {
      const parsed = splitDiffSafely(analysis.diff);
      return Object.keys(parsed).map(path => ({ path, additions: 0, deletions: 0 }));
    }
    return files;
  }, [analysis]);

  const tree = useMemo(() => buildSafeFileTree(displayFiles), [displayFiles]);

  const selectedPath = useMemo(() => {
    if (!selectedFile) return null;
    return typeof selectedFile === 'string' ? selectedFile : selectedFile.path;
  }, [selectedFile]);

  const currentDiff = useMemo(() => {
    if (!selectedPath) return '';
    return fileDiffs[selectedPath] || '';
  }, [selectedPath, fileDiffs]);

  // Limpa análise do arquivo quando seleciona outro arquivo
  useEffect(() => {
    setFileAnalysis(null);
    setCommentPosted(false);
  }, [selectedPath]);

  // Seleção automática do primeiro arquivo se nada estiver selecionado
  useEffect(() => {
    if (displayFiles.length > 0 && !selectedFile) {
      setSelectedFile(displayFiles[0]);
    }
  }, [displayFiles, selectedFile, setSelectedFile]);

  const handleAnalyzeFileWithAI = async () => {
    if (!selectedPath || !currentDiff) return;
    setIsAnalyzingFile(true);
    setCommentPosted(false);
    try {
      const res = await (window as any).api.pipeline.analyzeFileDiff({
        repoPath: fullPath,
        filePath: selectedPath,
        fileDiff: currentDiff
      });
      if (res.success) {
        setFileAnalysis(res.analysis);
      } else {
        console.error('Erro na análise de diff do arquivo:', res.error);
      }
    } catch (err) {
      console.error('Falha ao analisar arquivo com IA:', err);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const handlePostFileComment = async () => {
    if (!prId || !fileAnalysis) return;
    setIsPostingComment(true);
    try {
      const textComment = `🤖 **Análise de IA (wOs) para o arquivo \`${selectedPath}\`**:\n\n${fileAnalysis}`;
      const res = await (window as any).api.pipeline.commentPR({
        repoPath: fullPath,
        prId: prId,
        text: textComment
      });
      if (res.success) {
        setCommentPosted(true);
      } else {
        console.error('Erro ao postar comentário:', res.error);
      }
    } catch (err) {
      console.error('Falha ao postar comentário:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (!analysis) return null;

  return (
    <div className="w-full p-4 space-y-4 animate-fadeIn" style={{ backgroundColor: theme.colors.bgApp }}>
      <PRSummaryHeader 
        analysis={analysis}
        theme={theme}
        onPostAIReview={onPostAIReview}
        isPosting={isPosting}
      />

      <div className="flex h-[600px] rounded-xl border overflow-hidden shadow-2xl transition-all duration-300" style={{ borderColor: theme.colors.borderColor }}>
        {/* Sidebar */}
        <div 
          className="flex-shrink-0 border-r overflow-y-auto custom-scrollbar flex flex-col transition-all duration-300" 
          style={{ 
            width: '280px',
            borderColor: theme.colors.borderColor, 
            backgroundColor: theme.colors.bgPanel,
            zIndex: 10
          }}
        >
          <div className="p-4 border-b flex items-center justify-between sticky top-0 z-20" style={{ borderColor: theme.colors.borderColor, backgroundColor: theme.colors.bgPanel }}>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Estrutura</span>
              <span className="text-[11px] font-bold" style={{ color: theme.colors.textMain }}>Arquivos ({displayFiles.length})</span>
            </div>
          </div>
          <div className="flex-1 py-2 overflow-y-auto no-scrollbar">
            {displayFiles.length > 0 ? (
              <PRFileTree 
                item={tree} 
                depth={0} 
                selectedPath={selectedPath} 
                setSelectedFile={setSelectedFile} 
                theme={theme} 
              />
            ) : (
              <div className="p-8 text-center opacity-30">
                <FileCode size={24} className="mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum arquivo</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Panel (Diff + AI Side Drawer) */}
        <div className="flex-1 flex flex-col bg-[#0d1117]">
          <div className="p-3 border-b flex items-center justify-between shadow-sm z-10" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#161b22' }}>
            <div className="flex items-center gap-3 min-w-0">
               <div className="p-1.5 rounded bg-primary/10">
                 <FileCode size={14} className="text-primary" />
               </div>
               <div className="flex flex-col min-w-0">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Visualizando Diff</span>
                 <span className="text-[11px] font-mono truncate text-slate-200">{selectedPath || 'Selecione um arquivo'}</span>
               </div>
            </div>
            {selectedPath && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleAnalyzeFileWithAI}
                  disabled={isAnalyzingFile || !currentDiff}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-white transition-all text-[10px] font-bold text-primary border border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isAnalyzingFile ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} className="group-hover:scale-110 transition-transform" />}
                  Análise de IA
                </button>
                <button 
                  onClick={() => onOpenFile?.(`${fullPath}/${selectedPath}`, analysis)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary hover:text-white transition-all text-[10px] font-bold text-slate-400 group border border-white/5"
                >
                  <ExternalLink size={12} className="group-hover:scale-110 transition-transform" />
                  Abrir Arquivo
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-auto custom-scrollbar font-mono text-[12px] bg-[#0d1117] select-text">
              {currentDiff ? (
                <div className="min-w-full inline-block py-4">
                  {currentDiff.split('\n').map((line, i) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isRem = line.startsWith('-') && !line.startsWith('---');
                    const isHdr = line.startsWith('@@ ') || line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ');
                    
                    return (
                      <div key={i} className="flex group relative" 
                           style={{ 
                             backgroundColor: isAdd ? 'rgba(46, 160, 67, 0.12)' : isRem ? 'rgba(248, 81, 73, 0.12)' : isHdr ? 'rgba(56, 139, 253, 0.08)' : 'transparent',
                             borderLeft: isAdd ? '3px solid #2ea043' : isRem ? '3px solid #f85149' : '3px solid transparent'
                           }}>
                        <div className="w-14 flex-shrink-0 text-right pr-4 opacity-20 select-none border-r border-white/5 py-0.5 text-[10px] text-[#8b949e]">
                          {i + 1}
                        </div>
                        <div className="px-5 py-0.5 whitespace-pre flex-1" style={{ color: isAdd ? '#7ee787' : isRem ? '#ffa198' : isHdr ? '#79c0ff' : '#c9d1d9' }}>
                          {line}
                        </div>
                        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5 animate-pulse">
                    <FileCode size={40} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">Pronto para Inspeção</p>
                    <p className="text-[10px] opacity-60 mt-1">Selecione um arquivo para ver o diff.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side AI Drawer */}
            {fileAnalysis && (
              <div className="w-96 border-l flex flex-col bg-[#161b22]/95 backdrop-blur-md animate-slideInRight" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Análise de IA do Arquivo</span>
                  </div>
                  <button 
                    onClick={() => { setFileAnalysis(null); setCommentPosted(false); }}
                    className="text-[9px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-tighter"
                  >
                    Fechar
                  </button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed text-slate-300 font-sans whitespace-pre-wrap select-text">
                  {fileAnalysis}
                </div>
                
                {prId && (
                  <div className="p-3 border-t bg-[#0d1117]/50 flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    {commentPosted ? (
                      <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase animate-fadeIn">
                        <Check size={12} />
                        Comentário Postado no Bitbucket!
                      </div>
                    ) : (
                      <button
                        onClick={handlePostFileComment}
                        disabled={isPostingComment}
                        className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary/95 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPostingComment ? <RefreshCw size={12} className="animate-spin" /> : <MessageSquare size={12} />}
                        Postar Comentário no Bitbucket
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
