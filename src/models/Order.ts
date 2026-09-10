import mongoose, { Schema, Model, Document } from 'mongoose';
import { OrderStatus, FulfillmentStage, IOrderItem } from '@/types';

export interface IOrderDocument extends Document {
  orderNumber: string;
  quotationId?: mongoose.Types.ObjectId;
  buyerId: string;
  buyerName: string;
  supplierIds: string[];
  items: IOrderItem[];
  totalQuantity: number;
  totalValue: number;
  deliveryLocation: string;
  deliveryDate: Date;
  orderStatus: OrderStatus;
  currentFulfillmentStage: FulfillmentStage;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    produceListingId: { type: Schema.Types.ObjectId, ref: 'ProduceListing' },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    agreedPricePerUnit: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    qualityGrade: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', index: true },
    buyerId: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    supplierIds: [{ type: String, required: true, index: true }],
    items: [OrderItemSchema],
    totalQuantity: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    deliveryLocation: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    orderStatus: {
      type: String,
      enum: ['CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
      default: 'CONFIRMED',
      index: true,
    },
    currentFulfillmentStage: {
      type: String,
      enum: ['ORDER_CONFIRMED', 'PRODUCE_PREPARED', 'QUALITY_VERIFIED', 'PACKED', 'IN_TRANSIT', 'DELIVERED'],
      default: 'ORDER_CONFIRMED',
      index: true,
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);
