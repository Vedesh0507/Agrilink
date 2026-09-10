'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-8 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-agri-orange-500 font-black text-xl shadow-sm border border-neutral-800">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-black flex items-center gap-1">
              Agri<span className="text-agri-orange-500">Link</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase -mt-1">
              B2B Agricultural Supply Chain
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-700">
          <Link href="/#workflow" className="hover:text-agri-orange-500 transition-colors">
            Procurement Workflow
          </Link>
          <Link href="/#farmers" className="hover:text-agri-orange-500 transition-colors">
            For Farmers
          </Link>
          <Link href="/#buyers" className="hover:text-agri-orange-500 transition-colors">
            For Buyers
          </Link>
          <Link href="/#matching" className="hover:text-agri-orange-500 transition-colors">
            Smart Matching
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {role === 'FARMER' && (
                <Link
                  href="/farmer"
                  className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Farmer Portal <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {role === 'BUYER' && (
                <Link
                  href="/buyer"
                  className="px-4 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  Buyer Portal <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {role === 'ADMIN' && (
                <Link
                  href="/ops-admin"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl shadow-sm border border-neutral-700 transition-all flex items-center gap-1.5"
                >
                  Ops Admin <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="px-3 py-2 text-sm text-neutral-600 hover:text-black font-medium border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/farmer"
                className="px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:text-agri-orange-600 transition-colors border border-neutral-200 rounded-xl hover:bg-neutral-50"
              >
                Farmer Portal
              </Link>
              <Link
                href="/buyer"
                className="px-3.5 py-2 text-sm font-semibold text-neutral-800 hover:text-agri-orange-600 transition-colors border border-neutral-200 rounded-xl hover:bg-neutral-50"
              >
                Buyer Portal
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl shadow-sm transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-700 hover:text-black focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            Procurement Workflow
          </Link>
          <Link
            href="/#farmers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            For Farmers
          </Link>
          <Link
            href="/#buyers"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-neutral-700"
          >
            For Buyers
          </Link>
          <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
            <Link
              href="/farmer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-center rounded-xl font-semibold text-sm border border-neutral-200"
            >
              Farmer Dashboard
            </Link>
            <Link
              href="/buyer"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-4 text-center rounded-xl font-semibold text-sm bg-agri-orange-500 text-white"
            >
              Buyer Dashboard
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
