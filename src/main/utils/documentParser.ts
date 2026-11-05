import { readFileSync } from 'fs';
import { extname } from 'path';
import * as XLSX from 'xlsx';
import AdmZip from 'adm-zip';

export interface ParseResult {
  success: boolean;
  type: string;
  sheets?: Record<string, any[][]>;
  content?: string;
  base64?: string;
  meta?: any;
  error?: string;
}

/**
 * Lê um arquivo físico de artefato e extrai dados formatados para preview
 */
export async function parseDocumentForPreview(filePath: string): Promise<ParseResult> {
  const ext = extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.xlsx':
      case '.xls': {
        const workbook = XLSX.readFile(filePath);
        const sheets: Record<string, any[][]> = {};
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          sheets[sheetName] = data as any[][];
        }
        return { success: true, type: 'xlsx', sheets };
      }

      case '.docx': {
        const zip = new AdmZip(filePath);
        const docXml = zip.readAsText('word/document.xml');
        const paragraphs: string[] = [];
        const matches = docXml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g);
        
        if (matches) {
          for (const p of matches) {
            const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
            if (textMatches) {
              const pText = textMatches.map(tm => tm.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join('');
              if (pText.trim()) {
                paragraphs.push(pText);
              }
            }
          }
        }
        return { success: true, type: 'docx', content: paragraphs.join('\n') };
      }

      case '.pdf': {
        const dataBuffer = readFileSync(filePath);
        const pdfParseModule = await import('pdf-parse');
        const mod: any = pdfParseModule;
        const pdfParse = typeof mod === 'function' ? mod : (mod.default || mod);
        const data = await pdfParse(dataBuffer);
        return {
          success: true,
          type: 'pdf',
          meta: {
            numpages: data.numpages,
            info: data.info
          },
          content: data.text.substring(0, 1500) // Limita o preview para performance
        };
      }

      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif': {
        const dataBuffer = readFileSync(filePath);
        const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
        return { 
          success: true, 
          type: 'image', 
          base64: `data:${mimeType};base64,${dataBuffer.toString('base64')}` 
        };
      }

      case '.txt':
      case '.md':
      case '.html':
      case '.json':
      case '.js':
      case '.ts':
      case '.tsx':
      case '.css': {
        const content = readFileSync(filePath, 'utf8');
        return { 
          success: true, 
          type: ext.replace('.', ''), 
          content 
        };
      }

      default: {
        // Fallback genérico para texto
        try {
          const content = readFileSync(filePath, 'utf8');
          if (content.length < 50000) { // Garante que não é um binário gigante
            return { success: true, type: 'txt', content };
          }
        } catch (_) {}
        return { success: false, type: 'unknown', error: 'Formato não suportado para preview visual' };
      }
    }
  } catch (err: any) {
    console.error(`[documentParser] Erro ao parsear arquivo ${filePath}:`, err);
    return { success: false, type: 'unknown', error: `Erro ao abrir preview: ${err.message}` };
  }
}
