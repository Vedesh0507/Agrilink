import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import {
  User,
  Organization,
  ProduceListing,
  BuyerRequirement,
  Match,
  Quotation,
  Order,
  FulfillmentEvent,
  Notification,
  AuditLog,
} from '../models';
import { MatchingService } from '../services/matchingService';

export async function runDatabaseSeed() {
  console.log('🌱 Connecting to MongoDB database...');
  await connectToDatabase();

  console.log('🧹 Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    ProduceListing.deleteMany({}),
    BuyerRequirement.deleteMany({}),
    Match.deleteMany({}),
    Quotation.deleteMany({}),
    Order.deleteMany({}),
    FulfillmentEvent.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('🏢 Creating organizations...');
  const orgFarmerCollective = await Organization.create({
    name: 'Krishna River Farmers Collective',
    type: 'FARMER_COLLECTIVE',
    contactPerson: 'Ramesh Patel',
    email: 'krishna.collective@agrilink.in',
    phone: '+91 98480 12345',
    address: {
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '520001',
    },
    verified: true,
  });

  const orgBuyer = await Organization.create({
    name: 'Godavari Fresh Foods & Supermarkets',
    type: 'WHOLESALER',
    contactPerson: 'Kalyan Chakravarthy',
    email: 'procurement@godavarifresh.in',
    phone: '+91 98481 98765',
    address: {
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '520008',
    },
    verified: true,
  });

  console.log('👥 Creating primary users (Farmers, Buyers, Admin)...');
  // 1. Farmer A (500 kg Tomato)
  const farmerA = await User.create({
    firebaseUid: 'farmer_ramesh_uid',
    email: 'ramesh.farmer@agrilink.in',
    name: 'Ramesh Patel (Farmer A)',
    phone: '+91 98480 11111',
    role: 'FARMER',
    organizationId: orgFarmerCollective._id,
    location: 'Vijayawada Rural, AP',
  });

  // 2. Farmer B (700 kg Tomato)
  const farmerB = await User.create({
    firebaseUid: 'farmer_suresh_uid',
    email: 'suresh.farmer@agrilink.in',
    name: 'Suresh Rao (Farmer B)',
    phone: '+91 98480 22222',
    role: 'FARMER',
    organizationId: orgFarmerCollective._id,
    location: 'Gannavaram, Vijayawada, AP',
  });

  // 3. Farmer C (800 kg Tomato)
  const farmerC = await User.create({
    firebaseUid: 'farmer_venkat_uid',
    email: 'venkat.farmer@agrilink.in',
    name: 'Venkat Reddy (Farmer C)',
    phone: '+91 98480 33333',
    role: 'FARMER',
    organizationId: orgFarmerCollective._id,
    location: 'Kankipadu, Krishna Dist, AP',
  });

  // 4. Additional Farmers
  const farmerD = await User.create({
    firebaseUid: 'farmer_lakshmi_uid',
    email: 'lakshmi.farmer@agrilink.in',
    name: 'Lakshmi Devi',
    phone: '+91 98480 44444',
    role: 'FARMER',
    organizationId: orgFarmerCollective._id,
    location: 'Guntur, AP',
  });

  // 5. Institutional Buyer
  const buyerUser = await User.create({
    firebaseUid: 'buyer_kalyan_uid',
    email: 'procurement@godavarifresh.in',
    name: 'Kalyan Chakravarthy (Godavari Fresh)',
    phone: '+91 98481 98765',
    role: 'BUYER',
    organizationId: orgBuyer._id,
    location: 'Vijayawada, AP',
  });

  // 6. Ops Admin
  const adminUser = await User.create({
    firebaseUid: 'admin_agrilink_uid',
    email: 'ops@agrilink.in',
    name: 'AgriLink Platform Operations',
    phone: '+91 99999 00000',
    role: 'ADMIN',
    location: 'Vijayawada Headquarters',
  });

  console.log('🍅 Creating agricultural produce listings...');
  // Critical demo listings:
  // Farmer A: 500 kg Grade A Tomato
  const listingA = await ProduceListing.create({
    farmerId: farmerA._id.toString(),
    farmerName: farmerA.name,
    organizationName: orgFarmerCollective.name,
    product: 'Tomato',
    variety: 'Vaishnavi Hybrid',
    quantity: 500,
    availableQuantity: 500,
    unit: 'kg',
    qualityGrade: 'Grade A',
    expectedPricePerUnit: 28,
    location: 'Vijayawada Rural, AP',
    availableFromDate: new Date('2026-09-15T00:00:00Z'),
    expiryDate: new Date('2026-09-25T00:00:00Z'),
    status: 'AVAILABLE',
    description: 'Fresh greenhouse-harvested Grade-A table tomatoes. Firm skin, uniform size, zero pest damage.',
  });

  // Farmer B: 700 kg Grade A Tomato
  const listingB = await ProduceListing.create({
    farmerId: farmerB._id.toString(),
    farmerName: farmerB.name,
    organizationName: orgFarmerCollective.name,
    product: 'Tomato',
    variety: 'Vaishnavi Hybrid',
    quantity: 700,
    availableQuantity: 700,
    unit: 'kg',
    qualityGrade: 'Grade A',
    expectedPricePerUnit: 28,
    location: 'Gannavaram, Vijayawada, AP',
    availableFromDate: new Date('2026-09-15T00:00:00Z'),
    expiryDate: new Date('2026-09-26T00:00:00Z'),
    status: 'AVAILABLE',
    description: 'Organically fertilized Grade-A ripe red tomatoes ready for institutional delivery.',
  });

  // Farmer C: 800 kg Grade A Tomato
  const listingC = await ProduceListing.create({
    farmerId: farmerC._id.toString(),
    farmerName: farmerC.name,
    organizationName: orgFarmerCollective.name,
    product: 'Tomato',
    variety: 'Vaishnavi Hybrid',
    quantity: 800,
    availableQuantity: 800,
    unit: 'kg',
    qualityGrade: 'Grade A',
    expectedPricePerUnit: 29,
    location: 'Kankipadu, Krishna Dist, AP',
    availableFromDate: new Date('2026-09-15T00:00:00Z'),
    expiryDate: new Date('2026-09-24T00:00:00Z'),
    status: 'AVAILABLE',
    description: 'High-grade commercial bulk tomatoes harvested with cold-crate packing.',
  });

  // Additional listings
  await ProduceListing.create({
    farmerId: farmerD._id.toString(),
    farmerName: farmerD.name,
    organizationName: orgFarmerCollective.name,
    product: 'Guntur Chilli',
    variety: 'Teja S17',
    quantity: 1200,
    availableQuantity: 1200,
    unit: 'kg',
    qualityGrade: 'Grade A',
    expectedPricePerUnit: 185,
    location: 'Guntur, AP',
    availableFromDate: new Date('2026-09-12T00:00:00Z'),
    status: 'AVAILABLE',
    description: 'Sun-dried pungent red chillies, export quality.',
  });

  console.log('📋 Creating buyer procurement requirement...');
  // Critical demo requirement:
  // Buyer wants: 2,000 kg Grade A Tomato @ ₹28/kg in Vijayawada on 15 September 2026
  const buyerReq = await BuyerRequirement.create({
    buyerId: buyerUser._id.toString(),
    buyerName: buyerUser.name,
    organizationName: orgBuyer.name,
    product: 'Tomato',
    variety: 'Vaishnavi Hybrid',
    requiredQuantity: 2000,
    fulfilledQuantity: 0,
    unit: 'kg',
    qualityGrade: 'Grade A',
    targetPricePerUnit: 28,
    deliveryLocation: 'Vijayawada, AP',
    requiredDeliveryDate: new Date('2026-09-15T00:00:00Z'),
    status: 'OPEN',
    notes: 'Urgent institutional procurement for daily distribution across 14 supermarket outlets.',
  });

  console.log('⚡ Executing matching engine for buyer requirement...');
  const allListings = [listingA, listingB, listingC];
  const computedMatches = MatchingService.generateMatches(buyerReq, allListings);

  console.log(`✨ Generated ${computedMatches.length} matching opportunities (including multi-farmer aggregation).`);
  for (const m of computedMatches) {
    await Match.create(m);
  }

  console.log('💬 Creating a demo quotation with structured negotiation history...');
  const demoQuotation = await Quotation.create({
    quotationNumber: 'QT-2026-09-001',
    requirementId: buyerReq._id,
    buyerId: buyerUser._id.toString(),
    buyerName: buyerUser.name,
    supplierId: farmerA._id.toString(),
    supplierName: farmerA.name,
    product: 'Tomato (Grade A)',
    quantity: 500,
    unit: 'kg',
    qualityGrade: 'Grade A',
    initialPrice: 28,
    currentAgreedPrice: 27,
    deliveryLocation: 'Vijayawada Central Distribution Center',
    deliveryDate: new Date('2026-09-15T00:00:00Z'),
    status: 'ACCEPTED',
    validUntil: new Date('2026-09-20T00:00:00Z'),
    counterHistory: [
      {
        senderId: buyerUser._id.toString(),
        senderRole: 'BUYER',
        senderName: buyerUser.name,
        proposedPrice: 25,
        quantity: 500,
        notes: 'Initial buyer proposal based on bulk order purchase target.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 4),
      },
      {
        senderId: farmerA._id.toString(),
        senderRole: 'FARMER',
        senderName: farmerA.name,
        proposedPrice: 28,
        quantity: 500,
        notes: 'Farmer counter: Grade-A greenhouse yield with pre-sorting included.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 3),
      },
      {
        senderId: buyerUser._id.toString(),
        senderRole: 'BUYER',
        senderName: buyerUser.name,
        proposedPrice: 26,
        quantity: 500,
        notes: 'Buyer revision: Willing to raise offer to ₹26/kg for guaranteed crate packaging.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
      {
        senderId: farmerA._id.toString(),
        senderRole: 'FARMER',
        senderName: farmerA.name,
        proposedPrice: 27,
        quantity: 500,
        notes: 'Farmer counter: Settlement price at ₹27/kg inclusive of transport to central hub.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 1),
      },
      {
        senderId: buyerUser._id.toString(),
        senderRole: 'BUYER',
        senderName: buyerUser.name,
        proposedPrice: 27,
        quantity: 500,
        notes: 'Buyer accepted settlement price of ₹27/kg. Order generated.',
        createdAt: new Date(),
      },
    ],
  });

  console.log('📦 Creating active order & fulfillment timeline...');
  const demoOrder = await Order.create({
    orderNumber: 'ORD-2026-0089',
    quotationId: demoQuotation._id,
    buyerId: buyerUser._id.toString(),
    buyerName: buyerUser.name,
    supplierIds: [farmerA._id.toString()],
    items: [
      {
        produceListingId: listingA._id,
        supplierId: farmerA._id.toString(),
        supplierName: farmerA.name,
        product: 'Tomato (Grade A)',
        quantity: 500,
        unit: 'kg',
        agreedPricePerUnit: 27,
        totalAmount: 13500,
        qualityGrade: 'Grade A',
      },
    ],
    totalQuantity: 500,
    totalValue: 13500,
    deliveryLocation: 'Vijayawada Central Distribution Center, Benz Circle, Vijayawada',
    deliveryDate: new Date('2026-09-15T00:00:00Z'),
    orderStatus: 'IN_TRANSIT',
    currentFulfillmentStage: 'IN_TRANSIT',
    notes: 'Cold vehicle dispatch scheduled for morning delivery.',
  });

  const stages = [
    {
      stage: 'ORDER_CONFIRMED',
      title: 'Order Confirmed',
      description: 'Negotiation completed. Contract generated for 500 kg Grade-A Tomato @ ₹27/kg.',
      completed: true,
      timeOffsetMinutes: -240,
    },
    {
      stage: 'PRODUCE_PREPARED',
      title: 'Produce Harvested & Prepared',
      description: 'Fresh harvest completed at Ramesh Patel farm lot #4.',
      completed: true,
      timeOffsetMinutes: -180,
    },
    {
      stage: 'QUALITY_VERIFIED',
      title: 'Quality Grade A Verified',
      description: 'Visual sorting, size grading (60-70mm), and blemish check confirmed Grade-A.',
      completed: true,
      timeOffsetMinutes: -120,
    },
    {
      stage: 'PACKED',
      title: 'Ventilated Crates Packed',
      description: '25 ventilated crates (20 kg each) sealed and loaded.',
      completed: true,
      timeOffsetMinutes: -60,
    },
    {
      stage: 'IN_TRANSIT',
      title: 'In Transit to Vijayawada Hub',
      description: 'Vehicle AP-16-TV-4521 dispatched from Gannavaram route.',
      completed: true,
      timeOffsetMinutes: -10,
    },
    {
      stage: 'DELIVERED',
      title: 'Delivered to Distribution Center',
      description: 'Arrival inspection and weighbridge verification pending.',
      completed: false,
      timeOffsetMinutes: 120,
    },
  ];

  for (const s of stages) {
    await FulfillmentEvent.create({
      orderId: demoOrder._id,
      stage: s.stage,
      title: s.title,
      description: s.description,
      actorId: farmerA._id.toString(),
      actorRole: 'FARMER',
      timestamp: new Date(Date.now() + s.timeOffsetMinutes * 60 * 1000),
      completed: s.completed,
    });
  }

  console.log('🔔 Creating in-app notifications...');
  await Notification.create({
    userId: buyerUser._id.toString(),
    title: 'Smart Aggregated Match Available',
    message: 'We discovered 2,000 kg of Grade-A Tomatoes aggregated across 3 local farmers in Vijayawada.',
    type: 'MATCH',
    link: '/buyer/matches',
    read: false,
  });

  await Notification.create({
    userId: farmerA._id.toString(),
    title: 'Counter-Offer Accepted',
    message: 'Godavari Fresh accepted your counter-offer of ₹27/kg. Order ORD-2026-0089 confirmed.',
    type: 'ORDER',
    link: '/farmer/orders',
    read: false,
  });

  console.log('📜 Recording audit log...');
  await AuditLog.create({
    actorId: adminUser._id.toString(),
    actorRole: 'ADMIN',
    action: 'SEED_INITIALIZATION',
    resource: 'DATABASE',
    details: {
      message: 'Demo dataset initialized successfully with 2,000 kg Tomato aggregation scenario.',
    },
  });

  console.log('✅ Database seeding complete! Ready for hackathon demonstration.');
}

// If executed directly from command line
if (require.main === module) {
  runDatabaseSeed()
    .then(() => {
      console.log('🎉 Seeder completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeder error:', err);
      process.exit(1);
    });
}
