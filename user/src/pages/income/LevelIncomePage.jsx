import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  ArrowRight,
  TrendingUp,
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

  // Summary Metrics — Only Total Level Income and Remaining Balance retained per prompt
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

  return (
    <div className="user-page-container" style={{ padding: '1.5rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header & Breadcrumb Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            My Income • Team Levels (2 to 5)
          </div>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Level Income
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: '#64748b' }}>
            Track your indirect Level Income received across Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('my-income')}
              style={{
                padding: '0.55rem 1rem',
                background: '#f8fafc',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← My Income Overview
            </button>
          )}

          {/* View Full Details Button */}
          <button
            type="button"
            onClick={() => handleOpenDetails()}
            style={{
              padding: '0.55rem 1.15rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
          >
            <span>View Full Details</span>
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={loadLevelIncome}
            disabled={loading}
            style={{
              padding: '0.55rem 1rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <RotateCcw size={14} className={loading ? 'spin-anim' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* User Identity Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '1.15rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#818cf8',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.35rem',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {summary.user_name || user?.name || 'Partner Member'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
              <span>User ID: <strong>#{summary.user_id || user?.id}</strong></span>
              <span>•</span>
              <span>Member Code: <strong>{summary.member_id || user?.user_code}</strong></span>
              <span>•</span>
              <span>Level Entries: <strong>{allRecords.length} Record{allRecords.length === 1 ? '' : 's'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              background: 'rgba(129, 140, 248, 0.15)',
              border: '1px solid #818cf8',
              color: '#a5b4fc',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong>Error loading data:</strong> {error}
          </div>
          <button
            type="button"
            onClick={loadLevelIncome}
            style={{
              padding: '0.4rem 0.85rem',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Exactly TWO Summary Cards: Total Level Income & Remaining Balance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total Level Income */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #4f46e5',
            padding: '1.35rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#4338ca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL LEVEL INCOME
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#312e81', marginTop: '0.35rem' }}>
            {formatINR(totalLevelIncome)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600, marginTop: '0.25rem' }}>
            Cumulative indirect team allocations
          </div>
        </div>

        {/* Card 2: Remaining Balance */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b',
            padding: '1.35rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            REMAINING BALANCE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: remainingBalance > 0 ? '#b45309' : '#64748b', marginTop: '0.35rem' }}>
            {formatINR(remainingBalance)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>
            Available for withdrawal / payout
          </div>
        </div>
      </div>

      {/* Progress & Quick Stats Ribbon */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.35rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Total Level Distributions: </span>
            <strong style={{ color: '#0f172a' }}>{formatNumberIN(allRecords.length)}</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <div>
            <span style={{ color: '#64748b' }}>Settled to Wallet: </span>
            <strong style={{ color: '#15803d' }}>{formatINR(totalPaid)}</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <div>
            <span style={{ color: '#64748b' }}>Active Pools: </span>
            <strong style={{ color: '#4f46e5' }}>Levels 2 to 5</strong>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => handleOpenDetails()}
            style={{
              padding: '0.45rem 0.95rem',
              background: '#f8fafc',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>View Full Details Table</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by Record ID, Order ID, Invoice, Level, Buyer..."
            style={{
              width: '100%',
              padding: '0.55rem 2.2rem 0.55rem 2.35rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Layers size={15} color="#64748b" />
            <select
              value={levelFilter}
              onChange={handleLevelChange}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                color: '#334155',
                background: '#ffffff',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Levels (2 to 5)</option>
              <option value="2">Level 2 (40% Pool)</option>
              <option value="3">Level 3 (30% Pool)</option>
              <option value="4">Level 4 (20% Pool)</option>
              <option value="5">Level 5 (10% Pool)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={15} color="#64748b" />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                color: '#334155',
                background: '#ffffff',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Credited / Settled Only</option>
              <option value="partial">Partial / Active Only</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowUpDown size={15} color="#64748b" />
            <select
              value={sortBy}
              onChange={handleSortChange}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                color: '#334155',
                background: '#ffffff',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="latest">Sort: Latest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="highest_amount">Sort: Highest Amount</option>
              <option value="lowest_amount">Sort: Lowest Amount</option>
              <option value="level_asc">Sort: Level (2 → 5)</option>
              <option value="level_desc">Sort: Level (5 → 2)</option>
            </select>
          </div>

          {/* Per Page Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: '0.55rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                color: '#334155',
                background: '#ffffff',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
              title="Cards per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || levelFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'latest' || perPage !== 10) && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: '0.55rem 0.85rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Large Clean Cards Section (Style matched exactly with Direct Income cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {loading ? (
          // Skeleton loading state
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map((n) => (
              <div
                key={n}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    width: '28px',
                    height: '28px',
                    border: '3px solid #cbd5e1',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading Level Income Cards...</div>
              </div>
            ))}
          </div>
        ) : sortedRecords.length === 0 ? (
          // Empty State
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '3.5rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <Package size={32} />
            </div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              No Level Income Records Found
            </h3>
            <p style={{ margin: '0 auto 1.25rem auto', fontSize: '0.85rem', color: '#64748b', maxWidth: '480px' }}>
              {search || levelFilter !== 'all' || statusFilter !== 'all'
                ? 'No level income records matched your current search or filter criteria. Try clearing filters to see all entries.'
                : 'Your Level Income details will appear here when eligible purchases from downline members in Levels 2 to 5 are processed.'}
            </p>
            {(search || levelFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '0.55rem 1.2rem',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Clear Filters
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
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.82rem',
            color: '#64748b',
          }}
        >
          <div>
            Showing records{' '}
            <strong style={{ color: '#0f172a' }}>
              {(page - 1) * perPage + 1}
            </strong>{' '}
            to{' '}
            <strong style={{ color: '#0f172a' }}>
              {Math.min(page * perPage, sortedRecords.length)}
            </strong>{' '}
            of{' '}
            <strong style={{ color: '#0f172a' }}>{sortedRecords.length}</strong> total
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '0.45rem 0.75rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: page <= 1 ? '#94a3b8' : '#334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <span style={{ padding: '0 0.5rem', fontWeight: 700, color: '#0f172a' }}>
              {page} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '0.45rem 0.75rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: page >= totalPages ? '#94a3b8' : '#334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.78rem',
                fontWeight: 700,
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
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          fontSize: '0.78rem',
          color: '#64748b',
          lineHeight: 1.5,
        }}
      >
        ℹ️ <strong>System Note:</strong> Level Income represents the 40% Admin Cut pool distributed dynamically across team downlines: Level 2 = 40%, Level 3 = 30%, Level 4 = 20%, and Level 5 = 10%. Direct sponsors receive Direct Income (Level 1 excluded from level pool). All figures reflect real-time records from the <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>.
      </div>
    </div>
  );
}

export default LevelIncomePage;
