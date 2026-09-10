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
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white">
      <Navbar />

      {/* 1. HERO SECTION: Website Name & Caption */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-600 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-agri-orange-500"></span>
              Enterprise B2B Agricultural Marketplace
            </div>

            {/* Platform Title */}
            <div className="text-sm font-black uppercase tracking-widest text-neutral-400">
              Agri<span className="text-agri-orange-500">Link</span> Platform
            </div>

            {/* The Caption */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tight leading-[1.15]">
              Connect Farm Supply With Real{' '}
              <span className="text-agri-orange-500 underline decoration-black decoration-4 underline-offset-8">
                Business Demand
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Discover buyers, find reliable suppliers, negotiate agricultural orders, and manage procurement from sourcing to fulfillment — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* 2. WHO CAN USE IT & ONBOARDING / SIGN IN SECTION */}
      <section className="py-16 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200">
              Participant Portals
            </span>
            <h2 className="text-3xl font-extrabold text-black mt-3">
              Who Can Use AgriLink?
            </h2>
            <p className="text-neutral-600 text-sm mt-1">
              Select your role below to create a new account or sign in to your dedicated portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* PANEL 1: FOR FARMERS & PRODUCERS */}
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-agri-orange-500 transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-600 flex items-center justify-center mb-5">
                  <Wheat className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase text-agri-orange-600 tracking-wider">
                  Producers & Collectives
                </span>
                <h3 className="text-2xl font-black text-black mt-1 mb-3">
                  For Farmers & Producer Organizations
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                  Designed for individual smallholders, Farmer Producer Organizations (FPOs), and agricultural cooperatives looking for guaranteed institutional demand and direct commercial negotiations.
                </p>

                <ul className="space-y-2.5 text-xs text-neutral-700 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>List upcoming harvest lots with price, quantity, and grade</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>Pool yields with neighboring farmers to fulfill bulk orders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-agri-orange-500 shrink-0" />
                    <span>Receive and counter quotation requests transparently</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/farmer"
                  className="w-full sm:flex-1 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> Farmer Sign In
                </Link>
                <Link
                  href="/login?role=FARMER"
                  className="w-full sm:flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-300"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Farmer Account
                </Link>
              </div>
            </div>

            {/* PANEL 2: FOR INSTITUTIONAL BUYERS */}
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-black transition-all">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-agri-orange-500" />
                </div>
                <span className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider">
                  Wholesalers & Processors
                </span>
                <h3 className="text-2xl font-black text-black mt-1 mb-3">
                  For Institutional Procurement Buyers
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                  Tailored for food processors, supermarket chains, hospitality consortia, and bulk wholesalers who need reliable crop volume, certified grading, and scheduled delivery.
                </p>

                <ul className="space-y-2.5 text-xs text-neutral-700 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Post specific procurement requirements (volume, grade, price)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Discover single & multi-farmer aggregated supply bundles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>Track 6-stage shipment milestones to your distribution hub</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/buyer"
                  className="w-full sm:flex-1 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> Buyer Sign In
                </Link>
                <Link
                  href="/login?role=BUYER"
                  className="w-full sm:flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-300"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Buyer Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PLATFORM FEATURES */}
      <section className="py-20 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-extrabold text-black mt-3">
              Platform Features Built for Agricultural Commerce
            </h2>
            <p className="text-neutral-600 text-sm mt-1">
              AgriLink bridges fragmented supply and enterprise demand through algorithmic precision and commercial execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-agri-orange-500 text-white flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base text-black">Multi-Farmer Aggregation</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Smallholder yields are pooled automatically (e.g. 500kg + 700kg + 800kg) to satisfy institutional orders of 2,000+ kg without manual brokerage friction.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                <Scale className="w-5 h-5 text-agri-orange-500" />
              </div>
              <h4 className="font-extrabold text-base text-black">Deterministic Smart Matching</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Scores compatibility across Product (30%), Volume (20%), Quality Grade (15%), Proximity (15%), Harvest Date (10%), and Target Price (10%).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-agri-orange-500 text-white flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base text-black">Structured Negotiation Engine</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Transparent round-trip counter-offers with price adjustments and delivery specs that automatically generate binding contracts upon acceptance.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                <Truck className="w-5 h-5 text-agri-orange-500" />
              </div>
              <h4 className="font-extrabold text-base text-black">6-Stage Milestone Tracking</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Physical verification timeline covering Order Confirmed, Produce Prepared, Quality Graded, Packed, In Transit, and Weighbridge Delivered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW LIFECYCLE */}
      <section className="py-16 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl font-black text-black">
              The 6-Step Agricultural Procurement Cycle
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs">
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-extrabold text-agri-orange-500 block text-sm">01</span>
              <span className="font-bold text-black mt-1 block">List Supply</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-extrabold text-agri-orange-500 block text-sm">02</span>
              <span className="font-bold text-black mt-1 block">Define Demand</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-extrabold text-agri-orange-500 block text-sm">03</span>
              <span className="font-bold text-black mt-1 block">Smart Match</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-extrabold text-agri-orange-500 block text-sm">04</span>
              <span className="font-bold text-black mt-1 block">Negotiate</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-extrabold text-agri-orange-500 block text-sm">05</span>
              <span className="font-bold text-black mt-1 block">Generate Order</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-neutral-200">
              <span className="font-extrabold text-agri-orange-500 block text-sm">06</span>
              <span className="font-bold text-black mt-1 block">Fulfill & Track</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
