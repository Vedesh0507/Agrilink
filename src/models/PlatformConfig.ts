import mongoose, { Schema, Model, Document } from 'mongoose';
import { IPlatformConfig } from '@/types';

export interface IPlatformConfigDocument extends Omit<IPlatformConfig, '_id'>, Document {}

const PlatformConfigSchema = new Schema<IPlatformConfigDocument>(
  {
    platformCommissionPercent: { type: Number, default: 2.5 },
    minOrderValue: { type: Number, default: 5000 },
    disputeWindowHours: { type: Number, default: 48 },
    featureFlags: {
      multiSupplierMatching: { type: Boolean, default: true },
      whatsAppAlerts: { type: Boolean, default: true },
      onlineEscrow: { type: Boolean, default: false },
      autoKycApproval: { type: Boolean, default: false },
      logisticsTracking: { type: Boolean, default: true },
    },
    supportedCommodities: {
      type: [String],
      default: ['Tomato', 'Chilly', 'Onion', 'Potato', 'Rice', 'Maize', 'Cotton', 'Turmeric'],
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformConfig: Model<IPlatformConfigDocument> =
  mongoose.models.PlatformConfig || mongoose.model<IPlatformConfigDocument>('PlatformConfig', PlatformConfigSchema);
