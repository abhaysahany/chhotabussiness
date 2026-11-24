import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Filter,
  FolderKanban,
  ShieldCheck,
  Eye,
  X,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  BarChart3,
  Check,
  ArrowRight
} from 'lucide-react';
import { getUserBusinessReports } from '../../api/userBusinessReportsService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';

function SalesReportPage({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserBusinessReports({
        user_code: user?.user_code,
      });
      if (res && res.status === 'success') {
        setReportData(res);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching database sales reports:', err);
      setError('Unable to load database sales records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (selectedOrder) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selectedOrder]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedOrder) {
        setSelectedOrder(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder]);

  const summary = reportData?.summary || {
    totalGrossSales: 0,
    totalReceivedPayment: 0,
    totalBalancePayment: 0,
    totalDumpPayment: 0,
    totalSalesCount: 0,
    completedSalesCount: 0,
    partialSalesCount: 0,
    averageDealSize: 0,
  };

  const rawSalesList = reportData?.salesList || [];

  const availableCategories = useMemo(() => {
    const cats = new Set(rawSalesList.map((item) => item.category).filter(Boolean));
    return Array.from(cats);
  }, [rawSalesList]);

  const filteredSales = useMemo(() => {
    return rawSalesList.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesStatus && matchesCategory;
    });
  }, [rawSalesList, statusFilter, categoryFilter]);

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  const realizationRate = summary.totalGrossSales > 0
    ? Math.round((summary.totalReceivedPayment / summary.totalGrossSales) * 100)
    : 0;

  // Enhanced DataTable Column Definitions
  const columns = [
    {
      header: 'Invoice & Date',
      accessor: 'id',
      render: (val, row) => (
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#EFF6FF',
              color: '#1D4ED8',
              padding: '0.2rem 0.55rem',
              borderRadius: '7px',
              fontWeight: 800,
              fontSize: '0.78rem',
              border: '1px solid #DBEAFE',
            }}
          >
            #{val}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: '#64748B',
              marginTop: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 650,
            }}
          >
            <Calendar size={12} color="#94A3B8" />
            <span>{row.date}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Entity & Domain',
      accessor: 'entityName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.86rem', lineHeight: 1.3 }}>
            {val}
          </div>
          <span
            style={{
              background: '#F5F3FF',
              color: '#7C3AED',
              border: '1px solid #DDD6FE',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.15rem 0.55rem',
              borderRadius: '6px',
              display: 'inline-block',
              marginTop: '0.25rem',
            }}
          >
            {row.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Service / Package',
      accessor: 'service',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.84rem' }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Client / Buyer',
      accessor: 'customer',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem' }}>{val}</div>
          {row.customerUserCode && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#2563EB',
                fontWeight: 800,
                background: '#EFF6FF',
                padding: '0.12rem 0.45rem',
                borderRadius: '5px',
                display: 'inline-block',
                marginTop: '0.2rem',
                border: '1px solid #DBEAFE',
              }}
            >
              ID: {row.customerUserCode}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Gross Value',
      accessor: 'amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.9rem' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Received Advance',
      accessor: 'advancePayment',
      align: 'right',
      render: (val, row) => {
        const pct = row.amount > 0 ? Math.round((val / row.amount) * 100) : 0;
        return (
          <div>
            <div style={{ fontWeight: 850, color: '#047857', fontSize: '0.9rem' }}>
              {formatINR(val)}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 750 }}>
              {pct}% Realized
            </span>
          </div>
        );
      },
    },
    {
      header: 'Balance Due',
      accessor: 'balanceDue',
      align: 'right',
      render: (val) => (
        <span
          style={{
            fontWeight: 850,
            color: val > 0 ? '#B45309' : '#64748B',
            fontSize: '0.9rem',
          }}
        >
          {val > 0 ? formatINR(val) : '₹0'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (val) => {
        const isCompleted = val.toLowerCase() === 'completed';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: isCompleted ? '#ECFDF5' : '#FEF3C7',
              color: isCompleted ? '#065F46' : '#92400E',
              border: `1px solid ${isCompleted ? '#A7F3D0' : '#FDE68A'}`,
              padding: '0.25rem 0.7rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.74rem',
            }}
          >
            {isCompleted ? (
              <CheckCircle2 size={12} strokeWidth={2.6} />
            ) : (
              <Clock size={12} strokeWidth={2.6} />
            )}
            <span>{val}</span>
          </span>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      align: 'right',
      render: (val, row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #BFDBFE',
            padding: '0.42rem 0.85rem',
            borderRadius: '9px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563EB';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = '#1D4ED8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#EFF6FF';
            e.currentTarget.style.color = '#2563EB';
            e.currentTarget.style.borderColor = '#BFDBFE';
          }}
        >
          <Eye size={13} strokeWidth={2.4} />
          <span>Details</span>
        </button>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <TrendingUp size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Live Entity Sales & Project Dossier</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Sales Performance Reports
            </h1>
            <p className="van-catalog-hero-desc">
              Live audit of all sales done by entities with received advances, outstanding balance receivables, and dump values.
            </p>
          </div>
        </div>

        {/* Right Stats Chips & Action Button Area */}
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
              <div className="van-catalog-stat-chip-val">{formatNumberIN(summary.totalSalesCount)}</div>
              <div className="van-catalog-stat-chip-lbl">Project Orders</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {realizationRate}%
              </div>
              <div className="van-catalog-stat-chip-lbl">Realized Rate</div>
            </div>
          </div>

          {/* Bottom Row: 3D Refresh Action Button */}
          <button
            type="button"
            onClick={fetchReports}
            className="van-btn-share-3d"
            style={{
              padding: '0.72rem 1.6rem',
              height: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderBottom: '3px solid #1E40AF',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px -3px rgba(37, 99, 235, 0.45)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title="Refresh sales records from database"
          >
            <RotateCcw size={16} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Records'}</span>
          </button>
        </div>
      </div>

      {/* 4 Signature 3D KPI Cards Grid (4 in a row Desktop, 2x2 Tablet, 1 col Mobile) */}
      <div className="van-business-kpi-grid">
        {/* Card 1: Gross Sales Done */}
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
              Gross Sales Done
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '0s' }}
              title="Total Cumulative Sales"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {formatINR(summary.totalGrossSales)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {summary.totalSalesCount} Project Orders
            </span>
            <span className="van-card-badge-pill blue">
              Gross GMV
            </span>
          </div>
        </div>

        {/* Card 2: Received Advance (Self BV) */}
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
              Received Advance (Self BV)
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.4s' }}
              title="Realized Advance Volume"
            >
              <CheckCircle2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#047857' }}>
            {formatINR(summary.totalReceivedPayment)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Realized Advance Volume
            </span>
            <span className="van-card-badge-pill emerald">
              Realized BV
            </span>
          </div>
        </div>

        {/* Card 3: Balance Receivables */}
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
              Balance Receivables
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '0.8s' }}
              title="Active Pending Dues"
            >
              <Clock size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#B45309' }}>
            {formatINR(summary.totalBalancePayment)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Active Pending Dues
            </span>
            <span className="van-card-badge-pill amber" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              Pending Dues
            </span>
          </div>
        </div>

        {/* Card 4: Dump Payments */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #EF4444, #B91C1C)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#DC2626',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Dump Payments
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-red"
              style={{ animationDelay: '1.2s' }}
              title="Unrealized / Default"
            >
              <AlertCircle size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#DC2626' }}>
            {formatINR(summary.totalDumpPayment)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Unrealized / Default
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2' }}>
              Unrealized
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar (3D Capsule Design) */}
      <div className="van-dir-toolbar-3d" style={{ marginBottom: '1.75rem' }}>
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

            {/* Service Category Filter */}
            <div className={`van-dir-filter-capsule ${categoryFilter !== 'all' ? 'active' : ''}`}>
              <FolderKanban size={15} color="#7C3AED" strokeWidth={2.2} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by Service Category"
              >
                <option value="all">All Service Categories ({availableCategories.length})</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className={`van-dir-filter-capsule ${statusFilter !== 'all' ? 'active' : ''}`}>
              <ShieldCheck size={15} color="#10B981" strokeWidth={2.2} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by Status"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed (Full)</option>
                <option value="partial">Partial Payment</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="van-dir-reset-btn"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <RotateCcw size={13} strokeWidth={2.4} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right: Actions & Metric Chips */}
          <div className="van-dir-actions-cluster">
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#475569',
                background: '#F8FAFC',
                padding: '0.42rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Sparkles size={13} color="#2563EB" />
              <span>
                Avg Deal:{' '}
                <strong style={{ color: '#0F172A' }}>
                  {formatINR(
                    summary.averageDealSize ||
                      (summary.totalSalesCount > 0 ? summary.totalGrossSales / summary.totalSalesCount : 0)
                  )}
                </strong>
              </span>
            </div>

            <div className="van-dir-count-pill">
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{filteredSales.length}</span>
              <span>{filteredSales.length === 1 ? 'record found' : 'records found'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredSales}
        defaultPageSize={10}
        searchPlaceholder="Search invoice, client, service, or entity..."
        loading={loading}
      />

      {/* Sale Record Dossier Modal (3D Glassmorphic Experience) */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '2.5rem 1.25rem',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '22px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: 'calc(100vh - 5rem)',
              margin: 'auto',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1.5px solid #E2E8F0',
              animation: 'vanFadeScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header with 2-Color Gradient & 3D Pod */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #0F172A 100%)',
                padding: '1.25rem 1.6rem',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <FileText size={20} color="#FFFFFF" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                    Invoice #{selectedOrder.id}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#BAE6FD', marginTop: '0.15rem', fontWeight: 650 }}>
                    Official Entity Sales & Project Dossier
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                aria-label="Close modal"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.4rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', overflowY: 'auto', flex: '1 1 auto' }}>
              {/* 4-Grid Metadata */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '1.15rem 1.25rem',
                  borderRadius: '14px',
                  border: '1.5px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building2 size={13} color="#2563EB" />
                    <span>CREATING ENTITY</span>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                    {selectedOrder.entityName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    BUYER USER
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                    {selectedOrder.customer}
                  </div>
                  {selectedOrder.customerUserCode && (
                    <span style={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 800 }}>
                      ID: {selectedOrder.customerUserCode}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FolderKanban size={13} color="#7C3AED" />
                    <span>CATEGORY DOMAIN</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7C3AED', marginTop: '0.25rem' }}>
                    {selectedOrder.category}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CreditCard size={13} color="#10B981" />
                    <span>PAYMENT METHOD</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>
                    {selectedOrder.payMode || 'Standard Banking'}
                  </div>
                </div>
              </div>

              {/* Progress Bar for Advance Realization */}
              {selectedOrder.amount > 0 && (
                <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 750 }}>
                    <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={13} />
                      Paid: {Math.round((selectedOrder.advancePayment / selectedOrder.amount) * 100)}%
                    </span>
                    <span style={{ color: selectedOrder.balanceDue > 0 ? '#B45309' : '#64748B' }}>
                      Pending: {Math.round((selectedOrder.balanceDue / selectedOrder.amount) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (selectedOrder.advancePayment / selectedOrder.amount) * 100)}%`,
                        background: 'linear-gradient(90deg, #10B981, #059669)',
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Financial Breakdown Card */}
              <div
                style={{
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.7rem',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 650 }}>Total Project Gross Value:</span>
                  <strong style={{ color: '#0F172A', fontSize: '0.98rem' }}>{formatINR(selectedOrder.amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ color: '#047857', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={14} /> Received Advance (Self BV):
                  </span>
                  <strong style={{ color: '#047857', fontSize: '0.98rem' }}>{formatINR(selectedOrder.advancePayment)}</strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.88rem',
                    borderTop: '1.5px dashed #E2E8F0',
                    paddingTop: '0.7rem',
                  }}
                >
                  <span style={{ color: '#B45309', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> Remaining Balance Due:
                  </span>
                  <strong style={{ color: '#B45309', fontSize: '0.98rem' }}>{formatINR(selectedOrder.balanceDue)}</strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.1rem 1.6rem',
                background: '#F8FAFC',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.55rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReportPage;
