import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserRole } from '@/types';

export interface IAuditLogDocument extends Document {
  actorId: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  reason?: string;
  requestId?: string;
  status?: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: String, required: true, index: true },
    actorEmail: { type: String, trim: true },
    actorRole: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    details: { type: Schema.Types.Mixed },
    beforeState: { type: Schema.Types.Mixed },
    afterState: { type: Schema.Types.Mixed },
    reason: { type: String, trim: true },
    requestId: { type: String, index: true },
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
