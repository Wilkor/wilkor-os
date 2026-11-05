import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { generateCustomReportPDF } from './customPdfGenerator';

export interface DocumentSection {
  title: string;
  content: string;
}

export interface DocumentOptions {
  type: 'pdf' | 'xlsx' | 'docx' | 'txt' | 'md' | 'html';
  title: string;
  subtitle?: string;
  author?: string;
  fileName?: string;
  content: any; // Pode ser string, array de seções, ou estrutura de planilha
}

/**
 * Função principal para gerar qualquer tipo de documento e salvá-lo na pasta de artefatos
 */
export async function generateDocumentFile(options: DocumentOptions): Promise<{ filePath: string; fileName: string }> {
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const cleanTitle = options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
  const timestamp = Date.now();
  
  // Proteção: extrai apenas o nome básico do arquivo (basename) para evitar escrita fora da pasta de artefatos
  let outputFileName = options.fileName 
    ? path.basename(options.fileName) 
    : `${cleanTitle}-${timestamp}.${options.type}`;
    
  // Garante a extensão correta
  if (!outputFileName.endsWith(`.${options.type}`)) {
    outputFileName += `.${options.type}`;
  }
  
  const outputPath = path.join(artifactsDir, outputFileName);

  // Pré-processa o content caso venha em formato string
  let parsedContent = options.content;
  if (typeof options.content === 'string') {
    const trimmed = options.content.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        parsedContent = JSON.parse(trimmed);
      } catch (_) {
        // Mantém como string
      }
    } else if (options.type === 'xlsx' && trimmed.includes('\n')) {
      // Parseia CSV simples se o tipo for xlsx
      try {
        const lines = trimmed.split('\n');
        const rows: string[][] = [];
        for (const line of lines) {
          if (line.trim()) {
            const separator = line.includes(';') ? ';' : ',';
            const cells = line.split(separator).map(c => c.replace(/^["']|["']$/g, '').trim());
            rows.push(cells);
          }
        }
        if (rows.length > 0) {
          parsedContent = rows;
        }
      } catch (_) {
        // Fallback
      }
    }
  }

  switch (options.type) {
    case 'pdf': {
      const sections = Array.isArray(parsedContent) 
        ? parsedContent 
        : [{ title: options.title, content: String(parsedContent) }];
      
      const pdfResult = await generateCustomReportPDF({
        title: options.title,
        subtitle: options.subtitle,
        author: options.author,
        sections
      });
      return pdfResult;
    }

    case 'xlsx':
      await generateXLSXFile(parsedContent, options.title, outputPath);
      break;

    case 'docx':
      await generateDOCXFile(parsedContent, options.title, outputPath);
      break;

    case 'txt':
    case 'md':
    case 'html':
      generateTextBasedFile(parsedContent, outputPath);
      break;

    default:
      throw new Error(`Tipo de documento não suportado: ${options.type}`);
  }

  return {
    filePath: outputPath,
    fileName: outputFileName
  };
}

/**
 * Auxiliar: Geração de Planilha Excel (.xlsx)
 */
async function generateXLSXFile(content: any, title: string, outputPath: string): Promise<void> {
  const wb = XLSX.utils.book_new();

  if (content && typeof content === 'object' && content.sheets) {
    // Múltiplas abas
    for (const [sheetName, sheetData] of Object.entries(content.sheets)) {
      if (Array.isArray(sheetData)) {
        const ws = XLSX.utils.aoa_to_sheet(sheetData as any[][]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Limite do Excel de 31 caracteres para abas
      }
    }
  } else if (Array.isArray(content)) {
    // Array de linhas simples
    const ws = XLSX.utils.aoa_to_sheet(content);
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  } else {
    // Fallback texto plano
    const ws = XLSX.utils.aoa_to_sheet([
      [title],
      ['Conteúdo', String(content)]
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  }

  XLSX.writeFile(wb, outputPath);
}

/**
 * Auxiliar: Geração de Documento Word (.docx)
 */
async function generateDOCXFile(content: any, title: string, outputPath: string): Promise<void> {
  const docChildren: any[] = [];

  // Título do documento
  docChildren.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  );

  if (Array.isArray(content)) {
    // Seções { title: string, content: string }
    for (const section of content) {
      if (section.title) {
        docChildren.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 100 }
          })
        );
      }
      if (section.content) {
        const lines = String(section.content).split('\n');
        for (const line of lines) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun(line)],
              spacing: { after: 120 }
            })
          );
        }
      }
    }
  } else {
    // String simples
    const lines = String(content).split('\n');
    for (const line of lines) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 120 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * Auxiliar: Geração de Arquivos baseados em texto (TXT, MD, HTML)
 */
function generateTextBasedFile(content: any, outputPath: string): void {
  let fileContent = '';

  if (Array.isArray(content)) {
    // Seções
    for (const section of content) {
      if (section.title) {
        fileContent += `## ${section.title}\n\n`;
      }
      if (section.content) {
        fileContent += `${section.content}\n\n`;
      }
    }
  } else if (content && typeof content === 'object') {
    fileContent = JSON.stringify(content, null, 2);
  } else {
    fileContent = String(content);
  }

  fs.writeFileSync(outputPath, fileContent, 'utf8');
}
