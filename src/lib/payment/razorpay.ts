import crypto from 'crypto';
import { IPaymentGatewayProvider, CreateOrderParams, PaymentOrderResult, VerifyPaymentParams, VerifyWebhookParams } from './types';

export class RazorpayProvider implements IPaymentGatewayProvider {
  name = 'RAZORPAY' as const;

  isConfigured(): boolean {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    if (!this.isConfigured()) {
      return {
        orderId: `rzp_mock_${Date.now()}`,
        amount: params.amount,
        currency: params.currency || 'INR',
        provider: 'RAZORPAY',
        isConfigured: false,
      };
    }

    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // in paise
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Razorpay order creation failed: ${data.error?.description || res.statusText}`);
    }

    return {
      orderId: data.id,
      amount: data.amount / 100,
      currency: data.currency,
      provider: 'RAZORPAY',
      isConfigured: true,
      raw: data,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    if (!params.signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(params.signature),
      Buffer.from(expectedSignature)
    );
  }

  verifyWebhook(params: VerifyWebhookParams): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', params.secret)
      .update(params.rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(params.signature),
      Buffer.from(expectedSignature)
    );
  }
}
