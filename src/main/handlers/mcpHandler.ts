import { ipcMain } from 'electron';

export function registerMCPHandlers(mcpManager: any) {
  ipcMain.handle('mcp:listServers', async () => {
    if (!mcpManager) return [];
    return mcpManager.listServers();
  });

  ipcMain.handle('mcp:listPresets', async () => {
    if (!mcpManager) return [];
    return await mcpManager.listPresets();
  });

  ipcMain.handle('mcp:addServer', async (_event, config) => {
    if (!mcpManager) return { success: false, error: 'MCP Manager not available' };
    return await mcpManager.addServer(config);
  });

  ipcMain.handle('mcp:removeServer', async (_event, id) => {
    if (!mcpManager) return { success: false, error: 'MCP Manager not available' };
    return await mcpManager.removeServer(id);
  });

  ipcMain.handle('mcp:toggleServer', async (_event, { id, enabled }) => {
    if (!mcpManager) return { success: false, error: 'MCP Manager not available' };
    return await mcpManager.toggleServer(id, enabled);
  });

  ipcMain.handle('mcp:getTools', async (_event, serverId) => {
    if (!mcpManager) return [];
    return await mcpManager.getTools(serverId);
  });

  ipcMain.handle('mcp:respondToTool', async (_event, { requestId, approved }) => {
    if (!mcpManager) return { success: false, error: 'MCP Manager not available' };
    return await mcpManager.respondToTool(requestId, approved);
  });

  ipcMain.handle('mcp:removePreset', async (_event, id) => {
    if (!mcpManager) return { success: false, error: 'MCP Manager not available' };
    return await mcpManager.removePreset(id);
  });

  ipcMain.handle('mcp:savePreset', async (_event, config) => {
    if (!mcpManager) return { success: false, error: 'MCP Manager not available' };
    return await mcpManager.savePreset(config);
  });
}
