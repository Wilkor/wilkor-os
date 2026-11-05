import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Theme } from '../config/themes';
import { computePRQuality } from './PRInsights';
import { PRActionBar } from './PRActionBar';
import { FeedbackDialog } from './FeedbackDialog';
import { ConfirmationDialog } from './ConfirmationDialog';
import { PRCardHeader } from './PRCardHeader';
import { PRDiscordButton } from './PRDiscordButton';
import { PRAnalysisWrapper } from './PRAnalysisWrapper';

interface PRCardProps {
  pr: any;
  index: number;
  theme: Theme;
  onOpenFile?: (path: string, analysis?: any) => void;
  agents: any[];
}

export const PRCard: React.FC<PRCardProps> = ({ pr, index, theme, onOpenFile, agents }) => {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [prStatus, setPrStatus] = useState<string | null>(
    pr.status && ['APPROVED', 'DECLINED', 'MERGED'].includes(pr.status.toUpperCase()) 
      ? pr.status.toUpperCase() 
      : null
  );

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'request-changes' | 'decline' | 'merge' | null;
  }>({
    isOpen: false,
    action: null
  });

  const quality = computePRQuality(pr);
  const qc = {
    text: quality.score > 80 ? '#10b981' : quality.score > 50 ? '#f59e0b' : '#ef4444',
    bg: quality.score > 80 ? 'rgba(16, 185, 129, 0.1)' : quality.score > 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'
  };

  const handleAnalyze = async (e: React.MouseEvent, selectedAgentIds?: string[]) => {
    e.stopPropagation();
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const res = await (window as any).api.pipeline.analyzePR({
        repoPath: pr.fullPath,
        branchName: pr.name,
        destinationBranch: pr.destinationBranch,
        diffUrl: pr.links?.diff?.href,
        diffstatUrl: pr.links?.diffstat?.href,
        prId: pr.id,
        selectedAgentIds
      });
      if (res.analysis) {
        const suggestions = res.analysis.suggestions || [];
        const fullAnalysis = { ...res.analysis, suggestions, files: res.files, diff: res.diff };
        setAnalysis(fullAnalysis);
        if (res.files && res.files.length > 0) {
          setSelectedFile(res.files[0]);
        }
        setExpanded(true);
      }
      if (!res.success && !res.analysis) {
        alert(`Erro na análise: ${res.error}`);
      }
    } catch (err) {
      console.error('Erro na análise:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAction = async (action: 'approve' | 'request-changes' | 'decline' | 'merge') => {
    setActioning(action);
    try {
      const res = await (window as any).api.pipeline.actionPR({
        repoPath: pr.fullPath,
        prId: pr.id,
        action
      });
      if (res.success) {
        setPrStatus(
          action === 'approve' ? 'APPROVED' : 
          action === 'decline' ? 'DECLINED' : 
          action === 'merge' ? 'MERGED' :
          'CHANGES_REQUESTED'
        );
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Ação Concluída!',
          message: `O status do Pull Request foi atualizado para ${action} com sucesso. 🚀`
        });
      } else {
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Erro na Ação',
          message: `Não foi possível completar a ação: ${res.error}`
        });
      }
    } catch (err) {
      console.error('Erro na ação:', err);
    } finally {
      setActioning(null);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      const res = await (window as any).api.pipeline.commentPR({
        repoPath: pr.fullPath,
        prId: pr.id,
        text: comment
      });
      if (res.success) {
        setComment('');
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Comentário Enviado!',
          message: 'Seu comentário foi postado com sucesso no Bitbucket. 💬'
        });
      } else {
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Erro no Comentário',
          message: `Não foi possível enviar seu comentário: ${res.error}`
        });
      }
    } catch (err) {
      console.error('Erro no comentário:', err);
    } finally {
      setSendingComment(false);
    }
  };

  const handlePostAIReview = async () => {
    if (!analysis || !analysis.full_report) return;
    setSendingComment(true);
    try {
      const res = await (window as any).api.pipeline.commentPR({
        repoPath: pr.fullPath,
        prId: pr.id,
        text: analysis.full_report
      });
      if (res.success) {
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'Review Postado!',
          message: 'O relatório do wOs AI Reviewer já está disponível como comentário no Bitbucket. 🚀'
        });
      } else {
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Falha na Postagem',
          message: `Não conseguimos enviar o comentário: ${res.error}`
        });
      }
    } catch (err) {
      console.error('Erro ao postar review:', err);
    } finally {
      setSendingComment(false);
    }
  };

  const triggerActionConfirm = (action: 'approve' | 'request-changes' | 'decline' | 'merge') => {
    setConfirmDialog({
      isOpen: true,
      action
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-xl border shadow-sm transition-all hover:shadow-md relative"
      style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <PRCardHeader
            pr={pr}
            theme={theme}
            imgError={imgError}
            setImgError={setImgError}
          />

          {/* Metrics Area */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pr-4 border-r" style={{ borderColor: theme.colors.borderColor }}>
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold tracking-tight" style={{ color: qc.text }}>{quality.score}</span>
                <span className="text-[8px] font-bold uppercase opacity-40 tracking-wider">QC</span>
              </div>
              <div className="w-1 h-8 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${quality.score}%` }}
                  className="w-full rounded-full"
                  style={{ backgroundColor: qc.text }}
                />
              </div>
            </div>

            <PRDiscordButton
              pr={pr}
              quality={quality}
              setFeedback={setFeedback}
            />

            <PRActionBar
              pr={pr}
              expanded={expanded}
              setExpanded={setExpanded}
              prStatus={prStatus}
              actioning={actioning}
              analyzing={analyzing}
              handleAnalyze={handleAnalyze}
              triggerActionConfirm={triggerActionConfirm}
              comment={comment}
              setComment={setComment}
              sendingComment={sendingComment}
              handleComment={handleComment}
              theme={theme}
              analysis={analysis}
              agents={agents}
            />
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {quality.issues.slice(0, 3).map((issue, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: '#ef444408', color: '#ef4444' }}>
              <AlertTriangle size={9} />
              {issue}
            </div>
          ))}
          {quality.positives.slice(0, 3).map((pos, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: '#10b98108', color: '#10b981' }}>
              <CheckCircle size={9} />
              {pos}
            </div>
          ))}
        </div>
      </div>

      <PRAnalysisWrapper
        expanded={expanded}
        analysis={analysis}
        theme={theme}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        onOpenFile={onOpenFile}
        onPostAIReview={handlePostAIReview}
        isPosting={sendingComment}
        fullPath={pr.fullPath}
        prId={pr.id}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={`Confirmar ${confirmDialog.action === 'approve' ? 'Aprovação' : confirmDialog.action === 'request-changes' ? 'Alterações' : confirmDialog.action === 'decline' ? 'Rejeição' : 'Merge'}?`}
        message="Esta ação será sincronizada imediatamente com o Bitbucket Cloud."
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        type={confirmDialog.action === 'decline' ? 'danger' : 'primary'}
        theme={theme}
        onConfirm={() => {
          if (confirmDialog.action) handleAction(confirmDialog.action);
          setConfirmDialog({ isOpen: false, action: null });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null })}
      />

      {feedback && (
        <FeedbackDialog
          isOpen={feedback.isOpen}
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          theme={theme}
          onClose={() => setFeedback(null)}
        />
      )}
    </motion.div>
  );
};
