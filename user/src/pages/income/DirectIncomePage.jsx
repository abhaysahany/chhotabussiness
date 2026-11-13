import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
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
            My Income • Direct Referrals
          </div>
          <h1 style={{ margin: '0.25rem 0 0 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
            Direct Income
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: '#64748b' }}>
            Track your Direct Income received from customer orders and installment-wise distributions.
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

          <button
            type="button"
            onClick={loadSummaries}
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
              background: '#38bdf8',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.35rem',
            }}
          >
            ₹
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {data?.user?.name || user?.name || 'Partner Member'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
              <span>User ID: <strong>#{data?.user?.id || user?.id}</strong></span>
              <span>•</span>
              <span>Member Code: <strong>{data?.user?.user_code || user?.user_code}</strong></span>
              <span>•</span>
              <span>Eligible Orders: <strong>{totalOrders} Order Card{totalOrders === 1 ? '' : 's'}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
            onClick={loadSummaries}
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

      {/* 4 Top Financial Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Card 1: Total Expected Direct Income */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #0284c7',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL EXPECTED DIRECT INCOME
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0c4a6e', marginTop: '0.35rem' }}>
            {formatINR(totalExpected)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '0.25rem' }}>
            Max eligible direct entitlement
          </div>
        </div>

        {/* Card 2: Total Received Direct Income */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #16a34a',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TOTAL RECEIVED DIRECT INCOME
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532d', marginTop: '0.35rem' }}>
            {formatINR(totalReceived)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.25rem' }}>
            ● Successfully credited to wallet
          </div>
        </div>

        {/* Card 3: Pending Direct Income */}
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
            PENDING DIRECT INCOME
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: totalPending > 0 ? '#b45309' : '#64748b', marginTop: '0.35rem' }}>
            {formatINR(totalPending)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '0.25rem' }}>
            Awaiting order balance installments
          </div>
        </div>

        {/* Card 4: Approved Dump Direct Income */}
        <div
          style={{
            background: '#faf5ff',
            borderRadius: '12px',
            border: '1px solid #e9d5ff',
            borderLeft: '4px solid #7c3aed',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            APPROVED DUMP DIRECT INCOME
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#581c87', marginTop: '0.35rem' }}>
            {formatINR(totalDump)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.25rem' }}>
            Non-cash write-offs (Not in wallet)
          </div>
        </div>
      </div>

      {/* Additional Stats & Progress Ribbon */}
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
            <span style={{ color: '#64748b' }}>Total Eligible Orders: </span>
            <strong style={{ color: '#0f172a' }}>{formatNumberIN(totalOrders)}</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <div>
            <span style={{ color: '#64748b' }}>Total Installment Distributions: </span>
            <strong style={{ color: '#0f172a' }}>{formatNumberIN(totalDistributions)}</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <div>
            <span style={{ color: '#64748b' }}>Overall Collection Progress: </span>
            <strong style={{ color: completionPercentage >= 100 ? '#15803d' : '#2563eb' }}>
              {completionPercentage}%
            </strong>
          </div>
        </div>

        <div style={{ width: '220px', maxWidth: '100%' }}>
          <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${completionPercentage}%`,
                background: completionPercentage >= 100 ? '#10b981' : '#2563eb',
                borderRadius: '9999px',
                transition: 'width 0.4s ease',
              }}
            />
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
            placeholder="Search by Invoice, Order ID, Customer, Item..."
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
              <option value="all">All Distribution Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="partial">Partial Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowUpDown size={15} color="#64748b" />
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
              <option value="last_distribution">Sort: Last Distribution</option>
              <option value="latest_order">Sort: Latest Order</option>
              <option value="highest_received">Sort: Highest Received</option>
              <option value="highest_pending">Sort: Highest Pending</option>
              <option value="highest_gross">Sort: Highest Order Value</option>
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
              title="Orders per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || statusFilter !== 'all' || sortBy !== 'last_distribution_at' || perPage !== 10) && (
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

      {/* Order Cards Section: Exactly ONE Card per Order */}
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
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading Order Cards...</div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
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
              No Direct Income Orders Found
            </h3>
            <p style={{ margin: '0 auto 1.25rem auto', fontSize: '0.85rem', color: '#64748b', maxWidth: '480px' }}>
              {search || statusFilter !== 'all'
                ? 'No orders matched your current search or filter criteria. Try clearing filters to see all eligible orders.'
                : 'Your Direct Income details will appear here when an eligible Order distribution is processed.'}
            </p>
            {(search || statusFilter !== 'all') && (
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
            Showing orders{' '}
            <strong style={{ color: '#0f172a' }}>
              {(pagination.current_page - 1) * pagination.per_page + 1}
            </strong>{' '}
            to{' '}
            <strong style={{ color: '#0f172a' }}>
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            </strong>{' '}
            of <strong style={{ color: '#0f172a' }}>{pagination.total}</strong> total eligible orders
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              disabled={pagination.current_page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.4rem 0.75rem',
                background: pagination.current_page <= 1 ? '#f8fafc' : '#ffffff',
                color: pagination.current_page <= 1 ? '#94a3b8' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ padding: '0 0.5rem', fontWeight: 700, color: '#0f172a' }}>
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            <button
              type="button"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              style={{
                padding: '0.4rem 0.75rem',
                background: pagination.current_page >= pagination.last_page ? '#f8fafc' : '#ffffff',
                color: pagination.current_page >= pagination.last_page ? '#94a3b8' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
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

      {/* Accounting & Policy Information Note */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1.15rem 1.35rem',
          fontSize: '0.78rem',
          color: '#64748b',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
          ℹ️ Vyapar Adnet Direct Income Order-Wise Accounting System
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
