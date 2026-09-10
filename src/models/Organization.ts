import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IOrganizationDocument extends Document {
  name: string;
  type: 'FARMER_COLLECTIVE' | 'INDIVIDUAL_FARMER' | 'WHOLESALER' | 'RETAILER' | 'PROCESSOR' | 'INSTITUTION' | 'EXPORTER';
  contactPerson?: string;
  designation?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  panNumber?: string;
  fssaiNumber?: string;
  primaryCrops?: string;
  capacity?: string;
  landArea?: string;
  farmingType?: string;
  farmingExperience?: string;
  nearestMandi?: string;
  procurementVolume?: string;
  preferredPaymentTerms?: string;
  address?: {
    street?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
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
      enum: ['FARMER_COLLECTIVE', 'INDIVIDUAL_FARMER', 'WHOLESALER', 'RETAILER', 'PROCESSOR', 'INSTITUTION', 'EXPORTER'],
      default: 'INDIVIDUAL_FARMER',
      index: true,
    },
    contactPerson: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    gstin: { type: String, trim: true, default: '' },
    panNumber: { type: String, trim: true, default: '' },
    fssaiNumber: { type: String, trim: true, default: '' },
    primaryCrops: { type: String, trim: true, default: '' },
    capacity: { type: String, trim: true, default: '' },
    landArea: { type: String, trim: true, default: '' },
    farmingType: { type: String, trim: true, default: '' },
    farmingExperience: { type: String, trim: true, default: '' },
    nearestMandi: { type: String, trim: true, default: '' },
    procurementVolume: { type: String, trim: true, default: '' },
    preferredPaymentTerms: { type: String, trim: true, default: '' },
    address: {
      street: { type: String, trim: true, default: '' },
      landmark: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: 'Andhra Pradesh' },
      pincode: { type: String, trim: true, default: '520001' },
    },
    verified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Organization: Model<IOrganizationDocument> =
  mongoose.models.Organization || mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);
