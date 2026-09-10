import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, AuditLog } from '@/models';

const ADMIN_EMAILS = ['pavanmanpealli521@gmail.com', 'pavanmanepalli521@gmail.com'];
const ADMIN_PASS = 'Vedesh@07';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(normalizedEmail) || password !== ADMIN_PASS) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Ensure the admin user profile exists in MongoDB Atlas
    let adminUser = await User.findOne({ email: { $in: ADMIN_EMAILS } });
    if (!adminUser) {
      adminUser = await User.create({
        firebaseUid: 'admin_pavan_uid',
        email: normalizedEmail,
        password: ADMIN_PASS,
        name: 'Pavan Manepalli (Platform Administrator)',
        phone: '+91 99999 00000',
        role: 'ADMIN',
        location: 'Vijayawada Headquarters',
      });
    } else if (!adminUser.password) {
      adminUser.password = ADMIN_PASS;
      await adminUser.save();
    }

    // Generate secure admin session token
    const token = `admin_session_${adminUser.firebaseUid}_${Date.now()}`;

    // Audit log this administrative sign-in
    await AuditLog.create({
      actorId: adminUser._id.toString(),
      actorRole: 'ADMIN',
      action: 'ADMIN_SIGN_IN_SUCCESS',
      resource: 'ADMIN_PORTAL',
      details: { email: normalizedEmail },
    });

    return NextResponse.json({
      success: true,
      message: 'Administrator authentication verified',
      token,
      user: adminUser,
    });
  } catch (err: any) {
    console.error('Admin authentication error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
