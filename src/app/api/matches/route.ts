import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Match, BuyerRequirement, ProduceListing } from '@/models';
import { MatchingService } from '@/services/matchingService';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const requirementId = searchParams.get('requirementId');
    const buyerId = searchParams.get('buyerId');

    const filter: any = {};
    if (requirementId) filter.requirementId = requirementId;
    if (buyerId) filter.buyerId = buyerId;

    const matches = await Match.find(filter)
      .populate('requirementId')
      .sort({ totalScore: -1, createdAt: -1 });

    return NextResponse.json({ success: true, data: matches });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Re-run matching engine for a requirement
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const { requirementId } = await req.json();
    if (!requirementId) {
      return NextResponse.json({ success: false, error: 'requirementId is required' }, { status: 400 });
    }

    await connectToDatabase();
    const requirement = await BuyerRequirement.findById(requirementId);
    if (!requirement) {
      return NextResponse.json({ success: false, error: 'Requirement not found' }, { status: 404 });
    }

    const availableListings = await ProduceListing.find({
      status: 'AVAILABLE',
      availableQuantity: { $gt: 0 },
    });

    const newMatches = MatchingService.generateMatches(requirement, availableListings);

    // Delete old proposed matches for this requirement and insert fresh ones
    await Match.deleteMany({ requirementId, status: 'PROPOSED' });

    const inserted = [];
    for (const m of newMatches) {
      const doc = await Match.create(m);
      inserted.push(doc);
    }

    return NextResponse.json({ success: true, data: inserted, count: inserted.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
