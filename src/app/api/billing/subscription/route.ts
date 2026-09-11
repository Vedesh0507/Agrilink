import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import {
  Organization,
  SubscriptionPlan,
  BuyerSubscription,
  SubscriptionEvent,
  Invoice,
  TransactionFee,
  User,
} from '@/models';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { getOrCreateOrganizationSubscription } from '@/lib/entitlement';
import { createAuditEntry, checkIdempotency, recordIdempotencyResult } from '@/lib/audit';
import { getPaymentGatewayStatus } from '@/lib/payment';

// GET current organization subscription and billing state
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    if (!authorizeRoles(currentUser, ['BUYER', 'ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only buyers can access billing information.' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    // Resolve buyer's organization
    let orgId = currentUser.organizationId as any;
    if (!orgId) {
      // Find or create default organization for the user so existing buyers never break
      let org = await Organization.findOne({ email: currentUser.email });
      if (!org) {
        org = await Organization.create({
          name: `${currentUser.name} Commercial Enterprise`,
          type: 'WHOLESALER',
          contactPerson: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '',
          verified: true,
        });
      }
      currentUser.organizationId = org._id as any;
      await currentUser.save();
      orgId = org._id;
    }

    const { subscription, plan } = await getOrCreateOrganizationSubscription(orgId);

    // Count organization members
    const orgUsersCount = await User.countDocuments({ organizationId: orgId });

    // Recent invoices
    const invoices = await Invoice.find({ organizationId: orgId }).sort({ issuedAt: -1 }).limit(10).lean();

    // Recent transaction fees
    const transactionFees = await TransactionFee.find({
      $or: [{ organizationId: orgId }, { buyerId: currentUser._id.toString() }],
    })
      .sort({ finalizedAt: -1 })
      .limit(10)
      .lean();

    const gatewayStatus = getPaymentGatewayStatus();

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan,
        usage: {
          requirementsUsed: subscription.monthlyRequirementsUsed,
          requirementsMax: plan.features.maxMonthlyRequirements,
          organizationUsersCount: orgUsersCount,
          organizationUsersMax: plan.features.maxOrganizationUsers,
          usagePeriodMonth: subscription.usagePeriodMonth,
        },
        invoices,
        transactionFees,
        gatewayStatus,
      },
    });
  } catch (err: any) {
    console.error('Error fetching subscription details:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST upgrade or change subscription plan
export async function POST(req: NextRequest) {
  try {
    const { isDuplicate, cachedResponse, key } = checkIdempotency(req);
    if (isDuplicate && cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const body = await req.json();
    const {
      targetPlanCode,
      reason,
      companyName,
      contactPerson,
      email,
      phone,
      password,
      businessType,
      gstin,
      city,
      state,
      procurementVolume,
      billingAddress,
    } = body;

    if (!targetPlanCode || !['FREE', 'BUSINESS', 'ENTERPRISE'].includes(targetPlanCode)) {
      return NextResponse.json({ success: false, error: 'Invalid target plan code.' }, { status: 400 });
    }

    await connectToDatabase();

    // Authenticate existing user if token present, or authenticate/register via submitted basic details
    let currentUser: any = null;
    let authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const authResult = await authenticateUser(req);
      if (!authResult.error && authResult.context?.user) {
        currentUser = authResult.context.user;
      }
    }

    let generatedToken: string | null = null;

    if (!currentUser) {
      // Must have basic identification
      const targetEmail = (email || '').trim().toLowerCase();
      if (!targetEmail) {
        return NextResponse.json(
          { success: false, error: 'Email is required to subscribe and create buyer profile.' },
          { status: 400 }
        );
      }

      let existingUser = await User.findOne({ email: targetEmail });
      if (existingUser) {
        if (password && existingUser.password && existingUser.password !== password) {
          return NextResponse.json(
            { success: false, error: 'Incorrect password for existing account. Please sign in.' },
            { status: 401 }
          );
        }
        currentUser = existingUser;
      } else {
        if (!password || password.length < 6) {
          return NextResponse.json(
            { success: false, error: 'Password of at least 6 characters is required to set up buyer account.' },
            { status: 400 }
          );
        }

        const personName = (contactPerson || companyName || 'Commercial Buyer').trim();
        const firebaseUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        currentUser = await User.create({
          firebaseUid,
          email: targetEmail,
          password,
          name: personName,
          phone: phone || '',
          role: 'BUYER',
          location: city ? `${city}, ${state || 'Andhra Pradesh'}` : 'Andhra Pradesh',
        });
      }

      generatedToken = `agri_user_${currentUser._id}_${encodeURIComponent(currentUser.email)}_${Date.now()}`;
    }

    // Resolve and save basic Organization details
    let org: any = null;
    if (currentUser.organizationId) {
      org = await Organization.findById(currentUser.organizationId);
    }

    const finalCompanyName = (companyName || org?.name || `${currentUser.name} Procurement Hub`).trim();
    const finalContactPerson = (contactPerson || org?.contactPerson || currentUser.name).trim();
    const finalPhone = (phone || org?.phone || currentUser.phone || '').trim();
    const finalEmail = (email || org?.email || currentUser.email).trim().toLowerCase();
    const finalType = businessType || org?.type || 'WHOLESALER';
    const finalGstin = (gstin || org?.gstin || '').trim();
    const finalCity = (city || org?.address?.city || 'Guntur').trim();
    const finalState = (state || org?.address?.state || 'Andhra Pradesh').trim();
    const finalVolume = (procurementVolume || org?.procurementVolume || '').trim();

    if (org) {
      org.name = finalCompanyName;
      org.contactPerson = finalContactPerson;
      org.phone = finalPhone;
      org.email = finalEmail;
      org.type = finalType;
      org.gstin = finalGstin;
      org.procurementVolume = finalVolume;
      org.address = {
        ...(org.address || {}),
        city: finalCity,
        state: finalState,
        street: billingAddress || org.address?.street || '',
      };
      await org.save();
    } else {
      org = await Organization.create({
        name: finalCompanyName,
        type: finalType,
        contactPerson: finalContactPerson,
        email: finalEmail,
        phone: finalPhone,
        gstin: finalGstin,
        procurementVolume: finalVolume,
        address: {
          city: finalCity,
          state: finalState,
          street: billingAddress || '',
          pincode: '520001',
        },
        verified: true,
      });
      currentUser.organizationId = org._id;
      if (currentUser.role !== 'ADMIN') {
        currentUser.role = 'BUYER';
      }
      await currentUser.save();
    }

    const orgId = org._id;

    const targetPlan = await SubscriptionPlan.findOne({ code: targetPlanCode });
    if (!targetPlan) {
      return NextResponse.json({ success: false, error: 'Target plan does not exist.' }, { status: 404 });
    }

    const { subscription } = await getOrCreateOrganizationSubscription(orgId);
    const beforePlan = subscription.planCode;

    subscription.planId = targetPlan._id as any;
    subscription.planCode = targetPlan.code;
    subscription.status = 'ACTIVE';
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    subscription.paymentProvider = 'INTERNAL_LEDGER'; // Direct sandbox / production ledger activation
    await subscription.save();

    let createdInvoice: any = null;

    // Create an Invoice for the subscription if paid plan
    if (targetPlan.priceMonthly > 0) {
      const invoiceNumber = `INV-SUB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const subtotal = targetPlan.priceMonthly;
      const tax = Math.round(subtotal * 0.18); // 18% GST
      const total = subtotal + tax;

      createdInvoice = await Invoice.create({
        organizationId: orgId,
        buyerId: currentUser._id.toString(),
        invoiceNumber,
        type: 'SUBSCRIPTION',
        subscriptionId: subscription._id,
        subtotal,
        platformFee: 0,
        tax,
        total,
        currency: 'INR',
        status: 'PAID', // In sandbox / direct activation mode
        lineItems: [
          {
            description: `${targetPlan.name} Subscription (1 Month)`,
            quantity: 1,
            unitPrice: subtotal,
            amount: subtotal,
            hsnCode: '998311', // SaaS / Software services HSN
          },
        ],
        billingDetails: {
          name: `${finalCompanyName} (Attn: ${finalContactPerson})`,
          address: `${finalCity}, ${finalState}${finalGstin ? ` | GSTIN: ${finalGstin}` : ''}`,
        },
        issuedAt: new Date(),
        paidAt: new Date(),
      });
    }

    // Record auditable subscription event
    await SubscriptionEvent.create({
      organizationId: orgId,
      subscriptionId: subscription._id,
      eventType: targetPlanCode === 'FREE' ? 'PLAN_DOWNGRADED' : 'PLAN_UPGRADED',
      provider: 'INTERNAL',
      metadata: {
        beforePlan,
        afterPlan: targetPlan.code,
        priceMonthly: targetPlan.priceMonthly,
        companyName: finalCompanyName,
        gstin: finalGstin,
        reason: reason || 'Buyer submitted plan onboarding/upgrade details',
      },
      timestamp: new Date(),
    });

    // Create immutable audit entry
    await createAuditEntry({
      actorId: currentUser._id.toString(),
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action: 'UPDATE_SUBSCRIPTION_PLAN',
      resource: 'BuyerSubscription',
      resourceId: subscription._id.toString(),
      beforeState: { planCode: beforePlan },
      afterState: { planCode: targetPlan.code, priceMonthly: targetPlan.priceMonthly, companyName: finalCompanyName },
      reason: reason || `Buyer ${finalCompanyName} activated ${targetPlan.code} plan with basic details`,
      status: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const responsePayload = {
      success: true,
      message: `Successfully activated ${targetPlan.name} for ${finalCompanyName}.`,
      token: generatedToken,
      data: {
        subscription,
        plan: targetPlan,
        organization: org,
        invoice: createdInvoice,
        user: {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          phone: currentUser.phone,
          organizationId: org._id,
        },
      },
    };

    if (key) recordIdempotencyResult(key, responsePayload);

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error('Error changing subscription plan:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
