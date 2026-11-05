import mongoose from 'mongoose';
import { connectDB } from './database';

const UserPermissionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  allowedTabs: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export const UserPermissionModel = mongoose.models.UserPermission || mongoose.model('UserPermission', UserPermissionSchema, 'user_permissions');

// Controle de sessão em memória do usuário ativo no backend do Electron
let activeUser: { id: string; email: string } | null = null;

export function setActiveUser(user: { id: string; email: string } | null) {
  activeUser = user;
  console.log(`👤 [wOs Session] Usuário ativo definido para: ${user ? `${user.email} (${user.id})` : 'Nenhum'}`);
}

export function getActiveUser() {
  return activeUser;
}

// Verifica se o e-mail ou o id pertence ao administrador master
export function isMasterUser(email: string, id: string): boolean {
  const masterEmail = 'wilkor.almeida@gmail.com';
  const masterId = '69fbc369036a60001cddd998';
  return email === masterEmail || id === masterId;
}

// Sincroniza usuário e cria registro se ele não existir
export async function syncUserPermissions(userId: string, email: string) {
  await connectDB();
  
  let record = await UserPermissionModel.findOne({ userId });
  
  // Se for o usuário master, garante aprovação e todas as abas por padrão
  const master = isMasterUser(email, userId);
  const defaultTabs = ['explorer', 'git', 'mcp', 'artifacts', 'pipeline', 'dashboard', 'agent_studio', 'chat'];
  
  if (!record) {
    record = new UserPermissionModel({
      userId,
      email,
      isApproved: master,
      allowedTabs: master ? defaultTabs : [],
      updatedAt: new Date()
    });
    await record.save();
    console.log(`✨ [wOs Permissions] Novo registro de permissão criado para ${email} (Aprovado: ${master})`);
  } else if (master && (!record.isApproved || record.allowedTabs.length < defaultTabs.length)) {
    // Garante que o master sempre tenha acesso a tudo mesmo se as permissões antigas estivessem desatualizadas
    record.isApproved = true;
    record.allowedTabs = defaultTabs;
    record.updatedAt = new Date();
    await record.save();
  }
  
  return record;
}

// Busca permissões do usuário logado
export async function getUserPermissions(userId: string) {
  await connectDB();
  const record = await UserPermissionModel.findOne({ userId }).lean();
  return record;
}

// Busca todos os usuários (painel de admin)
export async function adminGetUsers() {
  await connectDB();
  return await UserPermissionModel.find().sort({ email: 1 }).lean();
}

// Atualiza permissões de um usuário específico
export async function adminSaveUserPermissions(userId: string, permissions: { isApproved: boolean; allowedTabs: string[] }) {
  await connectDB();
  const res = await UserPermissionModel.updateOne(
    { userId },
    { 
      $set: { 
        isApproved: permissions.isApproved, 
        allowedTabs: permissions.allowedTabs,
        updatedAt: new Date() 
      } 
    }
  );
  console.log(`🛡️ [wOs Permissions] Permissões do usuário ${userId} atualizadas pelo Admin`);
  return res;
}
