import { ipcMain } from 'electron';
import { modelManager } from '../models/manager';
import * as db from '../utils/database';
import * as agentDb from '../utils/agentDatabase';
import { getSystemDateTimePrompt } from '../utils/dateUtils';

async function checkForAgentMention(messages: any[]): Promise<{ matchedAgent: any; updatedMessages: any[] } | null> {
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user') return null;

  try {
    const agents = await agentDb.getAgents();
    const content = lastMsg.content.toLowerCase();
    
    for (const agent of agents) {
      const agentTag = `@${agent.name.replace(/\s+/g, '')}`.toLowerCase();
      if (content.includes(agentTag)) {
        const updatedMessages = [...messages];
        const systemMsgIndex = updatedMessages.findIndex(m => m.role === 'system');
        const dateTimePrompt = getSystemDateTimePrompt();
        const agentSystemContent = `${agent.systemPrompt}\n\n${dateTimePrompt}\n\nVocê é o agente "${agent.name}" com o papel de "${agent.role}". Você foi mencionado no chat principal e deve responder diretamente ao usuário.`;
        
        if (systemMsgIndex !== -1) {
          updatedMessages[systemMsgIndex] = {
            ...updatedMessages[systemMsgIndex],
            content: agentSystemContent
          };
        } else {
          updatedMessages.unshift({ role: 'system', content: agentSystemContent });
        }
        
        return { matchedAgent: agent, updatedMessages };
      }
    }
  } catch (err) {
    console.error('[ChatHandler] Erro ao buscar menções a agentes:', err);
  }
  
  return null;
}

export function registerChatHandlers(getWin: () => any) {
  ipcMain.handle('chat:send', async (_event, { modelId, messages, conversationId, taskName }) => {
    try {
      modelManager.refreshProviders();
      
      const mentionResult = await checkForAgentMention(messages);
      const activeModelId = mentionResult ? mentionResult.matchedAgent.modelId : modelId;
      const targetMessages = mentionResult ? mentionResult.updatedMessages : messages;

      // Salva a mensagem do usuário se tiver conversationId
      if (conversationId) {
        const lastMsg = messages[messages.length - 1];
        await db.saveMessage(conversationId, {
          role: lastMsg.role,
          content: lastMsg.content,
          attachments: lastMsg.attachments,
          isInvisible: lastMsg.isInvisible,
          timestamp: new Date()
        }, activeModelId);
      }

      let response;
      const taskLabel = taskName || (conversationId ? `Chat: ${conversationId}` : 'Chat Principal');
      if (mentionResult) {
        response = await modelManager.handleAgentDirectChat(activeModelId, targetMessages, undefined, `Menção: ${mentionResult.matchedAgent.name}`);
      } else {
        response = await modelManager.handleChat(modelId, messages, undefined, taskLabel);
      }
      
      // Salva a resposta da IA
      if (conversationId && response) {
        const msgToSave: any = {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        if (mentionResult) {
          msgToSave.senderName = mentionResult.matchedAgent.name;
          msgToSave.senderEmoji = mentionResult.matchedAgent.emoji;
          msgToSave.senderColor = mentionResult.matchedAgent.color;
        }
        await db.saveMessage(conversationId, msgToSave, activeModelId);
      }

      return { success: true, content: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('chat:stream', async (_event, { modelId, messages, conversationId, taskName }) => {
    const mainWindow = getWin();
    if (!mainWindow) return { success: false };
    
    try {
      const mentionResult = await checkForAgentMention(messages);
      const activeModelId = mentionResult ? mentionResult.matchedAgent.modelId : modelId;
      const targetMessages = mentionResult ? mentionResult.updatedMessages : messages;

      // Salva a mensagem do usuário
      if (conversationId) {
        const lastMsg = messages[messages.length - 1];
        await db.saveMessage(conversationId, {
          role: lastMsg.role,
          content: lastMsg.content,
          attachments: lastMsg.attachments,
          isInvisible: lastMsg.isInvisible,
          timestamp: new Date()
        }, activeModelId);
      }

      let fullResponse = '';
      const taskLabel = taskName || (conversationId ? `Chat: ${conversationId}` : 'Chat Principal');
      if (mentionResult) {
        await modelManager.handleAgentDirectChat(activeModelId, targetMessages, (chunk: string) => {
          fullResponse += chunk;
          mainWindow.webContents.send('chat:chunk', chunk);
        }, `Menção: ${mentionResult.matchedAgent.name}`);
      } else {
        await modelManager.handleChat(modelId, messages, (chunk: string) => {
          fullResponse += chunk;
          mainWindow.webContents.send('chat:chunk', chunk);
        }, taskLabel);
      }

      // Salva a resposta completa da IA
      if (conversationId && fullResponse) {
        const msgToSave: any = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date()
        };
        if (mentionResult) {
          msgToSave.senderName = mentionResult.matchedAgent.name;
          msgToSave.senderEmoji = mentionResult.matchedAgent.emoji;
          msgToSave.senderColor = mentionResult.matchedAgent.color;
        }
        await db.saveMessage(conversationId, msgToSave, activeModelId);
      }

      mainWindow.webContents.send('chat:done', { success: true, text: fullResponse });
      return { success: true };
    } catch (error: any) {
      mainWindow.webContents.send('chat:done', { success: false, error: error.message });
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('chat:stop', () => {
    modelManager.stopChat();
    return { success: true };
  });

  ipcMain.handle('chat:list-conversations', async () => {
    try {
      const list = await db.getConversations();
      return { success: true, conversations: list };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('chat:get-conversation', async (_event, id) => {
    try {
      const conversation = await db.getConversation(id);
      return { success: true, conversation };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('chat:delete-conversation', async (_event, id) => {
    try {
      await db.deleteConversation(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('chat:transcribe', async (_event, buffer) => {
    try {
      const { transcribeAudio } = await import('../models/whisper');
      const Store = (await import('electron-store')).default;
      const store = new Store();
      const apiKey = (store as any).get('openAIKey');
      if (!apiKey) throw new Error('Chave da OpenAI não configurada.');
      const text = await transcribeAudio(apiKey, Buffer.from(buffer), 'user-voice.webm');
      return { success: true, text };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('chat:speak', async (_event, text) => {
    try {
      const { generateSpeech } = await import('../models/tts');
      const Store = (await import('electron-store')).default;
      const store = new Store();
      const apiKey = (store as any).get('openAIKey');
      if (!apiKey) throw new Error('Chave da OpenAI não configurada.');
      
      const buffer = await generateSpeech(apiKey, text);
      return { success: true, buffer };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
