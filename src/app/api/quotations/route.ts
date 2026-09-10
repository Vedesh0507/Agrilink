import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Quotation, User, BuyerRequirement, AuditLog, Notification } from '@/models';
import { authenticateUser } from '@/lib/auth';
import { QuotationRequestSchema } from '@/validators';

// GET quotations (for current user - either as buyer or supplier)
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
      query.supplierId = currentUser._id.toString();
    } else if (currentUser.role === 'BUYER') {
      query.buyerId = currentUser._id.toString();
    }
    // Admin sees all

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const quotations = await Quotation.find(query).sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: quotations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create a quotation request (Buyer initiates)
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    const body = await req.json();
    const validation = QuotationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid quotation request', details: validation.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = validation.data;

    // Find supplier details
    const supplier = await User.findById(data.supplierId);
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    const quotationNumber = `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const quotation = await Quotation.create({
      quotationNumber,
      requirementId: data.requirementId || undefined,
      matchId: data.matchId || undefined,
      buyerId: currentUser._id.toString(),
      buyerName: currentUser.name,
      supplierId: supplier._id.toString(),
      supplierName: supplier.name,
      product: data.product,
      quantity: data.quantity,
      unit: data.unit || 'kg',
      qualityGrade: data.qualityGrade,
      initialPrice: data.initialPrice,
      currentAgreedPrice: data.initialPrice,
      deliveryLocation: data.deliveryLocation,
      deliveryDate: new Date(data.deliveryDate),
      status: 'REQUESTED',
      validUntil,
      counterHistory: [
        {
          senderId: currentUser._id.toString(),
          senderRole: currentUser.role,
          senderName: currentUser.name,
          proposedPrice: data.initialPrice,
          quantity: data.quantity,
          notes: data.notes || 'Initial quotation request submitted.',
          createdAt: new Date(),
        },
      ],
    });

    // Notify Supplier
    await Notification.create({
      userId: supplier._id.toString(),
      title: 'New Quotation Request Received',
      message: `${currentUser.name} requested a quotation for ${data.quantity} kg of ${data.product} at ₹${data.initialPrice}/kg.`,
      type: 'QUOTATION',
      link: `/farmer/quotations`,
    });

    // Audit log
    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'CREATE_QUOTATION_REQUEST',
      resource: 'Quotation',
      resourceId: quotation._id.toString(),
      details: { supplierId: supplier._id, product: data.product, price: data.initialPrice },
    });

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (err: any) {
    console.error('Create quotation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
