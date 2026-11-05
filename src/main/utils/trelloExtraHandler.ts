import https from 'https';
import Store from 'electron-store';

const store = new Store();

function getTrelloCredentials() {
  const apiKey = (store.get('trelloApiKey') as string) || '';
  const token = (store.get('trelloToken') as string) || '';
  return { apiKey: apiKey.trim(), token: token.trim() };
}

export async function addTrelloCardAttachment(
  cardId: string,
  url: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token,
    url: url
  });

  const reqUrl = `https://api.trello.com/1/cards/${cardId}/attachments?${queryParams.toString()}`;

  return new Promise((resolve) => {
    const req = https.request(reqUrl, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json.message || data });
          }
        } catch (e: any) {
          resolve({ success: false, error: `Erro ao processar resposta: ${e.message}` });
        }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.end();
  });
}

export async function getTrelloBoardCustomFields(
  boardId: string
): Promise<{ success: boolean; customFields?: any[]; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const reqUrl = `https://api.trello.com/1/boards/${boardId}/customFields?key=${apiKey}&token=${token}`;

  return new Promise((resolve) => {
    https
      .get(reqUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
              resolve({ success: true, customFields: json });
            } else {
              resolve({ success: false, error: data });
            }
          } catch (e: any) {
            resolve({ success: false, error: e.message });
          }
        });
      })
      .on('error', (e) => resolve({ success: false, error: e.message }));
  });
}

export async function updateTrelloCardCustomFieldItem(
  cardId: string,
  customFieldId: string,
  value: { number?: string; text?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { apiKey, token } = getTrelloCredentials();
  if (!apiKey || !token) {
    return { success: false, error: 'Trello API Key ou Token não configurados.' };
  }

  const queryParams = new URLSearchParams({
    key: apiKey,
    token: token
  });

  const reqUrl = `https://api.trello.com/1/cards/${cardId}/customField/${customFieldId}/item?${queryParams.toString()}`;
  const bodyData = JSON.stringify({ value });

  return new Promise((resolve) => {
    const req = https.request(
      reqUrl,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve({ success: true, data: json });
            } else {
              resolve({ success: false, error: json.message || data });
            }
          } catch (e: any) {
            resolve({ success: false, error: `Erro de parsing: ${e.message}` });
          }
        });
      }
    );

    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(bodyData);
    req.end();
  });
}
