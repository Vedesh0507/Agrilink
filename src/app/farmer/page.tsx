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
} from 'lucide-react';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import { IProduceListing, IQuotation, IOrder, IBuyerRequirement, IMatch } from '@/types';

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
  const [counterNotes, setCounterNotes] = useState('');

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
    if (!user) {
      // Auto switch to Farmer A for seamless presentation if guest
      demoLogin('FARMER');
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchData();
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agri-orange-600 bg-agri-orange-50 px-3 py-1 rounded-full border border-agri-orange-200 mb-2">
              <Wheat className="w-3.5 h-3.5" /> Producer & Farmer Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black">
              {user?.name || 'Farmer Dashboard'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {user?.location || 'Vijayawada Region'} • Krishna River Farmers Collective
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
              onClick={() => setShowAddProduceModal(true)}
              className="px-4 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Produce Lot
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto py-3 text-xs font-bold">
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

            {/* Quick Demo Scenario Alert */}
            <div className="p-5 rounded-2xl bg-black text-white border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-agri-orange-400 bg-neutral-900 px-2.5 py-1 rounded-full">
                  Primary Hackathon Workflow Demo
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  Farmer A: 500 kg Grade-A Tomato Lot Committed to Aggregated Pool
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                  Your 500 kg lot is combined with Farmer B (700 kg) and Farmer C (800 kg) to satisfy Godavari Fresh Foods' 2,000 kg procurement order in Vijayawada!
                </p>
              </div>
              <button
                onClick={() => setActiveTab('quotations')}
                className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
              >
                Review Negotiation
              </button>
            </div>

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
              {requirements.map((req) => (
                <div
                  key={req._id}
                  className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-agri-orange-600 uppercase tracking-wider">
                        Procurement Order Request
                      </span>
                      <h3 className="text-base font-extrabold text-black">
                        {req.product} ({req.qualityGrade})
                      </h3>
                      <div className="text-xs text-neutral-500">{req.buyerName}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-200">
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-neutral-50 p-3 rounded-xl">
                    <div>
                      <span className="text-neutral-500">Required Quantity:</span>
                      <div className="font-extrabold text-black">{formatQuantity(req.requiredQuantity)}</div>
                    </div>
                    <div>
                      <span className="text-neutral-500">Target Budget:</span>
                      <div className="font-extrabold text-agri-orange-600">₹{req.targetPricePerUnit} / kg</div>
                    </div>
                    <div className="mt-1">
                      <span className="text-neutral-500">Delivery Hub:</span>
                      <div className="font-medium text-black">{req.deliveryLocation}</div>
                    </div>
                    <div className="mt-1">
                      <span className="text-neutral-500">Target Date:</span>
                      <div className="font-medium text-black">{formatDate(req.requiredDeliveryDate)}</div>
                    </div>
                  </div>

                  {req.notes && (
                    <p className="text-[11px] text-neutral-600 italic">
                      "{req.notes}"
                    </p>
                  )}
                </div>
              ))}
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
          <div className="py-6 max-w-xl">
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-black">Producer Verification Details</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-neutral-500">Producer Name:</span>
                  <div className="font-bold text-black text-sm">{user?.name}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Contact Email:</span>
                  <div className="font-bold text-black text-sm">{user?.email}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Registered Agricultural Hub:</span>
                  <div className="font-bold text-black text-sm">{user?.location}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Collective Affiliation:</span>
                  <div className="font-bold text-black text-sm">Krishna River Farmers Collective (Verified)</div>
                </div>
                <div>
                  <span className="text-neutral-500">Platform Identity:</span>
                  <div className="font-mono text-neutral-600 text-[11px]">{user?.firebaseUid}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      <Footer />
    </div>
  );
}
