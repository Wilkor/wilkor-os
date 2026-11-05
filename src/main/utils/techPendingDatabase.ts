import mongoose from 'mongoose';
import { connectDB } from './database';
import { getActiveUser } from './userPermissionDatabase';

export interface ITechPending {
  id: string;
  card: any; // Armazena o objeto do TrelloCard
  taskType: 'feat' | 'fix' | 'outros';
  customFolderName?: string;
  prdContent: string;
  requirements: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const TechPendingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  card: { type: Object, required: true },
  taskType: { type: String, enum: ['feat', 'fix', 'outros'], required: true },
  customFolderName: { type: String },
  prdContent: { type: String, required: true },
  requirements: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: String }
});

// Registrar o modelo na coleção tech_pendings
export const TechPendingModel = mongoose.models.TechPending || mongoose.model('TechPending', TechPendingSchema, 'tech_pendings');

export async function saveTechPending(pending: any) {
  await connectDB();
  const activeUser = getActiveUser();
  const userId = activeUser?.id;
  
  if (activeUser) {
    pending.userId = userId;
  }
  
  const filter: any = { id: pending.id };
  if (activeUser) {
    filter.userId = userId;
  }
  
  const existing = await TechPendingModel.findOne(filter);
  if (existing) {
    Object.assign(existing, pending);
    existing.updatedAt = new Date();
    return await existing.save();
  } else {
    const newPending = new TechPendingModel({
      ...pending,
      status: pending.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId
    });
    return await newPending.save();
  }
}
 
export async function getTechPendings() {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { status: { $ne: 'completed' } };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await TechPendingModel.find(filter).sort({ createdAt: -1 }).lean();
}
 
export async function deleteTechPending(id: string) {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await TechPendingModel.deleteOne(filter);
}
 
export async function updateTechPendingStatus(id: string, status: 'pending' | 'in_progress' | 'completed') {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await TechPendingModel.updateOne(filter, { $set: { status, updatedAt: new Date() } });
}
