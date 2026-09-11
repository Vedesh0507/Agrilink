import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import {
  BuyerSubscription,
  SubscriptionPlan,
  Organization,
  SubscriptionEvent,
  User,
} from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency, recordIdempotencyResult } from '@/lib/audit';
import { ensureDefaultPlans } from '@/lib/entitlement';

// GET list all buyer subscriptions with filters
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'SUBSCRIPTIONS_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient administrative privileges to view subscriptions.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    await ensureDefaultPlans();

    const { searchParams } = new URL(req.url);
    const planFilter = searchParams.get('plan');
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const filter: any = {};
    if (planFilter && planFilter !== 'ALL') filter.planCode = planFilter;
    if (statusFilter && statusFilter !== 'ALL') filter.status = statusFilter;

    let subscriptions = await BuyerSubscription.find(filter)
      .populate('organizationId')
      .populate('planId')
      .sort({ updatedAt: -1 })
      .lean();

    // If search term provided, filter by organization name or contact person
    if (search.trim()) {
      const term = search.toLowerCase();
      subscriptions = subscriptions.filter((sub: any) => {
        const org = sub.organizationId;
        return (
          org?.name?.toLowerCase().includes(term) ||
          org?.contactPerson?.toLowerCase().includes(term) ||
          org?.email?.toLowerCase().includes(term)
        );
      });
    }

    // Enhance with user counts
    const orgIds = subscriptions.map((s: any) => s.organizationId?._id).filter(Boolean);
    const userCounts = await User.aggregate([
      { $match: { organizationId: { $in: orgIds } } },
      { $group: { _id: '$organizationId', count: { $sum: 1 } } },
    ]);
    const userCountMap = new Map(userCounts.map((u: any) => [u._id.toString(), u.count]));

    const enriched = subscriptions.map((s: any) => ({
      ...s,
      memberCount: userCountMap.get(s.organizationId?._id?.toString()) || 1,
    }));

    // Summary counts
    const totalActive = await BuyerSubscription.countDocuments({ status: 'ACTIVE' });
    const totalTrialing = await BuyerSubscription.countDocuments({ status: 'TRIALING' });
    const totalSuspended = await BuyerSubscription.countDocuments({ status: 'SUSPENDED' });
    const totalBusiness = await BuyerSubscription.countDocuments({ planCode: 'BUSINESS', status: 'ACTIVE' });
    const totalEnterprise = await BuyerSubscription.countDocuments({ planCode: 'ENTERPRISE', status: 'ACTIVE' });

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: enriched,
        summary: {
          totalSubscriptions: subscriptions.length,
          totalActive,
          totalTrialing,
          totalSuspended,
          totalBusiness,
          totalEnterprise,
        },
      },
    });
  } catch (err: any) {
    console.error('Admin fetch subscriptions error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST execute administrative subscription actions
export async function POST(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse, key } = checkIdempotency(req);
    if (isDuplicate && cachedResponse) return NextResponse.json(cachedResponse);

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'SUBSCRIPTIONS_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to mutate subscriptions.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { subscriptionId, action, targetPlanCode, reason, durationMonths } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Operational reason (minimum 5 characters) is mandatory for subscription changes.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const subscription = await BuyerSubscription.findById(subscriptionId);
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found.' }, { status: 404 });
    }

    const beforeState = subscription.toObject();

    if (action === 'CHANGE_PLAN') {
      const plan = await SubscriptionPlan.findOne({ code: targetPlanCode });
      if (!plan) return NextResponse.json({ success: false, error: 'Invalid plan code.' }, { status: 400 });

      subscription.planId = plan._id as any;
      subscription.planCode = plan.code;
      subscription.status = 'ACTIVE';
      await subscription.save();

      await SubscriptionEvent.create({
        organizationId: subscription.organizationId,
        subscriptionId: subscription._id,
        eventType: 'PLAN_UPGRADED',
        provider: 'ADMIN',
        metadata: { adminAction: 'ADMIN_FORCE_PLAN_CHANGE', targetPlanCode, reason },
      });
    } else if (action === 'SUSPEND_SUBSCRIPTION') {
      subscription.status = 'SUSPENDED';
      await subscription.save();

      await SubscriptionEvent.create({
        organizationId: subscription.organizationId,
        subscriptionId: subscription._id,
        eventType: 'SUBSCRIPTION_SUSPENDED',
        provider: 'ADMIN',
        metadata: { reason },
      });
    } else if (action === 'ACTIVATE_SUBSCRIPTION') {
      subscription.status = 'ACTIVE';
      await subscription.save();

      await SubscriptionEvent.create({
        organizationId: subscription.organizationId,
        subscriptionId: subscription._id,
        eventType: 'SUBSCRIPTION_CREATED',
        provider: 'ADMIN',
        metadata: { reason },
      });
    } else if (action === 'GRANT_COMPLIMENTARY') {
      const plan = await SubscriptionPlan.findOne({ code: targetPlanCode || 'BUSINESS' });
      if (!plan) return NextResponse.json({ success: false, error: 'Invalid target plan.' }, { status: 400 });

      const months = Number(durationMonths) || 1;
      const now = new Date();
      const newEnd = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);

      subscription.planId = plan._id as any;
      subscription.planCode = plan.code;
      subscription.status = 'ACTIVE';
      subscription.currentPeriodEnd = newEnd;
      subscription.isComplimentary = true;
      subscription.complimentaryReason = reason;
      subscription.grantedByAdminId = currentUser ? currentUser._id.toString() : 'admin_session';
      subscription.paymentProvider = 'MANUAL_COMPLIMENTARY';
      await subscription.save();

      await SubscriptionEvent.create({
        organizationId: subscription.organizationId,
        subscriptionId: subscription._id,
        eventType: 'COMPLIMENTARY_GRANTED',
        provider: 'ADMIN',
        metadata: { planCode: plan.code, months, reason },
      });
    } else {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Create immutable audit entry
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'SUPER_ADMIN') : 'SUPER_ADMIN',
      action: `ADMIN_${action}`,
      resource: 'BuyerSubscription',
      resourceId: subscription._id.toString(),
      beforeState: { planCode: beforeState.planCode, status: beforeState.status },
      afterState: { planCode: subscription.planCode, status: subscription.status },
      reason,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const responsePayload = {
      success: true,
      message: `Subscription successfully updated (${action}).`,
      data: subscription,
    };

    if (key) recordIdempotencyResult(key, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('Admin subscription mutation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
