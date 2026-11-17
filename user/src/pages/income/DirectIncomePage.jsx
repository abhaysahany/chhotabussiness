import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
  Layers,
  Info
} from 'lucide-react';
import { getUserDirectIncomeOrders } from '../../api/userIncomeService';
import OrderDirectIncomeCard from '../../components/income/OrderDirectIncomeCard';
import { formatINR, formatNumberIN } from '../../utils/formatters';

function DirectIncomePage({ user, onNavigate }) {
  const navigate = useNavigate();

  // Main Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Query States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_distribution_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Fetch Order Summaries from Backend
  const loadSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (search && search.trim()) {
        params.search = search.trim();
      }

      const res = await getUserDirectIncomeOrders(params);

      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load Direct Income order summaries.');
      }
    } catch (err) {
      console.error('Error loading direct income order summaries:', err);
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, sortBy, sortOrder, search]);

  useEffect(() => {
    let active = true;
    const execute = async () => {
      try {
        const params = {
          page,
          per_page: perPage,
          sort_by: sortBy,
          sort_order: sortOrder,
        };
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (search && search.trim()) params.search = search.trim();

        const res = await getUserDirectIncomeOrders(params);
        if (active) {
          if (res && res.status === 'success') {
            setData(res);
            setError(null);
          } else {
            setError(res?.message || 'Failed to load Direct Income order summaries.');
          }
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Error communicating with server.');
          setLoading(false);
        }
      }
    };

    execute();
    return () => {
      active = false;
    };
  }, [page, perPage, statusFilter, sortBy, sortOrder, search]);

  // Reset to page 1 whenever search or status filter changes
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === 'latest_order') {
      setSortBy('created_at');
      setSortOrder('desc');
    } else if (val === 'highest_received') {
      setSortBy('total_distributed_amount');
      setSortOrder('desc');
    } else if (val === 'highest_pending') {
      setSortBy('total_pending_amount');
      setSortOrder('desc');
    } else if (val === 'highest_gross') {
      setSortBy('order_gross_amount');
      setSortOrder('desc');
    } else {
      setSortBy('last_distribution_at');
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('last_distribution_at');
    setSortOrder('desc');
    setPerPage(10);
    setPage(1);
  };

  const handleBackToOverview = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('my-income');
    } else {
      navigate('/income');
    }
  };

  // Navigate to Dedicated Order Details Page
  const handleOpenDetails = (orderId) => {
    if (!orderId) return;
    if (typeof onNavigate === 'function') {
      onNavigate(`direct-income/${orderId}`);
    } else {
      navigate(`/direct-income/${orderId}`);
    }
  };

  // Extract Summary Metrics (safely handles camelCase, snake_case, and aliases)
  const metrics = data?.summary_metrics || data?.summary || {};
  const totalExpected = Number(metrics.total_expected_income ?? metrics.total_expected_direct_income ?? metrics.totalExpectedDirectIncome ?? 0);
  const totalReceived = Number(metrics.total_received_income ?? metrics.total_received_direct_income ?? metrics.totalReceivedDirectIncome ?? 0);
  const totalPending = Number(metrics.total_pending_income ?? metrics.total_pending_direct_income ?? metrics.totalPendingDirectIncome ?? 0);
  const totalDump = Number(metrics.total_dump_income ?? metrics.total_dump_direct_income ?? metrics.totalDumpDirectIncome ?? 0);
  const totalOrders = Number(metrics.total_orders ?? metrics.totalOrders ?? 0);
  const totalDistributions = Number(metrics.total_distributions_count ?? metrics.totalDistributionsCount ?? 0);
  const completionPercentage = Number(metrics.completion_percentage ?? metrics.completionPercentage ?? (totalExpected > 0 ? Math.min(100, Math.round((totalReceived / totalExpected) * 100)) : 0));

  const orders = data?.orders || data?.data || [];
  const pagination = data?.pagination || {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: orders.length,
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    statusFilter !== 'all' ||
    sortBy !== 'last_distribution_at' ||
    perPage !== 10
  );

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Wallet size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>My Income • Direct Referrals Dossier</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Direct Income
            </h1>
            <p className="van-catalog-hero-desc">
              Track your Direct Income received from customer orders, direct referral accounts (40% cut), and installment-wise distributions.
            </p>
          </div>
        </div>

        {/* Right Stats Chips & Navigation Action Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.85rem',
            flexShrink: 0,
          }}
        >
          {/* Top: Quick Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">{formatNumberIN(totalOrders)}</div>
              <div className="van-catalog-stat-chip-lbl">Eligible Orders</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {completionPercentage}%
              </div>
              <div className="van-catalog-stat-chip-lbl">Realized</div>
            </div>
          </div>

          {/* Bottom: Back to My Income Overview */}
          <button
            type="button"
            onClick={handleBackToOverview}
            style={{
              padding: '0.58rem 1.15rem',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
          >
            <ArrowLeft size={15} />
            <span>My Income Overview</span>
          </button>
        </div>
      </div>

      {/* User Identity & Account Status Strip */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          borderRadius: '18px',
          padding: '1.25rem 1.65rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '15px',
              background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.5rem',
              boxShadow: '0 6px 18px rgba(56, 189, 248, 0.35)',
              flexShrink: 0,
            }}
          >
            ₹
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {data?.user?.name || user?.name || 'Partner Member'}
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                ● Active Earner
              </span>
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: '#94A3B8',
                display: 'flex',
                gap: '0.85rem',
                marginTop: '0.35rem',
                flexWrap: 'wrap',
                fontWeight: 650,
              }}
            >
              <span>User ID: <strong style={{ color: '#F1F5F9' }}>#{data?.user?.id || user?.id}</strong></span>
              <span>•</span>
              <span>Member Code: <strong style={{ color: '#38BDF8' }}>{data?.user?.user_code || user?.user_code}</strong></span>
              <span>•</span>
              <span>Eligible Orders: <strong style={{ color: '#F1F5F9' }}>{totalOrders} Order Card{totalOrders === 1 ? '' : 's'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.25))',
              border: '1.5px solid #38BDF8',
              color: '#38BDF8',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.15)',
            }}
          >
            Direct Referral Account (40% Cut)
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1.5px solid #FEE2E2',
            color: '#B91C1C',
            borderRadius: '14px',
            padding: '1.15rem 1.45rem',
            marginBottom: '1.75rem',
            fontSize: '0.88rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
          }}
        >
          <div>
            <strong style={{ fontWeight: 800 }}>Error loading records:</strong> {error}
          </div>
          <button
            type="button"
            onClick={loadSummaries}
            style={{
              padding: '0.45rem 1rem',
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Signature 3D KPI Cards Grid (4 in a row Desktop, 2x2 Tablet, 1 col Mobile) */}
      <div className="van-business-kpi-grid">
        {/* Card 1: Total Expected Direct Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#2563EB',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Total Expected Direct Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '0s' }}
              title="Total Eligible Entitlement"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {formatINR(totalExpected)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Max eligible direct entitlement
            </span>
            <span className="van-card-badge-pill blue">
              40% Cap
            </span>
          </div>
        </div>

        {/* Card 2: Total Received Direct Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#059669',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Total Received Direct Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.4s' }}
              title="Credited into Cash Wallet"
            >
              <CheckCircle2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#047857' }}>
            {formatINR(totalReceived)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Successfully credited to wallet
            </span>
            <span className="van-card-badge-pill emerald">
              In Wallet
            </span>
          </div>
        </div>

        {/* Card 3: Pending Direct Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#D97706',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Pending Direct Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '0.8s' }}
              title="Awaiting Installments"
            >
              <Clock size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: totalPending > 0 ? '#B45309' : '#64748B' }}>
            {formatINR(totalPending)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Awaiting order installments
            </span>
            <span className="van-card-badge-pill amber" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              Pending
            </span>
          </div>
        </div>

        {/* Card 4: Approved Dump Direct Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#7C3AED',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Approved Dump Direct Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '1.2s' }}
              title="Non-cash adjustments"
            >
              <ShieldCheck size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#6D28D9' }}>
            {formatINR(totalDump)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Non-cash write-offs (Not in wallet)
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              Dump Value
            </span>
          </div>
        </div>
      </div>

      {/* Additional Stats & Progress Ribbon */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #E2E8F0',
          padding: '1.15rem 1.6rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.84rem' }}>
          <div>
            <span style={{ color: '#64748B', fontWeight: 650 }}>Total Eligible Orders: </span>
            <strong style={{ color: '#0F172A', fontWeight: 850 }}>{formatNumberIN(totalOrders)}</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div>
            <span style={{ color: '#64748B', fontWeight: 650 }}>Total Installment Distributions: </span>
            <strong style={{ color: '#0F172A', fontWeight: 850 }}>{formatNumberIN(totalDistributions)}</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div>
            <span style={{ color: '#64748B', fontWeight: 650 }}>Overall Collection Progress: </span>
            <strong style={{ color: completionPercentage >= 100 ? '#047857' : '#2563EB', fontWeight: 850 }}>
              {completionPercentage}%
            </strong>
          </div>
        </div>

        <div style={{ width: '240px', maxWidth: '100%' }}>
          <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${completionPercentage}%`,
                background: completionPercentage >= 100 ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #38BDF8, #2563EB)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Advanced 3D Filter & Search Command Toolbar */}
      <div className="van-dir-toolbar-3d" style={{ marginBottom: '1.75rem' }}>
        {/* Tier 1: Search Bar & Quick Action Status */}
        <div className="van-dir-toolbar-top">
          {/* Expanded Search Bar with 3D Pod */}
          <div className="van-dir-search-wrap">
            <div className="van-dir-search-icon-pod">
              <Search size={16} color="#2563EB" strokeWidth={2.4} />
            </div>
            <input
              type="text"
              className="van-dir-search-input"
              placeholder="Search by Invoice, Order ID, Customer, Item..."
              value={search}
              onChange={handleSearchChange}
            />
            {search && (
              <button
                type="button"
                className="van-dir-search-clear"
                onClick={handleClearSearch}
                title="Clear search"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Right: Quick Refresh & Order Count Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={loadSummaries}
              disabled={loading}
              className="van-dir-reset-btn"
              style={{
                background: '#EFF6FF',
                borderColor: '#BFDBFE',
                color: '#1D4ED8',
                padding: '0.52rem 1rem',
              }}
              title="Refresh direct income records from database"
            >
              <RotateCcw size={14} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <div className="van-dir-count-pill" style={{ padding: '0.5rem 0.95rem' }}>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{orders.length}</span>
              <span>{orders.length === 1 ? 'order displayed' : 'orders displayed'}</span>
            </div>
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="van-dir-toolbar-divider" />

        {/* Tier 2: Filter Capsules Cluster & Reset Button */}
        <div className="van-dir-toolbar-bottom">
          {/* Left: Filter Capsules Cluster */}
          <div className="van-dir-filters-cluster">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.78rem',
                fontWeight: 850,
                color: '#64748B',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginRight: '0.2rem',
              }}
            >
              <Filter size={14} color="#2563EB" strokeWidth={2.5} />
              <span>Filters</span>
            </div>

            {/* Status Filter */}
            <div className={`van-dir-filter-capsule ${statusFilter !== 'all' ? 'active' : ''}`}>
              <ShieldCheck size={15} color="#10B981" strokeWidth={2.2} />
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                aria-label="Filter by Distribution Status"
              >
                <option value="all">All Distribution Statuses</option>
                <option value="completed">Completed Only</option>
                <option value="partial">Partial Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className={`van-dir-filter-capsule ${sortBy !== 'last_distribution_at' ? 'active' : ''}`}>
              <SlidersHorizontal size={15} color="#D97706" strokeWidth={2.2} />
              <select
                value={
                  sortBy === 'created_at'
                    ? 'latest_order'
                    : sortBy === 'total_distributed_amount'
                    ? 'highest_received'
                    : sortBy === 'total_pending_amount'
                    ? 'highest_pending'
                    : sortBy === 'order_gross_amount'
                    ? 'highest_gross'
                    : 'last_distribution'
                }
                onChange={handleSortChange}
                aria-label="Sort Orders"
              >
                <option value="last_distribution">Sort: Last Distribution</option>
                <option value="latest_order">Sort: Latest Order</option>
                <option value="highest_received">Sort: Highest Received</option>
                <option value="highest_pending">Sort: Highest Pending</option>
                <option value="highest_gross">Sort: Highest Order Value</option>
              </select>
            </div>

            {/* Per Page */}
            <div className="van-dir-filter-capsule">
              <Layers size={15} color="#2563EB" strokeWidth={2.2} />
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Orders per page"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="van-dir-reset-btn"
                onClick={handleResetFilters}
                title="Reset all search & filter parameters"
              >
                <RotateCcw size={13} strokeWidth={2.4} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right: Quick Entitlement Note */}
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 650 }}>
            <span>Real-time calculation: </span>
            <strong style={{ color: '#2563EB' }}>40% Commission Cut</strong>
          </div>
        </div>
      </div>

      {/* Order Cards Section: Exactly ONE Card per Order */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', marginBottom: '1.75rem' }}>
        {loading ? (
          // Skeleton loading state
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2].map((n) => (
              <div
                key={n}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1.5px solid #E2E8F0',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#94A3B8',
                  boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div
                  className="spinner"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderWidth: '3px',
                    margin: '0 auto 0.75rem auto',
                  }}
                />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#64748B' }}>
                  Loading Direct Income Order Cards...
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Empty State
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1.5px solid #E2E8F0',
              padding: '4rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                border: '1px solid #DBEAFE',
              }}
            >
              <Package size={30} />
            </div>
            <h3 style={{ margin: '0 0 0.45rem 0', fontSize: '1.25rem', fontWeight: 850, color: '#0F172A' }}>
              No Direct Income Orders Found
            </h3>
            <p style={{ margin: '0 auto 1.35rem auto', fontSize: '0.88rem', color: '#64748B', maxWidth: '480px' }}>
              {search || statusFilter !== 'all'
                ? 'No orders matched your current search or filter criteria. Try clearing filters to see all eligible orders.'
                : 'Your Direct Income details will appear here automatically when an eligible Order distribution is processed.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="van-btn-share-3d"
                style={{
                  padding: '0.65rem 1.45rem',
                  borderRadius: '11px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <RotateCcw size={14} />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        ) : (
          // Render Consolidated Order Cards
          orders.map((order) => (
            <OrderDirectIncomeCard
              key={order.order_id || order.id || order.orderId}
              order={order}
              onViewDetails={handleOpenDetails}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.total > 0 && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #E2E8F0',
            padding: '1rem 1.45rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            fontSize: '0.84rem',
            color: '#64748B',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div>
            Showing orders{' '}
            <strong style={{ color: '#0F172A', fontWeight: 800 }}>
              {(pagination.current_page - 1) * pagination.per_page + 1}
            </strong>{' '}
            to{' '}
            <strong style={{ color: '#0F172A', fontWeight: 800 }}>
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            </strong>{' '}
            of <strong style={{ color: '#0F172A', fontWeight: 800 }}>{pagination.total}</strong> total eligible orders
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              disabled={pagination.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.45rem 0.85rem',
                background: pagination.current_page <= 1 ? '#F8FAFC' : '#FFFFFF',
                color: pagination.current_page <= 1 ? '#94A3B8' : '#334155',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 750,
                cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ padding: '0 0.65rem', fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            <button
              type="button"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              style={{
                padding: '0.45rem 0.85rem',
                background: pagination.current_page >= pagination.last_page ? '#F8FAFC' : '#FFFFFF',
                color: pagination.current_page >= pagination.last_page ? '#94A3B8' : '#334155',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 750,
                cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Accounting & Policy Information Note */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          fontSize: '0.82rem',
          color: '#64748B',
          lineHeight: 1.65,
        }}
      >
        <div style={{ fontWeight: 850, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem' }}>
          <Info size={16} color="#2563EB" />
          <span>Vyapar Adnet Direct Income Order-Wise Accounting System</span>
        </div>
        <div>
          • <strong>Order Consolidation:</strong> Each confirmed customer order appears as strictly one consolidated Order Card, regardless of how many installment payments are made.
        </div>
        <div>
          • <strong>Direct Referral Formula:</strong> Direct Income is calculated as exactly 40% of the verified Admin Commission Cut on every collected installment payment.
        </div>
        <div>
          • <strong>Dump Write-Offs:</strong> Approved dump write-offs represent bad debt adjustments or canceled balances. They reduce pending entitlements and do not generate cash wallet credits.
        </div>
        <div>
          • <strong>Real-Time Synchronisation:</strong> Whenever an installment receipt is verified and distributed by Admin, the Order Card's received, pending, and distribution count metrics update automatically.
        </div>
      </div>
    </div>
  );
}

export default DirectIncomePage;
