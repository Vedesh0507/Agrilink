import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MarketplaceAnnouncement, User, Notification } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET list past announcements
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'BROADCAST_SEND')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to access broadcast center.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const announcements = await MarketplaceAnnouncement.find().sort({ sentAt: -1 }).limit(50).lean();
    return NextResponse.json({ success: true, data: announcements });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST dispatch new targeted announcement
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'BROADCAST_SEND')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to dispatch broadcasts.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, message, targetAudience, targetDistrict, targetCommodity } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Broadcast title and message content are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const announcement = await MarketplaceAnnouncement.create({
      title,
      message,
      targetAudience: targetAudience || 'ALL',
      targetDistrict: targetDistrict || '',
      targetCommodity: targetCommodity || '',
      sentBy: currentUser ? currentUser.name : 'Platform Operations Team',
      sentAt: new Date(),
    });

    // Find targeted recipients
    const userFilter: any = {};
    if (targetAudience && targetAudience !== 'ALL') {
      userFilter.role = targetAudience;
    }
    if (targetDistrict) {
      userFilter.location = { $regex: targetDistrict, $options: 'i' };
    }

    const targetUsers = await User.find(userFilter).select('_id').lean();

    // Fan-out notifications to recipient inboxes
    const notifications = targetUsers.map((u: any) => ({
      userId: u._id.toString(),
      title: `📢 ${title}`,
      message,
      type: 'SYSTEM',
      read: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Record audit entry
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'MARKETPLACE_BROADCAST_SENT',
      resource: 'MarketplaceAnnouncement',
      resourceId: announcement._id.toString(),
      details: { title, targetAudience, targetDistrict, recipientCount: targetUsers.length },
      reason: `Regional broadcast sent to ${targetUsers.length} platform members`,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Announcement dispatched to ${targetUsers.length} recipients.`,
      data: announcement,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
