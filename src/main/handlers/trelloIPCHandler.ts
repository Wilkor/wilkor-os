import { ipcMain } from 'electron';
import * as trello from '../utils/trelloHandler';
import * as trelloExtra from '../utils/trelloExtraHandler';
import * as techDb from '../utils/techPendingDatabase';

export function registerTrelloIPCHandlers() {
  ipcMain.handle('pipeline:createTrelloCard', async (_event, options) => {
    const res = await trello.createTrelloCard(options);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:getTrelloLists', async (_event, boardId) => {
    const res = await trello.getTrelloLists(boardId);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:getTrelloBoards', async () => {
    const res = await trello.getTrelloBoards();
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:getTrelloCards', async (_event, listId) => {
    const res = await trello.getTrelloCards(listId);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:getTrelloCardDetails', async (_event, cardId) => {
    const res = await trello.getTrelloCardDetails(cardId);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:createTrelloCardChecklist', async (_event, { cardId, name, options }) => {
    const res = await trello.createTrelloCardChecklist(cardId, name, options);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:createTrelloChecklistItem', async (_event, { checklistId, name }) => {
    const res = await trello.createTrelloChecklistItem(checklistId, name);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:addTrelloCardAttachment', async (_event, { cardId, url }) => {
    const res = await trelloExtra.addTrelloCardAttachment(cardId, url);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:getTrelloBoardCustomFields', async (_event, boardId) => {
    const res = await trelloExtra.getTrelloBoardCustomFields(boardId);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:updateTrelloCardCustomFieldItem', async (_event, { cardId, customFieldId, value }) => {
    const res = await trelloExtra.updateTrelloCardCustomFieldItem(cardId, customFieldId, value);
    return JSON.parse(JSON.stringify(res));
  });

  // --- Tech Pending Handlers ---
  ipcMain.handle('pipeline:saveTechPending', async (_event, pending) => {
    const res = await techDb.saveTechPending(pending);
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:getTechPendings', async () => {
    const res = await techDb.getTechPendings();
    return JSON.parse(JSON.stringify(res));
  });

  ipcMain.handle('pipeline:deleteTechPending', async (_event, id) => {
    const res = await techDb.deleteTechPending(id);
    return JSON.parse(JSON.stringify(res));
  });
}


