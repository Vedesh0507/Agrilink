import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IInvoiceDocument extends Document {
  organizationId?: mongoose.Types.ObjectId;
  buyerId?: string;
  invoiceNumber: string;
  type: 'SUBSCRIPTION' | 'ORDER_PLATFORM_FEE' | 'ORDER_SETTLEMENT';
  orderId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  subtotal: number;
  platformFee: number;
  tax: number; // GST (18%)
  total: number;
  currency: string;
  status: 'ISSUED' | 'PAID' | 'VOID' | 'REFUNDED';
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    hsnCode?: string;
  }>;
  billingDetails?: {
    name: string;
    gstin?: string;
    pan?: string;
    address?: string;
  };
  issuedAt: Date;
  paidAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    buyerId: { type: String, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['SUBSCRIPTION', 'ORDER_PLATFORM_FEE', 'ORDER_SETTLEMENT'],
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'BuyerSubscription', index: true },
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['ISSUED', 'PAID', 'VOID', 'REFUNDED'],
      default: 'ISSUED',
      index: true,
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        amount: { type: Number, required: true },
        hsnCode: { type: String },
      },
    ],
    billingDetails: {
      name: { type: String },
      gstin: { type: String },
      pan: { type: String },
      address: { type: String },
    },
    issuedAt: { type: Date, default: Date.now, index: true },
    paidAt: { type: Date },
    dueDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ organizationId: 1, status: 1, issuedAt: -1 });

export const Invoice: Model<IInvoiceDocument> =
  mongoose.models.Invoice || mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);
