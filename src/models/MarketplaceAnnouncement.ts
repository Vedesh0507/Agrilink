import mongoose, { Schema, Model, Document } from 'mongoose';
import { IMarketplaceAnnouncement } from '@/types';

export interface IMarketplaceAnnouncementDocument extends Omit<IMarketplaceAnnouncement, '_id'>, Document {}

const MarketplaceAnnouncementSchema = new Schema<IMarketplaceAnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    targetAudience: { type: String, enum: ['ALL', 'FARMER', 'BUYER'], default: 'ALL', index: true },
    targetDistrict: { type: String, trim: true, index: true },
    targetCommodity: { type: String, trim: true, index: true },
    sentBy: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const MarketplaceAnnouncement: Model<IMarketplaceAnnouncementDocument> =
  mongoose.models.MarketplaceAnnouncement ||
  mongoose.model<IMarketplaceAnnouncementDocument>('MarketplaceAnnouncement', MarketplaceAnnouncementSchema);
