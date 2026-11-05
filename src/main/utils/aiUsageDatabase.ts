import mongoose from 'mongoose';
import { connectDB } from './database';
import { getActiveUser, isMasterUser } from './userPermissionDatabase';

export interface IAIUsage {
  id: string;
  taskName: string;
  modelId: string;
  tokensInput: number;
  tokensOutput: number;
  costUSD: number;
  durationMs: number;
  timestamp: Date;
  success: boolean;
  userId?: string;
  userEmail?: string;
}

const AIUsageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  taskName: { type: String, required: true },
  modelId: { type: String, required: true },
  tokensInput: { type: Number, required: true },
  tokensOutput: { type: Number, required: true },
  costUSD: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, default: true },
  userId: { type: String },
  userEmail: { type: String }
});

export const AIUsageModel = mongoose.models.AIUsage || mongoose.model('AIUsage', AIUsageSchema, 'ai_usage');

export async function saveAIUsage(usage: any) {
  await connectDB();
  const activeUser = getActiveUser();
  if (activeUser) {
    usage.userId = activeUser.id;
    usage.userEmail = activeUser.email;
  }
  const doc = new AIUsageModel(usage);
  return await doc.save();
}

export async function getAIUsageReports() {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = {};
  if (activeUser && !isMasterUser(activeUser.email, activeUser.id)) {
    filter.userId = activeUser.id;
  }
  return await AIUsageModel.find(filter).sort({ timestamp: -1 }).lean();
}

export async function clearAIUsage() {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = {};
  if (activeUser && !isMasterUser(activeUser.email, activeUser.id)) {
    filter.userId = activeUser.id;
  }
  return await AIUsageModel.deleteMany(filter);
}
