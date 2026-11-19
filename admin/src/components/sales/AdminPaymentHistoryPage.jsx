import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins,
  CheckCircle2,
  Zap,
  Users,
  Award,
  Search,
  RefreshCw,
  ArrowLeft,
  Eye,
  ShieldCheck,
  Building2,
  User,
  CreditCard,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Check,
  Share2,
} from 'lucide-react';
import { getAdminPaymentLedger } from '../../api/adminSalesService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminPaymentHistoryPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // 'all' | 'advance' | 'balance'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [viewingPayment, setViewingPayment] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Show ONLY successfully distributed payments where income_distribution_status = 'completed'
      const res = await getAdminPaymentLedger({ status: 'completed' });
      const completedOnly = (res?.payments || []).filter(
        (p) => (p.income_distribution_status || p.incomeDistributionStatus) === 'completed'
      );
      setPayments(completedOnly);
      setSummaryData({
        total_collected: res?.total_collected ?? 0,
        total_admin_commission: res?.total_admin_commission ?? 0,
        total_direct_income: res?.total_direct_income ?? 0,
        total_level_income: res?.total_level_income ?? 0,
        total_reward_income: res?.total_reward_income ?? 0,
        total_distributed_admin_cut: res?.total_distributed_admin_cut ?? 0,
      });
    } catch (e) {
      console.error('Error reading distributed payment ledger from API:', e);
      showToast('Failed to load distributed payment receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Filter distributed payments by search query and payment type
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Must be completed (defense in depth)
      const distStatus = (p.income_distribution_status || p.incomeDistributionStatus || '').toLowerCase();
      if (distStatus !== 'completed') {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.invoice_number || p.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.customer_name || p.customerName || '').toLowerCase().includes(q) ||
        (p.entity_name || p.entityName || '').toLowerCase().includes(q) ||
        (p.reference_no || p.referenceNo || '').toLowerCase().includes(q) ||
        (p.customer_user_code || p.customerUserCode || '').toLowerCase().includes(q) ||
        (p.sponsor || '').toLowerCase().includes(q) ||
        `rcpt-${p.id}`.toLowerCase().includes(q);

      const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
      const matchType = paymentTypeFilter === 'all' || pType === paymentTypeFilter;

      return matchSearch && matchType;
    });
  }, [payments, searchQuery, paymentTypeFilter]);

  // Aggregate Metrics derived strictly from filtered completed payments
  const totalDistributedPayments = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredPayments]);

  const totalDistributedAdminCut = useMemo(() => {
    return filteredPayments.reduce(
      (acc, curr) =>
        acc +
        (Number(curr.distributed_admin_cut_amount ?? curr.distributedAdminCutAmount ?? curr.admin_commission_cut) || 0),
      0
    );
  }, [filteredPayments]);

  const totalDirectIncome = useMemo(() => {
    return filteredPayments.reduce(
      (acc, curr) => acc + (Number(curr.direct_income_amount ?? curr.directIncomeAmount) || 0),
      0
    );
  }, [filteredPayments]);

  const totalLevelIncome = useMemo(() => {
    return filteredPayments.reduce(
      (acc, curr) => acc + (Number(curr.level_income_amount ?? curr.levelIncomeAmount) || 0),
      0
    );
  }, [filteredPayments]);

  const totalRewardIncome = useMemo(() => {
    return filteredPayments.reduce(
      (acc, curr) => acc + (Number(curr.reward_income_amount ?? curr.rewardIncomeAmount) || 0),
      0
    );
  }, [filteredPayments]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage]);

  const resetFilters = () => {
    setSearchQuery('');
    setPaymentTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.3)',
            fontSize: '0.85rem',
            border: '1.5px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d adm-pod-emerald">
            <Coins size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#047857',
                  background: 'rgba(5, 150, 105, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                }}
              >
                ● READ-ONLY AUDIT LEDGER
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#2563eb',
                  background: 'rgba(37, 99, 235, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
              >
                ● 100% ALLOCATED TRANSACTIONS
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#475569',
                  background: 'rgba(71, 85, 105, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(71, 85, 105, 0.2)',
                }}
              >
                ● {filteredPayments.length} Settled Receipts
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Payment Receipts &amp; History
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Permanent historical audit trail of individual payment receipts whose Admin Income Allocation (40% Direct / 40% Level / 20% Reward) has been successfully completed.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <ArrowLeft size={15} />
              <span>Orders Management</span>
            </button>

            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={loadPayments}
              disabled={loading}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.84rem' }}
            >
              <RefreshCw size={15} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>Refresh History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Read-Only Notice Pod */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.8) 0%, rgba(240, 253, 250, 0.9) 100%)',
          border: '1.5px solid #a7f3d0',
          borderRadius: '14px',
          padding: '0.9rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 4px 14px rgba(5, 150, 105, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: '0.83rem', color: '#065f46', lineHeight: 1.45 }}>
            <strong>Read-Only Audit Trail:</strong> This ledger records exclusively settled receipts with authorized <strong>40/40/20 MLM commission distribution</strong>. To collect new customer receipts or initiate live payment allocation, use <strong>Sidebar → Orders &amp; Payments → Order Management</strong>.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span
            style={{
              background: '#ffffff',
              color: '#047857',
              border: '1.5px solid #a7f3d0',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            }}
          >
            <CheckCircle2 size={13} color="#059669" strokeWidth={2.6} />
            <span>Distribution Status: Completed Only</span>
          </span>
        </div>
      </div>

      {/* 3. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Distributed Payments */}
        <div className="adm-kpi-card adm-kpi-card-indigo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#2563eb',
                  background: 'rgba(37, 99, 235, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● SETTLED REVENUE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                DISTRIBUTED PAYMENTS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-indigo" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Coins size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#1e40af' }}>
              {formatCurrency(totalDistributedPayments)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Coins size={13} color="#2563eb" />
              <span>{filteredPayments.length} Settled Receipts</span>
            </span>
            <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Verified
            </span>
          </div>
        </div>

        {/* Card 2: Admin Cut Distributed */}
        <div className="adm-kpi-card adm-kpi-card-emerald">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#059669',
                  background: 'rgba(5, 150, 105, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● 100% ALLOCATED
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ADMIN CUT DISTRIBUTED
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#059669' }}>
              {formatCurrency(totalDistributedAdminCut)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#059669" />
              <span>100% Commission Allocated</span>
            </span>
            <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Completed
            </span>
          </div>
        </div>

        {/* Card 3: Direct Income (40%) */}
        <div className="adm-kpi-card adm-kpi-card-purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#7c3aed',
                  background: 'rgba(124, 58, 237, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● 40% SPONSOR SHARE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                DIRECT INCOME (40%)
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Users size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#7c3aed' }}>
              {formatCurrency(totalDirectIncome)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Users size={13} color="#7c3aed" />
              <span>Sponsor Direct Pool</span>
            </span>
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Distributed
            </span>
          </div>
        </div>

        {/* Card 4: Level Income (40%) */}
        <div className="adm-kpi-card adm-kpi-card-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● 40% TEAM POOL
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                LEVEL INCOME (40%)
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Share2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#d97706' }}>
              {formatCurrency(totalLevelIncome)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Share2 size={13} color="#d97706" />
              <span>Levels 2–5 Team Pool</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Distributed
            </span>
          </div>
        </div>
      </div>

      {/* 4. Luxury 40/40/20 Accounting Formula Strip */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1rem 1.4rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.15rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        }}
      >
        {/* Metric 1: Direct Income */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(124, 58, 237, 0.25)',
              flexShrink: 0,
            }}
          >
            <Users size={20} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Direct Sponsor Income (40%)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.1rem' }}>
              {formatCurrency(totalDirectIncome)}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 600 }}>
              Paid to active direct sponsor
            </div>
          </div>
        </div>

        {/* Metric 2: Level Income */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(217, 119, 6, 0.25)',
              flexShrink: 0,
            }}
          >
            <Share2 size={20} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Team Level Income (40%)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '0.1rem' }}>
              {formatCurrency(totalLevelIncome)}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 600 }}>
              Allocated across Levels 2–5 genealogy
            </div>
          </div>
        </div>

        {/* Metric 3: Reward Income */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(8, 145, 178, 0.25)',
              flexShrink: 0,
            }}
          >
            <Award size={20} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3. Company Reward Income (20%)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0891b2', marginTop: '0.1rem' }}>
              {formatCurrency(totalRewardIncome)}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 600 }}>
              Accrued in platform Diamond reward vault
            </div>
          </div>
        </div>
      </div>

      {/* 5. Executive Filter Toolbar (Single Unified Row) */}
      <div className="adm-toolbar-card">
        <div className="adm-toolbar-filters">
          {/* Payment Type Filter Tabs */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
            {[
              { id: 'all', label: 'All Payment Types' },
              { id: 'advance', label: '🪙 Advance Only' },
              { id: 'balance', label: '💳 Balance Only' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPaymentTypeFilter(tab.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: paymentTypeFilter === tab.id ? '#ffffff' : 'transparent',
                  color: paymentTypeFilter === tab.id ? '#0f172a' : '#64748b',
                  boxShadow: paymentTypeFilter === tab.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Invoice #, Customer, Member ID, Sponsor, Seller Entity, or UTR..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.52rem 0.85rem 0.52rem 2.25rem',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.82rem',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {(searchQuery || paymentTypeFilter !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexShrink: 0,
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="adm-toolbar-actions">
          <span
            style={{
              fontSize: '0.78rem',
              color: '#334155',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            ● Showing {filteredPayments.length} of {payments.length} settled
          </span>
        </div>
      </div>

      {/* 6. Luxury Data Table Card */}
      <div className="adm-table-card">
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '1700px' }}>
            <thead>
              <tr
                style={{
                  background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                  borderBottom: '1px solid #0f172a',
                  color: '#f8fafc',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>RECEIPT # / ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>INVOICE #</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>PAYMENT DATE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>SELLER ENTITY</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>CUSTOMER / BUYER</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>MEMBER ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>SPONSOR ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>TYPE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right' }}>PROJECT COST</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>RATE (%)</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#34d399' }}>ADMIN CUT</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#93c5fd' }}>DIRECT (40%)</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#fcd34d' }}>LEVEL (40%)</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#67e8f9' }}>REWARD (20%)</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#10b981' }}>TOTAL DISTRIBUTED</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>DISTRIBUTION DATE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right' }}>AUDIT BREAKDOWN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="19" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }}></div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Loading Settled Payment Receipts...</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>Verifying distributed ledger records...</div>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="19" style={{ padding: '4.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>📭</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>No Distributed Payment Records Found</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem', maxWidth: '480px', margin: '0.35rem auto 0 auto' }}>
                      Payment receipts only appear here after their Admin Commission has been distributed via <strong>Order Management</strong>.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  const receiptId = `RCPT-${p.id}`;
                  const invoiceNo = p.invoice_number || p.invoiceNumber || (p.order ? p.order.invoice_number : '—');
                  const paymentDate = p.payment_date || p.paymentDate || p.created_at;
                  const formattedDate = formatDate(paymentDate);
                  const entityName = p.entity_name || p.entityName || (p.order ? p.order.entity_name : '—');
                  const customerName = p.customer_name || p.customerName || (p.order ? p.order.customer_name : '—');
                  const customerUserCode = p.customer_user_code || p.customerUserCode || (p.order ? p.order.customer_user_code : '—');
                  const sponsorCode = p.sponsor || (p.order ? p.order.sponsor : '—');
                  const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
                  const amount = Number(p.amount || 0);
                  const totalProjectCost = Number(p.total_project_cost ?? p.totalProjectCost ?? p.order?.gross_amount ?? amount);
                  const commissionPercent = Number(p.admin_commission_percent ?? p.adminCommissionPercent ?? 15);
                  const adminCut = Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0);
                  const directIncome = Number(p.direct_income_amount ?? p.directIncomeAmount ?? 0);
                  const levelIncome = Number(p.level_income_amount ?? p.levelIncomeAmount ?? 0);
                  const rewardIncome = Number(p.reward_income_amount ?? p.rewardIncomeAmount ?? 0);
                  const distributedCut = Number(p.distributed_admin_cut_amount ?? p.distributedAdminCutAmount ?? adminCut);
                  const distributedAt = p.income_distributed_at || p.incomeDistributedAt;
                  const formattedDistributedAt = distributedAt ? formatDateTime(distributedAt) : 'Completed';

                  return (
                    <tr
                      key={p.id}
                      className="adm-table-row"
                      style={{ borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', transition: 'background-color 0.15s ease' }}
                    >
                      {/* 1. Receipt / Payment ID */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="adm-code-chip" style={{ color: '#0f172a', fontWeight: 800 }}>
                          {receiptId}
                        </span>
                      </td>

                      {/* 2. Invoice Number */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                            fontSize: '0.78rem',
                          }}
                        >
                          {invoiceNo}
                        </span>
                      </td>

                      {/* 3. Payment Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {formattedDate}
                      </td>

                      {/* 4. Seller Entity */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Building2 size={14} color="#64748b" />
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{entityName}</span>
                        </div>
                      </td>

                      {/* 5. Customer / Buyer Name */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              color: '#4338ca',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            {(customerName || 'C')[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{customerName}</span>
                        </div>
                      </td>

                      {/* 6. Customer Member ID */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {customerUserCode}
                        </span>
                      </td>

                      {/* 7. Sponsor ID */}
                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 600 }}>
                        {sponsorCode}
                      </td>

                      {/* 8. Installment Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {pType === 'balance' ? (
                          <span
                            style={{
                              background: 'rgba(217, 119, 6, 0.08)',
                              color: '#b45309',
                              border: '1px solid rgba(217, 119, 6, 0.25)',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <CreditCard size={12} />
                            <span>Balance</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(37, 99, 235, 0.08)',
                              color: '#1d4ed8',
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Coins size={12} />
                            <span>Advance</span>
                          </span>
                        )}
                      </td>

                      {/* 9. Individual Payment Amount */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(amount)}
                      </td>

                      {/* 10. Total Project Cost (Order Level) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#64748b' }}>
                        {formatCurrency(totalProjectCost)}
                      </td>

                      {/* 11. Commission Rate (%) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#475569', fontWeight: 700 }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '5px' }}>
                          {commissionPercent}%
                        </span>
                      </td>

                      {/* 12. Admin Cut for This Payment */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(adminCut)}
                      </td>

                      {/* 13. Direct Income Amount (40%) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>
                        {formatCurrency(directIncome)}
                      </td>

                      {/* 14. Level Income Amount (40%) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                        {formatCurrency(levelIncome)}
                      </td>

                      {/* 15. Reward Income Amount (20%) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0891b2' }}>
                        {formatCurrency(rewardIncome)}
                      </td>

                      {/* 16. Total Distributed Admin Cut */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        {formatCurrency(distributedCut)}
                      </td>

                      {/* 17. Distribution Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.76rem' }}>
                        {formattedDistributedAt}
                      </td>

                      {/* 18. Distribution Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: 'rgba(5, 150, 105, 0.08)',
                            color: '#047857',
                            border: '1px solid rgba(5, 150, 105, 0.25)',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCircle2 size={11} color="#059669" />
                          <span>Completed</span>
                        </span>
                      </td>

                      {/* 19. Read-Only Action: View Breakdown Modal */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setViewingPayment(p)}
                          style={{
                            padding: '0.38rem 0.75rem',
                            background: '#ffffff',
                            color: '#334155',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#2563eb';
                            e.currentTarget.style.color = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#334155';
                          }}
                        >
                          <Eye size={13} />
                          <span>View Breakdown</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing{' '}
            <strong style={{ color: '#0f172a' }}>
              {filteredPayments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{' '}
            to{' '}
            <strong style={{ color: '#0f172a' }}>
              {Math.min(currentPage * pageSize, filteredPayments.length)}
            </strong>{' '}
            of <strong style={{ color: '#0f172a' }}>{filteredPayments.length}</strong> settled payment records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#475569',
                padding: '0.4rem 0.75rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: currentPage === totalPages || totalPages === 0 ? '#94a3b8' : '#334155',
                cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Executive Glassmorphism Distribution Breakdown Modal */}
      {viewingPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.25rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingPayment(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid rgba(226, 232, 240, 0.8)',
              padding: '1.75rem',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 14px rgba(5, 150, 105, 0.25)',
                    flexShrink: 0,
                  }}
                >
                  <Coins size={24} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      Payment Distribution Audit
                    </h3>
                    <span
                      style={{
                        background: 'rgba(5, 150, 105, 0.08)',
                        color: '#047857',
                        border: '1px solid rgba(5, 150, 105, 0.25)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      ● COMPLETED
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Receipt: <strong style={{ color: '#0f172a' }}>RCPT-{viewingPayment.id}</strong> • Invoice:{' '}
                    <strong style={{ color: '#2563eb' }}>{viewingPayment.invoice_number || viewingPayment.invoiceNumber}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Receipt Summary Cards */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Customer:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{viewingPayment.customer_name || viewingPayment.customerName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Member ID:</span>
                  <div style={{ fontWeight: 800, color: '#2563eb' }}>{viewingPayment.customer_user_code || viewingPayment.customerUserCode || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Sponsor:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{viewingPayment.sponsor || viewingPayment.order?.sponsor || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Seller Entity:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{viewingPayment.entity_name || viewingPayment.entityName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Installment Type:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{(viewingPayment.payment_type || viewingPayment.paymentType || 'advance').toUpperCase()}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Payment Mode:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{viewingPayment.payment_method || viewingPayment.paymentMethod || 'Direct'}</div>
                </div>
              </div>
            </div>

            {/* 40/40/20 Distribution Breakdown Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Payment Amount Received:</span>
                <strong style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 800 }}>
                  {formatCurrency(viewingPayment.amount)}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(5, 150, 105, 0.08)',
                  border: '1px solid rgba(5, 150, 105, 0.2)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: '#047857', fontWeight: 700 }}>
                  Admin Platform Cut ({viewingPayment.admin_commission_percent || 15}%):
                </span>
                <strong style={{ color: '#047857', fontSize: '1rem', fontWeight: 800 }}>
                  {formatCurrency(viewingPayment.admin_commission_cut ?? viewingPayment.adminCommissionCut ?? 0)}
                </strong>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#7c3aed', fontWeight: 700 }}>1. Direct Sponsor Income (40%):</span>
                  <strong style={{ color: '#7c3aed', fontWeight: 800 }}>
                    {formatCurrency(viewingPayment.direct_income_amount ?? viewingPayment.directIncomeAmount ?? 0)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>2. Team Level Income (40%):</span>
                  <strong style={{ color: '#d97706', fontWeight: 800 }}>
                    {formatCurrency(viewingPayment.level_income_amount ?? viewingPayment.levelIncomeAmount ?? 0)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0891b2', fontWeight: 700 }}>3. Company Reward Income (20%):</span>
                  <strong style={{ color: '#0891b2', fontWeight: 800 }}>
                    {formatCurrency(viewingPayment.reward_income_amount ?? viewingPayment.rewardIncomeAmount ?? 0)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>Total Distributed Admin Cut:</span>
                <strong style={{ color: '#059669', fontSize: '1.05rem', fontWeight: 800 }}>
                  {formatCurrency(viewingPayment.distributed_admin_cut_amount ?? viewingPayment.distributedAdminCutAmount ?? viewingPayment.admin_commission_cut ?? 0)}
                </strong>
              </div>

              {/* Order-Level Accounting Summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Parent Order Financial Snapshot
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Total Project Cost:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {formatCurrency(viewingPayment.total_project_cost ?? viewingPayment.totalProjectCost ?? viewingPayment.order?.gross_amount ?? viewingPayment.amount ?? 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Total Expected Admin Cut:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {formatCurrency(viewingPayment.total_admin_amount ?? viewingPayment.totalAdminAmount ?? viewingPayment.order?.expected_admin_cut ?? viewingPayment.order?.expectedAdminCut ?? 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Remaining Admin Cut to Collect:</span>
                  <span style={{ fontWeight: 800, color: Number(viewingPayment.remaining_admin_amount ?? viewingPayment.remainingAdminAmount ?? viewingPayment.order?.remaining_admin_commission ?? 0) > 0 ? '#b45309' : '#059669' }}>
                    {formatCurrency(viewingPayment.remaining_admin_amount ?? viewingPayment.remainingAdminAmount ?? viewingPayment.order?.remaining_admin_commission ?? 0)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', fontSize: '0.76rem', color: '#64748b' }}>
                <span>Distributed Timestamp:</span>
                <span style={{ fontWeight: 700, color: '#334155' }}>
                  {viewingPayment.income_distributed_at || viewingPayment.incomeDistributedAt ? formatDateTime(viewingPayment.income_distributed_at || viewingPayment.incomeDistributedAt) : 'Completed'}
                </span>
              </div>
            </div>

            {/* Read-Only Close Action Button */}
            <button
              type="button"
              onClick={() => setViewingPayment(null)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
              }}
            >
              Close Audit Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentHistoryPage;
