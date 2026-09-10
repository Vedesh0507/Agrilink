'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
  LogOut,
  Mail,
  Key,
} from 'lucide-react';
import { formatCurrency, formatQuantity } from '@/lib/utils';

export default function AdminPortalPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Dashboard state
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'supply' | 'demand' | 'orders'>('overview');

  useEffect(() => {
    // Check session storage for existing admin session
    const savedToken = sessionStorage.getItem('agrilink_admin_token');
    const savedUser = sessionStorage.getItem('agrilink_admin_user');
    if (savedToken && savedUser) {
      try {
        setAdminToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
        setIsAdminAuthenticated(true);
        fetchMetrics(savedToken);
      } catch (e) {
        sessionStorage.removeItem('agrilink_admin_token');
        sessionStorage.removeItem('agrilink_admin_user');
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthenticating(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        setAdminUser(data.user);
        setIsAdminAuthenticated(true);
        sessionStorage.setItem('agrilink_admin_token', data.token);
        sessionStorage.setItem('agrilink_admin_user', JSON.stringify(data.user));
        fetchMetrics(data.token);
      } else {
        setLoginError(data.error || 'Access Denied: Invalid administrator credentials.');
      }
    } catch (err: any) {
      setLoginError('Authentication service unreachable: ' + err.message);
    } finally {
      setAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('agrilink_admin_token');
    sessionStorage.removeItem('agrilink_admin_user');
    setIsAdminAuthenticated(false);
    setAdminToken(null);
    setAdminUser(null);
    setEmail('');
    setPassword('');
  };

  const fetchMetrics = async (tokenToUse?: string) => {
    setLoadingMetrics(true);
    try {
      const token = tokenToUse || adminToken;
      const res = await fetch('/api/admin/metrics', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-secret-key': 'agrilink_ops_master_key_2026',
        },
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleReSeed = async () => {
    if (!confirm('Re-seed the platform database with fresh enterprise demo data? All baseline records will be reset.')) {
      return;
    }
    setSeedingStatus('Seeding database...');
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'x-admin-secret-key': 'agrilink_ops_master_key_2026',
          Authorization: adminToken ? `Bearer ${adminToken}` : '',
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
        {/* GATE: IF NOT LOGGED IN AS ADMIN */}
        {!isAdminAuthenticated ? (
          <div className="max-w-md mx-auto py-16">
            <div className="bg-black text-white p-8 rounded-3xl border border-neutral-800 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-700 text-agri-orange-500 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  Administrator Access Gate
                </h2>
                <p className="text-xs text-neutral-400">
                  Restricted command terminal. Enter authorized administrative credentials to access platform oversight.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-300 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pavanmanpealli521@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-agri-orange-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-300 mb-1.5">
                    Administrator Password
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-agri-orange-500 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authenticating}
                  className="w-full py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-agri-orange-500/20 mt-2"
                >
                  {authenticating ? 'Verifying Clearance...' : 'Authenticate as Administrator'}
                </button>
              </form>

              <div className="pt-2 text-center text-[11px] text-neutral-500">
                Authorized Platform Staff Only • All access attempts are cryptographically logged
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED: ADMIN DASHBOARD */
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-200 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-black px-3 py-1 rounded-full border border-neutral-800 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-agri-orange-500" /> Administrative Command Terminal
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black">
                  Platform Operations & Governance
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Logged in as: <strong>{adminUser?.email || 'pavanmanpealli521@gmail.com'}</strong> • Super Admin
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
                  onClick={handleReSeed}
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm border border-neutral-700 transition-all"
                >
                  <Database className="w-4 h-4 text-agri-orange-500" /> Re-Seed Baseline Data
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-neutral-300"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
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

                {/* Audit Logs Table Snapshot */}
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
                <h3 className="font-extrabold text-base text-black">Platform Operations Audit Trail</h3>
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
