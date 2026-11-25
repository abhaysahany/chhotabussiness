import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Filter,
  FolderKanban,
  FileCheck2,
  PieChart,
  Briefcase,
  Cpu,
  Layers,
  Building2,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { getUserBusinessReports } from '../../api/userBusinessReportsService';
import { formatINR, formatNumberIN } from '../../utils/formatters';

function RevenueAnalyticsPage({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('all');

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
      console.error('Error fetching database revenue analytics:', err);
      setError('Unable to load database revenue records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

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

  const categoryBreakdown = reportData?.categoryBreakdown || [];

  const filteredRevenues = useMemo(() => {
    return categoryBreakdown.filter(
      (d) =>
        selectedDomain === 'all' ||
        d.category.toLowerCase().includes(selectedDomain.toLowerCase())
    );
  }, [categoryBreakdown, selectedDomain]);

  const realizationRate = summary.totalGrossSales > 0
    ? Math.round((summary.totalReceivedPayment / summary.totalGrossSales) * 100)
    : 0;

  const getDomainIconMeta = (catName = '') => {
    const lower = catName.toLowerCase();
    if (lower.includes('financial') || lower.includes('consulting')) {
      return {
        icon: <Briefcase size={20} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        shadow: '0 6px 14px -2px rgba(16, 185, 129, 0.45)',
        accentColor: '#10B981',
      };
    }
    if (lower.includes('marketing') || lower.includes('ad')) {
      return {
        icon: <Sparkles size={20} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        shadow: '0 6px 14px -2px rgba(139, 92, 246, 0.45)',
        accentColor: '#8B5CF6',
      };
    }
    if (lower.includes('it') || lower.includes('software') || lower.includes('dev')) {
      return {
        icon: <Cpu size={20} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
        shadow: '0 6px 14px -2px rgba(6, 182, 212, 0.45)',
        accentColor: '#0284C7',
      };
    }
    return {
      icon: <Layers size={20} strokeWidth={2.4} />,
      bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      shadow: '0 6px 14px -2px rgba(37, 99, 235, 0.45)',
      accentColor: '#3B82F6',
    };
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <PieChart size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Database Revenue Streams & Category Growth Report</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Revenue Analytics Report
            </h1>
            <p className="van-catalog-hero-desc">
              Category-wise gross revenue distribution, realized received payments, pending balance due, and dump payments.
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
              <div className="van-catalog-stat-chip-val">{categoryBreakdown.length}</div>
              <div className="van-catalog-stat-chip-lbl">Domain Sectors</div>
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
            title="Refresh database revenue streams"
          >
            <RotateCcw size={16} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Database Data'}</span>
          </button>
        </div>
      </div>

      {/* 4 Signature 3D KPI Cards Grid (4 in a row Desktop, 2x2 Tablet, 1 col Mobile) */}
      <div className="van-business-kpi-grid">
        {/* Card 1: Gross Revenue */}
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
              Gross Revenue
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-indigo"
              style={{ animationDelay: '0s' }}
              title="Total Cumulative Gross Revenue"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#1E1B4B' }}>
            {formatINR(summary.totalGrossSales)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Across {categoryBreakdown.length} Categories
            </span>
            <span className="van-card-badge-pill" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
              Gross Inflow
            </span>
          </div>
        </div>

        {/* Card 2: Received Payment */}
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
              Received Payment
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.4s' }}
              title="Realized Volume"
            >
              <CheckCircle2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#047857' }}>
            {formatINR(summary.totalReceivedPayment)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {realizationRate}% Realization Rate
            </span>
            <span className="van-card-badge-pill emerald">
              Realized BV
            </span>
          </div>
        </div>

        {/* Card 3: Balance Payment (Receivables) */}
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
              Balance Payment (Receivables)
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '0.8s' }}
              title="Pending Deals Dues"
            >
              <Clock size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#B45309' }}>
            {formatINR(summary.totalBalancePayment)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Pending from active deals
            </span>
            <span className="van-card-badge-pill amber" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              Pending Dues
            </span>
          </div>
        </div>

        {/* Card 4: Dump / Completed Value */}
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
              Dump / Completed Value
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '1.2s' }}
              title="Completed Clearances"
            >
              <FileCheck2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#6D28D9' }}>
            {formatINR(summary.totalDumpPayment)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {summary.completedSalesCount} Completed Clearances
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              Settled
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

            {/* Category Domain Filter */}
            <div className={`van-dir-filter-capsule ${selectedDomain !== 'all' ? 'active' : ''}`}>
              <FolderKanban size={15} color="#7C3AED" strokeWidth={2.2} />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                aria-label="Filter by Category Domain"
              >
                <option value="all">All Category Domains ({categoryBreakdown.length})</option>
                {categoryBreakdown.map((cat) => (
                  <option key={cat.id} value={cat.category.toLowerCase()}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {selectedDomain !== 'all' && (
              <button
                type="button"
                className="van-dir-reset-btn"
                onClick={() => setSelectedDomain('all')}
                title="Reset domain filter"
              >
                <RotateCcw size={13} strokeWidth={2.4} />
                <span>Reset Filter</span>
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
                Total Orders: <strong style={{ color: '#0F172A' }}>{summary.totalSalesCount}</strong>
              </span>
            </div>

            <div className="van-dir-count-pill">
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{filteredRevenues.length}</span>
              <span>{filteredRevenues.length === 1 ? 'stream active' : 'streams active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Grid Cards (3D SaaS Upgraded) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748B', fontWeight: 700 }}>Loading category revenue data from database...</p>
        </div>
      ) : filteredRevenues.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              border: '1px solid #DBEAFE',
            }}
          >
            <PieChart size={30} color="#2563EB" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            No Category Revenue Records Found
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
            Category metrics and performance volumes are generated dynamically as entities make sales.
          </p>
        </div>
      ) : (
        <div className="van-revenue-domains-grid">
          {filteredRevenues.map((cat) => {
            const meta = getDomainIconMeta(cat.category);
            const cardColor = cat.color || meta.accentColor;
            const realizedPct = cat.grossRevenue > 0
              ? Math.round((cat.receivedPayment / cat.grossRevenue) * 100)
              : 0;

            return (
              <div
                key={cat.id}
                className="van-revenue-domain-card"
              >
                {/* Accent Top Gradient Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: cardColor,
                  }}
                />

                {/* Top Row: Domain Icon + Title + Share Pill */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.15rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '13px',
                          background: meta.bg,
                          boxShadow: meta.shadow,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 850, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                          {cat.category}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 650, marginTop: '0.2rem' }}>
                          {cat.ordersCount} {cat.ordersCount === 1 ? 'Order Completed' : 'Orders Completed'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        padding: '0.28rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 850,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 5px rgba(37, 99, 235, 0.1)',
                      }}
                    >
                      {cat.share}% Market Share
                    </span>
                  </div>

                  {/* Gross Revenue Value */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Gross Volume Generated
                    </span>
                    <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginTop: '0.15rem' }}>
                      {formatINR(cat.grossRevenue)}
                    </div>
                  </div>

                  {/* Dual Breakdown Box (Received vs Balance) */}
                  <div
                    className="van-modal-split-grid"
                    style={{
                      gap: '0.85rem',
                      background: '#F8FAFC',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: '1.5px solid #E2E8F0',
                      marginBottom: '1.15rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        RECEIVED (SELF BV)
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 850, color: '#047857', marginTop: '0.2rem' }}>
                        {formatINR(cat.receivedPayment)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 750 }}>
                        {realizedPct}% Realized
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        BALANCE DUE
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 850, color: cat.balancePayment > 0 ? '#B45309' : '#64748B', marginTop: '0.2rem' }}>
                        {cat.balancePayment > 0 ? formatINR(cat.balancePayment) : '₹0'}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#B45309', fontWeight: 750 }}>
                        {cat.balancePayment > 0 ? 'Active Receivables' : 'Fully Cleared'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Realization Footer */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.76rem', fontWeight: 750 }}>
                    <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={12} /> Realized Volume: {realizedPct}%
                    </span>
                    <span style={{ color: '#64748B' }}>
                      Target Contribution: {cat.share}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${Math.min(100, realizedPct)}%`,
                        background: 'linear-gradient(90deg, #10B981, #059669)',
                        borderRadius: '9999px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RevenueAnalyticsPage;
