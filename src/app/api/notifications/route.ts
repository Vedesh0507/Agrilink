import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    await connectToDatabase();

    const notifications = await Notification.find({ userId: currentUser._id.toString() })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      userId: currentUser._id.toString(),
      read: false,
    });

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    await connectToDatabase();

    if (markAllRead) {
      await Notification.updateMany({ userId: currentUser._id.toString(), read: false }, { read: true });
    } else if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    return NextResponse.json({ success: true, message: 'Notifications updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
