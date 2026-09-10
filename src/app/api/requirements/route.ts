import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BuyerRequirement, ProduceListing, Match, AuditLog, Notification } from '@/models';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { BuyerRequirementSchema } from '@/validators';
import { MatchingService } from '@/services/matchingService';

// GET buyer requirements
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');
    const product = searchParams.get('product');
    const status = searchParams.get('status') || 'OPEN';

    const filter: any = {};
    if (buyerId) filter.buyerId = buyerId;
    if (product) filter.product = { $regex: product, $options: 'i' };
    if (status !== 'ALL') filter.status = status;

    const requirements = await BuyerRequirement.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: requirements });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create buyer procurement requirement (Buyer only)
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    if (!authorizeRoles(currentUser, ['BUYER', 'ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only registered buyers can create procurement requirements.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = BuyerRequirementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid requirement data', details: validation.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = validation.data;

    const requirement = await BuyerRequirement.create({
      ...data,
      buyerId: currentUser._id.toString(),
      buyerName: currentUser.name,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      status: 'OPEN',
      fulfilledQuantity: 0,
    });

    // Run deterministic matching engine immediately against available produce supply
    const availableListings = await ProduceListing.find({ status: 'AVAILABLE', availableQuantity: { $gt: 0 } });
    const matches = MatchingService.generateMatches(requirement, availableListings);

    for (const m of matches) {
      await Match.create(m);
    }

    // In-app notification if matches found
    if (matches.length > 0) {
      const topMatch = matches[0];
      await Notification.create({
        userId: currentUser._id.toString(),
        title: topMatch.matchType === 'AGGREGATED_SUPPLY' ? 'Aggregated Supply Match Found!' : 'Matching Supplier Available',
        message: `Found ${matches.length} matching supply opportunities for ${requirement.product} (${requirement.requiredQuantity} kg).`,
        type: 'MATCH',
        link: `/buyer/matches?requirementId=${requirement._id}`,
      });
    }

    // Audit log
    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'CREATE_BUYER_REQUIREMENT',
      resource: 'BuyerRequirement',
      resourceId: requirement._id.toString(),
      details: { product: requirement.product, quantity: requirement.requiredQuantity, matchesGenerated: matches.length },
    });

    return NextResponse.json({ success: true, data: requirement, matchesCount: matches.length }, { status: 201 });
  } catch (err: any) {
    console.error('Create requirement error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
