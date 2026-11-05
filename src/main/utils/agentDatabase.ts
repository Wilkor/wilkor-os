import mongoose from 'mongoose';
import { connectDB } from './database';
import { IAgent, IAgentSession, IAgentMessage } from '../../shared/types';
import { getActiveUser } from './userPermissionDatabase';

const AgentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  systemPrompt: { type: String, required: true },
  modelId: { type: String, required: true, default: 'gpt-4o-mini' },
  emoji: { type: String, required: true, default: '🤖' },
  color: { type: String, required: true, default: '#A855F7' },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String }
});

const AgentMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  agentId: { type: String }, // undefined se for usuário humano
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  senderEmoji: { type: String, required: true },
  senderColor: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  thought: { type: String },
  toolCalls: { type: Array, default: [] }
});

const AgentTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: String, required: true },
  category: { type: String, enum: ['front', 'back', 'database', 'security'], required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const AgentSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, default: 'Nova Discussão de Agentes' },
  agentIds: [{ type: String }],
  messages: [AgentMessageSchema],
  status: { type: String, enum: ['idle', 'running', 'paused', 'concluded'], default: 'idle' },
  activeAgentId: { type: String },
  lastUpdated: { type: Date, default: Date.now },
  maxRounds: { type: Number, default: 20 },
  stats: {
    startedAt: { type: Date },
    totalRounds: { type: Number, default: 0 },
    totalChars: { type: Number, default: 0 },
    estimatedTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 }
  },
  tasks: [AgentTaskSchema],
  repoPath: { type: String },
  trelloCardId: { type: String },
  trelloCardName: { type: String },
  userId: { type: String }
});

export const AgentModel = mongoose.model('Agent', AgentSchema, 'agents');
export const AgentSessionModel = mongoose.model('AgentSession', AgentSessionSchema, 'agent_sessions');

// CRUD Agentes
export async function getAgents(): Promise<IAgent[]> {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = {};
  if (activeUser) {
    filter.$or = [{ userId: activeUser.id }, { userId: { $exists: false } }, { userId: null }];
  }
  return await AgentModel.find(filter).sort({ createdAt: -1 }).lean() as any;
}

export async function saveAgent(agent: any): Promise<void> {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id: agent.id };
  if (activeUser) {
    filter.userId = activeUser.id;
    agent.userId = activeUser.id;
  }
  const existing = await AgentModel.findOne(filter);
  if (existing) {
    Object.assign(existing, agent);
    await existing.save();
  } else {
    const newAgent = new AgentModel(agent);
    await newAgent.save();
  }
}

export async function deleteAgent(id: string): Promise<void> {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  await AgentModel.deleteOne(filter);
}

// CRUD Sessões
export async function getAgentSessions(): Promise<IAgentSession[]> {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = {};
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await AgentSessionModel.find(filter).sort({ lastUpdated: -1 }).lean() as any;
}

export async function getAgentSession(id: string): Promise<IAgentSession | null> {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await AgentSessionModel.findOne(filter).lean() as any;
}

function sanitizeSessionDates(session: any) {
  if (session.lastUpdated && typeof session.lastUpdated === 'string') {
    session.lastUpdated = new Date(session.lastUpdated);
  }
  if (session.stats) {
    if (session.stats.startedAt && typeof session.stats.startedAt === 'string') {
      session.stats.startedAt = new Date(session.stats.startedAt);
    }
  }
  if (session.messages && Array.isArray(session.messages)) {
    for (const msg of session.messages) {
      if (msg.timestamp && typeof msg.timestamp === 'string') {
        msg.timestamp = new Date(msg.timestamp);
      }
    }
  }
  if (session.tasks && Array.isArray(session.tasks)) {
    for (const task of session.tasks) {
      if (task.createdAt && typeof task.createdAt === 'string') {
        task.createdAt = new Date(task.createdAt);
      }
    }
  }
}

function cleanSubdocumentIds(session: any) {
  if (session.messages && Array.isArray(session.messages)) {
    for (const msg of session.messages) {
      delete msg._id;
    }
  }
  if (session.tasks && Array.isArray(session.tasks)) {
    for (const task of session.tasks) {
      delete task._id;
    }
  }
}

export async function saveAgentSession(session: any): Promise<void> {
  await connectDB();
  const activeUser = getActiveUser();
  if (activeUser) {
    session.userId = activeUser.id;
  }
  const sessionCopy = JSON.parse(JSON.stringify(session));
  sanitizeSessionDates(sessionCopy);
  cleanSubdocumentIds(sessionCopy);
  const { _id, ...updateData } = sessionCopy;
  const filter: any = { id: sessionCopy.id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  try {
    await AgentSessionModel.updateOne(
      filter,
      { $set: { ...updateData, lastUpdated: new Date() } },
      { upsert: true }
    );
  } catch (mongooseError: any) {
    console.warn('[Database] Mongoose falhou ao salvar sessão, tentando via driver nativo:', mongooseError.message);
    await AgentSessionModel.collection.updateOne(
      filter,
      { $set: { ...updateData, lastUpdated: new Date() } },
      { upsert: true }
    );
  }
}

export async function deleteAgentSession(id: string): Promise<void> {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  await AgentSessionModel.deleteOne(filter);
}

// Adiciona uma mensagem ao histórico e atualiza a sessão
export async function addSessionMessage(sessionId: string, message: IAgentMessage): Promise<void> {
  await connectDB();
  await AgentSessionModel.updateOne(
    { id: sessionId },
    { 
      $push: { messages: message },
      $set: { lastUpdated: new Date() }
    }
  );
}

// Trunca as mensagens da sessão após um ID de mensagem (para o fluxo de ir e voltar / re-run)
export async function truncateSessionMessages(sessionId: string, messageId: string): Promise<void> {
  await connectDB();
  const session = await AgentSessionModel.findOne({ id: sessionId });
  if (!session) return;
  
  const msgIndex = session.messages.findIndex((m: any) => m.id === messageId);
  if (msgIndex === -1) return;

  // Remove todas as mensagens estritamente após a mensagem selecionada
  session.messages = session.messages.slice(0, msgIndex + 1) as any;
  session.lastUpdated = new Date();
  await session.save();
}
