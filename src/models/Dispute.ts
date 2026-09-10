import mongoose, { Schema, Model, Document } from 'mongoose';
import { IDispute } from '@/types';

export interface IDisputeDocument extends Omit<IDispute, '_id'>, Document {}

const DisputeSchema = new Schema<IDisputeDocument>(
  {
    disputeNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String },
    raisedById: { type: String, required: true, index: true },
    raisedByName: { type: String, required: true },
    raisedByRole: { type: String, enum: ['FARMER', 'BUYER', 'ADMIN'], required: true },
    counterPartyId: { type: String, required: true, index: true },
    counterPartyName: { type: String, required: true },
    reason: {
      type: String,
      enum: ['QUALITY_MISMATCH', 'QUANTITY_SHORTFALL', 'TRANSIT_DAMAGE', 'PAYMENT_ISSUE', 'OTHER'],
      required: true,
    },
    claimedAmount: { type: Number, required: true },
    evidencePhotos: [{ type: String }],
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'OPEN',
      index: true,
    },
    resolutionNotes: { type: String },
    settlementAmount: { type: Number, default: 0 },
    resolvedById: { type: String },
    resolvedByName: { type: String },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Dispute: Model<IDisputeDocument> =
  mongoose.models.Dispute || mongoose.model<IDisputeDocument>('Dispute', DisputeSchema);
