import crypto from 'crypto';
import { IPaymentGatewayProvider, CreateOrderParams, PaymentOrderResult, VerifyPaymentParams, VerifyWebhookParams } from './types';

export class CashfreeProvider implements IPaymentGatewayProvider {
  name = 'CASHFREE' as const;

  isConfigured(): boolean {
    return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    if (!this.isConfigured()) {
      return {
        orderId: `cf_mock_${Date.now()}`,
        amount: params.amount,
        currency: params.currency || 'INR',
        provider: 'CASHFREE',
        isConfigured: false,
      };
    }

    const appId = process.env.CASHFREE_APP_ID!;
    const secretKey = process.env.CASHFREE_SECRET_KEY!;
    const env = process.env.CASHFREE_ENV || 'TEST';
    const baseUrl = env === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    const orderId = `CF_${params.receipt}_${Date.now().toString().slice(-4)}`;

    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: params.amount,
        order_currency: params.currency || 'INR',
        customer_details: {
          customer_id: params.customer?.email || `CUST_${Date.now()}`,
          customer_email: params.customer?.email || 'buyer@agrilink.internal',
          customer_phone: params.customer?.phone || '9999999999',
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Cashfree order creation failed: ${data.message || res.statusText}`);
    }

    return {
      orderId: data.order_id,
      amount: data.order_amount,
      currency: data.order_currency,
      provider: 'CASHFREE',
      isConfigured: true,
      raw: data,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!this.isConfigured()) return false;
    return !!params.paymentId;
  }

  verifyWebhook(params: VerifyWebhookParams): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', params.secret)
      .update(params.rawBody)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(params.signature),
      Buffer.from(expectedSignature)
    );
  }
}
