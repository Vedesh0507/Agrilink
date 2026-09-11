import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProduceListing, BuyerRequirement, Match, AuditLog, Notification, User } from '@/models';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { ProduceListingSchema } from '@/validators';
import { MatchingService } from '@/services/matchingService';

import { saveProduceImage } from '@/lib/storage/imageStorage';

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

    const listings = await ProduceListing.find(filter).sort({ createdAt: -1 }).lean();

    const farmerIds = Array.from(new Set(listings.map((l: any) => l.farmerId).filter(Boolean)));
    const farmers = await User.find({ _id: { $in: farmerIds } })
      .select('name phone alternatePhone email location')
      .lean();
    const farmerMap = new Map(farmers.map((f: any) => [f._id.toString(), f]));

    const enriched = listings.map((l: any) => {
      const farmer: any = farmerMap.get(l.farmerId);
      return {
        ...l,
        farmerPhone: farmer?.phone || '+91 99999 00000',
        farmerAlternatePhone: farmer?.alternatePhone || '',
        farmerEmail: farmer?.email || '',
      };
    });

    return NextResponse.json({ success: true, data: enriched });
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

    // Process imageUrls if provided (save base64 data to public assets directory)
    let processedImageUrls: string[] = [];
    if (data.imageUrls && data.imageUrls.length > 0) {
      for (const imgUrl of data.imageUrls) {
        if (imgUrl.startsWith('data:image/')) {
          const mimeMatch = imgUrl.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const savedUrl = await saveProduceImage(imgUrl, mimeType);
          processedImageUrls.push(savedUrl);
        } else {
          processedImageUrls.push(imgUrl);
        }
      }
    }

    const listing = await ProduceListing.create({
      ...data,
      imageUrls: processedImageUrls,
      farmerConfirmedQuality: data.farmerConfirmedQuality || data.qualityGrade,
      farmerConfirmedProduce: data.farmerConfirmedProduce || data.product,
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

    // Bi-directional matching: trigger matching engine against all open buyer requirements
    let matchedRequirementsCount = 0;
    try {
      const openRequirements = await BuyerRequirement.find({ status: 'OPEN' });
      const allAvailableListings = await ProduceListing.find({
        status: 'AVAILABLE',
        availableQuantity: { $gt: 0 },
      });

      for (const reqDoc of openRequirements) {
        const matches = MatchingService.generateMatches(reqDoc, allAvailableListings);
        if (matches.length > 0) {
          // Replace proposed matches for this requirement
          await Match.deleteMany({ requirementId: reqDoc._id.toString(), status: 'PROPOSED' });
          for (const m of matches) {
            await Match.create(m);
          }

          // Check if newly created listing is part of this match to notify buyer
          const includesNewListing = matches.some((m) =>
            m.suppliers.some((s) => s.produceListingId === listing._id.toString())
          );
          if (includesNewListing) {
            matchedRequirementsCount++;
            await Notification.create({
              userId: reqDoc.buyerId,
              title: 'Matching Producer Inventory Available!',
              message: `${currentUser.name} listed ${listing.product} (${listing.quantity} kg) matching your procurement requirement for ${reqDoc.product}.`,
              type: 'MATCH',
              link: `/buyer?tab=matches&requirementId=${reqDoc._id}`,
            });
          }
        }
      }
    } catch (matchErr) {
      console.error('Error generating bi-directional matches on produce create:', matchErr);
    }

    return NextResponse.json({ success: true, data: listing, matchedRequirementsCount }, { status: 201 });
  } catch (err: any) {
    console.error('Create produce error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
