import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { parseColorToRgb } from './dashboardExportUtils';

export const exportAIUsageToPDF = async (
  elementId: string,
  theme: any,
  onAddToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
  setIsLoading: (loading: boolean) => void
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    onAddToast('Erro: Área de conteúdo não encontrada.', 'error');
    return;
  }

  onAddToast('Gerando Relatório de Telemetria de IA...', 'info');
  setIsLoading(true);

  try {
    // 1. Coleta dados de telemetria do banco
    let reports: any[] = [];
    if ((window as any).api?.analytics?.getAIUsage) {
      const res = await (window as any).api.analytics.getAIUsage();
      if (Array.isArray(res)) {
        reports = res;
      }
    }

    // 2. Calcula métricas de IA
    let totalCostUSD = 0;
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let successCount = 0;
    let errorCount = 0;
    let totalDurationMs = 0;
    const modelCosts: Record<string, number> = {};
    const taskCosts: Record<string, number> = {};

    reports.forEach((r) => {
      totalCostUSD += r.costUSD || 0;
      totalTokens += (r.tokensInput || 0) + (r.tokensOutput || 0);
      inputTokens += r.tokensInput || 0;
      outputTokens += r.tokensOutput || 0;
      if (r.success) {
        successCount++;
        totalDurationMs += r.durationMs || 0;
      } else {
        errorCount++;
      }

      const model = r.modelId || 'Desconhecido';
      modelCosts[model] = (modelCosts[model] || 0) + r.costUSD;

      const task = r.taskName || 'Geral';
      taskCosts[task] = (taskCosts[task] || 0) + r.costUSD;
    });

    const totalCalls = successCount + errorCount;
    const averageDurationMs = successCount > 0 ? totalDurationMs / successCount : 0;
    const totalCostBRL = totalCostUSD * 5.0;

    // Modelos e tarefas ordenadas por custo
    const sortedModels = Object.entries(modelCosts).sort((a, b) => b[1] - a[1]);
    const sortedTasks = Object.entries(taskCosts).sort((a, b) => b[1] - a[1]);

    const topModelName = sortedModels[0]?.[0] || 'N/A';
    const topModelCost = sortedModels[0]?.[1] || 0;
    const topTaskName = sortedTasks[0]?.[0] || 'N/A';
    const topTaskCost = sortedTasks[0]?.[1] || 0;

    // 3. Captura o screenshot da tela atual de consumo de IA
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

    const bgAppRgb = parseColorToRgb(theme.colors.bgApp || '#000000');
    const primaryRgb = parseColorToRgb(theme.colors.primary || '#3b82f6');
    const panelRgb = parseColorToRgb(theme.colors.bgPanel || '#111111');
    const textMainRgb = parseColorToRgb(theme.colors.textMain || '#ffffff');

    // PAGE 1: COVER
    pdf.setFillColor(bgAppRgb[0], bgAppRgb[1], bgAppRgb[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.rect(0, 0, 15, pdfHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.text('AI TELEMETRY & COST REPORT', 30, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(18);
    pdf.text('AUDITORIA FINANCEIRA E OPERACIONAL DE CUSTOS DE IA', 30, 95);
    
    pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setLineWidth(1);
    pdf.line(30, 110, 180, 110);
    
    pdf.setFontSize(13);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`ECOSYSTEM: wOs CO-PILOT INFRASTRUCTURE`, 30, 130);
    pdf.text(`ENGINEERING LEAD: WILKOR`, 30, 140);
    pdf.text(`AUDIT DATE: ${date}`, 30, 150);
    
    pdf.setFontSize(10);
    pdf.text('WOS AI TELEMETRY ENGINE • CONFIDENTIAL', 30, pdfHeight - 20);

    // PAGE 2: DASHBOARD
    pdf.addPage();
    pdf.setFillColor(bgAppRgb[0], bgAppRgb[1], bgAppRgb[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
    pdf.rect(0, 0, pdfWidth, 50, 'F');
    
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI USAGE & COST SNAPSHOT', 20, 28);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CONSUMO EM TEMPO REAL DETALHADO POR MODELO E TAREFA', 20, 38);

    const imgProps = pdf.getImageProperties(imgData);
    const displayWidth = pdfWidth - 60;
    const displayHeight = (imgProps.height * displayWidth) / imgProps.width;
    const imgY = 65;
    const imgX = 30;
    
    // Efeito de sombra
    for (let i = 1; i <= 5; i++) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.08 * i }));
      pdf.rect(imgX - i, imgY - i, displayWidth + (i * 2), displayHeight + (i * 2), 'S');
    }
    pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));
    
    pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(imgX - 2, imgY - 2, displayWidth + 4, displayHeight + 4, 'S');
    pdf.addImage(imgData, 'PNG', imgX, imgY, displayWidth, displayHeight);
    
    // Badges
    const badges = [
      { l: 'AI INVESTMENT', v: `$${totalCostUSD.toFixed(3)}`, y: imgY - 12, x: imgX - 10 },
      { l: 'TOTAL TOKENS', v: totalTokens.toLocaleString('pt-BR'), y: imgY + displayHeight - 12, x: imgX + displayWidth - 38 }
    ];
    
    badges.forEach(b => {
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.2 }));
      pdf.roundedRect(b.x + 1, b.y + 1, 48, 22, 3, 3, 'F');
      
      pdf.setGState(new (pdf as any).GState({ opacity: 1.0 }));
      pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
      pdf.roundedRect(b.x, b.y, 48, 22, 3, 3, 'F');
      
      pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(b.x, b.y, 48, 22, 3, 3, 'S');
      
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(b.l, b.x + 4, b.y + 7);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.text(b.v, b.x + 4, b.y + 16);
    });

    pdf.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setLineWidth(2);
    pdf.line(20, pdfHeight - 20, 60, pdfHeight - 20);
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text('WOS AI TELEMETRY ENGINE v4.2', 65, pdfHeight - 18);

    // PAGE 3: INSIGHTS & RECOMMENDATIONS
    pdf.addPage();
    pdf.setFillColor(bgAppRgb[0], bgAppRgb[1], bgAppRgb[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    pdf.setFillColor(panelRgb[0], panelRgb[1], panelRgb[2]);
    pdf.rect(0, 0, pdfWidth, 40, 'F');
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.setFontSize(20);
    pdf.text('AI PERFORMANCE & STRATEGIC INSIGHTS', 20, 25);
    
    const metrics = [
      { l: 'FINANCE PROJ.', v: `R$ ${totalCostBRL.toFixed(2)}`, d: 'Custo projetado em Reais (BRL).' },
      { l: 'AI CALLS', v: `${totalCalls}`, d: `Sucesso: ${successCount} | Falha: ${errorCount}` },
      { l: 'AVG LATENCY', v: `${(averageDurationMs / 1000).toFixed(2)}s`, d: 'Tempo médio de resposta.' },
      { l: 'TOKEN DENSITY', v: `${totalCalls > 0 ? Math.round(totalTokens / totalCalls).toLocaleString('pt-BR') : 0} t/c`, d: 'Média de tokens por requisição.' }
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
    
    pdf.setTextColor(textMainRgb[0], textMainRgb[1], textMainRgb[2]);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI TELEMETRY STRATEGIC ANALYSIS:', 20, 95);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const analysisText = [
      `• O custo de IA acumulado é de $${totalCostUSD.toFixed(4)} USD (projetado em R$ ${totalCostBRL.toFixed(2)} BRL para taxa de câmbio de R$ 5,00).`,
      `• O modelo mais oneroso no período é o "${topModelName}", consumindo $${topModelCost.toFixed(4)} USD (ou ${totalCostUSD > 0 ? ((topModelCost / totalCostUSD) * 100).toFixed(1) : 0}% da verba total).`,
      `• A tarefa mais dispendiosa é "${topTaskName}" com custo acumulado de $${topTaskCost.toFixed(4)} USD (${totalCostUSD > 0 ? ((topTaskCost / totalCostUSD) * 100).toFixed(1) : 0}% do investimento).`,
      `• Foram registradas ${totalCalls} chamadas com uma latência média de ${(averageDurationMs / 1000).toFixed(2)} segundos e taxa de sucesso de ${totalCalls > 0 ? ((successCount / totalCalls) * 100).toFixed(1) : 0}%.`
    ];
    pdf.text(analysisText, 20, 105, { lineHeightFactor: 1.5 });
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('AI COST GOVERNANCE RECOMMENDATIONS:', 20, 145);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    const recommendations = [
      "1. Priorizar o uso de modelos compactos de alta performance (como gpt-4o-mini e gemini-1.5-flash) para tarefas de auto-fill e refinamento de discovery.",
      "2. Implementar controle dinâmico do histórico de mensagens enviado no prompt context para limitar o consumo em conversas de chat prolongadas.",
      "3. Configurar alertas financeiros de consumo máximo no wOs para evitar custos inesperados em tarefas automatizadas e cron jobs."
    ];
    pdf.text(recommendations, 20, 155, { lineHeightFactor: 1.5 });
    
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text(`Documento gerado automaticamente pelo wOs Agent • ${date}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
    
    pdf.save(`AI_Consumption_Report_${date.replace(/\//g, '-')}.pdf`);
    onAddToast('Relatório de Consumo de IA exportado!', 'success');
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    onAddToast('Erro ao exportar PDF: ' + (err.message || 'Erro interno'), 'error');
  } finally {
    setIsLoading(false);
  }
};
