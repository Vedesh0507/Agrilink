'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserRole } from '@/types';
import {
  Lock,
  Mail,
  User,
  MapPin,
  Building2,
  Wheat,
  ArrowRight,
  Phone,
  Sprout,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Weight,
  Sparkles,
  X,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    completeGoogleProfile,
    role,
  } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userRole, setUserRole] = useState<'FARMER' | 'BUYER'>('FARMER');
  const [location, setLocation] = useState('Vijayawada, AP');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('FARMER_COLLECTIVE');
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [capacity, setCapacity] = useState('');
  const [gstin, setGstin] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Google Onboarding Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleData, setGoogleData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const registerParam = params.get('register');
      if (registerParam === 'true' || roleParam) {
        setIsRegister(true);
      }
      if (roleParam === 'FARMER' || roleParam === 'BUYER') {
        setUserRole(roleParam);
        setOrganizationType(roleParam === 'FARMER' ? 'FARMER_COLLECTIVE' : 'WHOLESALER');
      }
    }
  }, []);

  const handleRoleChange = (newRole: 'FARMER' | 'BUYER') => {
    setUserRole(newRole);
    setOrganizationType(newRole === 'FARMER' ? 'FARMER_COLLECTIVE' : 'WHOLESALER');
  };

  const formatAuthError = (err: any): string => {
    if (!err) return 'Authentication failed. Please check your credentials.';
    const msg = typeof err === 'string' ? err : err.message || '';
    if (msg.includes('auth/internal-error')) {
      return 'Google sign-in was blocked or interrupted by browser security settings. Please allow popups for localhost:3000, or sign in below using your email and password.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in window was closed before completing.';
    }
    if (msg.includes('auth/popup-blocked')) {
      return 'Google sign-in popup was blocked. Please allow popups for localhost:3000 in your browser address bar.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'Invalid password. Please enter the correct password to continue.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'No account found with this email address. Please click "Register Commercial Account Now" below.';
    }
    // Clean any raw Firebase wrapper like "Firebase: Error (auth/...)."
    return msg.replace(/^Firebase:\s*Error\s*\(([^)]+)\)\.?/i, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      let loggedUser;
      if (isRegister) {
        loggedUser = await registerWithEmail(email, password, {
          name,
          role: userRole,
          location,
          phone,
          organizationName,
          organizationType,
          primaryCrops,
          capacity,
          gstin,
        });
      } else {
        loggedUser = await loginWithEmail(email, password);
      }

      const targetRole = loggedUser?.role || (isRegister ? userRole : 'FARMER');
      if (targetRole === 'BUYER') {
        router.push('/buyer');
      } else if (targetRole === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/farmer');
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const result = await loginWithGoogle(userRole);
      if (!result) return;

      if (result.needsProfile) {
        setGoogleData(result.googleUser);
        setName(result.googleUser?.name || '');
        setEmail(result.googleUser?.email || '');
        setShowGoogleModal(true);
        return;
      }

      const targetRole = result.user?.role || userRole;
      if (targetRole === 'BUYER') {
        router.push('/buyer');
      } else if (targetRole === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/farmer');
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const user = await completeGoogleProfile({
        ...googleData,
        name: name || googleData?.name,
        role: userRole,
        phone,
        organizationName,
        organizationType,
        location,
        primaryCrops,
        capacity,
        gstin,
      });

      setShowGoogleModal(false);
      if (user?.role === 'BUYER') router.push('/buyer');
      else if (user?.role === 'ADMIN') router.push('/admin');
      else router.push('/farmer');
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className={`w-full transition-all duration-300 ${isRegister ? 'max-w-xl' : 'max-w-md'} space-y-6`}>
          {/* Main Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-1 mx-auto mb-3 border border-neutral-200 shadow-sm overflow-hidden shrink-0" style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}>
                <img src="/logo.png" alt="AgriLink Logo" width={64} height={64} className="w-full h-full object-contain" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <h2 className="text-2xl font-black text-black">
                {isRegister ? 'Create AgriLink Commercial Account' : 'Sign In to AgriLink'}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {isRegister
                  ? 'Enter verified agricultural producer or institutional buyer details'
                  : 'Access your commercial procurement and fulfillment portal'}
              </p>
            </div>


            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-xs border border-neutral-300 shadow-xs flex items-center justify-center gap-3 transition-all hover:border-neutral-400 mb-5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isRegister ? 'Register with Google' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-neutral-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-neutral-400 tracking-wider absolute">
                {isRegister ? 'or register with business details' : 'or sign in with email credentials'}
              </span>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Account Type / Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleChange('FARMER')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          userRole === 'FARMER'
                            ? 'bg-agri-orange-500 text-white border-agri-orange-500 shadow-sm'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Wheat className="w-3.5 h-3.5" />
                        <span>Farmer / Producer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleChange('BUYER')}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          userRole === 'BUYER'
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Institutional Buyer</span>
                      </button>
                    </div>
                  </div>

                  {/* Name & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        {userRole === 'FARMER' ? 'Farmer / Producer Name' : 'Procurement Lead Name'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={userRole === 'FARMER' ? 'e.g. Ramesh Patel' : 'e.g. Kalyan Chakravarthy'}
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Mobile / WhatsApp Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98480 12345"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Entity Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {userRole === 'FARMER' ? 'Producer Category' : 'Business Entity Category'}
                    </label>
                    <select
                      value={organizationType}
                      onChange={(e) => setOrganizationType(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white font-medium"
                    >
                      {userRole === 'FARMER' ? (
                        <>
                          <option value="FARMER_COLLECTIVE">Farmer Producer Organization (FPO)</option>
                          <option value="INDIVIDUAL_FARMER">Individual Smallholder Farmer</option>
                          <option value="INSTITUTION">Agricultural Cooperative / Society</option>
                        </>
                      ) : (
                        <>
                          <option value="WHOLESALER">Bulk Wholesaler / Distributor</option>
                          <option value="RETAILER">Supermarket / Retail Chain</option>
                          <option value="PROCESSOR">Food Processor / Food Manufacturer</option>
                          <option value="INSTITUTION">HORECA / Restaurant Consortium</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Organization Name & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        {userRole === 'FARMER' ? 'Farm / Collective Name' : 'Company / Business Name'}
                      </label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder={userRole === 'FARMER' ? 'e.g. Krishna Farmers Collective' : 'e.g. Godavari Fresh Foods Ltd'}
                        className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        {userRole === 'FARMER' ? 'Farm District / Location' : 'Receiving Warehouse Location'} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Vijayawada, Krishna Dist, AP"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Crops & Capacity/GSTIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        {userRole === 'FARMER' ? 'Primary Crops Grown' : 'Primary Crops Sourced'}
                      </label>
                      <div className="relative">
                        <Sprout className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={primaryCrops}
                          onChange={(e) => setPrimaryCrops(e.target.value)}
                          placeholder="e.g. Tomatoes, Chillies, Onions"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      {userRole === 'FARMER' ? (
                        <>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Seasonal Yield Capacity
                          </label>
                          <div className="relative">
                            <Weight className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={capacity}
                              onChange={(e) => setCapacity(e.target.value)}
                              placeholder="e.g. 5,000 kg (5 Tonnes)"
                              className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            GSTIN / Business ID (Optional)
                          </label>
                          <div className="relative">
                            <FileText className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                            <input
                              type="text"
                              value={gstin}
                              onChange={(e) => setGstin(e.target.value)}
                              placeholder="e.g. 37AAAAA0000A1Z5"
                              className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white uppercase"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Email & Password */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Business / Official Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agrilink.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : isRegister ? (
                  <>
                    <span>Complete Commercial Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="text-xs font-semibold text-neutral-700 hover:text-agri-orange-600 transition-colors"
              >
                {isRegister
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Register Commercial Account Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE PROFILE ONBOARDING MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-agri-orange-50 border-2 border-agri-orange-500 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                {googleData?.photoURL ? (
                  <img src={googleData.photoURL} alt="Google Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-agri-orange-600" />
                )}
              </div>
              <h3 className="text-xl font-black text-black">
                Welcome, {googleData?.name || 'Partner'}!
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Connected via Google ({googleData?.email}). Please complete your agricultural profile to enter your commercial dashboard.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleGoogleProfileComplete} className="space-y-4">
              {/* Role Toggle */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Select Your Platform Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('FARMER')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      userRole === 'FARMER'
                        ? 'bg-agri-orange-500 text-white border-agri-orange-500'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <Wheat className="w-3.5 h-3.5" /> Farmer / Producer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('BUYER')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      userRole === 'BUYER'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Institutional Buyer
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Mobile / WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98480 12345"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              {/* Organization Type */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {userRole === 'FARMER' ? 'Producer Type' : 'Business Entity Type'}
                </label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 font-medium"
                >
                  {userRole === 'FARMER' ? (
                    <>
                      <option value="FARMER_COLLECTIVE">Farmer Producer Organization (FPO)</option>
                      <option value="INDIVIDUAL_FARMER">Individual Smallholder Farmer</option>
                      <option value="INSTITUTION">Agricultural Cooperative</option>
                    </>
                  ) : (
                    <>
                      <option value="WHOLESALER">Bulk Wholesaler / Distributor</option>
                      <option value="RETAILER">Supermarket / Retail Chain</option>
                      <option value="PROCESSOR">Food Processor / Manufacturer</option>
                      <option value="INSTITUTION">Hospitality / HORECA</option>
                    </>
                  )}
                </select>
              </div>

              {/* Organization Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {userRole === 'FARMER' ? 'Farm / Collective Name' : 'Company Name'}
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={userRole === 'FARMER' ? 'e.g. Krishna Organic FPO' : 'e.g. Godavari Fresh Ltd'}
                    className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Location / Hub <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Vijayawada, AP"
                    className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500"
                  />
                </div>
              </div>

              {/* Primary Crops */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {userRole === 'FARMER' ? 'Primary Crops Produced' : 'Primary Crops Sourced'}
                </label>
                <input
                  type="text"
                  value={primaryCrops}
                  onChange={(e) => setPrimaryCrops(e.target.value)}
                  placeholder="e.g. Tomatoes, Chillies, Onions"
                  className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? 'Saving Profile...' : 'Complete Profile & Enter Dashboard'}
                  <ArrowRight className="w-4 h-4" />
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
