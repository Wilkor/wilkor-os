export interface FileData {
  name: string;
  type: string;
  content: string; // Base64
  path?: string;   // Caminho absoluto local opcional
}

/**
 * Processa diferentes tipos de arquivos e retorna seu conteúdo textual ou estruturado.
 */
export async function processFileAttachment(file: FileData): Promise<{ text: string; isNativelySupported: boolean }> {
  const { type, content, name, path } = file;

  // 1. Arquivos de Texto (simples)
  if (type.startsWith('text/') || name.endsWith('.csv') || name.endsWith('.json') || name.endsWith('.log') || name.endsWith('.md') || name.endsWith('.sql')) {
    try {
      if (!content) return { text: '', isNativelySupported: false };
      const base64Data = content.split(',')[1] || content;
      const text = Buffer.from(base64Data, 'base64').toString('utf-8');
      const pathInfo = path ? ` (Caminho do Arquivo: ${path})` : '';
      return { 
        text: `\n[Conteúdo do arquivo: ${name}${pathInfo}]\n\n${text}\n[Fim do arquivo: ${name}]\n`, 
        isNativelySupported: false 
      };
    } catch (err) {
      console.error(`Erro ao processar arquivo de texto ${name}:`, err);
      return { text: '', isNativelySupported: false };
    }
  }

  // 2. Documentos PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      if (!content) return { text: '[Erro: Conteúdo vazio]', isNativelySupported: false };
      const base64Data = content.split(',')[1] || content;
      const nodeBuffer = Buffer.from(base64Data, 'base64');
      // pdfjs-dist (ESM) exige Uint8Array, não aceita Buffer diretamente
      const buffer = new Uint8Array(nodeBuffer.buffer, nodeBuffer.byteOffset, nodeBuffer.byteLength);
      
      const pdfParseModule = await import('pdf-parse');
      const mod: any = pdfParseModule;
      
      let text = '';
      try {
        const PDFParseClass = mod.PDFParse || (mod.default ? mod.default.PDFParse : null);
        
        if (PDFParseClass) {
          const parser = new PDFParseClass(buffer);
          const result = await parser.getText();
          text = result.text;
        } else {
          const pdfParse = typeof mod === 'function' ? mod : (mod.default || mod);
          if (typeof pdfParse === 'function') {
            const result = await pdfParse(buffer);
            text = result.text;
          } else {
            console.error('[pdf-parse] Estrutura do módulo incompatível:', Object.keys(mod));
            throw new Error('Não foi possível encontrar uma função ou classe de parsing válida.');
          }
        }
      } catch (innerErr: any) {
        console.error('[pdf-parse] Erro na execução do parser:', innerErr);
        throw innerErr;
      }

      const pathInfo = path ? ` (Caminho do Arquivo: ${path})` : '';
      return { 
        text: `\n[Transcrição do PDF: ${name}${pathInfo}]\n\n${text}\n[Fim do PDF: ${name}]\n`, 
        isNativelySupported: true 
      };
    } catch (err) {
      console.error(`Erro ao processar PDF ${name}:`, err);
      return { text: '[Erro ao extrair texto do PDF]', isNativelySupported: false };
    }
  }

  // 3. Imagens e Áudio (Tratados separadamente pelos provedores Vision/Whisper)
  if (type.startsWith('image/') || type.startsWith('audio/')) {
    return { text: '', isNativelySupported: true };
  }

  return { text: '', isNativelySupported: false };
}
