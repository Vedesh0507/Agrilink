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

// Re-run matching engine for a requirement or buyer
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json().catch(() => ({}));
    const requirementId = body.requirementId;
    const buyerId = body.buyerId || (requirementId ? undefined : context!.user._id.toString());

    await connectToDatabase();

    const availableListings = await ProduceListing.find({
      status: 'AVAILABLE',
      availableQuantity: { $gt: 0 },
    });

    let requirementsToProcess: any[] = [];
    if (requirementId) {
      const requirement = await BuyerRequirement.findById(requirementId);
      if (!requirement) {
        return NextResponse.json({ success: false, error: 'Requirement not found' }, { status: 404 });
      }
      requirementsToProcess = [requirement];
    } else if (buyerId) {
      requirementsToProcess = await BuyerRequirement.find({ buyerId, status: 'OPEN' });
    } else {
      return NextResponse.json({ success: false, error: 'requirementId or buyerId is required' }, { status: 400 });
    }

    const inserted: any[] = [];
    for (const reqDoc of requirementsToProcess) {
      const newMatches = MatchingService.generateMatches(reqDoc, availableListings);
      await Match.deleteMany({ requirementId: reqDoc._id.toString(), status: 'PROPOSED' });
      for (const m of newMatches) {
        const doc = await Match.create(m);
        inserted.push(doc);
      }
    }

    return NextResponse.json({ success: true, data: inserted, count: inserted.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
