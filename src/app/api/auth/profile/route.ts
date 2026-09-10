import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Organization, AuditLog } from '@/models';
import { authenticateUser } from '@/lib/auth';
import { UserProfileSchema, UpdateProfileSchema } from '@/validators';

// GET current authenticated user profile
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    await connectToDatabase();
    const user = await User.findById(context!.user._id).populate('organizationId');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT update existing user & organization profile
export async function PUT(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const body = await req.json();
    const validation = UpdateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const userId = context!.user._id;
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const {
      name,
      phone,
      alternatePhone,
      bio,
      location,
      organizationName,
      organizationType,
      contactPerson,
      designation,
      gstin,
      panNumber,
      fssaiNumber,
      primaryCrops,
      capacity,
      landArea,
      farmingType,
      farmingExperience,
      nearestMandi,
      procurementVolume,
      preferredPaymentTerms,
      address,
      bankDetails,
    } = validation.data;

    // 1. Update or create organization
    let orgId = existingUser.organizationId;

    if (orgId) {
      const orgUpdateData: any = {};
      if (organizationName !== undefined) orgUpdateData.name = organizationName.trim();
      if (organizationType !== undefined) orgUpdateData.type = organizationType;
      if (contactPerson !== undefined) orgUpdateData.contactPerson = contactPerson.trim();
      if (designation !== undefined) orgUpdateData.designation = designation.trim();
      if (phone !== undefined) orgUpdateData.phone = phone.trim();
      if (gstin !== undefined) orgUpdateData.gstin = gstin.trim().toUpperCase();
      if (panNumber !== undefined) orgUpdateData.panNumber = panNumber.trim().toUpperCase();
      if (fssaiNumber !== undefined) orgUpdateData.fssaiNumber = fssaiNumber.trim();
      if (primaryCrops !== undefined) orgUpdateData.primaryCrops = primaryCrops.trim();
      if (capacity !== undefined) orgUpdateData.capacity = capacity.trim();
      if (landArea !== undefined) orgUpdateData.landArea = landArea.trim();
      if (farmingType !== undefined) orgUpdateData.farmingType = farmingType.trim();
      if (farmingExperience !== undefined) orgUpdateData.farmingExperience = farmingExperience.trim();
      if (nearestMandi !== undefined) orgUpdateData.nearestMandi = nearestMandi.trim();
      if (procurementVolume !== undefined) orgUpdateData.procurementVolume = procurementVolume.trim();
      if (preferredPaymentTerms !== undefined) orgUpdateData.preferredPaymentTerms = preferredPaymentTerms.trim();

      if (address) {
        orgUpdateData.address = {
          street: address.street !== undefined ? address.street : '',
          landmark: address.landmark !== undefined ? address.landmark : '',
          city: address.city !== undefined ? address.city : location || existingUser.location,
          state: address.state !== undefined ? address.state : 'Andhra Pradesh',
          pincode: address.pincode !== undefined ? address.pincode : '520001',
        };
      }

      await Organization.findByIdAndUpdate(orgId, { $set: orgUpdateData }, { new: true });
    } else if (organizationName) {
      const newOrg = await Organization.create({
        name: organizationName.trim(),
        type: organizationType || (existingUser.role === 'FARMER' ? 'FARMER_COLLECTIVE' : 'WHOLESALER'),
        contactPerson: contactPerson || name || existingUser.name,
        designation: designation || (existingUser.role === 'FARMER' ? 'Lead Cultivator' : 'Procurement Head'),
        email: existingUser.email,
        phone: phone || existingUser.phone || '',
        gstin: gstin ? gstin.trim().toUpperCase() : '',
        panNumber: panNumber ? panNumber.trim().toUpperCase() : '',
        fssaiNumber: fssaiNumber ? fssaiNumber.trim() : '',
        primaryCrops: primaryCrops || '',
        capacity: capacity || '',
        landArea: landArea || '',
        farmingType: farmingType || '',
        farmingExperience: farmingExperience || '',
        nearestMandi: nearestMandi || '',
        procurementVolume: procurementVolume || '',
        preferredPaymentTerms: preferredPaymentTerms || '',
        address: address || {
          street: '',
          landmark: '',
          city: location || existingUser.location,
          state: 'Andhra Pradesh',
          pincode: '520001',
        },
        verified: true,
      });
      orgId = newOrg._id;
      existingUser.organizationId = newOrg._id;
    }

    // 2. Update User Document
    if (name !== undefined) existingUser.name = name.trim();
    if (phone !== undefined) existingUser.phone = phone.trim();
    if (alternatePhone !== undefined) existingUser.alternatePhone = alternatePhone.trim();
    if (bio !== undefined) existingUser.bio = bio.trim();
    if (location !== undefined) existingUser.location = location.trim();

    if (bankDetails) {
      existingUser.bankDetails = {
        accountHolderName: bankDetails.accountHolderName?.trim() || existingUser.bankDetails?.accountHolderName || '',
        bankName: bankDetails.bankName?.trim() || existingUser.bankDetails?.bankName || '',
        accountNumber: bankDetails.accountNumber?.trim() || existingUser.bankDetails?.accountNumber || '',
        ifscCode: bankDetails.ifscCode?.trim().toUpperCase() || existingUser.bankDetails?.ifscCode || '',
        upiId: bankDetails.upiId?.trim() || existingUser.bankDetails?.upiId || '',
      };
    }

    await existingUser.save();

    // 3. Log Audit Trail
    await AuditLog.create({
      actorId: existingUser._id.toString(),
      actorRole: existingUser.role,
      action: 'PROFILE_UPDATED',
      resource: 'USER_PROFILE',
      resourceId: existingUser._id.toString(),
      details: {
        role: existingUser.role,
        updatedFields: Object.keys(validation.data),
      },
    });

    // 4. Return populated fresh user data
    const updatedUser = await User.findById(existingUser._id).populate('organizationId');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create or update user profile after Firebase registration
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Bearer token required' }, { status: 401 });
    }

    const body = await req.json();
    const validation = UserProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, phone, role, organizationName, location } = validation.data;
    const { firebaseUid, email } = body;

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { success: false, error: 'firebaseUid and email are required in body' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check or create organization
    let organizationId = undefined;
    if (organizationName) {
      let org = await Organization.findOne({ name: organizationName.trim() });
      if (!org) {
        org = await Organization.create({
          name: organizationName.trim(),
          type: role === 'FARMER' ? 'FARMER_COLLECTIVE' : 'WHOLESALER',
          contactPerson: name,
          email,
          phone: phone || '',
          address: { city: location, state: 'Andhra Pradesh', pincode: '520001' },
          verified: true,
        });
      }
      organizationId = org._id;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        firebaseUid,
        email: email.toLowerCase(),
        name,
        phone,
        role,
        organizationId,
        location,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (err: any) {
    console.error('Profile creation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
