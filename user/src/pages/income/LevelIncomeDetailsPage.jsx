import { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Level Badge configuration (40/30/20/10 pool shares)
  const getLevelBadge = (level) => {
    const lvl = Number(level);
    switch (lvl) {
      case 2:
        return { label: 'Level 2', share: '40% Pool', bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' };
      case 3:
        return { label: 'Level 3', share: '30% Pool', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 4:
        return { label: 'Level 4', share: '20% Pool', bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 5:
        return { label: 'Level 5', share: '10% Pool', bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
      default:
        return { label: `Level ${lvl}`, share: 'Team', bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
    }
  };

  return (
    <div className="user-page-container" style={{ padding: '1.5rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header & Breadcrumbs */}
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
            My Income • Team Level Details
          </div>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Level Income Full Details
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: '#64748b' }}>
            Detailed transaction records across Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%) allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: '0.55rem 1rem',
              background: '#f8fafc',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Level Income</span>
          </button>

          <button
            type="button"
            onClick={loadData}
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
              <span>Total Ledger Entries: <strong>{allRecords.length} Distribution(s)</strong></span>
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
            onClick={loadData}
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

      {/* Summary Cards: Exactly Total Level Income and Remaining Balance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#4338ca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL LEVEL INCOME
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#312e81', marginTop: '0.35rem' }}>
            {formatINR(summary.total_amount)}
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
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            REMAINING BALANCE
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: summary.balance_amount > 0 ? '#b45309' : '#64748b', marginTop: '0.35rem' }}>
            {formatINR(summary.balance_amount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>
            Available balance for withdrawal / payout
          </div>
        </div>

        {/* Card 3: Total Distributions Recorded */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #10b981',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL ENTRIES RECORDED
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#065f46', marginTop: '0.35rem' }}>
            {formatNumberIN(allRecords.length)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>
            Across Levels 2 through 5 allocations
          </div>
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
        {/* Search Input */}
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
            placeholder="Search by Entry ID, Order, Invoice, Level, Buyer..."
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

        {/* Filter Controls */}
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

          {/* Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
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
              title="Entries per page"
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

      {/* Proper Level Income Records Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            padding: '1.15rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Level Income Distribution Records
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              Real-time records from <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>
            </p>
          </div>

          <span
            style={{
              fontSize: '0.78rem',
              background: '#eff6ff',
              color: '#1e40af',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            {sortedRecords.length} Record{sortedRecords.length === 1 ? '' : 's'} Found
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem', width: '75px' }}>Entry ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>Order / Invoice</th>
                <th style={{ padding: '0.85rem 1rem' }}>Allocation Level</th>
                <th style={{ padding: '0.85rem 1rem' }}>Source Member / Buyer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Payment Type</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Level Income Amount</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Distribution Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Transaction Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '26px',
                        height: '26px',
                        border: '3px solid #cbd5e1',
                        borderTopColor: '#2563eb',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <div style={{ marginTop: '0.6rem', fontSize: '0.85rem' }}>Loading Level Income ledger...</div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto',
                      }}
                    >
                      <Package size={28} />
                    </div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', fontSize: '1.1rem' }}>
                      No Level Income Records Found
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
                      {search || levelFilter !== 'all' || statusFilter !== 'all'
                        ? 'No records matched your search or filter criteria. Try resetting filters to view all entries.'
                        : 'There are currently no Level Income distributions recorded for your account. When team downlines in Levels 2 to 5 make eligible purchases, your level income will appear here.'}
                    </div>
                    {(search || levelFilter !== 'all' || statusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{
                          padding: '0.5rem 1.15rem',
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
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        #{rec.id}
                      </td>

                      {/* Order / Invoice */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                            {rec.order_id || rec.orderId ? `Order #${rec.order_id || rec.orderId}` : '—'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#64748b' }}>
                            {rec.invoice_number || rec.invoiceNumber || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Level Badge */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              display: 'inline-block',
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                            {badge.share}
                          </span>
                        </div>
                      </td>

                      {/* Source Member */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: '#1e293b',
                          }}
                        >
                          <User size={13} color="#64748b" />
                          <span>{rec.source_member || rec.level_id || 'Team Member'}</span>
                        </span>
                      </td>

                      {/* Payment Type */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            background: paymentType === 'advance' ? '#eff6ff' : (paymentType === 'balance' ? '#fefce8' : '#f8fafc'),
                            color: paymentType === 'advance' ? '#1d4ed8' : (paymentType === 'balance' ? '#a16207' : '#475569'),
                            border: `1px solid ${paymentType === 'advance' ? '#bfdbfe' : (paymentType === 'balance' ? '#fef08a' : '#e2e8f0')}`,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {paymentType}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          {formatINR(amountVal)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: isPaid ? '#f0fdf4' : '#fefce8',
                            color: isPaid ? '#15803d' : '#a16207',
                            border: `1px solid ${isPaid ? '#bbf7d0' : '#fef08a'}`,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span>{isPaid ? 'Credited to Wallet' : 'In Progress'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
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
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.82rem',
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

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: currentPage <= 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
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
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
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
      </div>

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
        ℹ️ <strong>System Note:</strong> Level Income entries represent indirect team allocations distributed from eligible purchases: Level 2 (40%), Level 3 (30%), Level 4 (20%), and Level 5 (10%). Level 1 members receive Direct Income and are excluded from Level Income pools. All rows reflect verified records from the <code>level_incomes</code> database table for Member <strong>{summary.member_id}</strong>.
      </div>
    </div>
  );
}

export default LevelIncomeDetailsPage;
