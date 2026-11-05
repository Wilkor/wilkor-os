import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

export interface CustomReportSection {
  title: string;
  content: string;
}

export interface CustomReportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  sections: CustomReportSection[];
}

/**
 * Gera um relatório PDF premium customizado baseado nos inputs enviados pelo agente.
 */
export async function generateCustomReportPDF(options: CustomReportOptions): Promise<{ filePath: string; fileName: string }> {
  const pdf = new jsPDF('p', 'mm', 'a4'); // Retrato, A4 (210mm x 297mm)
  const pdfWidth = 210;
  const pdfHeight = 297;
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const author = options.author || 'Agentes Autônomos (wOs)';

  // Paleta de Cores Dark Premium HSL Tailored
  const bgApp = [15, 23, 42];        // Slate-900 (Fundo Geral)
  const bgPanel = [30, 41, 59];       // Slate-800 (Painéis/Cards)
  const primary = [99, 102, 241];     // Indigo-500 (Destaque Principal)
  const textMain = [248, 250, 252];   // Slate-50 (Texto Principal)
  const textSec = [148, 163, 184];    // Slate-400 (Texto Secundário)

  // ==========================================
  // --- PÁGINA 1: CAPA DO RELATÓRIO ---
  // ==========================================
  pdf.setFillColor(bgApp[0], bgApp[1], bgApp[2]);
  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

  // Faixa lateral estética Indigo
  pdf.setFillColor(primary[0], primary[1], primary[2]);
  pdf.rect(0, 0, 8, pdfHeight, 'F');

  // Título e Subtítulo
  pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  
  // Trata quebra de linhas para títulos longos
  const titleLines = pdf.splitTextToSize(options.title.toUpperCase(), 160);
  pdf.text(titleLines, 24, 75);
  
  const titleHeightOffset = titleLines.length * 9;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  const subtitle = options.subtitle || 'Análise de Segurança e Qualidade de Código';
  const subtitleLines = pdf.splitTextToSize(subtitle, 160);
  pdf.text(subtitleLines, 24, 75 + titleHeightOffset);

  // Linha decorativa
  pdf.setDrawColor(primary[0], primary[1], primary[2]);
  pdf.setLineWidth(0.8);
  pdf.line(24, 85 + titleHeightOffset, 186, 85 + titleHeightOffset);

  // Metadados da Capa
  pdf.setFontSize(11);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.text(`DATA DE EMISSÃO: ${dateStr}`, 24, 110 + titleHeightOffset);
  pdf.text(`RESPONSÁVEL PELA ANÁLISE: ${author}`, 24, 118 + titleHeightOffset);
  pdf.text(`SISTEMA EMISSOR: Workspace Operating System (wOs)`, 24, 126 + titleHeightOffset);

  pdf.setFontSize(9);
  pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
  pdf.text('GERADO DINAMICAMENTE PELO ECOSSISTEMA DE AGENTES WOS', 24, pdfHeight - 20);

  // ==========================================
  // --- PÁGINAS SEGUINTES: CONTEÚDO ---
  // ==========================================
  let currentY = 30;

  options.sections.forEach((section) => {
    pdf.addPage();
    pdf.setFillColor(bgApp[0], bgApp[1], bgApp[2]);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    pdf.setFillColor(primary[0], primary[1], primary[2]);
    pdf.rect(0, 0, 8, pdfHeight, 'F');

    // Header da Seção
    pdf.setTextColor(primary[0], primary[1], primary[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(section.title, 24, currentY);

    // Linha divisória fina
    pdf.setDrawColor(bgPanel[0], bgPanel[1], bgPanel[2]);
    pdf.setLineWidth(0.3);
    pdf.line(24, currentY + 4, 186, currentY + 4);

    currentY += 12;

    // Conteúdo da Seção com auto-wrap
    pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const splitContent = pdf.splitTextToSize(section.content, 162);
    
    // Iteração para desenhar linhas respeitando limites de página
    for (let i = 0; i < splitContent.length; i++) {
      if (currentY > pdfHeight - 25) {
        pdf.addPage();
        pdf.setFillColor(bgApp[0], bgApp[1], bgApp[2]);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.setFillColor(primary[0], primary[1], primary[2]);
        pdf.rect(0, 0, 8, pdfHeight, 'F');
        
        currentY = 30;
        pdf.setTextColor(primary[0], primary[1], primary[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(`${section.title} (Continuação)`, 24, currentY);
        
        pdf.setDrawColor(bgPanel[0], bgPanel[1], bgPanel[2]);
        pdf.setLineWidth(0.3);
        pdf.line(24, currentY + 4, 186, currentY + 4);
        
        currentY += 12;
        pdf.setTextColor(textMain[0], textMain[1], textMain[2]);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
      }
      
      pdf.text(splitContent[i], 24, currentY);
      currentY += 6;
    }

    // Rodapé simples de controle de página
    pdf.setTextColor(textSec[0], textSec[1], textSec[2]);
    pdf.setFontSize(8);
    pdf.text(`wOs Security Report • ${dateStr}`, pdfWidth / 2, pdfHeight - 12, { align: 'center' });

    // Reseta posição inicial para próxima seção
    currentY = 30;
  });

  // Salva o arquivo no diretório de artefatos
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const cleanTitle = options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
  const outputFileName = `relatorio-${cleanTitle}-${Date.now()}.pdf`;
  const outputPath = path.join(artifactsDir, outputFileName);

  const arrayBuffer = pdf.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

  return {
    filePath: outputPath,
    fileName: outputFileName
  };
}
