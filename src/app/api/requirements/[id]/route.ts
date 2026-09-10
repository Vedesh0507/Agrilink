import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BuyerRequirement, Match } from '@/models';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const requirement = await BuyerRequirement.findById(params.id);
    if (!requirement) {
      return NextResponse.json({ success: false, error: 'Requirement not found' }, { status: 404 });
    }
    const matches = await Match.find({ requirementId: params.id }).sort({ totalScore: -1 });
    return NextResponse.json({ success: true, data: { requirement, matches } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    await connectToDatabase();
    const requirement = await BuyerRequirement.findById(params.id);

    if (!requirement) {
      return NextResponse.json({ success: false, error: 'Requirement not found' }, { status: 404 });
    }

    if (requirement.buyerId !== currentUser._id.toString() && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to update this requirement.' },
        { status: 403 }
      );
    }

    const updates = await req.json();
    const allowed = ['status', 'notes', 'targetPricePerUnit', 'requiredQuantity'];
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        (requirement as any)[key] = updates[key];
      }
    }

    await requirement.save();
    return NextResponse.json({ success: true, data: requirement });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
