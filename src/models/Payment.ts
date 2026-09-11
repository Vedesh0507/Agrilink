import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPaymentDocument extends Document {
  organizationId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  purpose: 'ORDER_ESCROW' | 'SUBSCRIPTION_FEE' | 'TRANSACTION_FEE' | 'DISPUTE_SETTLEMENT';
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'CASHFREE' | 'INTERNAL_LEDGER' | 'OFFLINE_NEFT';
  providerPaymentId?: string;
  providerOrderId?: string;
  providerSignature?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  paidAt?: Date;
  failureReason?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'BuyerSubscription',
      index: true,
    },
    purpose: {
      type: String,
      enum: ['ORDER_ESCROW', 'SUBSCRIPTION_FEE', 'TRANSACTION_FEE', 'DISPUTE_SETTLEMENT'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    provider: {
      type: String,
      enum: ['RAZORPAY', 'CASHFREE', 'INTERNAL_LEDGER', 'OFFLINE_NEFT'],
      default: 'INTERNAL_LEDGER',
      index: true,
    },
    providerPaymentId: { type: String, trim: true, index: true },
    providerOrderId: { type: String, trim: true },
    providerSignature: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: { type: String, default: 'BANK_TRANSFER' },
    paidAt: { type: Date },
    failureReason: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPaymentDocument> =
  mongoose.models.Payment || mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
