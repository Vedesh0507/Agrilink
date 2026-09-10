import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Dispute, Order, Notification } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency } from '@/lib/audit';

// GET list disputes
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'DISPUTES_RESOLVE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to access dispute triage.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;

    const disputes = await Dispute.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: disputes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST resolve dispute with settlement details and audit
export async function POST(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse } = checkIdempotency(req);
    if (isDuplicate) return NextResponse.json(cachedResponse);

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'DISPUTES_RESOLVE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to resolve disputes.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { disputeId, status, resolutionNotes, settlementAmount } = body;

    if (!disputeId || !status || !['RESOLVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'DisputeId and final status (RESOLVED or REJECTED) are required.' },
        { status: 400 }
      );
    }

    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Detailed resolution notes (min 5 characters) are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const targetDispute = await Dispute.findById(disputeId);
    if (!targetDispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found.' }, { status: 404 });
    }

    const beforeState = {
      status: targetDispute.status,
      settlementAmount: targetDispute.settlementAmount,
    };

    targetDispute.status = status;
    targetDispute.resolutionNotes = resolutionNotes;
    targetDispute.settlementAmount = settlementAmount || 0;
    targetDispute.resolvedById = currentUser ? currentUser._id.toString() : 'admin_session';
    targetDispute.resolvedByName = currentUser ? currentUser.name : 'Operations Lead';
    targetDispute.resolvedAt = new Date();
    await targetDispute.save();

    const afterState = {
      status: targetDispute.status,
      settlementAmount: targetDispute.settlementAmount,
    };

    // If order is linked, update order status
    if (targetDispute.orderId) {
      await Order.findByIdAndUpdate(targetDispute.orderId, {
        orderStatus: status === 'RESOLVED' ? 'COMPLETED' : 'CONFIRMED',
      });
    }

    // Notify parties
    await Promise.all([
      Notification.create({
        userId: targetDispute.raisedById,
        title: `Dispute #${targetDispute.disputeNumber} Closed`,
        message: `Your dispute resolution: ${resolutionNotes}. Settlement: ₹${targetDispute.settlementAmount}.`,
        type: 'ORDER',
        read: false,
      }),
      Notification.create({
        userId: targetDispute.counterPartyId,
        title: `Dispute #${targetDispute.disputeNumber} Resolution`,
        message: `Operations resolution for Order dispute: ${resolutionNotes}. Settlement: ₹${targetDispute.settlementAmount}.`,
        type: 'ORDER',
        read: false,
      }),
    ]);

    // Record immutable audit log
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'DISPUTE_RESOLVED',
      resource: 'Dispute',
      resourceId: disputeId,
      details: { resolutionNotes, settlementAmount, status },
      beforeState,
      afterState,
      reason: resolutionNotes,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Dispute #${targetDispute.disputeNumber} has been resolved successfully.`,
      data: targetDispute,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
