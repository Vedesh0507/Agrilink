import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseSeed } from '@/scripts/seed';
import { verifyAdminAccess, authenticateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const adminSecret = req.headers.get('x-admin-secret-key');
    const configuredSecret = process.env.ADMIN_SECRET_KEY;

    // Seeding is restricted to development or protected by ADMIN_SECRET_KEY
    const isDev = process.env.NODE_ENV !== 'production';
    const hasSecret = configuredSecret && adminSecret === configuredSecret;

    if (!isDev && !hasSecret) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Seeding is disabled in production unless authorized with admin key.' },
        { status: 403 }
      );
    }

    await runDatabaseSeed();

    return NextResponse.json({
      success: true,
      message: 'Database successfully seeded with realistic agricultural supply, demand, and multi-farmer aggregation data.',
    });
  } catch (err: any) {
    console.error('Seed execution error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
