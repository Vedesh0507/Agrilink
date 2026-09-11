import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import {
  SubscriptionEvent,
  BuyerSubscription,
  Payment,
  Invoice,
  Order,
} from '@/models';
import { getPaymentProvider } from '@/lib/payment';
import { createAuditEntry } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || req.headers.get('x-webhook-signature') || '';
    const providerHeader = req.headers.get('x-provider') || 'RAZORPAY';

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || '';

    // If a webhook secret is configured, enforce strict signature verification
    if (secret && signature) {
      const provider = getPaymentProvider();
      const isValid = provider.verifyWebhook({ rawBody, signature, secret });
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload.' }, { status: 400 });
    }

    await connectToDatabase();

    const externalEventId = payload.event_id || payload.id || `EVT-${Date.now()}`;
    const eventType = payload.event || payload.type || 'PAYMENT_SUCCEEDED';

    // Idempotency: Check if external event was already processed
    const existingEvent = await SubscriptionEvent.findOne({ externalEventId });
    if (existingEvent) {
      return NextResponse.json({ success: true, message: 'Event already processed (idempotent duplicate).' });
    }

    // Process event safely
    if (eventType === 'payment.captured' || eventType === 'PAYMENT_SUCCESS') {
      const paymentEntity = payload.payload?.payment?.entity || payload.data?.payment;
      const orderId = paymentEntity?.notes?.orderId;
      const subscriptionId = paymentEntity?.notes?.subscriptionId;
      const orgId = paymentEntity?.notes?.organizationId;
      const amount = (paymentEntity?.amount || 0) / (paymentEntity?.amount ? 100 : 1);

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: 'RECORDED_IN_ESCROW' });
      }

      if (subscriptionId) {
        await BuyerSubscription.findByIdAndUpdate(subscriptionId, {
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      // Record in Payment collection
      await Payment.create({
        organizationId: orgId,
        orderId: orderId,
        subscriptionId: subscriptionId,
        purpose: subscriptionId ? 'SUBSCRIPTION_FEE' : 'ORDER_ESCROW',
        amount: amount || 0,
        currency: 'INR',
        provider: providerHeader === 'CASHFREE' ? 'CASHFREE' : 'RAZORPAY',
        providerPaymentId: paymentEntity?.id || externalEventId,
        status: 'SUCCESS',
        paidAt: new Date(),
      });
    }

    // Record deduplicated SubscriptionEvent
    await SubscriptionEvent.create({
      organizationId: payload.organizationId || payload.payload?.payment?.entity?.notes?.organizationId,
      eventType: 'PAYMENT_SUCCEEDED',
      provider: providerHeader === 'CASHFREE' ? 'CASHFREE' : 'RAZORPAY',
      externalEventId,
      metadata: { eventType, payloadSummary: payload.event || payload.type },
      timestamp: new Date(),
    });

    await createAuditEntry({
      actorId: 'PAYMENT_WEBHOOK_GATEWAY',
      actorRole: 'SYSTEM',
      action: 'PROCESS_PAYMENT_WEBHOOK',
      resource: 'Payment',
      resourceId: externalEventId,
      details: { eventType, externalEventId },
      status: 'SUCCESS',
      reason: `Processed webhook event ${eventType}`,
    });

    return NextResponse.json({ success: true, message: 'Webhook processed successfully.' });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
