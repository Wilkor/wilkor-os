import axios from 'axios';

/**
 * Resolve dinamicamente os membros do servidor (guild) do Discord via API e atualiza o dicionário de menções.
 * Mantém a modularidade do código e respeita o limite de 300 linhas do wOs (Regra 6).
 */
export async function resolveDynamicMembers(
  channelIds: string[],
  activeToken: string,
  fileMentions: Record<string, string>
): Promise<void> {
  try {
    console.log('[Discord] Iniciando resolução dinâmica de membros via API do Discord...');
    const firstChannelId = channelIds[0];
    if (!firstChannelId) return;

    const channelResponse = await axios.get(
      `https://discord.com/api/v10/channels/${firstChannelId}`,
      {
        headers: {
          'Authorization': `Bot ${activeToken}`,
          'User-Agent': 'wOs-Premium-Agent-v2'
        },
        timeout: 4000
      }
    );

    const guildId = channelResponse.data?.guild_id;
    if (guildId) {
      console.log(`[Discord] Resolvendo membros da Guild ${guildId}...`);
      const membersResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${guildId}/members?limit=100`,
        {
          headers: {
            'Authorization': `Bot ${activeToken}`,
            'User-Agent': 'wOs-Premium-Agent-v2'
          },
          timeout: 4000
        }
      );

      const rawMembers = membersResponse.data || [];
      console.log(`[Discord] ${rawMembers.length} membros carregados com sucesso via API.`);
      
      for (const m of rawMembers) {
        const user = m.user;
        if (user && user.id) {
          const userId = user.id;
          // Mapeia por username (ex: lucas_phelipe)
          if (user.username) {
            fileMentions[user.username.toLowerCase()] = userId;
          }
          // Mapeia por global_name (ex: Lucas Phelipe -> lucas phelipe, lucasphelipe)
          if (user.global_name) {
            const gName = user.global_name.toLowerCase();
            fileMentions[gName] = userId;
            fileMentions[gName.replace(/\s+/g, '')] = userId;
          }
          // Mapeia por apelido/nick do servidor (ex: Murilo -> murilo)
          if (m.nick) {
            const nickName = m.nick.toLowerCase();
            fileMentions[nickName] = userId;
            fileMentions[nickName.replace(/\s+/g, '')] = userId;
          }
        }
      }
    }
  } catch (e: any) {
    console.warn('[Discord] Resolução dinâmica de membros ignorada (usando fallback estático):', e.message || e);
  }
}
