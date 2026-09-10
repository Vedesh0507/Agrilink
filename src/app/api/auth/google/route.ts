import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Organization, AuditLog } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firebaseUid,
      email,
      name,
      photoURL,
      role,
      phone,
      organizationName,
      organizationType,
      location,
      primaryCrops,
      gstin,
      capacity,
    } = body;

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { success: false, error: 'Firebase UID and Email are required for Google authentication.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ firebaseUid }, { email: normalizedEmail }],
    }).populate('organizationId');

    // 1. Existing user with profile already established
    if (user && user.phone && user.organizationId) {
      if (user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
      }

      const token = `agri_user_${user._id}_${encodeURIComponent(user.email)}_${Date.now()}`;

      await AuditLog.create({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: 'GOOGLE_SIGNIN_SUCCESS',
        resource: 'AUTH',
        details: { email: user.email, role: user.role },
      });

      return NextResponse.json({
        success: true,
        message: 'Google sign-in verified',
        user,
        token,
        profileComplete: true,
      });
    }

    // 2. New user or incomplete profile - check if details were provided
    if (!phone || !location) {
      return NextResponse.json({
        success: true,
        needsProfile: true,
        googleUser: {
          firebaseUid,
          email: normalizedEmail,
          name: name || '',
          photoURL: photoURL || '',
          role: role || 'FARMER',
        },
      });
    }

    // 3. User provided their details - complete registration
    const assignedRole = role === 'BUYER' ? 'BUYER' : 'FARMER';
    const defaultOrgType = assignedRole === 'FARMER' ? 'FARMER_COLLECTIVE' : 'WHOLESALER';
    const finalOrgType = organizationType || defaultOrgType;
    const finalOrgName = organizationName
      ? organizationName.trim()
      : (assignedRole === 'FARMER' ? `${name}'s Farm Collective` : `${name}'s Procurement Hub`);

    let organization = await Organization.findOne({ name: finalOrgName });
    if (!organization) {
      organization = await Organization.create({
        name: finalOrgName,
        type: finalOrgType,
        contactPerson: name || 'Primary Contact',
        email: normalizedEmail,
        phone: phone || '',
        gstin: gstin || '',
        primaryCrops: primaryCrops || '',
        capacity: capacity || '',
        address: { city: location, state: 'Andhra Pradesh', pincode: '520001' },
        verified: true,
      });
    }

    if (user) {
      user.name = name || user.name;
      user.phone = phone;
      user.role = assignedRole;
      user.organizationId = organization._id;
      user.location = location;
      await user.save();
    } else {
      user = await User.create({
        firebaseUid,
        email: normalizedEmail,
        name: name || 'AgriLink Member',
        phone,
        role: assignedRole,
        organizationId: organization._id,
        location,
      });
    }

    const token = `agri_user_${user._id}_${encodeURIComponent(user.email)}_${Date.now()}`;

    await AuditLog.create({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'GOOGLE_PROFILE_COMPLETED',
      resource: 'USER',
      resourceId: user._id.toString(),
      details: { email: user.email, role: user.role, orgName: finalOrgName },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Profile completed successfully via Google authentication',
        user,
        token,
        profileComplete: true,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Google Auth API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
