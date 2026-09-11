'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  X,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { ISubscriptionPlan } from '@/types';

export default function PricingPage() {
  const router = useRouter();
  const { user, role, token } = useAuth();
  const { t, language } = useLanguage();

  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);
  const [platformFee, setPlatformFee] = useState<number>(2.5);
  const [loading, setLoading] = useState(true);

  // Subscribe Modal State
  const [selectedPlanForBuy, setSelectedPlanForBuy] = useState<ISubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [businessType, setBusinessType] = useState('WHOLESALER');
  const [gstin, setGstin] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Andhra Pradesh');
  const [procurementVolume, setProcurementVolume] = useState('10 - 50 MT/month');
  const [billingAddress, setBillingAddress] = useState('');

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

  const handleOpenSubscribeModal = (plan: ISubscriptionPlan) => {
    setErrorMsg(null);
    setSuccessData(null);
    setSelectedPlanForBuy(plan);

    // Pre-populate if user is already logged in
    if (user) {
      setContactPerson(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCompanyName(user.organizationName || `${user.name} Commercial Hub`);
      setCity(user.location || 'Guntur');
    } else {
      setContactPerson('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setCity('');
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setSelectedPlanForBuy(null);
      setErrorMsg(null);
      setSuccessData(null);
    }
  };

  const handleSubmitSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForBuy) return;

    if (!companyName.trim() || !contactPerson.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      setErrorMsg('Please fill in all mandatory business contact details.');
      return;
    }

    if (!user && (!password || password.length < 6)) {
      setErrorMsg('Password of at least 6 characters is required to set up your Buyer account.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetPlanCode: selectedPlanForBuy.code,
          companyName: companyName.trim(),
          contactPerson: contactPerson.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password || undefined,
          businessType,
          gstin: gstin.trim().toUpperCase(),
          city: city.trim(),
          state: state.trim(),
          procurementVolume,
          billingAddress: billingAddress.trim(),
          reason: `Buyer subscribed to ${selectedPlanForBuy.name} via Pricing Portal`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // If an authenticated session token is generated, persist it
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('agrilink_active_token', data.token);
          if (data.data?.user) {
            localStorage.setItem('agrilink_active_user', JSON.stringify(data.data.user));
          }
          document.cookie = `agrilink_token=${data.token}; path=/; max-age=2592000`;
        }

        setSuccessData(data.data);
      } else {
        setErrorMsg(data.error || 'Failed to activate subscription. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred while activating subscription.');
    } finally {
      setSubmitting(false);
    }
  };

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
                          <h3 className="text-xl font-black tracking-tight">{plan.name}</h3>
                          <p className={`text-xs mt-1 ${isBusiness ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {plan.description}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mt-6 mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black tracking-tight">
                            ₹{plan.priceMonthly.toLocaleString('en-IN')}
                          </span>
                          <span className={`text-xs ${isBusiness ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            / month
                          </span>
                        </div>
                        <div
                          className={`text-xs font-semibold mt-2 flex items-center gap-1.5 ${
                            isBusiness ? 'text-agri-orange-400' : 'text-agri-orange-600'
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5 shrink-0" />
                          Platform fee on completed trades: {plan.transactionFeePercentage}%
                        </div>
                      </div>

                      {/* Feature Checklist */}
                      <div className="space-y-3 pt-4 border-t border-neutral-200/40">
                        <div className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                          <span className="font-semibold">
                            {plan.features.maxMonthlyRequirements === -1
                              ? 'Unlimited'
                              : plan.features.maxMonthlyRequirements}{' '}
                            Procurement requirements / mo
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isBusiness ? 'text-agri-orange-400' : 'text-green-600'}`} />
                          <span>
                            {plan.features.maxOrganizationUsers}{' '}
                            {plan.features.maxOrganizationUsers === 1 ? 'Organization user' : 'Organization users & roles'}
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

                    {/* CTA Button: Opens Subscription Modal with Details Form */}
                    <div className="mt-8 pt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenSubscribeModal(plan)}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-center block transition-all shadow-md active:scale-98 ${
                          isBusiness
                            ? 'bg-agri-orange-500 hover:bg-agri-orange-600 text-white'
                            : 'bg-neutral-900 hover:bg-black text-white'
                        }`}
                      >
                        {role === 'BUYER'
                          ? plan.code === 'FREE'
                            ? 'Current / Activate Free'
                            : `Choose ${plan.name}`
                          : 'Get Started as Buyer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Fee Transparency Section */}
        <div className="mt-16 bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-black">How Transaction Fees Work</h3>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              AgriLink does not take high markups. Platform fees are assessed strictly on the buyer side upon successful quotation acceptance and order generation:
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="font-extrabold text-neutral-900">1. Gross Order Total (GMV)</div>
              <p className="text-neutral-500 mt-1">Calculated from final agreed price per quintal and total weight verified at gate.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="font-extrabold text-neutral-900">2. Platform Trade Fee</div>
              <p className="text-neutral-500 mt-1">Fixed at your subscription tier percentage (2.5% Free, 1.5% Business, 1.0% Enterprise).</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="font-extrabold text-neutral-900">3. 100% Farmer Settlement</div>
              <p className="text-neutral-500 mt-1">Zero deductions from the farmer. Producers receive 100% of the agreed lot purchase value.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-14 max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-black text-black">Frequently Asked Questions</h3>
            <p className="text-xs text-neutral-500 mt-1">Got questions about plans, billing, or enterprise options?</p>
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

      {/* BUYER SUBSCRIPTION & BASIC DETAILS ONBOARDING MODAL */}
      {selectedPlanForBuy && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-neutral-900 rounded-3xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-agri-orange-500 flex items-center justify-center text-white font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white tracking-tight">
                    Subscribe to {selectedPlanForBuy.name}
                  </h3>
                  <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span className="text-agri-orange-400 font-bold">
                      ₹{selectedPlanForBuy.priceMonthly.toLocaleString('en-IN')}/month
                    </span>
                    <span>•</span>
                    <span>
                      {selectedPlanForBuy.features.maxMonthlyRequirements === -1
                        ? 'Unlimited Reqs'
                        : `${selectedPlanForBuy.features.maxMonthlyRequirements} Reqs/mo`}
                    </span>
                    <span>•</span>
                    <span>{selectedPlanForBuy.transactionFeePercentage}% Trade Fee</span>
                  </div>
                </div>
              </div>

              {!submitting && (
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {successData ? (
                /* SUCCESS CONFIRMATION STATE */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-black">Subscription Activated Successfully!</h4>
                    <p className="text-xs text-neutral-600 mt-1 max-w-md mx-auto">
                      Your business details have been recorded and your organization subscription is now immediately active and reflected in the platform registry.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Organization / Buyer:</span>
                      <span className="font-bold text-black">{successData.organization?.name || companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Active Plan:</span>
                      <span className="font-bold text-agri-orange-600">{successData.plan?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Monthly Quota:</span>
                      <span className="font-bold text-black">
                        {successData.plan?.features?.maxMonthlyRequirements === -1
                          ? 'Unlimited'
                          : `${successData.plan?.features?.maxMonthlyRequirements} Requirements/mo`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Trade Fee:</span>
                      <span className="font-bold text-black">{successData.plan?.transactionFeePercentage}%</span>
                    </div>
                    {successData.invoice && (
                      <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                        <span className="text-neutral-500">Tax Invoice:</span>
                        <span className="font-mono font-bold text-neutral-900">{successData.invoice.invoiceNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        router.push('/buyer?tab=billing');
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
                    >
                      Go to Buyer Billing Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        router.push('/buyer');
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                    >
                      Post First Requirement
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM STATE: FILL BASIC DETAILS */
                <form onSubmit={handleSubmitSubscription} className="space-y-5">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <span className="font-bold">📋 Required Business Information:</span> Please enter your commercial organization details. This will configure your company profile, issue compliant B2B tax invoices, and immediately reflect in the Admin Subscriptions Console.
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Grid of Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Company Name */}
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-neutral-800 mb-1">
                        Company / Organization Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Sri Krishna Agro Wholesale Enterprises"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* Contact Person */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* Business Type */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Business Operation Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      >
                        <option value="WHOLESALER">Mandi Wholesaler / Commission Agent</option>
                        <option value="RETAILER">Supermarket / Retail Grocery Chain</option>
                        <option value="PROCESSOR">Food Processing & Milling Mill</option>
                        <option value="EXPORTER">Agricultural Commodity Exporter</option>
                        <option value="INSTITUTION">HORECA / Restaurant Chain</option>
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Official Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. procurement@krishnaagro.com"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Contact Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* GSTIN */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        GSTIN Number <span className="text-neutral-400 font-normal">(Optional for Input Credit)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 36AAAAA0000A1Z5"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-black focus:outline-none focus:border-black uppercase"
                      />
                    </div>

                    {/* Procurement Volume */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        Monthly Procurement Volume
                      </label>
                      <select
                        value={procurementVolume}
                        onChange={(e) => setProcurementVolume(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      >
                        <option value="1 - 10 MT/month">1 - 10 Metric Tonnes/month</option>
                        <option value="10 - 50 MT/month">10 - 50 Metric Tonnes/month</option>
                        <option value="50 - 200 MT/month">50 - 200 Metric Tonnes/month</option>
                        <option value="200+ MT/month">200+ Metric Tonnes/month (Bulk Industrial)</option>
                      </select>
                    </div>

                    {/* City / Mandi */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        City / Primary Mandi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Guntur"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block font-bold text-neutral-800 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Andhra Pradesh"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* Account Password if not logged in */}
                    {!user && (
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-neutral-800 mb-1">
                          Account Password <span className="text-red-500">*</span>{' '}
                          <span className="text-neutral-400 font-normal">(Min 6 characters to log into your portal)</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create secure password"
                          className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl font-medium text-black focus:outline-none focus:border-black"
                        />
                      </div>
                    )}
                  </div>

                  {/* Plan Price & GST Calculation Box */}
                  <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 space-y-2 text-xs">
                    <div className="flex justify-between font-semibold text-neutral-700">
                      <span>Plan Subscription Fee:</span>
                      <span>₹{selectedPlanForBuy.priceMonthly.toLocaleString('en-IN')}/mo</span>
                    </div>
                    {selectedPlanForBuy.priceMonthly > 0 && (
                      <div className="flex justify-between text-neutral-500 text-[11px]">
                        <span>GST @ 18% (SAC 998311 - SaaS Services):</span>
                        <span>₹{Math.round(selectedPlanForBuy.priceMonthly * 0.18).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-black pt-2 border-t border-neutral-200 text-sm">
                      <span>Total Invoice Amount:</span>
                      <span className="text-agri-orange-600">
                        ₹{(selectedPlanForBuy.priceMonthly + Math.round(selectedPlanForBuy.priceMonthly * 0.18)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 pt-1">
                      Platform fee on fulfilled produce trades: <strong>{selectedPlanForBuy.transactionFeePercentage}%</strong>. Farmers list and sell 100% free.
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      disabled={submitting}
                      className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Activating Subscription...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Confirm & Activate {selectedPlanForBuy.name}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
