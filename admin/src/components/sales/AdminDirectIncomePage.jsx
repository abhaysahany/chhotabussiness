import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminDirectIncomeOverview,
  getAdminDirectIncomeOrders,
} from '../../api/adminIncomeService';
import { formatDate } from '../../utils/timezone';

function AdminDirectIncomePage() {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [sponsorFilter, setSponsorFilter] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('last_distribution_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset page on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Overview Data
  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const res = await getAdminDirectIncomeOverview();
      const metrics = res?.metrics || res?.summary || res?.data || res;
      setOverview(metrics);
    } catch (err) {
      console.error('Error loading direct income overview:', err);
      setOverviewError(err?.message || 'Failed to fetch direct income overview statistics.');
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
      if (statusFilter !== 'all') params.status = statusFilter;
      if (entityTypeFilter !== 'all') params.entity_type = entityTypeFilter;
      if (sponsorFilter.trim()) params.sponsor = sponsorFilter.trim();
      if (buyerFilter.trim()) params.buyer = buyerFilter.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minAmount) params.min_amount = minAmount;
      if (maxAmount) params.max_amount = maxAmount;

      const res = await getAdminDirectIncomeOrders(params);
      const ordersList = res?.orders || res?.data || [];
      const pag = res?.pagination || {
        current_page: currentPage,
        last_page: 1,
        per_page: perPage,
        total: ordersList.length,
      };

      setOrders(ordersList);
      setPagination(pag);
    } catch (err) {
      console.error('Error loading direct income orders:', err);
      setOrdersError(err?.message || 'Failed to fetch order-wise direct income records.');
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
    statusFilter,
    entityTypeFilter,
    sponsorFilter,
    buyerFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  ]);

  // Load initial overview once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAdminDirectIncomeOverview();
        if (mounted) {
          const metrics = res?.metrics || res?.summary || res?.data || res;
          setOverview(metrics);
          setLoadingOverview(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading direct income overview:', err);
          setOverviewError(err?.message || 'Failed to fetch direct income overview statistics.');
          setLoadingOverview(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load orders when filter dependencies change
  useEffect(() => {
    let mounted = true;
    (async () => {
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
        if (statusFilter !== 'all') params.status = statusFilter;
        if (entityTypeFilter !== 'all') params.entity_type = entityTypeFilter;
        if (sponsorFilter.trim()) params.sponsor = sponsorFilter.trim();
        if (buyerFilter.trim()) params.buyer = buyerFilter.trim();
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (minAmount) params.min_amount = minAmount;
        if (maxAmount) params.max_amount = maxAmount;

        const res = await getAdminDirectIncomeOrders(params);
        if (mounted) {
          const ordersList = res?.orders || res?.data || [];
          const pag = res?.pagination || {
            current_page: currentPage,
            last_page: 1,
            per_page: perPage,
            total: ordersList.length,
          };
          setOrders(ordersList);
          setPagination(pag);
          setLoadingOrders(false);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading direct income orders:', err);
          setOrdersError(err?.message || 'Failed to fetch order-wise direct income records.');
          setOrders([]);
          setLoadingOrders(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    currentPage,
    perPage,
    sortBy,
    sortOrder,
    debouncedSearch,
    statusFilter,
    entityTypeFilter,
    sponsorFilter,
    buyerFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  ]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setEntityTypeFilter('all');
    setSponsorFilter('');
    setBuyerFilter('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('last_distribution_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Helper for status badges
  const getBadgeStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'reconciled' || s === 'balanced') {
      return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
    }
    if (s === 'partial' || s === 'incomplete wallet trace') {
      return { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' };
    }
    if (s === 'mismatch' || s === 'discrepancy') {
      return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
    }
    return { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
  };

  const reconciliationData = overview?.reconciliation || {};
  const isPlatformReconciled =
    reconciliationData.is_reconciled === true ||
    reconciliationData.status === 'Reconciled' ||
    reconciliationData.reconciliation_status === 'Balanced' ||
    (reconciliationData.reconciliation_difference ?? reconciliationData.overall_difference) === 0;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto', fontFamily: 'inherit' }}>
      {/* 1. PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              Direct Income – Order-wise Overview
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                letterSpacing: '0.04em',
              }}
            >
              READ-ONLY REPORTING
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Monitor company-wide Direct Income distributions across orders, beneficiaries and installment payments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              loadOverview();
              loadOrders();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
            }}
            title="Refresh All Data"
          >
            <span>↻</span> Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate('/orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#2563eb',
              border: 'none',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(37,99,235,0.2)',
            }}
            title="Go to Order Management"
          >
            Manage Orders & Allocations →
          </button>
        </div>
      </div>

      {/* READ-ONLY INFORMATION NOTICE */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #3b82f6',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          ℹ️ <strong>Auditing & Monitoring Mode:</strong> This section displays cross-reconciled financial metrics. Commission disbursement actions remain strictly centralized under{' '}
          <span
            onClick={() => navigate('/orders')}
            style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
          >
            Order Management
          </span>
          .
        </div>
      </div>

      {/* 2. GLOBAL KPI SUMMARY CARDS (8 CARDS) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
          Company-Wide Direct Income Performance
        </div>

        {overviewError ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '10px', color: '#991b1b', fontSize: '0.85rem' }}>
            ⚠️ {overviewError}{' '}
            <button
              onClick={loadOverview}
              style={{ marginLeft: '0.5rem', textDecoration: 'underline', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Card 1: Total Eligible Orders */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Eligible Orders
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
                {loadingOverview ? '—' : Number(overview?.total_eligible_orders ?? overview?.totalEligibleOrders ?? 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Confirmed Orders with Sponsor
              </div>
            </div>

            {/* Card 2: Total Expected Direct Income */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #1e40af' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Expected Direct Income
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e40af', marginTop: '0.3rem' }}>
                {loadingOverview
                  ? '—'
                  : `₹${Number(overview?.total_expected_direct_income ?? overview?.total_expected_income ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                40% of Expected Admin Cut
              </div>
            </div>

            {/* Card 3: Total Distributed Direct Income */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Distributed Direct Income
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '0.3rem' }}>
                {loadingOverview
                  ? '—'
                  : `₹${Number(overview?.total_distributed_direct_income ?? overview?.total_distributed_income ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.2rem', fontWeight: 600 }}>
                Successfully Credited to Wallets
              </div>
            </div>

            {/* Card 4: Total Pending Direct Income */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Pending Direct Income
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '0.3rem' }}>
                {loadingOverview
                  ? '—'
                  : `₹${Number(overview?.total_pending_direct_income ?? overview?.total_pending_income ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Eligible Uncollected/Unallocated
              </div>
            </div>

            {/* Card 5: Total Approved Dump Direct Income */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Approved Dump Write-Off
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#475569', marginTop: '0.3rem' }}>
                {loadingOverview
                  ? '—'
                  : `₹${Number(overview?.total_dump_direct_income ?? overview?.total_dump_income ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Non-Cash Extinguished Portion
              </div>
            </div>

            {/* Card 6: Total Successful Distributions */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Installment Distributions
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.3rem' }}>
                {loadingOverview ? '—' : Number(overview?.total_distributions_count ?? overview?.total_distribution_count ?? 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Completed Installment Payouts
              </div>
            </div>

            {/* Card 7: Total Beneficiary Members */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #0891b2' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Beneficiary Sponsors
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0891b2', marginTop: '0.3rem' }}>
                {loadingOverview ? '—' : Number(overview?.total_beneficiaries_count ?? overview?.total_beneficiaries ?? 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Distinct Members Credited
              </div>
            </div>

            {/* Card 8: Overall Completion Percentage */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Completion Rate
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>
                {loadingOverview ? '—' : `${Number(overview?.completion_percentage ?? overview?.overall_completion_percentage ?? 0)}%`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.2rem', fontWeight: 600 }}>
                Distributed / Expected
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. GLOBAL RECONCILIATION HEALTH PANEL */}
      <div
        style={{
          background: isPlatformReconciled ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${isPlatformReconciled ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: isPlatformReconciled ? '#166534' : '#991b1b',
                letterSpacing: '0.04em',
              }}
            >
              Platform Four-Way Cross-Reconciliation Status
            </span>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
              Cross-validates Summary Table, Sale Payment Receipts, Direct Income Ledger, and Wallet Transfer Credits.
            </div>
          </div>

          <span
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              background: isPlatformReconciled ? '#16a34a' : '#dc2626',
              color: '#ffffff',
              letterSpacing: '0.04em',
            }}
          >
            {isPlatformReconciled ? '✓ SYSTEM BALANCED' : '⚠️ RECONCILIATION DISCREPANCY'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>1. Summary Distributed Total</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              ₹{Number(reconciliationData.summary_distributed_total ?? overview?.total_distributed_direct_income ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>2. Sale Payments Distributed Total</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              ₹{Number(reconciliationData.sale_payments_distributed_total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>3. Direct Income Ledger Total</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              ₹{Number(reconciliationData.direct_incomes_ledger_total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>4. Wallet Transfer Credit Total</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
              ₹{Number(reconciliationData.wallet_transfers_credit_total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Platform Variance</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isPlatformReconciled ? '#16a34a' : '#dc2626', marginTop: '0.2rem' }}>
              ₹{Number(reconciliationData.reconciliation_difference ?? reconciliationData.overall_difference ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: isPlatformReconciled ? '#15803d' : '#991b1b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{isPlatformReconciled ? '✓' : '⚠️'}</span>
          <span>{reconciliationData.message || (isPlatformReconciled ? 'All four financial layers are perfectly balanced with ₹0.00 variance.' : `Variance of ₹${reconciliationData.reconciliation_difference} detected.`)}</span>
        </div>
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
          {/* Search Box */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Multi-Field Search
            </label>
            <input
              type="text"
              placeholder="Search by Order ID, Invoice #, Buyer Name/Code, Sponsor Name/Code, Entity, Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Distribution Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">All Distribution Statuses</option>
              <option value="completed">Completed (100% Settled)</option>
              <option value="partial">Partial (In Progress)</option>
              <option value="pending">Pending (Unallocated)</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Entity Type
            </label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">All Entities</option>
              <option value="business">Registered Business</option>
              <option value="freelancer">Freelancer Professional</option>
            </select>
          </div>
        </div>

        {/* Second Row of Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
            >
              <option value="last_distribution_at">Latest Distribution</option>
              <option value="latest_order">Latest Order Date</option>
              <option value="highest_gross">Highest Gross Value</option>
              <option value="highest_expected">Highest Expected Direct</option>
              <option value="highest_distributed">Highest Distributed Direct</option>
              <option value="highest_pending">Highest Pending Direct</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Sort Direction
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
            >
              <option value="desc">Descending (High to Low)</option>
              <option value="asc">Ascending (Low to High)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Records Per Page
            </label>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#ffffff' }}
            >
              <option value={10}>10 records</option>
              <option value={15}>15 records</option>
              <option value={20}>20 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* 5. GLOBAL ORDER-WISE TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
            Order-wise Direct Income Ledger{' '}
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              ({pagination.total} Total Eligible Orders)
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Showing Page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page || 1}</strong>
          </div>
        </div>

        {ordersError && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
            ⚠️ {ordersError}
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={loadOrders}
                style={{ padding: '0.4rem 1rem', borderRadius: '6px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {loadingOrders && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <div
              className="spinner"
              style={{
                width: '32px',
                height: '32px',
                borderColor: '#2563eb transparent transparent transparent',
                margin: '0 auto',
              }}
            />
            <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
              Loading order direct income records...
            </p>
          </div>
        )}

        {!loadingOrders && !ordersError && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '1500px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Order Date</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Product / Offering</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Seller Entity</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Buyer (Customer)</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Sponsor (Beneficiary)</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Gross Amount</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Rate (%)</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#1e40af' }}>Expected Direct</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#059669' }}>Distributed Direct</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#d97706' }}>Pending Direct</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#475569' }}>Approved Dump</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Installments</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Reconciliation</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={17} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📦</div>
                      <strong>No eligible Direct Income orders found.</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem' }}>
                        Try clearing or adjusting search queries and filter options.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id || o.order_id}
                      onClick={() => navigate(`/income/direct-orders/${o.order_id || o.id}`)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        #{o.order_id || o.id}
                      </td>

                      {/* Invoice # */}
                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', color: '#1e293b', fontWeight: 600 }}>
                        {o.invoice_number || o.invoiceNumber || '—'}
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(o.order_date || o.orderDate)}
                      </td>

                      {/* Product / Service */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.item_name || o.itemName || 'Package / Service'}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                          {o.item_type || o.itemType || 'Package'}
                        </span>
                      </td>

                      {/* Seller Entity */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {o.entity_name || o.entityName || '—'}
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            textTransform: 'capitalize',
                          }}
                        >
                          {o.entity_type || o.entityType || 'Business'}
                        </span>
                      </td>

                      {/* Buyer */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {o.buyer_name || o.buyerName || 'Buyer'}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>
                          {o.buyer_user_code || o.buyerUserCode || '—'}
                        </span>
                      </td>

                      {/* Sponsor */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {o.sponsor_name || o.sponsorName || 'Sponsor'}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                          {o.sponsor_user_code || o.sponsorUserCode || '—'}
                        </span>
                      </td>

                      {/* Gross Amount */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        ₹{Number(o.order_gross_amount ?? o.orderGrossAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Admin Commission % */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {o.admin_commission_percent ?? o.adminCommissionPercent ?? 15}%
                      </td>

                      {/* Expected Direct */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                        ₹{Number(o.total_expected_amount ?? o.totalExpectedAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Distributed Direct */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        ₹{Number(o.total_distributed_amount ?? o.totalDistributedAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Pending Direct */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: Number(o.total_pending_amount ?? o.totalPendingAmount ?? 0) > 0 ? '#d97706' : '#94a3b8' }}>
                        ₹{Number(o.total_pending_amount ?? o.totalPendingAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Approved Dump */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: Number(o.total_dump_amount ?? o.totalDumpAmount ?? 0) > 0 ? '#64748b' : '#cbd5e1' }}>
                        ₹{Number(o.total_dump_amount ?? o.totalDumpAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Distribution Count */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                        {o.distribution_count ?? o.distributionCount ?? 0}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            ...getBadgeStyle(o.distribution_status || o.distributionStatus),
                          }}
                        >
                          {o.distribution_status || o.distributionStatus || 'pending'}
                        </span>
                      </td>

                      {/* Reconciliation Status */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            ...getBadgeStyle(o.reconciliation_status || o.reconciliationStatus),
                          }}
                        >
                          {o.reconciliation_status || o.reconciliationStatus || 'Balanced'}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/income/direct-orders/${o.order_id || o.id}`);
                          }}
                          style={{
                            background: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)',
                          }}
                        >
                          View Full Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. PAGINATION BAR */}
        {!loadingOrders && pagination.total > 0 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ color: '#64748b' }}>
              Showing records <strong>{(pagination.current_page - 1) * pagination.per_page + 1}</strong> to{' '}
              <strong>{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</strong> of{' '}
              <strong>{pagination.total}</strong> eligible orders
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: pagination.current_page <= 1 ? '#f1f5f9' : '#ffffff',
                  color: pagination.current_page <= 1 ? '#94a3b8' : '#334155',
                  cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                ← Previous
              </button>

              <span style={{ padding: '0 0.5rem', fontWeight: 600, color: '#0f172a' }}>
                Page {pagination.current_page} of {pagination.last_page || 1}
              </span>

              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: pagination.current_page >= pagination.last_page ? '#f1f5f9' : '#ffffff',
                  color: pagination.current_page >= pagination.last_page ? '#94a3b8' : '#334155',
                  cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDirectIncomePage;
