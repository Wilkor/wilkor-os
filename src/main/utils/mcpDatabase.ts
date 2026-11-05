import mongoose from 'mongoose';

export interface IMCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string | undefined>;
  encryptedEnv?: string;
  enabled: boolean;
  icon?: string;
  description?: string;
  isPreset: boolean;
}

const MCPServerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['stdio', 'websocket'], required: true },
  command: { type: String },
  args: { type: [String], default: [] },
  url: { type: String },
  env: { type: Map, of: String, default: {} },
  encryptedEnv: { type: String },
  enabled: { type: Boolean, default: true },
  icon: { type: String },
  description: { type: String },
  isPreset: { type: Boolean, default: false },
  userId: { type: String }
});

MCPServerSchema.index({ id: 1, isPreset: 1, userId: 1 }, { unique: true });

export const MCPServerModel = mongoose.models.MCPServer || mongoose.model('MCPServer', MCPServerSchema, 'mcp_servers');
