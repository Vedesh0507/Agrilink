import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISubscriptionPlanDocument extends Document {
  name: string;
  code: 'FREE' | 'BUSINESS' | 'ENTERPRISE';
  description: string;
  priceMonthly: number;
  currency: string;
  billingInterval: 'MONTHLY' | 'ANNUAL';
  features: {
    maxMonthlyRequirements: number; // -1 for unlimited
    maxOrganizationUsers: number;
    advancedMatching: boolean;
    advancedAnalytics: boolean;
    negotiationWorkspace: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    erpIntegration: boolean;
    dedicatedManager: boolean;
  };
  transactionFeePercentage: number;
  enabled: boolean;
  isPopular?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      enum: ['FREE', 'BUSINESS', 'ENTERPRISE'],
      required: true,
      unique: true,
      index: true,
    },
    description: { type: String, required: true },
    priceMonthly: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    billingInterval: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL'],
      default: 'MONTHLY',
    },
    features: {
      maxMonthlyRequirements: { type: Number, default: 5 },
      maxOrganizationUsers: { type: Number, default: 1 },
      advancedMatching: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      negotiationWorkspace: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      erpIntegration: { type: Boolean, default: false },
      dedicatedManager: { type: Boolean, default: false },
    },
    transactionFeePercentage: { type: Number, default: 2.0 },
    enabled: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan: Model<ISubscriptionPlanDocument> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlanDocument>('SubscriptionPlan', SubscriptionPlanSchema);
