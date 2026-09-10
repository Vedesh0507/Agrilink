import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, AuditLog } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    await connectToDatabase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email address. Please register.' },
        { status: 404 }
      );
    }

    // Role check if specified
    if (role && user.role !== role && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: `This account is registered as ${user.role}. Please sign in to the correct portal.` },
        { status: 403 }
      );
    }

    const ADMIN_EMAILS = ['pavanmanpealli521@gmail.com', 'pavanmanepalli521@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);

    if (isAdmin) {
      if (password !== 'Vedesh@07') {
        return NextResponse.json(
          { success: false, error: 'Invalid password. Please try again.' },
          { status: 401 }
        );
      }
      if (user.password !== 'Vedesh@07') {
        user.password = 'Vedesh@07';
        await user.save();
      }
    } else if (user.password && user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    // Generate authenticated session token
    const token = `agri_user_${user._id}_${encodeURIComponent(user.email)}_${Date.now()}`;

    // Audit log
    await AuditLog.create({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      resource: 'AUTH',
      details: { email: user.email, role: user.role },
    });

    return NextResponse.json({
      success: true,
      user,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
