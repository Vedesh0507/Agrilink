import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProduceListing } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency } from '@/lib/audit';

// GET list supply produce lots
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'SUPPLY_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view global supply inventory.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const product = searchParams.get('product');
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    const filter: any = {};
    if (product) filter.product = { $regex: product, $options: 'i' };
    if (status && status !== 'ALL') filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const listings = await ProduceListing.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: listings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH adjust inventory lot status or available quantity with mandatory reason
export async function PATCH(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse } = checkIdempotency(req);
    if (isDuplicate) return NextResponse.json(cachedResponse);

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'SUPPLY_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to adjust supply inventory.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { listingId, status, availableQuantity, reason } = body;

    if (!listingId) {
      return NextResponse.json({ success: false, error: 'ListingId is required.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid operational reason (min 5 characters) is required for inventory adjustments.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const listing = await ProduceListing.findById(listingId);
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Produce listing not found.' }, { status: 404 });
    }

    const beforeState = {
      status: listing.status,
      availableQuantity: listing.availableQuantity,
    };

    if (status) listing.status = status;
    if (availableQuantity !== undefined) listing.availableQuantity = Number(availableQuantity);

    await listing.save();

    const afterState = {
      status: listing.status,
      availableQuantity: listing.availableQuantity,
    };

    // Record immutable audit entry
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'SUPPLY_LOT_ADJUSTED',
      resource: 'ProduceListing',
      resourceId: listingId,
      details: { status, availableQuantity },
      beforeState,
      afterState,
      reason,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Produce lot #${listingId.slice(-6)} updated successfully.`,
      data: listing,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
