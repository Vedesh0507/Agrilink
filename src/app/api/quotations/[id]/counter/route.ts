import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Quotation, AuditLog, Notification } from '@/models';
import { authenticateUser } from '@/lib/auth';
import { CounterOfferSchema } from '@/validators';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    const body = await req.json();
    const validation = CounterOfferSchema.safeParse({ ...body, quotationId: params.id });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid counter-offer', details: validation.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const quotation = await Quotation.findById(params.id);

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status === 'ACCEPTED' || quotation.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: `Cannot counter a quotation with status: ${quotation.status}` },
        { status: 400 }
      );
    }

    // Must be either the buyer or the supplier or admin
    const isBuyer = quotation.buyerId === currentUser._id.toString();
    const isSupplier = quotation.supplierId === currentUser._id.toString();

    if (!isBuyer && !isSupplier && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You are not a party to this quotation.' },
        { status: 403 }
      );
    }

    const { proposedPrice, quantity, notes } = validation.data;

    // Append counter-offer to history
    quotation.counterHistory.push({
      senderId: currentUser._id.toString(),
      senderRole: currentUser.role,
      senderName: currentUser.name,
      proposedPrice,
      quantity: quantity || quotation.quantity,
      notes: notes || `Counter offer submitted at ₹${proposedPrice}/kg`,
      createdAt: new Date(),
    });

    quotation.currentAgreedPrice = proposedPrice;
    quotation.status = 'COUNTERED';
    await quotation.save();

    // Determine recipient to notify
    const recipientId = isBuyer ? quotation.supplierId : quotation.buyerId;
    const targetLink = isBuyer ? '/farmer/quotations' : '/buyer/quotations';

    await Notification.create({
      userId: recipientId,
      title: 'New Counter-Offer Received',
      message: `${currentUser.name} submitted a counter-offer of ₹${proposedPrice}/kg for ${quotation.product}.`,
      type: 'COUNTER_OFFER',
      link: targetLink,
    });

    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'SUBMIT_COUNTER_OFFER',
      resource: 'Quotation',
      resourceId: quotation._id.toString(),
      details: { proposedPrice, notes },
    });

    return NextResponse.json({ success: true, data: quotation });
  } catch (err: any) {
    console.error('Counter offer error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
