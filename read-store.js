import Store from 'electron-store';
const store = new Store();
console.log('--- 📦 Configurações Atuais do Electron Store (wOs) ---');
console.log('discordChannelId:', store.get('discordChannelId'));
console.log('discordBotToken:', store.get('discordBotToken'));
console.log('discordMentionsMap:', store.get('discordMentionsMap'));
console.log('-------------------------------------------------------');
