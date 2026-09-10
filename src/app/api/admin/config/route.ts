import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PlatformConfig } from '@/models';
import { authenticateUser, verifyAdminPermission } from '@/lib/auth';
import { createAuditEntry, checkIdempotency } from '@/lib/audit';

// GET current platform config & feature flags
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'CONFIG_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient privileges to view platform configuration.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    let config = await PlatformConfig.findOne();
    if (!config) {
      config = await PlatformConfig.create({
        platformCommissionPercent: 2.5,
        minOrderValue: 5000,
        disputeWindowHours: 48,
        featureFlags: {
          multiSupplierMatching: true,
          whatsAppAlerts: true,
          onlineEscrow: false,
          autoKycApproval: false,
          logisticsTracking: true,
        },
        supportedCommodities: ['Tomato', 'Chilly', 'Onion', 'Potato', 'Rice', 'Maize', 'Cotton', 'Turmeric'],
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update platform config with mandatory reason and immutable audit
export async function PUT(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse } = checkIdempotency(req);
    if (isDuplicate) return NextResponse.json(cachedResponse);

    const { error, context } = await authenticateUser(req);
    const currentUser = context?.user;

    if (!verifyAdminPermission(req, currentUser, 'CONFIG_MANAGE')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Administrator clearance required for configuration updates.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      platformCommissionPercent,
      minOrderValue,
      disputeWindowHours,
      featureFlags,
      supportedCommodities,
      reason,
    } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid operational reason (min 5 characters) is required for configuration changes.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    let config = await PlatformConfig.findOne();
    if (!config) {
      config = new PlatformConfig();
    }

    const beforeState = config.toObject();

    if (platformCommissionPercent !== undefined) config.platformCommissionPercent = Number(platformCommissionPercent);
    if (minOrderValue !== undefined) config.minOrderValue = Number(minOrderValue);
    if (disputeWindowHours !== undefined) config.disputeWindowHours = Number(disputeWindowHours);
    if (featureFlags) {
      config.featureFlags = {
        ...config.featureFlags,
        ...featureFlags,
      };
    }
    if (supportedCommodities && Array.isArray(supportedCommodities)) {
      config.supportedCommodities = supportedCommodities;
    }

    await config.save();
    const afterState = config.toObject();

    // Record immutable audit entry
    await createAuditEntry({
      actorId: currentUser ? currentUser._id.toString() : 'admin_session',
      actorEmail: currentUser ? currentUser.email : 'admin@agrilink.internal',
      actorRole: currentUser ? (currentUser.adminSubRole || 'ADMIN') : 'SUPER_ADMIN',
      action: 'PLATFORM_CONFIG_UPDATED',
      resource: 'PlatformConfig',
      resourceId: config._id.toString(),
      details: { platformCommissionPercent, featureFlags },
      beforeState,
      afterState,
      reason,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Platform configuration and feature flags updated successfully.',
      data: config,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
