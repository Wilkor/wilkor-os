import { useState, useEffect } from 'react';
import { GitBranch, RotateCcw, Send, Download, CheckCircle, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { GitHeader } from './git/GitHeader';
import { SlidingDiffPanel } from './git/SlidingDiffPanel';
import { CloneModal } from './git/CloneModal';
import { GitFileItem } from './git/GitFileItem';
import { CheckoutConflictDialog } from './git/CheckoutConflictDialog';

interface GitStatusFile {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed';
  staged: boolean;
}

interface GitStatus {
  isRepo: boolean;
  branch: string;
  files: GitStatusFile[];
  repoRoot?: string;
}

interface GitPanelProps {
  activeTabPath?: string | null;
  addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ activeTabPath, addToast }) => {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [branches, setBranches] = useState<{ current: string; all: string[] }>({ current: '', all: [] });
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedFileForDiff, setSelectedFileForDiff] = useState<GitStatusFile | null>(null);
  const [roots, setRoots] = useState<string[]>([]);
  const [conflictData, setConflictData] = useState<{ isOpen: boolean; branchName: string; errorMessage: string } | null>(null);

  const refreshStatus = async () => {
    if (window.api?.git) {
      const result = await window.api.git.status();
      setStatus(result);
      if (result.isRepo) {
        const branchData = await window.api.git.getBranches();
        if (branchData.success) setBranches({ current: branchData.current!, all: branchData.all! });
      }
      const workspaceRoots = await window.api.workspace.getRoots();
      setRoots(workspaceRoots);
    }
  };

  const handleSetRepo = async (path: string) => {
    if (window.api?.git) {
      await window.api.git.setRoot(path);
      refreshStatus();
    }
  };

  useEffect(() => {
    refreshStatus();
    const handleUpdate = () => refreshStatus();
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('workspace:updated', handleUpdate);
      window.electron.ipcRenderer.on('agent:fileWritten', handleUpdate);
    }
    const interval = setInterval(refreshStatus, 15000);
    return () => {
      clearInterval(interval);
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeListener('workspace:updated', handleUpdate);
        window.electron.ipcRenderer.removeListener('agent:fileWritten', handleUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeTabPath || !roots.length) return;
    const matchedRoot = roots.find(root => {
      const normalizedRoot = root.replace(/\\/g, '/').toLowerCase();
      const normalizedPath = activeTabPath.replace(/\\/g, '/').toLowerCase();
      return normalizedPath.startsWith(normalizedRoot);
    });
    if (matchedRoot && matchedRoot !== status?.repoRoot) handleSetRepo(matchedRoot);
  }, [activeTabPath, roots]);

  const handleStage = async (path: string) => { await window.api.git.stage(path); refreshStatus(); };
  const handleUnstage = async (path: string) => { await window.api.git.unstage(path); refreshStatus(); };
  const handleStageAll = async () => { await window.api.git.stageAll(); refreshStatus(); };
  const handleUnstageAll = async () => { await window.api.git.unstageAll(); refreshStatus(); };

  const handleCheckout = async (branch: string, options?: { force?: boolean; stash?: boolean }) => {
    if (addToast) addToast(options ? `Resolvendo conflitos e alterando...` : `Alterando branch para "${branch}"...`, 'info');
    const result = await window.api.git.checkout(branch, options);
    if (result.success) {
      if (addToast) addToast(`Branch alterada para "${branch}"! 🌿`, 'success');
      setConflictData(null);
      await refreshStatus();
    } else {
      const errMsg = result.error || 'Erro desconhecido';
      const isLocalChangesConflict = errMsg.includes('local changes to the following files would be overwritten') || 
                                    errMsg.includes('Please commit your changes or stash them');
      if (isLocalChangesConflict && !options) {
        setConflictData({ isOpen: true, branchName: branch, errorMessage: errMsg });
      } else {
        if (addToast) addToast(`Falha ao alterar branch: ${errMsg}`, 'error');
      }
    }
  };

  const handlePush = async () => { setIsPushing(true); await window.api.git.push(); setIsPushing(false); refreshStatus(); };
  const handlePull = async () => { setIsPulling(true); await window.api.git.pull(); setIsPulling(false); refreshStatus(); };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setIsLoading(true);
    const result = await window.api.git.commit(commitMessage);
    if (result.success) { setCommitMessage(''); refreshStatus(); }
    setIsLoading(false);
  };

  const stagedFiles = status?.files.filter(f => f.staged) ?? [];
  const unstagedFiles = status?.files.filter(f => !f.staged) ?? [];

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      {showCloneModal && <CloneModal onClose={() => setShowCloneModal(false)} onSuccess={refreshStatus} />}
      <SlidingDiffPanel file={selectedFileForDiff} isOpen={!!selectedFileForDiff} onClose={() => setSelectedFileForDiff(null)} />

      {conflictData?.isOpen && (
        <CheckoutConflictDialog
          isOpen={conflictData.isOpen}
          branchName={conflictData.branchName}
          errorMessage={conflictData.errorMessage}
          onStash={() => handleCheckout(conflictData.branchName, { stash: true })}
          onForce={() => handleCheckout(conflictData.branchName, { force: true })}
          onCancel={() => setConflictData(null)}
        />
      )}

      {!status?.isRepo ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-24 h-24 rounded-[32px] bg-bg-panel border border-border flex items-center justify-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <GitBranch size={48} strokeWidth={0.5} className="text-text-muted/20 group-hover:text-primary/40 transition-all duration-700 group-hover:scale-110" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-text-muted/40">Source Control</p>
            <p className="text-[10px] text-text-muted/20 max-w-[180px] leading-relaxed font-medium">Nenhum repositório Git detectado nesta pasta de trabalho.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowCloneModal(true)}
            className="flex items-center gap-3 px-8 py-3.5 bg-primary text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,255,170,0.2)]"
          >
            <Download size={16} /> Clone Repositório
          </motion.button>
        </div>
      ) : (
        <>
          <GitHeader
            repoRoot={status.repoRoot}
            roots={roots}
            currentBranch={branches.current}
            allBranches={branches.all}
            isPulling={isPulling}
            isPushing={isPushing}
            onSetRepo={handleSetRepo}
            onCheckout={handleCheckout}
            onPull={handlePull}
            onPush={handlePush}
            onRefresh={refreshStatus}
            addToast={addToast}
          />

          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-6">
            {stagedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/40">Staged</span>
                  <button onClick={handleUnstageAll} className="p-1 px-2 rounded-lg bg-bg-app hover:bg-red-500/10 text-text-muted/40 hover:text-red-400 text-[8px] font-black uppercase transition-all">
                    Unstage All
                  </button>
                </div>
                {stagedFiles.map((file, i) => (
                  <GitFileItem key={i} file={file} onStage={handleStage} onUnstage={handleUnstage} onClick={() => setSelectedFileForDiff(file)} />
                ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted/40">Changes</span>
                <button onClick={handleStageAll} className="p-1 px-2 rounded-lg bg-bg-app hover:bg-primary/10 text-text-muted/40 hover:text-primary text-[8px] font-black uppercase transition-all">
                  Stage All
                </button>
              </div>
              {unstagedFiles.length === 0 && stagedFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-20">
                  <CheckCircle size={24} strokeWidth={1} />
                  <p className="text-[10px] uppercase font-black tracking-widest">Nada pendente</p>
                </div>
              )}
              {unstagedFiles.map((file, i) => (
                <GitFileItem key={i} file={file} onStage={handleStage} onUnstage={handleUnstage} onClick={() => setSelectedFileForDiff(file)} />
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-border bg-bg-panel/10">
            <div className="relative group">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleCommit()}
                placeholder="Descreva suas mudanças... (Ctrl+Enter)"
                className="w-full bg-bg-app border border-border group-focus-within:border-primary/20 rounded-2xl p-4 text-[11px] text-text-main outline-none transition-all resize-none h-20 placeholder:text-text-muted/20 font-medium"
              />
              <div className="absolute top-3 right-3 opacity-20 group-focus-within:opacity-50 transition-opacity">
                <Layers size={14} />
              </div>
            </div>
            
            <button
              onClick={handleCommit}
              disabled={isLoading || !commitMessage.trim() || stagedFiles.length === 0}
              className="w-full mt-3 py-3.5 bg-primary text-text-inverse rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_15px_35px_rgba(0,255,170,0.15)] disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
            >
              {isLoading ? <RotateCcw size={14} className="animate-spin" /> : <Send size={14} />}
              Commit para {branches.current}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
