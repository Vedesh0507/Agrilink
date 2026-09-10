'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserRole } from '@/types';
import { UserCheck, Sparkles, ShieldAlert, ArrowRight, Lock, Mail, User, MapPin } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, registerWithEmail, demoLogin, role } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('FARMER');
  const [location, setLocation] = useState('Vijayawada, AP');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await registerWithEmail(email, password, {
          name,
          role: userRole,
          location,
          phone,
          organizationName,
        });
      } else {
        await loginWithEmail(email, password);
      }

      if (userRole === 'FARMER' || role === 'FARMER') router.push('/farmer');
      else if (userRole === 'BUYER' || role === 'BUYER') router.push('/buyer');
      else router.push('/ops-admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (targetRole: 'FARMER' | 'BUYER' | 'ADMIN') => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await demoLogin(targetRole);
      if (targetRole === 'FARMER') router.push('/farmer');
      else if (targetRole === 'BUYER') router.push('/buyer');
      else if (targetRole === 'ADMIN') router.push('/ops-admin');
    } catch (err: any) {
      setErrorMsg('Demo login failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-6">
          {/* Quick Demo Access Header for Hackathon */}
          <div className="bg-black text-white p-5 rounded-3xl border border-neutral-800 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-agri-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-agri-orange-400">
                Hackathon Instant Demo Access
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Select a pre-seeded authenticated persona to evaluate the full end-to-end workflow:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('FARMER')}
                disabled={submitting}
                className="w-full py-2.5 px-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-100 rounded-xl text-xs font-semibold flex items-center justify-between border border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-agri-orange-500" />
                  <span>Farmer A (Ramesh Patel — 500 kg Tomato)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => handleDemo('BUYER')}
                disabled={submitting}
                className="w-full py-2.5 px-3.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-white" />
                  <span>Institutional Buyer (Godavari Fresh — 2,000 kg)</span>
                </div>
                <ArrowRight className="w-3 h-3 text-white" />
              </button>

              <button
                type="button"
                onClick={() => handleDemo('ADMIN')}
                disabled={submitting}
                className="w-full py-2 px-3.5 bg-neutral-950 hover:bg-black text-neutral-400 hover:text-white rounded-xl text-[11px] font-medium flex items-center justify-between border border-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3 text-neutral-400" />
                  <span>Platform Operations Admin</span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-black">
                {isRegister ? 'Create AgriLink Account' : 'Sign In to AgriLink'}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {isRegister
                  ? 'Join as an Agricultural Producer or Institutional Buyer'
                  : 'Enter your credentials to access your commercial dashboard'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Account Type / Role
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUserRole('FARMER')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          userRole === 'FARMER'
                            ? 'bg-agri-orange-500 text-white border-agri-orange-500'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        Farmer / Producer
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRole('BUYER')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          userRole === 'BUYER'
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        Institutional Buyer
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Organization / Collective Name
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Krishna Farmers Collective"
                      className="w-full px-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Primary Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Vijayawada, AP"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-agri-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
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
                <label className="block text-xs font-bold text-neutral-700 mb-1">Password</label>
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
                className="w-full py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm mt-2"
              >
                {submitting ? 'Processing...' : isRegister ? 'Complete Registration' : 'Sign In'}
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
                  : "Don't have an account? Register Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
