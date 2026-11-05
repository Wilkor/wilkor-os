import mongoose from 'mongoose';
import Store from 'electron-store';
import { getActiveUser } from './userPermissionDatabase';

const store = new Store(
  process.versions.electron 
    ? undefined 
    : ({ projectName: 'wilkor-os' } as any)
);

const DEFAULT_MONGODB_URI = "";
export interface IMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: any[];
  senderName?: string;
  senderEmoji?: string;
  senderColor?: string;
  isInvisible?: boolean;
}

export interface IConversation {
  id: string;
  title: string;
  lastUpdated: Date;
  messages: IMessage[];
  modelId?: string;
}

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  attachments: { type: Array, default: [] },
  senderName: { type: String },
  senderEmoji: { type: String },
  senderColor: { type: String },
  isInvisible: { type: Boolean }
});

const ConversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, default: 'Nova Conversa' },
  lastUpdated: { type: Date, default: Date.now },
  messages: [MessageSchema],
  modelId: { type: String },
  userId: { type: String }
});

export const ConversationModel = mongoose.model('Conversation', ConversationSchema, 'conversations');

// --- Analytics Snapshots ---
const AnalyticsSnapshotSchema = new mongoose.Schema({
  boardId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  stats: {
    progressPercent: Number,
    totalCommits: Number,
    bugRatio: Number,
    totalCards: Number,
    teamStats: [{
      name: String,
      done: Number,
      total: Number,
      commits: Number
    }]
  }
});

export const AnalyticsSnapshotModel = mongoose.model('AnalyticsSnapshot', AnalyticsSnapshotSchema, 'analytics_snapshots');

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const uri = (store.get('mongodbUri') as string) || DEFAULT_MONGODB_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.warn('⚠️ [wOs Database] MongoDB URI não configurada.');
      return;
    }
    await mongoose.connect(uri);
    console.log('✅ [wOs Database] MongoDB Conectado!');
  } catch (error) {
    console.error('❌ [wOs Database] Erro ao conectar no MongoDB:', error);
  }
}

export async function saveMessage(conversationId: string, message: any, modelId?: string) {
  await connectDB();
  const activeUser = getActiveUser();
  const userId = activeUser?.id;
  let conversation = await ConversationModel.findOne({ id: conversationId });
  const getCleanTitle = (content: string) => {
    return content.slice(0, 40) + (content.length > 40 ? '...' : '');
  };
  if (!conversation) {
    let title = 'Nova Conversa';
    if (message.role === 'user' && !message.isInvisible) {
      title = getCleanTitle(message.content);
    }
    conversation = new ConversationModel({
      id: conversationId,
      title: title,
      messages: [message],
      lastUpdated: new Date(),
      modelId,
      userId
    });
  } else {
    conversation.messages.push(message);
    conversation.lastUpdated = new Date();
    if (modelId) conversation.modelId = modelId;
    if (userId) conversation.userId = userId;
    const isGenericTitle = !conversation.title || 
                          conversation.title === 'Nova Conversa' || 
                          conversation.title.startsWith('Aja de forma proativa');
    if (isGenericTitle && message.role === 'user' && !message.isInvisible) {
      conversation.title = getCleanTitle(message.content);
    }
  }
  const saved = await conversation.save();
  console.log(`✅ [Database] Conversa salva: ${saved.title} (ID: ${saved.id})`);
  return saved;
}

export async function getConversations() {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = {};
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  const rawList = await ConversationModel.find(filter).sort({ lastUpdated: -1 }).lean();
  
  const mappedList = rawList.map((doc: any) => {
    return {
      id: doc.id || doc._id.toString(),
      title: doc.title || (doc.messages && doc.messages[0]?.content?.slice(0, 30)) || 'Conversa sem título',
      lastUpdated: doc.lastUpdated || doc.timestamp || new Date(),
      modelId: doc.modelId || 'auto'
    };
  });

  console.log(`🔍 [Database] Histórico carregado e mapeado: ${mappedList.length} conversas.`);
  return mappedList;
}

export async function getConversation(id: string) {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { 
    $or: [{ id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] 
  };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  const conv = await ConversationModel.findOne(filter).lean();
  return conv;
}

export async function deleteConversation(id: string) {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await ConversationModel.deleteOne(filter);
}

// --- Analytics Logic ---
export async function saveAnalyticsSnapshot(boardId: string, stats: any) {
  await connectDB();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Evita duplicatas: um snapshot por dia por board
  const existing = await AnalyticsSnapshotModel.findOne({
    boardId,
    timestamp: { $gte: today }
  });

  if (existing) {
    return { success: true, message: 'Snapshot already exists for today' };
  }

  const snapshot = new AnalyticsSnapshotModel({
    boardId,
    stats: {
      progressPercent: Number(stats.progressPercent),
      totalCommits: Number(stats.totalCommits),
      bugRatio: Number(stats.bugRatio),
      totalCards: Number(stats.totalCards),
      teamStats: (stats.topTrello || []).map((m: any) => ({
        name: m.name,
        done: Number(m.done || 0),
        total: Number(m.total || 0),
        commits: Number(m.commits || 0)
      }))
    }
  });
  
  const saved = await snapshot.save();
  console.log(`📊 [wOs Analytics] Snapshot salvo para o board ${boardId}`);
  return saved;
}

export async function getAnalyticsTrend(boardId: string) {
  await connectDB();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Busca o snapshot mais próximo de 7 dias atrás
  const oldSnapshot = await AnalyticsSnapshotModel.findOne({
    boardId,
    timestamp: { $lte: sevenDaysAgo }
  }).sort({ timestamp: -1 }).lean();

  if (!oldSnapshot) return null;

  return oldSnapshot.stats;
}

export * from './cronJobDatabase';
export * from './aiUsageDatabase';
