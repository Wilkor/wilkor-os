import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Image as ImageIcon, 
  ExternalLink, 
  FolderOpen,
  Loader,
  AlertCircle
} from 'lucide-react';

interface DocumentPreviewProps {
  filePath: string;
  fileName: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ filePath, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');

  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        if (window.api?.workspace?.getArtifactContent) {
          const res = await window.api.workspace.getArtifactContent(filePath);
          if (res.success) {
            setData(res);
            if (res.type === 'xlsx' && res.sheets) {
              const sheetNames = Object.keys(res.sheets);
              if (sheetNames.length > 0) {
                setActiveSheet(sheetNames[0]);
              }
            }
          } else {
            setError(res.error || 'Erro ao carregar preview do documento');
          }
        } else {
          setError('API de acesso a arquivos não disponível no wOs.');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar documento');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [filePath]);

  const handleOpenFile = async () => {
    try {
      if (window.api?.workspace?.openFileInSystem) {
        await window.api.workspace.openFileInSystem(filePath);
      }
    } catch (err) {
      console.error('Erro ao abrir arquivo:', err);
    }
  };

  const handleRevealFolder = async () => {
    try {
      if (window.api?.fs?.reveal) {
        await window.api.fs.reveal(filePath);
      }
    } catch (err) {
      console.error('Erro ao revelar arquivo:', err);
    }
  };

  // Seletor de Ícones e Cores Premium com base no formato
  const getFormatStyle = () => {
    switch (extension) {
      case '.xlsx':
      case '.xls':
        return { icon: <FileSpreadsheet className="text-emerald-400" size={16} />, bg: 'border-emerald-500/20 bg-emerald-500/[0.02]', badge: 'Excel', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case '.docx':
      case '.doc':
        return { icon: <FileText className="text-blue-400" size={16} />, bg: 'border-blue-500/20 bg-blue-500/[0.02]', badge: 'Word', badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case '.pdf':
        return { icon: <FileText className="text-red-400" size={16} />, bg: 'border-red-500/20 bg-red-500/[0.02]', badge: 'PDF', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
        return { icon: <ImageIcon className="text-purple-400" size={16} />, bg: 'border-purple-500/20 bg-purple-500/[0.02]', badge: 'Imagem', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case '.html':
      case '.htm':
        return { icon: <FileCode className="text-orange-400" size={16} />, bg: 'border-orange-500/20 bg-orange-500/[0.02]', badge: 'HTML', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      default:
        return { icon: <FileText className="text-slate-400" size={16} />, bg: 'border-slate-500/20 bg-slate-500/[0.02]', badge: 'Texto', badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    }
  };

  const style = getFormatStyle();

  return (
    <div className={`my-4 border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary/30 max-w-full ${style.bg}`}>
      {/* Header Premium do Documento */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.05] flex-wrap gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-xl shrink-0">
            {style.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-text-main truncate" title={fileName}>
              {fileName}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[8px] px-1.5 py-0.5 rounded border font-extrabold uppercase tracking-wider ${style.badgeColor}`}>
                {style.badge}
              </span>
              <span className="text-[9px] text-text-muted font-medium truncate max-w-[150px] md:max-w-xs" title={filePath}>
                {filePath.substring(filePath.indexOf('artifacts')) || filePath}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleOpenFile}
            className="flex items-center gap-1 px-2.5 py-1 bg-primary text-black text-[9px] font-bold uppercase tracking-wider rounded-xl hover:bg-primary/95 transition-all active:scale-95"
          >
            <ExternalLink size={10} />
            Abrir
          </button>
          <button
            onClick={handleRevealFolder}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.03] hover:bg-white/[0.08] text-text-muted hover:text-text-main text-[9px] font-bold uppercase tracking-wider rounded-xl border border-white/[0.05] transition-all active:scale-95"
            title="Revelar na pasta"
          >
            <FolderOpen size={10} />
            Revelar
          </button>
        </div>
      </div>

      {/* Área de Visualização do Preview */}
      <div className="p-4 overflow-x-auto min-h-[80px] max-h-[350px] no-scrollbar">
        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-text-muted font-medium">
            <Loader size={14} className="animate-spin text-primary" />
            Carregando visualização prévia...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 py-4 px-3 bg-red-500/5 border border-red-500/10 rounded-xl text-xs text-red-400 font-medium">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && data && (
          <div className="text-[12px] leading-relaxed text-text-main/90 font-medium">
            {/* XLSX Sheet Viewer */}
            {data.type === 'xlsx' && data.sheets && (
              <div className="space-y-3">
                {/* Abas da Planilha */}
                {Object.keys(data.sheets).length > 1 && (
                  <div className="flex gap-1.5 border-b border-white/[0.05] pb-2 overflow-x-auto no-scrollbar select-none">
                    {Object.keys(data.sheets).map((sheetName) => (
                      <button
                        key={sheetName}
                        onClick={() => setActiveSheet(sheetName)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                          activeSheet === sheetName
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/[0.02] border-white/[0.05] text-text-muted hover:text-text-main hover:bg-white/[0.05]'
                        }`}
                      >
                        {sheetName}
                      </button>
                    ))}
                  </div>
                )}
                {/* Tabela do Sheet Ativo */}
                {activeSheet && data.sheets[activeSheet] && (
                  <div className="overflow-x-auto border border-white/[0.04] rounded-xl bg-black/10">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-white/[0.03] border-b border-white/[0.05] text-[10px] uppercase font-bold text-text-muted tracking-wider">
                          {data.sheets[activeSheet][0]?.map((cell: any, cIdx: number) => (
                            <th key={cIdx} className="p-2 border-r border-white/[0.04] last:border-r-0 select-none min-w-[80px]">
                              {cell !== undefined && cell !== null ? String(cell) : ''}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.sheets[activeSheet].slice(1, 11).map((row: any[], rIdx: number) => (
                          <tr key={rIdx} className="border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                            {row.map((cell: any, cIdx: number) => (
                              <td key={cIdx} className="p-2 border-r border-white/[0.03] last:border-r-0 text-text-main/80 font-mono">
                                {cell !== undefined && cell !== null ? String(cell) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.sheets[activeSheet].length > 11 && (
                      <div className="p-2 text-center text-[10px] text-text-muted font-bold bg-white/[0.01] border-t border-white/[0.04]">
                        Exibindo as primeiras 10 linhas. Clique em "Abrir" para ver todas as {data.sheets[activeSheet].length} linhas.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DOCX Viewer */}
            {data.type === 'docx' && (
              <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-4 shadow-inner max-h-[280px] overflow-y-auto no-scrollbar font-sans text-text-main/80 space-y-3 leading-relaxed">
                {data.content ? (
                  data.content.split('\n').map((para: string, idx: number) => (
                    <p key={idx} className="mb-2 last:mb-0">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="italic text-text-muted">Documento do Word vazio.</p>
                )}
              </div>
            )}

            {/* PDF Viewer */}
            {data.type === 'pdf' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-[10px] text-text-muted">
                  <div>
                    <span className="font-bold text-text-main block mb-0.5">Páginas:</span> 
                    {data.meta?.numpages || '1'}
                  </div>
                  <div>
                    <span className="font-bold text-text-main block mb-0.5">Autor:</span> 
                    {data.meta?.info?.Author || 'Desconhecido'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-text-main block mb-0.5">Criador:</span> 
                    {data.meta?.info?.Creator || 'wOs Ecosystem'}
                  </div>
                </div>
                <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3 max-h-[150px] overflow-y-auto no-scrollbar text-text-muted/80 font-mono text-[10px] italic">
                  {data.content ? data.content.substring(0, 800) + '...' : 'Sem visualização de texto disponível.'}
                </div>
                <div className="text-center py-1">
                  <button 
                    onClick={handleOpenFile}
                    className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold transition-all"
                  >
                    Visualizar PDF Completo
                  </button>
                </div>
              </div>
            )}

            {/* Image Viewer */}
            {data.type === 'image' && data.base64 && (
              <div className="flex justify-center border border-white/[0.03] rounded-xl overflow-hidden bg-black/30">
                <img 
                  src={data.base64} 
                  alt={fileName} 
                  className="max-h-[260px] object-contain hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in"
                  onClick={handleOpenFile}
                />
              </div>
            )}

            {/* Text / Markdown / Code Viewer */}
            {data.type !== 'xlsx' && data.type !== 'docx' && data.type !== 'pdf' && data.type !== 'image' && (
              <pre className="bg-black/30 border border-white/[0.03] rounded-xl p-3.5 font-mono text-[10.5px] text-text-main/80 overflow-auto max-h-[280px] no-scrollbar shadow-inner leading-relaxed">
                <code>{data.content}</code>
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
