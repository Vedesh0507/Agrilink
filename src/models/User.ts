import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserRole } from '@/types';

export interface IUserDocument extends Document {
  firebaseUid: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  alternatePhone?: string;
  bio?: string;
  role: UserRole;
  adminSubRole?: 'SUPER_ADMIN' | 'OPS_ADMIN' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN' | 'VERIFICATION_ADMIN' | 'ANALYTICS_ADMIN';
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'BANNED';
  reliabilityScore?: number;
  cancellationCount?: number;
  disputeCount?: number;
  organizationId?: mongoose.Types.ObjectId;
  location: string;
  kycStatus?: 'VERIFIED' | 'PENDING' | 'SUBMITTED';
  bankDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['FARMER', 'BUYER', 'ADMIN'],
      required: true,
      index: true,
    },
    adminSubRole: {
      type: String,
      enum: ['SUPER_ADMIN', 'OPS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'VERIFICATION_ADMIN', 'ANALYTICS_ADMIN'],
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'UNDER_REVIEW', 'BANNED'],
      default: 'ACTIVE',
      index: true,
    },
    reliabilityScore: {
      type: Number,
      default: 95,
    },
    cancellationCount: {
      type: Number,
      default: 0,
    },
    disputeCount: {
      type: Number,
      default: 0,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    kycStatus: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'SUBMITTED'],
      default: 'VERIFIED',
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      upiId: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
