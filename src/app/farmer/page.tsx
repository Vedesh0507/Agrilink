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
  Camera,
  Sparkles,
  UploadCloud,
  X,
  ShieldCheck,
  Eye,
  HelpCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import { IProduceListing, IQuotation, IOrder, IBuyerRequirement, IMatch, IAIAssessment } from '@/types';
import UserProfileManager from '@/components/UserProfileManager';
import { useLanguage } from '@/context/LanguageContext';

type TabType = 'overview' | 'produce' | 'requirements' | 'matches' | 'quotations' | 'orders' | 'profile';

export default function FarmerDashboard() {
  const { user, token, role, demoLogin } = useAuth();
  const { t, language } = useLanguage();

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

  // Add produce form & AI analysis state
  interface UploadedProduceImage {
    mimeType: string;
    base64Data: string;
    viewType: 'FRONT' | 'SIDE' | 'CLOSEUP' | 'ADDITIONAL';
    previewUrl: string;
  }
  const [uploadedImages, setUploadedImages] = useState<UploadedProduceImage[]>([]);
  const [isAnalyzingProduce, setIsAnalyzingProduce] = useState(false);
  const [aiAssessmentResult, setAiAssessmentResult] = useState<IAIAssessment | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);
  const [farmerAcceptedAi, setFarmerAcceptedAi] = useState(false);
  const [selectedImageForPreview, setSelectedImageForPreview] = useState<string | null>(null);
  const [selectedAiReportListing, setSelectedAiReportListing] = useState<IProduceListing | null>(null);

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
      if (
        tabParam &&
        ['overview', 'produce', 'requirements', 'matches', 'quotations', 'orders', 'profile'].includes(tabParam)
      ) {
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

  const handleOpenAddProduceModal = () => {
    setUploadedImages([]);
    setAiAssessmentResult(null);
    setAiAnalysisError(null);
    setAiDisclaimer(null);
    setFarmerAcceptedAi(false);
    setNewProduce({
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
    setShowAddProduceModal(true);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    viewType: 'FRONT' | 'SIDE' | 'CLOSEUP' | 'ADDITIONAL'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      alert('Please upload a valid JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setUploadedImages((prev) => {
        const filtered = prev.filter((img) => img.viewType !== viewType);
        return [
          ...filtered,
          {
            mimeType: file.type,
            base64Data,
            viewType,
            previewUrl: base64Data,
          },
        ];
      });
      // Invalidate existing AI assessment if images are changed
      setAiAssessmentResult(null);
      setAiAnalysisError(null);
      setFarmerAcceptedAi(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (viewType: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.viewType !== viewType));
    setAiAssessmentResult(null);
    setFarmerAcceptedAi(false);
  };

  const handleRunAiAnalysis = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least 1 produce image (Front View) to run AI analysis.');
      return;
    }

    setIsAnalyzingProduce(true);
    setAiAnalysisError(null);

    try {
      const res = await fetch('/api/produce/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          images: uploadedImages.map((img) => ({
            mimeType: img.mimeType,
            base64Data: img.base64Data,
            viewType: img.viewType,
          })),
          farmerCropName: newProduce.product,
          additionalNotes: newProduce.description,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.assessment) {
        setAiAssessmentResult(data.data.assessment);
        setAiDisclaimer(data.data.disclaimer);
      } else {
        setAiAnalysisError(data.error || 'AI visual assessment could not be completed.');
      }
    } catch (err: any) {
      setAiAnalysisError(err.message || 'Network error while contacting AI vision service.');
    } finally {
      setIsAnalyzingProduce(false);
    }
  };

  const handleAcceptAiRecommendation = () => {
    if (!aiAssessmentResult) return;
    setNewProduce((prev) => ({
      ...prev,
      product: aiAssessmentResult.detectedProduce || prev.product,
      variety: aiAssessmentResult.possibleVariety || prev.variety,
      qualityGrade: aiAssessmentResult.recommendedQuality || prev.qualityGrade,
    }));
    setFarmerAcceptedAi(true);
  };

  const handleAddProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        ...newProduce,
        imageUrls: uploadedImages.map((img) => img.base64Data),
        aiAssessment: aiAssessmentResult
          ? {
              ...aiAssessmentResult,
              farmerAccepted: farmerAcceptedAi,
            }
          : undefined,
        farmerConfirmedQuality: newProduce.qualityGrade,
        farmerConfirmedProduce: newProduce.product,
      };

      const res = await fetch('/api/produce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProduceModal(false);
        setUploadedImages([]);
        setAiAssessmentResult(null);
        fetchData();
      } else {
        alert('Failed to add produce: ' + (data.error || JSON.stringify(data.details)));
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
                <Wheat className="w-3.5 h-3.5" /> {t('farmer.portalTitle')}
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
              title={t('action.refresh')}
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
              <span>{t('action.editProfile')}</span>
            </button>
            <button
              onClick={() => setShowAddProduceModal(true)}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('action.addProduce')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Smooth Scrollable */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-neutral-200 overflow-x-auto py-3 text-xs font-bold no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'overview', label: t('tab.overview'), icon: TrendingUp },
            { id: 'produce', label: `${t('tab.myProduce')} (${listings.length})`, icon: Wheat },
            { id: 'requirements', label: `${t('tab.buyerRequests')} (${requirements.length})`, icon: Layers },
            { id: 'quotations', label: `${t('tab.quotations')} (${quotations.length})`, icon: FileText },
            { id: 'orders', label: `${t('tab.orders')} (${orders.length})`, icon: Truck },
            { id: 'profile', label: t('tab.producerProfile'), icon: User },
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
                  onClick={handleOpenAddProduceModal}
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
                onClick={handleOpenAddProduceModal}
                className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Produce Lot
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div
                  key={l._id}
                  className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition-all"
                >
                  {/* Image Header Preview if photos uploaded */}
                  {l.imageUrls && l.imageUrls.length > 0 && (
                    <div className="relative h-44 bg-neutral-100 overflow-hidden group cursor-pointer" onClick={() => setSelectedImageForPreview(l.imageUrls![0])}>
                      <img
                        src={l.imageUrls[0]}
                        alt={l.product}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Camera className="w-3 h-3 text-agri-orange-400" />
                        <span>{l.imageUrls.length} Photo{l.imageUrls.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-4 h-4" /> Click to Inspect
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          Lot #{l._id?.slice(-5)}
                        </span>
                        <h3 className="font-extrabold text-base text-black">{l.product}</h3>
                        {l.variety && <div className="text-xs text-neutral-500">{l.variety}</div>}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-black border border-neutral-300">
                          {l.qualityGrade}
                        </span>
                        {l.aiAssessment && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 ${
                              l.aiAssessment.confidenceLevel === 'HIGH'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : l.aiAssessment.confidenceLevel === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            AI {l.aiAssessment.recommendedQuality} ({Math.round((l.aiAssessment.confidence || 0) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI Assessment Snapshot Banner */}
                    {l.aiAssessment && (
                      <div className="mb-3 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-neutral-500">AI Visual Grade:</span>
                          <span className="font-bold text-black">{l.aiAssessment.recommendedQuality}</span>
                        </div>
                        {l.farmerConfirmedQuality && l.farmerConfirmedQuality !== l.aiAssessment.recommendedQuality && (
                          <div className="flex items-center justify-between text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <span>Farmer Selection:</span>
                            <span className="font-bold">{l.farmerConfirmedQuality} (Override)</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedAiReportListing(l)}
                          className="w-full text-center text-agri-orange-600 hover:text-agri-orange-700 font-bold text-[10px] pt-1 border-t border-neutral-200/50 flex items-center justify-center gap-1"
                        >
                          <Info className="w-3 h-3" /> View Visual Quality Report
                        </button>
                      </div>
                    )}

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

                  <div className="p-5 pt-0 mt-auto flex items-center justify-between">
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
                            <span>{t('action.callBuyer')}</span>
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
                          <span>{t('action.whatsapp')}</span>
                        </a>
                      </div>

                      <button
                        onClick={() => handleOpenSupplyOffer(req)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('action.sendOffer')}</span>
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

      {/* ADD PRODUCE MODAL WITH AI VISUAL ASSESSMENT */}
      {showAddProduceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-neutral-200 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-white bg-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Harvest Cataloging
                  </span>
                  <span className="text-[10px] font-extrabold text-agri-orange-600 bg-agri-orange-50 px-2.5 py-0.5 rounded-full border border-agri-orange-200 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI Vision Assisted
                  </span>
                </div>
                <h3 className="font-black text-lg text-black mt-1">
                  List New Agricultural Lot
                </h3>
                <p className="text-xs text-neutral-500">
                  Upload lot photographs for instant visual quality grading by AgriLink AI, or enter parameters manually.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddProduceModal(false);
                  setUploadedImages([]);
                  setAiAssessmentResult(null);
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* SECTION 1: 4-SLOT IMAGE UPLOAD GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-agri-orange-500" />
                    Representative Lot Photographs (1 – 4 Images)
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    High-resolution photos enable precise AI classification of color uniformity, sizing, and cosmetic blemish ratio.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-neutral-400">
                  {uploadedImages.length}/4 Uploaded
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { view: 'FRONT', label: 'Front View', sub: 'Primary face', required: true },
                  { view: 'SIDE', label: 'Side View', sub: 'Lateral angle', required: false },
                  { view: 'CLOSEUP', label: 'Close-up View', sub: 'Skin/surface detail', required: false },
                  { view: 'ADDITIONAL', label: 'Additional View', sub: 'Crate or pile', required: false },
                ].map((slot) => {
                  const uploaded = uploadedImages.find((img) => img.viewType === slot.view);
                  return (
                    <div
                      key={slot.view}
                      className={`relative rounded-2xl border-2 transition-all p-2.5 flex flex-col items-center justify-center text-center min-h-[140px] ${
                        uploaded
                          ? 'border-agri-orange-500 bg-orange-50/20'
                          : 'border-dashed border-neutral-200 hover:border-neutral-400 bg-neutral-50/50'
                      }`}
                    >
                      {uploaded ? (
                        <div className="w-full h-full flex flex-col items-center justify-between relative group">
                          <img
                            src={uploaded.previewUrl}
                            alt={slot.label}
                            className="w-full h-20 object-cover rounded-xl border border-neutral-200"
                          />
                          <div className="mt-1.5 w-full flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-black truncate">
                              {slot.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slot.view)}
                              className="text-rose-500 hover:text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-1">
                          <UploadCloud className="w-5 h-5 text-neutral-400 mb-1" />
                          <span className="text-[11px] font-bold text-black">{slot.label}</span>
                          <span className="text-[9px] text-neutral-400">{slot.sub}</span>
                          {slot.required && (
                            <span className="text-[8px] font-extrabold text-agri-orange-600 uppercase mt-0.5">
                              Recommended
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, slot.view as any)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* AI Trigger Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-neutral-500">
                  {uploadedImages.length === 0 ? (
                    <span className="italic text-neutral-400">
                      Upload at least 1 photo above to enable automated AI quality grading.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {uploadedImages.length} image(s) prepared for visual analysis.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunAiAnalysis}
                  disabled={uploadedImages.length === 0 || isAnalyzingProduce}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-agri-orange-500 to-agri-orange-600 hover:from-agri-orange-600 hover:to-agri-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isAnalyzingProduce ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AgriLink AI is Analyzing Lot...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiAssessmentResult ? 'Re-Analyze with AgriLink AI' : 'Analyze with AgriLink AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SECTION 2: AI ASSESSMENT RESULT CARD */}
            {aiAnalysisError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">AI Visual Assessment Notice</div>
                  <div className="text-[11px] text-rose-700">{aiAnalysisError}</div>
                  <div className="text-[10px] text-rose-500 mt-1">
                    You may proceed with manual listing by filling the commercial parameters below.
                  </div>
                </div>
              </div>
            )}

            {aiAssessmentResult && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white border border-neutral-800 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      AgriLink AI Visual Quality Assessment
                    </h4>
                  </div>
                  {/* Confidence Badge */}
                  <div
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto ${
                      aiAssessmentResult.confidenceLevel === 'HIGH'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : aiAssessmentResult.confidenceLevel === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>
                      {aiAssessmentResult.confidenceLevel} Confidence ({Math.round((aiAssessmentResult.confidence || 0) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Column 1: Classification */}
                  <div className="space-y-3 bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-800">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Detected Produce:</span>
                      <div className="text-sm font-black text-white mt-0.5">
                        {aiAssessmentResult.detectedProduce}
                        {aiAssessmentResult.possibleVariety && (
                          <span className="text-xs text-agri-orange-400 font-normal ml-1">
                            ({aiAssessmentResult.possibleVariety})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">Recommended Quality Grade:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-agri-orange-500 text-white font-extrabold text-xs">
                          {aiAssessmentResult.recommendedQuality}
                        </span>
                        <span className="text-[10px] text-neutral-300">
                          {aiAssessmentResult.recommendedQuality === 'Grade A'
                            ? 'Optimal commercial standard (<5% surface marks)'
                            : aiAssessmentResult.recommendedQuality === 'Grade B'
                            ? 'Wholesale trade acceptable (<15% surface marks)'
                            : 'Processing or discount distribution'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-700/60">
                      <span className="text-neutral-400">Image Clarity:</span>
                      <span className="font-bold text-neutral-200">{aiAssessmentResult.imageQuality}</span>
                    </div>
                  </div>

                  {/* Column 2: Observations & Indicators */}
                  <div className="space-y-2 bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">
                      Visible Defect & Uniformity Indicators:
                    </span>
                    <ul className="space-y-1 text-[11px] text-neutral-300">
                      {aiAssessmentResult.visibleIndicators && aiAssessmentResult.visibleIndicators.length > 0 ? (
                        aiAssessmentResult.visibleIndicators.map((ind, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span>{ind}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-neutral-500 italic">No surface defects detected.</li>
                      )}
                    </ul>

                    {aiAssessmentResult.warnings && aiAssessmentResult.warnings.length > 0 && (
                      <div className="pt-2 border-t border-neutral-700/60 space-y-1">
                        <span className="text-[10px] text-amber-400 font-bold block">Advisories & Limits:</span>
                        {aiAssessmentResult.warnings.map((w, wi) => (
                          <div key={wi} className="text-[10px] text-neutral-400 flex items-start gap-1">
                            <AlertCircle className="w-2.5 h-2.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Farmer Decision Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                  <div className="text-[10px] text-neutral-400">
                    {farmerAcceptedAi ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> AI recommendation applied to listing parameters below.
                      </span>
                    ) : (
                      <span>You can apply the AI suggestion or choose your own grade in the form below.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleAcceptAiRecommendation}
                      className="flex-1 sm:flex-none px-4 py-1.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept Recommendation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFarmerAcceptedAi(false)}
                      className="flex-1 sm:flex-none px-3 py-1.5 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-medium rounded-lg text-xs transition-colors"
                    >
                      Edit Manually
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: COMMERCIAL & HARVEST DETAILS FORM */}
            <form onSubmit={handleAddProduce} className="space-y-3.5 text-xs">
              <div className="pt-2 border-t border-neutral-100">
                <h4 className="font-bold text-black uppercase tracking-wider mb-2 text-[11px]">
                  Produce Specifications & Commercial Pricing
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-700">Crop / Produce *</label>
                    {farmerAcceptedAi && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        AI Verified
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={newProduce.product}
                    onChange={(e) => setNewProduce({ ...newProduce, product: e.target.value })}
                    placeholder="e.g. Tomato"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Variety / Cultivar (Optional)</label>
                  <input
                    type="text"
                    value={newProduce.variety}
                    onChange={(e) => setNewProduce({ ...newProduce, variety: e.target.value })}
                    placeholder="e.g. Vaishnavi Hybrid / Red Creole"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Available Quantity (kg) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduce.quantity}
                    onChange={(e) => setNewProduce({ ...newProduce, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-700">Confirmed Quality Grade *</label>
                    {aiAssessmentResult && (
                      <span className="text-[9px] text-neutral-400">
                        (AI: {aiAssessmentResult.recommendedQuality})
                      </span>
                    )}
                  </div>
                  <select
                    value={newProduce.qualityGrade}
                    onChange={(e) => {
                      setNewProduce({ ...newProduce, qualityGrade: e.target.value });
                      if (aiAssessmentResult && e.target.value !== aiAssessmentResult.recommendedQuality) {
                        setFarmerAcceptedAi(false);
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 font-bold bg-white"
                  >
                    <option value="Grade A">Grade A (Premium - Uniform, High Cosmetic Standard)</option>
                    <option value="Grade B">Grade B (Standard - Commercial Wholesale Standard)</option>
                    <option value="Grade C">Grade C (Processing - Food Grade / Industrial Use)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Expected Price (₹ / kg) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newProduce.expectedPricePerUnit}
                    onChange={(e) =>
                      setNewProduce({ ...newProduce, expectedPricePerUnit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 font-bold text-agri-orange-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Available / Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={newProduce.availableFromDate}
                    onChange={(e) => setNewProduce({ ...newProduce, availableFromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Farm Location / District *</label>
                  <input
                    type="text"
                    required
                    value={newProduce.location}
                    onChange={(e) => setNewProduce({ ...newProduce, location: e.target.value })}
                    placeholder="e.g. Vijayawada Rural, Krishna District, AP"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Lot Description / Packaging Specs</label>
                <textarea
                  rows={2}
                  value={newProduce.description}
                  onChange={(e) => setNewProduce({ ...newProduce, description: e.target.value })}
                  placeholder="e.g. Greenhouse harvested, sorted in standard 20kg crates, moisture controlled."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              {/* MANDATORY ADVISORY DISCLAIMER */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[10px] text-neutral-500 leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Advisory Disclaimer:</strong> AgriLink AI visual quality assessment is an advisory tool based on uploaded photographs and does not substitute for physical, chemical, or lab testing where mandated. Final agreed contract terms are governed by buyer inspection upon dispatch.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduceModal(false);
                    setUploadedImages([]);
                    setAiAssessmentResult(null);
                  }}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl font-bold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Produce Lot</span>
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

      {/* PRODUCE IMAGE INSPECTION MODAL */}
      {selectedImageForPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImageForPreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-700 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImageForPreview(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-sm font-bold border border-white/20 transition-colors"
            >
              ✕
            </button>
            <img
              src={selectedImageForPreview}
              alt="High-resolution produce lot view"
              className="w-full max-h-[82vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* FULL AI QUALITY ASSESSMENT REPORT MODAL */}
      {selectedAiReportListing && selectedAiReportListing.aiAssessment && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedAiReportListing(null)}
        >
          <div
            className="bg-neutral-900 text-white rounded-3xl max-w-2xl w-full p-6 border border-neutral-750 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-extrabold text-agri-orange-400 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700 flex items-center gap-1 w-fit">
                  <Sparkles className="w-3 h-3" /> AgriLink AI Visual Inspection Report
                </span>
                <h3 className="font-black text-lg text-white mt-1">
                  Lot #{selectedAiReportListing._id?.slice(-5)}: {selectedAiReportListing.product}
                </h3>
                <p className="text-xs text-neutral-400">
                  Visual quality classification powered by Google Gemini Vision.
                </p>
              </div>
              <button
                onClick={() => setSelectedAiReportListing(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quality Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block font-semibold">AI Recommended</span>
                <span className="text-base font-black text-white mt-0.5 block">
                  {selectedAiReportListing.aiAssessment.recommendedQuality}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block font-semibold">Farmer Confirmed</span>
                <span className="text-base font-black text-agri-orange-400 mt-0.5 block">
                  {selectedAiReportListing.farmerConfirmedQuality || selectedAiReportListing.qualityGrade}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block font-semibold">Confidence Score</span>
                <span className="text-base font-black text-emerald-400 mt-0.5 block">
                  {Math.round((selectedAiReportListing.aiAssessment.confidence || 0) * 100)}% ({selectedAiReportListing.aiAssessment.confidenceLevel})
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block font-semibold">Image Clarity</span>
                <span className="text-base font-black text-neutral-200 mt-0.5 block">
                  {selectedAiReportListing.aiAssessment.imageQuality}
                </span>
              </div>
            </div>

            {/* Indicators & Observations */}
            <div className="space-y-3 bg-neutral-800/50 p-4 rounded-2xl border border-neutral-800 text-xs">
              <div>
                <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Visible Quality & Sizing Indicators
                </h4>
                <ul className="space-y-1.5 text-neutral-300">
                  {selectedAiReportListing.aiAssessment.visibleIndicators?.map((ind, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedAiReportListing.aiAssessment.warnings && selectedAiReportListing.aiAssessment.warnings.length > 0 && (
                <div className="pt-3 border-t border-neutral-800">
                  <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Advisories & Visual Limits
                  </h4>
                  <ul className="space-y-1 text-neutral-400 text-[11px]">
                    {selectedAiReportListing.aiAssessment.warnings.map((w, wIdx) => (
                      <li key={wIdx}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Photo Gallery Thumbnail Row */}
            {selectedAiReportListing.imageUrls && selectedAiReportListing.imageUrls.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Evaluated Photographs ({selectedAiReportListing.imageUrls.length})
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedAiReportListing.imageUrls.map((url, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={url}
                      alt={`Lot photo ${imgIdx + 1}`}
                      className="w-16 h-16 object-cover rounded-xl border border-neutral-700 cursor-pointer hover:border-agri-orange-500 transition-colors shrink-0"
                      onClick={() => setSelectedImageForPreview(url)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer & Metadata */}
            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-neutral-500">
              <span>
                Model: {selectedAiReportListing.aiAssessment.modelVersion || 'Gemini Vision'} • Provider: Google Gemini
              </span>
              <button
                type="button"
                onClick={() => setSelectedAiReportListing(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors self-end sm:self-auto"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
