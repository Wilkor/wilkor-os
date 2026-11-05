import { BrowserWindow } from 'electron';

let activeSteps: string[] = [];

/**
 * Limpa o histórico de passos do chat atual para iniciar um novo ciclo de streaming.
 */
export function clearChatLogs(): void {
  activeSteps = [];
}

/**
 * Envia um passo de atividade formatado como tag XML nativa do wOs para o chat.
 * O componente ThinkingBlock do frontend parseia isso automaticamente e exibe as caixinhas expansíveis.
 * 
 * @param type Tipo de ação ('read_file' | 'write_file' | 'patch_file' | 'command')
 * @param path Nome do arquivo, repositório ou recurso envolvido
 * @param description Explicação textual detalhada do que o processo está executando
 */
export function sendChatLog(
  type: 'read_file' | 'write_file' | 'patch_file' | 'command' | string,
  path?: string,
  description?: string
): void {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;

  let stepXml = '';
  if (!path && !description) {
    // Modo legibilidade genérica simplificada (compatibilidade retrógrada para chamadas com 1 argumento)
    stepXml = `<wos_action type="read_file" path="Workspace System">\n${type}\n</wos_action>`;
  } else {
    const actType = type as any;
    if (actType === 'command') {
      stepXml = `<wos_command>\n${description || ''}\n</wos_command>`;
    } else {
      stepXml = `<wos_action type="${actType}" path="${path || 'Workspace'}">\n${description || ''}\n</wos_action>`;
    }
  }

  activeSteps.push(stepXml);
  const fullLogsXml = activeSteps.join('\n\n');

  console.log(`[wOs Step Log] Added step: ${type} - ${path || 'Workspace'}`);
  win.webContents.send('chat:log', fullLogsXml);
}
