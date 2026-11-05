import { sendDiscordMessage } from './discordHandler';
import path from 'path';

/**
 * Normaliza o nome do autor do commit para tentar bater com o mapeamento de menções do Discord
 */
const getMentionName = (gitAuthor: string): string => {
  const name = gitAuthor.toLowerCase();
  if (name.includes('wilkor')) return 'wilkor';
  if (name.includes('lucas')) return 'lucas';
  if (name.includes('murilo')) return 'murilo';
  if (name.includes('felipe')) return 'felipe';
  if (name.includes('leonardo')) return 'leonardo';
  return name.replace(/\s+/g, '');
};

/**
 * Verifica se o repositório é o Gateway ou o BFF (relação com a Regra 5)
 */
const getRepoCategory = (repoPath: string): { label: string; isCritical: boolean } => {
  const name = path.basename(repoPath).toLowerCase();
  if (name.includes('gateway')) {
    return { label: 'GATEWAY (Produção/BFF/SSH)', isCritical: true };
  }
  if (name.includes('bff')) {
    return { label: 'BFF (Microserviço Crítico)', isCritical: true };
  }
  return { label: name.toUpperCase(), isCritical: false };
};

/**
 * Notifica um commit local criado no wOs
 */
export async function notifyCommit(
  repoPath: string,
  hash: string,
  branch: string,
  message: string,
  author: string
): Promise<any> {
  const repoInfo = getRepoCategory(repoPath);
  const mentionName = getMentionName(author);
  const shortHash = hash.substring(0, 7);

  const discordMsg = [
    `💻 **[wOs Git] - Novo Commit Realizado**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📂 **Repositório:** \`${repoInfo.label}\``,
    `🌿 **Branch:** \`${branch}\``,
    `👤 **Autor:** @${mentionName}`,
    `🔑 **Commit:** \`${shortHash}\` - *${message.trim()}*`,
    repoInfo.isCritical
      ? `🚨 **Atenção:** Repositório crítico de produção detectado! Realize a verificação via SSH após o deploy (Regra 5).`
      : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Enviado via wilkorOs Desktop Agent*`
  ].filter(line => line.length > 0).join('\n');

  console.log(`[Discord Notify] Enviando notificação de commit para @${mentionName}...`);
  return await sendDiscordMessage(discordMsg);
}

/**
 * Notifica um Push bem sucedido para o Bitbucket remoto
 */
export async function notifyPush(
  repoPath: string,
  branch: string,
  latestCommitHash: string,
  author: string
): Promise<any> {
  const repoInfo = getRepoCategory(repoPath);
  const mentionName = getMentionName(author);
  const shortHash = latestCommitHash.substring(0, 7);

  const discordMsg = [
    `🚀 **[wOs Git] - Código Enviado (Push)**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📂 **Repositório:** \`${repoInfo.label}\``,
    `🌿 **Branch:** \`${branch}\``,
    `👤 **Autor:** @${mentionName}`,
    `🔗 **Último Commit:** \`${shortHash}\``,
    repoInfo.isCritical
      ? `⚙️ **Deploy Automatizado Iniciado:** Preparando acesso via SSH para checagem de logs do servidor.`
      : `✅ Sincronizado com sucesso com o remoto no Bitbucket!`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Enviado via wilkorOs Desktop Agent*`
  ].filter(line => line.length > 0).join('\n');

  console.log(`[Discord Notify] Enviando notificação de push para o repositório ${repoInfo.label}...`);
  return await sendDiscordMessage(discordMsg);
}

/**
 * Notifica uma ação de Pull Request (Aprovação, Rejeição, etc.)
 */
export async function notifyPRAction(
  repoPath: string,
  prId: string,
  action: string
): Promise<any> {
  const repoInfo = getRepoCategory(repoPath);
  
  const actionLabels: Record<string, string> = {
    'APPROVE': '✅ Aprovado (Approved)',
    'DECLINE': '❌ Rejeitado/Declinado (Declined)',
    'MERGE': '📦 Mesclado/Mergeado (Merged)',
    'UNAPPROVE': '🔄 Aprovação Removida'
  };

  const statusLabel = actionLabels[action.toUpperCase()] || action;

  const discordMsg = [
    `🌐 **[wOs Bitbucket] - Pull Request Atualizado**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📂 **Repositório:** \`${repoInfo.label}\``,
    `🆔 **PR:** \`#${prId}\``,
    `⚡ **Ação:** **${statusLabel}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Enviado via wilkorOs Desktop Agent*`
  ].join('\n');

  console.log(`[Discord Notify] Enviando notificação de PR #${prId} com status ${action}...`);
  return await sendDiscordMessage(discordMsg);
}

/**
 * Notifica um comentário postado em um PR do Bitbucket
 */
export async function notifyPRComment(
  repoPath: string,
  prId: string,
  text: string
): Promise<any> {
  const repoInfo = getRepoCategory(repoPath);
  const truncatedText = text.length > 100 ? `${text.substring(0, 100)}...` : text;

  const discordMsg = [
    `💬 **[wOs Bitbucket] - Novo Comentário no PR**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📂 **Repositório:** \`${repoInfo.label}\``,
    `🆔 **PR:** \`#${prId}\``,
    `📝 **Comentário:** *"${truncatedText.trim()}"*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Enviado via wilkorOs Desktop Agent*`
  ].join('\n');

  console.log(`[Discord Notify] Enviando notificação de comentário no PR #${prId}...`);
  return await sendDiscordMessage(discordMsg);
}
