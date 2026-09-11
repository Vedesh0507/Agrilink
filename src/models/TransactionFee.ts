import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ITransactionFeeDocument extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  organizationId?: mongoose.Types.ObjectId;
  buyerId: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  taxAmount: number; // 18% GST on platform fee
  netPlatformRevenue: number;
  supplierPayableAmount: number;
  status: 'CALCULATED' | 'HELD_IN_ESCROW' | 'COLLECTED' | 'REFUNDED' | 'WAIVED';
  notes?: string;
  finalizedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionFeeSchema = new Schema<ITransactionFeeDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    buyerId: { type: String, required: true, index: true },
    grossAmount: { type: Number, required: true },
    feePercentage: { type: Number, required: true },
    feeAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true, default: 0 },
    netPlatformRevenue: { type: Number, required: true },
    supplierPayableAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['CALCULATED', 'HELD_IN_ESCROW', 'COLLECTED', 'REFUNDED', 'WAIVED'],
      default: 'CALCULATED',
      index: true,
    },
    notes: { type: String },
    finalizedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

TransactionFeeSchema.index({ organizationId: 1, createdAt: -1 });

export const TransactionFee: Model<ITransactionFeeDocument> =
  mongoose.models.TransactionFee ||
  mongoose.model<ITransactionFeeDocument>('TransactionFee', TransactionFeeSchema);
