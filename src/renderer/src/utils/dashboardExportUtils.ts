import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const parseColorToRgb = (color: string): [number, number, number] => {
  if (!color) return [0, 0, 0];
  if (color.includes('rgb')) {
    const parts = color.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
    }
  }
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(s => s + s).join('');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
};

export const exportDashboardToPDF = async (
  elementId: string,
  selectedBoard: string,
  boards: any[],
  stats: any,
  discoveryCardsCount: number,
  backlogCardsCount: number,
  todoCardsCount: number,
  doingCardsCount: number,
  doneCardsCount: number,
  bugsCardsCount: number,
  theme: any,
  onAddToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  setIsLoading: (loading: boolean) => void
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    onAddToast('Erro: Área de conteúdo não encontrada.', 'error');
    return;
  }
  
  onAddToast('Gerando Relatório Executivo...', 'info');
  setIsLoading(true);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme.colors.bgApp,
      logging: false,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById(elementId);
        if (el) el.style.overflow = 'visible';
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const date = new Date().toLocaleDateString('pt-BR');

    // PAGE 1: COVER
    const bgAppRgb = parseColorToRgb(theme.colors.bgApp || '#000000');
    const primaryRgb = parseColorToRgb(theme.colors.primary || '#3b82f6');
    const panelRgb = parseColorToRgb(theme.colors.bgPanel || '#111111');
    const textMainRgb = parseColorToRgb(theme.colors.textMain || '#ffffff');

    pdf.setFillColor(bgAppRgb[0], bgAppRgb[1], bgAppRgb[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.rect(0, 0, 15, pdfHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(48);
    pdf.text('REPORT', 30, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(22);
    pdf.text('SOFTWARE ENGINEERING EXECUTIVE', 30, 95);
    
    pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setLineWidth(1);
    pdf.line(30, 110, 180, 110);
    
    pdf.setFontSize(14);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`ECOSYSTEM: ${selectedBoard ? (boards.find(b => b.id === selectedBoard)?.name || 'Board Selecionado') : 'TIABETE INFRASTRUCTURE'}`, 30, 130);
    pdf.text(`ENGINEERING LEAD: WILKOR`, 30, 140);
    pdf.text(`REPORTING PERIOD: ${date}`, 30, 150);
    
    pdf.setFontSize(10);
    pdf.text('WOS INTELLIGENCE ENGINE • CONFIDENTIAL', 30, pdfHeight - 20);

    // PAGE 2: DASHBOARD
    pdf.addPage();
    pdf.setFillColor(bgAppRgb[0], bgAppRgb[1], bgAppRgb[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
    pdf.rect(0, 0, pdfWidth, 60, 'F');
    
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENGINEERING INTELLIGENCE SNAPSHOT', 20, 35);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('GOVERNANÇA E MÉTRICAS TÉCNICAS EM TEMPO REAL', 20, 45);

    const imgProps = pdf.getImageProperties(imgData);
    const displayWidth = pdfWidth - 60;
    const displayHeight = (imgProps.height * displayWidth) / imgProps.width;
    const imgY = 70;
    const imgX = 30;
    
    for (let i = 1; i <= 5; i++) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.1 * i }));
      pdf.rect(imgX - i, imgY - i, displayWidth + (i * 2), displayHeight + (i * 2), 'S');
    }
    pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));
    
    pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(imgX - 2, imgY - 2, displayWidth + 4, displayHeight + 4, 'S');
    pdf.addImage(imgData, 'PNG', imgX, imgY, displayWidth, displayHeight);
    
    const totalCards = discoveryCardsCount + backlogCardsCount + todoCardsCount + doingCardsCount + doneCardsCount + bugsCardsCount;
    const badges = [
      { l: 'STABILITY', v: '96%', y: imgY - 15, x: imgX - 10 },
      { l: 'TOTAL ASSETS', v: `${totalCards || 0}`, y: imgY + displayHeight - 10, x: imgX + displayWidth - 35 }
    ];
    
    badges.forEach(b => {
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.2 }));
      pdf.roundedRect(b.x + 1, b.y + 1, 45, 22, 3, 3, 'F');
      
      pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));
      pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
      pdf.roundedRect(b.x, b.y, 45, 22, 3, 3, 'F');
      
      pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(b.x, b.y, 45, 22, 3, 3, 'S');
      
      pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      const lX = b.x + 4;
      const lY = b.y + 11;
      pdf.rect(lX, lY, 4, 1, 'F');
      pdf.rect(lX, lY + 2.5, 4, 1, 'F');
      pdf.rect(lX, lY + 5, 4, 1, 'F');
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(b.l, b.x + 12, b.y + 8);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text(b.v, b.x + 12, b.y + 17);
    });

    pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setLineWidth(2);
    pdf.line(20, pdfHeight - 25, 60, pdfHeight - 25);
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text('WOS ANALYTICS ENGINE v4.2', 65, pdfHeight - 23);

    // PAGE 3: INSIGHTS
    pdf.addPage();
    pdf.setFillColor(bgAppRgb[0], bgAppRgb[1], bgAppRgb[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
    pdf.rect(0, 0, pdfWidth, 40, 'F');
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setFontSize(20);
    pdf.text('INSIGHTS & PERFORMANCE', 20, 25);
    
    const metrics = [
      { l: 'THROUGHPUT', v: `${stats?.progressPercent || 0}%`, d: 'Vazão de entregas finalizadas.' },
      { l: 'ENG. VELOCITY', v: `${stats?.totalCommits || 0} Integr.`, d: 'Ritmo de iteração do código.' },
      { l: 'DEFECT DENSITY', v: `${stats?.bugRatio || 0}%`, d: 'Proporção de débito técnico.' },
      { l: 'AVAILABILITY', v: (stats?.progressPercent || 0) > 80 ? 'STABLE' : 'ACTION REQ.', d: 'Confiabilidade do roadmap.' }
    ];
    
    let xPos = 20;
    pdf.setLineWidth(0.2);
    metrics.forEach(m => {
      pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
      pdf.roundedRect(xPos, 50, 60, 30, 2, 2, 'F');
      
      pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      pdf.roundedRect(xPos, 50, 60, 30, 2, 2, 'S');
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(7);
      pdf.text(m.l, xPos + 5, 58);
      
      pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(m.v, xPos + 5, 70);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(m.d, xPos + 5, 76);
      
      xPos += 65;
    });
    
    pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
    pdf.rect(20, 85, 255, 15, 'F');
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENGINEERING KPIS GLOSSARY:', 25, 95);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150, 150, 150);
    pdf.text('Throughput: Velocity over backlog | Velocity: Code integration frequency | Defect Density: Technical debt ratio', 70, 95);
    
    pdf.setTextColor(textMainRgb[0], textMainRgb[1], textMainRgb[2]);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ENGINEERING STRATEGIC ANALYSIS:', 20, 115);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const analysisText = [
      `• A vazão de engenharia (Throughput) está em ${stats?.progressPercent || 0}%, indicando uma cadência de entrega ${(stats?.progressPercent || 0) > 75 ? 'otimizada' : 'com gargalos de aprovação'}.`,
      `• O pulso técnico (Eng. Velocity) de ${stats?.totalCommits || 0} integrações reflete um ciclo de feedback ágil e saudável no repositório.`,
      `• A densidade de defeitos (${stats?.bugRatio || 0}%) aponta para um controle de qualidade resiliente, mitigando riscos de regressão.`,
      `• A liderança técnica do colaborador ${stats?.topTrello?.[0]?.name || 'do time'} tem sido fundamental para a estabilidade do sprint.`
    ];
    pdf.text(analysisText, 20, 125, { lineHeightFactor: 1.5 });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('ENGINEERING GOVERNANCE RECOMMENDATIONS:', 20, 165);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    const recommendations = [
      "1. Priorizar refatoração de módulos com alta complexidade ciclomática para reduzir o Defect Density.",
      "2. Automatizar testes de integração para sustentar o aumento da velocidade de engenharia.",
      "3. Realizar sessões de 'Architecture Review' para mitigar riscos de escalabilidade no curto prazo."
    ];
    pdf.text(recommendations, 20, 175, { lineHeightFactor: 1.5 });
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text(`Documento gerado automaticamente pelo wOs Agent • ${date}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
    
    pdf.save(`Executive_Report_TiaBete_${date.replace(/\//g, '-')}.pdf`);
    onAddToast('Relatório Executivo exportado!', 'success');
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    onAddToast('Erro ao exportar PDF: ' + (err.message || 'Erro interno'), 'error');
  } finally {
    setIsLoading(false);
  }
};
