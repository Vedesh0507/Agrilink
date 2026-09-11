import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISubscriptionEventDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  eventType:
    | 'SUBSCRIPTION_CREATED'
    | 'PLAN_UPGRADED'
    | 'PLAN_DOWNGRADED'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'SUBSCRIPTION_CANCELLED'
    | 'SUBSCRIPTION_SUSPENDED'
    | 'COMPLIMENTARY_GRANTED';
  provider: 'INTERNAL' | 'RAZORPAY' | 'CASHFREE' | 'ADMIN';
  externalEventId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const SubscriptionEventSchema = new Schema<ISubscriptionEventDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'BuyerSubscription',
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['INTERNAL', 'RAZORPAY', 'CASHFREE', 'ADMIN'],
      default: 'INTERNAL',
      index: true,
    },
    externalEventId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

SubscriptionEventSchema.index({ organizationId: 1, eventType: 1, timestamp: -1 });

export const SubscriptionEvent: Model<ISubscriptionEventDocument> =
  mongoose.models.SubscriptionEvent ||
  mongoose.model<ISubscriptionEventDocument>('SubscriptionEvent', SubscriptionEventSchema);
