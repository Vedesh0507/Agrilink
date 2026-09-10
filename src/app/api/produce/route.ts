import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProduceListing, AuditLog, Notification } from '@/models';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { ProduceListingSchema } from '@/validators';

// GET produce listings (with search & filtering)
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get('farmerId');
    const product = searchParams.get('product');
    const location = searchParams.get('location');
    const qualityGrade = searchParams.get('qualityGrade');
    const status = searchParams.get('status') || 'AVAILABLE';

    const filter: any = {};
    if (farmerId) filter.farmerId = farmerId;
    if (product) filter.product = { $regex: product, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (qualityGrade) filter.qualityGrade = qualityGrade;
    if (status !== 'ALL') filter.status = status;

    const listings = await ProduceListing.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: listings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create a new produce listing (Farmer only)
export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    if (!authorizeRoles(currentUser, ['FARMER', 'ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only verified farmers can add produce listings.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = ProduceListingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid produce data', details: validation.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const data = validation.data;

    const listing = await ProduceListing.create({
      ...data,
      farmerId: currentUser._id.toString(),
      farmerName: currentUser.name,
      availableQuantity: data.quantity,
      status: 'AVAILABLE',
      availableFromDate: new Date(data.availableFromDate),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    });

    // Create audit log
    await AuditLog.create({
      actorId: currentUser._id.toString(),
      actorRole: currentUser.role,
      action: 'CREATE_PRODUCE_LISTING',
      resource: 'ProduceListing',
      resourceId: listing._id.toString(),
      details: { product: listing.product, quantity: listing.quantity, price: listing.expectedPricePerUnit },
    });

    return NextResponse.json({ success: true, data: listing }, { status: 201 });
  } catch (err: any) {
    console.error('Create produce error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
