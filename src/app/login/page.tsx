'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { UserRole } from '@/types';
import { Lock, Mail, User, MapPin, Building2, Wheat, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, registerWithEmail, demoLogin, role } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userRole, setUserRole] = useState<'FARMER' | 'BUYER'>('FARMER');
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
      else router.push('/buyer');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPortalLogin = async (targetRole: 'FARMER' | 'BUYER') => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await demoLogin(targetRole);
      if (targetRole === 'FARMER') router.push('/farmer');
      else router.push('/buyer');
    } catch (err: any) {
      setErrorMsg('Login failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-6">
          {/* Main Card */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-agri-orange-500 font-black text-2xl mx-auto mb-3">
                A
              </div>
              <h2 className="text-2xl font-black text-black">
                {isRegister ? 'Create AgriLink Account' : 'Sign In to AgriLink'}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {isRegister
                  ? 'Join as an Agricultural Producer or Institutional Buyer'
                  : 'Access your commercial procurement portal'}
              </p>
            </div>

            {/* Quick Persona Switches for testing */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => handleQuickPortalLogin('FARMER')}
                disabled={submitting}
                className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-agri-orange-500 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-agri-orange-600">
                  <Wheat className="w-3.5 h-3.5 text-agri-orange-500" /> Farmer Account
                </div>
                <div className="font-extrabold text-xs text-black">Ramesh Patel</div>
                <div className="text-[10px] text-neutral-400">500 kg Tomato lot</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPortalLogin('BUYER')}
                disabled={submitting}
                className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-black text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-black">
                  <Building2 className="w-3.5 h-3.5 text-black" /> Buyer Account
                </div>
                <div className="font-extrabold text-xs text-black">Godavari Fresh</div>
                <div className="text-[10px] text-neutral-400">2,000 kg demand</div>
              </button>
            </div>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-neutral-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-neutral-400 tracking-wider absolute">
                or sign in with credentials
              </span>
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
