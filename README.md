# AgriLink — B2B Agricultural Marketplace & Supply Chain Platform

> **24-Hour Swarnandhra College Hackathon 2026**  
> *Category: Smart Agriculture & Agritech SaaS (Problem Statement 4)*

---

## 1. Executive Summary & Problem Solved
Smallholder farmers and agricultural collectives frequently suffer from fragmented supply, lack of price transparency, and distress sales at local mandis with high commission deductions. Conversely, institutional buyers (supermarket chains, food processors, hotel consortia, and bulk wholesalers) require guaranteed volume, uniform quality grading, precise delivery schedules, and predictable pricing.

**AgriLink is not a static classified directory.** It is a full-lifecycle B2B procurement and supply chain execution engine supporting:
$$\text{Supply} \longrightarrow \text{Demand} \longrightarrow \text{Smart Matching} \longrightarrow \text{Quotations} \longrightarrow \text{Counter-Offer Negotiation} \longrightarrow \text{Order} \longrightarrow \text{Fulfillment Timeline}$$

---

## 2. Strict Tri-Color Design System
In strict compliance with the hackathon visual identity specification, AgriLink uses **strictly three colors**:
- 🟧 **Vibrant Agri Orange** (`#EA580C` / `#F97316`): Primary brand accents, high-conversion CTAs, active badges, and highlights.
- ⬛ **Deep Black** (`#000000` / `#0A0A0A`): Strong typography, high-contrast headers, dark surface cards, and primary action buttons.
- ⬜ **Clean White** (`#FFFFFF` / `#FAFAFA`): Clean whitespace, spacious cards, and backdrop containers.

*Zero accent colors (no blue, purple, green, or yellow) are introduced anywhere in the application.*

---

## 3. Core Architectural Highlights

### 3.1 Explainable Deterministic Matching Engine
Unlike unexplainable "black-box" wrappers, AgriLink uses an explainable, deterministic multi-factor scoring formula:
1. **Product Compatibility (30%)**: Exact botanical and varietal match (e.g. *Vaishnavi Hybrid Tomato*).
2. **Quantity Availability / Multi-Supplier Aggregation (20%)**: Full vs partial volume ratio.
3. **Quality Grade Compatibility (15%)**: Strict comparison of Grade A, Grade B, and Grade C standards.
4. **Geographic Proximity (15%)**: Regional logistics corridors (e.g. Vijayawada, Gannavaram, Kankipadu, Guntur).
5. **Harvest & Delivery Date Compatibility (10%)**: Temporal overlap with freshness buffer.
6. **Price Tolerance (10%)**: Proximity to target purchase budget.

### 3.2 The Hackathon Demo Scenario: Multi-Supplier Aggregation
- **Buyer Requirement**: 2,000 kg Grade-A Tomatoes @ ₹28/kg in Vijayawada needed by 15 September 2026.
- **Available Fragmented Supply**:
  - **Farmer A (Ramesh Patel)**: 500 kg Grade-A Tomatoes
  - **Farmer B (Suresh Rao)**: 700 kg Grade-A Tomatoes
  - **Farmer C (Venkat Reddy)**: 800 kg Grade-A Tomatoes
- **Matching Engine Result**:
  $$500\text{ kg} + 700\text{ kg} + 800\text{ kg} = 2,000\text{ kg} \quad (100\%\text{ Target Fulfilled})$$
  The platform pools these 3 independent producers into a single aggregated procurement opportunity with an explainable 96% match score!

### 3.3 Commercial Negotiation Workflow
Structured round-trip counter-offers without messy unstructured chat:
- Buyer initiates: ₹25/kg
- Farmer counters: ₹28/kg
- Buyer counters: ₹26/kg
- Farmer counters: ₹27/kg
- Buyer accepts: ₹27/kg $\longrightarrow$ Automatically generates enforceable purchase contract and MongoDB Order.

### 3.4 6-Stage Fulfillment Timeline
1. `ORDER_CONFIRMED`: Contract locked in MongoDB.
2. `PRODUCE_PREPARED`: Lot harvested and weighed at farm facility.
3. `QUALITY_VERIFIED`: Size sorting and blemish grading verified.
4. `PACKED`: Sealed in food-grade ventilated agricultural crates.
5. `IN_TRANSIT`: Dispatched on transport vehicle en-route to hub.
6. `DELIVERED`: Weighbridge verification and dock sign-off.

---

## 4. Hardened Security Architecture
1. **Isolated Ops Admin Terminal**: The Admin Dashboard (`/ops-admin`) is completely excluded from public navigation and footers. It enforces role-based clearance (`user.role === 'ADMIN'`) and validates a master server secret (`X-Admin-Secret-Key`).
2. **Cryptographic Authentication**: Identity is managed by Firebase Authentication; every backend route handler cryptographically validates session tokens via Firebase Admin SDK.
3. **Server-Side Authorization**: The backend never trusts client roles or tenant IDs. User records are loaded directly from MongoDB by authenticated Firebase UID.
4. **Protected Seeding**: Database seeding is restricted to the CLI (`npm run seed`) or the protected admin endpoint.
5. **Immutable Audit Logging**: Every critical operation (produce addition, quotation creation, counter-offer, order acceptance, fulfillment advancement) is immutably logged to the `auditLogs` collection with actor ID, role, and payload.

---

## 5. Technology Stack Rationale
| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | Unified TypeScript full-stack architecture, high-performance Server Components, and secure API Route Handlers. |
| **Styling** | Tailwind CSS | Strict custom theme enforcing Orange, Black, and White color system with zero styling leaks. |
| **Database** | MongoDB Atlas / Mongoose | Flexible document model ideally suited for dynamic agricultural order items, counter-offer streams, and fulfillment logs. |
| **Auth** | Firebase Authentication | Enterprise-grade identity handling, secure token issuance, and password recovery. |
| **Validation** | Zod | Runtime type safety and schema validation across all API endpoints. |

---

## 6. MongoDB Collections Schema
- `users`: Firebase UID, email, role (`FARMER` | `BUYER` | `ADMIN`), organizationId, location.
- `organizations`: Name, type, contact person, verification status.
- `produceListings`: Farmer ID, product, variety, quantity, availableQuantity, qualityGrade, expectedPricePerUnit, location, availableFromDate, status.
- `buyerRequirements`: Buyer ID, product, requiredQuantity, qualityGrade, targetPricePerUnit, deliveryLocation, requiredDeliveryDate, status.
- `matches`: Requirement ID, single vs aggregated match type, compatibility breakdown, totalScore, bundled suppliers.
- `quotations`: Quotation number, product, quantity, initial price, current agreed price, counter-offer history stream.
- `orders`: Order number, quotation ID, buyer, suppliers, items, totalQuantity, totalValue, status, fulfillment stage.
- `fulfillmentEvents`: Order ID, stage, title, description, timestamp, completed.
- `notifications`: User ID, title, message, link, read status.
- `auditLogs`: Actor ID, role, action, resource, details, timestamp.

---

## 7. Local Setup Instructions

### 7.1 Prerequisites
- Node.js 18+ or 20+ installed
- MongoDB installed locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string.

### 7.2 Installation & Seeding
```bash
# 1. Install all dependencies
npm install

# 2. Configure environment variables in .env.local
cp .env.example .env.local

# 3. Seed the database with the hackathon demo dataset
npm run seed

# 4. Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 8. Judging & Evaluation Walkthrough

Use the **Hackathon Demo Switcher** bar pinned at the top of the interface:

1. **Visit Landing Page (`/`)**:
   - Inspect the Orange / Black / White visual identity and commercial workflow diagram.
2. **Click "Farmer A (Ramesh)"**:
   - Inspect Farmer Dashboard (`/farmer`).
   - View active 500 kg Tomato listing and buyer requests.
   - Click "Add New Produce Lot" to test inventory creation.
3. **Click "Institutional Buyer (Godavari)"**:
   - Inspect Buyer Dashboard (`/buyer`).
   - Open **Smart Matches** tab.
   - Observe the **2,000 kg Aggregation Bundle** combining Farmer A (500 kg) + Farmer B (700 kg) + Farmer C (800 kg)!
   - View the transparent 6-factor score breakdown (96% compatibility).
4. **Test Negotiation Flow**:
   - Open **Quotations** tab.
   - Submit a counter-offer (e.g. ₹26/kg).
   - Click "Accept Quotation & Generate Order".
5. **Track Fulfillment**:
   - Open **Orders** tab.
   - Advance physical fulfillment stages (Order Confirmed $\rightarrow$ Prepared $\rightarrow$ Quality Verified $\rightarrow$ Packed $\rightarrow$ In Transit $\rightarrow$ Delivered).
6. **Click "Ops Admin"**:
   - Verify that platform operations metrics, total supply/demand volumes, and real-time immutable audit logs reflect all actions!

---

## 9. Future Roadmap (Phase 2 & Phase 3)
- **Phase 2 (Productization)**: Multi-lot escrow milestone payments, refrigerated reefer truck fleet logistics booking, and multilingual voice-first IVR for smallholder farmers.
- **Phase 3 (Productionize & Scale)**: Kafka / RabbitMQ event-driven order processing, IoT soil & cold-storage temperature telemetry, and automated APMC mandi price index syndication.
