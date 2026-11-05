import axios from 'axios';

/**
 * Busca informações detalhadas de um canal e sua respectiva Guild (canais textuais e membros).
 * Mantém a modularidade do wOs e respeita o limite de 300 linhas de código.
 */
export async function fetchDiscordChannelAndGuildInfo(
  channelId: string,
  token: string
): Promise<any> {
  const firstChannelId = channelId.split(',')[0]?.trim();
  if (!firstChannelId) throw new Error('Nenhum ID de canal válido fornecido.');

  const channelResponse = await axios.get(
    `https://discord.com/api/v10/channels/${firstChannelId}`,
    {
      headers: { 'Authorization': `Bot ${token}`, 'User-Agent': 'wOs-Premium-Agent-v2' },
      timeout: 4000
    }
  );

  const guildId = channelResponse.data?.guild_id;
  const channelName = channelResponse.data?.name || 'Desconhecido';

  if (!guildId) {
    return {
      channelId: firstChannelId,
      channelName,
      isDM: true,
      error: 'Não foi possível encontrar o servidor associado (pode ser uma DM privada).'
    };
  }

  // Busca canais e membros em paralelo para performance premium
  const [membersResponse, channelsResponse] = await Promise.all([
    axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=100`,
      {
        headers: { 'Authorization': `Bot ${token}`, 'User-Agent': 'wOs-Premium-Agent-v2' },
        timeout: 4000
      }
    ),
    axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: { 'Authorization': `Bot ${token}`, 'User-Agent': 'wOs-Premium-Agent-v2' },
        timeout: 4000
      }
    )
  ]);

  const rawMembers = membersResponse.data || [];
  const membersList = rawMembers.map((m: any) => {
    const user = m.user || {};
    return {
      username: user.username || '',
      globalName: user.global_name || '',
      nickname: m.nick || '',
      id: user.id || ''
    };
  });

  const rawChannels = channelsResponse.data || [];
  const textChannels = rawChannels
    .filter((c: any) => c.type === 0) // 0 = GUILD_TEXT
    .map((c: any) => ({
      id: c.id,
      name: c.name
    }));

  return {
    channelId: firstChannelId,
    channelName,
    guildId,
    totalMembers: membersList.length,
    members: membersList,
    availableTextChannels: textChannels
  };
}
