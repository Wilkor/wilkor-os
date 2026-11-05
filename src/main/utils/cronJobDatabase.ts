import mongoose from 'mongoose';
import { connectDB } from './database';
import { getActiveUser } from './userPermissionDatabase';

export interface ICronJob {
  id: string;
  name: string;
  cronExpr: string;
  prompt: string;
  modelId: string;
  enabled: boolean;
  agentIds?: string[];
  lastRun?: Date | null;
  nextRun?: Date | null;
  createdAt: Date;
}

const CronJobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cronExpr: { type: String, required: true },
  prompt: { type: String, required: true },
  modelId: { type: String, default: 'auto' },
  enabled: { type: Boolean, default: true },
  agentIds: { type: [String], default: [] },
  lastRun: { type: Date },
  nextRun: { type: Date },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String }
});

export const CronJobModel = mongoose.models.CronJob || mongoose.model('CronJob', CronJobSchema, 'cron_jobs');

export async function saveCronJob(job: any) {
  await connectDB();
  const activeUser = getActiveUser();
  if (activeUser) {
    job.userId = activeUser.id;
  }
  const filter: any = { id: job.id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  const existing = await CronJobModel.findOne(filter);
  if (existing) {
    Object.assign(existing, job);
    return await existing.save();
  } else {
    const newJob = new CronJobModel(job);
    return await newJob.save();
  }
}

export async function getCronJobs() {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = {};
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await CronJobModel.find(filter).sort({ createdAt: -1 }).lean();
}

export async function deleteCronJob(id: string) {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await CronJobModel.deleteOne(filter);
}

export async function toggleCronJob(id: string, enabled: boolean) {
  await connectDB();
  const activeUser = getActiveUser();
  const filter: any = { id };
  if (activeUser) {
    filter.userId = activeUser.id;
  }
  return await CronJobModel.updateOne(filter, { $set: { enabled } });
}
