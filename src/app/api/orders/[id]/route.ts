import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order, FulfillmentEvent } from '@/models';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    await connectToDatabase();

    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Access check
    const isBuyer = order.buyerId === currentUser._id.toString();
    const isSupplier = order.supplierIds.includes(currentUser._id.toString());

    if (!isBuyer && !isSupplier && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to view this order.' },
        { status: 403 }
      );
    }

    const fulfillmentEvents = await FulfillmentEvent.find({ orderId: order._id }).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      data: {
        order,
        fulfillmentEvents,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
