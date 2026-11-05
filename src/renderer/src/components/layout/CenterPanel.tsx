import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorStage } from '../EditorStage';
import Terminal from '../Terminal';

interface CenterPanelProps {
  isChatOpen: boolean;
  isExplorerOpen: boolean;
  sidebarWidth: number;
  chatWidth: number;
  tabs: any[];
  activeTabPath: string | null;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
  onTabCloseAll: () => void;
  onTabCloseOthers: (path: string) => void;
  onContentChange: (path: string, content: string) => void;
  isTerminalOpen: boolean;
  terminalHeight: number;
  setTerminalHeight: (height: number) => void;
  workspaceFolders: string[];
  prAnalysis: any;
  agentActivities: any[];
  handleApplyAgentActivity: (id: string) => void;
  handleRejectAgentActivity: (id: string) => void;
  handleUndoAgentActivity: (id: string) => void;
  handleAIAction: (action: string, terminalId?: string) => void;
  onSave: (path: string) => void;
  onNavigateToFile: (path: string) => void;
  themeId: string;
  streamingActivity?: { path: string, content: string } | null;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  isChatOpen,
  isExplorerOpen,
  sidebarWidth,
  chatWidth,
  tabs,
  activeTabPath,
  onTabClick,
  onTabClose,
  onTabCloseAll,
  onTabCloseOthers,
  onContentChange,
  isTerminalOpen,
  terminalHeight,
  setTerminalHeight,
  workspaceFolders,
  prAnalysis,
  agentActivities,
  handleApplyAgentActivity,
  handleRejectAgentActivity,
  handleUndoAgentActivity,
  handleAIAction,
  onSave,
  onNavigateToFile,
  themeId,
  streamingActivity
}) => {
  return (
    <motion.div 
      animate={{ 
        marginLeft: isExplorerOpen ? 0 : 0, 
        marginRight: isChatOpen ? 0 : 0,
        width: `calc(100vw - 64px - ${isExplorerOpen ? sidebarWidth : 0}px - ${isChatOpen ? chatWidth : 0}px)` 
      }} 
      className="flex-1 flex flex-col min-w-0 bg-bg-app relative"
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <EditorStage 
          tabs={tabs}
          activeTabPath={activeTabPath}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
          onTabCloseAll={onTabCloseAll}
          onTabCloseOthers={onTabCloseOthers}
          onContentChange={onContentChange}
          onAIAction={handleAIAction}
          onSave={onSave}
          onNavigateToFile={onNavigateToFile}
          themeId={themeId}
          streamingActivity={streamingActivity}
          prAnalysis={prAnalysis}
          agentActivities={agentActivities}
          onAcceptActivity={handleApplyAgentActivity}
          onRejectActivity={handleRejectAgentActivity}
          onUndoActivity={handleUndoAgentActivity}
        />
      </div>

      <AnimatePresence>
        {isTerminalOpen && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: terminalHeight }}
            exit={{ height: 0 }}
            className="border-t border-white/[0.03] flex flex-col bg-bg-panel relative z-20"
          >
            {/* Terminal Resize Handle */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-primary/30 transition-colors z-30"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startHeight = terminalHeight;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const deltaY = startY - moveEvent.clientY;
                  setTerminalHeight(Math.max(100, Math.min(window.innerHeight - 200, startHeight + deltaY)));
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            />
            <Terminal 
              workspaceFolders={workspaceFolders}
              themeId={themeId}
              onAnalyzeError={(tid) => handleAIAction('fix', tid)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
