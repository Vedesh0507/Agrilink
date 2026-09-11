import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import {
  SubscriptionPlan,
  BuyerSubscription,
  Organization,
  IBuyerSubscriptionDocument,
  ISubscriptionPlanDocument,
} from '@/models';

export const DEFAULT_PLANS = [
  {
    name: 'Free / Trial',
    code: 'FREE' as const,
    description: 'Essential procurement tools for small commercial buyers and trial evaluation.',
    priceMonthly: 0,
    currency: 'INR',
    billingInterval: 'MONTHLY' as const,
    features: {
      maxMonthlyRequirements: 5,
      maxOrganizationUsers: 1,
      advancedMatching: false,
      advancedAnalytics: false,
      negotiationWorkspace: false,
      prioritySupport: false,
      apiAccess: false,
      erpIntegration: false,
      dedicatedManager: false,
    },
    transactionFeePercentage: 2.5,
    enabled: true,
    isPopular: false,
  },
  {
    name: 'Business Growth',
    code: 'BUSINESS' as const,
    description: 'For commercial wholesalers, restaurant chains, and regional food processors.',
    priceMonthly: 4999,
    currency: 'INR',
    billingInterval: 'MONTHLY' as const,
    features: {
      maxMonthlyRequirements: 30,
      maxOrganizationUsers: 5,
      advancedMatching: true,
      advancedAnalytics: true,
      negotiationWorkspace: true,
      prioritySupport: true,
      apiAccess: false,
      erpIntegration: false,
      dedicatedManager: false,
    },
    transactionFeePercentage: 1.5,
    enabled: true,
    isPopular: true,
  },
  {
    name: 'Enterprise Procurement',
    code: 'ENTERPRISE' as const,
    description: 'For corporate food brands, exporters, and multi-mandi industrial processors.',
    priceMonthly: 19999,
    currency: 'INR',
    billingInterval: 'MONTHLY' as const,
    features: {
      maxMonthlyRequirements: -1, // Unlimited
      maxOrganizationUsers: 25,
      advancedMatching: true,
      advancedAnalytics: true,
      negotiationWorkspace: true,
      prioritySupport: true,
      apiAccess: true,
      erpIntegration: true,
      dedicatedManager: true,
    },
    transactionFeePercentage: 1.0,
    enabled: true,
    isPopular: false,
  },
];

/**
 * Ensures default plans exist in the database.
 */
export async function ensureDefaultPlans(): Promise<void> {
  await connectToDatabase();
  for (const plan of DEFAULT_PLANS) {
    const exists = await SubscriptionPlan.findOne({ code: plan.code });
    if (!exists) {
      await SubscriptionPlan.create(plan);
    }
  }
}

/**
 * Gets or initializes an active BuyerSubscription for an organization.
 * Automatically backfills existing buyers with a Free subscription without blocking their access.
 */
export async function getOrCreateOrganizationSubscription(
  orgId: string | mongoose.Types.ObjectId
): Promise<{
  subscription: IBuyerSubscriptionDocument;
  plan: ISubscriptionPlanDocument;
}> {
  await connectToDatabase();
  await ensureDefaultPlans();

  const objectId = typeof orgId === 'string' ? new mongoose.Types.ObjectId(orgId) : orgId;

  let subscription = await BuyerSubscription.findOne({ organizationId: objectId });

  if (!subscription) {
    const freePlan = await SubscriptionPlan.findOne({ code: 'FREE' });
    if (!freePlan) {
      throw new Error('Default FREE subscription plan not configured');
    }

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    subscription = await BuyerSubscription.create({
      organizationId: objectId,
      planId: freePlan._id,
      planCode: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: thirtyDaysLater,
      autoRenew: true,
      monthlyRequirementsUsed: 0,
      usagePeriodMonth: currentMonth,
      paymentProvider: 'NONE',
    });
  }

  // Check month rollover and reset usage if needed
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (subscription.usagePeriodMonth !== currentMonth) {
    subscription.monthlyRequirementsUsed = 0;
    subscription.usagePeriodMonth = currentMonth;
    await subscription.save();
  }

  const plan = await SubscriptionPlan.findById(subscription.planId);
  if (!plan) {
    const fallbackPlan = (await SubscriptionPlan.findOne({ code: 'FREE' }))!;
    return { subscription, plan: fallbackPlan };
  }

  return { subscription, plan };
}

/**
 * Server-side check if an organization can create a procurement requirement.
 */
export async function canCreateRequirement(orgId: string | mongoose.Types.ObjectId): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsed: number;
  limit: number;
  planCode: string;
}> {
  const { subscription, plan } = await getOrCreateOrganizationSubscription(orgId);

  // If subscription is suspended or past due
  if (subscription.status === 'SUSPENDED') {
    return {
      allowed: false,
      reason: 'Your organization subscription is suspended. Please contact AgriLink Support.',
      currentUsed: subscription.monthlyRequirementsUsed,
      limit: plan.features.maxMonthlyRequirements,
      planCode: plan.code,
    };
  }

  const maxReqs = plan.features.maxMonthlyRequirements;
  // -1 means unlimited
  if (maxReqs === -1) {
    return {
      allowed: true,
      currentUsed: subscription.monthlyRequirementsUsed,
      limit: -1,
      planCode: plan.code,
    };
  }

  if (subscription.monthlyRequirementsUsed >= maxReqs) {
    return {
      allowed: false,
      reason: `Monthly procurement requirement limit of ${maxReqs} reached for the ${plan.name} plan. Upgrade to Business or Enterprise for higher volume.`,
      currentUsed: subscription.monthlyRequirementsUsed,
      limit: maxReqs,
      planCode: plan.code,
    };
  }

  return {
    allowed: true,
    currentUsed: subscription.monthlyRequirementsUsed,
    limit: maxReqs,
    planCode: plan.code,
  };
}

/**
 * Increments requirement usage upon successful requirement creation.
 */
export async function recordRequirementUsage(orgId: string | mongoose.Types.ObjectId): Promise<void> {
  const { subscription } = await getOrCreateOrganizationSubscription(orgId);
  subscription.monthlyRequirementsUsed += 1;
  await subscription.save();
}

/**
 * Check if organization is entitled to advanced smart knapsack matching.
 */
export async function canUseAdvancedMatching(orgId: string | mongoose.Types.ObjectId): Promise<boolean> {
  const { plan, subscription } = await getOrCreateOrganizationSubscription(orgId);
  if (subscription.status === 'SUSPENDED') return false;
  return !!plan.features.advancedMatching;
}

/**
 * Check if organization is entitled to advanced analytics.
 */
export async function canUseAdvancedAnalytics(orgId: string | mongoose.Types.ObjectId): Promise<boolean> {
  const { plan, subscription } = await getOrCreateOrganizationSubscription(orgId);
  if (subscription.status === 'SUSPENDED') return false;
  return !!plan.features.advancedAnalytics;
}

/**
 * Check if organization can add another user.
 */
export async function canAddOrganizationUser(
  orgId: string | mongoose.Types.ObjectId,
  currentUserCount: number
): Promise<{ allowed: boolean; maxAllowed: number; planCode: string }> {
  const { plan, subscription } = await getOrCreateOrganizationSubscription(orgId);
  if (subscription.status === 'SUSPENDED') {
    return { allowed: false, maxAllowed: 0, planCode: plan.code };
  }
  const maxUsers = plan.features.maxOrganizationUsers;
  return {
    allowed: maxUsers === -1 || currentUserCount < maxUsers,
    maxAllowed: maxUsers,
    planCode: plan.code,
  };
}

/**
 * Check if organization has API access.
 */
export async function canUseApiAccess(orgId: string | mongoose.Types.ObjectId): Promise<boolean> {
  const { plan, subscription } = await getOrCreateOrganizationSubscription(orgId);
  if (subscription.status === 'SUSPENDED') return false;
  return !!plan.features.apiAccess;
}
