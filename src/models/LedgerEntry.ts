import mongoose, { Schema, Model, Document } from 'mongoose';
import { ILedgerEntry } from '@/types';

export interface ILedgerEntryDocument extends Omit<ILedgerEntry, '_id'>, Document {}

const LedgerEntrySchema = new Schema<ILedgerEntryDocument>(
  {
    entryNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    orderNumber: { type: String },
    type: {
      type: String,
      enum: ['PAYMENT_RECORDED', 'SUPPLIER_PAYOUT', 'PLATFORM_COMMISSION', 'TAX_GST', 'REFUND'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['RECORDED', 'SETTLED', 'PENDING', 'RECONCILED'],
      default: 'RECORDED',
      index: true,
    },
    payerId: { type: String },
    payerName: { type: String },
    payeeId: { type: String },
    payeeName: { type: String },
    paymentMethod: { type: String, default: 'BANK_TRANSFER' },
    providerReference: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const LedgerEntry: Model<ILedgerEntryDocument> =
  mongoose.models.LedgerEntry || mongoose.model<ILedgerEntryDocument>('LedgerEntry', LedgerEntrySchema);
