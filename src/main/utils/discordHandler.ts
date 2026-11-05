import Store from 'electron-store';
import fs from 'fs';
import path from 'path';
import { resolveDynamicMembers } from './discordMemberResolver';
import { levenshteinDistance } from './stringUtils';
import { postWithRetry, preparePayloadAndHeaders } from './discordHelper';

const store = new Store(
  process.versions.electron 
    ? undefined 
    : ({ projectName: 'wilkor-os' } as any)
);

/**
 * Envia uma mensagem em formato rico/texto com suporte a anexos para múltiplos canais do Discord.
 * @param message O texto da mensagem a ser enviada.
 * @param channelId ID do canal ou lista de IDs (opcional).
 * @param token Token do Bot (opcional).
 * @param filePath Caminho opcional do arquivo para anexo (opcional).
 */
export async function sendDiscordMessage(
  message: string,
  channelId?: string,
  token?: string,
  filePath?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Auto-correção resiliente: se filePath não foi fornecido mas há um caminho absoluto local no texto da mensagem
    if (!filePath) {
      const markdownLinkRegex = /\[[^\]]*\]\(([^)]+\.(?:pdf|png|jpg|jpeg|txt|log|zip|json|js|ts|html))\)/i;
      const parenthesisRegex = /\(([^)]+\.(?:pdf|png|jpg|jpeg|txt|log|zip|json|js|ts|html))\)/i;
      const plainPathRegex = /([a-zA-Z]:\\[^\s]+\.(?:pdf|png|jpg|jpeg|txt|log|zip|json|js|ts|html))/i;

      let detectedPath = '';
      let match = message.match(markdownLinkRegex);
      if (match) {
        detectedPath = match[1];
      } else {
        match = message.match(parenthesisRegex);
        if (match && (match[1].includes(':\\') || match[1].includes(':/') || match[1].startsWith('/'))) {
          detectedPath = match[1];
        } else {
          match = message.match(plainPathRegex);
          if (match) {
            detectedPath = match[1];
          }
        }
      }

      if (detectedPath && fs.existsSync(detectedPath)) {
        console.log(`[Discord Resiliência] Detectado arquivo local existente no texto da mensagem: ${detectedPath}. Definindo como filePath.`);
        filePath = detectedPath;
        message = message.replace(/\[[^\]]*\]\([^)]+\)/g, '*[Arquivo anexado abaixo]*');
        message = message.replace(detectedPath, '');
        message = message.replace(/\(\s*\)/g, '');
      }
    }

    const activeToken = (token || store.get('discordBotToken') as string || '').trim();
    if (!activeToken) {
      throw new Error('Configuração do Discord incompleta (Token de Bot ausente).');
    }

    let fileMentions: Record<string, string> = {};

    // 1. Tenta carregar o mapeamento do arquivo discord-mentions.json na raiz (Fallback estático)
    try {
      const configPath = path.join(process.cwd(), 'discord-mentions.json');
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (parsed && typeof parsed === 'object') {
          console.log('[Discord] Mapeamento de menções atualizado a partir do arquivo discord-mentions.json');
          fileMentions = { ...fileMentions, ...parsed };
        }
      }
    } catch (e: any) {
      console.warn('[Discord] Falha ao ler arquivo discord-mentions.json:', e.message || e);
    }

    // 2. Resolução Dinâmica Antecipada de Membros via API do Discord.
    // Para mapear aliases em channelId antes de filtrá-los, precisamos carregar os membros.
    // Usamos um ID numérico de canal inicial para puxar os membros do Discord:
    // a. Do canal padrão do store (discordChannelId)
    // b. Ou de qualquer ID numérico passado em channelId (ex: "12345678,wilkor")
    const storeDefaultChannel = ((store.get('discordChannelId') as string) || '').split(',').map(id => id.trim()).find(id => id.length > 0 && /^\d+$/.test(id) && id !== '123456789012345678');
    const inputNumericChannel = (channelId || '').split(',').map(id => id.trim()).find(id => id.length > 0 && /^\d+$/.test(id) && id !== '123456789012345678');
    const resolutionChannelId = inputNumericChannel || storeDefaultChannel;

    if (resolutionChannelId) {
      console.log(`[Discord] Canal para resolução dinâmica identificado: ${resolutionChannelId}. Carregando membros...`);
      await resolveDynamicMembers([resolutionChannelId], activeToken, fileMentions);
    } else {
      console.log('[Discord] Nenhum canal numérico encontrado para resolução dinâmica. Usando apenas fallback estático.');
    }

    // 3. RESOLVE ALIASES/NOMES EM channelId PARA SEUS RESPECTIVOS IDS DE DISCORD (com suporte a busca aproximada/fuzzy)
    let resolvedChannelId = channelId || '';
    if (resolvedChannelId && !/^\d+$/.test(resolvedChannelId)) {
      const parts = resolvedChannelId.split(',').map(part => {
        const cleaned = part.trim().toLowerCase().replace('@', '');
        
        if (fileMentions[cleaned]) {
          return fileMentions[cleaned];
        }
        
        const keys = Object.keys(fileMentions);
        for (const key of keys) {
          const dist = levenshteinDistance(cleaned, key);
          if (cleaned.includes(key) || key.includes(cleaned) || dist <= 2) {
            console.log(`[Discord Fuzzy] Mapeado de "${part}" para "${key}" (ID: ${fileMentions[key]})`);
            return fileMentions[key];
          }
        }
        return part.trim();
      });
      resolvedChannelId = parts.join(',');
    }

    const storeChannels = ((store.get('discordChannelId') as string) || '').split(',').map(id => id.trim()).filter(id => id.length > 0 && /^\d+$/.test(id) && id !== '123456789012345678');
    const argChannels = (resolvedChannelId || '').split(',').map(id => id.trim()).filter(id => id.length > 0 && /^\d+$/.test(id) && id !== '123456789012345678');

    let channelIds: string[] = [];
    if (argChannels.length > 0) {
      channelIds = argChannels;
    } else if (storeChannels.length > 0) {
      channelIds = [...storeChannels];
    }

    if (channelIds.length === 0) {
      throw new Error('Nenhum Channel ID configurado ou fornecido.');
    }

    let processedMessage = message;

    // 4. Realiza a substituição de cada menção cadastrada no dicionário unificado
    try {
      for (const [name, id] of Object.entries(fileMentions)) {
        const mentionTag = `<@${id}>`;
        const regex = new RegExp(`@${name}\\b`, 'gi');
        processedMessage = processedMessage.replace(regex, mentionTag);
      }
    } catch (e: any) {
      console.warn('[Discord] Falha ao substituir menções na mensagem:', e.message || e);
    }

    console.log(`[Discord] Enviando mensagem para ${channelIds.length} canal(is) do Discord...`);

    const results = await Promise.all(
      channelIds.map(async (id) => {
        try {
          const url = `https://discord.com/api/v10/channels/${id}/messages`;
          console.log(`[Discord] Tentando enviar direto no canal/ID ${id}...`);
          const { data, headers } = await preparePayloadAndHeaders(processedMessage, activeToken, filePath);
          
          const response = await postWithRetry(
            url,
            data,
            {
              headers,
              timeout: 15000
            }
          );
          console.log(`✅ [Discord] Mensagem enviada com sucesso para o canal ${id}!`);
          return { channelId: id, success: true, data: response.data };
        } catch (error: any) {
          try {
            console.log(`[Discord] Canal ${id} inacessível ou é ID de usuário. Tentando criar DM individual privada...`);
            const dmResponse = await postWithRetry(
              `https://discord.com/api/v10/users/@me/channels`,
              { recipient_id: id },
              {
                headers: {
                  'Authorization': `Bot ${activeToken}`,
                  'Content-Type': 'application/json',
                  'User-Agent': 'wOs-Premium-Agent-v2'
                },
                timeout: 6000
              }
            );
            const dmChannelId = dmResponse.data?.id;
            if (dmChannelId) {
              console.log(`[Discord] Canal de DM individual aberto com sucesso. Enviando mensagem privada...`);
              const dmMessageUrl = `https://discord.com/api/v10/channels/${dmChannelId}/messages`;
              const { data, headers } = await preparePayloadAndHeaders(processedMessage, activeToken, filePath);
              
              const response = await postWithRetry(
                dmMessageUrl,
                data,
                {
                  headers,
                  timeout: 15000
                }
              );
              console.log(`✅ [Discord] Mensagem privada individual enviada com sucesso para o usuário ${id}!`);
              return { channelId: id, success: true, data: response.data, isDM: true };
            } else {
              throw new Error('ID do canal de DM ausente na resposta da API.');
            }
          } catch (dmError: any) {
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            const dmErrorMsg = dmError.response?.data?.message || dmError.response?.data || dmError.message;
            console.error(`❌ [Discord Error] Falha no canal direto: ${errorMsg} e falha no envio de DM privada: ${dmErrorMsg}`);
            return { channelId: id, success: false, error: `Erro no canal: ${errorMsg} | Erro na DM: ${dmErrorMsg}` };
          }
        }
      })
    );

    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      if (failures.length === results.length) {
        throw new Error(`Falha ao enviar para todos os canais do Discord. Primeiro erro: ${failures[0].error}`);
      }
      return {
        success: true,
        data: results,
        error: `Enviado com sucesso, mas falhou em ${failures.length} canal(is): ${failures.map(f => `${f.channelId}: ${f.error}`).join('; ')}`
      };
    }

    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
