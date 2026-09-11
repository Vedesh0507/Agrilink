export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'CASHFREE' | 'INTERNAL_LEDGER';
  isConfigured: boolean;
  raw?: any;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
}

export interface VerifyWebhookParams {
  rawBody: string;
  signature: string;
  secret: string;
}

export interface IPaymentGatewayProvider {
  name: 'RAZORPAY' | 'CASHFREE' | 'INTERNAL_LEDGER';
  isConfigured(): boolean;
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  verifyWebhook(params: VerifyWebhookParams): boolean;
}
