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
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-600 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-agri-orange-500"></span>
              Enterprise B2B Agricultural Infrastructure
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black tracking-tight leading-[1.15]">
              Connect Farm Supply With Real{' '}
              <span className="text-agri-orange-500 underline decoration-black decoration-4 underline-offset-8">
                Business Demand
              </span>
            </h1>

            {/* Supporting Message */}
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Discover buyers, find reliable suppliers, negotiate agricultural orders, and manage procurement from sourcing to fulfillment — all in one place.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/buyer"
                className="w-full sm:w-auto px-8 py-4 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-agri-orange-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base"
              >
                Find Produce <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/farmer"
                className="w-full sm:w-auto px-8 py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-2xl border border-neutral-800 shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base"
              >
                List Your Produce
              </Link>
            </div>

            {/* Trust Stats */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-neutral-200 mt-12 text-left">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-black">2,000 kg</div>
                <div className="text-xs text-neutral-500 font-medium">Bulk Yield Aggregation</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-agri-orange-500">6-Factor</div>
                <div className="text-xs text-neutral-500 font-medium">Deterministic Matching</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-black">Round-Trip</div>
                <div className="text-xs text-neutral-500 font-medium">Counter-Offer Engine</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-agri-orange-500">6-Stage</div>
                <div className="text-xs text-neutral-500 font-medium">Fulfillment Tracking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Procurement Workflow Section */}
      <section id="workflow" className="py-20 bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200">
              End-to-End Operational Lifecycle
            </span>
            <h2 className="text-3xl font-bold text-black mt-4">
              The Complete Agricultural Commerce Workflow
            </h2>
            <p className="text-neutral-600 text-sm mt-2">
              AgriLink is not a simple directory. It manages the full transaction chain from lot availability to doorstep delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {[
              {
                step: '01',
                title: 'LIST SUPPLY',
                desc: 'Farmers post quantity, variety, grade, price & harvest availability date.',
                icon: Wheat,
              },
              {
                step: '02',
                title: 'DEFINE DEMAND',
                desc: 'Buyers specify volume, target price, quality specs & delivery hub.',
                icon: Building2,
              },
              {
                step: '03',
                title: 'SMART MATCH',
                desc: 'Algorithm scores individual & multi-supplier aggregated supply.',
                icon: Layers,
              },
              {
                step: '04',
                title: 'NEGOTIATE',
                desc: 'Structured counter-offers align price and delivery logistics.',
                icon: SlidersHorizontal,
              },
              {
                step: '05',
                title: 'ORDER',
                desc: 'Accepted terms generate enforceable contract & audit record.',
                icon: FileText,
              },
              {
                step: '06',
                title: 'FULFILL',
                desc: 'Track sorting, packing, dispatch & weighbridge acceptance.',
                icon: Truck,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm relative group hover:border-agri-orange-500 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-agri-orange-500 tracking-wider">
                    {item.step}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-agri-orange-500 group-hover:text-white transition-colors flex items-center justify-center text-neutral-800">
                    <item.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-black mb-1">{item.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Farmers & For Buyers Dual Pillars */}
      <section className="py-20 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Farmers */}
            <div id="farmers" className="p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200 mb-6">
                  <Wheat className="w-3.5 h-3.5" /> For Farmers & Producer Collectives
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-black mb-4">
                  Guaranteed Market Access Without Middlemen Exploitation
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                  Farmers struggle with distress selling at local mandis. AgriLink enables direct quotation requests from bulk institutional buyers with complete price transparency.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-neutral-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-agri-orange-500 shrink-0 mt-0.5" />
                    <span><strong>List upcoming harvests</strong> weeks ahead to secure binding purchase orders.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-agri-orange-500 shrink-0 mt-0.5" />
                    <span><strong>Multi-farmer aggregation</strong> lets smallholders pool yields to meet massive 2,000+ kg institutional demands.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-agri-orange-500 shrink-0 mt-0.5" />
                    <span><strong>Direct counter-offers</strong> allow transparent negotiation without unfair dealer deductions.</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/farmer"
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                Go to Farmer Dashboard
              </Link>
            </div>

            {/* For Buyers */}
            <div id="buyers" className="p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-neutral-100 px-3 py-1 rounded-full border border-neutral-300 mb-6">
                  <Building2 className="w-3.5 h-3.5" /> For Wholesalers, Retailers & Processors
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-black mb-4">
                  Reliable Agricultural Supply With Exact Specs & Timelines
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                  Food businesses require predictable volume, uniform grading, and certified delivery schedules. AgriLink connects your demand directly with verified regional farm clusters.
                </p>
                <ul className="space-y-3 mb-8 text-sm text-neutral-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-agri-orange-500 shrink-0 mt-0.5" />
                    <span><strong>Explainable Compatibility Score:</strong> Evaluate match by Product, Quantity, Quality Grade, Proximity, Date, and Target Price.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-agri-orange-500 shrink-0 mt-0.5" />
                    <span><strong>One-Click Aggregation:</strong> Platform automatically bundles 500kg + 700kg + 800kg lots into single 2,000kg contracts.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-agri-orange-500 shrink-0 mt-0.5" />
                    <span><strong>Live Fulfillment Milestones:</strong> Real-time stage updates from harvesting to weighbridge arrival.</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/buyer"
                className="w-full py-3.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-center text-sm transition-all"
              >
                Go to Buyer Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Matching Spotlight (Critical Demo Feature) */}
      <section id="matching" className="py-20 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-400 bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">
              Core Engine Highlight
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">
              Smart Deterministic Matching & Supply Aggregation
            </h2>
            <p className="text-neutral-400 text-sm mt-3 leading-relaxed">
              No black-box hallucinations. A transparent multi-factor scoring algorithm that solves smallholder fragmentation through intelligent lot pooling.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-black p-6 rounded-2xl border border-neutral-800">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                  <span>Transparent 6-Factor Weights</span>
                  <Scale className="w-4 h-4 text-agri-orange-500" />
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                    <span className="text-neutral-400">Product & Variety Compatibility</span>
                    <span className="font-bold text-white">30%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                    <span className="text-neutral-400">Quantity Availability / Aggregation</span>
                    <span className="font-bold text-white">20%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                    <span className="text-neutral-400">Quality Grade Standards (Grade A/B/C)</span>
                    <span className="font-bold text-white">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                    <span className="text-neutral-400">Geographic Proximity & Corridor</span>
                    <span className="font-bold text-white">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                    <span className="text-neutral-400">Harvest & Delivery Date Compatibility</span>
                    <span className="font-bold text-white">10%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-400">Price Tolerance & Market Band</span>
                    <span className="font-bold text-white">10%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Aggregation Demonstration Visual */}
            <div className="lg:col-span-7 bg-black p-6 sm:p-8 rounded-3xl border border-neutral-800 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
                <div>
                  <span className="text-[11px] font-bold text-agri-orange-400 uppercase tracking-wide">
                    Live Procurement Opportunity: Vijayawada Hub
                  </span>
                  <h4 className="text-lg font-bold text-white">
                    Buyer Request: 2,000 kg Grade-A Tomato @ ₹28/kg
                  </h4>
                </div>
                <div className="bg-agri-orange-500 text-white font-black px-3 py-1.5 rounded-xl text-sm">
                  96% Match
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-agri-orange-500"></span>
                    <span className="text-white font-medium">Farmer A (Ramesh Patel — Vijayawada Rural)</span>
                  </div>
                  <span className="font-bold text-white">500 kg Grade A</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-agri-orange-500"></span>
                    <span className="text-white font-medium">Farmer B (Suresh Rao — Gannavaram)</span>
                  </div>
                  <span className="font-bold text-white">700 kg Grade A</span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-agri-orange-500"></span>
                    <span className="text-white font-medium">Farmer C (Venkat Reddy — Kankipadu)</span>
                  </div>
                  <span className="font-bold text-white">800 kg Grade A</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-agri-orange-500/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-400">Aggregated Total Supply:</span>
                  <div className="text-lg font-black text-white">
                    500 + 700 + 800 = <span className="text-agri-orange-400">2,000 kg (100% Fulfilled)</span>
                  </div>
                </div>
                <Link
                  href="/buyer"
                  className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl transition-all"
                >
                  View In Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fulfillment Tracker Section */}
      <section className="py-20 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200">
              Supply Chain Traceability
            </span>
            <h2 className="text-3xl font-bold text-black mt-4">
              Real-Time Fulfillment Visibility
            </h2>
            <p className="text-neutral-600 text-sm mt-2">
              From contract agreement to dock receipt, every physical milestone is verified and stored in MongoDB.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { stage: 'Order Confirmed', status: 'Completed', icon: CheckCircle2 },
                { stage: 'Produce Prepared', status: 'Completed', icon: CheckCircle2 },
                { stage: 'Quality Verified', status: 'Completed', icon: CheckCircle2 },
                { stage: 'Crates Packed', status: 'Completed', icon: CheckCircle2 },
                { stage: 'In Transit', status: 'Active', icon: Truck },
                { stage: 'Delivered', status: 'Pending', icon: ShieldCheck },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 ${
                    item.status === 'Completed'
                      ? 'bg-neutral-50 border-neutral-300 text-black'
                      : item.status === 'Active'
                      ? 'bg-agri-orange-50 border-agri-orange-500 text-agri-orange-600'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <div className="font-bold text-xs">{item.stage}</div>
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'Completed'
                        ? 'bg-black text-white'
                        : item.status === 'Active'
                        ? 'bg-agri-orange-500 text-white'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black">
            Ready to Experience B2B Agricultural Procurement?
          </h2>
          <p className="text-neutral-600 text-base max-w-xl mx-auto">
            Join the decentralized agricultural network. Source certified high-grade crops with multi-farmer volume aggregation and real-time shipment traceability.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/buyer"
              className="px-8 py-4 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-2xl shadow-sm transition-all"
            >
              Open Buyer Portal
            </Link>
            <Link
              href="/farmer"
              className="px-8 py-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-2xl transition-all"
            >
              Open Farmer Portal
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
