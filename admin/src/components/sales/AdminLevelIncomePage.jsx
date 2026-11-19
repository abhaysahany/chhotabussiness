import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminLevelIncomeOverview,
  getAdminLevelIncomeOrders,
} from '../../api/adminIncomeService';
import { formatDate } from '../../utils/timezone';
import AdminLevelIncomeDetailsModal from './AdminLevelIncomeDetailsModal';

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
  const [beneficiaryFilter, setBeneficiaryFilter] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Quick Drill-Down
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

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
      if (beneficiaryFilter.trim()) params.beneficiary = beneficiaryFilter.trim();
      if (buyerFilter.trim()) params.buyer = buyerFilter.trim();
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
    beneficiaryFilter,
    buyerFilter,
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
    setBeneficiaryFilter('');
    setBuyerFilter('');
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
      'Buyer Code',
      'Buyer Name',
      'Beneficiary Code',
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

  const levelBreakdown = overview?.level_breakdown || overview?.levelBreakdown || [];

  return (
    <div className="pro-orders-container" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
              Level Income Multi-Tier Monitoring
            </h1>
            <span
              style={{
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                letterSpacing: '0.05em',
              }}
            >
              UPLINE TIERS (L2 - L5)
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Consolidated multi-level earnings, upline distribution ledger, and 4-way platform reconciliation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              loadOverview();
              loadOrders();
            }}
            disabled={loadingOverview || loadingOrders}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loadingOrders ? 'spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem 1.15rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Total Orders */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Eligible Orders
            </span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {overview ? (overview.total_eligible_orders || overview.totalEligibleOrders || 0) : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {overview?.total_records || 0} Level records tracked
          </div>
        </div>

        {/* Expected Level Income */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Expected Level Pool
            </span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.5rem' }}>
            {overview
              ? `₹${Number(overview.total_expected_level_income || overview.totalExpectedLevelIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Global 40% Level Allocation
          </div>
        </div>

        {/* Distributed Level Income */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Distributed Payout
            </span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
            {overview
              ? `₹${Number(overview.total_distributed_level_income || overview.totalDistributedLevelIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.25rem', fontWeight: 600 }}>
            {overview ? `${overview.completion_percentage || overview.completionPercentage || 0}% Realized` : '—'}
          </div>
        </div>

        {/* Pending Balance */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Pending Balance
            </span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: overview?.total_pending_level_income > 0 ? '#f59e0b' : '#0f172a', marginTop: '0.5rem' }}>
            {overview
              ? `₹${Number(overview.total_pending_level_income || overview.totalPendingLevelIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Pending milestone receipts
          </div>
        </div>

        {/* Total Beneficiaries */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Beneficiaries
            </span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.5rem' }}>
            {overview ? (overview.total_beneficiaries_count || overview.totalBeneficiariesCount || 0) : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {overview?.total_distributions_count || 0} Total distributions
          </div>
        </div>
      </div>

      {/* Level Breakdown Strip */}
      {levelBreakdown && levelBreakdown.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '1.15rem 1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Level-wise Performance Summary
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Levels 2 to 5 dynamic split distribution
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
            }}
          >
            {levelBreakdown.map((lvl) => (
              <div
                key={lvl.level}
                onClick={() => setLevelFilter(String(lvl.level))}
                style={{
                  backgroundColor: levelFilter === String(lvl.level) ? '#ede9fe' : '#f8fafc',
                  border: `1.5px solid ${levelFilter === String(lvl.level) ? '#7c3aed' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: levelFilter === String(lvl.level) ? '#6d28d9' : '#0f172a',
                    }}
                  >
                    {lvl.level_label || `Level ${lvl.level}`}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      color: '#64748b',
                    }}
                  >
                    {lvl.count} recs
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem' }}>
                  ₹{Number(lvl.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Expected: ₹{Number(lvl.total_expected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Cross-Reconciliation Health Card */}
      <div
        className="pro-income-reconciliation-grid"
        style={{
          backgroundColor: overview?.reconciliation_status === 'Reconciled' ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${overview?.reconciliation_status === 'Reconciled' ? '#bbf7d0' : '#fde68a'}`,
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: overview?.reconciliation_status === 'Reconciled' ? '#dcfce7' : '#fef3c7',
              color: overview?.reconciliation_status === 'Reconciled' ? '#15803d' : '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: overview?.reconciliation_status === 'Reconciled' ? '#15803d' : '#b45309' }}>
                Level Income 4-Way Reconciliation: {overview?.reconciliation_status || 'Reconciled'}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  color: '#475569',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                Variance: ₹{Number(overview?.reconciliation_difference || 0).toFixed(2)}
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#475569' }}>
              {overview?.reconciliation_message ||
                'All platform Level Income records match across total summaries, level income ledger installments, and wallet transfers with 0.00 variance.'}
            </p>
          </div>
        </div>

        {overview?.ledger_totals && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Total Summaries: <strong style={{ color: '#0f172a' }}>₹{Number(overview.ledger_totals.total_level_incomes_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Ledger Installments: <strong style={{ color: '#0f172a' }}>₹{Number(overview.ledger_totals.level_incomes_installments || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Row 1: Search & Level Filter */}
        <div
          className="pro-income-filter-grid-row1"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '1rem',
          }}
        >
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by Invoice #, Order ID, Buyer Member ID, Beneficiary Member ID, Entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="all">All Levels (L2 - L5)</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="all">All Distribution Statuses</option>
              <option value="completed">Completed (Fully Paid)</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Filters & Date Range */}
        <div
          className="pro-income-filter-grid-row2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          {/* Entity Type */}
          <div>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="all">All Entity Types</option>
              <option value="business">Business</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              title="Start Date"
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              title="End Date"
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Reset Filters Button */}
          <div>
            <button
              onClick={handleResetFilters}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Level Income Records Ledger</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: '#ede9fe',
                color: '#6d28d9',
              }}
            >
              {pagination.total} records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '0.35rem 0.65rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.8rem',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive-inner" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Order & Invoice</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Entity</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Buyer Member</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>Beneficiary</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Level</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Total Level</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Paid</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Balance</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        width: '32px',
                        height: '32px',
                        border: '3px solid #ede9fe',
                        borderTopColor: '#7c3aed',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                      Loading level income ledger...
                    </p>
                  </td>
                </tr>
              ) : ordersError ? (
                <tr>
                  <td colSpan="11" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#dc2626' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{ordersError}</p>
                    <button
                      onClick={loadOrders}
                      style={{
                        marginTop: '0.75rem',
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.4rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                      }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem' }}>
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>No Level Income records found</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
                      Try adjusting your search criteria, level filter, or date range.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/income/level-orders/${row.order_id || row.id}`)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Order & Invoice */}
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {row.invoice_number || `Order #${row.order_id}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Order ID: #{row.order_id}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.82rem' }}>
                      {formatDate(row.order?.date || row.created_at)}
                    </td>

                    {/* Entity */}
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.order?.entity_name || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                        {row.order?.entity_type || 'business'}
                      </div>
                    </td>

                    {/* Buyer Member */}
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.buyer?.name || row.level_id || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Member ID: <strong>{row.buyer?.user_code || row.level_id}</strong>
                      </div>
                    </td>

                    {/* Beneficiary Upline */}
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.beneficiary?.name || row.user_code || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Member ID: <strong>{row.beneficiary?.user_code || row.user_code}</strong>
                      </div>
                    </td>

                    {/* Level Badge */}
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          backgroundColor:
                            row.level === 2
                              ? '#ede9fe'
                              : row.level === 3
                              ? '#e0e7ff'
                              : row.level === 4
                              ? '#e0f2fe'
                              : '#fef3c7',
                          color:
                            row.level === 2
                              ? '#6d28d9'
                              : row.level === 3
                              ? '#4338ca'
                              : row.level === 4
                              ? '#0369a1'
                              : '#b45309',
                        }}
                      >
                        {row.level_label || `Level ${row.level}`}
                      </span>
                    </td>

                    {/* Total Level Expected */}
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(row.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Paid */}
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                      ₹{Number(row.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Balance */}
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: 800, color: row.balance_amount > 0 ? '#f59e0b' : '#64748b' }}>
                      ₹{Number(row.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          backgroundColor:
                            row.status === 'completed'
                              ? '#dcfce7'
                              : row.status === 'partial'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            row.status === 'completed'
                              ? '#166534'
                              : row.status === 'partial'
                              ? '#b45309'
                              : '#991b1b',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/income/level-orders/${row.order_id || row.id}`);
                        }}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          background: '#ede9fe',
                          color: '#6d28d9',
                          border: '1px solid #ddd6fe',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#7c3aed';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = '#7c3aed';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ede9fe';
                          e.currentTarget.style.color = '#6d28d9';
                          e.currentTarget.style.borderColor = '#ddd6fe';
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.last_page > 1 && (
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing page <strong>{pagination.current_page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} records)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1}
                style={{
                  padding: '0.4rem 0.85rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: pagination.current_page <= 1 ? '#94a3b8' : '#334155',
                  cursor: pagination.current_page <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page}
                style={{
                  padding: '0.4rem 0.85rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: pagination.current_page >= pagination.last_page ? '#94a3b8' : '#334155',
                  cursor: pagination.current_page >= pagination.last_page ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drill-Down Audit Modal */}
      {selectedOrderId && (
        <AdminLevelIncomeDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

export default AdminLevelIncomePage;
