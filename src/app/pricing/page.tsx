'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Check,
  Sparkles,
  ShieldCheck,
  Building2,
  Wheat,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
  Receipt,
  Scale,
  CreditCard,
} from 'lucide-react';
import { ISubscriptionPlan } from '@/types';

export default function PricingPage() {
  const { user, role } = useAuth();
  const { t, language } = useLanguage();

  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [platformFee, setPlatformFee] = useState<number>(2.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/billing/plans');
        const data = await res.json();
        if (data.success && data.data?.plans) {
          setPlans(data.data.plans);
          if (data.data.platformFeePercentage) {
            setPlatformFee(data.data.platformFeePercentage);
          }
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Transparent B2B Agricultural Monetization
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight">
            Fair Pricing for Farmers.
            <br />
            <span className="text-agri-orange-500">Predictable Scale for Buyers.</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-600">
            AgriLink operates on a transparent model: Producers list for free, enterprise buyers access specialized procurement tools through subscriptions, and completed trades pay a minimal platform transaction fee.
          </p>
        </div>

        {/* Farmer Free Highlight Banner */}
        <div className="mt-10 max-w-4xl mx-auto bg-gradient-to-r from-emerald-900 to-green-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800/80 border border-emerald-700 flex items-center justify-center shrink-0">
              <Wheat className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black">Farmers & Producer Collectives (FPOs)</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                  100% Free Forever
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-xl">
                Zero subscription costs. Zero harvest listing fees. Direct access to verified commercial buyers, automated weighing slips, and guaranteed escrow bank settlements.
              </p>
            </div>
          </div>
          <Link
            href={role === 'FARMER' ? '/farmer' : '/login?register=true&role=FARMER'}
            className="shrink-0 px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg"
          >
            Start Selling Produce <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Buyer Subscription Tiers */}
        <div className="mt-14">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-black">Buyer Procurement Subscription Plans</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Select the plan tailored to your organization's monthly volume and multi-user operational requirements.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-3xl bg-neutral-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {plans.map((plan) => {
                const isBusiness = plan.code === 'BUSINESS';
                const isEnterprise = plan.code === 'ENTERPRISE';

                return (
                  <div
                    key={plan.code}
                    className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                      isBusiness
                        ? 'bg-black text-white shadow-2xl border-2 border-agri-orange-500 ring-4 ring-agri-orange-500/20'
                        : 'bg-white text-neutral-900 border border-neutral-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isBusiness && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-agri-orange-500 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                        Most Popular for Wholesalers
                      </div>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-xl font-black ${isBusiness ? 'text-white' : 'text-black'}`}>
                            {plan.name}
                          </h3>
                          <p className={`text-xs mt-1 ${isBusiness ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {plan.description}
                          </p>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black">
                          {plan.priceMonthly === 0 ? '₹0' : `₹${plan.priceMonthly.toLocaleString()}`}
                        </span>
                        <span className={`text-xs font-semibold ${isBusiness ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          / month
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] font-semibold flex items-center gap-1 text-agri-orange-500">
                        <Scale className="w-3.5 h-3.5" />
                        <span>Platform fee on completed trades: {plan.transactionFeePercentage}%</span>
                      </div>

                      {/* Feature List */}
                      <div className="mt-8 space-y-3.5 border-t border-neutral-100 pt-6">
                        <div className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                          <span>
                            <strong>
                              {plan.features.maxMonthlyRequirements === -1
                                ? 'Unlimited'
                                : plan.features.maxMonthlyRequirements}
                            </strong>{' '}
                            Procurement requirements / mo
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                          <span>
                            <strong>
                              {plan.features.maxOrganizationUsers === -1
                                ? 'Unlimited'
                                : plan.features.maxOrganizationUsers}
                            </strong>{' '}
                            Organization users & roles
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                          <span>
                            {plan.features.advancedMatching
                              ? 'Advanced Smart Knapsack Multi-Supplier Pooling'
                              : 'Standard Single-Supplier Matching'}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                          <span>
                            {plan.features.advancedAnalytics
                              ? 'Full Commercial Analytics & Regional Price Trends'
                              : 'Basic Order Tracker Dashboard'}
                          </span>
                        </div>

                        {plan.features.negotiationWorkspace && (
                          <div className="flex items-start gap-2.5 text-xs">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                            <span>Live Counter-Offer & Negotiation Workspace</span>
                          </div>
                        )}

                        {plan.features.prioritySupport && (
                          <div className="flex items-start gap-2.5 text-xs">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                            <span>Priority Logistics Dispatch & WhatsApp Desk</span>
                          </div>
                        )}

                        {plan.features.apiAccess && (
                          <div className="flex items-start gap-2.5 text-xs">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                            <span>REST API Access & Webhook Integrations</span>
                          </div>
                        )}

                        {plan.features.erpIntegration && (
                          <div className="flex items-start gap-2.5 text-xs">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                            <span>Enterprise ERP & SAP Inventory Sync</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8 pt-4">
                      {role === 'BUYER' ? (
                        <Link
                          href={`/buyer?tab=billing&selectPlan=${plan.code}`}
                          className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-center block transition-all shadow-md ${
                            isBusiness
                              ? 'bg-agri-orange-500 hover:bg-agri-orange-600 text-white'
                              : 'bg-neutral-900 hover:bg-black text-white'
                          }`}
                        >
                          {plan.code === 'FREE' ? 'Current / Activate Free' : `Choose ${plan.name}`}
                        </Link>
                      ) : (
                        <Link
                          href={`/login?register=true&role=BUYER&plan=${plan.code}`}
                          className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-center block transition-all shadow-md ${
                            isBusiness
                              ? 'bg-agri-orange-500 hover:bg-agri-orange-600 text-white'
                              : 'bg-neutral-900 hover:bg-black text-white'
                          }`}
                        >
                          Get Started as Buyer
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Fee Transparency Card */}
        <div className="mt-14 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-agri-orange-50 text-agri-orange-600 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-black">
                How AgriLink's Platform Transaction Fee Works
              </h3>
              <p className="text-xs text-neutral-500">
                Guaranteed fairness with no hidden escrow charges or unannounced markups.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <span className="font-bold text-neutral-400 uppercase text-[10px]">Step 1: Escrow Lock</span>
              <p className="font-bold text-neutral-800">100% Secure Buyer Deposit</p>
              <p className="text-neutral-500 text-[11px]">
                Upon quotation acceptance, full trade value is securely recorded in the trade escrow.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <span className="font-bold text-neutral-400 uppercase text-[10px]">Step 2: Delivery & Inspection</span>
              <p className="font-bold text-neutral-800">Weighbridge Handover</p>
              <p className="text-neutral-500 text-[11px]">
                Quality verified and electronic receiving slips uploaded at buyer's warehouse.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
              <span className="font-bold text-neutral-400 uppercase text-[10px]">Step 3: Instant Settlement</span>
              <p className="font-bold text-neutral-800">Net Farmer Payout</p>
              <p className="text-neutral-500 text-[11px]">
                AgriLink retains 1.0% - 2.5% platform fee with GST tax invoice; remaining 97.5% - 99% is instantly disbursed to farmer.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-14 max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-black text-black">Frequently Asked Questions</h3>
            <p className="text-xs text-neutral-500 mt-1">Clear answers about billing, tax, and mandi operations</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                q: 'Are farmers ever charged a subscription fee?',
                a: 'No. All registered smallholder farmers and FPO producer collectives have free, unrestricted access to list crops, review buyer demand, and receive payments directly.',
              },
              {
                q: 'Can our organization upgrade or downgrade anytime?',
                a: 'Yes. You can switch between Free, Business, and Enterprise plans directly from the Buyer Billing portal. Upgrades are activated immediately with prorated invoicing.',
              },
              {
                q: 'Do you provide formal B2B GST tax invoices?',
                a: 'Yes. All subscription charges and platform transaction fees include standard HSN codes with CGST, SGST, or IGST breakdowns available for instant PDF download.',
              },
              {
                q: 'What payment methods are supported?',
                a: 'AgriLink supports B2B Net Banking, NEFT/RTGS direct clearing, UPI, and corporate credit cards through integrated payment gateways.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-1">
                <div className="font-bold text-neutral-900 flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-agri-orange-500" />
                  <span>{faq.q}</span>
                </div>
                <p className="text-neutral-600 pl-5.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
