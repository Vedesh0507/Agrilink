'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText,
  SlidersHorizontal,
  Truck,
  Building2,
  Wheat,
  Scale,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  LogIn,
  Check,
  BarChart3,
  Network,
  Clock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white selection:bg-agri-orange-500 selection:text-white">
      <Navbar />

      {/* 1. HERO SECTION: Name, Caption, Direct CTAs & Trust Metrics */}
      <section className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-24 border-b border-neutral-100 bg-gradient-to-b from-neutral-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Platform Emblem */}
            <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0" style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}>
                <img src="/logo.png" alt="AgriLink" width={32} height={32} className="w-full h-full object-contain" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="text-xs font-black tracking-wide text-black uppercase">
                Agri<span className="text-agri-orange-500">Link</span> Enterprise Platform
              </span>
            </div>

            {/* The Caption */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tight leading-[1.12]">
              Connect Farm Supply With Real{' '}
              <span className="text-agri-orange-500 underline decoration-black decoration-4 underline-offset-8">
                Business Demand
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              The B2B Farm-to-Buyer Marketplace & Agricultural Supply Chain Platform connecting fragmented farm production with verified commercial demand. Discover buyers, negotiate contracts, and fulfill orders with end-to-end transparency.
            </p>

            {/* Top Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Link
                href="/login?register=true"
                className="w-full sm:w-auto px-8 py-3.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl text-sm border border-neutral-300 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-neutral-500" />
                <span>Sign In</span>
              </Link>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-neutral-200 mt-10">
              <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                <div className="text-xl font-black text-black">100% Direct</div>
                <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Farm-to-buyer transaction without middleman fees</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                <div className="text-xl font-black text-agri-orange-500">6-Factor</div>
                <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Deterministic compatibility matching algorithm</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                <div className="text-xl font-black text-black">Multi-Supplier</div>
                <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Yield aggregation pooling smallholder lots</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                <div className="text-xl font-black text-agri-orange-500">6-Stage</div>
                <div className="text-[11px] text-neutral-500 font-medium mt-0.5">Physical milestone fulfillment verification</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE USERS: WHO CAN USE AGRILINK */}
      <section className="py-16 md:py-20 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200">
              Platform Participants
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-black mt-3">
              Who Can Use AgriLink?
            </h2>
            <p className="text-neutral-600 text-sm mt-1">
              Purpose-built for both sides of the agricultural commerce ecosystem. Choose your role to register or sign in directly to your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* USER 1: FARMERS & PRODUCERS */}
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-agri-orange-500 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-600 flex items-center justify-center">
                  <Wheat className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-agri-orange-600 tracking-wider">
                    Agricultural Producers
                  </span>
                  <h3 className="text-2xl font-black text-black mt-0.5">
                    For Farmers & Collectives (FPOs)
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Engineered for individual smallholders, Farmer Producer Organizations (FPOs), and agricultural cooperatives. Eliminate distress sales, gain direct visibility into buyer demand, and pool your crops to fulfill large commercial purchase orders.
                </p>

                <div className="pt-2 space-y-2.5 text-xs text-neutral-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>Publish upcoming harvest lots with variety, grade, and expected price</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>Aggregate supply with neighboring farmers to unlock bulk buyer demand</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>Receive instant quotations and submit commercial counter-offers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>Advance order stages through preparation, packing, and dispatch</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3 mt-6">
                <Link
                  href="/login?role=FARMER&register=true"
                  className="w-full sm:flex-1 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Farmer Account
                </Link>
                <Link
                  href="/login?role=FARMER"
                  className="w-full sm:flex-1 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-300"
                >
                  <LogIn className="w-3.5 h-3.5 text-neutral-500" /> Sign In
                </Link>
              </div>
            </div>

            {/* USER 2: INSTITUTIONAL BUYERS */}
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-black transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-agri-orange-500" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider">
                    Commercial Buyers
                  </span>
                  <h3 className="text-2xl font-black text-black mt-0.5">
                    For Institutional Procurement
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Tailored for food processors, supermarket chains, hospitality consortia, and bulk wholesalers who require consistent agricultural volume, certified quality standards, predictable delivery schedules, and transparent procurement contracts.
                </p>

                <div className="pt-2 space-y-2.5 text-xs text-neutral-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Post specific procurement requirements (volume, grade, price, location)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Discover single & multi-supplier aggregated lots with transparent score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Initiate formal quotations and counter-offer rounds with farmers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Track 6-stage physical dispatch directly to your warehouse hub</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3 mt-6">
                <Link
                  href="/login?role=BUYER&register=true"
                  className="w-full sm:flex-1 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Buyer Account
                </Link>
                <Link
                  href="/login?role=BUYER"
                  className="w-full sm:flex-1 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-300"
                >
                  <LogIn className="w-3.5 h-3.5 text-neutral-500" /> Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PROJECT FEATURES */}
      <section className="py-16 md:py-24 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200">
              Enterprise Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-black mt-3">
              Platform Features Built for Agricultural Scale
            </h2>
            <p className="text-neutral-600 text-sm mt-1">
              AgriLink solves the coordination gap between fragmented smallholder farming and bulk institutional demand through algorithmic intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-4 hover:border-agri-orange-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-agri-orange-500 text-white flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="font-black text-lg text-black">Multi-Supplier Yield Aggregation</h4>
                <p className="text-xs text-neutral-600 leading-relaxed mt-2">
                  Solves supply fragmentation by automatically bundling multiple smallholder lots (e.g. 500kg + 700kg + 800kg) to fulfill bulk commercial orders of 2,000+ kg without middleman overhead.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/80 text-[11px] font-bold text-agri-orange-600 flex items-center gap-1">
                <span>Supply Pooling Protocol</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-4 hover:border-black transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-agri-orange-500" />
                </div>
                <h4 className="font-black text-lg text-black">Deterministic 6-Factor Matching</h4>
                <p className="text-xs text-neutral-600 leading-relaxed mt-2">
                  Scores compatibility across Product (30%), Volume (20%), Quality Grade (15%), Proximity (15%), Harvest Date (10%), and Target Price (10%) with full mathematical explainability.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/80 text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                <span>Explainable AI Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-4 hover:border-agri-orange-500 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-agri-orange-500 text-white flex items-center justify-center mb-4">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h4 className="font-black text-lg text-black">Dynamic Counter-Offers & Contracts</h4>
                <p className="text-xs text-neutral-600 leading-relaxed mt-2">
                  Eliminates opaque price discovery through structured commercial counter-offer rounds between producers and buyers. When accepted, binding purchase orders are created automatically.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/80 text-[11px] font-bold text-agri-orange-600 flex items-center gap-1">
                <span>Automated PO Generation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-4 hover:border-black transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-agri-orange-500" />
                </div>
                <h4 className="font-black text-lg text-black">6-Stage Milestone Fulfillment</h4>
                <p className="text-xs text-neutral-600 leading-relaxed mt-2">
                  Full lifecycle visibility from Order Confirmed, Harvest Prepared, Quality Verified, Packaging Complete, In Transit dispatch, to Final Destination Delivery.
                </p>
              </div>
              <div className="pt-3 border-t border-neutral-200/80 text-[11px] font-bold text-neutral-800 flex items-center gap-1">
                <span>Physical Traceability</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE 6-STEP PROCUREMENT TIMELINE */}
      <section className="py-16 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-black text-black">
              End-to-End Procurement Lifecycle
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              How agricultural goods flow from verified farm harvests to commercial distribution centers.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="font-black text-agri-orange-500 block text-sm">01</span>
              <span className="font-bold text-black mt-1 block">List Supply</span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Farmers post harvest</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="font-black text-agri-orange-500 block text-sm">02</span>
              <span className="font-bold text-black mt-1 block">Define Demand</span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Buyers specify specs</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="font-black text-agri-orange-500 block text-sm">03</span>
              <span className="font-bold text-black mt-1 block">Smart Match</span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Pool & score lots</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="font-black text-agri-orange-500 block text-sm">04</span>
              <span className="font-bold text-black mt-1 block">Negotiate</span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">Bid & counter-offer</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="font-black text-agri-orange-500 block text-sm">05</span>
              <span className="font-bold text-black mt-1 block">Order Lock</span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">PO contract generated</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <span className="font-black text-agri-orange-500 block text-sm">06</span>
              <span className="font-bold text-black mt-1 block">Track Delivery</span>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">6-stage physical dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL ACTION BANNER */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white p-1 mx-auto overflow-hidden shrink-0" style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}>
            <img src="/logo.png" alt="AgriLink Logo" width={56} height={56} className="w-full h-full object-contain" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Modernize Your Agricultural Supply Chain?
          </h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto">
            Join hundreds of verified agricultural producers and institutional procurement buyers trading with algorithmic confidence on AgriLink.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login?register=true"
              className="w-full sm:w-auto px-8 py-3.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-agri-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs sm:text-sm border border-neutral-700 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-neutral-400" />
              <span>Sign In to Your Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
