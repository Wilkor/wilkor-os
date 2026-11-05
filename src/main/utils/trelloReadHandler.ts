import https from 'https';
import Store from 'electron-store';

const store = new Store();

function getTrelloCredentials() {
  const apiKey = (store.get('trelloApiKey') as string) || '';
  const token = (store.get('trelloToken') as string) || '';
  return { apiKey: apiKey.trim(), token: token.trim() };
}

export async function getTrelloLists(boardId: string): Promise<{ success: boolean; lists?: any[]; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${apiKey}&token=${token}&t=${Date.now()}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const lists = JSON.parse(data);
          if (Array.isArray(lists)) {
            resolve({ success: true, lists });
          } else {
            resolve({ success: false, error: data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
  });
}

export async function getTrelloBoards(): Promise<{ success: boolean; boards?: any[]; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const url = `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=name,id&t=${Date.now()}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const boards = JSON.parse(data);
          if (Array.isArray(boards)) {
            resolve({ success: true, boards });
          } else {
            resolve({ success: false, error: data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
  });
}

export async function getTrelloCards(listId: string): Promise<{ success: boolean; cards?: any[]; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const url = `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${token}&fields=name,desc,labels,due,url,shortUrl&actions=createCard&members=true&limit=1000&t=${Date.now()}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const cards = JSON.parse(data);
          if (Array.isArray(cards)) {
            resolve({ success: true, cards });
          } else {
            resolve({ success: false, error: data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
  });
}

export async function getTrelloCardDetails(cardId: string): Promise<{ success: boolean; card?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const url = `https://api.trello.com/1/cards/${cardId}?checklists=all&fields=name,desc,labels,idList,url&actions=createCard&key=${apiKey}&token=${token}&t=${Date.now()}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, card: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
  });
}
