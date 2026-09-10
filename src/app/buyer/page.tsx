'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Plus,
  Layers,
  FileText,
  Truck,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Send,
  Sparkles,
  Scale,
  RefreshCw,
  Search,
  Check,
  Edit3,
} from 'lucide-react';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import { IBuyerRequirement, IProduceListing, IMatch, IQuotation, IOrder } from '@/types';
import UserProfileManager from '@/components/UserProfileManager';

type TabType = 'overview' | 'requirements' | 'suppliers' | 'matches' | 'quotations' | 'orders' | 'profile';

export default function BuyerDashboard() {
  const { user, token, role, demoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [requirements, setRequirements] = useState<IBuyerRequirement[]>([]);
  const [suppliersListings, setSuppliersListings] = useState<IProduceListing[]>([]);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);

  // Modals & Actions
  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showRequestQuoteModal, setShowRequestQuoteModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<IQuotation | null>(null);
  const [selectedListingForQuote, setSelectedListingForQuote] = useState<IProduceListing | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterNotes, setCounterNotes] = useState('');
  const [recalculatingMatch, setRecalculatingMatch] = useState<string | null>(null);

  // New Requirement Form
  const [newReq, setNewReq] = useState({
    product: 'Tomato',
    variety: 'Vaishnavi Hybrid',
    requiredQuantity: 2000,
    unit: 'kg',
    qualityGrade: 'Grade A',
    targetPricePerUnit: 28,
    deliveryLocation: 'Vijayawada, AP',
    requiredDeliveryDate: '2026-09-15',
    notes: 'Urgent institutional procurement for daily distribution across supermarket outlets.',
  });

  const handleExploreMatches = async (reqId?: string) => {
    if (!token) return;
    setRecalculatingMatch(reqId || 'all');
    try {
      const payload = reqId ? { requirementId: reqId } : { buyerId: user?._id };
      await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      await fetchData();
      setActiveTab('matches');
    } catch (err) {
      console.error('Error recalculating matches:', err);
      setActiveTab('matches');
    } finally {
      setRecalculatingMatch(null);
    }
  };

  const fetchData = async () => {
    if (!token && !user) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const matchesUrl = user?._id ? `/api/matches?buyerId=${user._id}` : '/api/matches';

      const [resReqs, resListings, resMatches, resQuotes, resOrders] = await Promise.all([
        fetch(`/api/requirements?buyerId=${user?._id || ''}`, { headers }),
        fetch('/api/produce?status=AVAILABLE', { headers }),
        fetch(matchesUrl, { headers }),
        fetch('/api/quotations', { headers }),
        fetch('/api/orders', { headers }),
      ]);

      const [dataReqs, dataListings, dataMatches, dataQuotes, dataOrders] = await Promise.all([
        resReqs.json(),
        resListings.json(),
        resMatches.json(),
        resQuotes.json(),
        resOrders.json(),
      ]);

      if (dataReqs.success) setRequirements(dataReqs.data || []);
      if (dataListings.success) setSuppliersListings(dataListings.data || []);
      if (dataMatches.success) setMatches(dataMatches.data || []);
      if (dataQuotes.success) setQuotations(dataQuotes.data || []);
      if (dataOrders.success) setOrders(dataOrders.data || []);
    } catch (err) {
      console.error('Error fetching buyer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['overview', 'requirements', 'suppliers', 'matches', 'quotations', 'orders', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
    }

    if (user && token && (user.role === 'BUYER' || user.role === 'ADMIN')) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReq),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddReqModal(false);
        setActiveTab('matches');
        fetchData();
      } else {
        alert('Failed to submit requirement: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRequestQuoteFromListing = async (listing: IProduceListing) => {
    if (!token || !user) return;
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierId: listing.farmerId,
          product: listing.product,
          quantity: listing.availableQuantity,
          unit: listing.unit,
          qualityGrade: listing.qualityGrade,
          initialPrice: listing.expectedPricePerUnit,
          deliveryLocation: user.location || 'Vijayawada Central Hub',
          deliveryDate: listing.availableFromDate,
          notes: 'Quotation request initiated from smart matching discovery.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Quotation requested from ${listing.farmerName}! Check the Quotations tab.`);
        setActiveTab('quotations');
        fetchData();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation || !token) return;

    try {
      const res = await fetch(`/api/quotations/${selectedQuotation._id}/counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposedPrice: Number(counterPrice),
          notes: counterNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCounterModal(false);
        fetchData();
      } else {
        alert('Failed to submit counter offer: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAcceptQuotation = async (quotationId: string) => {
    if (!confirm('Accept this quotation? This will immediately create an official purchase order.')) return;
    try {
      const res = await fetch(`/api/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        alert('Quotation accepted! Order generated in MongoDB.');
        setActiveTab('orders');
        fetchData();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Metrics
  const openRequirements = requirements.filter((r) => r.status === 'OPEN');
  const totalDemandKg = openRequirements.reduce((sum, r) => sum + (r.requiredQuantity || 0), 0);
  const activeQuotations = quotations.filter((q) => q.status === 'REQUESTED' || q.status === 'COUNTERED');
  const ordersInTransit = orders.filter((o) => o.orderStatus === 'IN_TRANSIT');

  const isAuthorized = user && (user.role === 'BUYER' || user.role === 'ADMIN');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {!isAuthorized ? (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-neutral-200 shadow-xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7 text-agri-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black">Buyer Portal Access Required</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Please sign in with your verified institutional procurement account to define demand, access smart supplier matching, and execute purchase orders.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/login?role=BUYER"
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                Sign In to Procurement Account <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-neutral-100 px-3 py-1 rounded-full border border-neutral-300 mb-2">
                <Building2 className="w-3.5 h-3.5" /> Institutional Procurement Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black">
                {user?.name}
              </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {(user as any)?.organizationName || (user?.organizationId as any)?.name || 'Wholesale Sourcing Hub'} • {user?.location || 'Vijayawada Central Distribution Center'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="p-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-300 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-agri-orange-500" /> Edit Profile
            </button>
            <button
              onClick={() => setShowAddReqModal(true)}
              className="px-4 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Post Procurement Requirement
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto py-3 text-xs font-bold">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'requirements', label: `My Requirements (${requirements.length})`, icon: Layers },
            { id: 'suppliers', label: `Find Suppliers (${suppliersListings.length})`, icon: Search },
            { id: 'matches', label: `Smart Matches (${matches.length})`, icon: Sparkles },
            { id: 'quotations', label: `Quotations (${quotations.length})`, icon: FileText },
            { id: 'orders', label: `Orders (${orders.length})`, icon: Truck },
            { id: 'profile', label: 'Buyer Profile', icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="py-6 space-y-8">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                  Open Procurement Requests
                </span>
                <div className="text-3xl font-black text-black mt-2">
                  {openRequirements.length}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Active market requests</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-agri-orange-600 uppercase tracking-wide">
                  Target Procurement Volume
                </span>
                <div className="text-3xl font-black text-agri-orange-500 mt-2">
                  {formatQuantity(totalDemandKg)}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Needed across retail branches</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                  Active Quotations
                </span>
                <div className="text-3xl font-black text-black mt-2">
                  {activeQuotations.length}
                </div>
                <div className="text-xs text-neutral-400 mt-1">In active price negotiation</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                  Orders In Transit
                </span>
                <div className="text-3xl font-black text-black mt-2">
                  {ordersInTransit.length}
                </div>
                <div className="text-xs text-neutral-400 mt-1">En-route to distribution hub</div>
              </div>
            </div>

            {/* Dynamic Sourcing & Matching Spotlight */}
            {matches.length > 0 ? (
              <div className="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-black px-3 py-1 rounded-full border border-neutral-800">
                    <Sparkles className="w-3 h-3 text-agri-orange-500" /> Algorithmic Supply Matching Engine
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {matches.length} Supply Matching Opportunities Identified
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    AgriLink has matched your active procurement criteria with verified farmer supply lots and aggregated cooperative bundles across Andhra Pradesh.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('matches')}
                  className="px-6 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-agri-orange-500/20 transition-all shrink-0"
                >
                  Inspect Matches ({matches.length}) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : openRequirements.length === 0 ? (
              <div className="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-black px-3 py-1 rounded-full border border-neutral-800">
                    <Sparkles className="w-3 h-3 text-agri-orange-500" /> Institutional Sourcing
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Post Your Crop Demand to Source Directly from Agricultural Producers
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Define target volume, quality grade, and delivery hub. AgriLink's deterministic matching engine automatically aggregates smallholder farmers to satisfy bulk institutional requirements.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddReqModal(true)}
                  className="px-6 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-agri-orange-500/20 transition-all shrink-0"
                >
                  + Post First Requirement <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-black px-3 py-1 rounded-full border border-neutral-800">
                    <Sparkles className="w-3 h-3 text-agri-orange-500" /> Direct Producer Catalog
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {suppliersListings.length} Active Farmer Lots Available on Exchange
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Explore verified farm lots, filter by quality grade and district, and initiate price quotation requests directly with producers.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('suppliers')}
                  className="px-6 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-agri-orange-500/20 transition-all shrink-0"
                >
                  Browse Farmer Supply ({suppliersListings.length}) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Current Open Requirements */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                  Open Procurement Requirements
                </h3>
                <button
                  onClick={() => setShowAddReqModal(true)}
                  className="text-xs font-semibold text-agri-orange-600 hover:underline flex items-center gap-1"
                >
                  Post New Requirement <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Target Volume</th>
                      <th className="pb-3">Target Price</th>
                      <th className="pb-3">Delivery Hub</th>
                      <th className="pb-3">Delivery Date</th>
                      <th className="pb-3">Matches Found</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {requirements.map((req) => (
                      <tr key={req._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3.5 font-bold text-black">
                          {req.product} ({req.qualityGrade})
                        </td>
                        <td className="py-3.5 font-medium">{formatQuantity(req.requiredQuantity)}</td>
                        <td className="py-3.5 font-black text-black">₹{req.targetPricePerUnit}/kg</td>
                        <td className="py-3.5 text-neutral-600">{req.deliveryLocation}</td>
                        <td className="py-3.5 text-neutral-600">{formatDate(req.requiredDeliveryDate)}</td>
                        <td className="py-3.5">
                          <button
                            onClick={() => setActiveTab('matches')}
                            className="inline-flex items-center gap-1 text-agri-orange-600 font-bold hover:underline"
                          >
                            <Sparkles className="w-3 h-3" /> View Matches
                          </button>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY REQUIREMENTS */}
        {activeTab === 'requirements' && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-black">Procurement Demands</h2>
                <p className="text-xs text-neutral-500">
                  Manage active volume requirements, quality specifications, and pricing boundaries.
                </p>
              </div>
              <button
                onClick={() => setShowAddReqModal(true)}
                className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Requirement
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((req) => (
                <div
                  key={req._id}
                  className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Requirement #{req._id?.slice(-5)}
                      </span>
                      <h3 className="text-lg font-black text-black">{req.product}</h3>
                      {req.variety && <div className="text-xs text-neutral-500">{req.variety}</div>}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-300">
                      {req.qualityGrade}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl text-xs">
                    <div>
                      <span className="text-neutral-500">Target Volume:</span>
                      <div className="font-extrabold text-black">{formatQuantity(req.requiredQuantity)}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">Target Price:</span>
                      <div className="font-extrabold text-agri-orange-600">₹{req.targetPricePerUnit} / kg</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">Delivery Hub:</span>
                      <div className="font-medium text-black">{req.deliveryLocation}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">Target Date:</span>
                      <div className="font-medium text-black">{formatDate(req.requiredDeliveryDate)}</div>
                    </div>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-neutral-600 italic">
                      "{req.notes}"
                    </p>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleExploreMatches(req._id)}
                      disabled={recalculatingMatch === req._id}
                      className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-agri-orange-500 ${recalculatingMatch === req._id ? 'animate-spin' : ''}`} />
                      {recalculatingMatch === req._id ? 'Evaluating Produce Lots...' : 'Explore Matches'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FIND SUPPLIERS */}
        {activeTab === 'suppliers' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Available Producer Supply Lots</h2>
              <p className="text-xs text-neutral-500">
                Verified farm inventory ready for direct quotation or contract procurement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliersListings.map((listing) => (
                <div
                  key={listing._id}
                  className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          {listing.farmerName}
                        </span>
                        <h3 className="font-extrabold text-base text-black">{listing.product}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-200">
                        {listing.qualityGrade}
                      </span>
                    </div>

                    <div className="space-y-2 py-3 border-t border-b border-neutral-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Available Quantity:</span>
                        <span className="font-extrabold text-black">
                          {formatQuantity(listing.availableQuantity)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Expected Price:</span>
                        <span className="font-extrabold text-agri-orange-600">
                          ₹{listing.expectedPricePerUnit} / kg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Location:</span>
                        <span className="font-medium text-black">{listing.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Available Date:</span>
                        <span className="font-medium text-black">
                          {formatDate(listing.availableFromDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <button
                      onClick={() => handleRequestQuoteFromListing(listing)}
                      className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> Request Quotation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SMART MATCHES (CRITICAL DEMO FEATURE) */}
        {activeTab === 'matches' && (
          <div className="py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Deterministic 6-Factor Matching Engine
                </div>
                <h2 className="text-xl font-black text-black">
                  Procurement Matches & Multi-Farmer Aggregation
                </h2>
                <p className="text-xs text-neutral-500">
                  Fuzzy & normalized compatibility scoring across product (30%), quantity (20%), quality (15%), location (15%), date (10%), and price (10%).
                </p>
              </div>

              <button
                onClick={() => handleExploreMatches()}
                disabled={recalculatingMatch !== null}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors self-start sm:self-auto disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculatingMatch !== null ? 'animate-spin text-agri-orange-500' : 'text-agri-orange-500'}`} />
                <span>{recalculatingMatch !== null ? 'Scanning Farm Network...' : 'Recalculate Matches'}</span>
              </button>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-neutral-200 p-8 space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-agri-orange-50 text-agri-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-black">No Active Matches Found</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                    Either no farmer produce currently matches your open requirements, or listings were added recently. Click below to re-scan the farm supply network.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleExploreMatches()}
                    disabled={recalculatingMatch !== null}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${recalculatingMatch !== null ? 'animate-spin' : ''}`} />
                    Re-scan Farm Supply Network
                  </button>
                  <button
                    onClick={() => setShowAddReqModal(true)}
                    className="px-5 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Post Requirement
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {matches.map((m, idx) => {
                  const isAggregated = m.matchType === 'AGGREGATED_SUPPLY';
                  const reqObj = typeof m.requirementId === 'object' && m.requirementId ? (m.requirementId as any) : null;
                  const reqProd = reqObj?.product || 'Produce';

                  return (
                    <div
                      key={m._id || idx}
                      className={`p-6 rounded-3xl border transition-all ${
                        isAggregated
                          ? 'bg-black text-white border-neutral-800 shadow-2xl ring-2 ring-agri-orange-500/50'
                          : 'bg-white text-black border-neutral-200 shadow-sm'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-200/20 gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                isAggregated
                                  ? 'bg-agri-orange-500 text-white'
                                  : 'bg-neutral-100 text-black border border-neutral-300'
                              }`}
                            >
                              {isAggregated ? '★ Multi-Supplier Aggregation Bundle' : 'Single Supplier Lot'}
                            </span>
                            <span className="text-xs text-neutral-400">
                              Requirement: <strong className={isAggregated ? 'text-white' : 'text-black'}>{reqProd}</strong> • Fulfillment: {m.isFullyFulfilled ? '100% Target Met' : 'Partial'}
                            </span>
                          </div>
                          <h3 className="text-lg font-black mt-1">
                            {isAggregated
                              ? `Consolidated ${formatQuantity(m.matchedQuantity)} Collective Supply Pool (${m.suppliers.length} Producers)`
                              : `${m.suppliers[0]?.farmerName} — ${formatQuantity(m.matchedQuantity)}`}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-neutral-400">Explainable Match Score</div>
                            <div
                              className={`text-3xl font-black ${
                                isAggregated ? 'text-agri-orange-400' : 'text-agri-orange-600'
                              }`}
                            >
                              {m.totalScore}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Participating Suppliers Breakdown */}
                      <div className="py-4">
                        <h4
                          className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                            isAggregated ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          Participating Suppliers in this Match:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {m.suppliers.map((sup, sIdx) => (
                            <div
                              key={sIdx}
                              className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                                isAggregated
                                  ? 'bg-neutral-900 border border-neutral-800'
                                  : 'bg-neutral-50 border border-neutral-200'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span>{sup.farmerName}</span>
                                <span className="text-agri-orange-500">{sup.allocatedQuantity} kg</span>
                              </div>
                              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                                <span>Grade: {sup.qualityGrade}</span>
                                <span>₹{sup.expectedPrice}/kg</span>
                              </div>
                              <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-agri-orange-500" /> {sup.location}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Cumulative Total Highlight for Aggregated Match */}
                        {isAggregated && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-neutral-950 border border-agri-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                            <div>
                              <span className="text-neutral-400">Total Bundled Quantity:</span>
                              <div className="text-sm sm:text-base font-black text-white">
                                {m.suppliers.map((s, idx) => (
                                  <span key={idx}>
                                    {idx > 0 ? ' + ' : ''}
                                    {s.allocatedQuantity} kg ({s.farmerName})
                                  </span>
                                ))} ={' '}
                                <span className="text-agri-orange-400">
                                  {m.matchedQuantity} kg ({m.isFullyFulfilled ? '100% Target' : 'Partial Match'})
                                </span>
                              </div>
                            </div>
                            <div className="sm:text-right">
                              <span className="text-neutral-400 text-[11px]">Harmonized Avg:</span>
                              <div className="font-bold text-white">
                                ₹
                                {(
                                  m.suppliers.reduce((sum, s) => sum + (s.expectedPrice || 0) * (s.allocatedQuantity || 0), 0) /
                                  (m.matchedQuantity || 1)
                                ).toFixed(1)}{' '}
                                / kg
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 6-Factor Compatibility Breakdown */}
                      <div className="py-3 border-t border-b border-neutral-200/20 text-xs">
                        <h4
                          className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                            isAggregated ? 'text-neutral-300' : 'text-neutral-500'
                          }`}
                        >
                          Transparent Match Factor Breakdown:
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
                          <div
                            className={`p-2.5 rounded-xl ${
                              isAggregated ? 'bg-neutral-900' : 'bg-neutral-50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-400 block">Product (Max 30)</span>
                            <span className="font-black text-sm text-agri-orange-500">
                              {m.compatibilityBreakdown?.productScore || 30}/30
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl ${
                              isAggregated ? 'bg-neutral-900' : 'bg-neutral-50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-400 block">Quantity (Max 20)</span>
                            <span className="font-black text-sm text-agri-orange-500">
                              {m.compatibilityBreakdown?.quantityScore || 20}/20
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl ${
                              isAggregated ? 'bg-neutral-900' : 'bg-neutral-50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-400 block">Quality (Max 15)</span>
                            <span className="font-black text-sm text-agri-orange-500">
                              {m.compatibilityBreakdown?.qualityScore || 15}/15
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl ${
                              isAggregated ? 'bg-neutral-900' : 'bg-neutral-50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-400 block">Location (Max 15)</span>
                            <span className="font-black text-sm text-agri-orange-500">
                              {m.compatibilityBreakdown?.locationScore || 15}/15
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl ${
                              isAggregated ? 'bg-neutral-900' : 'bg-neutral-50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-400 block">Date (Max 10)</span>
                            <span className="font-black text-sm text-agri-orange-500">
                              {m.compatibilityBreakdown?.dateScore || 10}/10
                            </span>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl ${
                              isAggregated ? 'bg-neutral-900' : 'bg-neutral-50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-400 block">Price (Max 10)</span>
                            <span className="font-black text-sm text-agri-orange-500">
                              {m.compatibilityBreakdown?.priceScore || 10}/10
                            </span>
                          </div>
                        </div>

                        {m.compatibilityBreakdown?.explanation && (
                          <div className={`mt-3 p-3 rounded-xl border text-[11px] space-y-1 ${
                            isAggregated ? 'bg-neutral-900 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                          }`}>
                            <div className="font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-agri-orange-500" />
                              <span className={isAggregated ? 'text-white' : 'text-black'}>Commodity Match: {m.compatibilityBreakdown.explanation.product}</span>
                            </div>
                            <div>
                              Quantity: {m.compatibilityBreakdown.explanation.quantity} • Proximity: {m.compatibilityBreakdown.explanation.location}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                          onClick={async () => {
                            const primarySup = m.suppliers[0];
                            if (!primarySup || !token) return;
                            try {
                              const res = await fetch('/api/quotations', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  requirementId: typeof m.requirementId === 'object' ? (m.requirementId as any)?._id : m.requirementId,
                                  supplierId: primarySup.farmerId,
                                  product: `${reqProd} (${primarySup.qualityGrade})`,
                                  quantity: m.matchedQuantity,
                                  unit: 'kg',
                                  qualityGrade: primarySup.qualityGrade,
                                  initialPrice: primarySup.expectedPrice,
                                  deliveryLocation: reqObj?.deliveryLocation || user?.location || 'Vijayawada, AP',
                                  deliveryDate: reqObj?.requiredDeliveryDate ? new Date(reqObj.requiredDeliveryDate) : new Date(Date.now() + 7 * 86400000),
                                  notes: isAggregated
                                    ? `Multi-farmer aggregation quotation request for ${reqProd} (${m.matchedQuantity} kg).`
                                    : `Single farmer quotation initiated from smart match for ${reqProd}.`,
                                }),
                              });
                              const data = await res.json();
                              if (data.success) {
                                alert('Quotation requested! Check Quotations tab.');
                                setActiveTab('quotations');
                                fetchData();
                              } else {
                                alert(data.error || 'Failed to request quotation');
                              }
                            } catch (e: any) {
                              alert(e.message);
                            }
                          }}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            isAggregated
                              ? 'bg-agri-orange-500 hover:bg-agri-orange-600 text-white shadow-lg shadow-agri-orange-500/30'
                              : 'bg-black hover:bg-neutral-800 text-white'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {isAggregated ? 'Request Aggregated Quotation' : 'Request Supplier Quotation'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: QUOTATIONS & NEGOTIATION */}
        {activeTab === 'quotations' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Active Commercial Quotations & Negotiation</h2>
              <p className="text-xs text-neutral-500">
                Submit structured counter-offers or accept binding price terms.
              </p>
            </div>

            <div className="space-y-4">
              {quotations.map((q) => (
                <div
                  key={q._id}
                  className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">{q.quotationNumber}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === 'ACCEPTED'
                              ? 'bg-black text-white'
                              : q.status === 'COUNTERED'
                              ? 'bg-agri-orange-500 text-white'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-black mt-1">
                        {q.product} — {formatQuantity(q.quantity)} ({q.qualityGrade})
                      </h3>
                      <div className="text-xs text-neutral-500">Supplier: {q.supplierName}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-400">Current Agreed Settlement Price:</span>
                      <div className="text-2xl font-black text-agri-orange-600">
                        ₹{q.currentAgreedPrice} / kg
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Total Value: {formatCurrency(q.quantity * q.currentAgreedPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Negotiation Stream */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Structured Negotiation History
                    </h4>
                    <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                      {q.counterHistory?.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start justify-between text-xs py-1.5 border-b border-neutral-200/60 last:border-0"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                step.senderRole === 'BUYER'
                                  ? 'bg-agri-orange-500 text-white'
                                  : 'bg-neutral-900 text-white'
                              }`}
                            >
                              {step.senderRole}: {step.senderName}
                            </span>
                            <span className="text-neutral-700">{step.notes}</span>
                          </div>
                          <div className="font-extrabold text-black shrink-0 ml-2">
                            ₹{step.proposedPrice} / kg
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    {q.status !== 'ACCEPTED' && q.status !== 'REJECTED' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedQuotation(q);
                            setCounterPrice(q.currentAgreedPrice);
                            setShowCounterModal(true);
                          }}
                          className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-black font-bold rounded-xl text-xs transition-colors"
                        >
                          Submit Counter-Offer
                        </button>
                        <button
                          onClick={() => handleAcceptQuotation(q._id!)}
                          className="px-5 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                        >
                          Accept Quotation & Generate Order
                        </button>
                      </>
                    )}
                    {q.status === 'ACCEPTED' && (
                      <span className="text-xs font-bold text-black flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-agri-orange-500" /> Contract Signed & Order Created
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ORDERS & FULFILLMENT VISIBILITY */}
        {activeTab === 'orders' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Active Purchase Orders & Live Fulfillment</h2>
              <p className="text-xs text-neutral-500">
                End-to-end milestone traceability from farm sorting to distribution center arrival.
              </p>
            </div>

            <div className="space-y-6">
              {orders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">{ord.orderNumber}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black text-white">
                          {ord.orderStatus}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-black mt-1">
                        {ord.items[0]?.product} — {formatQuantity(ord.totalQuantity)}
                      </h3>
                      <div className="text-xs text-neutral-500">
                        Delivery Hub: {ord.deliveryLocation}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-400">Total Purchase Value:</span>
                      <div className="text-2xl font-black text-black">
                        {formatCurrency(ord.totalValue)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Target Date: {formatDate(ord.deliveryDate)}
                      </div>
                    </div>
                  </div>

                  {/* 6-Stage Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                      Supply Chain Fulfillment Progress
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { stage: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
                        { stage: 'PRODUCE_PREPARED', label: 'Produce Prepared' },
                        { stage: 'QUALITY_VERIFIED', label: 'Quality Verified' },
                        { stage: 'PACKED', label: 'Packed' },
                        { stage: 'IN_TRANSIT', label: 'In Transit' },
                        { stage: 'DELIVERED', label: 'Delivered' },
                      ].map((stg, sIdx) => {
                        const stageOrder = [
                          'ORDER_CONFIRMED',
                          'PRODUCE_PREPARED',
                          'QUALITY_VERIFIED',
                          'PACKED',
                          'IN_TRANSIT',
                          'DELIVERED',
                        ];
                        const curIdx = stageOrder.indexOf(ord.currentFulfillmentStage);
                        const isDone = sIdx <= curIdx;
                        const isCurrent = sIdx === curIdx;

                        return (
                          <div
                            key={stg.stage}
                            className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 ${
                              isCurrent
                                ? 'bg-agri-orange-50 border-agri-orange-500 text-agri-orange-600'
                                : isDone
                                ? 'bg-neutral-50 border-neutral-300 text-black'
                                : 'bg-white border-neutral-100 text-neutral-300'
                            }`}
                          >
                            <span className="text-[10px] font-extrabold">{sIdx + 1}.</span>
                            <span className="text-xs font-bold leading-tight">{stg.label}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isCurrent
                                  ? 'bg-agri-orange-500 text-white'
                                  : isDone
                                  ? 'bg-black text-white'
                                  : 'text-neutral-400'
                              }`}
                            >
                              {isCurrent ? 'Current' : isDone ? 'Done' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === 'profile' && (
          <div className="py-6">
            <UserProfileManager role="BUYER" />
          </div>
        )}
      </div>
    )}

      {/* CREATE REQUIREMENT MODAL */}
      {showAddReqModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-base text-black">Post Procurement Requirement</h3>
              <button
                onClick={() => setShowAddReqModal(false)}
                className="text-neutral-400 hover:text-black text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRequirement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Target Product</label>
                <input
                  type="text"
                  required
                  value={newReq.product}
                  onChange={(e) => setNewReq({ ...newReq, product: e.target.value })}
                  placeholder="e.g. Tomato"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Required Quantity (kg)</label>
                  <input
                    type="number"
                    required
                    value={newReq.requiredQuantity}
                    onChange={(e) => setNewReq({ ...newReq, requiredQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Required Grade</label>
                  <select
                    value={newReq.qualityGrade}
                    onChange={(e) => setNewReq({ ...newReq, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  >
                    <option value="Grade A">Grade A (Premium Retail)</option>
                    <option value="Grade B">Grade B (Standard Market)</option>
                    <option value="Grade C">Grade C (Industrial / Pulp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Target Price (₹/kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newReq.targetPricePerUnit}
                    onChange={(e) => setNewReq({ ...newReq, targetPricePerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={newReq.requiredDeliveryDate}
                    onChange={(e) => setNewReq({ ...newReq, requiredDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Delivery Location / Hub</label>
                <input
                  type="text"
                  required
                  value={newReq.deliveryLocation}
                  onChange={(e) => setNewReq({ ...newReq, deliveryLocation: e.target.value })}
                  placeholder="e.g. Vijayawada, AP"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Procurement Notes / Specs</label>
                <textarea
                  rows={2}
                  value={newReq.notes}
                  onChange={(e) => setNewReq({ ...newReq, notes: e.target.value })}
                  placeholder="e.g. Uniform grading, crates to be weighed on arrival."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReqModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl font-bold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Post & Run Matching
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTER OFFER MODAL */}
      {showCounterModal && selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-base text-black">
                Counter-Offer for {selectedQuotation.product}
              </h3>
              <button
                onClick={() => setShowCounterModal(false)}
                className="text-neutral-400 hover:text-black text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterOffer} className="space-y-3 text-xs">
              <div className="bg-neutral-50 p-3 rounded-xl">
                <div className="text-neutral-500">Current Proposed Price:</div>
                <div className="text-lg font-black text-black">
                  ₹{selectedQuotation.currentAgreedPrice} / kg
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Your Counter Price (₹ / kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Buyer Negotiation Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="e.g. Willing to raise offer to ₹26/kg for guaranteed crate packaging."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl font-bold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Transmit Counter-Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
