import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IBuyerSubscriptionDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  planCode: 'FREE' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  autoRenew: boolean;
  monthlyRequirementsUsed: number;
  usagePeriodMonth: string; // YYYY-MM
  paymentProvider: 'NONE' | 'RAZORPAY' | 'CASHFREE' | 'MANUAL_COMPLIMENTARY' | 'INTERNAL_LEDGER';
  externalSubscriptionId?: string;
  externalCustomerId?: string;
  isComplimentary: boolean;
  complimentaryReason?: string;
  grantedByAdminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerSubscriptionSchema = new Schema<IBuyerSubscriptionDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
      index: true,
    },
    planCode: {
      type: String,
      enum: ['FREE', 'BUSINESS', 'ENTERPRISE'],
      default: 'FREE',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },
    autoRenew: { type: Boolean, default: true },
    monthlyRequirementsUsed: { type: Number, default: 0 },
    usagePeriodMonth: {
      type: String,
      default: () => new Date().toISOString().slice(0, 7),
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ['NONE', 'RAZORPAY', 'CASHFREE', 'MANUAL_COMPLIMENTARY', 'INTERNAL_LEDGER'],
      default: 'NONE',
    },
    externalSubscriptionId: { type: String, trim: true, index: true },
    externalCustomerId: { type: String, trim: true },
    isComplimentary: { type: Boolean, default: false },
    complimentaryReason: { type: String },
    grantedByAdminId: { type: String },
  },
  {
    timestamps: true,
  }
);

BuyerSubscriptionSchema.index({ organizationId: 1, status: 1 });

export const BuyerSubscription: Model<IBuyerSubscriptionDocument> =
  mongoose.models.BuyerSubscription ||
  mongoose.model<IBuyerSubscriptionDocument>('BuyerSubscription', BuyerSubscriptionSchema);
