import OpenAI from 'openai';
import Store from 'electron-store';
import { getProjectRoot } from './fs';
import axios from 'axios';
import { join } from 'path';
import { BrowserWindow } from 'electron';
import * as fsPromises from 'fs/promises';

const store = new Store();

export async function generateImage(
  description: string,
  style?: string,
  outputFilename?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const root = getProjectRoot();
    if (!root) {
      return { success: false, error: 'Abra um projeto primeiro no workspace do wOs.' };
    }

    const openAIKey = (store as any).get('openAIKey') as string;
    const promptCompleto = style ? `${description}, no estilo ${style}` : description;

    let imageBuffer: Buffer | null = null;
    let methodUsed = '';

    if (openAIKey && openAIKey.trim().length > 0) {
      const startTime = Date.now();
      try {
        console.log(`[ImageGenerator] Tentando gerar imagem via OpenAI DALL-E 3...`);
        const openai = new OpenAI({ apiKey: openAIKey.trim() });
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: promptCompleto,
          n: 1,
          size: '1024x1024'
        });

        const imageUrl = response.data?.[0]?.url;
        if (imageUrl) {
          const downloadResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          imageBuffer = Buffer.from(downloadResponse.data);
          methodUsed = 'OpenAI DALL-E 3';
          
          const durationMs = Date.now() - startTime;
          // Registrar uso com sucesso
          const { logAIUsage } = await import('./aiUsageLogger');
          logAIUsage('dall-e-3', promptCompleto, `[Imagem gerada com sucesso]`, durationMs, true, 'Geração de Imagem').catch(() => null);
        }
      } catch (err: any) {
        console.error(
          `[ImageGenerator] Erro ao gerar imagem com OpenAI: ${err.message}. Fazendo fallback para Pollinations...`
        );
        const durationMs = Date.now() - startTime;
        const { logAIUsage } = await import('./aiUsageLogger');
        logAIUsage('dall-e-3', promptCompleto, err.message || 'Erro', durationMs, false, 'Geração de Imagem').catch(() => null);
      }
    }

    if (!imageBuffer) {
      console.log(`[ImageGenerator] Gerando imagem via Pollinations AI...`);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptCompleto)}`;
      const downloadResponse = await axios.get(url, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(downloadResponse.data);
      methodUsed = 'Pollinations AI (Fallback gratuito)';
    }

    const filename = outputFilename || `generated-image-${Date.now()}.png`;
    const destPath = join(root, filename);

    await fsPromises.writeFile(destPath, imageBuffer);

    // Notifica o frontend
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send('agent:fileWritten', { path: destPath, content: '' });
      win.webContents.send('agent:newActivity', {
        type: 'write_file',
        data: { path: destPath, content: `[Imagem gerada via ${methodUsed}]` }
      });
      // Também avisa para recarregar o workspace
      win.webContents.send('workspace:updated');
    }

    return { success: true, filePath: destPath };
  } catch (error: any) {
    console.error(`[ImageGenerator] Erro geral na geração de imagem:`, error);
    return { success: false, error: error.message };
  }
}
