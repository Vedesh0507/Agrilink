import { IPaymentGatewayProvider } from './types';
import { RazorpayProvider } from './razorpay';
import { CashfreeProvider } from './cashfree';

export class InternalLedgerProvider implements IPaymentGatewayProvider {
  name = 'INTERNAL_LEDGER' as const;

  isConfigured(): boolean {
    return true; // Always available as fallback / simulated test environment
  }

  async createOrder(params: any): Promise<any> {
    return {
      orderId: `INT_ORD_${Date.now()}`,
      amount: params.amount,
      currency: params.currency || 'INR',
      provider: 'INTERNAL_LEDGER',
      isConfigured: false, // Explicitly false so UI knows real payment provider is not configured
    };
  }

  async verifyPayment(): Promise<boolean> {
    return true;
  }

  verifyWebhook(): boolean {
    return true;
  }
}

export function getPaymentProvider(): IPaymentGatewayProvider {
  const razorpay = new RazorpayProvider();
  if (razorpay.isConfigured()) return razorpay;

  const cashfree = new CashfreeProvider();
  if (cashfree.isConfigured()) return cashfree;

  return new InternalLedgerProvider();
}

export function getPaymentGatewayStatus() {
  const razorpay = new RazorpayProvider();
  const cashfree = new CashfreeProvider();

  return {
    razorpayConfigured: razorpay.isConfigured(),
    cashfreeConfigured: cashfree.isConfigured(),
    activeProvider: razorpay.isConfigured()
      ? 'RAZORPAY'
      : cashfree.isConfigured()
      ? 'CASHFREE'
      : 'NONE_CONFIGURED (DEV_SANDBOX)',
  };
}

export * from './types';
export * from './razorpay';
export * from './cashfree';
