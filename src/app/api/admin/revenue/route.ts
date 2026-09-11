import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import {
  Order,
  TransactionFee,
  Invoice,
  BuyerSubscription,
  SubscriptionPlan,
  User,
  Organization,
} from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'REVENUE_VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view platform revenue analytics.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // 1. Gross GMV from confirmed/delivered/completed orders
    const orders = await Order.find({
      orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'] },
    }).lean();

    const grossGMV = orders.reduce((sum, o: any) => sum + (o.totalValue || 0), 0);
    const completedOrdersCount = orders.length;

    // 2. Transaction Fee revenue from TransactionFee records
    const feeRecords = await TransactionFee.find().sort({ createdAt: -1 }).limit(100).lean();
    const totalTransactionFeeRevenue = feeRecords.reduce((sum, f: any) => sum + (f.feeAmount || 0), 0);
    const totalFeeTaxes = feeRecords.reduce((sum, f: any) => sum + (f.taxAmount || 0), 0);

    // 3. Subscription revenue from paid Invoices
    const subscriptionInvoices = await Invoice.find({
      type: 'SUBSCRIPTION',
      status: 'PAID',
    })
      .sort({ issuedAt: -1 })
      .limit(100)
      .lean();

    const totalSubscriptionRevenue = subscriptionInvoices.reduce((sum, inv: any) => sum + (inv.subtotal || 0), 0);
    const totalSubscriptionTaxes = subscriptionInvoices.reduce((sum, inv: any) => sum + (inv.tax || 0), 0);

    // 4. MRR from active paid subscriptions
    const activeSubscriptions = await BuyerSubscription.find({
      status: 'ACTIVE',
      planCode: { $in: ['BUSINESS', 'ENTERPRISE'] },
    })
      .populate('planId')
      .lean();

    const mrr = activeSubscriptions.reduce((sum, sub: any) => {
      const planPrice = sub.planId?.priceMonthly || (sub.planCode === 'BUSINESS' ? 4999 : sub.planCode === 'ENTERPRISE' ? 19999 : 0);
      return sum + planPrice;
    }, 0);

    const arr = mrr * 12;

    // 5. Subscription distribution
    const totalFree = await BuyerSubscription.countDocuments({ planCode: 'FREE', status: 'ACTIVE' });
    const totalBusiness = await BuyerSubscription.countDocuments({ planCode: 'BUSINESS', status: 'ACTIVE' });
    const totalEnterprise = await BuyerSubscription.countDocuments({ planCode: 'ENTERPRISE', status: 'ACTIVE' });
    const totalSuspended = await BuyerSubscription.countDocuments({ status: 'SUSPENDED' });
    const totalBuyersCount = await User.countDocuments({ role: 'BUYER' });

    // 6. Net Platform Revenue Calculation
    const grossPlatformRevenue = totalTransactionFeeRevenue + totalSubscriptionRevenue;
    const totalPlatformTaxes = totalFeeTaxes + totalSubscriptionTaxes;
    const netPlatformRevenue = grossPlatformRevenue; // Platform revenue before corporate taxes

    const arpu = totalBuyersCount > 0 ? Math.round(grossPlatformRevenue / totalBuyersCount) : 0;

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          grossGMV,
          completedOrdersCount,
          totalTransactionFeeRevenue,
          totalSubscriptionRevenue,
          grossPlatformRevenue,
          totalPlatformTaxes,
          netPlatformRevenue,
          mrr,
          arr,
          arpu,
          totalBuyersCount,
          subscriptionBreakdown: {
            free: totalFree,
            business: totalBusiness,
            enterprise: totalEnterprise,
            suspended: totalSuspended,
          },
        },
        recentTransactionFees: feeRecords.slice(0, 20),
        recentSubscriptionInvoices: subscriptionInvoices.slice(0, 20),
      },
    });
  } catch (err: any) {
    console.error('Admin revenue analytics error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
