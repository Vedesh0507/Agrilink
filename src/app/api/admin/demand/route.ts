import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BuyerRequirement, Match, ProduceListing } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { MatchingService } from '@/services/matchingService';
import { createAuditEntry } from '@/lib/audit';

// GET list buyer requirements with exact shortfall calculation
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'DEMAND_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view buyer procurement demand.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const product = searchParams.get('product');
    const status = searchParams.get('status');

    const filter: any = {};
    if (product) filter.product = { $regex: product, $options: 'i' };
    if (status && status !== 'ALL') filter.status = status;

    const requirements = await BuyerRequirement.find(filter).sort({ createdAt: -1 }).limit(100).lean();

    // Enrich requirements with real-time match & shortfall metrics
    const reqIds = requirements.map((r: any) => r._id);
    const matches = await Match.find({ requirementId: { $in: reqIds } }).lean();

    const matchMap = new Map<string, any>();
    matches.forEach((m: any) => {
      const reqIdStr = typeof m.requirementId === 'object' ? m.requirementId?._id?.toString() : m.requirementId?.toString();
      if (!matchMap.has(reqIdStr) || (m.totalScore || 0) > (matchMap.get(reqIdStr)?.totalScore || 0)) {
        matchMap.set(reqIdStr, m);
      }
    });

    const enriched = requirements.map((req: any) => {
      const bestMatch = matchMap.get(req._id.toString());
      const matchedQuantity = bestMatch?.matchedQuantity || 0;
      const shortfallQuantity = Math.max(0, (req.requiredQuantity || 0) - matchedQuantity);
      const supplierCount = bestMatch?.suppliers?.length || 0;

      return {
        ...req,
        matchedQuantity,
        shortfallQuantity,
        supplierCount,
        hasBestMatch: !!bestMatch,
        matchScore: bestMatch?.totalScore || 0,
        isFullyFulfilled: bestMatch?.isFullyFulfilled || false,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST trigger manual knapsack re-aggregation ("Find Additional Supply")
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'DEMAND_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to trigger supply matching.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requirementId, reason } = body;

    if (!requirementId) {
      return NextResponse.json({ success: false, error: 'RequirementId is required.' }, { status: 400 });
    }

    await connectToDatabase();
    const requirement = await BuyerRequirement.findById(requirementId);
    if (!requirement) {
      return NextResponse.json({ success: false, error: 'Requirement not found.' }, { status: 404 });
    }

    const availableLots = await ProduceListing.find({
      status: 'AVAILABLE',
      availableQuantity: { $gt: 0 },
    }).lean();

    const matches = MatchingService.generateMatches(requirement, availableLots as any);

    // Record audit entry
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'TRIGGER_ADDITIONAL_SUPPLY_SEARCH',
      resource: 'BuyerRequirement',
      resourceId: requirementId,
      details: { matchCount: matches.length, product: requirement.product },
      reason: reason || 'Manual operations knapsack search triggered for requirement shortfall',
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Matching engine evaluated ${matches.length} candidate supply proposals.`,
      data: matches,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
