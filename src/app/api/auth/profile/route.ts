import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, Organization } from '@/models';
import { authenticateUser } from '@/lib/auth';
import { UserProfileSchema } from '@/validators';

// GET current authenticated user profile
export async function GET(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    await connectToDatabase();
    const user = await User.findOne({ firebaseUid: context!.firebaseUid }).populate('organizationId');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
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
