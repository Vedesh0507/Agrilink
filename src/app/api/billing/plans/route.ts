import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SubscriptionPlan, PlatformConfig } from '@/models';
import { ensureDefaultPlans } from '@/lib/entitlement';
import { getPaymentGatewayStatus } from '@/lib/payment';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultPlans();

    const plans = await SubscriptionPlan.find({ enabled: true }).sort({ priceMonthly: 1 }).lean();

    const config = await PlatformConfig.findOne().lean();
    const platformFeePercentage = config?.platformCommissionPercent || 2.5;

    const gatewayStatus = getPaymentGatewayStatus();

    return NextResponse.json({
      success: true,
      data: {
        plans,
        platformFeePercentage,
        gatewayStatus,
      },
    });
  } catch (err: any) {
    console.error('Error fetching subscription plans:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
