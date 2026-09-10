import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Organization } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency } from '@/lib/audit';

// GET list users with search and filtering
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'USERS_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view user directory.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const kyc = searchParams.get('kyc');
    const location = searchParams.get('location');

    const filter: any = {};
    if (role && role !== 'ALL') filter.role = role;
    if (status && status !== 'ALL') filter.accountStatus = status;
    if (kyc && kyc !== 'ALL') filter.kycStatus = kyc;
    if (location) filter.location = { $regex: location, $options: 'i' };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .populate('organizationId', 'name type gstin')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH update user account status or admin sub-role with mandatory reason and audit
export async function PATCH(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse } = checkIdempotency(req);
    if (isDuplicate) return NextResponse.json(cachedResponse);

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'USERS_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to modify user account.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, accountStatus, adminSubRole, reason } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Target userId is required.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid operational reason (min 5 characters) is required for this action.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const beforeState = {
      accountStatus: targetUser.accountStatus,
      adminSubRole: targetUser.adminSubRole,
      role: targetUser.role,
    };

    if (accountStatus) targetUser.accountStatus = accountStatus;
    if (adminSubRole !== undefined) targetUser.adminSubRole = adminSubRole;

    await targetUser.save();

    const afterState = {
      accountStatus: targetUser.accountStatus,
      adminSubRole: targetUser.adminSubRole,
      role: targetUser.role,
    };

    // Record immutable audit log
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'USER_ACCOUNT_UPDATED',
      resource: 'User',
      resourceId: userId,
      details: { accountStatus, adminSubRole },
      beforeState,
      afterState,
      reason,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `User status updated successfully to ${targetUser.accountStatus}.`,
      data: targetUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
