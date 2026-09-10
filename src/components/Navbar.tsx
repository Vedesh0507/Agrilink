'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, UserCheck, LogOut, UserPlus, LogIn, User } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();

  const profileHref = role === 'BUYER' ? '/buyer?tab=profile' : role === 'FARMER' ? '/farmer?tab=profile' : '/profile';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center p-1 shadow-sm border border-neutral-200 overflow-hidden">
            <img src="/logo.png" alt="AgriLink Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tight text-black flex items-center">
              Agri<span className="text-agri-orange-500">Link</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-semibold tracking-wider uppercase -mt-0.5">
              B2B Agricultural Supply Chain
            </span>
          </div>
        </Link>

        {/* Right: Only "Create Account" & "Sign In" (or active Dashboard) */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={profileHref}
                title="View & Edit Profile"
                className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-bold text-black flex items-center justify-end gap-1">
                  {user.name}
                </span>
                <span className="text-[10px] font-semibold text-agri-orange-600 uppercase">
                  {role === 'FARMER' ? 'Farmer / Producer' : role === 'BUYER' ? 'Institutional Buyer' : 'Administrator'}
                </span>
              </Link>

              <Link
                href={profileHref}
                title="Manage Profile"
                className="p-2.5 text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <User className="w-4 h-4 text-agri-orange-500" />
                <span className="hidden md:inline">Profile</span>
              </Link>

              {role === 'FARMER' && (
                <Link
                  href="/farmer"
                  className="px-4 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Farmer Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {role === 'BUYER' && (
                <Link
                  href="/buyer"
                  className="px-4 py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Buyer Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm border border-neutral-700 transition-all flex items-center gap-1.5"
                >
                  Admin Console <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-2.5 text-neutral-500 hover:text-black border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black border border-neutral-200 hover:border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-neutral-500" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/login?register=true"
                className="px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
