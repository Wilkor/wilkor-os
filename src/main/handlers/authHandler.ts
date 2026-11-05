import { ipcMain } from 'electron';
import { 
  setActiveUser, 
  getActiveUser,
  syncUserPermissions, 
  getUserPermissions, 
  adminGetUsers, 
  adminSaveUserPermissions,
  isMasterUser
} from '../utils/userPermissionDatabase';

export function registerAuthHandlers() {
  // Sincroniza usuário e recarrega os servidores MCP correspondentes
  ipcMain.handle('auth:setUser', async (_event, user) => {
    try {
      if (user) {
        const userId = user.id || user._id;
        let email = user.email;

        // Fallback especial para o usuario master caso venha sem email
        const masterId = '69fbc369036a60001cddd998';
        const masterEmail = 'wilkor.almeida@gmail.com';
        if (userId === masterId && !email) {
          email = masterEmail;
        }

        if (!userId || !email) {
          console.warn('[AuthHandler] auth:setUser chamado com dados de usuario incompletos:', user);
          setActiveUser(null);
          return { success: false, error: 'Dados de usuário incompletos (id ou email ausentes)' };
        }

        setActiveUser({ id: userId, email });
        const perms = await syncUserPermissions(userId, email);
        
        // Recarrega os servidores MCP do usuário logado
        const mcpManager = (global as any).mcpManager;
        if (mcpManager && typeof mcpManager.reloadUserServers === 'function') {
          mcpManager.reloadUserServers().catch((err: any) => {
            console.error('[AuthHandler] Falha ao recarregar servidores MCP:', err);
          });
        }
        
        return { success: true, permissions: perms };
      } else {
        setActiveUser(null);
        // Para os servidores MCP se o usuário deslogar
        const mcpManager = (global as any).mcpManager;
        if (mcpManager && typeof mcpManager.shutdown === 'function') {
          mcpManager.shutdown().catch((err: any) => {
            console.error('[AuthHandler] Falha ao parar servidores MCP no logout:', err);
          });
        }
        return { success: true };
      }
    } catch (error: any) {
      console.error('[AuthHandler] Erro no auth:setUser:', error);
      return { success: false, error: error.message };
    }
  });

  // Retorna permissões do usuário logado
  ipcMain.handle('auth:getPermissions', async () => {
    try {
      const activeUser = getActiveUser();
      if (!activeUser) {
        return { success: false, error: 'Nenhum usuário ativo' };
      }
      
      const permissions = await getUserPermissions(activeUser.id);
      return { success: true, permissions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Retorna todos os usuários cadastrados e permissões (restrito ao master)
  ipcMain.handle('auth:adminGetUsers', async () => {
    try {
      const activeUser = getActiveUser();
      if (!activeUser || !isMasterUser(activeUser.email, activeUser.id)) {
        return { success: false, error: 'Acesso negado: apenas o administrador master' };
      }
      
      const users = await adminGetUsers();
      return { success: true, users };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Salva permissões de um usuário específico (restrito ao master)
  ipcMain.handle('auth:adminSaveUserPermissions', async (_event, { userId, permissions }) => {
    try {
      const activeUser = getActiveUser();
      if (!activeUser || !isMasterUser(activeUser.email, activeUser.id)) {
        return { success: false, error: 'Acesso negado: apenas o administrador master' };
      }
      
      await adminSaveUserPermissions(userId, permissions);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
