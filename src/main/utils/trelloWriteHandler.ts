import https from 'https';
import Store from 'electron-store';

const store = new Store();

export interface TrelloCardOptions {
  name: string;
  desc: string;
  idList: string;
  pos?: 'top' | 'bottom';
}

function getTrelloCredentials() {
  const apiKey = (store.get('trelloApiKey') as string) || '';
  const token = (store.get('trelloToken') as string) || '';
  return { apiKey: apiKey.trim(), token: token.trim() };
}

export async function createTrelloCard(options: TrelloCardOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    ...options as any
  });

  const url = `https://api.trello.com/1/cards?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: `Erro ao processar resposta do Trello: ${e.message}` });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: `Erro de rede no Trello: ${e.message}` });
    });

    req.end();
  });
}

export async function updateTrelloCard(cardId: string, options: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    ...options
  });

  const url = `https://api.trello.com/1/cards/${cardId}?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(url, { method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    req.end();
  });
}

export async function addTrelloCardComment(cardId: string, text: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    text: text
  });

  const url = `https://api.trello.com/1/cards/${cardId}/actions/comments?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    req.end();
  });
}

export async function createTrelloCardChecklist(
  cardId: string, 
  name: string, 
  extraOptions?: { idBoard?: string; idChecklistSource?: string; dsc?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    idCard: cardId,
    name: name,
    ...(extraOptions?.idBoard ? { idBoard: extraOptions.idBoard } : {}),
    ...(extraOptions?.idChecklistSource ? { idChecklistSource: extraOptions.idChecklistSource } : {}),
    ...(extraOptions?.dsc ? { dsc: extraOptions.dsc } : {})
  });

  const url = `https://api.trello.com/1/checklists?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    req.end();
  });
}

export async function createTrelloChecklistItem(checklistId: string, name: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    name: name,
    checked: 'false'
  });

  const url = `https://api.trello.com/1/checklists/${checklistId}/checkItems?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    req.end();
  });
}

export async function updateTrelloChecklistItem(cardId: string, checkItemId: string, state: 'complete' | 'incomplete'): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    state: state
  });

  const url = `https://api.trello.com/1/cards/${cardId}/checkItem/${checkItemId}?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(url, { method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
    req.end();
  });
}
