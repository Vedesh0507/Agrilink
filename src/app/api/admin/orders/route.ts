import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, FulfillmentEvent, Notification } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency } from '@/lib/audit';

// GET list all orders with filters
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'ORDERS_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view global orders.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const stage = searchParams.get('stage');
    const q = searchParams.get('q');

    const filter: any = {};
    if (status && status !== 'ALL') filter.orderStatus = status;
    if (stage && stage !== 'ALL') filter.currentFulfillmentStage = stage;
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { buyerName: { $regex: q, $options: 'i' } },
        { deliveryLocation: { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH admin intervention on order stage, delay, or cancellation
export async function PATCH(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse } = checkIdempotency(req);
    if (isDuplicate) return NextResponse.json(cachedResponse);

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'ORDERS_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to modify orders.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, orderStatus, currentFulfillmentStage, reason, notes } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Target orderId is required.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid operational reason (min 5 characters) is required for order modifications.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const targetOrder = await Order.findById(orderId);
    if (!targetOrder) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const beforeState = {
      orderStatus: targetOrder.orderStatus,
      currentFulfillmentStage: targetOrder.currentFulfillmentStage,
    };

    if (orderStatus) targetOrder.orderStatus = orderStatus;
    if (currentFulfillmentStage) targetOrder.currentFulfillmentStage = currentFulfillmentStage;
    if (notes) targetOrder.notes = notes;

    await targetOrder.save();

    const afterState = {
      orderStatus: targetOrder.orderStatus,
      currentFulfillmentStage: targetOrder.currentFulfillmentStage,
    };

    // Log fulfillment event if stage was updated
    if (currentFulfillmentStage) {
      await FulfillmentEvent.create({
        orderId: targetOrder._id.toString(),
        stage: currentFulfillmentStage,
        title: `Stage Overridden by Operations: ${currentFulfillmentStage}`,
        description: `Operations intervention: ${reason}`,
        actorId: currentUser ? currentUser._id.toString() : 'admin_session',
        actorRole: 'ADMIN',
        completed: true,
        timestamp: new Date(),
      });
    }

    // Record immutable audit entry
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'ADMIN_ORDER_OVERRIDE',
      resource: 'Order',
      resourceId: orderId,
      details: { orderStatus, currentFulfillmentStage, notes },
      beforeState,
      afterState,
      reason,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Order #${targetOrder.orderNumber} updated successfully.`,
      data: targetOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
