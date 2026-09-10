import mongoose, { Schema, Model, Document } from 'mongoose';
import { IMatchItem, ICompatibilityBreakdown } from '@/types';

export interface IMatchDocument extends Document {
  requirementId: mongoose.Types.ObjectId;
  buyerId: string;
  matchType: 'SINGLE_SUPPLIER' | 'AGGREGATED_SUPPLY';
  totalScore: number;
  matchedQuantity: number;
  targetQuantity: number;
  isFullyFulfilled: boolean;
  suppliers: IMatchItem[];
  compatibilityBreakdown: ICompatibilityBreakdown;
  status: 'PROPOSED' | 'QUOTED' | 'ORDERED' | 'DISMISSED';
  createdAt: Date;
  updatedAt: Date;
}

const MatchItemSchema = new Schema(
  {
    produceListingId: { type: Schema.Types.ObjectId, ref: 'ProduceListing', required: true },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    availableQuantity: { type: Number, required: true },
    allocatedQuantity: { type: Number, required: true },
    qualityGrade: { type: String, required: true },
    expectedPrice: { type: Number, required: true },
    location: { type: String, required: true },
    distanceKm: { type: Number },
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatchDocument>(
  {
    requirementId: { type: Schema.Types.ObjectId, ref: 'BuyerRequirement', required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    matchType: {
      type: String,
      enum: ['SINGLE_SUPPLIER', 'AGGREGATED_SUPPLY'],
      required: true,
      index: true,
    },
    totalScore: { type: Number, required: true, min: 0, max: 100 },
    matchedQuantity: { type: Number, required: true },
    targetQuantity: { type: Number, required: true },
    isFullyFulfilled: { type: Boolean, default: false },
    suppliers: [MatchItemSchema],
    compatibilityBreakdown: {
      productScore: { type: Number, required: true },
      quantityScore: { type: Number, required: true },
      qualityScore: { type: Number, required: true },
      locationScore: { type: Number, required: true },
      dateScore: { type: Number, required: true },
      priceScore: { type: Number, required: true },
      explanation: {
        product: { type: String },
        quantity: { type: String },
        quality: { type: String },
        location: { type: String },
        date: { type: String },
        price: { type: String },
      },
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'QUOTED', 'ORDERED', 'DISMISSED'],
      default: 'PROPOSED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Match: Model<IMatchDocument> =
  mongoose.models.Match || mongoose.model<IMatchDocument>('Match', MatchSchema);
