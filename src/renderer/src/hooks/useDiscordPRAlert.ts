import { useState } from 'react';
import { PRQualityScore } from '../components/PRInsights';

export function useDiscordPRAlert() {
  const [sendingAlert, setSendingAlert] = useState(false);

  const getAuthorDiscordId = (authorName: string): string | undefined => {
    const name = authorName.toLowerCase();
    if (name.includes('lucas')) return '1173718136302874714';
    if (name.includes('murilo')) return '1488186535768625317';
    if (name.includes('wilkor') || name.includes('bete')) return '740928352835076246';
    if (name.includes('felipe')) return '604037074550784004';
    if (name.includes('leonardo')) return '644406299228110868';
    return undefined;
  };

  const getAlertKey = (pr: any): string => {
    const repo = pr.repo || 'wOs';
    return `${repo}/${pr.id}`;
  };

  const hasBeenNotified = (pr: any): boolean => {
    try {
      const sentList = JSON.parse(localStorage.getItem('wos:discord_alerts_sent') || '[]');
      return sentList.includes(getAlertKey(pr));
    } catch {
      return false;
    }
  };

  const markAsNotified = (pr: any) => {
    try {
      const sentList = JSON.parse(localStorage.getItem('wos:discord_alerts_sent') || '[]');
      const key = getAlertKey(pr);
      if (!sentList.includes(key)) {
        sentList.push(key);
        localStorage.setItem('wos:discord_alerts_sent', JSON.stringify(sentList));
      }
    } catch (err) {
      console.error('Erro ao registrar alerta enviado:', err);
    }
  };

  const sendAlert = async (pr: any, quality: PRQualityScore): Promise<{ success: boolean; title: string; message: string }> => {
    if (hasBeenNotified(pr)) {
      return {
        success: false,
        title: 'Alerta Já Enviado',
        message: `Uma notificação para o PR #${pr.id} já foi enviada anteriormente ao autor.`
      };
    }

    const discordId = getAuthorDiscordId(pr.author);
    if (!discordId) {
      return {
        success: false,
        title: 'Membro Não Mapeado',
        message: `Não foi possível associar o autor "${pr.author}" a um ID do Discord. Verifique suas configurações.`
      };
    }

    setSendingAlert(true);
    try {
      const isOptimal = quality.score >= 85;
      const emoji = isOptimal ? '✨' : '🚨';
      const typeLabel = isOptimal ? 'Parabéns!' : 'Alerta de Qualidade';
      const introduction = isOptimal 
        ? `Olá <@${discordId}>! Seu Pull Request no repositório **${pr.repo || 'wOs'}** atingiu o score máximo de qualidade **${quality.score}/100** (${quality.label})! Excelente trabalho! 🏆`
        : `Olá <@${discordId}>! Seu Pull Request no repositório **${pr.repo || 'wOs'}** está com score de qualidade **${quality.score}/100** (${quality.label}).`;

      const msg = `${emoji} *${typeLabel} de Pull Request (wOs)*\n\n` +
        `${introduction}\n\n` +
        `*PR*: **#${pr.id}** - \`${pr.title}\`\n\n` +
        (quality.issues.length > 0 ? `🔍 *Pontos de Atenção*:\n` + quality.issues.map(issue => `• ${issue}`).join('\n') + `\n\n` : '') +
        (quality.positives.length > 0 ? `✨ *Pontos Positivos*:\n` + quality.positives.map(pos => `• ${pos}`).join('\n') + `\n\n` : '') +
        (isOptimal 
          ? `Obrigado por manter os padrões de qualidade de elite no nosso ecossistema! 🚀`
          : `Por favor, dê uma olhada nesses pontos para mantermos o padrão de elite do projeto, amigão! 🚀`);

      const res = await (window as any).api.discord.send(msg, discordId);
      if (res.success) {
        markAsNotified(pr);
        return {
          success: true,
          title: 'Notificação Enviada!',
          message: `Mensagem privada enviada com sucesso no Discord para @${pr.author}! 📨`
        };
      } else {
        return {
          success: false,
          title: 'Falha no Envio',
          message: `Erro ao notificar via Discord: ${res.error}`
        };
      }
    } catch (err: any) {
      console.error('Erro ao notificar no Discord:', err);
      return {
        success: false,
        title: 'Erro Interno',
        message: err.message || 'Erro desconhecido ao processar notificação.'
      };
    } finally {
      setSendingAlert(false);
    }
  };

  return { sendAlert, sendingAlert, hasBeenNotified };
}
