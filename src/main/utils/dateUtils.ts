/**
 * Retorna uma string informativa com a data e a hora atuais do sistema operacional.
 */
export function getSystemDateTimePrompt(): string {
  const now = new Date();
  
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return `[Data e Hora Local do Sistema: ${dateStr}, às ${timeStr}]`;
}
