import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Demo user not found in database' }, { status: 404 });
    }

    // Generate Firebase token for this user
    let customToken = '';
    try {
      customToken = await adminAuth.createCustomToken(user.firebaseUid, {
        role: user.role,
        email: user.email,
      });
    } catch (e) {
      // Fallback to UID token if service account cert is in dev mode
      customToken = `demo_token_${user.firebaseUid}`;
    }

    return NextResponse.json({
      success: true,
      user,
      token: customToken,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
