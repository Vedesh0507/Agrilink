import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-neutral-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0" style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}>
                <img src="/logo.png" alt="AgriLink Logo" width={36} height={36} className="w-full h-full object-contain" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Agri<span className="text-agri-orange-500">Link</span>
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              B2B Agricultural Marketplace & Supply Chain Platform connecting fragmented farm yield with institutional business demand.
            </p>
            <div className="text-xs text-neutral-500">
              Enterprise Agricultural Supply Chain Network
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-4">
              Procurement Workflow
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>1. Supply Aggregation</li>
              <li>2. Demand Specification</li>
              <li>3. Smart Compatibility Matching</li>
              <li>4. Commercial Quotation</li>
              <li>5. Counter-Offer Negotiation</li>
              <li>6. Milestone Fulfillment</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-4">
              Platform Portals
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/farmer" className="hover:text-agri-orange-500 transition-colors">
                  Farmer & Producer Portal
                </Link>
              </li>
              <li>
                <Link href="/buyer" className="hover:text-agri-orange-500 transition-colors">
                  Institutional Buyer Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-agri-orange-500 transition-colors">
                  Portal Login / Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-4">
              Enterprise Technology
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Deterministic Explainable Matching Engine.
              <br />
              Multi-Supplier Yield Aggregation Protocol.
              <br />
              Enterprise MongoDB Atlas Cloud Infrastructure.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div>
            © {new Date().getFullYear()} AgriLink B2B Agricultural Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Andhra Pradesh Agricultural Corridor</span>
            <span>Enterprise B2B SaaS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
