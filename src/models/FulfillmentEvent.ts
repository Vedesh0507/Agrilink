import mongoose, { Schema, Model, Document } from 'mongoose';
import { FulfillmentStage, UserRole } from '@/types';

export interface IFulfillmentEventDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  stage: FulfillmentStage;
  title: string;
  description: string;
  actorId?: string;
  actorRole?: UserRole;
  timestamp: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FulfillmentEventSchema = new Schema<IFulfillmentEventDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    stage: {
      type: String,
      enum: ['ORDER_CONFIRMED', 'PRODUCE_PREPARED', 'QUALITY_VERIFIED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    actorId: { type: String },
    actorRole: { type: String, enum: ['FARMER', 'BUYER', 'ADMIN'] },
    timestamp: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const FulfillmentEvent: Model<IFulfillmentEventDocument> =
  mongoose.models.FulfillmentEvent ||
  mongoose.model<IFulfillmentEventDocument>('FulfillmentEvent', FulfillmentEventSchema);
