import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  Receipt,
  FileText,
  Sparkles,
  RotateCcw,
  Search,
  X,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Building2,
  Wallet,
  Copy,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { getUserBusinessReports } from '../../api/userBusinessReportsService';
import { formatINR } from '../../utils/formatters';
import DataTable from '../common/DataTable';

function PaymentTransactions({ user }) {
  const [salesList, setSalesList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payModeFilter, setPayModeFilter] = useState('all');

  const userCode = user?.user_code || 'CB100001';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchTransactions = useCallback(async (showNotice = false) => {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);

      const res = await getUserBusinessReports({ user_code: userCode });
      if (res && res.status === 'success') {
        setSalesList(res.salesList || []);
        setSummary(res.summary || null);
        if (showNotice) {
          showToast('✓ Transaction ledger synced from database!');
        }
      }
    } catch (err) {
      console.error('Error fetching database payment transactions:', err);
      showToast('Could not load payment transactions from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userCode]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalPurchasesSum = useMemo(() => {
    return salesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [salesList]);

  const receivedPaymentsSum = Number(summary?.totalReceivedPayment || 0);
  const pendingBalanceSum = Number(summary?.totalBalancePayment || 0);

  const realizationRate = useMemo(() => {
    if (!totalPurchasesSum || totalPurchasesSum === 0) return 0;
    return Math.min(100, Math.round((receivedPaymentsSum / totalPurchasesSum) * 100));
  }, [receivedPaymentsSum, totalPurchasesSum]);

  // Distinct payment methods
  const paymentMethods = useMemo(() => {
    const set = new Set();
    salesList.forEach((item) => {
      if (item.payMode && typeof item.payMode === 'string') {
        const mode = item.payMode.trim();
        if (mode) set.add(mode);
      }
    });
    return Array.from(set).sort();
  }, [salesList]);

  // Filtered transactions
  const filteredSales = useMemo(() => {
    return salesList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = String(item.id || '').toLowerCase().includes(q);
        const serviceMatch = String(item.service || '').toLowerCase().includes(q);
        const entityMatch = String(item.entityName || '').toLowerCase().includes(q);
        const payMatch = String(item.payMode || '').toLowerCase().includes(q);
        const dateMatch = String(item.date || '').toLowerCase().includes(q);
        if (!idMatch && !serviceMatch && !entityMatch && !payMatch && !dateMatch) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        const st = String(item.status || '').toLowerCase();
        if (statusFilter === 'completed' && st !== 'completed' && st !== 'paid') return false;
        if (statusFilter === 'partial' && st !== 'partial') return false;
        if (statusFilter === 'pending' && st !== 'pending') return false;
      }

      if (payModeFilter !== 'all' && item.payMode !== payModeFilter) {
        return false;
      }

      return true;
    });
  }, [salesList, searchQuery, statusFilter, payModeFilter]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ ${label} copied to clipboard!`);
  };

  const openInvoiceModal = (item) => {
    setSelectedInvoice(item);
  };

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Invoice Reference & Date',
      accessor: 'id',
      render: (val, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                color: '#1e40af',
                fontSize: '0.85rem',
                background: '#eff6ff',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #bfdbfe',
              }}
            >
              {val}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(val, 'Invoice Number')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.1rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Copy Invoice ID"
            >
              <Copy size={13} />
            </button>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} color="#94a3b8" />
            <span>{row.date}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Service / Product',
      accessor: 'service',
      render: (val) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.875rem' }}>{val}</strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Verified Order Item</span>
        </div>
      ),
    },
    {
      header: 'Creating Entity',
      accessor: 'entityName',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Building2 size={15} color="#6366f1" style={{ flexShrink: 0 }} />
          <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.85rem' }}>{val || 'Vyapar AdNET'}</span>
        </div>
      ),
    },
    {
      header: 'Payment Method',
      accessor: 'payMode',
      render: (val) => (
        <span
          style={{
            background: '#f8fafc',
            color: '#334155',
            border: '1px solid #e2e8f0',
            padding: '0.25rem 0.65rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Wallet size={12} color="#64748b" />
          <span>{val || 'Online / Gateway'}</span>
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: 'amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (val) => {
        const isCompleted = val?.toLowerCase() === 'completed' || val?.toLowerCase() === 'paid';
        const isPartial = val?.toLowerCase() === 'partial';

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.24rem 0.7rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              background: isCompleted ? '#ecfdf5' : isPartial ? '#fffbeb' : '#fef2f2',
              color: isCompleted ? '#059669' : isPartial ? '#b45309' : '#dc2626',
              border: `1px solid ${
                isCompleted ? '#a7f3d0' : isPartial ? '#fde68a' : '#fecaca'
              }`,
            }}
          >
            {isCompleted ? <CheckCircle2 size={12} strokeWidth={2.5} /> : <Clock size={12} strokeWidth={2.5} />}
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
      render: (_val, row) => (
        <button
          type="button"
          onClick={() => openInvoiceModal(row)}
          style={{
            background: '#ffffff',
            color: '#1e40af',
            border: '1.5px solid #bfdbfe',
            padding: '0.42rem 0.95rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(30, 64, 175, 0.08)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.borderColor = '#93c5fd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#bfdbfe';
          }}
        >
          <FileText size={14} />
          <span>Tax Invoice</span>
        </button>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1.25rem 3.5rem 1.25rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            padding: '0.9rem 1.5rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#38BDF8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <CreditCard size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Finance • Payment Ledger & Invoices</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Payment Transactions & Invoices
            </h1>
            <p className="van-catalog-hero-desc">
              Official real-time ledger of package purchases, entity project sales, invoices, and verified payment receipts.
            </p>
          </div>
        </div>

        {/* Right Gross Turnover Pod & Actions */}
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
          {/* Gross Turnover Glass Pod */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: '0.85rem 1.4rem',
              textAlign: 'center',
              minWidth: '220px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#c7d2fe',
                fontWeight: 800,
                display: 'block',
              }}
            >
              Gross Invoiced Value
            </span>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#fbbf24',
                marginTop: '0.15rem',
                textShadow: '0 2px 10px rgba(251, 191, 36, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{formatINR(totalPurchasesSum)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              {salesList.length} Invoices Recorded
            </span>
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fetchTransactions(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Ledger'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Premium 3D KPI Summary Pods - Strictly 1 Row */}
      <div
        className="van-rewards-kpi-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Card 1: Total Transactions Value */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#2563EB' }}>
                Total Transactions Value
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-blue" title="Total Value">
                <CreditCard size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value">
              <span>{formatINR(totalPurchasesSum)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Gross transaction volume
            </span>
            <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              {salesList.length} Invoices
            </span>
          </div>
        </div>

        {/* Card 2: Received Payments */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #34D399, #059669)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#059669' }}>
                Received Payments
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-emerald" title="Received">
                <CheckCircle2 size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#059669' }}>
              <span>{formatINR(receivedPaymentsSum)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Realized advance collections
            </span>
            <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
              Realized
            </span>
          </div>
        </div>

        {/* Card 3: Pending Balance Due */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #FBBF24, #D97706)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#D97706' }}>
                Pending Balance Due
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-amber" title="Pending Balance">
                <Clock size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: pendingBalanceSum > 0 ? '#b45309' : '#64748b' }}>
              <span>{formatINR(pendingBalanceSum)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Active balance receivables
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
              Pending
            </span>
          </div>
        </div>

        {/* Card 4: Realization Rate */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#7C3AED' }}>
                Realization Rate
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-purple" title="Realization Rate">
                <TrendingUp size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#7C3AED' }}>
              <span>{realizationRate}%</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Collected</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Recovery efficiency
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              Efficiency
            </span>
          </div>
        </div>
      </div>

      {/* Sleek Unified 3D Filter & Search Command Bar */}
      <div
        className="van-dir-toolbar-3d"
        style={{
          padding: '1.15rem 1.45rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Left: Search Bar with 3D Icon Pod */}
        <div className="van-dir-search-wrap" style={{ flex: '1 1 360px', minWidth: '260px' }}>
          <div className="van-dir-search-icon-pod">
            <Search size={16} color="#2563EB" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions by invoice, service, entity, or date..."
            className="van-dir-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="van-dir-search-clear"
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Filter Capsules + Count + Refresh Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter Capsule */}
          <div className="van-dir-filter-capsule">
            <ShieldCheck size={15} color="#10b981" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({salesList.length})</option>
              <option value="completed">✓ Completed / Paid</option>
              <option value="partial">⏱ Partial Payment</option>
              <option value="pending">⏳ Pending Payment</option>
            </select>
          </div>

          {/* Payment Method Capsule */}
          {paymentMethods.length > 0 && (
            <div className="van-dir-filter-capsule">
              <Wallet size={15} color="#6366f1" />
              <select
                value={payModeFilter}
                onChange={(e) => setPayModeFilter(e.target.value)}
              >
                <option value="all">All Payment Methods</option>
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters Button */}
          {(searchQuery || statusFilter !== 'all' || payModeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPayModeFilter('all');
              }}
              className="van-dir-reset-btn"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}

          {/* Record Count Pill */}
          <span className="van-dir-count-pill">
            {filteredSales.length} Transaction{filteredSales.length === 1 ? '' : 's'}
          </span>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            title="Sync transactions with database"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.52rem 0.95rem',
              borderRadius: '9999px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* DataTable Container with Enhanced 3D Framing */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)',
        }}
      >
        <DataTable
          columns={columns}
          data={filteredSales}
          defaultPageSize={10}
          searchable={false}
          showPageSize={false}
          loading={loading}
          emptyMessage="No payment transactions found in database matching your criteria."
        />
      </div>

      {/* ============================================================== */}
      {/* OFFICIAL TAX INVOICE PREVIEW MODAL                             */}
      {/* ============================================================== */}
      {selectedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.45)',
              border: '1.5px solid #e2e8f0',
              padding: '2.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    marginBottom: '0.4rem',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <Receipt size={14} />
                  <span>TAX INVOICE RECEIPT</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {selectedInvoice.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              >
                ✕
              </button>
            </div>

            {/* Issuer & Customer Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                background: '#f8fafc',
                padding: '1.25rem 1.4rem',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                  Billing Entity / Issuer
                </span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedInvoice.entityName || 'Vyapar AdNET Business Network'}
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginTop: '0.15rem' }}>
                  Official Registered Network Entity
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                  Customer / Member
                </span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem' }}>
                  {user?.name || 'Verified Member'}
                </strong>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginTop: '0.15rem' }}>
                  Code: {userCode}
                </span>
              </div>
            </div>

            {/* Invoice Line Item Breakdown */}
            <div
              style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  background: '#f1f5f9',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#475569',
                }}
              >
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a', display: 'block' }}>{selectedInvoice.service}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Payment Mode: {selectedInvoice.payMode} • Date: {selectedInvoice.date}</span>
                </div>
                <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{formatINR(selectedInvoice.amount)}</strong>
              </div>

              {/* Total Summary */}
              <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Billed Amount:</span>
                  <strong style={{ color: '#0f172a' }}>{formatINR(selectedInvoice.amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span
                    style={{
                      background: selectedInvoice.status?.toLowerCase() === 'completed' ? '#ecfdf5' : '#fffbeb',
                      color: selectedInvoice.status?.toLowerCase() === 'completed' ? '#059669' : '#b45309',
                      padding: '0.15rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                    }}
                  >
                    ● {selectedInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentTransactions;