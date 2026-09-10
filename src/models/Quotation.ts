import mongoose, { Schema, Model, Document } from 'mongoose';
import { QuotationStatus, QualityGrade, ICounterOffer } from '@/types';

export interface IQuotationDocument extends Document {
  quotationNumber: string;
  requirementId?: mongoose.Types.ObjectId;
  matchId?: mongoose.Types.ObjectId;
  buyerId: string;
  buyerName: string;
  supplierId: string;
  supplierName: string;
  product: string;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  initialPrice: number;
  currentAgreedPrice: number;
  deliveryLocation: string;
  deliveryDate: Date;
  status: QuotationStatus;
  counterHistory: ICounterOffer[];
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CounterOfferSchema = new Schema<ICounterOffer>(
  {
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['FARMER', 'BUYER', 'ADMIN'], required: true },
    senderName: { type: String, required: true },
    proposedPrice: { type: Number, required: true },
    quantity: { type: Number },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotationDocument>(
  {
    quotationNumber: { type: String, required: true, unique: true, index: true },
    requirementId: { type: Schema.Types.ObjectId, ref: 'BuyerRequirement', index: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    supplierId: { type: String, required: true, index: true },
    supplierName: { type: String, required: true },
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    qualityGrade: { type: String, required: true },
    initialPrice: { type: Number, required: true },
    currentAgreedPrice: { type: Number, required: true },
    deliveryLocation: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'SENT', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'REQUESTED',
      index: true,
    },
    counterHistory: [CounterOfferSchema],
    validUntil: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

export const Quotation: Model<IQuotationDocument> =
  mongoose.models.Quotation || mongoose.model<IQuotationDocument>('Quotation', QuotationSchema);
