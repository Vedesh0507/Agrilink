import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Quotation, Order, FulfillmentEvent, Notification, AuditLog, TransactionFee, LedgerEntry, Invoice, PlatformConfig, User, Organization } from '@/models';
import { authenticateUser } from '@/lib/auth';
import { getOrCreateOrganizationSubscription } from '@/lib/entitlement';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    await connectToDatabase();

    const quotation = await Quotation.findById(params.id);
    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });
    }

    if (quotation.status === 'ACCEPTED') {
      return NextResponse.json({ success: false, error: 'Quotation has already been accepted.' }, { status: 400 });
    }

    const isBuyer = quotation.buyerId === currentUser._id.toString();
    const isSupplier = quotation.supplierId === currentUser._id.toString();

    if (!isBuyer && !isSupplier && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot accept this quotation.' },
        { status: 403 }
      );
    }

    // Mark quotation as accepted
    quotation.status = 'ACCEPTED';
    quotation.counterHistory.push({
      senderId: currentUser._id.toString(),
      senderRole: currentUser.role,
      senderName: currentUser.name,
      proposedPrice: quotation.currentAgreedPrice,
      quantity: quotation.quantity,
      notes: `Final price of ₹${quotation.currentAgreedPrice}/kg accepted by ${currentUser.name}. Order generated.`,
      createdAt: new Date(),
    });
    await quotation.save();

    // Create Order in MongoDB
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const totalValue = quotation.quantity * quotation.currentAgreedPrice;

    const order = await Order.create({
      orderNumber,
      quotationId: quotation._id,
      buyerId: quotation.buyerId,
      buyerName: quotation.buyerName,
      supplierIds: [quotation.supplierId],
      items: [
        {
          supplierId: quotation.supplierId,
          supplierName: quotation.supplierName,
          product: quotation.product,
          quantity: quotation.quantity,
          unit: quotation.unit,
          agreedPricePerUnit: quotation.currentAgreedPrice,
          totalAmount: totalValue,
          qualityGrade: quotation.qualityGrade,
        },
      ],
      totalQuantity: quotation.quantity,
      totalValue,
      deliveryLocation: quotation.deliveryLocation,
      deliveryDate: quotation.deliveryDate,
      orderStatus: 'CONFIRMED',
      currentFulfillmentStage: 'ORDER_CONFIRMED',
      notes: `Generated from accepted quotation ${quotation.quotationNumber}`,
    });

    // 1. Determine exact transaction fee percentage for the buyer organization
    let feePercentage = 2.5; // default fallback
    let buyerOrgId: any = null;

    try {
      const buyerUser = await User.findById(quotation.buyerId);
      if (buyerUser?.organizationId) {
        buyerOrgId = buyerUser.organizationId;
        const { plan } = await getOrCreateOrganizationSubscription(buyerOrgId);
        if (plan?.transactionFeePercentage !== undefined) {
          feePercentage = plan.transactionFeePercentage;
        }
      } else {
        const config = await PlatformConfig.findOne().lean();
        if (config?.platformCommissionPercent) {
          feePercentage = config.platformCommissionPercent;
        }
      }
    } catch (err) {
      console.warn('Could not resolve custom fee percentage, using platform default:', err);
    }

    // 2. Calculate immutable financial breakdown
    const feeAmount = Math.round((totalValue * feePercentage) / 100);
    const taxAmount = Math.round(feeAmount * 0.18); // 18% GST on platform facilitation service
    const netPlatformRevenue = feeAmount;
    const supplierPayableAmount = totalValue - feeAmount;

    // 3. Persist immutable TransactionFee record
    await TransactionFee.create({
      orderId: order._id,
      orderNumber,
      organizationId: buyerOrgId,
      buyerId: quotation.buyerId,
      grossAmount: totalValue,
      feePercentage,
      feeAmount,
      taxAmount,
      netPlatformRevenue,
      supplierPayableAmount,
      status: 'HELD_IN_ESCROW',
      notes: `Transaction fee of ${feePercentage}% applied on order ${orderNumber}`,
      finalizedAt: new Date(),
    });

    // 4. Double-entry bookkeeping in LedgerEntry
    const ledgerEntryNumber = `LEDGER-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    await LedgerEntry.create({
      entryNumber: ledgerEntryNumber,
      orderId: order._id.toString(),
      orderNumber,
      type: 'PLATFORM_COMMISSION',
      amount: feeAmount,
      currency: 'INR',
      status: 'RECORDED',
      payerId: quotation.buyerId,
      payerName: quotation.buyerName,
      payeeId: 'AGRILINK_PLATFORM',
      payeeName: 'AgriLink Marketplace Escrow',
      paymentMethod: 'INTERNAL_LEDGER',
      notes: `Platform fee (${feePercentage}%) for order ${orderNumber}`,
    });

    // 5. Generate B2B Order Invoice record
    const invoiceNumber = `INV-ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    await Invoice.create({
      organizationId: buyerOrgId,
      buyerId: quotation.buyerId,
      invoiceNumber,
      type: 'ORDER_SETTLEMENT',
      orderId: order._id,
      subtotal: totalValue,
      platformFee: feeAmount,
      tax: taxAmount,
      total: totalValue,
      currency: 'INR',
      status: 'ISSUED',
      lineItems: [
        {
          description: `${quotation.product} (${quotation.qualityGrade}) - Agricultural Produce`,
          quantity: quotation.quantity,
          unitPrice: quotation.currentAgreedPrice,
          amount: totalValue,
          hsnCode: '0709', // Agricultural vegetables HSN
        },
      ],
      billingDetails: {
        name: quotation.buyerName,
        address: quotation.deliveryLocation,
      },
      issuedAt: new Date(),
    });


    // Create 6-stage fulfillment timeline events in MongoDB
    const stageDefinitions = [
      {
        stage: 'ORDER_CONFIRMED',
        title: 'Order Confirmed',
        description: `Agreed price ₹${quotation.currentAgreedPrice}/kg for ${quotation.quantity} kg of ${quotation.product}.`,
        completed: true,
      },
      {
        stage: 'PRODUCE_PREPARED',
        title: 'Produce Prepared / Harvested',
        description: `Farm batch prepared and weighed at ${quotation.supplierName}'s facility.`,
        completed: false,
      },
      {
        stage: 'QUALITY_VERIFIED',
        title: `Quality ${quotation.qualityGrade} Verified`,
        description: 'Quality grading, sorting, and moisture inspection.',
        completed: false,
      },
      {
        stage: 'PACKED',
        title: 'Standard Crates Packed',
        description: 'Secured in food-grade ventilated agricultural crates.',
        completed: false,
      },
      {
        stage: 'IN_TRANSIT',
        title: 'Dispatched / In Transit',
        description: `Transport vehicle en-route to ${quotation.deliveryLocation}.`,
        completed: false,
      },
      {
        stage: 'DELIVERED',
        title: 'Delivered & Accepted',
        description: 'Final delivery handover and weighbridge verification.',
        completed: false,
      },
    ];

    for (const s of stageDefinitions) {
      await FulfillmentEvent.create({
        orderId: order._id,
        stage: s.stage,
        title: s.title,
        description: s.description,
        actorId: currentUser._id.toString(),
        actorRole: currentUser.role,
        completed: s.completed,
      });
    }

    // Send notifications to both parties
    await Notification.create({
      userId: quotation.buyerId,
      title: 'Order Confirmed!',
      message: `Order ${orderNumber} has been confirmed with ${quotation.supplierName}. Total: ₹${totalValue.toLocaleString()}.`,
      type: 'ORDER',
      link: `/buyer/orders`,
    });

    await Notification.create({
      userId: quotation.supplierId,
      title: 'Order Confirmed!',
      message: `Quotation accepted! New order ${orderNumber} confirmed with ${quotation.buyerName}. Total: ₹${totalValue.toLocaleString()}.`,
      type: 'ORDER',
      link: `/farmer/orders`,
    });

    // Audit log
    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'ACCEPT_QUOTATION_CREATE_ORDER',
      resource: 'Order',
      resourceId: order._id.toString(),
      details: { orderNumber, quotationId: quotation._id, totalValue },
    });

    return NextResponse.json({ success: true, data: { quotation, order } });
  } catch (err: any) {
    console.error('Accept quotation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
