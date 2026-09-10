'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { UserCheck, LogOut, ShieldAlert, Sparkles } from 'lucide-react';

export default function DemoBar() {
  const { user, role, demoLogin, logout } = useAuth();
  const router = useRouter();

  const handleSwitch = async (targetRole: 'FARMER' | 'BUYER' | 'ADMIN') => {
    await demoLogin(targetRole);
    if (targetRole === 'FARMER') router.push('/farmer');
    else if (targetRole === 'BUYER') router.push('/buyer');
    else if (targetRole === 'ADMIN') router.push('/ops-admin');
  };

  return (
    <div className="bg-black text-white text-xs px-4 py-2 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-agri-orange-500 text-white font-semibold px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
          <Sparkles className="w-3 h-3" /> Hackathon Demo Switcher
        </span>
        <span className="text-neutral-400 hidden sm:inline">
          Active Role: <strong className="text-white">{role || 'GUEST / PUBLIC'}</strong>
          {user ? ` (${user.name})` : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-neutral-400 text-[11px] mr-1 hidden md:inline">Quick Login:</span>
        <button
          onClick={() => handleSwitch('FARMER')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
            role === 'FARMER'
              ? 'bg-agri-orange-500 text-white font-semibold'
              : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
          }`}
        >
          <UserCheck className="w-3 h-3" /> Farmer A (Ramesh)
        </button>

        <button
          onClick={() => handleSwitch('BUYER')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
            role === 'BUYER'
              ? 'bg-agri-orange-500 text-white font-semibold'
              : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
          }`}
        >
          <UserCheck className="w-3 h-3" /> Institutional Buyer (Godavari)
        </button>

        <button
          onClick={() => handleSwitch('ADMIN')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
            role === 'ADMIN'
              ? 'bg-agri-orange-500 text-white font-semibold'
              : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
          }`}
        >
          <ShieldAlert className="w-3 h-3" /> Ops Admin
        </button>

        {user && (
          <button
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="px-2 py-1 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
