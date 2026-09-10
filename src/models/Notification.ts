import mongoose, { Schema, Model, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'MATCH' | 'QUOTATION' | 'COUNTER_OFFER' | 'ORDER' | 'FULFILLMENT' | 'SYSTEM';
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['MATCH', 'QUOTATION', 'COUNTER_OFFER', 'ORDER', 'FULFILLMENT', 'SYSTEM'],
      default: 'SYSTEM',
    },
    link: { type: String },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
