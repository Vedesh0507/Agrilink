'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  Wheat,
  Plus,
  Package,
  Layers,
  FileText,
  Truck,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Send,
  Check,
  RefreshCw,
  Edit3,
  Phone,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import { IProduceListing, IQuotation, IOrder, IBuyerRequirement, IMatch } from '@/types';
import UserProfileManager from '@/components/UserProfileManager';

type TabType = 'overview' | 'produce' | 'requirements' | 'matches' | 'quotations' | 'orders' | 'profile';

export default function FarmerDashboard() {
  const { user, token, role, demoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [listings, setListings] = useState<IProduceListing[]>([]);
  const [requirements, setRequirements] = useState<IBuyerRequirement[]>([]);
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);

  // Modals
  const [showAddProduceModal, setShowAddProduceModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<IQuotation | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [counterNotes, setCounterNotes] = useState<string>('');
  // Direct Supply Offer Modal State (Farmer directly offering to Buyer)
  const [showSupplyOfferModal, setShowSupplyOfferModal] = useState(false);
  const [selectedReqForOffer, setSelectedReqForOffer] = useState<any | null>(null);
  const [offerQuantity, setOfferQuantity] = useState<number>(0);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [offerQualityGrade, setOfferQualityGrade] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade A');
  const [offerDate, setOfferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [offerNotes, setOfferNotes] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const handleOpenSupplyOffer = (req: any) => {
    setSelectedReqForOffer(req);
    setOfferQuantity(req.requiredQuantity || 500);
    setOfferPrice(req.targetPricePerUnit || 30);
    setOfferQualityGrade(req.qualityGrade || 'Grade A');
    setOfferDate(new Date().toISOString().split('T')[0]);
    setOfferNotes(`Harvest ready for direct dispatch to ${req.deliveryLocation || 'your hub'}.`);
    setShowSupplyOfferModal(true);
  };

  const handleSendSupplyOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReqForOffer) return;
    setSubmittingOffer(true);
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requirementId: selectedReqForOffer._id,
          buyerId: selectedReqForOffer.buyerId,
          product: `${selectedReqForOffer.product} (${offerQualityGrade})`,
          quantity: Number(offerQuantity),
          qualityGrade: offerQualityGrade,
          initialPrice: Number(offerPrice),
          deliveryLocation: selectedReqForOffer.deliveryLocation,
          deliveryDate: offerDate,
          notes: offerNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Supply offer sent to ${selectedReqForOffer.buyerName}! Check the Quotations tab for live negotiation updates.`);
        setShowSupplyOfferModal(false);
        setSelectedReqForOffer(null);
        await fetchData();
        setActiveTab('quotations');
      } else {
        alert(data.error || 'Failed to submit supply offer');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending supply offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Add produce form state
  const [newProduce, setNewProduce] = useState({
    product: 'Tomato',
    variety: 'Vaishnavi Hybrid',
    quantity: 500,
    unit: 'kg',
    qualityGrade: 'Grade A',
    expectedPricePerUnit: 28,
    location: user?.location || 'Vijayawada, AP',
    availableFromDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchData = async () => {
    if (!token && !user) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [resListings, resReqs, resQuotes, resOrders] = await Promise.all([
        fetch(`/api/produce?farmerId=${user?._id || ''}`, { headers }),
        fetch('/api/requirements', { headers }),
        fetch('/api/quotations', { headers }),
        fetch('/api/orders', { headers }),
      ]);

      const [dataListings, dataReqs, dataQuotes, dataOrders] = await Promise.all([
        resListings.json(),
        resReqs.json(),
        resQuotes.json(),
        resOrders.json(),
      ]);

      if (dataListings.success) setListings(dataListings.data || []);
      if (dataReqs.success) setRequirements(dataReqs.data || []);
      if (dataQuotes.success) setQuotations(dataQuotes.data || []);
      if (dataOrders.success) setOrders(dataOrders.data || []);
    } catch (err) {
      console.error('Error fetching farmer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['overview', 'produce', 'requirements', 'matches', 'quotations', 'orders', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
    }

    // Only fetch if authenticated as farmer or admin
    if (user && token && (user.role === 'FARMER' || user.role === 'ADMIN')) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const handleAddProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/produce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProduce),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProduceModal(false);
        fetchData();
      } else {
        alert('Failed to add produce: ' + data.error);
      }
    } catch (err: any) {
      alert('Error adding produce: ' + err.message);
    }
  };

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'COMMITTED' : 'AVAILABLE';
    try {
      const res = await fetch(`/api/produce/${listingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
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
        alert('Quotation accepted! Order confirmed.');
        fetchData();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleAdvanceFulfillment = async (orderId: string, currentStage: string) => {
    const stageSequence = [
      'ORDER_CONFIRMED',
      'PRODUCE_PREPARED',
      'QUALITY_VERIFIED',
      'PACKED',
      'IN_TRANSIT',
      'DELIVERED',
    ];
    const currentIndex = stageSequence.indexOf(currentStage);
    if (currentIndex >= stageSequence.length - 1) return;

    const nextStage = stageSequence[currentIndex + 1];
    try {
      const res = await fetch(`/api/orders/${orderId}/fulfillment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stage: nextStage,
          title: nextStage.replace(/_/g, ' '),
          description: `Stage marked as completed by producer ${user?.name}`,
        }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Metrics
  const activeListings = listings.filter((l) => l.status === 'AVAILABLE');
  const totalAvailableKg = activeListings.reduce((sum, l) => sum + (l.availableQuantity || 0), 0);
  const pendingQuotations = quotations.filter((q) => q.status === 'REQUESTED' || q.status === 'COUNTERED');
  const activeOrders = orders.filter((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED');

  const isAuthorized = user && (user.role === 'FARMER' || user.role === 'ADMIN');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {!isAuthorized ? (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-neutral-200 shadow-xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-600 flex items-center justify-center mx-auto">
              <Wheat className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black">Farmer Portal Access Required</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Please sign in to your verified agricultural producer account to list crops, review buyer orders, and submit quotations.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/login?role=FARMER"
                className="w-full py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                Sign In to Producer Account <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200 mb-2">
                <Wheat className="w-3.5 h-3.5" /> Producer & Farmer Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-black">
                {user?.name}
              </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {user?.location || 'Vijayawada Region'} • {(user as any)?.organizationName || (user?.organizationId as any)?.name || 'Agricultural Producer Collective'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchData()}
              className="p-2 sm:p-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-300 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-agri-orange-500" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setShowAddProduceModal(true)}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Produce Lot</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Smooth Scrollable */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-200 overflow-x-auto py-3 text-xs font-bold no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'produce', label: `My Produce (${listings.length})`, icon: Wheat },
            { id: 'requirements', label: `Buyer Requests (${requirements.length})`, icon: Layers },
            { id: 'quotations', label: `Quotations (${quotations.length})`, icon: FileText },
            { id: 'orders', label: `Orders (${orders.length})`, icon: Truck },
            { id: 'profile', label: 'Producer Profile', icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-100 bg-neutral-50/60'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
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
                  Active Listings
                </span>
                <div className="text-3xl font-black text-black mt-2">
                  {activeListings.length}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Ready for market procurement</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-agri-orange-600 uppercase tracking-wide">
                  Total Available Supply
                </span>
                <div className="text-3xl font-black text-agri-orange-500 mt-2">
                  {formatQuantity(totalAvailableKg)}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Stored & field ready</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                  Pending Quotations
                </span>
                <div className="text-3xl font-black text-black mt-2">
                  {pendingQuotations.length}
                </div>
                <div className="text-xs text-neutral-400 mt-1">Require price response</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                  Active Orders
                </span>
                <div className="text-3xl font-black text-black mt-2">
                  {activeOrders.length}
                </div>
                <div className="text-xs text-neutral-400 mt-1">In transit or preparation</div>
              </div>
            </div>

            {/* Dynamic Market Status Banner */}
            {pendingQuotations.length > 0 ? (
              <div className="p-5 rounded-2xl bg-black text-white border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-neutral-900 px-2.5 py-1 rounded-full">
                    Active Quotation Negotiation
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">
                    {pendingQuotations.length} Pending Buyer Quotation Request(s)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    Wholesale institutional buyers have submitted quotation requests for your produce lots. Review agreed prices, submit counter-offers, or accept to generate official purchase orders.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('quotations')}
                  className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Review Quotations ({pendingQuotations.length})
                </button>
              </div>
            ) : listings.length === 0 ? (
              <div className="p-5 rounded-2xl bg-black text-white border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-neutral-900 px-2.5 py-1 rounded-full">
                    Producer Market Access
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">
                    List Your Harvest Lots for Direct Institutional Procurement
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    Publish your available crop quantities, quality grades, and expected price. AgriLink will automatically index your supply for bulk institutional buyers and regional aggregation pools.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddProduceModal(true)}
                  className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  + Add First Produce Lot
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-black text-white border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-neutral-900 px-2.5 py-1 rounded-full">
                    Active Harvest Catalog
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">
                    {listings.length} Produce Lot(s) Live on AgriLink Exchange ({formatQuantity(totalAvailableKg)})
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    Your produce is currently discoverable by verified buyers, food processors, and wholesale merchants. Check Buyer Requests to propose quotations for open purchase demands.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Browse Buyer Demands ({requirements.length})
                </button>
              </div>
            )}

            {/* Recent Produce Listings Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                  Active Produce Lots
                </h3>
                <button
                  onClick={() => setActiveTab('produce')}
                  className="text-xs font-semibold text-agri-orange-600 hover:underline flex items-center gap-1"
                >
                  View All Produce <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No produce lots listed yet. Click "Add New Produce Lot" above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Available Quantity</th>
                        <th className="pb-3">Grade</th>
                        <th className="pb-3">Expected Price</th>
                        <th className="pb-3">Harvest Date</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {listings.slice(0, 5).map((l) => (
                        <tr key={l._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3.5 font-bold text-black">
                            {l.product} {l.variety && `(${l.variety})`}
                          </td>
                          <td className="py-3.5 font-medium">{formatQuantity(l.availableQuantity)}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                              {l.qualityGrade}
                            </span>
                          </td>
                          <td className="py-3.5 font-black text-black">₹{l.expectedPricePerUnit}/kg</td>
                          <td className="py-3.5 text-neutral-500">{formatDate(l.availableFromDate)}</td>
                          <td className="py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                l.status === 'AVAILABLE'
                                  ? 'bg-agri-orange-50 text-agri-orange-600 border border-agri-orange-200'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY PRODUCE */}
        {activeTab === 'produce' && (
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-black">My Agricultural Inventory</h2>
                <p className="text-xs text-neutral-500">
                  Manage lots, toggle availability, and set expected price per kg.
                </p>
              </div>
              <button
                onClick={() => setShowAddProduceModal(true)}
                className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Produce Lot
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div
                  key={l._id}
                  className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          Lot #{l._id?.slice(-5)}
                        </span>
                        <h3 className="font-extrabold text-base text-black">{l.product}</h3>
                        {l.variety && <div className="text-xs text-neutral-500">{l.variety}</div>}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-300">
                        {l.qualityGrade}
                      </span>
                    </div>

                    <div className="space-y-2 py-3 border-t border-b border-neutral-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Available:</span>
                        <span className="font-bold text-black">{formatQuantity(l.availableQuantity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Expected Price:</span>
                        <span className="font-bold text-agri-orange-600">₹{l.expectedPricePerUnit} / kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Location:</span>
                        <span className="font-medium text-black">{l.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Harvest Date:</span>
                        <span className="font-medium text-black">{formatDate(l.availableFromDate)}</span>
                      </div>
                    </div>

                    {l.description && (
                      <p className="text-[11px] text-neutral-500 italic mt-3 line-clamp-2">
                        "{l.description}"
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(l._id!, l.status)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                        l.status === 'AVAILABLE'
                          ? 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                          : 'border-agri-orange-500 text-agri-orange-600 hover:bg-agri-orange-50'
                      }`}
                    >
                      {l.status === 'AVAILABLE' ? 'Mark Committed' : 'Mark Available'}
                    </button>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === 'AVAILABLE'
                          ? 'bg-agri-orange-500 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BUYER REQUESTS */}
        {activeTab === 'requirements' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Active Market Demand (Buyer Requests)</h2>
              <p className="text-xs text-neutral-500">
                Institutional procurement requirements open for farmer participation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((req: any) => {
                const buyerPhone = req.buyerPhone || '+91 93918 17480';
                const cleanPhone = buyerPhone.replace(/[^0-9]/g, '');
                const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const waText = encodeURIComponent(
                  `Namaste ${req.buyerName}, I am a farmer on AgriLink. I saw your requirement for ${req.product} (${req.requiredQuantity} kg at ₹${req.targetPricePerUnit}/kg) and I am ready to supply.`
                );

                return (
                  <div
                    key={req._id}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-neutral-200 shadow-sm space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-extrabold text-agri-orange-600 uppercase tracking-wider bg-agri-orange-50 px-2.5 py-0.5 rounded-full border border-agri-orange-200">
                              Order Demand
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Verified Buyer
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-black">
                            {req.product} ({req.qualityGrade})
                          </h3>
                          <div className="text-xs text-neutral-600 flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="font-bold text-black">{req.buyerName}</span>
                            {req.buyerOrg && (
                              <span className="text-neutral-400">• {req.buyerOrg}</span>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-200 shrink-0">
                          {req.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-2.5 bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                        <div>
                          <span className="text-[11px] text-neutral-500">Target Volume:</span>
                          <div className="font-black text-sm text-black">{formatQuantity(req.requiredQuantity)}</div>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500">Target Budget:</span>
                          <div className="font-black text-sm text-agri-orange-600">₹{req.targetPricePerUnit} / kg</div>
                        </div>
                        <div className="mt-1">
                          <span className="text-[11px] text-neutral-500">Delivery Hub:</span>
                          <div className="font-semibold text-black flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-agri-orange-500 shrink-0" />
                            <span className="truncate">{req.deliveryLocation}</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="text-[11px] text-neutral-500">Target Date:</span>
                          <div className="font-semibold text-black flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-agri-orange-500 shrink-0" />
                            <span>{formatDate(req.requiredDeliveryDate)}</span>
                          </div>
                        </div>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-neutral-600 italic bg-neutral-50/50 p-2.5 rounded-xl border border-dashed border-neutral-200">
                          "{req.notes}"
                        </p>
                      )}
                    </div>

                    {/* Direct Contact & Quotation Actions */}
                    <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-2">
                      <div className="flex items-center gap-2">
                        {buyerPhone && (
                          <a
                            href={`tel:${buyerPhone}`}
                            className="flex-1 sm:flex-none px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            title="Call Buyer Directly"
                          >
                            <Phone className="w-3.5 h-3.5 text-agri-orange-500" />
                            <span>Call Buyer</span>
                          </a>
                        )}
                        <a
                          href={`https://wa.me/${waNumber}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
                          title="Chat with Buyer on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <button
                        onClick={() => handleOpenSupplyOffer(req)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Supply Offer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: QUOTATIONS & NEGOTIATION */}
        {activeTab === 'quotations' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Commercial Quotations & Counter-Offers</h2>
              <p className="text-xs text-neutral-500">
                Direct round-trip price negotiations with wholesale buyers.
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
                      <div className="text-xs text-neutral-500">Buyer: {q.buyerName}</div>
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

                  {/* Negotiation Counter-Offer History Stream */}
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
                                step.senderRole === 'FARMER'
                                  ? 'bg-neutral-900 text-white'
                                  : 'bg-agri-orange-500 text-white'
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

                  {/* Action Buttons */}
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
                        <CheckCircle2 className="w-4 h-4 text-agri-orange-500" /> Contract Agreed & Order Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS & FULFILLMENT VISIBILITY */}
        {activeTab === 'orders' && (
          <div className="py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-black">Active Purchase Orders & Fulfillment Milestones</h2>
              <p className="text-xs text-neutral-500">
                Track and advance real-world physical delivery stages.
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

                  {/* 6-Stage Fulfillment Timeline Bar */}
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

                  {/* Advance Stage Control */}
                  {ord.orderStatus !== 'DELIVERED' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleAdvanceFulfillment(ord._id!, ord.currentFulfillmentStage)}
                        className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors"
                      >
                        Advance to Next Fulfillment Milestone <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PRODUCER PROFILE */}
        {activeTab === 'profile' && (
          <div className="py-6">
            <UserProfileManager role="FARMER" />
          </div>
        )}
      </div>
    )}

      {/* ADD PRODUCE MODAL */}
      {showAddProduceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-base text-black">List New Agricultural Lot</h3>
              <button
                onClick={() => setShowAddProduceModal(false)}
                className="text-neutral-400 hover:text-black text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduce} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Crop / Produce</label>
                <input
                  type="text"
                  required
                  value={newProduce.product}
                  onChange={(e) => setNewProduce({ ...newProduce, product: e.target.value })}
                  placeholder="e.g. Tomato"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    required
                    value={newProduce.quantity}
                    onChange={(e) => setNewProduce({ ...newProduce, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Quality Grade</label>
                  <select
                    value={newProduce.qualityGrade}
                    onChange={(e) => setNewProduce({ ...newProduce, qualityGrade: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Processing)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Expected Price (₹/kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newProduce.expectedPricePerUnit}
                    onChange={(e) =>
                      setNewProduce({ ...newProduce, expectedPricePerUnit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Available Date</label>
                  <input
                    type="date"
                    required
                    value={newProduce.availableFromDate}
                    onChange={(e) => setNewProduce({ ...newProduce, availableFromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Location / Farm District</label>
                <input
                  type="text"
                  required
                  value={newProduce.location}
                  onChange={(e) => setNewProduce({ ...newProduce, location: e.target.value })}
                  placeholder="e.g. Vijayawada Rural, AP"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Lot Description / Notes</label>
                <textarea
                  rows={2}
                  value={newProduce.description}
                  onChange={(e) => setNewProduce({ ...newProduce, description: e.target.value })}
                  placeholder="e.g. Greenhouse cultivated, sorted in standard 20kg crates."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProduceModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl font-bold hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl font-bold shadow-sm"
                >
                  Publish Produce Lot
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
                  Commercial Justification / Terms
                </label>
                <textarea
                  rows={3}
                  required
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="e.g. Price includes cold crate packing and delivery to Vijayawada hub."
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

      {/* DIRECT SUPPLY OFFER MODAL (Farmer to Buyer) */}
      {showSupplyOfferModal && selectedReqForOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-neutral-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-extrabold text-agri-orange-600 uppercase tracking-wider bg-agri-orange-50 px-2.5 py-0.5 rounded-full border border-agri-orange-200">
                  Direct Commercial Offer
                </span>
                <h3 className="font-black text-base sm:text-lg text-black mt-1">
                  Submit Supply Offer to {selectedReqForOffer.buyerName}
                </h3>
                <p className="text-xs text-neutral-500">
                  {selectedReqForOffer.buyerOrg || 'Institutional Procurement'} • {selectedReqForOffer.deliveryLocation}
                </p>
              </div>
              <button
                onClick={() => setShowSupplyOfferModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black text-sm font-bold transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Target Demand Summary */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs space-y-1">
              <div className="flex justify-between font-bold text-black">
                <span>Requested Produce:</span>
                <span className="text-agri-orange-600">{selectedReqForOffer.product} ({selectedReqForOffer.qualityGrade})</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Target Quantity:</span>
                <span className="font-semibold text-black">{formatQuantity(selectedReqForOffer.requiredQuantity)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Target Budget:</span>
                <span className="font-semibold text-agri-orange-600">₹{selectedReqForOffer.targetPricePerUnit} / kg</span>
              </div>
            </div>

            <form onSubmit={handleSendSupplyOffer} className="space-y-3.5 text-xs">
              {/* Optional Lot Pre-fill */}
              {listings.length > 0 && (
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Auto-Fill From My Available Inventory (Optional)
                  </label>
                  <select
                    onChange={(e) => {
                      const lot = listings.find((l) => l._id === e.target.value);
                      if (lot) {
                        setOfferQuantity(Math.min(lot.availableQuantity, selectedReqForOffer.requiredQuantity));
                        setOfferPrice(lot.expectedPricePerUnit);
                        setOfferQualityGrade(lot.qualityGrade as any);
                        setOfferNotes(`Sourced directly from Lot #${lot._id?.slice(-5)} (${lot.product}, ${lot.variety || 'Standard'}). Ready for immediate shipment.`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:border-agri-orange-500"
                  >
                    <option value="">-- Select an available produce lot --</option>
                    {listings
                      .filter((l) => l.status === 'AVAILABLE')
                      .map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.product} ({l.qualityGrade}) — {l.availableQuantity} kg @ ₹{l.expectedPricePerUnit}/kg
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Supply Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Your Offer Price (₹ / kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 font-bold text-agri-orange-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={offerQualityGrade}
                    onChange={(e) => setOfferQualityGrade(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-white focus:outline-none focus:border-agri-orange-500"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Processing)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Dispatch / Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Delivery Destination / Hub
                </label>
                <input
                  type="text"
                  required
                  value={selectedReqForOffer.deliveryLocation}
                  readOnly
                  className="w-full px-3 py-2 border border-neutral-200 bg-neutral-100 rounded-xl text-neutral-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Producer Notes / Packaging Specs
                </label>
                <textarea
                  rows={2}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="e.g. Farm fresh harvest packed in standard plastic crates, pesticide-free."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowSupplyOfferModal(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl font-bold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingOffer ? 'Submitting Offer...' : 'Transmit Supply Offer'}</span>
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
