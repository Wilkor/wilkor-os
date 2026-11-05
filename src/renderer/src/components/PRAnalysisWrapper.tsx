import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Theme } from '../config/themes';
import { PRAnalysisDetails } from './PRAnalysisDetails';

interface PRAnalysisWrapperProps {
  expanded: boolean;
  analysis: any;
  theme: Theme;
  selectedFile: any;
  setSelectedFile: (file: any) => void;
  onOpenFile?: (path: string, analysis?: any) => void;
  onPostAIReview: () => void;
  isPosting: boolean;
  fullPath: string;
  prId: any;
}

export const PRAnalysisWrapper: React.FC<PRAnalysisWrapperProps> = ({
  expanded,
  analysis,
  theme,
  selectedFile,
  setSelectedFile,
  onOpenFile,
  onPostAIReview,
  isPosting,
  fullPath,
  prId
}) => {
  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-t"
          style={{ borderColor: theme.colors.borderColor }}
        >
          {analysis ? (
            <PRAnalysisDetails
              analysis={analysis}
              theme={theme}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              onOpenFile={onOpenFile}
              onPostAIReview={onPostAIReview}
              isPosting={isPosting}
              fullPath={fullPath}
              prId={prId}
            />
          ) : (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
              <Loader2 className="animate-spin text-primary" size={32} />
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Iniciando Varredura</p>
                <p className="text-[9px] font-bold mt-1">Sincronizando diffs com Bitbucket...</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
