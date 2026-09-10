import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, FulfillmentEvent, Notification, AuditLog } from '@/models';
import { authenticateUser } from '@/lib/auth';
import { FulfillmentStage, OrderStatus } from '@/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    const body = await req.json();
    const { stage, title, description } = body;

    if (!stage) {
      return NextResponse.json({ success: false, error: 'Stage is required' }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findById(params.id);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const isSupplier = order.supplierIds.includes(currentUser._id.toString());
    const isBuyer = order.buyerId === currentUser._id.toString();

    if (!isSupplier && !isBuyer && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You are not authorized to update fulfillment on this order.' },
        { status: 403 }
      );
    }

    order.currentFulfillmentStage = stage as FulfillmentStage;

    // Map fulfillment stage to OrderStatus
    const stageToStatusMap: Record<string, OrderStatus> = {
      ORDER_CONFIRMED: 'CONFIRMED',
      PRODUCE_PREPARED: 'PROCESSING',
      QUALITY_VERIFIED: 'PROCESSING',
      PACKED: 'READY_FOR_DISPATCH',
      IN_TRANSIT: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
    };

    if (stageToStatusMap[stage]) {
      order.orderStatus = stageToStatusMap[stage];
    }

    await order.save();

    // Mark event as completed or create if not exists
    let event = await FulfillmentEvent.findOne({ orderId: order._id, stage });
    if (event) {
      event.completed = true;
      event.timestamp = new Date();
      if (description) event.description = description;
      await event.save();
    } else {
      event = await FulfillmentEvent.create({
        orderId: order._id,
        stage,
        title: title || stage.replace(/_/g, ' '),
        description: description || `Status updated to ${stage}`,
        actorId: currentUser._id.toString(),
        actorRole: currentUser.role,
        timestamp: new Date(),
        completed: true,
      });
    }

    // Notify buyer
    const recipientId = isSupplier ? order.buyerId : order.supplierIds[0];
    await Notification.create({
      userId: recipientId,
      title: `Order Update: ${event.title}`,
      message: `Order ${order.orderNumber} reached stage: ${event.title}.`,
      type: 'FULFILLMENT',
      link: isSupplier ? `/buyer/orders` : `/farmer/orders`,
    });

    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'UPDATE_FULFILLMENT_STAGE',
      resource: 'Order',
      resourceId: order._id.toString(),
      details: { stage, orderStatus: order.orderStatus },
    });

    return NextResponse.json({ success: true, data: { order, event } });
  } catch (err: any) {
    console.error('Update fulfillment error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
