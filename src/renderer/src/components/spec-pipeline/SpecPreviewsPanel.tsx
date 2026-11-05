import React from 'react';
import { MarkdownPreviewPanel } from './MarkdownPreviewPanel';
import { Theme } from '../../config/themes';

interface SpecPreviewsPanelProps {
  currentStep: number;
  prdContent: string;
  requirements: string;
  design: string;
  tasksJson: string;
  theme: Theme;
}

export const SpecPreviewsPanel: React.FC<SpecPreviewsPanelProps> = ({
  currentStep,
  prdContent,
  requirements,
  design,
  tasksJson,
  theme
}) => {
  return (
    <div className="h-full overflow-hidden">
      {currentStep === 0 && <MarkdownPreviewPanel title="PRD Base (Card Trello)" markdown={prdContent} theme={theme} />}
      {currentStep === 1 && <MarkdownPreviewPanel title="Requisitos (requirements.md)" markdown={requirements || 'Aguardando aprovação do PRD...'} theme={theme} />}
      {currentStep === 2 && <MarkdownPreviewPanel title="Design Técnico (design.md)" markdown={design || 'Aguardando aprovação dos requisitos...'} theme={theme} />}
      {currentStep >= 3 && <MarkdownPreviewPanel title="Plano de Sprint (tasks.json)" markdown={tasksJson ? `\`\`\`json\n${tasksJson}\n\`\`\`` : 'Aguardando aprovação do design...'} theme={theme} />}
    </div>
  );
};
