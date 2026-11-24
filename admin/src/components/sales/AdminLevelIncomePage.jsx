import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Search,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Layers,
  Award,
  FileText,
  Building2,
  User,
  Filter,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  Download,
} from 'lucide-react';
import {
  getAdminLevelIncomeOverview,
  getAdminLevelIncomeOrders,
} from '../../api/adminIncomeService';
import { formatDate } from '../../utils/timezone';

function AdminLevelIncomePage() {
  const navigate = useNavigate();

  // Overview KPI State
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  // Orders Table State
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Fetch Overview Data
  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const res = await getAdminLevelIncomeOverview();
      const metrics = res?.metrics || res?.summary || res?.data || res;
      setOverview(metrics);
    } catch (err) {
      console.error('Error loading level income overview:', err);
      setOverviewError(err?.message || 'Failed to fetch level income overview statistics.');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // Fetch Orders List
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const params = {
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (levelFilter !== 'all') params.level = levelFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (entityTypeFilter !== 'all') params.entity_type = entityTypeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await getAdminLevelIncomeOrders(params);
      const ordersList = res?.records || res?.orders || res?.data || [];
      const pag = res?.pagination || {
        current_page: currentPage,
        last_page: 1,
        per_page: perPage,
        total: ordersList.length,
      };

      setOrders(ordersList);
      setPagination(pag);
    } catch (err) {
      console.error('Error loading level income orders:', err);
      setOrdersError(err?.message || 'Failed to load level income records.');
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [
    currentPage,
    perPage,
    sortBy,
    sortOrder,
    debouncedSearch,
    levelFilter,
    statusFilter,
    entityTypeFilter,
    startDate,
    endDate,
  ]);

  // Initial load
  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setLevelFilter('all');
    setStatusFilter('all');
    setEntityTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Record ID',
      'Order ID',
      'Invoice #',
      'Order Date',
      'Entity Name',
      'Buyer Member ID',
      'Buyer Name',
      'Beneficiary Member ID',
      'Beneficiary Name',
      'Level Tier',
      'Total Expected (INR)',
      'Paid Amount (INR)',
      'Balance Due (INR)',
      'Dump (INR)',
      'Status',
    ];

    const rows = orders.map((o) => [
      o.id,
      o.order_id,
      `"${o.invoice_number || ''}"`,
      `"${o.order?.date || o.created_at || ''}"`,
      `"${o.order?.entity_name || ''}"`,
      `"${o.buyer?.user_code || ''}"`,
      `"${o.buyer?.name || ''}"`,
      `"${o.beneficiary?.user_code || ''}"`,
      `"${o.beneficiary?.name || ''}"`,
      `"${o.level_label || `Level ${o.level}`}"`,
      o.total_amount || 0,
      o.paid_amount || 0,
      o.balance_amount || 0,
      o.dump_amount || 0,
      `"${o.status || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `level_income_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badge helper
  const getBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'reconciled' || s === 'balanced') {
      return { background: 'rgba(5, 150, 105, 0.08)', color: '#047857', border: '1px solid rgba(5, 150, 105, 0.25)' };
    }
    if (s === 'partial' || s === 'incomplete wallet trace') {
      return { background: 'rgba(217, 119, 6, 0.08)', color: '#b45309', border: '1px solid rgba(217, 119, 6, 0.25)' };
    }
    if (s === 'mismatch' || s === 'discrepancy' || s === 'rejected') {
      return { background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.25)' };
    }
    return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
  };

  const isPlatformReconciled =
    overview?.is_reconciled === true ||
    overview?.isReconciled === true ||
    overview?.reconciliation_status === 'Reconciled' ||
    (overview?.reconciliation_difference ?? overview?.reconciliationDifference) === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d adm-pod-purple">
            <Layers size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#7c3aed',
                  background: 'rgba(124, 58, 237, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                }}
              >
                ● UPLINE TIERS (LEVEL 2 - 5)
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#059669',
                  background: 'rgba(5, 150, 105, 0.08)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                }}
              >
                ● READ-ONLY AUDIT &amp; REPORTING
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#334155',
                  background: '#f1f5f9',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #cbd5e1',
                }}
              >
                ● {pagination.total} Level Records
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Level Income – Multi-Tier Overview
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Monitor multi-level commission allocations across upline network tiers (Level 2 to Level 5) and incremental installment payouts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/orders')}
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
              onClick={handleExportCSV}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#ffffff',
                color: '#7c3aed',
                border: '1.5px solid #ddd6fe',
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
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={() => {
                loadOverview();
                loadOrders();
              }}
              disabled={loadingOverview || loadingOrders}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.84rem' }}
            >
              <RefreshCw size={15} strokeWidth={2.4} className={loadingOverview || loadingOrders ? 'animate-spin' : ''} />
              <span>Refresh Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Auditing Notice Pod */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.9) 0%, rgba(240, 249, 255, 0.8) 100%)',
          border: '1.5px solid #c7d2fe',
          borderRadius: '14px',
          padding: '0.9rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: '0.83rem', color: '#312e81', lineHeight: 1.45 }}>
            <strong>Multi-Level Network Engine (Upline Tiers Level 2 to Level 5):</strong> Cross-reconciled distributions from <code>total_level_incomes</code> and <code>level_incomes</code>. To inspect orders or trigger commission distributions, use <strong>Sidebar → Orders &amp; Payments → Order Management</strong>.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span
            style={{
              background: '#ffffff',
              color: '#7c3aed',
              border: '1.5px solid #c7d2fe',
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
            <CheckCircle2 size={13} color="#7c3aed" strokeWidth={2.6} />
            <span>Audit Mode: Cross-Reconciled</span>
          </span>
        </div>
      </div>

      {/* 3. Global Level Income Financial Vaults (Row 1: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Distributed Level Income */}
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
                ● WALLET CREDITED
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                DISTRIBUTED LEVEL
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#059669' }}>
              {loadingOverview ? '—' : formatCurrency(overview?.total_distributed_level_income ?? overview?.totalDistributedLevelIncome ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#059669" />
              <span>Credited to Wallets</span>
            </span>
            <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Completed
            </span>
          </div>
        </div>

        {/* Card 2: Expected Level Income */}
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
                ● UPLINE TIERS SHARE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                EXPECTED LEVEL
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#7c3aed' }}>
              {loadingOverview ? '—' : formatCurrency(overview?.total_expected_level_income ?? overview?.totalExpectedLevelIncome ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Zap size={13} color="#7c3aed" />
              <span>Multi-Level Network Pool</span>
            </span>
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Target
            </span>
          </div>
        </div>

        {/* Card 3: Pending Level Income */}
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
                ● UNALLOCATED / UNCOLLECTED
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                PENDING LEVEL
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Clock size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#d97706' }}>
              {loadingOverview ? '—' : formatCurrency(overview?.total_pending_level_income ?? overview?.totalPendingLevelIncome ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Clock size={13} color="#d97706" />
              <span>Awaiting milestone settlement</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Pending
            </span>
          </div>
        </div>

        {/* Card 4: Approved Dump Write-Off */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#475569',
                  background: 'rgba(71, 85, 105, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● UNCOLLECTIBLE LOSS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                APPROVED DUMP WRITE-OFF
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <ShieldAlert size={19} strokeWidth={2.4} color="#64748b" />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#475569' }}>
              {loadingOverview ? '—' : formatCurrency(overview?.total_dump_level_income ?? overview?.totalDumpLevelIncome ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <ShieldAlert size={13} color="#64748b" />
              <span>Extinguished loss portion</span>
            </span>
            <span style={{ color: '#475569', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Written-off
            </span>
          </div>
        </div>
      </div>

      {/* 4. Operational Network Metrics (Row 2: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 5: Total Eligible Orders */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#3b82f6',
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● ORDER VOLUME
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TOTAL ELIGIBLE ORDERS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <FileText size={19} strokeWidth={2.4} color="#3b82f6" />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#0f172a' }}>
              {loadingOverview ? '—' : Number(overview?.total_eligible_orders ?? overview?.totalEligibleOrders ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <FileText size={13} color="#3b82f6" />
              <span>Orders with uplines</span>
            </span>
            <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Verified
            </span>
          </div>
        </div>

        {/* Card 6: Installment Payouts */}
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
                ● PAYOUT EVENTS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                INSTALLMENT PAYOUTS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Layers size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#7c3aed' }}>
              {loadingOverview ? '—' : Number(overview?.total_distributions_count ?? overview?.totalDistributionsCount ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Layers size={13} color="#7c3aed" />
              <span>level_incomes ledger</span>
            </span>
            <span style={{ color: '#7c3aed', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Processed
            </span>
          </div>
        </div>

        {/* Card 7: Beneficiary Uplines */}
        <div className="adm-kpi-card adm-kpi-card-indigo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#0891b2',
                  background: 'rgba(8, 145, 178, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● ACTIVE BENEFICIARIES
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                BENEFICIARY UPLINES
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-indigo" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Users size={19} strokeWidth={2.4} color="#0891b2" />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#0891b2' }}>
              {loadingOverview ? '—' : Number(overview?.total_beneficiaries_count ?? overview?.totalBeneficiariesCount ?? 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Users size={13} color="#0891b2" />
              <span>total_level_incomes</span>
            </span>
            <span style={{ color: '#0891b2', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Qualified
            </span>
          </div>
        </div>

        {/* Card 8: Completion Rate */}
        <div className="adm-kpi-card adm-kpi-card-emerald">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● SETTLEMENT VELOCITY
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                COMPLETION RATE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Award size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#10b981' }}>
              {loadingOverview ? '—' : `${Number(overview?.completion_percentage ?? overview?.completionPercentage ?? 0)}%`}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Award size={13} color="#10b981" />
              <span>Distributed / Expected</span>
            </span>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Real-time
            </span>
          </div>
        </div>
      </div>

      {/* 5. Executive Platform Four-Way Cross-Reconciliation Vault */}
      <div
        style={{
          background: isPlatformReconciled
            ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(240, 253, 250, 0.85) 100%)'
            : 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(255, 241, 242, 0.85) 100%)',
          border: `1.5px solid ${isPlatformReconciled ? '#86efac' : '#fca5a5'}`,
          borderRadius: '16px',
          padding: '1.35rem',
          boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isPlatformReconciled
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPlatformReconciled ? '0 4px 12px rgba(5, 150, 105, 0.25)' : '0 4px 12px rgba(220, 38, 38, 0.25)',
                flexShrink: 0,
              }}
            >
              {isPlatformReconciled ? <ShieldCheck size={24} strokeWidth={2.4} /> : <AlertTriangle size={24} strokeWidth={2.4} />}
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Multi-Level Cross-Reconciliation Health
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Synchronized audit across <code>total_level_incomes</code>, <code>level_incomes</code> installments, and wallet transfer credits.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                padding: '0.4rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: isPlatformReconciled ? '#dcfce7' : '#fee2e2',
                color: isPlatformReconciled ? '#15803d' : '#b91c1c',
                border: `1px solid ${isPlatformReconciled ? '#bbf7d0' : '#fca5a5'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              {isPlatformReconciled ? <CheckCircle2 size={15} color="#15803d" /> : <AlertTriangle size={15} color="#b91c1c" />}
              <span>{overview?.reconciliation_status || (isPlatformReconciled ? 'Reconciled' : 'Discrepancy')}</span>
            </span>
          </div>
        </div>

        {/* 4 Layers Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            marginBottom: '0.85rem',
          }}
        >
          {/* Layer 1 */}
          <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1. total_level_incomes (Paid)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {formatCurrency(overview?.ledger_totals?.total_level_incomes_paid ?? overview?.total_distributed_level_income ?? 0)}
            </div>
          </div>

          {/* Layer 2 */}
          <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              2. level_incomes (Installments)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {formatCurrency(overview?.ledger_totals?.level_incomes_installments ?? overview?.total_distributed_level_income ?? 0)}
            </div>
          </div>

          {/* Layer 3 */}
          <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              3. Wallet Transfer Credits
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              {formatCurrency(overview?.ledger_totals?.wallet_transfers_level ?? overview?.total_distributed_level_income ?? 0)}
            </div>
          </div>

          {/* Variance */}
          <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: `1.5px solid ${isPlatformReconciled ? '#86efac' : '#fca5a5'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Platform Variance
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isPlatformReconciled ? '#059669' : '#dc2626', marginTop: '0.25rem' }}>
              {formatCurrency(overview?.reconciliation_difference ?? overview?.reconciliationDifference ?? 0)}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: isPlatformReconciled ? '#15803d' : '#991b1b', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
          <span>{isPlatformReconciled ? '✓' : '⚠️'}</span>
          <span>{overview?.reconciliation_message || (isPlatformReconciled ? 'All multi-level financial records are mathematically balanced with ₹0.00 platform variance.' : `Variance of ₹${overview?.reconciliation_difference} detected.`)}</span>
        </div>
      </div>

      {/* 6. Executive Search & Filter Toolbar (Unified Single-Row) */}
      <div className="adm-toolbar-card">
        <div className="adm-toolbar-filters">
          {/* Status Tabs */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
            {[
              { id: 'all', label: 'All Records' },
              { id: 'completed', label: '✓ Completed' },
              { id: 'partial', label: '⏳ Partial' },
              { id: 'pending', label: '⚠️ Pending' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? '#ffffff' : 'transparent',
                  color: statusFilter === tab.id ? '#0f172a' : '#64748b',
                  boxShadow: statusFilter === tab.id ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Level Filter Dropdown */}
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="all">All Levels (L2 – L5)</option>
            <option value="2">Level 2 Tier</option>
            <option value="3">Level 3 Tier</option>
            <option value="4">Level 4 Tier</option>
            <option value="5">Level 5 Tier</option>
          </select>

          {/* Entity Type Dropdown */}
          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1.5px solid #e2e8f0',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="all">All Entity Types</option>
            <option value="business">Registered Business</option>
            <option value="freelancer">Freelancer Expert</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Invoice #, Order ID, Buyer Member ID, Beneficiary Member ID, Entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.52rem 0.85rem 0.52rem 2.25rem',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.82rem',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: `1px solid ${showAdvancedFilters ? '#7c3aed' : '#cbd5e1'}`,
              background: showAdvancedFilters ? '#ede9fe' : '#ffffff',
              color: showAdvancedFilters ? '#7c3aed' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexShrink: 0,
            }}
          >
            <Filter size={13} />
            <span>Dates &amp; Sorting</span>
          </button>

          {(search || levelFilter !== 'all' || statusFilter !== 'all' || entityTypeFilter !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
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
            ● {pagination.total} Level Records Ledger
          </span>
        </div>
      </div>

      {/* Advanced Filters Dropdown Panel */}
      {showAdvancedFilters && (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              Sort Metric
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', background: '#ffffff', fontWeight: 700 }}
            >
              <option value="created_at">Latest Record Date</option>
              <option value="order_id">Order ID</option>
              <option value="invoice_number">Invoice Number</option>
              <option value="level">Level Tier</option>
              <option value="total_amount">Highest Expected</option>
              <option value="paid_amount">Highest Distributed</option>
              <option value="balance_amount">Highest Pending</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              Sort Direction
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', background: '#ffffff', fontWeight: 700 }}
            >
              <option value="desc">Descending (High to Low)</option>
              <option value="asc">Ascending (Low to High)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              Records Per Page
            </label>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', background: '#ffffff', fontWeight: 700 }}
            >
              <option value={10}>10 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>
        </div>
      )}

      {/* 7. Luxury Level Income Data Table Card */}
      <div className="adm-table-card">
        {ordersError && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#dc2626' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{ordersError}</div>
            <button
              type="button"
              onClick={loadOrders}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loadingOrders && (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }}></div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Loading Level Income Ledger...</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>Cross-reconciling total_level_incomes &amp; level_incomes...</div>
          </div>
        )}

        {!loadingOrders && !ordersError && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '1550px' }}>
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
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>ORDER &amp; INVOICE</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>ORDER DATE</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>SELLER ENTITY</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>BUYER MEMBER</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em' }}>BENEFICIARY UPLINE</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>LEVEL TIER</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#93c5fd' }}>TOTAL LEVEL</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#34d399' }}>PAID (DISTRIBUTED)</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#fcd34d' }}>BALANCE DUE</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'right', color: '#94a3b8' }}>DUMP</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>INSTALLMENTS</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>RECONCILIATION</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ padding: '4.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>📦</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>No Level Income Records Found</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.35rem' }}>
                        Try clearing search queries or adjusting level and date filter parameters.
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      className="adm-table-row"
                      style={{ borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', cursor: 'pointer' }}
                      onClick={() => navigate(`/income/level-orders/${o.order_id || o.id}`)}
                    >
                      {/* Order & Invoice */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="adm-code-chip" style={{ color: '#0f172a', fontWeight: 800 }}>
                            #{o.order_id || o.id}
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              color: '#7c3aed',
                              background: '#f5f3ff',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              border: '1px solid #ddd6fe',
                              fontSize: '0.76rem',
                            }}
                          >
                            {o.invoice_number || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {formatDate(o.order?.date || o.created_at)}
                      </td>

                      {/* Seller Entity */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Building2 size={14} color="#64748b" />
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{o.order?.entity_name || 'N/A'}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            color: '#475569',
                            textTransform: 'capitalize',
                            fontWeight: 600,
                          }}
                        >
                          {o.order?.entity_type || 'Business'}
                        </span>
                      </td>

                      {/* Buyer Member */}
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
                            {(o.buyer?.name || 'B')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.buyer?.name || 'Member'}</div>
                            <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>
                              {o.buyer?.user_code || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Beneficiary Upline */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#ede9fe',
                              color: '#6d28d9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            {(o.beneficiary?.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.beneficiary?.name || 'Upline'}</div>
                            <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>
                              {o.beneficiary?.user_code || o.user_code || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Level Tier */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            backgroundColor: '#ede9fe',
                            color: '#6d28d9',
                            border: '1px solid #ddd6fe',
                          }}
                        >
                          {o.level_label || `Level ${o.level}`}
                        </span>
                      </td>

                      {/* Total Expected */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(o.total_amount)}
                      </td>

                      {/* Paid */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        {formatCurrency(o.paid_amount)}
                      </td>

                      {/* Balance */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: o.balance_amount > 0 ? '#d97706' : '#64748b' }}>
                        {formatCurrency(o.balance_amount)}
                      </td>

                      {/* Dump */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#64748b' }}>
                        {formatCurrency(o.dump_amount)}
                      </td>

                      {/* Installments Count */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          {o.distribution_count || 1} Payouts
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            ...getBadgeStyle(o.status || o.distribution_status),
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {o.status || o.distribution_status || 'Pending'}
                        </span>
                      </td>

                      {/* Reconciliation */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: 'rgba(5, 150, 105, 0.08)',
                            color: '#047857',
                            border: '1px solid rgba(5, 150, 105, 0.25)',
                          }}
                        >
                          <CheckCircle2 size={12} strokeWidth={2.6} />
                          <span>Reconciled</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/income/level-orders/${o.order_id || o.id}`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.42rem 0.85rem',
                            background: '#ffffff',
                            color: '#7c3aed',
                            border: '1.5px solid #ddd6fe',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(124, 58, 237, 0.08)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#7c3aed';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#7c3aed';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#7c3aed';
                            e.currentTarget.style.borderColor = '#ddd6fe';
                          }}
                        >
                          <span>Details</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. Luxury Pagination Bar */}
        {!loadingOrders && !ordersError && pagination.total > 0 && (
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Showing{' '}
              <strong style={{ color: '#0f172a' }}>
                {(pagination.current_page - 1) * pagination.per_page + 1}
              </strong>{' '}
              to{' '}
              <strong style={{ color: '#0f172a' }}>
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
              </strong>{' '}
              of <strong style={{ color: '#0f172a' }}>{pagination.total}</strong> entries
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  background: pagination.current_page <= 1 ? '#f1f5f9' : '#ffffff',
                  color: pagination.current_page <= 1 ? '#94a3b8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#475569',
                  fontWeight: 700,
                  padding: '0.4rem 0.75rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '7px',
                }}
              >
                Page {pagination.current_page} of {pagination.last_page || 1}
              </span>

              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '7px',
                  border: '1px solid #cbd5e1',
                  background: pagination.current_page >= pagination.last_page ? '#f1f5f9' : '#ffffff',
                  color: pagination.current_page >= pagination.last_page ? '#94a3b8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLevelIncomePage;
