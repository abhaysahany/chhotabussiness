import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Info,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import { getUserLevelIncome } from '../../api/userIncomeService';
import OrderLevelIncomeCard from '../../components/income/OrderLevelIncomeCard';
import { formatINR, formatNumberIN } from '../../utils/formatters';

function LevelIncomePage({ user, onNavigate }) {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadLevelIncome = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserLevelIncome();
      if (res && res.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load Level Income summary.');
      }
    } catch (err) {
      console.error('Error loading level income:', err);
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLevelIncome();
  }, [loadLevelIncome]);

  // Navigate to Dedicated Details Page
  const handleOpenDetails = (targetId) => {
    if (typeof onNavigate === 'function') {
      onNavigate(targetId ? `level-income/${targetId}` : 'level-income-details');
    } else {
      navigate(targetId ? `/level-income/${targetId}` : '/level-income/details');
    }
  };

  // Summary Metrics
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
  }, [allRecords, levelFilter, statusFilter, search]);

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
    const start = (page - 1) * perPage;
    return sortedRecords.slice(start, start + perPage);
  }, [sortedRecords, page, perPage]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleLevelChange = (e) => {
    setLevelFilter(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setLevelFilter('all');
    setStatusFilter('all');
    setSortBy('latest');
    setPerPage(10);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    levelFilter !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'latest' ||
    perPage !== 10
  );

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
              <span>My Income • Team Levels (2 to 5) Dossier</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Level Income
            </h1>
            <p className="van-catalog-hero-desc">
              Track your indirect Level Income received across Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%).
            </p>
          </div>
        </div>

        {/* Right Stats Chips & Action Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.15rem',
            flexShrink: 0,
          }}
        >
          {/* Top Row: Quick Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">40% Pool</div>
              <div className="van-catalog-stat-chip-lbl">Levels 2 to 5</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {formatNumberIN(allRecords.length)}
              </div>
              <div className="van-catalog-stat-chip-lbl">Distributions</div>
            </div>
          </div>

          {/* Bottom Row: View Full Details Action Button */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleOpenDetails()}
              className="van-btn-share-3d"
              style={{
                padding: '0.72rem 1.5rem',
                height: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.86rem',
                fontWeight: 800,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                borderBottom: '3px solid #1E40AF',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px -3px rgba(37, 99, 235, 0.45)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              title="View full audit ledger breakdown"
            >
              <span>View Full Details</span>
              <ArrowRight size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      {/* User Identity & Level Pool Account Strip */}
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
              background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
              flexShrink: 0,
            }}
          >
            <Layers size={26} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {summary.user_name || user?.name || 'Partner Member'}
              </span>
              <span
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#A5B4FC',
                  border: '1px solid rgba(165, 180, 252, 0.4)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}
              >
                ● Level Earner
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
              <span>User ID: <strong style={{ color: '#F1F5F9' }}>#{summary.user_id || user?.id}</strong></span>
              <span>•</span>
              <span>Member Code: <strong style={{ color: '#818CF8' }}>{summary.member_id || user?.user_code}</strong></span>
              <span>•</span>
              <span>Level Entries: <strong style={{ color: '#F1F5F9' }}>{allRecords.length} Record{allRecords.length === 1 ? '' : 's'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.15), rgba(79, 70, 229, 0.25))',
              border: '1.5px solid #818CF8',
              color: '#A5B4FC',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.15)',
            }}
          >
            Level 2 – 5 Accounts (40% Pool)
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
            onClick={loadLevelIncome}
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
        {/* Card 1: Total Level Income */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #4F46E5, #3730A3)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#4F46E5',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Total Level Income
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-indigo"
              style={{ animationDelay: '0s' }}
              title="Cumulative Indirect Team Allocations"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#1E1B4B' }}>
            {formatINR(totalLevelIncome)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Cumulative indirect team allocations
            </span>
            <span className="van-card-badge-pill" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
              Gross Pool
            </span>
          </div>
        </div>

        {/* Card 2: Remaining Balance */}
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
              Remaining Balance
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '0.4s' }}
              title="Available for Withdrawal / Payout"
            >
              <Clock size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: remainingBalance > 0 ? '#B45309' : '#64748B' }}>
            {formatINR(remainingBalance)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Available for withdrawal / payout
            </span>
            <span className="van-card-badge-pill amber" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              Available
            </span>
          </div>
        </div>

        {/* Card 3: Settled to Wallet */}
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
              Settled to Wallet
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.8s' }}
              title="Total Distributed & Settled Cash"
            >
              <CheckCircle2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#047857' }}>
            {formatINR(totalPaid)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Credited directly to wallet
            </span>
            <span className="van-card-badge-pill emerald">
              Settled
            </span>
          </div>
        </div>

        {/* Card 4: Level Entries */}
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
              Total Level Entries
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '1.2s' }}
              title="Total Level Commission Records"
            >
              <Layers size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#6D28D9' }}>
            {allRecords.length}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Across Levels 2, 3, 4, 5
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              4 Tiers
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Quick Stats Ribbon */}
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
            <span style={{ color: '#64748B', fontWeight: 650 }}>Total Level Distributions: </span>
            <strong style={{ color: '#0F172A', fontWeight: 850 }}>{formatNumberIN(allRecords.length)}</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div>
            <span style={{ color: '#64748B', fontWeight: 650 }}>Settled to Wallet: </span>
            <strong style={{ color: '#047857', fontWeight: 850 }}>{formatINR(totalPaid)}</strong>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div>
            <span style={{ color: '#64748B', fontWeight: 650 }}>Active Pools: </span>
            <strong style={{ color: '#4F46E5', fontWeight: 850 }}>Levels 2 to 5 (40% Pool)</strong>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => handleOpenDetails()}
            style={{
              padding: '0.5rem 1.15rem',
              background: '#F8FAFC',
              color: '#2563EB',
              border: '1.5px solid #BFDBFE',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
          >
            <span>View Full Details Table</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Advanced 3D Filter & Search Command Toolbar (2-Tier Layout) */}
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
              placeholder="Search by Record ID, Order ID, Invoice, Level, Buyer..."
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

          {/* Right: Quick Refresh & Record Count Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={loadLevelIncome}
              disabled={loading}
              className="van-dir-reset-btn"
              style={{
                background: '#EFF6FF',
                borderColor: '#BFDBFE',
                color: '#1D4ED8',
                padding: '0.52rem 1rem',
              }}
              title="Refresh level income records from database"
            >
              <RotateCcw size={14} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <div className="van-dir-count-pill" style={{ padding: '0.5rem 0.95rem' }}>
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{sortedRecords.length}</span>
              <span>{sortedRecords.length === 1 ? 'record found' : 'records found'}</span>
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

            {/* Level Filter */}
            <div className={`van-dir-filter-capsule ${levelFilter !== 'all' ? 'active' : ''}`}>
              <Layers size={15} color="#7C3AED" strokeWidth={2.2} />
              <select
                value={levelFilter}
                onChange={handleLevelChange}
                aria-label="Filter by Level Tier"
              >
                <option value="all">All Levels (2 to 5)</option>
                <option value="2">Level 2 (40% Pool)</option>
                <option value="3">Level 3 (30% Pool)</option>
                <option value="4">Level 4 (20% Pool)</option>
                <option value="5">Level 5 (10% Pool)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className={`van-dir-filter-capsule ${statusFilter !== 'all' ? 'active' : ''}`}>
              <ShieldCheck size={15} color="#10B981" strokeWidth={2.2} />
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                aria-label="Filter by Distribution Status"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Credited / Settled Only</option>
                <option value="partial">Partial / Active Only</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className={`van-dir-filter-capsule ${sortBy !== 'latest' ? 'active' : ''}`}>
              <SlidersHorizontal size={15} color="#D97706" strokeWidth={2.2} />
              <select
                value={sortBy}
                onChange={handleSortChange}
                aria-label="Sort Records"
              >
                <option value="latest">Sort: Latest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="highest_amount">Sort: Highest Amount</option>
                <option value="lowest_amount">Sort: Lowest Amount</option>
                <option value="level_asc">Sort: Level (2 → 5)</option>
                <option value="level_desc">Sort: Level (5 → 2)</option>
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
                aria-label="Cards per page"
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

          {/* Right: Pool Distribution Note */}
          <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 650 }}>
            <span>Dynamic Team Override: </span>
            <strong style={{ color: '#7C3AED' }}>40% Level Pool</strong>
          </div>
        </div>
      </div>

      {/* Large Clean Cards Section */}
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
                  Loading Level Income Cards...
                </div>
              </div>
            ))}
          </div>
        ) : sortedRecords.length === 0 ? (
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
              No Level Income Records Found
            </h3>
            <p style={{ margin: '0 auto 1.35rem auto', fontSize: '0.88rem', color: '#64748B', maxWidth: '480px' }}>
              {search || levelFilter !== 'all' || statusFilter !== 'all'
                ? 'No level income records matched your current search or filter criteria. Try clearing filters to see all entries.'
                : 'Your Level Income details will appear here automatically when eligible purchases from downline members in Levels 2 to 5 are processed.'}
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
          // Render Level Income Cards using OrderLevelIncomeCard
          paginatedRecords.map((record) => (
            <OrderLevelIncomeCard
              key={record.id}
              record={record}
              onViewDetails={handleOpenDetails}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {sortedRecords.length > 0 && (
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
            Showing records{' '}
            <strong style={{ color: '#0F172A', fontWeight: 800 }}>
              {(page - 1) * perPage + 1}
            </strong>{' '}
            to{' '}
            <strong style={{ color: '#0F172A', fontWeight: 800 }}>
              {Math.min(page * perPage, sortedRecords.length)}
            </strong>{' '}
            of <strong style={{ color: '#0F172A', fontWeight: 800 }}>{sortedRecords.length}</strong> total
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '0.45rem 0.85rem',
                background: page <= 1 ? '#F8FAFC' : '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                color: page <= 1 ? '#94A3B8' : '#334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 750,
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ padding: '0 0.65rem', fontWeight: 800, color: '#0F172A', fontSize: '0.82rem' }}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '0.45rem 0.85rem',
                background: page >= totalPages ? '#F8FAFC' : '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '8px',
                color: page >= totalPages ? '#94A3B8' : '#334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 750,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Accounting Note */}
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
          <span>Vyapar Adnet Level Income Accounting System</span>
        </div>
        <div>
          • <strong>System Allocation:</strong> Level Income represents the 40% Admin Cut pool distributed dynamically across team downlines: Level 2 = 40%, Level 3 = 30%, Level 4 = 20%, and Level 5 = 10%.
        </div>
        <div>
          • <strong>Direct Sponsor Exclusion:</strong> Direct sponsors receive Direct Income (Level 1 excluded from the level pool).
        </div>
        <div>
          • <strong>Real-Time Verification:</strong> All figures reflect verified real-time records from the <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>.
        </div>
      </div>
    </div>
  );
}

export default LevelIncomePage;
