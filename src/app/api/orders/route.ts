import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query: any = {};
    if (currentUser.role === 'FARMER') {
      query.supplierIds = currentUser._id.toString();
    } else if (currentUser.role === 'BUYER') {
      query.buyerId = currentUser._id.toString();
    }
    // Admin sees all

    if (status && status !== 'ALL') {
      query.orderStatus = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
