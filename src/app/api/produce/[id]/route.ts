import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProduceListing, AuditLog } from '@/models';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const listing = await ProduceListing.findById(params.id);
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: listing });
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
    const listing = await ProduceListing.findById(params.id);

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Ownership check: farmer must own this listing or be ADMIN
    if (listing.farmerId !== currentUser._id.toString() && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to modify this listing.' },
        { status: 403 }
      );
    }

    const updates = await req.json();
    const allowedUpdates = ['quantity', 'availableQuantity', 'expectedPricePerUnit', 'status', 'description', 'location'];
    
    for (const key of Object.keys(updates)) {
      if (allowedUpdates.includes(key)) {
        (listing as any)[key] = updates[key];
      }
    }

    await listing.save();

    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'UPDATE_PRODUCE_LISTING',
      resource: 'ProduceListing',
      resourceId: listing._id.toString(),
      details: updates,
    });

    return NextResponse.json({ success: true, data: listing });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
