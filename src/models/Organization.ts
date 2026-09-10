import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IOrganizationDocument extends Document {
  name: string;
  type: 'FARMER_COLLECTIVE' | 'INDIVIDUAL_FARMER' | 'WHOLESALER' | 'RETAILER' | 'PROCESSOR' | 'INSTITUTION';
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    city: string;
    state: string;
    pincode: string;
  };
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['FARMER_COLLECTIVE', 'INDIVIDUAL_FARMER', 'WHOLESALER', 'RETAILER', 'PROCESSOR', 'INSTITUTION'],
      required: true,
      index: true,
    },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: {
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    verified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization || mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);
