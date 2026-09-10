'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Building2,
  Wheat,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  FileText,
  Save,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Truck,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { IOrganization } from '@/types';

interface UserProfileManagerProps {
  role?: 'FARMER' | 'BUYER';
}

export default function UserProfileManager({ role: propRole }: UserProfileManagerProps) {
  const { user, updateProfile, refreshProfile } = useAuth();
  const effectiveRole = propRole || user?.role || 'FARMER';
  const isFarmer = effectiveRole === 'FARMER';

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSection, setActiveSection] = useState<'basic' | 'operations' | 'logistics' | 'compliance' | 'bank'>('basic');
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Form State
  const org = (user?.organizationId && typeof user.organizationId === 'object')
    ? (user.organizationId as IOrganization)
    : null;

  const [formData, setFormData] = useState({
    // User / Contact Details
    name: user?.name || '',
    phone: user?.phone || '',
    alternatePhone: user?.alternatePhone || '',
    bio: user?.bio || '',
    location: user?.location || 'Vijayawada, AP',

    // Organization Details
    organizationName: org?.name || (user as any)?.organizationName || '',
    organizationType: org?.type || (isFarmer ? 'INDIVIDUAL_FARMER' : 'WHOLESALER'),
    contactPerson: org?.contactPerson || user?.name || '',
    designation: org?.designation || (isFarmer ? 'Lead Cultivator / Owner' : 'Procurement Manager'),
    primaryCrops: org?.primaryCrops || '',
    capacity: org?.capacity || '',
    landArea: org?.landArea || '',
    farmingType: org?.farmingType || (isFarmer ? 'Good Agricultural Practices (GAP)' : ''),
    farmingExperience: org?.farmingExperience || '',
    nearestMandi: org?.nearestMandi || 'Vijayawada APMC Yard',
    procurementVolume: org?.procurementVolume || '',
    preferredPaymentTerms: org?.preferredPaymentTerms || 'Direct Bank Settlement / Escrow',

    // Address & Logistics
    street: org?.address?.street || '',
    landmark: org?.address?.landmark || '',
    city: org?.address?.city || user?.location?.split(',')[0]?.trim() || 'Vijayawada',
    state: org?.address?.state || 'Andhra Pradesh',
    pincode: org?.address?.pincode || '520001',

    // Compliance & Tax
    gstin: org?.gstin || '',
    panNumber: org?.panNumber || '',
    fssaiNumber: org?.fssaiNumber || '',

    // Bank & Settlement
    accountHolderName: user?.bankDetails?.accountHolderName || user?.name || '',
    bankName: user?.bankDetails?.bankName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
    upiId: user?.bankDetails?.upiId || '',
  });

  // Sync state whenever user or org updates
  useEffect(() => {
    if (user) {
      const currentOrg = (user.organizationId && typeof user.organizationId === 'object')
        ? (user.organizationId as IOrganization)
        : null;

      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        alternatePhone: user.alternatePhone || prev.alternatePhone,
        bio: user.bio || prev.bio,
        location: user.location || prev.location,
        organizationName: currentOrg?.name || (user as any).organizationName || prev.organizationName,
        organizationType: currentOrg?.type || prev.organizationType,
        contactPerson: currentOrg?.contactPerson || user.name || prev.contactPerson,
        designation: currentOrg?.designation || prev.designation,
        primaryCrops: currentOrg?.primaryCrops || prev.primaryCrops,
        capacity: currentOrg?.capacity || prev.capacity,
        landArea: currentOrg?.landArea || prev.landArea,
        farmingType: currentOrg?.farmingType || prev.farmingType,
        farmingExperience: currentOrg?.farmingExperience || prev.farmingExperience,
        nearestMandi: currentOrg?.nearestMandi || prev.nearestMandi,
        procurementVolume: currentOrg?.procurementVolume || prev.procurementVolume,
        preferredPaymentTerms: currentOrg?.preferredPaymentTerms || prev.preferredPaymentTerms,
        street: currentOrg?.address?.street || prev.street,
        landmark: currentOrg?.address?.landmark || prev.landmark,
        city: currentOrg?.address?.city || prev.city,
        state: currentOrg?.address?.state || prev.state,
        pincode: currentOrg?.address?.pincode || prev.pincode,
        gstin: currentOrg?.gstin || prev.gstin,
        panNumber: currentOrg?.panNumber || prev.panNumber,
        fssaiNumber: currentOrg?.fssaiNumber || prev.fssaiNumber,
        accountHolderName: user.bankDetails?.accountHolderName || user.name || prev.accountHolderName,
        bankName: user.bankDetails?.bankName || prev.bankName,
        accountNumber: user.bankDetails?.accountNumber || prev.accountNumber,
        ifscCode: user.bankDetails?.ifscCode || prev.ifscCode,
        upiId: user.bankDetails?.upiId || prev.upiId,
      }));
    }
  }, [user]);

  // Calculate profile completeness score (0 - 100%)
  const calculateCompleteness = () => {
    let score = 0;
    const checks = [
      Boolean(formData.name?.trim()),
      Boolean(formData.phone?.trim()),
      Boolean(formData.location?.trim()),
      Boolean(formData.organizationName?.trim()),
      Boolean(formData.primaryCrops?.trim() || formData.procurementVolume?.trim()),
      Boolean(formData.street?.trim() || formData.city?.trim()),
      Boolean(formData.pincode?.trim()),
      Boolean(formData.gstin?.trim() || formData.fssaiNumber?.trim()),
      Boolean(formData.upiId?.trim() || formData.accountNumber?.trim()),
      Boolean(formData.bio?.trim() || formData.farmingExperience?.trim()),
    ];
    checks.forEach((passed) => {
      if (passed) score += 10;
    });
    return score;
  };

  const completeness = calculateCompleteness();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        alternatePhone: formData.alternatePhone,
        bio: formData.bio,
        location: `${formData.city}, ${formData.state}`,
        organizationName: formData.organizationName,
        organizationType: formData.organizationType as any,
        contactPerson: formData.contactPerson,
        designation: formData.designation,
        gstin: formData.gstin,
        panNumber: formData.panNumber,
        fssaiNumber: formData.fssaiNumber,
        primaryCrops: formData.primaryCrops,
        capacity: formData.capacity,
        landArea: formData.landArea,
        farmingType: formData.farmingType,
        farmingExperience: formData.farmingExperience,
        nearestMandi: formData.nearestMandi,
        procurementVolume: formData.procurementVolume,
        preferredPaymentTerms: formData.preferredPaymentTerms,
        address: {
          street: formData.street,
          landmark: formData.landmark,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId,
        },
      };

      await updateProfile(payload);
      setSuccessMsg('Profile updated successfully! All changes are live across the platform.');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'AL';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-600 hover:text-green-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-xs font-bold shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HERO PROFILE CARD */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Banner Strip */}
        <div className="h-28 sm:h-32 bg-gradient-to-r from-neutral-900 via-neutral-800 to-agri-orange-950 p-6 flex items-end justify-between relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span>{isFarmer ? 'e-NAM & FPO Verified' : 'Institutional Buyer Verified'}</span>
            </div>
          </div>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center bg-gradient-to-tr from-agri-orange-500 to-agri-orange-600 text-white font-black text-2xl sm:text-3xl relative overflow-hidden">
                {getInitials(formData.name)}
                <div className="absolute bottom-0 inset-x-0 bg-black/40 text-[9px] font-bold text-center py-0.5 text-white/90">
                  {effectiveRole}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    {formData.name || user?.name || 'Account Holder'}
                  </h2>
                  <span className="p-0.5 rounded-full bg-green-100 text-green-700" title="Verified Account">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-xs font-bold text-neutral-600 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{formData.organizationName || 'Enterprise Member'}</span>
                  <span>•</span>
                  <span className="text-neutral-500 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-agri-orange-500" />
                    {formData.location || 'Vijayawada Region'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setErrorMsg('');
                    }}
                    disabled={saving}
                    className="px-3.5 py-2.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Meter */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-agri-orange-500" />
                  Profile Completeness & Verification Score
                </span>
                <span className={`${completeness >= 80 ? 'text-green-600' : 'text-agri-orange-600'}`}>
                  {completeness}% Complete
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    completeness >= 80
                      ? 'bg-green-500'
                      : completeness >= 50
                      ? 'bg-agri-orange-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 font-medium sm:text-right">
              {completeness >= 90 ? (
                <span className="text-green-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Trust Score: Maximum discovery on AgriLink
                </span>
              ) : (
                <span>Complete all tax, banking, and farm details to earn the Top Producer badge</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold border-b border-neutral-200 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'basic', label: '1. Contact & Identity', icon: User },
          {
            id: 'operations',
            label: isFarmer ? '2. Farm & Cultivation' : '2. Procurement Specs',
            icon: isFarmer ? Wheat : Building2,
          },
          { id: 'logistics', label: '3. Logistics & Address', icon: Truck },
          { id: 'compliance', label: '4. Legal & Verification', icon: FileText },
          { id: 'bank', label: '5. Bank & Settlements', icon: CreditCard },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-black text-white shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROFILE FORM CONTENT */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8">
        {/* TAB 1: BASIC & CONTACT INFO */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-black">Contact & Account Identity</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Primary credentials used for transaction notifications, dispatch updates, and quotes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Full Name / Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="e.g. Ramesh Reddy"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Primary Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Registered Email Address <span className="text-neutral-400 text-[10px]">(Verified Login)</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-200 bg-neutral-100 text-neutral-600 rounded-xl font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  WhatsApp / Secondary Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={formData.alternatePhone}
                    onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                    placeholder="+91 98765 00000"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-neutral-700 mb-1">
                  Professional Bio / Enterprise Slogan
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditing}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder={
                    isFarmer
                      ? 'e.g. Producer of premium hybrid tomatoes and Guntur sannam red chillies with 10+ years of cultivation.'
                      : 'e.g. Sourcing fresh produce directly from farm collectives for institutional retail distribution.'
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FARM / ENTERPRISE DETAILS */}
        {activeSection === 'operations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-black">
                {isFarmer ? 'Farm & Cultivation Operations' : 'Enterprise Procurement Specifications'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isFarmer
                  ? 'Key details about your farm capacity, primary crops, and agricultural practices.'
                  : 'Your enterprise procurement scale, trade category, and sourcing requirements.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  {isFarmer ? 'Farm / Collective Name' : 'Company / Enterprise Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder={isFarmer ? 'e.g. Sri Venkateswara Farms' : 'e.g. Godavari Fresh Pvt Ltd'}
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Enterprise Structure / Type
                </label>
                <select
                  disabled={!isEditing}
                  value={formData.organizationType}
                  onChange={(e) => handleInputChange('organizationType', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                >
                  {isFarmer ? (
                    <>
                      <option value="INDIVIDUAL_FARMER">Individual Cultivator / Farmer</option>
                      <option value="FARMER_COLLECTIVE">Farmer Producer Collective (FPO / FPC)</option>
                      <option value="PROCESSOR">Agri-Processor / Value Addition Hub</option>
                    </>
                  ) : (
                    <>
                      <option value="WHOLESALER">Wholesale Merchant / Mandi Trader</option>
                      <option value="RETAILER">Retail Supermarket / Grocery Chain</option>
                      <option value="PROCESSOR">Food Processing & Packaging Industry</option>
                      <option value="INSTITUTION">Institutional Caterer / Hospital / Hotel</option>
                      <option value="EXPORTER">Agricultural Exporter</option>
                    </>
                  )}
                </select>
              </div>

              {isFarmer ? (
                <>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Total Cultivable Land Area
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.landArea}
                      onChange={(e) => handleInputChange('landArea', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. 15 Acres"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Farming Method / Practice
                    </label>
                    <select
                      disabled={!isEditing}
                      value={formData.farmingType}
                      onChange={(e) => handleInputChange('farmingType', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                    >
                      <option value="Good Agricultural Practices (GAP)">Good Agricultural Practices (GAP)</option>
                      <option value="Certified Organic (Jaivik Bharat)">Certified Organic (Jaivik Bharat)</option>
                      <option value="Zero Budget Natural Farming (ZBNF)">Zero Budget Natural Farming (ZBNF)</option>
                      <option value="Hydroponic / Controlled Climate">Hydroponic / Controlled Climate</option>
                      <option value="Conventional High-Yield Cultivation">Conventional High-Yield Cultivation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Primary Crops & Commodities Cultivated
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.primaryCrops}
                      onChange={(e) => handleInputChange('primaryCrops', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. Tomatoes, Mirchi, Maize, Cotton"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Seasonal / Monthly Harvest Capacity
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. 20 Metric Tons / Season"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Farming Experience
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.farmingExperience}
                      onChange={(e) => handleInputChange('farmingExperience', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. 12 Years"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Nearest APMC Mandi / Dispatch Center
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.nearestMandi}
                      onChange={(e) => handleInputChange('nearestMandi', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. Guntur APMC Market Yard"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Monthly Sourcing Demand / Volume
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.procurementVolume}
                      onChange={(e) => handleInputChange('procurementVolume', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. 50 - 100 Metric Tons / Month"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Key Commodities Sourced
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.primaryCrops}
                      onChange={(e) => handleInputChange('primaryCrops', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. Hybrid Tomatoes, Onions, Potatoes, Chillies"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Procurement Lead Designation
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. Head of Fresh Procurement"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      Preferred Settlement & Payment Terms
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData.preferredPaymentTerms}
                      onChange={(e) => handleInputChange('preferredPaymentTerms', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                      placeholder="e.g. AgriEscrow on Delivery / Direct Net Banking"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOGISTICS & ADDRESS */}
        {activeSection === 'logistics' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-black text-black">Logistics & Dispatch / Receiving Hub</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Physical premises for farm-gate lot pick up or warehouse receiving.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-neutral-700 mb-1">
                  Premises / Village / Street / Gate
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="e.g. Plot No. 45, Auto Nagar Sourcing Gate"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  City / District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="Vijayawada"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="Andhra Pradesh"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Postal Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="520001"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Landmark & Logistics Dock Access
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.landmark}
                  onChange={(e) => handleInputChange('landmark', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="e.g. Accessible for 10-wheeler trucks, near Cold Storage Yard"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LEGAL & TAX VERIFICATION */}
        {activeSection === 'compliance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-black">Statutory Tax & Regulatory Verification</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mandatory documentation for wholesale interstate billing, e-Way bills, and APMC compliance.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Tax Identity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  GSTIN (GST Identification Number)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-mono font-bold tracking-wider"
                  placeholder="37AAAAA0000A1Z5"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Business / Entity PAN Number
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.panNumber}
                  onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-mono font-bold tracking-wider"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  FSSAI Food License / APMC Trade License No.
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.fssaiNumber}
                  onChange={(e) => handleInputChange('fssaiNumber', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-mono font-bold"
                  placeholder="10019044000123"
                />
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-agri-orange-500 flex-shrink-0" />
                <div className="text-[11px]">
                  <span className="font-bold text-black block">Automated e-Way & GST Compliance</span>
                  <span className="text-neutral-500">
                    Your GSTIN and APMC licenses are synced for automatic electronic invoicing and transport challans.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BANK & SETTLEMENT DETAILS */}
        {activeSection === 'bank' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-black">Banking & Escrow Payout Settlement</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Direct payment disbursements upon verified produce dispatch and buyer receipt sign-off.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Instant AgriEscrow
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Instant UPI ID for Settlement <span className="text-agri-orange-600 font-normal">(Recommended)</span>
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="e.g. farmername@okhdfcbank"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="e.g. State Bank of India"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Account Beneficiary Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-semibold"
                  placeholder="e.g. Ramesh Reddy"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Bank Account Number
                </label>
                <div className="relative">
                  <input
                    type={showAccountNumber || isEditing ? 'text' : 'password'}
                    disabled={!isEditing}
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-mono font-bold"
                    placeholder="987654321012"
                  />
                  {!isEditing && formData.accountNumber && (
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-black"
                    >
                      {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500 disabled:bg-neutral-50 disabled:text-neutral-700 font-mono font-bold tracking-wider"
                  placeholder="SBIN0001234"
                />
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="text-[11px]">
                  <span className="font-bold text-black block">Zero Deduction Direct Bank Transfer</span>
                  <span className="text-neutral-500">
                    Disbursements are deposited directly to your verified bank/UPI account via RTGS/NEFT on the same day.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE ACTIONS */}
        {isEditing && (
          <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-500 font-medium">
              Changes will update your live profile immediately across AgriLink marketplace.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg('');
                }}
                disabled={saving}
                className="flex-1 sm:flex-none px-5 py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold rounded-xl text-xs transition-all"
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Updating Profile...' : 'Save & Publish Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
