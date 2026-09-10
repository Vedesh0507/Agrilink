import mongoose, { Schema, Model, Document } from 'mongoose';
import { QualityGrade, ProduceStatus } from '@/types';

export interface IProduceListingDocument extends Document {
  farmerId: string;
  farmerName: string;
  organizationName?: string;
  product: string;
  variety?: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  expectedPricePerUnit: number;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  availableFromDate: Date;
  expiryDate?: Date;
  status: ProduceStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProduceListingSchema = new Schema<IProduceListingDocument>(
  {
    farmerId: { type: String, required: true, index: true },
    farmerName: { type: String, required: true, trim: true },
    organizationName: { type: String, trim: true },
    product: { type: String, required: true, trim: true, index: true },
    variety: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'kg', trim: true },
    qualityGrade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C'],
      required: true,
      index: true,
    },
    expectedPricePerUnit: { type: Number, required: true, min: 0.1 },
    location: { type: String, required: true, trim: true, index: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    availableFromDate: { type: Date, required: true, index: true },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ['AVAILABLE', 'COMMITTED', 'DEPLETED', 'INACTIVE'],
      default: 'AVAILABLE',
      index: true,
    },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

ProduceListingSchema.index({ product: 1, status: 1, location: 1 });

export const ProduceListing: Model<IProduceListingDocument> =
  mongoose.models.ProduceListing ||
  mongoose.model<IProduceListingDocument>('ProduceListing', ProduceListingSchema);
