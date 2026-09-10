import mongoose, { Schema, Model, Document } from 'mongoose';
import { ISupportTicket } from '@/types';

export interface ISupportTicketDocument extends Omit<ISupportTicket, '_id'>, Document {}

const SupportTicketSchema = new Schema<ISupportTicketDocument>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['FARMER', 'BUYER', 'ADMIN'], required: true },
    orderId: { type: String, index: true },
    category: {
      type: String,
      enum: ['PAYMENT', 'ORDER', 'QUALITY', 'DELIVERY', 'ACCOUNT', 'KYC', 'TECHNICAL'],
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedTo: { type: String },
    resolutionNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const SupportTicket: Model<ISupportTicketDocument> =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicketDocument>('SupportTicket', SupportTicketSchema);
