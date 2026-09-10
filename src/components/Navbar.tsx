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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white flex items-center justify-center p-1 shadow-sm border border-neutral-200 overflow-hidden">
            <img src="/logo.png" alt="AgriLink Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl sm:text-2xl tracking-tight text-black flex items-center">
              Agri<span className="text-agri-orange-500">Link</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-neutral-500 font-semibold tracking-wider uppercase -mt-0.5 hidden xs:inline sm:inline">
              B2B Agricultural Supply Chain
            </span>
          </div>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href={profileHref}
                title="View & Edit Profile"
                className="hidden md:flex flex-col text-right hover:opacity-80 transition-opacity"
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
                className="p-2 sm:p-2.5 text-neutral-600 hover:text-black border border-neutral-200 hover:border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
              >
                <User className="w-4 h-4 text-agri-orange-500" />
                <span className="hidden lg:inline">Profile</span>
              </Link>

              {role === 'FARMER' && (
                <Link
                  href="/farmer"
                  className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 sm:gap-1.5 shrink-0"
                >
                  <span className="hidden sm:inline">Farmer Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              )}
              {role === 'BUYER' && (
                <Link
                  href="/buyer"
                  className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 sm:gap-1.5 shrink-0"
                >
                  <span className="hidden sm:inline">Buyer Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm border border-neutral-700 transition-all flex items-center gap-1 sm:gap-1.5 shrink-0"
                >
                  <span className="hidden sm:inline">Admin Console</span>
                  <span className="sm:hidden">Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              )}

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-2 sm:p-2.5 text-neutral-500 hover:text-black border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black border border-neutral-200 hover:border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-1 sm:gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/login?register=true"
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 sm:gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
