import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Organization, AuditLog } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      location,
      phone,
      organizationName,
      organizationType,
      primaryCrops,
      capacity,
      gstin,
    } = body;

    if (!name || !email || !password || !role || !location) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, role, and location are required' },
        { status: 400 }
      );
    }

    if (role !== 'FARMER' && role !== 'BUYER') {
      return NextResponse.json(
        { success: false, error: 'Registration is only permitted for FARMER or BUYER roles' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Default org type mapping if not specified
    const defaultOrgType = role === 'FARMER' ? 'FARMER_COLLECTIVE' : 'WHOLESALER';
    const finalOrgType = organizationType || defaultOrgType;

    // Organization
    let organizationId = undefined;
    const finalOrgName = organizationName ? organizationName.trim() : (role === 'FARMER' ? `${name}'s Farm Collective` : `${name}'s Procurement Hub`);
    
    let org = await Organization.findOne({ name: finalOrgName });
    if (!org) {
      org = await Organization.create({
        name: finalOrgName,
        type: finalOrgType,
        contactPerson: name,
        email: email.trim().toLowerCase(),
        phone: phone || '',
        gstin: gstin || '',
        primaryCrops: primaryCrops || '',
        capacity: capacity || '',
        address: { city: location, state: 'Andhra Pradesh', pincode: '520001' },
        verified: true,
      });
    }
    organizationId = org._id;

    const firebaseUid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const user = await User.create({
      firebaseUid,
      email: email.trim().toLowerCase(),
      password,
      name,
      phone,
      role,
      organizationId,
      location,
    });

    const token = `agri_user_${user._id}_${encodeURIComponent(user.email)}_${Date.now()}`;

    // Audit log
    await AuditLog.create({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'USER_REGISTRATION',
      resource: 'USER',
      resourceId: user._id.toString(),
      details: { email: user.email, role: user.role, organizationName },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user,
      token,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
