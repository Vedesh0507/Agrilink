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
} from '@/models';
import { authenticateUser, verifyAdminAccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    
    // Check if user is authenticated and is ADMIN, or has admin secret key
    const user = context?.user;
    if (!verifyAdminAccess(req, user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Platform operations administrative clearance required.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      totalListings,
      totalRequirements,
      totalMatches,
      totalQuotations,
      totalOrders,
      recentAuditLogs,
      listingsData,
      requirementsData,
      ordersData,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'FARMER' }),
      User.countDocuments({ role: 'BUYER' }),
      ProduceListing.countDocuments(),
      BuyerRequirement.countDocuments(),
      Match.countDocuments(),
      Quotation.countDocuments(),
      Order.countDocuments(),
      AuditLog.find().sort({ timestamp: -1 }).limit(15),
      ProduceListing.find().sort({ createdAt: -1 }).limit(10),
      BuyerRequirement.find().sort({ createdAt: -1 }).limit(10),
      Order.find().sort({ createdAt: -1 }).limit(10),
    ]);

    // Aggregate total supply volume and target demand volume
    const supplyAggregation = await ProduceListing.aggregate([
      { $match: { status: 'AVAILABLE' } },
      { $group: { _id: null, totalQty: { $sum: '$availableQuantity' } } },
    ]);
    const totalAvailableSupplyKg = supplyAggregation[0]?.totalQty || 0;

    const demandAggregation = await BuyerRequirement.aggregate([
      { $match: { status: 'OPEN' } },
      { $group: { _id: null, totalQty: { $sum: '$requiredQuantity' } } },
    ]);
    const totalOpenDemandKg = demandAggregation[0]?.totalQty || 0;

    const orderValueAggregation = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalVal: { $sum: '$totalValue' } } },
    ]);
    const totalOrderValueINR = orderValueAggregation[0]?.totalVal || 0;

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalFarmers,
          totalBuyers,
          totalListings,
          totalRequirements,
          totalMatches,
          totalQuotations,
          totalOrders,
          totalAvailableSupplyKg,
          totalOpenDemandKg,
          totalOrderValueINR,
        },
        recentAuditLogs,
        listingsData,
        requirementsData,
        ordersData,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
