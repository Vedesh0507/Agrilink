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

    let buyerId: string;
    let buyerName: string;
    let supplierId: string;
    let supplierName: string;
    let targetNotifyUserId: string;
    let notifyTitle: string;
    let notifyMessage: string;
    let notifyLink: string;

    if (currentUser.role === 'FARMER') {
      supplierId = currentUser._id.toString();
      supplierName = currentUser.name;

      const targetBuyerId = data.buyerId;
      if (!targetBuyerId) {
        return NextResponse.json({ success: false, error: 'buyerId is required for farmer supply offer' }, { status: 400 });
      }

      const buyer = await User.findById(targetBuyerId);
      if (!buyer) {
        return NextResponse.json({ success: false, error: 'Target buyer not found' }, { status: 404 });
      }

      buyerId = buyer._id.toString();
      buyerName = buyer.name;
      targetNotifyUserId = buyerId;
      notifyTitle = 'Direct Farmer Supply Offer Received!';
      notifyMessage = `${currentUser.name} offered to supply ${data.quantity} kg of ${data.product} at ₹${data.initialPrice}/kg.`;
      notifyLink = '/buyer?tab=quotations';
    } else {
      buyerId = currentUser._id.toString();
      buyerName = currentUser.name;

      const targetSupplierId = data.supplierId;
      if (!targetSupplierId) {
        return NextResponse.json({ success: false, error: 'supplierId is required for buyer quotation request' }, { status: 400 });
      }

      const supplier = await User.findById(targetSupplierId);
      if (!supplier) {
        return NextResponse.json({ success: false, error: 'Target supplier not found' }, { status: 404 });
      }

      supplierId = supplier._id.toString();
      supplierName = supplier.name;
      targetNotifyUserId = supplierId;
      notifyTitle = 'New Quotation Request Received';
      notifyMessage = `${currentUser.name} requested a quotation for ${data.quantity} kg of ${data.product} at ₹${data.initialPrice}/kg.`;
      notifyLink = '/farmer?tab=quotations';
    }

    const quotationNumber = `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const quotation = await Quotation.create({
      quotationNumber,
      requirementId: data.requirementId || undefined,
      matchId: data.matchId || undefined,
      buyerId,
      buyerName,
      supplierId,
      supplierName,
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
          notes: data.notes || (currentUser.role === 'FARMER' ? 'Direct producer supply offer submitted.' : 'Initial quotation request submitted.'),
          createdAt: new Date(),
        },
      ],
    });

    // In-app notification for the counter-party
    await Notification.create({
      userId: targetNotifyUserId,
      title: notifyTitle,
      message: notifyMessage,
      type: 'QUOTATION',
      link: notifyLink,
    });

    // Audit log
    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: currentUser.role === 'FARMER' ? 'FARMER_SUPPLY_OFFER' : 'CREATE_QUOTATION_REQUEST',
      resource: 'Quotation',
      resourceId: quotation._id.toString(),
      details: {
        buyerId,
        supplierId,
        product: data.product,
        price: data.initialPrice,
        quantity: data.quantity,
      },
    });

    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (err: any) {
    console.error('Create quotation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
