import { z } from 'zod';

export const UserProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional(),
  role: z.enum(['FARMER', 'BUYER', 'ADMIN']),
  organizationName: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  organizationName: z.string().optional(),
  organizationType: z.enum(['FARMER_COLLECTIVE', 'INDIVIDUAL_FARMER', 'WHOLESALER', 'RETAILER', 'PROCESSOR', 'INSTITUTION', 'EXPORTER']).optional(),
  contactPerson: z.string().optional(),
  designation: z.string().optional(),
  gstin: z.string().optional(),
  panNumber: z.string().optional(),
  fssaiNumber: z.string().optional(),
  primaryCrops: z.string().optional(),
  capacity: z.string().optional(),
  landArea: z.string().optional(),
  farmingType: z.string().optional(),
  farmingExperience: z.string().optional(),
  nearestMandi: z.string().optional(),
  procurementVolume: z.string().optional(),
  preferredPaymentTerms: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    landmark: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  bankDetails: z.object({
    accountHolderName: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    upiId: z.string().optional(),
  }).optional(),
});

export const ProduceListingSchema = z.object({
  product: z.string().min(2, 'Product name is required'),
  variety: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('kg'),
  qualityGrade: z.enum(['Grade A', 'Grade B', 'Grade C']),
  expectedPricePerUnit: z.number().positive('Price must be greater than 0'),
  location: z.string().min(2, 'Location is required'),
  availableFromDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional(),
  description: z.string().optional(),
});

export const BuyerRequirementSchema = z.object({
  product: z.string().min(2, 'Product name is required'),
  variety: z.string().optional(),
  requiredQuantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().default('kg'),
  qualityGrade: z.enum(['Grade A', 'Grade B', 'Grade C']),
  targetPricePerUnit: z.number().positive('Target price must be greater than 0'),
  deliveryLocation: z.string().min(2, 'Delivery location is required'),
  requiredDeliveryDate: z.string().or(z.date()),
  notes: z.string().optional(),
});

export const QuotationRequestSchema = z.object({
  requirementId: z.string().optional(),
  matchId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  product: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('kg'),
  qualityGrade: z.enum(['Grade A', 'Grade B', 'Grade C']),
  initialPrice: z.number().positive(),
  deliveryLocation: z.string().min(1),
  deliveryDate: z.string().or(z.date()),
  notes: z.string().optional(),
});

export const CounterOfferSchema = z.object({
  quotationId: z.string().min(1, 'Quotation ID is required'),
  proposedPrice: z.number().positive('Proposed price must be greater than 0'),
  quantity: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const OrderStatusUpdateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  orderStatus: z.enum([
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_DISPATCH',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  fulfillmentStage: z
    .enum([
      'ORDER_CONFIRMED',
      'PRODUCE_PREPARED',
      'QUALITY_VERIFIED',
      'PACKED',
      'IN_TRANSIT',
      'DELIVERED',
    ])
    .optional(),
  eventTitle: z.string().optional(),
  eventDescription: z.string().optional(),
});
