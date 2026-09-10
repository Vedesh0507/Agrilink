import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Notification } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry } from '@/lib/audit';

// GET list users pending KYC verification
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'KYC_VERIFY')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to access KYC verification queue.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const pendingUsers = await User.find({ kycStatus: { $in: ['PENDING', 'SUBMITTED'] } })
      .populate('organizationId')
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: pendingUsers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST approve or reject KYC with mandatory reason
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'KYC_VERIFY')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to verify KYC documents.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, decision, reason } = body;

    if (!userId || !decision || !['VERIFIED', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Target userId and decision (VERIFIED or REJECTED) are required.' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid operational reason (min 5 characters) is required for KYC decisions.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const beforeState = { kycStatus: targetUser.kycStatus };
    targetUser.kycStatus = decision;
    await targetUser.save();

    const afterState = { kycStatus: targetUser.kycStatus };

    // Create in-app notification for user
    await Notification.create({
      userId: targetUser._id.toString(),
      title: decision === 'VERIFIED' ? 'KYC Verification Approved!' : 'KYC Verification Notice',
      message:
        decision === 'VERIFIED'
          ? 'Your business and banking identity has been verified by the operations team. You now hold verified platform status.'
          : `Your KYC verification requires attention: ${reason}`,
      type: 'SYSTEM',
      read: false,
    });

    // Record immutable audit log
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: decision === 'VERIFIED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      resource: 'User',
      resourceId: userId,
      details: { decision, reason },
      beforeState,
      afterState,
      reason,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `KYC status for ${targetUser.name} updated to ${decision}.`,
      data: targetUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
