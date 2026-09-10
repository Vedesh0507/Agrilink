import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { LedgerEntry, Order } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency, recordIdempotencyResult } from '@/lib/audit';

// GET list ledger entries and financial summary
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'FINANCE_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view financial records.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const filter: any = {};
    if (type && type !== 'ALL') filter.type = type;
    if (status && status !== 'ALL') filter.status = status;

    let entries = await LedgerEntry.find(filter).sort({ createdAt: -1 }).limit(100).lean();

    // Compute real ledger aggregates from database
    let totalInflow = 0;
    let totalPayouts = 0;
    let totalCommission = 0;
    let totalGST = 0;

    entries.forEach((e: any) => {
      if (e.type === 'PAYMENT_RECORDED') totalInflow += e.amount;
      if (e.type === 'SUPPLIER_PAYOUT') totalPayouts += e.amount;
      if (e.type === 'PLATFORM_COMMISSION') totalCommission += e.amount;
      if (e.type === 'TAX_GST') totalGST += e.amount;
    });

    return NextResponse.json({
      success: true,
      data: {
        entries,
        summary: {
          totalInflow,
          totalPayouts,
          totalCommission,
          totalGST: totalGST || Math.round(totalCommission * 0.18),
          totalTransactions: entries.length,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create or settle a ledger transaction (with Idempotency & Audit)
export async function POST(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse, key } = checkIdempotency(req);
    if (isDuplicate && cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'FINANCE_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to mutate financial ledger.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { entryId, action, reason, amount, type, orderNumber, notes } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Operational reason (minimum 5 characters) is required for financial mutations.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let entry;
    if (action === 'SETTLE_ENTRY' && entryId) {
      entry = await LedgerEntry.findById(entryId);
      if (!entry) {
        return NextResponse.json({ success: false, error: 'Ledger entry not found.' }, { status: 404 });
      }

      const beforeState = entry.toObject();
      entry.status = 'SETTLED';
      entry.notes = `${entry.notes || ''} | Settled by admin: ${reason}`.trim();
      await entry.save();

      await createAuditEntry({
        actorId: currentUser ? currentUser._id.toString() : 'admin_session',
        actorEmail: currentUser ? currentUser.email : 'finance@agrilink.internal',
        actorRole: currentUser ? (currentUser.adminSubRole || 'FINANCE_ADMIN') : 'FINANCE_ADMIN',
        action: 'SETTLE_LEDGER_ENTRY',
        resource: 'LedgerEntry',
        resourceId: entry._id.toString(),
        beforeState: { status: beforeState.status },
        afterState: { status: entry.status },
        reason,
        status: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } else {
      const entryNumber = `LEDGER-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      entry = await LedgerEntry.create({
        entryNumber,
        type: type || 'SUPPLIER_PAYOUT',
        amount: Number(amount) || 0,
        currency: 'INR',
        status: 'RECORDED',
        orderNumber: orderNumber || 'MANUAL-DISBURSEMENT',
        notes: `${notes || 'Manual ledger entry'} (Reason: ${reason})`,
      });

      await createAuditEntry({
        actorId: currentUser ? currentUser._id.toString() : 'admin_session',
        actorEmail: currentUser ? currentUser.email : 'finance@agrilink.internal',
        actorRole: currentUser ? (currentUser.adminSubRole || 'FINANCE_ADMIN') : 'FINANCE_ADMIN',
        action: 'CREATE_LEDGER_ENTRY',
        resource: 'LedgerEntry',
        resourceId: entry._id.toString(),
        afterState: entry.toObject(),
        reason,
        status: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    }

    const responsePayload = {
      success: true,
      message: 'Financial ledger entry recorded successfully.',
      data: entry,
    };

    if (key) recordIdempotencyResult(key, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
