import mongoose, { Schema, Model, Document } from 'mongoose';
import { QualityGrade, RequirementStatus } from '@/types';

export interface IBuyerRequirementDocument extends Document {
  buyerId: string;
  buyerName: string;
  organizationName?: string;
  product: string;
  variety?: string;
  requiredQuantity: number;
  fulfilledQuantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  targetPricePerUnit: number;
  deliveryLocation: string;
  requiredDeliveryDate: Date;
  status: RequirementStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerRequirementSchema = new Schema<IBuyerRequirementDocument>(
  {
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true, trim: true },
    organizationName: { type: String, trim: true },
    product: { type: String, required: true, trim: true, index: true },
    variety: { type: String, trim: true },
    requiredQuantity: { type: Number, required: true, min: 1 },
    fulfilledQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'kg', trim: true },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C'],
      required: true,
      index: true,
    },
    targetPricePerUnit: { type: Number, required: true, min: 0.1 },
    deliveryLocation: { type: String, required: true, trim: true, index: true },
    requiredDeliveryDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

BuyerRequirementSchema.index({ product: 1, status: 1, deliveryLocation: 1 });

export const BuyerRequirement: Model<IBuyerRequirementDocument> =
  mongoose.models.BuyerRequirement ||
  mongoose.model<IBuyerRequirementDocument>('BuyerRequirement', BuyerRequirementSchema);
