'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import UserProfileManager from '@/components/UserProfileManager';
import { ArrowLeft, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading, role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-10 h-10 border-4 border-agri-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-bold">Loading your AgriLink profile...</p>
          </div>
        ) : !user ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-neutral-200 shadow-xl space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black">Sign In to Manage Your Profile</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Access and customize your producer or buyer profile, farm specifications, GSTIN, and settlement bank accounts.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login?role=FARMER"
                  className="flex-1 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  Farmer Sign In
                </Link>
                <Link
                  href="/login?role=BUYER"
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  Buyer Sign In
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Back Breadcrumb */}
            <div className="flex items-center justify-between">
              <Link
                href={role === 'BUYER' ? '/buyer' : role === 'ADMIN' ? '/admin' : '/farmer'}
                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>
                  Return to {role === 'BUYER' ? 'Procurement Dashboard' : role === 'ADMIN' ? 'Admin Console' : 'Producer Dashboard'}
                </span>
              </Link>

              <div className="text-[11px] font-bold text-neutral-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-green-600" />
                <span>Production Profile Management</span>
              </div>
            </div>

            {/* Profile Management Component */}
            <UserProfileManager role={role === 'BUYER' ? 'BUYER' : 'FARMER'} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
