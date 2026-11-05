import React, { useState, useEffect } from 'react';
import { Archive, FileText, Image as ImageIcon, ExternalLink, Paperclip, RefreshCw, Trash2 } from 'lucide-react';

interface Artifact {
  name: string;
  path: string;
  size: number;
  mtime: number;
  source: 'local_artifacts' | 'workspace';
  type: string;
}

interface ArtifactsPanelProps {
  addToast: (msg: string, type: any) => void;
  onAttachFile?: (file: { name: string; path: string; type: string }) => void;
  onOpenFile?: (path: string) => void;
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ addToast, onAttachFile, onOpenFile }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);
  const [deleteTimeoutId, setDeleteTimeoutId] = useState<any>(null);

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      if (window.api?.workspace?.getArtifacts) {
        const res = await window.api.workspace.getArtifacts();
        if (res.success) {
          setArtifacts(res.artifacts || []);
        } else {
          addToast(res.error || 'Erro ao carregar artefatos', 'error');
        }
      }
    } catch (e: any) {
      addToast(e.message || 'Erro de comunicação', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();

    // Escutar por atualizações do workspace
    const handler = () => {
      fetchArtifacts();
    };
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('workspace:updated', handler);
      return () => {
        window.electron.ipcRenderer.removeListener('workspace:updated', handler);
      };
    }
    return undefined;
  }, []);

  // Lazy loading de miniaturas de imagens
  useEffect(() => {
    artifacts.forEach(async (art) => {
      const isImage = art.type === '.png' || art.type === '.jpg' || art.type === '.jpeg';
      if (isImage && !thumbnails[art.path]) {
        try {
          if (window.api?.workspace?.getFileThumbnail) {
            const res = await window.api.workspace.getFileThumbnail(art.path);
            if (res.success && res.thumbnail) {
              const thumb = res.thumbnail;
              setThumbnails((prev) => ({ ...prev, [art.path]: thumb }));
            }
          }
        } catch (err) {
          console.error('Erro ao obter miniatura:', err);
        }
      }
    });
  }, [artifacts]);

  // Limpar timeout no desmonte
  useEffect(() => {
    return () => {
      if (deleteTimeoutId) clearTimeout(deleteTimeoutId);
    };
  }, [deleteTimeoutId]);

  const handleDragStart = (e: React.DragEvent, artifact: Artifact) => {
    e.dataTransfer.setData('application/wos-file-path', artifact.path);
    e.dataTransfer.effectAllowed = 'copy';
    addToast(`Arrastando ${artifact.name}...`, 'info');
  };

  const handleOpenFile = async (path: string) => {
    try {
      if (onOpenFile) {
        onOpenFile(path);
        return;
      }
      if (window.api?.workspace?.openFileInSystem) {
        const res = await window.api.workspace.openFileInSystem(path);
        if (!res.success) {
          addToast(res.error || 'Erro ao abrir arquivo', 'error');
        }
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();

    if (confirmDeletePath === path) {
      // Segunda etapa: deletar fisicamente
      try {
        if (window.api?.workspace?.deleteArtifact) {
          const res = await window.api.workspace.deleteArtifact(path);
          if (res.success) {
            addToast('Artefato excluído com sucesso', 'success');
            setArtifacts((prev) => prev.filter((a) => a.path !== path));
            setConfirmDeletePath(null);
            if (deleteTimeoutId) clearTimeout(deleteTimeoutId);
          } else {
            addToast(res.error || 'Erro ao excluir artefato', 'error');
          }
        }
      } catch (err: any) {
        addToast(err.message || 'Erro ao excluir', 'error');
      }
    } else {
      // Primeira etapa: armar confirmação
      setConfirmDeletePath(path);
      if (deleteTimeoutId) clearTimeout(deleteTimeoutId);

      const timeout = setTimeout(() => {
        setConfirmDeletePath(null);
      }, 3000);
      setDeleteTimeoutId(timeout);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (mtimeMs: number) => {
    try {
      const date = new Date(mtimeMs);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).replace('.', '');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] overflow-hidden font-sans">
      <div className="px-4 py-2 flex items-center justify-between border-b border-[var(--border-color)] shrink-0">
        <div className="flex items-center gap-2">
          <Archive size={14} className="text-[var(--primary)]" />
          <span className="text-[11px] font-bold uppercase tracking-tight text-[var(--text-muted)]">
            Artefatos Gerados
          </span>
        </div>
        <button
          onClick={fetchArtifacts}
          disabled={loading}
          className="p-1 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors active:scale-95"
          title="Atualizar lista"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-[11px] text-[var(--text-muted)] opacity-55">
            <Archive size={28} className="mb-2 opacity-30 text-[var(--primary)]" />
            <p>Nenhum artefato gerado ainda.</p>
            <p className="text-[9px] mt-1">Imagens e PDFs criados aparecerão aqui.</p>
          </div>
        ) : (
          artifacts.map((art, idx) => {
            const isImage = art.type === '.png' || art.type === '.jpg' || art.type === '.jpeg';
            const isConfirming = confirmDeletePath === art.path;
            
            return (
              <div
                key={art.path + idx}
                draggable
                onDragStart={(e) => handleDragStart(e, art)}
                onClick={() => handleOpenFile(art.path)}
                className="group relative flex flex-col p-3 bg-white/[0.02] border border-white/[0.04] hover:border-[var(--primary)]/30 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-white/[0.04] transition-all duration-300"
              >
                {/* Botão de exclusão (Lixeira com confirmação inline) */}
                <button
                  onClick={(e) => handleDeleteClick(e, art.path)}
                  className={`absolute top-3 right-3 p-1.5 rounded-xl border transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 
                    ${isConfirming
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse scale-105 opacity-100'
                      : 'bg-white/[0.02] border-white/[0.03] text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                    }`}
                  title={isConfirming ? 'Clique novamente para confirmar exclusão' : 'Excluir arquivo'}
                >
                  {isConfirming ? (
                    <span className="text-[8px] font-extrabold px-1 uppercase tracking-wider">Deletar?</span>
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  {/* Ícone personalizado ou Miniatura Real */}
                  {isImage ? (
                    thumbnails[art.path] ? (
                      <img
                        src={thumbnails[art.path]}
                        alt={art.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-all duration-300 shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 text-purple-400 rounded-xl shrink-0">
                        <ImageIcon size={18} />
                      </div>
                    )
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl shrink-0">
                      <FileText size={18} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="text-xs font-bold text-[var(--text-main)] truncate select-none group-hover:text-[var(--primary)] transition-colors" title={art.name}>
                      {art.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] font-semibold text-[var(--text-muted)]">
                      <span>{formatSize(art.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{art.source === 'workspace' ? 'Workspace' : 'wOs'}</span>
                      <span>•</span>
                      <span className="text-[var(--primary)]/70">{formatDate(art.mtime)}</span>
                    </div>
                  </div>
                </div>

                {/* Overlay de ações rápidas */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFile(art.path);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/[0.03] transition-all"
                  >
                    <ExternalLink size={10} />
                    Abrir
                  </button>
                  {onAttachFile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAttachFile({ name: art.name, path: art.path, type: isImage ? 'image/png' : 'application/pdf' });
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[9px] font-bold uppercase tracking-wider text-black bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-xl transition-all"
                    >
                      <Paperclip size={10} />
                      Anexar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
