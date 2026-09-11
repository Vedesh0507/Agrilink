import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import {
  User,
  Organization,
  ProduceListing,
  BuyerRequirement,
  Match,
  Quotation,
  Order,
  AuditLog,
  Dispute,
  PlatformConfig,
} from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { error, context } = await authenticateUser(req);
    const user = context?.user;

    if (!verifyAdminPermission(req, user, 'METRICS_VIEW')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Platform operations administrative clearance required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const dbPingStart = Date.now();
    await User.findOne().select('_id').lean();
    const databaseLatencyMs = Date.now() - dbPingStart;

    const now = new Date();

    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalOrganizations,
      totalListings,
      totalRequirements,
      totalMatches,
      totalQuotations,
      totalOrders,
      totalDisputes,
      pendingKycCount,
      delayedOrdersCount,
      openDisputesCount,
      pendingQuotationsCount,
      recentAuditLogs,
      listingsData,
      requirementsData,
      ordersData,
      disputesData,
      platformConfig,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'FARMER' }),
      User.countDocuments({ role: 'BUYER' }),
      Organization.countDocuments(),
      ProduceListing.countDocuments(),
      BuyerRequirement.countDocuments(),
      Match.countDocuments(),
      Quotation.countDocuments(),
      Order.countDocuments(),
      Dispute.countDocuments(),
      User.countDocuments({ kycStatus: { $in: ['PENDING', 'SUBMITTED'] } }),
      Order.countDocuments({
        orderStatus: { $in: ['CONFIRMED', 'PROCESSING', 'READY_FOR_DISPATCH', 'IN_TRANSIT'] },
        deliveryDate: { $lt: now },
      }),
      Dispute.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
      Quotation.countDocuments({ status: { $in: ['REQUESTED', 'COUNTERED'] } }),
      AuditLog.find().sort({ timestamp: -1 }).limit(20).lean(),
      ProduceListing.find().sort({ createdAt: -1 }).limit(50).lean(),
      BuyerRequirement.find().sort({ createdAt: -1 }).limit(25).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
      Dispute.find().sort({ createdAt: -1 }).limit(5).lean(),
      PlatformConfig.findOne().lean(),
    ]);

    // Aggregate Supply Volume
    const supplyAggregation = await ProduceListing.aggregate([
      { $match: { status: 'AVAILABLE' } },
      { $group: { _id: null, totalQty: { $sum: '$availableQuantity' } } },
    ]);
    const totalAvailableSupplyKg = supplyAggregation[0]?.totalQty || 0;

    // Aggregate Open Demand Volume
    const demandAggregation = await BuyerRequirement.aggregate([
      { $match: { status: 'OPEN' } },
      { $group: { _id: null, totalQty: { $sum: '$requiredQuantity' } } },
    ]);
    const totalOpenDemandKg = demandAggregation[0]?.totalQty || 0;

    // GMV & Commercial Value
    const orderValueAggregation = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalVal: { $sum: '$totalValue' } } },
    ]);
    const totalGMV = orderValueAggregation[0]?.totalVal || 0;
    const commissionPercent = platformConfig?.platformCommissionPercent || 2.5;
    const platformRevenue = Math.round((totalGMV * commissionPercent) / 100);

    // Calculate unfulfilled shortfall requirements based on real product-specific inventory
    const openReqs = await BuyerRequirement.find({ status: 'OPEN' }).lean();
    let unfulfilledDemandCount = 0;
    for (const r of openReqs) {
      const availableAgg = await ProduceListing.aggregate([
        { $match: { status: 'AVAILABLE', product: { $regex: new RegExp(`^${r.product}$`, 'i') } } },
        { $group: { _id: null, total: { $sum: '$availableQuantity' } } },
      ]);
      const availableForProduct = availableAgg[0]?.total || 0;
      if ((r.requiredQuantity || 0) > availableForProduct) {
        unfulfilledDemandCount++;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalFarmers,
          totalBuyers,
          totalOrganizations,
          totalListings,
          totalRequirements,
          totalMatches,
          totalQuotations,
          totalOrders,
          totalDisputes,
          totalAvailableSupplyKg,
          totalOpenDemandKg,
          totalGMV,
          platformRevenue,
          commissionPercent,
        },
        attentionAlerts: {
          unfulfilledDemandCount,
          delayedOrdersCount,
          openDisputesCount,
          pendingQuotationsCount,
          pendingKycCount,
        },
        systemHealth: {
          apiStatus: 'HEALTHY',
          databaseStatus: 'HEALTHY',
          databaseLatencyMs,
          executionTimeMs,
          nodeUptimeSeconds: Math.round(process.uptime()),
          memoryHeapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          integrations: {
            database: { name: 'MongoDB Atlas', status: 'CONNECTED', type: 'Primary Data Store' },
            auth: { name: 'Firebase & Custom JWT', status: 'OPERATIONAL', type: 'Identity Provider' },
            messaging: { name: 'WhatsApp Webhooks & SMS', status: 'READY', type: 'Direct Gateway' },
            storage: { name: 'Cloudinary / S3 Storage', status: 'READY', type: 'Media Storage' },
            payments: { name: 'Payment Settlement Ledger', status: 'INTERNAL_LEDGER', type: 'B2B Bank Settlement' },
          },
        },
        recentAuditLogs,
        listingsData,
        requirementsData,
        ordersData,
        disputesData,
        platformConfig,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

