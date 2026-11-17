import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  Layers,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  TrendingUp,
  Wallet,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { getUserLevelIncome } from '../../api/userIncomeService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import { formatDateTime } from '../../utils/timezone';

function LevelIncomeDetailsPage({ user, onNavigate }) {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const handleBack = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('level-income');
    } else {
      navigate('/level-income');
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserLevelIncome();
      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load Level Income records.');
      }
    } catch (err) {
      console.error('Error fetching level income records:', err);
      setError(err?.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract Summary
  const summary = data?.summary || {
    user_id: user?.id || '—',
    member_id: user?.user_code || '—',
    user_name: user?.name || 'Partner Member',
    total_amount: 0,
    paid_amount: 0,
    balance_amount: 0,
  };

  const totalLevelIncome = Number(summary.total_amount ?? summary.totalAmount ?? 0);
  const remainingBalance = Number(summary.balance_amount ?? summary.balanceAmount ?? 0);
  const totalPaid = Number(summary.paid_amount ?? summary.paidAmount ?? 0);

  const allRecords = data?.records || [];

  // Filter & Search Records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((rec) => {
      // If orderId is provided in URL, filter by that specific order
      if (orderId && String(rec.order_id || rec.orderId) !== String(orderId)) {
        return false;
      }

      // Level filter
      if (levelFilter !== 'all' && String(rec.level || rec.level_number) !== String(levelFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isPaid = (rec.paid_amount ?? 0) >= (rec.amount ?? rec.total_amount ?? 0) && (rec.amount ?? rec.total_amount ?? 0) > 0;
        if (statusFilter === 'paid' && !isPaid) return false;
        if (statusFilter === 'partial' && isPaid) return false;
      }

      // Search term
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const idMatch = String(rec.id || '').toLowerCase().includes(query);
        const orderMatch = String(rec.order_id || rec.orderId || '').toLowerCase().includes(query);
        const invoiceMatch = String(rec.invoice_number || rec.invoiceNumber || '').toLowerCase().includes(query);
        const memberMatch = String(rec.source_member || rec.level_id || '').toLowerCase().includes(query);
        const levelMatch = `level ${rec.level}`.includes(query) || String(rec.level).includes(query);
        const paymentTypeMatch = String(rec.payment_type || '').toLowerCase().includes(query);

        if (!idMatch && !orderMatch && !invoiceMatch && !memberMatch && !levelMatch && !paymentTypeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allRecords, orderId, levelFilter, statusFilter, search]);

  // Sort Records
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    switch (sortBy) {
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      case 'highest_amount':
        return list.sort((a, b) => (b.amount ?? b.total_amount ?? 0) - (a.amount ?? a.total_amount ?? 0));
      case 'lowest_amount':
        return list.sort((a, b) => (a.amount ?? a.total_amount ?? 0) - (b.amount ?? b.total_amount ?? 0));
      case 'level_asc':
        return list.sort((a, b) => Number(a.level || 0) - Number(b.level || 0));
      case 'level_desc':
        return list.sort((a, b) => Number(b.level || 0) - Number(a.level || 0));
      case 'latest':
      default:
        return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
  }, [filteredRecords, sortBy]);

  // Paginated Slices
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / perPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedRecords.slice(start, start + perPage);
  }, [sortedRecords, currentPage, perPage]);

  // Reset pagination on filter change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const handleLevelChange = (e) => {
    setLevelFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setLevelFilter('all');
    setStatusFilter('all');
    setSortBy('latest');
    setPerPage(10);
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    levelFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'latest' ||
    perPage !== 10
  );

  // Level Badge configuration (40/30/20/10 pool shares)
  const getLevelBadge = (level) => {
    const lvl = Number(level);
    switch (lvl) {
      case 2:
        return { label: 'Level 2', share: '40% Pool', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 3:
        return { label: 'Level 3', share: '30% Pool', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 4:
        return { label: 'Level 4', share: '20% Pool', bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      case 5:
        return { label: 'Level 5', share: '10% Pool', bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' };
      default:
        return { label: `Level ${lvl}`, share: 'Team Pool', bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Layers size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>My Income • Team Level Details Ledger</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Level Income Full Details
            </h1>
            <p className="van-catalog-hero-desc">
              Detailed transaction records across Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%) allocations.
            </p>
          </div>
        </div>

        {/* Right Stats Chips & Navigation Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1rem',
            flexShrink: 0,
          }}
        >
          {/* Quick Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">40% Pool</div>
              <div className="van-catalog-stat-chip-lbl">Levels 2 to 5</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {formatNumberIN(allRecords.length)}
              </div>
              <div className="van-catalog-stat-chip-lbl">Total Ledger Entries</div>
            </div>
          </div>

          {/* Navigation Button */}
          <button
            type="button"
            onClick={handleBack}
            className="van-btn-share-3d"
            style={{
              padding: '0.62rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Level Income</span>
          </button>
        </div>
      </div>

      {/* User Identity Pod */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.65rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25), 0 8px 10px -6px rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Layers size={26} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              {summary.user_name || user?.name || 'Partner Member'}
            </div>
            <div
              style={{
                fontSize: '0.82rem',
                color: '#94a3b8',
                display: 'flex',
                gap: '0.85rem',
                marginTop: '0.25rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span>User ID: <strong style={{ color: '#e2e8f0' }}>#{summary.user_id || user?.id}</strong></span>
              <span style={{ color: '#475569' }}>•</span>
              <span>Member Code: <strong style={{ color: '#e2e8f0' }}>{summary.member_id || user?.user_code}</strong></span>
              <span style={{ color: '#475569' }}>•</span>
              <span>Total Ledger Entries: <strong style={{ color: '#38bdf8' }}>{allRecords.length} Distribution(s)</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              color: '#a5b4fc',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8' }} />
            Team Level Income (40% Pool)
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span><strong>Error loading data:</strong> {error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '0.45rem 0.95rem',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Executive 4-Card 3D KPI Grid */}
      <div className="van-business-kpi-grid" style={{ marginBottom: '1.75rem' }}>
        
        {/* KPI Card 1: Total Level Income */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #6366f1' }}>
          <div className="van-stat-header-row">
            <span className="van-stat-label">TOTAL LEVEL INCOME</span>
            <div className="van-3d-kpi-icon van-3d-icon-indigo">
              <Layers size={20} />
            </div>
          </div>
          <div className="van-stat-value" style={{ color: '#312e81' }}>
            {formatINR(totalLevelIncome)}
          </div>
          <div className="van-stat-footer-row">
            <span className="van-stat-footer-sub" style={{ color: '#4f46e5' }}>
              Cumulative indirect team allocations
            </span>
            <span className="van-stat-badge van-badge-indigo">Gross Pool</span>
          </div>
        </div>

        {/* KPI Card 2: Remaining Balance */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #f59e0b' }}>
          <div className="van-stat-header-row">
            <span className="van-stat-label">REMAINING BALANCE</span>
            <div className="van-3d-kpi-icon van-3d-icon-amber">
              <Wallet size={20} />
            </div>
          </div>
          <div className="van-stat-value" style={{ color: remainingBalance > 0 ? '#b45309' : '#0f172a' }}>
            {formatINR(remainingBalance)}
          </div>
          <div className="van-stat-footer-row">
            <span className="van-stat-footer-sub" style={{ color: '#b45309' }}>
              Available balance for withdrawal / payout
            </span>
            <span className="van-stat-badge van-badge-amber">Available</span>
          </div>
        </div>

        {/* KPI Card 3: Realized / Credited to Wallet */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #10b981' }}>
          <div className="van-stat-header-row">
            <span className="van-stat-label">CREDITED TO WALLET</span>
            <div className="van-3d-kpi-icon van-3d-icon-emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="van-stat-value" style={{ color: '#065f46' }}>
            {formatINR(totalPaid)}
          </div>
          <div className="van-stat-footer-row">
            <span className="van-stat-footer-sub" style={{ color: '#059669' }}>
              Realized income credited to wallet
            </span>
            <span className="van-stat-badge van-badge-emerald">Realized</span>
          </div>
        </div>

        {/* KPI Card 4: Total Entries Recorded */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #8b5cf6' }}>
          <div className="van-stat-header-row">
            <span className="van-stat-label">TOTAL ENTRIES RECORDED</span>
            <div className="van-3d-kpi-icon van-3d-icon-purple">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="van-stat-value" style={{ color: '#5b21b6' }}>
            {formatNumberIN(allRecords.length)}
          </div>
          <div className="van-stat-footer-row">
            <span className="van-stat-footer-sub" style={{ color: '#7c3aed' }}>
              Across Levels 2 through 5 allocations
            </span>
            <span className="van-stat-badge van-badge-purple">L2–L5 Pools</span>
          </div>
        </div>

      </div>

      {/* Proven Executive 2-Tier 3D Filter Command Toolbar */}
      <div className="van-dir-toolbar-3d" style={{ marginBottom: '1.75rem' }}>
        
        {/* Tier 1: Search Bar & Refresh Action */}
        <div className="van-dir-toolbar-top">
          <div className="van-dir-search-wrap" style={{ flex: '1 1 360px' }}>
            <Search size={18} className="van-dir-search-icon" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by Entry ID, Order, Invoice, Level, Buyer..."
              className="van-dir-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="van-dir-clear-btn"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="van-dir-count-pill">
              {sortedRecords.length} Distribution{sortedRecords.length === 1 ? '' : 's'} Found
            </span>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Refresh ledger data"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.52rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={14} className={loading ? 'spin-anim' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="van-dir-toolbar-divider" />

        {/* Tier 2: Filter Capsules */}
        <div className="van-dir-toolbar-bottom">
          
          {/* Level Filter Capsule */}
          <div className="van-dir-filter-capsule">
            <Layers size={15} color="#6366f1" />
            <select
              value={levelFilter}
              onChange={handleLevelChange}
            >
              <option value="all">All Levels (2 to 5)</option>
              <option value="2">Level 2 (40% Pool)</option>
              <option value="3">Level 3 (30% Pool)</option>
              <option value="4">Level 4 (20% Pool)</option>
              <option value="5">Level 5 (10% Pool)</option>
            </select>
          </div>

          {/* Status Filter Capsule */}
          <div className="van-dir-filter-capsule">
            <ShieldCheck size={15} color="#10b981" />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Credited / Settled Only</option>
              <option value="partial">Partial / Active Only</option>
            </select>
          </div>

          {/* Sort By Capsule */}
          <div className="van-dir-filter-capsule">
            <SlidersHorizontal size={15} color="#f59e0b" />
            <select
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="latest">Sort: Latest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest_amount">Sort: Highest Amount</option>
              <option value="lowest_amount">Sort: Lowest Amount</option>
              <option value="level_asc">Sort: Level (2 → 5)</option>
              <option value="level_desc">Sort: Level (5 → 2)</option>
            </select>
          </div>

          {/* Per Page Capsule */}
          <div className="van-dir-filter-capsule">
            <Filter size={15} color="#64748b" />
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
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
              onClick={handleResetFilters}
              className="van-dir-reset-btn"
            >
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          )}

        </div>

      </div>

      {/* Proper Level Income Records Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Level Income Distribution Records
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Real-time records from <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>
            </p>
          </div>

          <span
            style={{
              fontSize: '0.8rem',
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              padding: '0.3rem 0.75rem',
              borderRadius: '8px',
              fontWeight: 800,
            }}
          >
            {sortedRecords.length} Record{sortedRecords.length === 1 ? '' : 's'} Found
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.95rem 1.15rem', width: '85px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Entry ID
                </th>
                <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Order / Invoice
                </th>
                <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Allocation Level
                </th>
                <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Source Member / Buyer
                </th>
                <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Payment Type
                </th>
                <th style={{ padding: '0.95rem 1.15rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Level Income Amount
                </th>
                <th style={{ padding: '0.95rem 1.15rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Distribution Status
                </th>
                <th style={{ padding: '0.95rem 1.15rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Transaction Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '28px',
                        height: '28px',
                        border: '3px solid #cbd5e1',
                        borderTopColor: '#4f46e5',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <div style={{ marginTop: '0.75rem', fontSize: '0.86rem', fontWeight: 600 }}>
                      Loading Level Income ledger...
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: '#eff6ff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem auto',
                      }}
                    >
                      <Package size={30} />
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem', fontSize: '1.15rem' }}>
                      No Level Income Records Found
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                      {hasActiveFilters
                        ? 'No records matched your search or filter criteria. Try resetting filters to view all entries.'
                        : 'There are currently no Level Income distributions recorded for your account. When team downlines in Levels 2 to 5 make eligible purchases, your level income will appear here.'}
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{
                          padding: '0.55rem 1.25rem',
                          background: '#4f46e5',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => {
                  const badge = getLevelBadge(rec.level || rec.level_number);
                  const amountVal = Number(rec.amount ?? rec.total_amount ?? 0);
                  const paidVal = Number(rec.paid_amount ?? amountVal);
                  const isPaid = paidVal >= amountVal && amountVal > 0;
                  const paymentType = (rec.payment_type || rec.paymentType || 'advance').toLowerCase();

                  return (
                    <tr
                      key={rec.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                    >
                      {/* Entry ID */}
                      <td style={{ padding: '0.95rem 1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>#{rec.id}</span>
                      </td>

                      {/* Order / Invoice */}
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                            {rec.order_id || rec.orderId ? `Order #${rec.order_id || rec.orderId}` : '—'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#64748b' }}>
                            {rec.invoice_number || rec.invoiceNumber || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Level Badge */}
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              display: 'inline-block',
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                            {badge.share}
                          </span>
                        </div>
                      </td>

                      {/* Source Member */}
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: '#1e293b',
                          }}
                        >
                          <User size={13} color="#64748b" />
                          <span>{rec.source_member || rec.level_id || 'Team Member'}</span>
                        </span>
                      </td>

                      {/* Payment Type */}
                      <td style={{ padding: '0.95rem 1.15rem' }}>
                        <span
                          style={{
                            background: paymentType === 'advance' ? '#eff6ff' : (paymentType === 'balance' ? '#fefce8' : '#f8fafc'),
                            color: paymentType === 'advance' ? '#1d4ed8' : (paymentType === 'balance' ? '#a16207' : '#475569'),
                            border: `1px solid ${paymentType === 'advance' ? '#bfdbfe' : (paymentType === 'balance' ? '#fef08a' : '#e2e8f0')}`,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {paymentType}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.95rem 1.15rem', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          {formatINR(amountVal)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.95rem 1.15rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: isPaid ? '#f0fdf4' : '#fefce8',
                            color: isPaid ? '#15803d' : '#a16207',
                            border: `1px solid ${isPaid ? '#bbf7d0' : '#fef08a'}`,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{isPaid ? 'Credited to Wallet' : 'In Progress'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.95rem 1.15rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={13} color="#94a3b8" />
                          <span>{formatDateTime(rec.created_at)}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sortedRecords.length > 0 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              fontSize: '0.84rem',
              color: '#64748b',
              background: '#fafbfc',
            }}
          >
            <div>
              Showing entries{' '}
              <strong style={{ color: '#0f172a' }}>
                {(currentPage - 1) * perPage + 1}
              </strong>{' '}
              to{' '}
              <strong style={{ color: '#0f172a' }}>
                {Math.min(currentPage * perPage, sortedRecords.length)}
              </strong>{' '}
              of{' '}
              <strong style={{ color: '#0f172a' }}>{sortedRecords.length}</strong> total
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: currentPage <= 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span style={{ padding: '0 0.65rem', fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '0.45rem 0.85rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Accounting Note */}
      <div
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1.15rem 1.5rem',
          fontSize: '0.8rem',
          color: '#64748b',
          lineHeight: 1.6,
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ color: '#6366f1', marginTop: '0.1rem', flexShrink: 0 }}>
          <Info size={18} />
        </div>
        <div>
          <strong style={{ color: '#1e293b' }}>Accounting Note:</strong> Level Income entries represent indirect team allocations distributed from eligible purchases: Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%). Level 1 members receive Direct Income and are excluded from Level Income pools. All rows reflect verified records from the <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>.
        </div>
      </div>
    </div>
  );
}

export default LevelIncomeDetailsPage;
