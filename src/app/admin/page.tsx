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
  AlertTriangle,
  Clock,
  CreditCard,
  Receipt,
  Sliders,
  Radio,
  LifeBuoy,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Server,
  Cpu,
  Wifi,
  Printer,
  TrendingUp,
  Eye,
  Send,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { formatCurrency, formatQuantity } from '@/lib/utils';

// Operational Pillars & Module IDs
type AdminModuleId =
  | 'overview'
  | 'system_health'
  | 'integrations'
  | 'users'
  | 'kyc'
  | 'fraud_risk'
  | 'supply'
  | 'demand'
  | 'matching_engine'
  | 'commodity_catalog'
  | 'orders'
  | 'delays'
  | 'disputes'
  | 'ledger'
  | 'invoicing'
  | 'commission'
  | 'broadcast'
  | 'tickets'
  | 'feature_flags'
  | 'audit_trail';

interface NavSection {
  title: string;
  icon: any;
  items: { id: AdminModuleId; label: string; badge?: number | string }[];
}

const getCommodityHsn = (commodityName?: string) => {
  const norm = (commodityName || '').toLowerCase();
  if (norm.includes('onion') || norm.includes('allium') || norm.includes('garlic')) return { hsn: '0703', desc: 'Onions, shallots, garlic, leeks' };
  if (norm.includes('tomato')) return { hsn: '0702', desc: 'Tomatoes, fresh or chilled' };
  if (norm.includes('potato')) return { hsn: '0701', desc: 'Potatoes, fresh or chilled' };
  if (norm.includes('chilli') || norm.includes('pepper') || norm.includes('mirchi')) return { hsn: '0904', desc: 'Chillies & peppers' };
  if (norm.includes('carrot') || norm.includes('turnip')) return { hsn: '0706', desc: 'Carrots, turnips, root vegetables' };
  if (norm.includes('cabbage') || norm.includes('cauliflower')) return { hsn: '0704', desc: 'Cabbages, cauliflowers' };
  return { hsn: '0709', desc: 'Other fresh agricultural produce' };
};

export default function AdminPortalPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Navigation state
  const [activeModule, setActiveModule] = useState<AdminModuleId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard Master Data
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);

  // Module Specific Datasets
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [kycQueue, setKycQueue] = useState<any[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);

  const [demandList, setDemandList] = useState<any[]>([]);
  const [loadingDemand, setLoadingDemand] = useState(false);

  const [disputesList, setDisputesList] = useState<any[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);

  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [platformConfig, setPlatformConfig] = useState<any>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  // Action Modals State
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionStatusInput, setActionStatusInput] = useState('');
  const [actionAmountInput, setActionAmountInput] = useState<number | ''>('');
  const [actionNotesInput, setActionNotesInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Broadcast Form State
  const [broadcastTarget, setBroadcastTarget] = useState<'ALL' | 'FARMER' | 'BUYER'>('ALL');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastUrgent, setBroadcastUrgent] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Print Invoice Modal
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('agrilink_admin_token');
    const savedUser = sessionStorage.getItem('agrilink_admin_user');
    if (savedToken && savedUser) {
      try {
        setAdminToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
        setIsAdminAuthenticated(true);
        fetchMetrics(savedToken);
        fetchPlatformConfig(savedToken);
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
        fetchPlatformConfig(data.token);
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

  const getHeaders = (idempotencyKey?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-secret-key': 'agrilink_ops_master_key_2026',
    };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return headers;
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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const url = `/api/admin/users?role=${userRoleFilter}&search=${encodeURIComponent(userSearch)}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setUsersList(data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchKycQueue = async () => {
    setLoadingKyc(true);
    try {
      const res = await fetch('/api/admin/kyc', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setKycQueue(data.data);
    } catch (err) {
      console.error('Failed to load KYC queue:', err);
    } finally {
      setLoadingKyc(false);
    }
  };

  const fetchDemand = async () => {
    setLoadingDemand(true);
    try {
      const res = await fetch('/api/admin/demand', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setDemandList(data.data);
    } catch (err) {
      console.error('Failed to load demand:', err);
    } finally {
      setLoadingDemand(false);
    }
  };

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const res = await fetch('/api/admin/disputes', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setDisputesList(data.data);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch('/api/admin/finance', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setLedgerData(data.data);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch('/api/admin/tickets', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTicketsList(data.data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchPlatformConfig = async (tokenToUse?: string) => {
    try {
      const token = tokenToUse || adminToken;
      const res = await fetch('/api/admin/config', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-secret-key': 'agrilink_ops_master_key_2026',
        },
      });
      const data = await res.json();
      if (data.success) setPlatformConfig(data.data);
    } catch (err) {
      console.error('Failed to load platform config:', err);
    }
  };

  // Trigger data fetching when module activates
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (activeModule === 'users' || activeModule === 'fraud_risk') fetchUsers();
    if (activeModule === 'kyc') fetchKycQueue();
    if (activeModule === 'demand') fetchDemand();
    if (activeModule === 'disputes') fetchDisputes();
    if (activeModule === 'ledger' || activeModule === 'invoicing') fetchLedger();
    if (activeModule === 'tickets') fetchTickets();
    if (activeModule === 'feature_flags' || activeModule === 'commission') fetchPlatformConfig();
  }, [activeModule, isAdminAuthenticated]);

  const handleReSeed = async () => {
    if (!confirm('Re-seed the platform database with fresh enterprise demo data? All baseline records will be reset.')) {
      return;
    }
    setSeedingStatus('Seeding database with multi-farmer bulk matching testbed...');
    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setSeedingStatus('Database re-seeded successfully with verified test scenarios!');
        fetchMetrics();
        if (activeModule === 'users') fetchUsers();
        if (activeModule === 'demand') fetchDemand();
        if (activeModule === 'ledger') fetchLedger();
        setTimeout(() => setSeedingStatus(null), 5000);
      } else {
        setSeedingStatus('Error: ' + data.error);
      }
    } catch (e: any) {
      setSeedingStatus('Error: ' + e.message);
    }
  };

  // Generic modal submission handler
  const handleExecuteAdminAction = async () => {
    if (!actionReason || actionReason.trim().length < 5) {
      alert('Please enter a mandatory operational reason (minimum 5 characters). All actions are immutably logged.');
      return;
    }

    setSubmittingAction(true);
    setActionFeedback(null);
    const idempotencyKey = `ADMIN-ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    try {
      if (modalType === 'USER_STATUS') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            userId: selectedItem._id,
            accountStatus: actionStatusInput,
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({ success: true, message: 'User status successfully updated & audit logged.' });
          fetchUsers();
          setTimeout(() => closeModal(), 1500);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      } else if (modalType === 'KYC_REVIEW') {
        const res = await fetch('/api/admin/kyc', {
          method: 'POST',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            userId: selectedItem._id,
            status: actionStatusInput,
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({ success: true, message: `KYC marked as ${actionStatusInput}.` });
          fetchKycQueue();
          fetchMetrics();
          setTimeout(() => closeModal(), 1500);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      } else if (modalType === 'KNAPSACK_TRIGGER') {
        const res = await fetch('/api/admin/demand', {
          method: 'POST',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            requirementId: selectedItem._id,
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({
            success: true,
            message: `Knapsack engine evaluated ${data.data?.length || 0} candidate farm lots. Shortfall recalculated.`,
          });
          fetchDemand();
          fetchMetrics();
          setTimeout(() => closeModal(), 2000);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      } else if (modalType === 'RESOLVE_DISPUTE') {
        const res = await fetch('/api/admin/disputes', {
          method: 'POST',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            disputeId: selectedItem._id,
            resolutionNotes: actionNotesInput || actionReason,
            settlementAmount: Number(actionAmountInput) || 0,
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({ success: true, message: 'Dispute resolved and ledger settlement scheduled.' });
          fetchDisputes();
          fetchMetrics();
          setTimeout(() => closeModal(), 1500);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      } else if (modalType === 'MANUAL_LEDGER_ENTRY') {
        const res = await fetch('/api/admin/finance', {
          method: 'POST',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            amount: Number(actionAmountInput),
            type: actionStatusInput || 'SUPPLIER_PAYOUT',
            orderNumber: actionNotesInput || 'MANUAL-OPS',
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({ success: true, message: 'Ledger transaction recorded to clearing database.' });
          fetchLedger();
          setTimeout(() => closeModal(), 1500);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      } else if (modalType === 'SETTLE_LEDGER_ENTRY') {
        const res = await fetch('/api/admin/finance', {
          method: 'POST',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            entryId: selectedItem._id,
            action: 'SETTLE_ENTRY',
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({ success: true, message: 'Entry marked as SETTLED.' });
          fetchLedger();
          setTimeout(() => closeModal(), 1500);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      } else if (modalType === 'RESOLVE_TICKET') {
        const res = await fetch('/api/admin/tickets', {
          method: 'POST',
          headers: getHeaders(idempotencyKey),
          body: JSON.stringify({
            ticketId: selectedItem._id,
            status: actionStatusInput,
            resolutionNotes: actionNotesInput || actionReason,
            reason: actionReason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback({ success: true, message: 'Helpdesk ticket updated.' });
          fetchTickets();
          setTimeout(() => closeModal(), 1500);
        } else {
          setActionFeedback({ success: false, message: data.error });
        }
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setActionReason('');
    setActionStatusInput('');
    setActionAmountInput('');
    setActionNotesInput('');
    setActionFeedback(null);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setSendingBroadcast(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          targetRole: broadcastTarget,
          title: broadcastTitle,
          message: broadcastMessage,
          isUrgent: broadcastUrgent,
          reason: 'Operational bulletin from platform control center',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Broadcast successfully dispatched to ${data.data?.recipientsNotified || 'all'} registered stakeholders!`);
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error sending announcement: ' + err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleSavePlatformConfig = async () => {
    if (!platformConfig) return;
    setConfigSaving(true);
    setConfigMessage('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          featureFlags: platformConfig.featureFlags,
          platformCommissionPercent: Number(platformConfig.platformCommissionPercent),
          reason: 'Operations administrative policy adjustment',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfigMessage('Platform configuration updated and broadcast across worker threads.');
        setTimeout(() => setConfigMessage(''), 4000);
      } else {
        setConfigMessage('Error: ' + data.error);
      }
    } catch (err: any) {
      setConfigMessage('Error: ' + err.message);
    } finally {
      setConfigSaving(false);
    }
  };

  // Nav categories structure
  const navSections: NavSection[] = [
    {
      title: 'Ops & Observability',
      icon: Activity,
      items: [
        { id: 'overview', label: 'Command Center' },
        { id: 'system_health', label: 'System Health & Uptime' },
        { id: 'integrations', label: 'Integrations Console' },
      ],
    },
    {
      title: 'Directory & Trust',
      icon: Users,
      items: [
        { id: 'users', label: 'Unified User Directory' },
        { id: 'kyc', label: 'KYC Verification Queue', badge: metrics?.attentionAlerts?.pendingKycCount || 0 },
        { id: 'fraud_risk', label: 'Fraud & Reliability Risk' },
      ],
    },
    {
      title: 'Marketplace Engine',
      icon: Wheat,
      items: [
        { id: 'supply', label: 'Supply Inventory Lots' },
        {
          id: 'demand',
          label: 'Buyer Demand & Shortfalls',
          badge: metrics?.attentionAlerts?.unfulfilledDemandCount ? 'Shortfall' : undefined,
        },
        { id: 'matching_engine', label: 'Knapsack Matching Inspector' },
        { id: 'commodity_catalog', label: 'Commodity Standards' },
      ],
    },
    {
      title: 'Fulfillment & Logistics',
      icon: Truck,
      items: [
        { id: 'orders', label: 'Order Execution Tracker' },
        {
          id: 'delays',
          label: 'Logistics & Delay Watchdog',
          badge: metrics?.attentionAlerts?.delayedOrdersCount || 0,
        },
        { id: 'disputes', label: 'Dispute Resolution Hub', badge: metrics?.attentionAlerts?.openDisputesCount || 0 },
      ],
    },
    {
      title: 'Finance & Governance',
      icon: CreditCard,
      items: [
        { id: 'ledger', label: 'Settlement Ledger' },
        { id: 'invoicing', label: 'GST Invoicing & Taxes' },
        { id: 'commission', label: 'Platform Commission Policy' },
      ],
    },
    {
      title: 'Communications & Config',
      icon: Radio,
      items: [
        { id: 'broadcast', label: 'Regional Broadcast Center' },
        { id: 'tickets', label: 'Customer Support Desk' },
        { id: 'feature_flags', label: 'Feature Flags & Runtime' },
        { id: 'audit_trail', label: 'Immutable Audit Trail' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Navbar />

      {!isAdminAuthenticated ? (
        /* ACCESS GATE */
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-black text-white p-8 sm:p-10 rounded-3xl border border-neutral-800 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-neutral-700 shadow-md flex items-center justify-center mx-auto overflow-hidden">
                <img src="/logo.png" alt="AgriLink Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white">
                Platform Operations Command Center
              </h2>
              <p className="text-xs text-neutral-400">
                Authorized platform staff only. Enterprise RBAC and cryptographic session logging enforced.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Administrative Identity
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pavanmanpealli521@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-900 border border-neutral-700 text-white rounded-xl focus:outline-none focus:border-agri-orange-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Security Passkey
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
                className="w-full py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-agri-orange-500/20 mt-2 flex items-center justify-center gap-2"
              >
                {authenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Clearance...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Authenticate as Administrator
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-[11px] text-neutral-500 font-mono">
              Demo Clearance: pavanmanpealli521@gmail.com / admin123
            </div>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED ADMIN CONTROL CENTER */
        <div className="flex-1 flex flex-col">
          {/* Top Operations Action Bar */}
          <div className="bg-white border-b border-neutral-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-16 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 lg:block hidden"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 lg:hidden"
                title="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-extrabold tracking-wider uppercase text-neutral-900">
                  AgriLink Operations Control
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-black text-white font-mono text-[10px] font-bold">
                  {adminUser?.adminSubRole || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <button
                onClick={() => {
                  fetchMetrics();
                  if (activeModule === 'demand') fetchDemand();
                  if (activeModule === 'users') fetchUsers();
                  if (activeModule === 'ledger') fetchLedger();
                }}
                disabled={loadingMetrics}
                className="p-2 sm:px-3 sm:py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-neutral-700 font-bold flex items-center gap-1.5 transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin text-agri-orange-500' : ''}`} />
                <span className="hidden md:inline">Sync Data</span>
              </button>

              <button
                onClick={handleReSeed}
                className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Database className="w-3.5 h-3.5 text-agri-orange-500" />
                <span className="hidden md:inline">Re-Seed Demo Data</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {seedingStatus && (
            <div className="bg-agri-orange-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in">
              <Sparkles className="w-4 h-4 animate-spin" /> {seedingStatus}
            </div>
          )}

          {/* Main Layout: Sidebar + Viewport */}
          <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
            {/* COLLAPSIBLE SIDEBAR */}
            <aside
              className={`${
                sidebarOpen ? 'w-64' : 'w-16'
              } shrink-0 bg-white border-r border-neutral-200 transition-all duration-200 hidden lg:flex flex-col py-6 overflow-y-auto max-h-[calc(100vh-120px)] sticky top-28`}
            >
              <div className="space-y-6 px-3">
                {navSections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    {sidebarOpen && (
                      <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">
                        {section.title}
                      </div>
                    )}
                    {section.items.map((item) => {
                      const isActive = activeModule === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveModule(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-black text-white shadow-xs'
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                          }`}
                          title={item.label}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <section.icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-agri-orange-400' : 'text-neutral-500'
                              }`}
                            />
                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                          </div>
                          {sidebarOpen && item.badge !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                isActive
                                  ? 'bg-agri-orange-500 text-white'
                                  : typeof item.badge === 'string'
                                  ? 'bg-red-100 text-red-700'
                                  : Number(item.badge) > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </aside>

            {/* MOBILE NAVIGATION DRAWER */}
            {mobileMenuOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div
                  className="w-72 bg-white h-full p-4 overflow-y-auto space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <span className="font-extrabold text-sm text-black">AgriLink Navigation</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-neutral-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {navSections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                        {section.title}
                      </div>
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveModule(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
                            activeModule === item.id ? 'bg-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-agri-orange-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN OPERATIONS WORKSPACE */}
            <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
              {/* ATTENTION REQUIRED BANNER (Real-time operational alerts) */}
              {metrics?.attentionAlerts && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {metrics.attentionAlerts.unfulfilledDemandCount > 0 && (
                    <div
                      onClick={() => setActiveModule('demand')}
                      className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 hover:border-amber-300 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-amber-900">Procurement Shortfall</div>
                          <div className="text-[11px] text-amber-700">Multi-farmer aggregation needed</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-500" />
                    </div>
                  )}

                  {metrics.attentionAlerts.delayedOrdersCount > 0 && (
                    <div
                      onClick={() => setActiveModule('delays')}
                      className="p-3.5 rounded-2xl bg-red-50 border border-red-200 hover:border-red-300 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-red-900">Delayed Deliveries</div>
                          <div className="text-[11px] text-red-700">
                            {metrics.attentionAlerts.delayedOrdersCount} orders past ETA
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-500" />
                    </div>
                  )}

                  {metrics.attentionAlerts.openDisputesCount > 0 && (
                    <div
                      onClick={() => setActiveModule('disputes')}
                      className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-orange-900">Open Disputes</div>
                          <div className="text-[11px] text-orange-700">Commercial claims awaiting review</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-orange-500" />
                    </div>
                  )}

                  {metrics.attentionAlerts.pendingKycCount > 0 && (
                    <div
                      onClick={() => setActiveModule('kyc')}
                      className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-blue-900">Pending KYC Queue</div>
                          <div className="text-[11px] text-blue-700">
                            {metrics.attentionAlerts.pendingKycCount} documents submitted
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                </div>
              )}

              {/* MODULE 1: COMMAND CENTER (OVERVIEW) */}
              {activeModule === 'overview' && metrics && (
                <div className="space-y-6">
                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Gross GMV
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-black mt-1">
                        {formatCurrency(metrics.counts.totalGMV)}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        Platform Comm: {formatCurrency(metrics.counts.platformRevenue)}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-bold text-agri-orange-600 uppercase tracking-wider">
                        Available Supply
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-agri-orange-500 mt-1">
                        {formatQuantity(metrics.counts.totalAvailableSupplyKg)}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {metrics.counts.totalListings} Active Lots
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Open Demand
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-black mt-1">
                        {formatQuantity(metrics.counts.totalOpenDemandKg)}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {metrics.counts.totalRequirements} Procurement Needs
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Matches Computed
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-black mt-1">
                        {metrics.counts.totalMatches}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">Knapsack Engine</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Total Users
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-black mt-1">
                        {metrics.counts.totalUsers}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {metrics.counts.totalFarmers} Farmers, {metrics.counts.totalBuyers} Buyers
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Execution Orders
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-black mt-1">
                        {metrics.counts.totalOrders}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {metrics.counts.totalDisputes} Commercial Disputes
                      </div>
                    </div>
                  </div>

                  {/* System Health Quick Card */}
                  <div className="bg-white p-5 rounded-3xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black text-agri-orange-500 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-black">Cluster Health & Latency</h3>
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                            HEALTHY
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          MongoDB ping: {metrics.systemHealth?.databaseLatencyMs || 24}ms • Memory:{' '}
                          {metrics.systemHealth?.memoryHeapUsedMB || 128}MB • Node Uptime:{' '}
                          {Math.round((metrics.systemHealth?.nodeUptimeSeconds || 3600) / 60)} mins
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveModule('system_health')}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Server className="w-3.5 h-3.5" /> Full Observability
                    </button>
                  </div>

                  {/* Recent Operations Audit Stream */}
                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-sm text-black">
                          Real-Time Security & Audit Feed
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Cryptographically logged operations across farmer, buyer, and administrative actors
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModule('audit_trail')}
                        className="text-xs font-bold text-agri-orange-600 hover:underline"
                      >
                        View All ({metrics.recentAuditLogs?.length || 0})
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                            <th className="pb-3">Timestamp</th>
                            <th className="pb-3">Actor Role</th>
                            <th className="pb-3">Action</th>
                            <th className="pb-3">Target Resource</th>
                            <th className="pb-3">Reason / Justification</th>
                            <th className="pb-3">Status</th>
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
                              <td className="py-3 text-neutral-500 text-[11px] truncate max-w-xs">
                                {log.reason || 'Standard transaction'}
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                  {log.status || 'SUCCESS'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2: SYSTEM HEALTH & UPTIME */}
              {activeModule === 'system_health' && metrics && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">System Observability & Runtime Health</h2>
                    <p className="text-xs text-neutral-500">
                      Live cluster metrics, database read/write latency, and memory consumption
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-3xl bg-white border border-neutral-200">
                      <div className="flex items-center justify-between text-neutral-500 mb-2">
                        <span className="text-xs font-bold uppercase">MongoDB Atlas Ping</span>
                        <Database className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-3xl font-black text-neutral-900">
                        {metrics.systemHealth?.databaseLatencyMs || 18} ms
                      </div>
                      <p className="text-xs text-green-700 font-semibold mt-1">
                        High Availability Replica Set • Connected
                      </p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-neutral-200">
                      <div className="flex items-center justify-between text-neutral-500 mb-2">
                        <span className="text-xs font-bold uppercase">V8 Heap Memory</span>
                        <Cpu className="w-4 h-4 text-agri-orange-500" />
                      </div>
                      <div className="text-3xl font-black text-neutral-900">
                        {metrics.systemHealth?.memoryHeapUsedMB || 112} MB
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Within optimal container quota (512 MB)</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-neutral-200">
                      <div className="flex items-center justify-between text-neutral-500 mb-2">
                        <span className="text-xs font-bold uppercase">Process Uptime</span>
                        <Clock className="w-4 h-4 text-neutral-700" />
                      </div>
                      <div className="text-3xl font-black text-neutral-900">
                        {Math.floor((metrics.systemHealth?.nodeUptimeSeconds || 7200) / 3600)}h{' '}
                        {Math.floor(((metrics.systemHealth?.nodeUptimeSeconds || 7200) % 3600) / 60)}m
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Zero unhandled process crashes</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-3">
                    <h3 className="font-extrabold text-sm text-black">Telemetry Checkpoints</h3>
                    <div className="space-y-2 text-xs">
                      {[
                        { name: 'Core API Gateway', status: '200 OK', latency: `${metrics?.systemHealth?.executionTimeMs || 12}ms`, state: 'ONLINE' },
                        { name: 'MongoDB Atlas Ping', status: '200 OK', latency: `${metrics?.systemHealth?.databaseLatencyMs || 18}ms`, state: 'CONNECTED' },
                        { name: 'Node.js V8 Engine Heap', status: 'HEALTHY', latency: `${metrics?.systemHealth?.memoryHeapUsedMB || 112}MB`, state: 'OPTIMAL' },
                        { name: 'Cluster Process Uptime', status: 'RUNNING', latency: `${Math.round((metrics?.systemHealth?.nodeUptimeSeconds || 3600) / 60)} mins`, state: 'ACTIVE' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between"
                        >
                          <div className="font-bold text-neutral-800">{item.name}</div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-neutral-500">{item.latency}</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                              {item.state}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 3: INTEGRATIONS CONSOLE */}
              {activeModule === 'integrations' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Third-Party & Auxiliary Integrations</h2>
                    <p className="text-xs text-neutral-500">
                      External services connectivity status without exposing sensitive credentials or private tokens
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {[
                      {
                        name: 'MongoDB Atlas',
                        purpose: 'Primary multi-tenant ACID document store',
                        status: 'CONNECTED',
                        endpoint: 'agrilink.1ftppaj.mongodb.net',
                        authMode: 'SCRAM-SHA-256 TLS 1.3',
                      },
                      {
                        name: 'Firebase & NextAuth Gateway',
                        purpose: 'Authentication identity provider & phone OTP verification',
                        status: 'OPERATIONAL',
                        endpoint: 'agrilink-scet.firebaseapp.com',
                        authMode: 'OAuth2 / RS256 Bearer Tokens',
                      },
                      {
                        name: 'WhatsApp Business API Webhooks',
                        purpose: 'Farmer regional language dispatch and counter-offer SMS/WhatsApp alerts',
                        status: 'READY (LOCAL SIMULATOR)',
                        endpoint: 'api.whatsapp.com/v16.0',
                        authMode: 'HMAC-SHA256 Webhook Signature',
                      },
                      {
                        name: 'Cloudinary / S3 Image Storage',
                        purpose: 'High-resolution harvest photo uploads & quality inspection logs',
                        status: 'CONFIGURED',
                        endpoint: 'res.cloudinary.com/agrilink',
                        authMode: 'API Signature v2',
                      },
                      {
                        name: 'Payment Settlement Ledger',
                        purpose: 'B2B bank account settlement & escrow clearing records',
                        status: 'INTERNAL LEDGER',
                        endpoint: 'clearing.agrilink.internal',
                        authMode: 'Immutable Audit Trail',
                      },
                    ].map((integ, idx) => (
                      <div key={idx} className="p-5 rounded-3xl bg-white border border-neutral-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-extrabold text-sm text-black">{integ.name}</div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            {integ.status}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-xs">{integ.purpose}</p>
                        <div className="pt-2 border-t border-neutral-100 flex flex-col gap-1 font-mono text-[11px] text-neutral-400">
                          <div>Host: {integ.endpoint}</div>
                          <div>Auth: {integ.authMode}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODULE 4: UNIFIED USER DIRECTORY */}
              {activeModule === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-black">Unified User Directory</h2>
                      <p className="text-xs text-neutral-500">
                        Manage farmers, enterprise buyers, and administrative staff with granular sub-roles
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                          placeholder="Search name, email, phone..."
                          className="pl-8 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-black"
                        />
                      </div>

                      <select
                        value={userRoleFilter}
                        onChange={(e) => {
                          setUserRoleFilter(e.target.value);
                          setTimeout(fetchUsers, 50);
                        }}
                        className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="ALL">All Roles</option>
                        <option value="FARMER">Farmers Only</option>
                        <option value="BUYER">Buyers Only</option>
                        <option value="ADMIN">Admins Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 text-neutral-400 font-semibold bg-neutral-50/50">
                            <th className="p-4">User</th>
                            <th className="p-4">Role & Sub-Role</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">KYC Status</th>
                            <th className="p-4">Account Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {loadingUsers ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-neutral-400">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading users...
                              </td>
                            </tr>
                          ) : usersList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-neutral-400">
                                No users matched your search criteria.
                              </td>
                            </tr>
                          ) : (
                            usersList.map((usr: any) => (
                              <tr key={usr._id} className="hover:bg-neutral-50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-black">{usr.name}</div>
                                  <div className="text-[11px] text-neutral-500 font-mono">{usr.email}</div>
                                  <div className="text-[11px] text-neutral-400">{usr.phone || 'No phone'}</div>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      usr.role === 'FARMER'
                                        ? 'bg-green-100 text-green-800'
                                        : usr.role === 'BUYER'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-black text-white'
                                    }`}
                                  >
                                    {usr.role}
                                  </span>
                                  {usr.adminSubRole && (
                                    <div className="text-[10px] font-mono text-neutral-500 mt-1">
                                      {usr.adminSubRole}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 text-neutral-600">{usr.location}</td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      usr.kycStatus === 'VERIFIED'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    {usr.kycStatus || 'VERIFIED'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      usr.accountStatus === 'SUSPENDED'
                                        ? 'bg-red-100 text-red-700'
                                        : usr.accountStatus === 'BANNED'
                                        ? 'bg-black text-white'
                                        : 'bg-neutral-100 text-neutral-800'
                                    }`}
                                  >
                                    {usr.accountStatus || 'ACTIVE'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedItem(usr);
                                      setActionStatusInput(usr.accountStatus || 'ACTIVE');
                                      setModalType('USER_STATUS');
                                    }}
                                    className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Edit Status
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 5: KYC VERIFICATION QUEUE */}
              {activeModule === 'kyc' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">KYC Document Verification Queue</h2>
                    <p className="text-xs text-neutral-500">
                      Review farmer land titles, FPO registration certificates, and wholesale buyer GSTIN credentials
                    </p>
                  </div>

                  <div className="space-y-3">
                    {loadingKyc ? (
                      <div className="p-12 text-center text-neutral-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading KYC queue...
                      </div>
                    ) : kycQueue.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center text-neutral-500 text-xs">
                        All farmer and buyer onboarding submissions have been verified. Zero backlog.
                      </div>
                    ) : (
                      kycQueue.map((item: any) => (
                        <div
                          key={item._id}
                          className="p-5 rounded-3xl bg-white border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-black text-sm">{item.name}</span>
                              <span className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-bold">
                                {item.role}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                {item.kycStatus}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500">
                              {item.email} • {item.location} • Submitted{' '}
                              {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                            </div>
                            {item.bankDetails ? (
                              <div className="text-[11px] font-mono text-neutral-400">
                                Bank: {item.bankDetails.bankName || 'Verified Bank'} • A/C:{' '}
                                {item.bankDetails.accountNumber ? `••••${item.bankDetails.accountNumber.slice(-4)}` : 'Submitted'}
                              </div>
                            ) : (
                              <div className="text-[11px] text-neutral-400">Bank credentials pending submission</div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setActionStatusInput('VERIFIED');
                                setModalType('KYC_REVIEW');
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve KYC
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setActionStatusInput('REJECTED');
                                setModalType('KYC_REVIEW');
                              }}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* MODULE 6: FRAUD & RELIABILITY RISK */}
              {activeModule === 'fraud_risk' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Fraud & Reliability Risk Monitor</h2>
                    <p className="text-xs text-neutral-500">
                      Calculates automated reliability scoring based on order completion, counter-offer compliance, and dispute frequency
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-3xl bg-white border border-neutral-200">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Platform Trust Index</span>
                      <div className="text-3xl font-black text-green-600 mt-1">
                        {metrics?.counts?.totalOrders
                          ? `${Math.round(
                              ((metrics.counts.totalOrders - (metrics.counts.totalDisputes || 0)) /
                                metrics.counts.totalOrders) *
                                100
                            )}%`
                          : '100%'}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Fulfillment adherence rate</p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-neutral-200">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Dispute Frequency</span>
                      <div className="text-3xl font-black text-black mt-1">
                        {metrics?.counts?.totalDisputes || 0}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Out of {metrics?.counts?.totalOrders || 0} orders (
                        {metrics?.counts?.totalOrders
                          ? Math.round(((metrics.counts.totalDisputes || 0) / metrics.counts.totalOrders) * 100)
                          : 0}
                        %)
                      </p>
                    </div>

                    <div className="p-5 rounded-3xl bg-white border border-neutral-200">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">Accounts Under Watch</span>
                      <div className="text-3xl font-black text-amber-600 mt-1">0</div>
                      <p className="text-xs text-neutral-500 mt-1">Flagged for excessive cancellation</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
                    <h3 className="font-extrabold text-sm text-black">Participant Reliability Scores</h3>
                    <div className="space-y-3">
                      {usersList.slice(0, 8).map((usr: any) => (
                        <div
                          key={usr._id}
                          className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-black">{usr.name}</div>
                            <div className="text-[11px] text-neutral-500">
                              {usr.role} • Cancellations: {usr.cancellationCount || 0} • Disputes:{' '}
                              {usr.disputeCount || 0}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-extrabold text-green-700">
                                {usr.reliabilityScore || 95}% Reliability
                              </div>
                              <div className="text-[10px] text-neutral-400">Score Rating: EXCELLENT</div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedItem(usr);
                                setActionStatusInput(usr.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED');
                                setModalType('USER_STATUS');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold border border-neutral-300"
                            >
                              {usr.accountStatus === 'SUSPENDED' ? 'Unsuspend' : 'Flag'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 7: SUPPLY INVENTORY LOTS */}
              {activeModule === 'supply' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-black">Supply Inventory Lots</h2>
                      <p className="text-xs text-neutral-500">
                        Aggregated farm yields and physical lots available for multi-supplier knapsack matching
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 text-neutral-400 font-semibold bg-neutral-50/50">
                            <th className="p-4">Farmer / Producer</th>
                            <th className="p-4">Commodity</th>
                            <th className="p-4">Grade</th>
                            <th className="p-4">Available Qty</th>
                            <th className="p-4">Expected Price</th>
                            <th className="p-4">Hub Location</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {metrics?.listingsData?.map((item: any) => (
                            <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                              <td className="p-4 font-bold text-black">{item.farmerName}</td>
                              <td className="p-4 font-medium text-black">{item.product}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100">
                                  {item.qualityGrade}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-black">{formatQuantity(item.availableQuantity)}</td>
                              <td className="p-4 font-bold text-agri-orange-600">₹{item.expectedPricePerUnit}/kg</td>
                              <td className="p-4 text-neutral-500">{item.location}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 8: BUYER DEMAND & SHORTFALL TRACKER */}
              {activeModule === 'demand' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Buyer Procurement Demands & Shortfall Tracker</h2>
                    <p className="text-xs text-neutral-500">
                      Calculates exact shortfall quantities between buyer procurement targets and available individual farm harvests
                    </p>
                  </div>

                  <div className="space-y-4">
                    {loadingDemand ? (
                      <div className="p-12 text-center text-neutral-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Computing shortfall and matching
                        matrix...
                      </div>
                    ) : demandList.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center text-neutral-500 text-xs">
                        No open buyer procurement requirements at this moment.
                      </div>
                    ) : (
                      demandList.map((req: any) => {
                        const required = req.requiredQuantity || 0;
                        const matched = req.matchedQuantity || 0;
                        const shortfall = Math.max(0, required - matched);
                        const percentFilled = required > 0 ? Math.min(100, Math.round((matched / required) * 100)) : 0;

                        return (
                          <div
                            key={req._id}
                            className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-4 hover:border-neutral-300 transition-all shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-base text-black">{req.product}</span>
                                  <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                                    Grade {req.qualityGrade}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                                    {req.status}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-500 mt-1">
                                  Buyer: <strong>{req.buyerName}</strong> • Delivery to: {req.deliveryLocation} • Target
                                  Price: <strong>₹{req.targetPricePerUnit}/kg</strong>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedItem(req);
                                    setModalType('KNAPSACK_TRIGGER');
                                  }}
                                  className="px-3.5 py-2 bg-agri-orange-500 hover:bg-agri-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-agri-orange-500/20"
                                >
                                  <Sparkles className="w-3.5 h-3.5" /> Find Additional Supply
                                </button>
                              </div>
                            </div>

                            {/* Shortfall Breakdown Progress */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">
                                  Required Volume
                                </span>
                                <div className="text-lg font-black text-black mt-0.5">
                                  {formatQuantity(required)}
                                </div>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                                <span className="text-[10px] font-bold text-green-600 uppercase">
                                  Current Matched Supply
                                </span>
                                <div className="text-lg font-black text-green-700 mt-0.5">
                                  {formatQuantity(matched)} ({percentFilled}%)
                                </div>
                                <div className="text-[10px] text-neutral-500">
                                  {req.supplierCount || 1} farm suppliers combined
                                </div>
                              </div>

                              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                                <span className="text-[10px] font-bold text-red-600 uppercase">
                                  Unfulfilled Shortfall
                                </span>
                                <div className="text-lg font-black text-red-600 mt-0.5">
                                  {formatQuantity(shortfall)}
                                </div>
                                <div className="text-[10px] text-neutral-500">
                                  {shortfall === 0 ? 'Full capacity achieved' : 'Needs additional farmers'}
                                </div>
                              </div>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold text-neutral-500">
                                <span>Fulfillment Allocation</span>
                                <span>{percentFilled}% fulfilled</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    percentFilled >= 100 ? 'bg-green-500' : 'bg-agri-orange-500'
                                  }`}
                                  style={{ width: `${percentFilled}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* MODULE 9: KNAPSACK MATCHING ENGINE INSPECTOR */}
              {activeModule === 'matching_engine' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">
                      Explainable 6-Factor Knapsack Matching Inspector
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Evaluates compatibility using deterministic rule-based algorithms (Commodity alias, Quantity coverage, Grade, Distance, Delivery date, Price delta)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {[
                      {
                        title: '1. Commodity Normalization',
                        weight: '25% Weight',
                        desc: 'Cross-lingual alias dictionary (e.g. Ullipaya / Pyaaz -> Onion, Tamatar -> Tomato). Zero false-negatives from regional vernacular.',
                      },
                      {
                        title: '2. Quantity Coverage (Knapsack)',
                        weight: '20% Weight',
                        desc: 'Evaluates single-farmer lots first. If insufficient, aggregates complementary smallholder yields to satisfy bulk industrial orders.',
                      },
                      {
                        title: '3. Quality Grade Alignment',
                        weight: '15% Weight',
                        desc: 'Validates Grade A / B / C specifications against physical lab parameters and harvest inspection photos.',
                      },
                      {
                        title: '4. Geodesic Hub Distance',
                        weight: '15% Weight',
                        desc: 'Calculates transit radius from farm gate to buyer procurement hub to minimize transit spoilage and freight cost.',
                      },
                      {
                        title: '5. Delivery Window Timing',
                        weight: '15% Weight',
                        desc: 'Synchronizes harvest harvest ready dates with buyer intake scheduling windows.',
                      },
                      {
                        title: '6. Price Band Compatibility',
                        weight: '10% Weight',
                        desc: 'Compares expected farm gate price against buyer budget band to ensure high negotiation settlement probability.',
                      },
                    ].map((factor, idx) => (
                      <div key={idx} className="p-5 rounded-3xl bg-white border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-black">{factor.title}</span>
                          <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-bold">
                            {factor.weight}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-xs leading-relaxed">{factor.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-3xl bg-black text-white space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-agri-orange-400">
                      <Sparkles className="w-4 h-4" /> Multi-Supplier Aggregation Protocol
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      When an institutional buyer places a demand for 10,000 kg and the largest available farmer lot is only 4,000 kg,
                      the Knapsack Aggregation Algorithm pools complementary producers in the same regional cluster into a unified
                      proposal, allowing smallholders to collectively fulfill corporate enterprise demand.
                    </p>
                  </div>
                </div>
              )}

              {/* MODULE 10: COMMODITY CATALOG */}
              {activeModule === 'commodity_catalog' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Commodity Catalog & Standardization</h2>
                    <p className="text-xs text-neutral-500">
                      Vernacular commodity aliases, shelf-life tolerances, and market benchmark reference pricing
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {[
                      {
                        name: 'Onion (Allium cepa)',
                        aliases: 'Onion, Onions, Ullipaya, Ullipayalu, Pyaaz, Pyaz, Kanda',
                        grades: 'Grade A (Export / Retail), Grade B (Commercial), Grade C (Processing)',
                        priceBand: '₹22 - ₹32 / kg',
                      },
                      {
                        name: 'Tomato (Solanum lycopersicum)',
                        aliases: 'Tomato, Tomatoes, Tamata, Tamatar, Tamakaya',
                        grades: 'Grade A (Firm Table), Grade B (Sauce / Puree), Grade C (Pulp)',
                        priceBand: '₹18 - ₹28 / kg',
                      },
                      {
                        name: 'Potato (Solanum tuberosum)',
                        aliases: 'Potato, Potatoes, Aloo, Alu, Bangaladumpa, Batata',
                        grades: 'Grade A (Chips / Wafers), Grade B (Table Potato), Grade C (Seed)',
                        priceBand: '₹20 - ₹30 / kg',
                      },
                      {
                        name: 'Green Chilli (Capsicum annuum)',
                        aliases: 'Chilli, Chillies, Mirchi, Mirapakaya, Pacha Mirchi',
                        grades: 'Grade A (Fresh Green), Grade B (Standard)',
                        priceBand: '₹35 - ₹55 / kg',
                      },
                      {
                        name: 'Carrot (Daucus carota)',
                        aliases: 'Carrot, Carrots, Gajar',
                        grades: 'Grade A (Uniform Orange), Grade B (Standard)',
                        priceBand: '₹25 - ₹40 / kg',
                      },
                      {
                        name: 'Cabbage (Brassica oleracea)',
                        aliases: 'Cabbage, Cabbages, Patta Gobi, Cabij',
                        grades: 'Grade A (Dense Head), Grade B (Loose)',
                        priceBand: '₹14 - ₹22 / kg',
                      },
                    ].map((comm, idx) => (
                      <div key={idx} className="p-5 rounded-3xl bg-white border border-neutral-200 space-y-2">
                        <div className="font-black text-black text-sm">{comm.name}</div>
                        <div className="text-[11px] text-neutral-500">
                          <strong>Aliases:</strong> {comm.aliases}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          <strong>Grades:</strong> {comm.grades}
                        </div>
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Benchmark Band</span>
                          <span className="font-extrabold text-agri-orange-600">{comm.priceBand}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODULE 11: ORDERS TRACKER */}
              {activeModule === 'orders' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Order Execution & Fulfillment Tracker</h2>
                    <p className="text-xs text-neutral-500">
                      6-stage commercial milestone progression from farm gate packing to destination delivery
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 text-neutral-400 font-semibold bg-neutral-50/50">
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Buyer</th>
                            <th className="p-4">Total Qty</th>
                            <th className="p-4">Gross Value</th>
                            <th className="p-4">Current Milestone</th>
                            <th className="p-4">Order Status</th>
                            <th className="p-4 text-right">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {metrics?.ordersData?.map((item: any) => (
                            <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-black">{item.orderNumber}</td>
                              <td className="p-4 font-bold text-black">{item.buyerName}</td>
                              <td className="p-4 font-medium">{formatQuantity(item.totalQuantity)}</td>
                              <td className="p-4 font-black text-black">{formatCurrency(item.totalValue)}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">
                                  {item.currentFulfillmentStage || 'ORDER_CONFIRMED'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                    item.orderStatus === 'DELIVERED'
                                      ? 'bg-green-100 text-green-800'
                                      : item.orderStatus === 'DISPUTED'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-black text-white'
                                  }`}
                                >
                                  {item.orderStatus}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setActiveInvoiceOrder(item)}
                                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                                >
                                  <Receipt className="w-3.5 h-3.5" /> View Tax Invoice
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 12: LOGISTICS DELAYS WATCHDOG */}
              {activeModule === 'delays' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Logistics & Transit Delay Watchdog</h2>
                    <p className="text-xs text-neutral-500">
                      Identifies orders that have surpassed estimated delivery dates or are stuck at highway checkpoints
                    </p>
                  </div>

                  {(() => {
                    const now = new Date();
                    const delayedOrders =
                      metrics?.ordersData?.filter(
                        (o: any) =>
                          o.orderStatus !== 'DELIVERED' &&
                          o.orderStatus !== 'CANCELLED' &&
                          new Date(o.deliveryDate) < now
                      ) || [];

                    if (delayedOrders.length === 0) {
                      return (
                        <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center text-neutral-500 text-xs">
                          All active dispatches are currently moving on schedule. Zero deliveries have exceeded their promised delivery dates.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {delayedOrders.map((ord: any) => {
                          const daysOverdue = Math.max(
                            1,
                            Math.floor((now.getTime() - new Date(ord.deliveryDate).getTime()) / (1000 * 60 * 60 * 24))
                          );
                          return (
                            <div
                              key={ord._id}
                              className="p-5 rounded-3xl bg-white border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-black text-sm">{ord.orderNumber}</span>
                                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                                    {daysOverdue} Days Overdue
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-700">
                                    {ord.orderStatus}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-600">
                                  Buyer: <strong>{ord.buyerName}</strong> • Destination: {ord.deliveryLocation} • Total:{' '}
                                  <strong>{formatQuantity(ord.totalQuantity)}</strong>
                                </div>
                                <div className="text-[11px] text-red-500 font-medium">
                                  Promised Delivery Date: {new Date(ord.deliveryDate).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    alert(`Logistics priority dispatch ping sent for Order ${ord.orderNumber}`);
                                  }}
                                  className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                >
                                  <Send className="w-3.5 h-3.5" /> Transporter Ping
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* MODULE 13: COMMERCIAL DISPUTE RESOLUTION HUB */}
              {activeModule === 'disputes' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Commercial Dispute Resolution Hub</h2>
                    <p className="text-xs text-neutral-500">
                      Arbitrate quality claims, weight variances, and settlement deductions with immutable audit logs
                    </p>
                  </div>

                  <div className="space-y-3">
                    {loadingDisputes ? (
                      <div className="p-12 text-center text-neutral-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading disputes...
                      </div>
                    ) : disputesList.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center text-neutral-500 text-xs">
                        No active commercial disputes filed across any active orders.
                      </div>
                    ) : (
                      disputesList.map((dsp: any) => (
                        <div
                          key={dsp._id}
                          className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-sm text-black">
                                  {dsp.disputeNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                                  {dsp.status}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 text-[10px] font-bold">
                                  Order #{dsp.orderNumber}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                Initiated by: <strong>{dsp.initiatorName}</strong> (
                                {dsp.initiatorRole})
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[10px] font-bold text-neutral-400 uppercase">Claim Amount</div>
                              <div className="text-base font-black text-red-600">
                                {formatCurrency(dsp.claimedAmount || 0)}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-700">
                            <strong>Claim Details:</strong> {dsp.reason}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                            {dsp.status !== 'RESOLVED' && (
                              <button
                                onClick={() => {
                                  setSelectedItem(dsp);
                                  setActionAmountInput(dsp.claimedAmount || 0);
                                  setModalType('RESOLVE_DISPUTE');
                                }}
                                className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
                              >
                                Adjudicate & Settle
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* MODULE 14: FINANCIAL SETTLEMENT LEDGER */}
              {activeModule === 'ledger' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-black">Financial Settlement Clearing Ledger</h2>
                      <p className="text-xs text-neutral-500">
                        Immutable double-entry transaction journals for payment receipts, supplier payouts, commissions, and GST
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        setActionStatusInput('SUPPLIER_PAYOUT');
                        setModalType('MANUAL_LEDGER_ENTRY');
                      }}
                      className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-agri-orange-500" /> Record Ledger Journal
                    </button>
                  </div>

                  {ledgerData?.summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">Buyer Inflow</span>
                        <div className="text-xl font-black text-black mt-1">
                          {formatCurrency(ledgerData.summary.totalInflow)}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold text-green-600 uppercase">Supplier Payouts</span>
                        <div className="text-xl font-black text-green-700 mt-1">
                          {formatCurrency(ledgerData.summary.totalPayouts)}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold text-agri-orange-600 uppercase">
                          Platform Revenue
                        </span>
                        <div className="text-xl font-black text-agri-orange-600 mt-1">
                          {formatCurrency(ledgerData.summary.totalCommission)}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">GST 18% Accrued</span>
                        <div className="text-xl font-black text-black mt-1">
                          {formatCurrency(ledgerData.summary.totalGST)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 text-neutral-400 font-semibold bg-neutral-50/50">
                            <th className="p-4">Journal Number</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Order Ref</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Counterparty</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {loadingLedger ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-neutral-400">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading ledger...
                              </td>
                            </tr>
                          ) : (
                            ledgerData?.entries?.map((entry: any) => (
                              <tr key={entry._id} className="hover:bg-neutral-50 transition-colors">
                                <td className="p-4 font-mono font-bold text-black">{entry.entryNumber}</td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      entry.type === 'PAYMENT_RECORDED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : entry.type === 'SUPPLIER_PAYOUT'
                                        ? 'bg-green-100 text-green-800'
                                        : entry.type === 'PLATFORM_COMMISSION'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-neutral-100 text-neutral-800'
                                    }`}
                                  >
                                    {entry.type}
                                  </span>
                                </td>
                                <td className="p-4 font-mono text-neutral-600">{entry.orderNumber || '-'}</td>
                                <td className="p-4 font-extrabold text-black">{formatCurrency(entry.amount)}</td>
                                <td className="p-4 text-neutral-600">
                                  {entry.payeeName || entry.payerName || 'Platform Clearing'}
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      entry.status === 'SETTLED'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-neutral-100 text-neutral-800'
                                    }`}
                                  >
                                    {entry.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  {entry.status !== 'SETTLED' && (
                                    <button
                                      onClick={() => {
                                        setSelectedItem(entry);
                                        setModalType('SETTLE_LEDGER_ENTRY');
                                      }}
                                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                      Settle Payout
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 15: GST INVOICING & TAXES */}
              {activeModule === 'invoicing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">GST Tax Invoice Generator & Records</h2>
                    <p className="text-xs text-neutral-500">
                      Standard B2B tax invoices compliant with Indian GST (CGST, SGST, IGST) and HSN agricultural commodities coding
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metrics?.ordersData?.map((ord: any) => (
                      <div
                        key={ord._id}
                        className="p-5 rounded-3xl bg-white border border-neutral-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-black text-sm">{ord.orderNumber}</span>
                          <span className="text-xs font-extrabold text-black">{formatCurrency(ord.totalValue)}</span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Billed to: <strong>{ord.buyerName}</strong> • Delivery: {ord.deliveryLocation}
                        </div>
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                          {(() => {
                            const hsnInfo = getCommodityHsn(ord.items?.[0]?.product);
                            return (
                              <span className="text-[11px] text-neutral-400 font-mono">
                                HSN: {hsnInfo.hsn} ({ord.items?.[0]?.product || 'Produce'})
                              </span>
                            );
                          })()}
                          <button
                            onClick={() => setActiveInvoiceOrder(ord)}
                            className="px-3 py-1 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODULE 16: PLATFORM COMMISSION POLICY */}
              {activeModule === 'commission' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="text-xl font-black text-black">Platform Commission & Settlement Policy</h2>
                    <p className="text-xs text-neutral-500">
                      Runtime fee schedule applied to settled procurement transactions
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Platform Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={platformConfig?.platformCommissionPercent || 2.5}
                        onChange={(e) =>
                          setPlatformConfig({
                            ...platformConfig,
                            platformCommissionPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold focus:outline-none focus:border-black"
                      />
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Applied across all successful match fulfillments (default standard: 2.5%)
                      </p>
                    </div>

                    <button
                      onClick={handleSavePlatformConfig}
                      disabled={configSaving}
                      className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                      {configSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Commission Schedule
                    </button>
                    {configMessage && <div className="text-xs font-bold text-green-700">{configMessage}</div>}
                  </div>
                </div>
              )}

              {/* MODULE 17: REGIONAL BROADCAST CENTER */}
              {activeModule === 'broadcast' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="text-xl font-black text-black">Regional Targeted Broadcast Center</h2>
                    <p className="text-xs text-neutral-500">
                      Transmit agricultural advisories, mandi procurement windows, and weather notices in English, Telugu, and Hindi
                    </p>
                  </div>

                  <form onSubmit={handleSendBroadcast} className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Audience Segment</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'ALL', label: 'All Users (Farmers & Buyers)' },
                          { id: 'FARMER', label: 'Farmers & FPOs Only' },
                          { id: 'BUYER', label: 'Institutional Buyers Only' },
                        ].map((seg) => (
                          <button
                            key={seg.id}
                            type="button"
                            onClick={() => setBroadcastTarget(seg.id as any)}
                            className={`p-3 rounded-xl border text-center font-bold transition-all ${
                              broadcastTarget === seg.id
                                ? 'bg-black text-white border-black'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {seg.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Announcement Subject</label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. Special Guntur Chilli Procurement Window Open"
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-black font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Announcement Message Body</label>
                      <textarea
                        required
                        rows={4}
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="Detail procurement requirements, pricing, or regional advisory..."
                        className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-black leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="urgentCheck"
                        checked={broadcastUrgent}
                        onChange={(e) => setBroadcastUrgent(e.target.checked)}
                        className="rounded border-neutral-300 text-agri-orange-500"
                      />
                      <label htmlFor="urgentCheck" className="font-bold text-neutral-700">
                        Mark as High Priority Bulletin (Instant Banner Notification)
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingBroadcast}
                      className="px-5 py-3 bg-agri-orange-500 hover:bg-agri-orange-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                    >
                      {sendingBroadcast ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Radio className="w-4 h-4" />
                      )}
                      Dispatch Targeted Broadcast
                    </button>
                  </form>
                </div>
              )}

              {/* MODULE 18: SUPPORT HELPDESK TICKETS */}
              {activeModule === 'tickets' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Customer Support Desk</h2>
                    <p className="text-xs text-neutral-500">
                      Manage farmer logistics inquiries, settlement requests, and platform support tickets
                    </p>
                  </div>

                  <div className="space-y-3">
                    {loadingTickets ? (
                      <div className="p-12 text-center text-neutral-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading support tickets...
                      </div>
                    ) : ticketsList.length === 0 ? (
                      <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center text-neutral-500 text-xs">
                        Zero open customer support tickets.
                      </div>
                    ) : (
                      ticketsList.map((t: any) => (
                        <div
                          key={t._id}
                          className="p-5 rounded-3xl bg-white border border-neutral-200 space-y-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-black">{t.ticketNumber}</span>
                              <span className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] font-bold text-neutral-800">
                                {t.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.priority === 'HIGH' || t.priority === 'URGENT'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-neutral-100 text-neutral-800'
                                }`}
                              >
                                {t.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                {t.status}
                              </span>
                            </div>
                            <div className="font-extrabold text-black text-sm">{t.subject}</div>
                            <div className="text-xs text-neutral-500">{t.description}</div>
                            <div className="text-[11px] text-neutral-400">
                              By: {t.userName} ({t.userRole})
                            </div>
                          </div>

                          <div className="shrink-0">
                            {t.status !== 'RESOLVED' && (
                              <button
                                onClick={() => {
                                  setSelectedItem(t);
                                  setActionStatusInput('RESOLVED');
                                  setModalType('RESOLVE_TICKET');
                                }}
                                className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* MODULE 19: FEATURE FLAGS & RUNTIME CONFIG */}
              {activeModule === 'feature_flags' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="text-xl font-black text-black">Feature Flags & System Configuration</h2>
                    <p className="text-xs text-neutral-500">
                      Enable or disable features dynamically without deploying new application releases
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-neutral-200 space-y-4">
                    {[
                      {
                        key: 'multiSupplierMatching',
                        label: 'Multi-Supplier Aggregation Protocol',
                        desc: 'Allows the knapsack engine to combine multiple farmer lots to satisfy large buyer requirements.',
                      },
                      {
                        key: 'whatsAppAlerts',
                        label: 'WhatsApp Dispatch & Counter-Offer Notifications',
                        desc: 'Dispatches instant mobile alerts to farmers on regional trade milestones.',
                      },
                      {
                        key: 'onlineEscrow',
                        label: 'B2B Clearing Settlement Enforcement',
                        desc: 'Requires buyer settlement verification prior to dispatch milestone release.',
                      },
                    ].map((flag) => {
                      const isEnabled = platformConfig?.featureFlags?.[flag.key] ?? true;
                      return (
                        <div
                          key={flag.key}
                          className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="font-extrabold text-black text-xs">{flag.label}</div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">{flag.desc}</div>
                          </div>
                          <button
                            onClick={() => {
                              const currentFlags = platformConfig?.featureFlags || {};
                              setPlatformConfig({
                                ...platformConfig,
                                featureFlags: {
                                  ...currentFlags,
                                  [flag.key]: !isEnabled,
                                },
                              });
                            }}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                              isEnabled ? 'bg-black justify-end' : 'bg-neutral-300 justify-start'
                            }`}
                          >
                            <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
                          </button>
                        </div>
                      );
                    })}

                    <button
                      onClick={handleSavePlatformConfig}
                      disabled={configSaving}
                      className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                      {configSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Feature Flags
                    </button>
                    {configMessage && <div className="text-xs font-bold text-green-700">{configMessage}</div>}
                  </div>
                </div>
              )}

              {/* MODULE 20: IMMUTABLE AUDIT TRAIL EXPLORER */}
              {activeModule === 'audit_trail' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-black">Immutable Operations Audit Trail</h2>
                    <p className="text-xs text-neutral-500">
                      Cryptographic record of every state transition, KYC verification, order status override, and financial mutation
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-100 text-neutral-400 font-semibold bg-neutral-50/50">
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Actor</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Resource</th>
                            <th className="p-4">Reason</th>
                            <th className="p-4">Trace Payload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                          {metrics?.recentAuditLogs?.map((log: any, idx: number) => (
                            <tr key={log._id || idx} className="hover:bg-neutral-50 transition-colors">
                              <td className="p-4 text-neutral-500 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-black">{log.actorRole}</div>
                                <div className="text-[10px] text-neutral-400">{log.actorEmail || log.actorId}</div>
                              </td>
                              <td className="p-4 font-bold text-neutral-900">{log.action}</td>
                              <td className="p-4 text-neutral-600">{log.resource}</td>
                              <td className="p-4 text-neutral-700 font-sans max-w-xs truncate">
                                {log.reason || 'Operational execution'}
                              </td>
                              <td className="p-4 text-neutral-400 max-w-xs truncate">
                                {JSON.stringify(log.details || log.afterState || {})}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN ACTION CONFIRMATION WITH REASON */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-neutral-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-agri-orange-500" />
                <h3 className="font-black text-sm text-black uppercase tracking-wider">
                  Admin Action Verification
                </h3>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  actionFeedback.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {actionFeedback.message}
              </div>
            )}

            <div className="text-xs text-neutral-600 space-y-2">
              <p>
                Target Operation: <strong>{modalType}</strong>
              </p>
              {selectedItem && (
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 font-mono text-[11px] text-neutral-600">
                  Target: {selectedItem.name || selectedItem.orderNumber || selectedItem.product || selectedItem._id}
                </div>
              )}
            </div>

            {/* Sub-inputs depending on action */}
            {modalType === 'USER_STATUS' && (
              <div>
                <label className="block font-bold text-neutral-700 text-xs mb-1">New Account Status</label>
                <select
                  value={actionStatusInput}
                  onChange={(e) => setActionStatusInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="BANNED">BANNED</option>
                </select>
              </div>
            )}

            {(modalType === 'RESOLVE_DISPUTE' || modalType === 'MANUAL_LEDGER_ENTRY') && (
              <div>
                <label className="block font-bold text-neutral-700 text-xs mb-1">Settlement Amount (INR)</label>
                <input
                  type="number"
                  value={actionAmountInput}
                  onChange={(e) => setActionAmountInput(Number(e.target.value))}
                  placeholder="Enter amount in ₹"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                />
              </div>
            )}

            {/* MANDATORY REASON FIELD */}
            <div>
              <label className="block font-bold text-neutral-700 text-xs mb-1">
                Operational Reason / Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for audit log (minimum 5 characters)..."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-black"
              />
              <span className="text-[10px] text-neutral-400">
                Logged with your administrator credentials and timestamp in immutable storage.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAdminAction}
                disabled={submittingAction}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {submittingAction && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Log Mutation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE GST TAX INVOICE MODAL */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 border border-neutral-200 flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="AgriLink Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="font-black text-base text-black">TAX INVOICE</h2>
                  <p className="text-[11px] text-neutral-500">AgriLink B2B Direct Farm Trade Platform</p>
                </div>
              </div>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-neutral-400">Invoice Details</div>
                <div className="font-mono font-bold text-black">Invoice: INV-{activeInvoiceOrder.orderNumber}</div>
                <div className="text-neutral-600">Date: {new Date(activeInvoiceOrder.createdAt).toLocaleDateString()}</div>
                <div className="text-neutral-600">GSTIN: 36AAACA0000A1Z5</div>
              </div>

              <div className="space-y-1 text-right">
                <div className="text-[10px] font-bold uppercase text-neutral-400">Buyer Information</div>
                <div className="font-bold text-black">{activeInvoiceOrder.buyerName}</div>
                <div className="text-neutral-600">Destination: {activeInvoiceOrder.deliveryLocation}</div>
                <div className="text-neutral-600">Supply Route: Direct Farm Hub Delivery</div>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold">
                  <tr>
                    <th className="p-3">HSN</th>
                    <th className="p-3">Commodity & Grade</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3 text-right">Taxable Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="p-3 font-mono">
                      {getCommodityHsn(activeInvoiceOrder.items?.[0]?.product).hsn}
                    </td>
                    <td className="p-3 font-bold text-black">
                      {activeInvoiceOrder.items?.[0]?.product || 'Fresh Produce'} (Grade{' '}
                      {activeInvoiceOrder.items?.[0]?.qualityGrade || 'A'})
                    </td>
                    <td className="p-3">{formatQuantity(activeInvoiceOrder.totalQuantity)}</td>
                    <td className="p-3">
                      ₹{Math.round(activeInvoiceOrder.totalValue / (activeInvoiceOrder.totalQuantity || 1))}/kg
                    </td>
                    <td className="p-3 text-right font-bold text-black">
                      {formatCurrency(activeInvoiceOrder.totalValue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal (Farm Gate Value)</span>
                <span className="font-bold">{formatCurrency(activeInvoiceOrder.totalValue)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Platform Facilitation Fee (2.5%)</span>
                <span>{formatCurrency(Math.round(activeInvoiceOrder.totalValue * 0.025))}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Integrated GST (IGST 5% on Agricultural Services)</span>
                <span>{formatCurrency(Math.round(activeInvoiceOrder.totalValue * 0.025 * 0.05))}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 flex justify-between font-black text-sm text-black">
                <span>Total Commercial Settlement</span>
                <span>{formatCurrency(activeInvoiceOrder.totalValue)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span>Electronic invoice generated under Rule 48(4) of CGST Rules</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
