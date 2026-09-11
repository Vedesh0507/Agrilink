import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BuyerRequirement, ProduceListing, Match, AuditLog, Notification, User, Organization } from '@/models';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { BuyerRequirementSchema } from '@/validators';
import { MatchingService } from '@/services/matchingService';
import { canCreateRequirement, recordRequirementUsage } from '@/lib/entitlement';

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

    const requirements = await BuyerRequirement.find(filter).sort({ createdAt: -1 }).lean();

    const buyerIds = Array.from(new Set(requirements.map((r: any) => r.buyerId).filter(Boolean)));
    const buyers = await User.find({ _id: { $in: buyerIds } })
      .select('name phone alternatePhone email organizationId location')
      .populate('organizationId', 'name')
      .lean();
    const buyerMap = new Map(buyers.map((b: any) => [b._id.toString(), b]));

    const enriched = requirements.map((r: any) => {
      const buyer: any = buyerMap.get(r.buyerId);
      return {
        ...r,
        buyerPhone: buyer?.phone || '+91 99999 00000',
        buyerAlternatePhone: buyer?.alternatePhone || '',
        buyerEmail: buyer?.email || '',
        buyerOrg: buyer?.organizationId?.name || r.organizationName || 'Institutional Wholesale Buyer',
        buyerLocation: buyer?.location || r.deliveryLocation,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
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

    // Resolve buyer organization for subscription entitlement verification
    let orgId = currentUser.organizationId as any;
    if (!orgId) {
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

    // Enforce server-side subscription entitlement
    const entitlement = await canCreateRequirement(orgId);
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: entitlement.reason,
          code: 'PLAN_LIMIT_REACHED',
          currentUsed: entitlement.currentUsed,
          limit: entitlement.limit,
          planCode: entitlement.planCode,
        },
        { status: 403 }
      );
    }

    const data = validation.data;

    const requirement = await BuyerRequirement.create({
      ...data,
      buyerId: currentUser._id.toString(),
      buyerName: currentUser.name,
      requiredDeliveryDate: new Date(data.requiredDeliveryDate),
      status: 'OPEN',
      fulfilledQuantity: 0,
    });

    // Record requirement usage against subscription counter
    await recordRequirementUsage(orgId);


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
