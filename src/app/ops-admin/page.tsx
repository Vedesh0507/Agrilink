'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  Users,
  Wheat,
  Layers,
  FileText,
  Truck,
  Activity,
  Database,
  Lock,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';

export default function OpsAdminPage() {
  const { user, token, role, demoLogin } = useAuth();

  const [authorized, setAuthorized] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'supply' | 'demand' | 'orders'>('overview');

  const fetchMetrics = async (secretOverride?: string) => {
    setLoading(true);
    try {
      const secretToUse = secretOverride || adminSecret || 'agrilink_ops_master_key_2026';
      const headers: Record<string, string> = {
        'x-admin-secret-key': secretToUse,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/metrics', { headers });
      const data = await res.json();

      if (data.success) {
        setMetrics(data.data);
        setAuthorized(true);
      } else {
        if (role === 'ADMIN') {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchMetrics();
    } else {
      // Prompt or check if local dev
      fetchMetrics('agrilink_ops_master_key_2026');
    }
  }, [role, token]);

  const handleManualAuth = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMetrics(adminSecret);
  };

  const handleProtectedSeed = async () => {
    if (!confirm('Re-seed the database with clean hackathon demo data? All test records will be refreshed.')) {
      return;
    }
    setSeedingStatus('Seeding database...');
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'x-admin-secret-key': adminSecret || 'agrilink_ops_master_key_2026',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setSeedingStatus('Database re-seeded successfully!');
        fetchMetrics();
        setTimeout(() => setSeedingStatus(null), 4000);
      } else {
        setSeedingStatus('Error: ' + data.error);
      }
    } catch (e: any) {
      setSeedingStatus('Error: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Protected Access Barrier if not cleared */}
        {!authorized && !loading ? (
          <div className="max-w-md mx-auto py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 text-agri-orange-500 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-black">Restricted Operations Terminal</h2>
              <p className="text-xs text-neutral-500 mt-2">
                This administrative terminal is isolated from public discovery. Enter operational credentials or switch to Ops Admin in the top demo bar.
              </p>
            </div>

            <form onSubmit={handleManualAuth} className="space-y-3 text-xs text-left">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Master Administrative Secret Key
                </label>
                <input
                  type="password"
                  required
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter ADMIN_SECRET_KEY"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-agri-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Authenticate Clearance
              </button>
            </form>

            <div className="pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => demoLogin('ADMIN')}
                className="text-xs font-bold text-agri-orange-600 hover:underline"
              >
                One-Click Hackathon Admin Switch
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-black px-3 py-1 rounded-full border border-neutral-800 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-agri-orange-500" /> Platform Operations Clearance: Level 1
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black">
                  Platform Oversight & Operations
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  AgriLink Central Command • Real-time Monitoring & Audit Logging
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchMetrics()}
                  className="p-2.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-700 transition-colors"
                  title="Refresh Audit Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleProtectedSeed}
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm border border-neutral-700 transition-all"
                >
                  <Database className="w-4 h-4 text-agri-orange-500" /> Re-Seed Demo Dataset
                </button>
              </div>
            </div>

            {seedingStatus && (
              <div className="p-3 rounded-xl bg-agri-orange-50 border border-agri-orange-200 text-agri-orange-800 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-agri-orange-600" /> {seedingStatus}
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto py-2 text-xs font-bold">
              {[
                { id: 'overview', label: 'Platform Metrics', icon: Activity },
                { id: 'audit', label: `Immutable Audit Logs (${metrics?.recentAuditLogs?.length || 0})`, icon: ShieldAlert },
                { id: 'supply', label: `Supply Lots (${metrics?.counts?.totalListings || 0})`, icon: Wheat },
                { id: 'demand', label: `Procurement Demands (${metrics?.counts?.totalRequirements || 0})`, icon: Layers },
                { id: 'orders', label: `Orders (${metrics?.counts?.totalOrders || 0})`, icon: Truck },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-black text-white'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW METRICS */}
            {activeTab === 'overview' && metrics && (
              <div className="space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-left">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Total Users</span>
                    <div className="text-2xl font-black text-black mt-1">{metrics.counts.totalUsers}</div>
                    <div className="text-[10px] text-neutral-500">
                      {metrics.counts.totalFarmers} Farmers, {metrics.counts.totalBuyers} Buyers
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-left">
                    <span className="text-[10px] font-bold text-agri-orange-600 uppercase">Total Supply</span>
                    <div className="text-2xl font-black text-agri-orange-500 mt-1">
                      {formatQuantity(metrics.counts.totalAvailableSupplyKg)}
                    </div>
                    <div className="text-[10px] text-neutral-500">{metrics.counts.totalListings} Active Lots</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-left">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Total Demand</span>
                    <div className="text-2xl font-black text-black mt-1">
                      {formatQuantity(metrics.counts.totalOpenDemandKg)}
                    </div>
                    <div className="text-[10px] text-neutral-500">{metrics.counts.totalRequirements} Requirements</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-left">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Matches Computed</span>
                    <div className="text-2xl font-black text-black mt-1">{metrics.counts.totalMatches}</div>
                    <div className="text-[10px] text-neutral-500">Including Aggregations</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-left">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Quotations</span>
                    <div className="text-2xl font-black text-black mt-1">{metrics.counts.totalQuotations}</div>
                    <div className="text-[10px] text-neutral-500">Counter Negotiations</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-left">
                    <span className="text-[10px] font-bold text-black uppercase">Gross Order GMV</span>
                    <div className="text-2xl font-black text-black mt-1">
                      {formatCurrency(metrics.counts.totalOrderValueINR)}
                    </div>
                    <div className="text-[10px] text-neutral-500">{metrics.counts.totalOrders} Confirmed Orders</div>
                  </div>
                </div>

                {/* Recent Audit Logs Snapshot */}
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-black uppercase tracking-wider">
                      Immutable Audit Trail (Real-Time Security Feed)
                    </h3>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className="text-xs font-bold text-agri-orange-600 hover:underline"
                    >
                      View Full Audit Log
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                          <th className="pb-3">Timestamp</th>
                          <th className="pb-3">Actor Role</th>
                          <th className="pb-3">Action</th>
                          <th className="pb-3">Target Resource</th>
                          <th className="pb-3">Payload Summary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {metrics.recentAuditLogs?.slice(0, 6).map((log: any, idx: number) => (
                          <tr key={log._id || idx} className="hover:bg-neutral-50 transition-colors">
                            <td className="py-3 text-neutral-500 font-mono text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800">
                                {log.actorRole}
                              </span>
                            </td>
                            <td className="py-3 font-bold text-black">{log.action}</td>
                            <td className="py-3 text-neutral-600">{log.resource}</td>
                            <td className="py-3 text-neutral-500 text-[11px] font-mono truncate max-w-xs">
                              {JSON.stringify(log.details || {})}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AUDIT LOG */}
            {activeTab === 'audit' && metrics && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                <h3 className="font-extrabold text-base text-black">Comprehensive Platform Audit Log</h3>
                <div className="space-y-3">
                  {metrics.recentAuditLogs?.map((log: any, idx: number) => (
                    <div
                      key={log._id || idx}
                      className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-bold">
                            {log.actorRole}
                          </span>
                          <span className="font-bold text-black text-sm">{log.action}</span>
                          <span className="text-neutral-400">on {log.resource}</span>
                        </div>
                        <div className="font-mono text-neutral-500 text-[11px]">
                          {JSON.stringify(log.details || {})}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-neutral-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SUPPLY LOTS */}
            {activeTab === 'supply' && metrics && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                <h3 className="font-extrabold text-base text-black">Active Produce Listings (Supply Inventory)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                        <th className="pb-3">Farmer</th>
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Quantity</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {metrics.listingsData?.map((item: any) => (
                        <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 font-bold text-black">{item.farmerName}</td>
                          <td className="py-3">{item.product} ({item.qualityGrade})</td>
                          <td className="py-3 font-medium">{formatQuantity(item.availableQuantity)}</td>
                          <td className="py-3 font-bold text-agri-orange-600">₹{item.expectedPricePerUnit}/kg</td>
                          <td className="py-3 text-neutral-500">{item.location}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: DEMAND */}
            {activeTab === 'demand' && metrics && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                <h3 className="font-extrabold text-base text-black">Procurement Demands (Buyer Requirements)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                        <th className="pb-3">Buyer</th>
                        <th className="pb-3">Product</th>
                        <th className="pb-3">Required Quantity</th>
                        <th className="pb-3">Target Price</th>
                        <th className="pb-3">Delivery Hub</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {metrics.requirementsData?.map((item: any) => (
                        <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 font-bold text-black">{item.buyerName}</td>
                          <td className="py-3">{item.product} ({item.qualityGrade})</td>
                          <td className="py-3 font-medium">{formatQuantity(item.requiredQuantity)}</td>
                          <td className="py-3 font-bold text-agri-orange-600">₹{item.targetPricePerUnit}/kg</td>
                          <td className="py-3 text-neutral-500">{item.deliveryLocation}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ORDERS */}
            {activeTab === 'orders' && metrics && (
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                <h3 className="font-extrabold text-base text-black">Confirmed Transactions & Fulfillment State</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-500 font-semibold">
                        <th className="pb-3">Order Number</th>
                        <th className="pb-3">Buyer</th>
                        <th className="pb-3">Quantity</th>
                        <th className="pb-3">Gross Value</th>
                        <th className="pb-3">Order Status</th>
                        <th className="pb-3">Fulfillment Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {metrics.ordersData?.map((item: any) => (
                        <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 font-bold text-black">{item.orderNumber}</td>
                          <td className="py-3">{item.buyerName}</td>
                          <td className="py-3 font-medium">{formatQuantity(item.totalQuantity)}</td>
                          <td className="py-3 font-bold text-black">{formatCurrency(item.totalValue)}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black text-white">
                              {item.orderStatus}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-agri-orange-50 text-agri-orange-600 border border-agri-orange-200">
                              {item.currentFulfillmentStage}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
