import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SupportTicket } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry } from '@/lib/audit';

// GET list support tickets
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'DISPUTES_RESOLVE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view support tickets.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;

    let tickets = await SupportTicket.find(filter).sort({ createdAt: -1 }).limit(50).lean();

    // Generate baseline tickets if empty
    if (tickets.length === 0) {
      await SupportTicket.create([
        {
          ticketNumber: 'TICK-8021',
          userId: 'usr_buyer_demo',
          userName: 'Reliance Retail Ops',
          userRole: 'BUYER',
          category: 'DELIVERY',
          subject: 'Vehicle dispatch delay on Order #ORD-9281',
          description: 'Logistics truck reported 4 hours delayed due to highway checkpoint. Need updated ETA.',
          priority: 'HIGH',
          status: 'OPEN',
        },
        {
          ticketNumber: 'TICK-8022',
          userId: 'usr_farmer_demo',
          userName: 'Ramesh Kumar (Guntur)',
          userRole: 'FARMER',
          category: 'PAYMENT',
          subject: 'Settlement confirmation query for Lot #LOT-4412',
          description: 'Produce lot was inspected yesterday. Please confirm when the clearing account releases funds.',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          assignedTo: 'Finance Ops Desk',
        },
      ]);
      tickets = await SupportTicket.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    }

    return NextResponse.json({ success: true, data: tickets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST resolve/update support ticket
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'DISPUTES_RESOLVE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to resolve support tickets.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ticketId, status, resolutionNotes, assignedTo, reason } = body;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'ticketId is required.' }, { status: 400 });
    }

    await connectToDatabase();
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Support ticket not found.' }, { status: 404 });
    }

    const beforeState = ticket.toObject();
    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (assignedTo) ticket.assignedTo = assignedTo;

    await ticket.save();

    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'support@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'SUPPORT_ADMIN') : 'SUPPORT_ADMIN',
      action: 'UPDATE_SUPPORT_TICKET',
      resource: 'SupportTicket',
      resourceId: ticket._id.toString(),
      beforeState: { status: beforeState.status, assignedTo: beforeState.assignedTo },
      afterState: { status: ticket.status, assignedTo: ticket.assignedTo },
      reason: reason || 'Helpdesk operational update',
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, message: 'Ticket updated successfully.', data: ticket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
