export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';

export type AdminSubRole = 
  | 'SUPER_ADMIN' 
  | 'OPS_ADMIN' 
  | 'FINANCE_ADMIN' 
  | 'SUPPORT_ADMIN' 
  | 'VERIFICATION_ADMIN' 
  | 'ANALYTICS_ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW' | 'BANNED';

export type QualityGrade = 'Grade A' | 'Grade B' | 'Grade C';

export type ProduceStatus = 'AVAILABLE' | 'COMMITTED' | 'DEPLETED' | 'INACTIVE';

export type RequirementStatus = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';

export type QuotationStatus = 
  | 'REQUESTED' 
  | 'SENT' 
  | 'COUNTERED' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EXPIRED';

export type OrderStatus = 
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'READY_FOR_DISPATCH' 
  | 'IN_TRANSIT' 
  | 'DELIVERED' 
  | 'COMPLETED' 
  | 'CANCELLED'
  | 'DISPUTED';

export type FulfillmentStage = 
  | 'ORDER_CONFIRMED'
  | 'PRODUCE_PREPARED'
  | 'QUALITY_VERIFIED'
  | 'PACKED'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export interface IUser {
  _id?: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  alternatePhone?: string;
  bio?: string;
  role: UserRole;
  adminSubRole?: AdminSubRole;
  accountStatus?: AccountStatus;
  reliabilityScore?: number;
  cancellationCount?: number;
  disputeCount?: number;
  organizationId?: string | IOrganization;
  organizationName?: string;
  location: string;
  kycStatus?: 'VERIFIED' | 'PENDING' | 'SUBMITTED';
  bankDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IOrganization {
  _id?: string;
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
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface IProduceListing {
  _id?: string;
  farmerId: string; // Mongo User ID or Firebase UID
  farmerName: string;
  organizationName?: string;
  product: string;
  variety?: string;
  quantity: number; // in kg
  availableQuantity: number; // in kg
  unit: string; // 'kg' | 'quintal' | 'metric_ton'
  qualityGrade: QualityGrade;
  expectedPricePerUnit: number; // INR per kg
  location: string; // e.g. "Vijayawada, AP"
  coordinates?: {
    lat: number;
    lng: number;
  };
  availableFromDate: string | Date;
  expiryDate?: string | Date;
  status: ProduceStatus;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IBuyerRequirement {
  _id?: string;
  buyerId: string;
  buyerName: string;
  organizationName?: string;
  product: string;
  variety?: string;
  requiredQuantity: number; // in kg
  fulfilledQuantity?: number;
  unit: string;
  qualityGrade: QualityGrade;
  targetPricePerUnit: number; // INR per kg
  deliveryLocation: string; // e.g. "Vijayawada, AP"
  requiredDeliveryDate: string | Date;
  status: RequirementStatus;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ICompatibilityBreakdown {
  productScore: number; // Max 30
  quantityScore: number; // Max 20
  qualityScore: number; // Max 15
  locationScore: number; // Max 15
  dateScore: number; // Max 10
  priceScore: number; // Max 10
  explanation: {
    product: string;
    quantity: string;
    quality: string;
    location: string;
    date: string;
    price: string;
  };
}

export interface IMatchItem {
  produceListingId: string;
  farmerId: string;
  farmerName: string;
  availableQuantity: number;
  allocatedQuantity: number;
  qualityGrade: QualityGrade;
  expectedPrice: number;
  location: string;
  distanceKm?: number;
}

export interface IMatch {
  _id?: string;
  requirementId: string;
  buyerId: string;
  matchType: 'SINGLE_SUPPLIER' | 'AGGREGATED_SUPPLY';
  totalScore: number; // 0 to 100
  matchedQuantity: number;
  targetQuantity: number;
  isFullyFulfilled: boolean;
  suppliers: IMatchItem[];
  compatibilityBreakdown: ICompatibilityBreakdown;
  status: 'PROPOSED' | 'QUOTED' | 'ORDERED' | 'DISMISSED';
  createdAt: string | Date;
}

export interface ICounterOffer {
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  proposedPrice: number;
  quantity?: number;
  notes?: string;
  createdAt: string | Date;
}

export interface IQuotation {
  _id?: string;
  quotationNumber: string;
  requirementId?: string;
  matchId?: string;
  buyerId: string;
  buyerName: string;
  supplierId: string; // Farmer User ID
  supplierName: string;
  product: string;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  initialPrice: number;
  currentAgreedPrice: number;
  deliveryLocation: string;
  deliveryDate: string | Date;
  status: QuotationStatus;
  counterHistory: ICounterOffer[];
  validUntil: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IOrderItem {
  produceListingId?: string;
  supplierId: string;
  supplierName: string;
  product: string;
  quantity: number;
  unit: string;
  agreedPricePerUnit: number;
  totalAmount: number;
  qualityGrade: QualityGrade;
}

export interface IOrder {
  _id?: string;
  orderNumber: string;
  quotationId?: string;
  buyerId: string;
  buyerName: string;
  supplierIds: string[];
  items: IOrderItem[];
  totalQuantity: number;
  totalValue: number;
  deliveryLocation: string;
  deliveryDate: string | Date;
  orderStatus: OrderStatus;
  currentFulfillmentStage: FulfillmentStage;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IFulfillmentEvent {
  _id?: string;
  orderId: string;
  stage: FulfillmentStage;
  title: string;
  description: string;
  actorId?: string;
  actorRole?: UserRole;
  timestamp: string | Date;
  completed: boolean;
}

export interface INotification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'MATCH' | 'QUOTATION' | 'COUNTER_OFFER' | 'ORDER' | 'FULFILLMENT' | 'SYSTEM';
  link?: string;
  read: boolean;
  createdAt: string | Date;
}

export interface IAuditLog {
  _id?: string;
  actorId: string;
  actorEmail?: string;
  actorRole: UserRole | AdminSubRole;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  requestId?: string;
  status?: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  timestamp: string | Date;
}

export interface IDispute {
  _id?: string;
  disputeNumber: string;
  orderId: string;
  orderNumber?: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: UserRole;
  counterPartyId: string;
  counterPartyName: string;
  reason: 'QUALITY_MISMATCH' | 'QUANTITY_SHORTFALL' | 'TRANSIT_DAMAGE' | 'PAYMENT_ISSUE' | 'OTHER';
  claimedAmount: number;
  evidencePhotos?: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionNotes?: string;
  settlementAmount?: number;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ILedgerEntry {
  _id?: string;
  entryNumber: string;
  orderId?: string;
  orderNumber?: string;
  type: 'PAYMENT_RECORDED' | 'SUPPLIER_PAYOUT' | 'PLATFORM_COMMISSION' | 'TAX_GST' | 'REFUND';
  amount: number;
  currency: string;
  status: 'RECORDED' | 'SETTLED' | 'PENDING' | 'RECONCILED';
  payerId?: string;
  payerName?: string;
  payeeId?: string;
  payeeName?: string;
  paymentMethod?: string;
  providerReference?: string;
  notes?: string;
  createdAt: string | Date;
}

export interface ISupportTicket {
  _id?: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  orderId?: string;
  category: 'PAYMENT' | 'ORDER' | 'QUALITY' | 'DELIVERY' | 'ACCOUNT' | 'KYC' | 'TECHNICAL';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IPlatformConfig {
  _id?: string;
  platformCommissionPercent: number;
  minOrderValue: number;
  disputeWindowHours: number;
  featureFlags: {
    multiSupplierMatching: boolean;
    whatsAppAlerts: boolean;
    onlineEscrow: boolean;
    autoKycApproval: boolean;
    logisticsTracking: boolean;
  };
  supportedCommodities: string[];
  updatedAt: string | Date;
}

export interface IMarketplaceAnnouncement {
  _id?: string;
  title: string;
  message: string;
  targetAudience: 'ALL' | 'FARMER' | 'BUYER';
  targetDistrict?: string;
  targetCommodity?: string;
  sentBy: string;
  sentAt: string | Date;
}

export type PlanCode = 'FREE' | 'BUSINESS' | 'ENTERPRISE';

export interface ISubscriptionPlan {
  _id?: string;
  name: string;
  code: PlanCode;
  description: string;
  priceMonthly: number;
  currency: string;
  billingInterval: 'MONTHLY' | 'ANNUAL';
  features: {
    maxMonthlyRequirements: number;
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
}

export interface IBuyerSubscription {
  _id?: string;
  organizationId: string;
  planId: string | ISubscriptionPlan;
  planCode: PlanCode;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
  currentPeriodStart: string | Date;
  currentPeriodEnd: string | Date;
  trialStartDate?: string | Date;
  trialEndDate?: string | Date;
  autoRenew: boolean;
  monthlyRequirementsUsed: number;
  usagePeriodMonth: string;
  paymentProvider: 'NONE' | 'RAZORPAY' | 'CASHFREE' | 'MANUAL_COMPLIMENTARY' | 'INTERNAL_LEDGER';
  externalSubscriptionId?: string;
  isComplimentary?: boolean;
  complimentaryReason?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ITransactionFee {
  _id?: string;
  orderId: string;
  orderNumber: string;
  organizationId?: string;
  buyerId: string;
  grossAmount: number;
  feePercentage: number;
  feeAmount: number;
  taxAmount: number;
  netPlatformRevenue: number;
  supplierPayableAmount: number;
  status: 'CALCULATED' | 'HELD_IN_ESCROW' | 'COLLECTED' | 'REFUNDED' | 'WAIVED';
  notes?: string;
  finalizedAt: string | Date;
  createdAt: string | Date;
}

export interface IPayment {
  _id?: string;
  organizationId?: string;
  orderId?: string;
  subscriptionId?: string;
  purpose: 'ORDER_ESCROW' | 'SUBSCRIPTION_FEE' | 'TRANSACTION_FEE' | 'DISPUTE_SETTLEMENT';
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'CASHFREE' | 'INTERNAL_LEDGER' | 'OFFLINE_NEFT';
  providerPaymentId?: string;
  providerOrderId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  paidAt?: string | Date;
  failureReason?: string;
  createdAt: string | Date;
}

export interface IInvoice {
  _id?: string;
  organizationId?: string;
  buyerId?: string;
  invoiceNumber: string;
  type: 'SUBSCRIPTION' | 'ORDER_PLATFORM_FEE' | 'ORDER_SETTLEMENT';
  orderId?: string;
  subscriptionId?: string;
  subtotal: number;
  platformFee: number;
  tax: number;
  total: number;
  currency: string;
  status: 'ISSUED' | 'PAID' | 'VOID' | 'REFUNDED';
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    hsnCode?: string;
  }>;
  billingDetails?: {
    name: string;
    gstin?: string;
    pan?: string;
    address?: string;
  };
  issuedAt: string | Date;
  paidAt?: string | Date;
  dueDate?: string | Date;
}


