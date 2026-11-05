import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Helper para requisições Axios com política de retentativa inteligente
export async function postWithRetry(url: string, data: any, config: any, maxRetries: number = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await axios.post(url, data, config);
    } catch (error: any) {
      attempt++;
      console.warn(`[Discord Retry] Tentativa ${attempt}/${maxRetries} falhou para URL ${url}. Erro: ${error.message}`);
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = attempt === 1 ? 500 : attempt === 2 ? 1500 : 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Prepara o payload e cabeçalhos usando form-data (compatível com Node.js/Electron main process)
export async function preparePayloadAndHeaders(
  message: string,
  activeToken: string,
  filePath?: string
): Promise<{ data: any; headers: Record<string, string> }> {
  const baseHeaders: Record<string, string> = {
    'Authorization': `Bot ${activeToken}`,
    'User-Agent': 'wOs-Premium-Agent-v2'
  };

  if (filePath && fs.existsSync(filePath)) {
    console.log(`[Discord] Preparando anexo multipart para: ${filePath}`);
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      console.log(`[Discord] Arquivo lido: ${fileName} (${fileBuffer.length} bytes)`);

      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({ content: message }), {
        contentType: 'application/json'
      });
      formData.append('files[0]', fileBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream',
        knownLength: fileBuffer.length
      });

      const formHeaders = formData.getHeaders();
      return {
        data: formData,
        headers: { ...baseHeaders, ...formHeaders }
      };
    } catch (err: any) {
      console.error(`[Discord] Erro ao preparar anexo ${filePath}:`, err.message);
    }
  }

  return {
    data: { content: message },
    headers: { ...baseHeaders, 'Content-Type': 'application/json' }
  };
}
