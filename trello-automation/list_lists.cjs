const https = require('https');

const API_KEY = process.env.TRELLO_API_KEY || '';
const TOKEN = process.env.TRELLO_TOKEN || '';
const BOARD_SHORT_ID = process.env.TRELLO_BOARD_ID || 'BkpmBluG';

const url = `https://api.trello.com/1/boards/${BOARD_SHORT_ID}/lists?key=${API_KEY}&token=${TOKEN}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const lists = JSON.parse(data);
      if (Array.isArray(lists)) {
        lists.forEach(l => console.log(`[${l.name}] ID: ${l.id}`));
      } else {
        console.log('Error:', data);
      }
    } catch (e) {
      console.log('Parsing error:', e.message);
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
