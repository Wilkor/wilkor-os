import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import { compileGitStats, GitReportSummary } from './gitReportStats';
import Store from 'electron-store';

const store = new Store(
  process.versions.electron 
    ? undefined 
    : ({ projectName: 'wilkor-os' } as any)
);

/**
 * Gera um relatório executivo em PDF de altíssima fidelidade e design Dark Premium.
 */
export async function generateGitReportPDF(
  since: string = '7 days ago',
  customRepos?: string[]
): Promise<GitReportSummary> {
  const stats = await compileGitStats(since, customRepos);
  const { totalCommits, totalPRs, topCommitter, contributors, activePRsList, reposToScan } = stats;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pdfHeight = 297;
  const dateStr = new Date().toLocaleDateString('pt-BR');

  const bgApp = [15, 23, 42];        // Slate-900
  const bgPanel = [30, 41, 59];       // Slate-800
  const primary = [99, 102, 241];     // Indigo-500
  const textMain = [248, 250, 252];   // Slate-50
  const textSec = [148, 163, 184];    // Slate-400

  // PÁGINA 1: CAPA EXECUTIVA DE DESIGN PREMIUM
  pdf.setFillColor(bgApp[0], bgApp[1], bgApp[2]);
  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

  pdf.setFillColor(primary[0], primary[1], primary[2]);
  pdf.rect(0, 0, 8, pdfHeight, 'F');

  pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text('REPORT EXECUTIVE', 24, 75);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(16);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.text('Git Engineering Pulse & PR Governance', 24, 85);

  pdf.setDrawColor(primary[0], primary[1], primary[2]);
  pdf.setLineWidth(0.8);
  pdf.line(24, 98, 186, 98);

  // Bloco de Metadados do Relatório
  const techLeader = (store.get('techLeader') || store.get('userName') || 'WILKOR') as string;
  pdf.setFontSize(11);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.text(`PERÍODO ANALISADO: Últimos ${since.replace(' ago', '')}`, 24, 120);
  pdf.text(`REPOSITÓRIOS MONITORADOS: ${reposToScan.length} ativos`, 24, 128);
  pdf.text(`DATA DO DISPARO: ${dateStr}`, 24, 136);
  pdf.text(`LIDERANÇA TÉCNICA: ${techLeader.toUpperCase()}`, 24, 144);

  // KPI Quick Cards
  const kpis = [
    { label: 'Total Commits', value: `${totalCommits}` },
    { label: 'PRs Ativos', value: `${totalPRs}` }
  ];

  let kpiY = 175;
  kpis.forEach(k => {
    pdf.setFillColor(bgPanel[0], bgPanel[1], bgPanel[2]);
    pdf.roundedRect(24, kpiY, 75, 20, 2, 2, 'F');
    pdf.setDrawColor(primary[0], primary[1], primary[2]);
    pdf.roundedRect(24, kpiY, 75, 20, 2, 2, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(primary[0], primary[1], primary[2]);
    pdf.text(k.value, 30, kpiY + 13);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
    pdf.text(k.label, 30, kpiY + 7);
    kpiY += 28;
  });

  pdf.setFontSize(9);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.text('GERADO DINAMICAMENTE PELO ECOSSISTEMA WOS', 24, pdfHeight - 20);

  // ========================================================================
  // --- PÁGINA 2: COMMITS & GRÁFICOS DE CONTRIBUIÇÃO ---
  // ========================================================================
  pdf.addPage();
  pdf.setFillColor(bgApp[0], bgApp[1], bgApp[2]);
  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
  pdf.setFillColor(primary[0], primary[1], primary[2]);
  pdf.rect(0, 0, 8, pdfHeight, 'F');

  pdf.setTextColor(primary[0], primary[1], primary[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('1. Ranking de Contribuição de Commits', 24, 30);

  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Quantidade consolidada de commits e co-autorias detectadas por desenvolvedor.', 24, 37);

  // Cabeçalho da Tabela
  let tableY = 48;
  pdf.setFillColor(bgPanel[0], bgPanel[1], bgPanel[2]);
  pdf.rect(24, tableY, 162, 9, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
  pdf.text('Pos.', 28, tableY + 65 / 10);
  pdf.text('Colaborador', 45, tableY + 65 / 10);
  pdf.text('Commits', 105, tableY + 65 / 10);
  pdf.text('% Part.', 130, tableY + 65 / 10);
  pdf.text('Progresso', 148, tableY + 65 / 10);

  tableY += 9;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);

  // Renderização das linhas com Gráficos de Progresso Inline
  contributors.slice(0, 8).forEach((c, index) => {
    const pct = totalCommits > 0 ? Math.round((c.commits / totalCommits) * 100) : 0;
    
    if (index % 2 === 0) {
      pdf.setFillColor(23, 37, 84); // Linhas alternadas em Azul Sutil
      pdf.rect(24, tableY, 162, 8, 'F');
    }

    pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
    pdf.text(`${index + 1}º`, 28, tableY + 5.5);
    pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
    pdf.text(c.name.length > 20 ? c.name.substring(0, 18) + '..' : c.name, 45, tableY + 5.5);
    pdf.text(`${c.commits}`, 105, tableY + 5.5);
    pdf.setTextColor(primary[0], primary[1], primary[2]);
    pdf.text(`${pct}%`, 130, tableY + 5.5);

    // --- GRÁFICO INLINE 1: Barra de Progresso Horizontal ---
    pdf.setFillColor(51, 65, 85); // Trilha cinza da barra (Slate-700)
    pdf.roundedRect(148, tableY + 4, 30, 1.8, 0.5, 0.5, 'F');

    pdf.setFillColor(primary[0], primary[1], primary[2]); // Preenchimento Indigo
    const fillWidth = Math.max(0.5, 30 * (pct / 100));
    pdf.roundedRect(148, tableY + 4, fillWidth, 1.8, 0.5, 0.5, 'F');

    tableY += 8;
  });

  // --- GRÁFICO VETORIAL PRINCIPAL: Engineering Output Column Chart ---
  const chartY = 160;
  pdf.setFillColor(bgPanel[0], bgPanel[1], bgPanel[2]);
  pdf.roundedRect(24, chartY, 162, 82, 3, 3, 'F');
  pdf.setDrawColor(primary[0], primary[1], primary[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(24, chartY, 162, 82, 3, 3, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(primary[0], primary[1], primary[2]);
  pdf.text('📊 ANALYTICS: DISTRIBUIÇÃO COMPARATIVA DE COMMITS', 32, chartY + 10);

  // Eixo base horizontal do gráfico
  pdf.setDrawColor(71, 85, 105);
  pdf.setLineWidth(0.25);
  pdf.line(40, chartY + 62, 172, chartY + 62); 

  // Plotagem das colunas dinâmicas (Top 5 colaboradores)
  const chartContributors = contributors.slice(0, 5);
  const maxCommits = chartContributors.length > 0 ? Math.max(...chartContributors.map(c => c.commits)) : 1;
  const startX = 46;
  const barW = 12;
  const gapX = 25;

  chartContributors.forEach((c, index) => {
    const pctScale = maxCommits > 0 ? c.commits / maxCommits : 0;
    const barH = Math.max(2, pctScale * 35); // Altura proporcional (teto de 35mm)
    const barX = startX + index * gapX;
    const barY = chartY + 62 - barH;

    // Coluna vertical Indigo preenchida
    pdf.setFillColor(primary[0], primary[1], primary[2]);
    pdf.roundedRect(barX, barY, barW, barH, 1, 1, 'F');

    // Valor acima da barra
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
    pdf.text(`${c.commits}`, barX + (barW / 2), barY - 2, { align: 'center' });

    // Nome abreviado do desenvolvedor abaixo do eixo
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
    const firstName = c.name.split(' ')[0];
    pdf.text(firstName, barX + (barW / 2), chartY + 67, { align: 'center' });
  });

  // Legenda
  pdf.setFontSize(8);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.text('Métrica: Contribuição ativa consolidada (Commits + Co-autorias)', 32, chartY + 75);

  // ========================================================================
  // --- PÁGINA 3: GOVERNANÇA DE Pull Requests ATIVOS ---
  // ========================================================================
  pdf.addPage();
  pdf.setFillColor(bgApp[0], bgApp[1], bgApp[2]);
  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
  pdf.setFillColor(primary[0], primary[1], primary[2]);
  pdf.rect(0, 0, 8, pdfHeight, 'F');

  pdf.setTextColor(primary[0], primary[1], primary[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('2. Governança de Pull Requests Ativos', 24, 30);

  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Métricas de branches abertas que ainda não foram mergeadas na branch estável (developer).', 24, 37);

  // Cabeçalho da Tabela de PRs
  tableY = 55;
  pdf.setFillColor(bgPanel[0], bgPanel[1], bgPanel[2]);
  pdf.rect(24, tableY, 162, 10, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
  pdf.text('Responsável', 28, tableY + 7);
  pdf.text('Projeto', 75, tableY + 7);
  pdf.text('Branch (Recente)', 105, tableY + 7);
  pdf.text('Última Ativ.', 162, tableY + 7);

  tableY += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);

  const sortedPRs = [...activePRsList].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  sortedPRs.forEach((pr, index) => {
    if (tableY > pdfHeight - 40) return;

    if (index % 2 === 0) {
      pdf.setFillColor(23, 37, 84);
      pdf.rect(24, tableY, 162, 9, 'F');
    }

    const authName = pr.author.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const repoLabel = pr.projectLabel || pr.repo.toUpperCase();

    pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
    pdf.text(authName.length > 18 ? authName.substring(0, 16) + '..' : authName, 28, tableY + 6);
    pdf.setTextColor(primary[0], primary[1], primary[2]);
    pdf.text(repoLabel, 75, tableY + 6);
    pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
    pdf.text(pr.name.length > 25 ? pr.name.substring(0, 23) + '..' : pr.name, 105, tableY + 6);
    pdf.text(pr.date, 162, tableY + 6);

    tableY += 9;
  });

  if (sortedPRs.length === 0) {
    pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Nenhum Pull Request ativo ou branch pendente detectado no momento.', 30, tableY + 10);
  }

  // Rodapé da Página 3
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Documento de Governança de Engenharia do wOs • Gerado em ${dateStr}`, pdfWidth / 2, pdfHeight - 12, { align: 'center' });

  // 5. Salva o PDF no diretório de artefatos
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const outputFileName = `relatorio-atividade-git-${dateStr.replace(/\//g, '-')}.pdf`;
  const outputPath = path.join(artifactsDir, outputFileName);

  const arrayBuffer = pdf.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

  console.log(`[wOs PDF] Relatório PDF Premium Gerado com Gráficos em: ${outputPath}`);

  return {
    period: since,
    totalCommits,
    totalPRs,
    topCommitter,
    topPRContributor: topCommitter, // Fallback coerente
    contributors,
    filePath: outputPath
  };
}
