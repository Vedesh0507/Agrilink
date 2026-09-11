import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import {
  Organization,
  SubscriptionPlan,
  BuyerSubscription,
  SubscriptionEvent,
  Invoice,
  TransactionFee,
  User,
} from '@/models';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { getOrCreateOrganizationSubscription } from '@/lib/entitlement';
import { createAuditEntry, checkIdempotency, recordIdempotencyResult } from '@/lib/audit';
import { getPaymentGatewayStatus } from '@/lib/payment';

// GET current organization subscription and billing state
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    if (!authorizeRoles(currentUser, ['BUYER', 'ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only buyers can access billing information.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Resolve buyer's organization
    let orgId = currentUser.organizationId as any;
    if (!orgId) {
      // Find or create default organization for the user so existing buyers never break
      let org = await Organization.findOne({ email: currentUser.email });
      if (!org) {
        org = await Organization.create({
          name: `${currentUser.name} Commercial Enterprise`,
          type: 'WHOLESALER',
          contactPerson: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          verified: true,
        });
      }
      currentUser.organizationId = org._id as any;
      await currentUser.save();
      orgId = org._id;
    }

    const { subscription, plan } = await getOrCreateOrganizationSubscription(orgId);

    // Count organization members
    const orgUsersCount = await User.countDocuments({ organizationId: orgId });

    // Recent invoices
    const invoices = await Invoice.find({ organizationId: orgId }).sort({ issuedAt: -1 }).limit(10).lean();

    // Recent transaction fees
    const transactionFees = await TransactionFee.find({
      $or: [{ organizationId: orgId }, { buyerId: currentUser._id.toString() }],
    })
      .sort({ finalizedAt: -1 })
      .limit(10)
      .lean();

    const gatewayStatus = getPaymentGatewayStatus();

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan,
        usage: {
          requirementsUsed: subscription.monthlyRequirementsUsed,
          requirementsMax: plan.features.maxMonthlyRequirements,
          organizationUsersCount: orgUsersCount,
          organizationUsersMax: plan.features.maxOrganizationUsers,
          usagePeriodMonth: subscription.usagePeriodMonth,
        },
        invoices,
        transactionFees,
        gatewayStatus,
      },
    });
  } catch (err: any) {
    console.error('Error fetching subscription details:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST upgrade or change subscription plan
export async function POST(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse, key } = checkIdempotency(req);
    if (isDuplicate && cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    if (!authorizeRoles(currentUser, ['BUYER', 'ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only buyers can manage subscription.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetPlanCode, reason } = body;

    if (!targetPlanCode || !['FREE', 'BUSINESS', 'ENTERPRISE'].includes(targetPlanCode)) {
      return NextResponse.json({ success: false, error: 'Invalid target plan code.' }, { status: 400 });
    }

    await connectToDatabase();

    let orgId = currentUser.organizationId as any;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization profile required before managing subscription.' },
        { status: 400 }
      );
    }

    const targetPlan = await SubscriptionPlan.findOne({ code: targetPlanCode });
    if (!targetPlan) {
      return NextResponse.json({ success: false, error: 'Target plan does not exist.' }, { status: 404 });
    }

    const { subscription } = await getOrCreateOrganizationSubscription(orgId);
    const beforePlan = subscription.planCode;

    subscription.planId = targetPlan._id as any;
    subscription.planCode = targetPlan.code;
    subscription.status = 'ACTIVE';
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    subscription.paymentProvider = 'INTERNAL_LEDGER'; // When real gateway is connected, this updates via webhook
    await subscription.save();

    // Create an Invoice for the subscription if paid plan
    if (targetPlan.priceMonthly > 0) {
      const invoiceNumber = `INV-SUB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const subtotal = targetPlan.priceMonthly;
      const tax = Math.round(subtotal * 0.18); // 18% GST
      const total = subtotal + tax;

      await Invoice.create({
        organizationId: orgId,
        buyerId: currentUser._id.toString(),
        invoiceNumber,
        type: 'SUBSCRIPTION',
        subscriptionId: subscription._id,
        subtotal,
        platformFee: 0,
        tax,
        total,
        currency: 'INR',
        status: 'PAID', // In sandbox / direct activation mode
        lineItems: [
          {
            description: `${targetPlan.name} Subscription (1 Month)`,
            quantity: 1,
            unitPrice: subtotal,
            amount: subtotal,
            hsnCode: '998311', // SaaS / Software services HSN
          },
        ],
        billingDetails: {
          name: currentUser.name,
          address: currentUser.location,
        },
        issuedAt: new Date(),
        paidAt: new Date(),
      });
    }

    // Record auditable subscription event
    await SubscriptionEvent.create({
      organizationId: orgId,
      subscriptionId: subscription._id,
      eventType: targetPlanCode === 'FREE' ? 'PLAN_DOWNGRADED' : 'PLAN_UPGRADED',
      provider: 'INTERNAL',
      metadata: {
        beforePlan,
        afterPlan: targetPlan.code,
        priceMonthly: targetPlan.priceMonthly,
        reason: reason || 'User requested plan transition',
      },
      timestamp: new Date(),
    });

    // Create immutable audit entry
    await createAuditEntry({
      actorId: currentUser._id.toString(),
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'UPDATE_SUBSCRIPTION_PLAN',
      resource: 'BuyerSubscription',
      resourceId: subscription._id.toString(),
      beforeState: { planCode: beforePlan },
      afterState: { planCode: targetPlan.code, priceMonthly: targetPlan.priceMonthly },
      reason: reason || `Buyer changed plan from ${beforePlan} to ${targetPlan.code}`,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const responsePayload = {
      success: true,
      message: `Successfully updated subscription to ${targetPlan.name}.`,
      data: {
        subscription,
        plan: targetPlan,
      },
    };

    if (key) recordIdempotencyResult(key, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('Error changing subscription plan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
