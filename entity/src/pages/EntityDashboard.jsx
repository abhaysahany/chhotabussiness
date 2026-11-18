import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
import {
  Building2,
  Receipt,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Zap,
  RefreshCw,
  Clock,
  Briefcase,
  DollarSign,
  Package,
  CheckCircle2,
  Printer,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileText,
  Wallet,
  Activity,
  BarChart3,
  PieChart,
  Target,
  BarChart2,
  Copy,
  Check,
} from 'lucide-react';
import { getEntityDashboardStats, getEntityProfile } from '../api/entityService';

function EntityDashboard() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [settlementCountdown, setSettlementCountdown] = useState({ hours: 14, minutes: 42, seconds: 19 });
  const [copiedCode, setCopiedCode] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState({
    gross: false,
    net: false,
    balance: false,
  });

  const navigate = useNavigate();

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleSeries = (seriesName, key) => {
    try {
      ApexCharts.exec('dual-axis-velocity-chart', 'toggleSeries', seriesName);
    } catch (e) {
      console.error('Error toggling series:', e);
    }
    setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Next bank settlement countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSettlementCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real-time MySQL SaaS stats
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, profileRes] = await Promise.allSettled([
        getEntityDashboardStats(timeRange),
        getEntityProfile(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.status === 'success') {
        setData(statsRes.value);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value?.user) {
        setUser(profileRes.value.user);
      }
    } catch (err) {
      console.error('Error fetching entity dashboard stats:', err);
      setError('Unable to load real-time analytics from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const storedUser = user || JSON.parse(localStorage.getItem('entity_user') || '{}');
  const entityDetails = storedUser?.entity_details;

  // Normalized KPIs
  const kpis = useMemo(() => {
    const raw = data?.kpis || {};
    return {
      totalGrossSales: Number(raw.totalGrossSales) || 0,
      totalNetEarnings: Number(raw.totalNetEarnings) || 0,
      totalBalanceDue: Number(raw.totalBalanceDue) || 0,
      totalPlatformFeePaid: Number(raw.totalPlatformFeePaid) || 0,
      totalInvoicesCount: Number(raw.totalInvoicesCount) || 0,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 0,
    };
  }, [data]);

  // 1. Dual-Axis Mixed Chart (Combo Bar + Line) for Sales & Bank Disbursal
  const mixedComboOptions = useMemo(() => {
    const categories = data?.charts?.categories || (
      timeRange === '6m'
        ? ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026']
        : timeRange === '30d'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    );

    return {
      chart: {
        id: 'dual-axis-velocity-chart',
        height: 330,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        dropShadow: {
          enabled: true,
          top: 3,
          left: 1,
          blur: 6,
          opacity: 0.12,
          color: '#059669',
        },
      },
      stroke: {
        width: [0, 3.5, 2.5],
        curve: 'smooth',
        dashArray: [0, 0, 4],
      },
      plotOptions: {
        bar: {
          columnWidth: '42%',
          borderRadius: 8,
          borderRadiusApplication: 'end',
        },
      },
      colors: ['#636B2F', '#059669', '#d97706'],
      xaxis: {
        categories,
        labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
        axisBorder: { show: false },
      },
      yaxis: [
        {
          title: { text: 'Gross Turnover (₹)', style: { color: '#636B2F', fontSize: '11px', fontWeight: 700 } },
          labels: {
            formatter: (val) => `₹${((Number(val) || 0) / 1000).toFixed(0)}k`,
            style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 },
          },
        },
        {
          opposite: true,
          title: { text: 'Net Disbursed (₹)', style: { color: '#059669', fontSize: '11px', fontWeight: 700 } },
          labels: {
            formatter: (val) => `₹${((Number(val) || 0) / 1000).toFixed(0)}k`,
            style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 },
          },
        },
      ],
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3,
      },
      legend: {
        show: false,
      },
      tooltip: {
        theme: 'dark',
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`,
        },
      },
    };
  }, [timeRange, data]);

  const mixedComboSeries = useMemo(() => {
    return [
      { name: 'Gross Billed (Column)', type: 'column', data: data?.charts?.grossSeries || [] },
      { name: 'Net Bank Disbursed (Line)', type: 'line', data: data?.charts?.netSeries || [] },
      { name: 'Balance Receivables (Dashed)', type: 'line', data: data?.charts?.balanceSeries || [] },
    ];
  }, [data]);

  // 2. Radial Target Completion Gauge Chart
  const targetGaugeOptions = useMemo(() => ({
    chart: {
      type: 'radialBar',
      height: 270,
      sparkline: { enabled: true },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      dropShadow: {
        enabled: true,
        top: 3,
        left: 0,
        blur: 8,
        opacity: 0.15,
        color: '#059669',
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -100,
        endAngle: 100,
        hollow: {
          size: '65%',
        },
        track: {
          background: '#f1f5f9',
          strokeWidth: '97%',
          margin: 6,
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            blur: 4,
            opacity: 0.08,
          },
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '12px',
            color: '#64748b',
            offsetY: 22,
            fontWeight: 700,
          },
          value: {
            offsetY: -16,
            fontSize: '26px',
            fontWeight: 800,
            color: '#0f172a',
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#059669', '#34d399'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    colors: ['#636B2F'],
    labels: ['Monthly Target Progress'],
  }), []);

  const targetGaugeSeries = [
    data?.kpis?.targetProgress !== undefined
      ? Number(data.kpis.targetProgress)
      : (kpis.totalGrossSales > 0 ? Math.min(100, Math.round((kpis.totalGrossSales / 2500000) * 100 * 10) / 10) : 63.5)
  ];

  // 3. Horizontal Deliverables Bar Chart
  const horizontalBarOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 250,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        borderRadius: 5,
        distributed: true,
      },
    },
    colors: ['#636B2F', '#059669', '#d97706', '#334155'],
    dataLabels: {
      enabled: true,
      formatter: (val) => `₹${((Number(val) || 0) / 1000).toFixed(0)}k`,
      style: { fontSize: '11px', fontWeight: 800, colors: ['#ffffff'] },
      offsetX: 0,
    },
    xaxis: {
      categories: data?.charts?.revenueMix?.labels || ['Products', 'Services', 'Packages', 'General'],
      labels: {
        formatter: (val) => `₹${((Number(val) || 0) / 1000).toFixed(0)}k`,
        style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 },
      },
    },
    yaxis: {
      labels: { style: { colors: '#0f172a', fontSize: '11px', fontWeight: 700 } },
    },
    grid: { show: false },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}` },
    },
  }), []);

  const horizontalBarSeries = useMemo(() => {
    return [
      { name: 'Revenue Generated', data: data?.charts?.revenueMix?.amounts || [0, 0, 0, 0] },
    ];
  }, [data]);

  // 4. Stacked Invoicing Velocity Column Chart
  const stackedVelocityOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 250,
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '45%',
      },
    },
    colors: ['#059669', '#d97706'],
    xaxis: {
      categories: data?.charts?.velocityBar?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    legend: { position: 'top', fontSize: '11px', fontWeight: 700 },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val} Invoices` },
    },
  }), []);

  const stackedVelocitySeries = useMemo(() => {
    return data?.charts?.velocityBar?.series || [
      { name: 'Full Paid Invoices', data: [] },
      { name: 'Advance / Partial Invoices', data: [] },
    ];
  }, [data]);

  // Normalized Invoices
  const recentInvoices = useMemo(() => {
    return (data?.recentInvoices || []).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminCut: Number(t.adminCut) || 0,
      netPayout: Number(t.netPayout) || 0,
      advance: Number(t.advance) || 0,
      balanceDue: Number(t.balanceDue) || 0,
    }));
  }, [data]);

  const activityFeed = data?.activityFeed || [];

  return (
    <div className="ent-dash-wrapper">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #09170e 0%, #15291b 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.4)',
            fontSize: '0.86rem',
            fontWeight: 700,
            borderLeft: '4px solid #848f3e',
            border: '1px solid rgba(74, 222, 128, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <Sparkles size={16} color="#a3e635" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Merchant Executive Hero Identity Banner (Deep Olive Emerald Luxury) */}
      <div className="ent-dash-hero">
        <div className="ent-hero-content">
          {/* Merchant Identity */}
          <div className="ent-merchant-profile">
            <div className="ent-3d-pod ent-3d-pod-hero ent-pod-olive">
              {entityDetails?.entity_type === 'freelancer' ? <Briefcase size={32} /> : <Building2 size={32} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <span className="ent-glass-badge ent-badge-olive">
                  <ShieldCheck size={13} /> VERIFIED MERCHANT PARTNER
                </span>
                <span className="ent-glass-badge ent-badge-muted">
                  <Briefcase size={12} /> {entityDetails?.category || 'IT & Software Development'}
                </span>
                <span className="ent-glass-badge ent-badge-emerald">
                  <span className="ent-pulse-dot" /> Settlement Active
                </span>
              </div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0 0.25rem 0', color: '#ffffff', letterSpacing: '-0.025em' }}>
                {entityDetails?.business_name || entityDetails?.name || storedUser?.business_name || storedUser?.name || 'Merchant Entity'}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span>{storedUser?.email}</span>
                <span style={{ opacity: 0.35 }}>•</span>
                {entityDetails?.registration_no && (
                  <>
                    <span>GST/PAN: <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>{entityDetails.registration_no}</strong></span>
                    <span style={{ opacity: 0.35 }}>•</span>
                  </>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  Account ID:
                  <strong style={{ color: '#d9f99d', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    {storedUser?.user_code || `ENT-${storedUser?.id || ''}`}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(storedUser?.user_code || `ENT-${storedUser?.id || ''}`)}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      color: copiedCode ? '#34d399' : '#e2e8f0',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      marginLeft: '2px',
                    }}
                    title="Copy Account ID"
                  >
                    {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Auto Settlement Countdown */}
            <div className="ent-countdown-capsule">
              <Clock size={16} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }} />
              <div style={{ fontSize: '0.76rem' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Next Bank Settlement
                </div>
                <strong style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.92rem', letterSpacing: '0.5px' }}>
                  {String(settlementCountdown.hours).padStart(2, '0')}h {String(settlementCountdown.minutes).padStart(2, '0')}m {String(settlementCountdown.seconds).padStart(2, '0')}s
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/entity/orders/create')}
              className="ent-hero-btn-primary"
            >
              <Zap size={16} />
              + Create Sale
            </button>

            <button
              type="button"
              onClick={fetchStats}
              className="ent-hero-btn-secondary"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Sync DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four High-Yield Financial Vault KPI Cards (Strict 2x2 Grid with Smooth 3D Pods) */}
      <div className="ent-kpi-grid">
        {/* Card 1: Gross Sales GMV */}
        <div className="ent-kpi-card ent-kpi-card-olive">
          <div>
            <div className="ent-kpi-top-row">
              <div>
                <span className="ent-kpi-category-tag" style={{ background: '#f4f6ec', color: '#636B2F' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#636B2F' }} /> TURNOVER & SALES
                </span>
                <div className="ent-kpi-title">Gross Billed Turnover (GMV)</div>
              </div>
              <div className="ent-3d-pod ent-3d-pod-md ent-pod-olive" title="Gross Billed Turnover">
                <Receipt size={24} />
              </div>
            </div>

            <div className="ent-kpi-value-row">
              <div className="ent-kpi-value">
                ₹{kpis.totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <TrendingUp size={13} /> +22.4% MoM
              </span>
            </div>
          </div>

          <div className="ent-kpi-vault-footer">
            <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
              <FileText size={14} color="#636B2F" />
              <span><strong>{kpis.totalInvoicesCount}</strong> Invoices Processed</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/entity/orders')}
              className="ent-kpi-action-link"
              style={{ color: '#636B2F' }}
            >
              Invoices History <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Net Disbursed Bank Settlements */}
        <div className="ent-kpi-card ent-kpi-card-emerald">
          <div>
            <div className="ent-kpi-top-row">
              <div>
                <span className="ent-kpi-category-tag" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> NET DISBURSEMENTS
                </span>
                <div className="ent-kpi-title">Net Bank Settlements Disbursed</div>
              </div>
              <div className="ent-3d-pod ent-3d-pod-md ent-pod-emerald" title="Net Bank Settlements">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="ent-kpi-value-row">
              <div className="ent-kpi-value">
                ₹{kpis.totalNetEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span
                style={{
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <CheckCircle2 size={13} /> 100% Disbursed
              </span>
            </div>
          </div>

          <div className="ent-kpi-vault-footer">
            <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
              <Wallet size={14} color="#059669" />
              <span>Direct IMPS Bank Deposits</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/entity/payments/bank-settlements')}
              className="ent-kpi-action-link"
              style={{ color: '#059669' }}
            >
              Settlements Vault <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Pending Customer Balance Receivables */}
        <div className="ent-kpi-card ent-kpi-card-amber">
          <div>
            <div className="ent-kpi-top-row">
              <div>
                <span className="ent-kpi-category-tag" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} /> RECEIVABLES AGING
                </span>
                <div className="ent-kpi-title">Pending Balance Due</div>
              </div>
              <div className="ent-3d-pod ent-3d-pod-md ent-pod-amber" title="Pending Receivables">
                <CreditCard size={24} />
              </div>
            </div>

            <div className="ent-kpi-value-row">
              <div className="ent-kpi-value" style={{ color: '#b45309' }}>
                ₹{kpis.totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span
                style={{
                  background: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <AlertCircle size={13} /> Action Required
              </span>
            </div>
          </div>

          <div className="ent-kpi-vault-footer">
            <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
              <Clock size={14} color="#d97706" />
              <span>Uncollected Receivables Due</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/entity/payments/receive-balance')}
              className="ent-kpi-action-link"
              style={{ color: '#d97706' }}
            >
              Collect Receivables <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 4: Platform Fee Retained & Catalog Size */}
        <div className="ent-kpi-card ent-kpi-card-slate">
          <div>
            <div className="ent-kpi-top-row">
              <div>
                <span className="ent-kpi-category-tag" style={{ background: '#f1f5f9', color: '#475569' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569' }} /> PLATFORM & CATALOG
                </span>
                <div className="ent-kpi-title">Platform Fee & Catalog Offerings</div>
              </div>
              <div className="ent-3d-pod ent-3d-pod-md ent-pod-slate" title="Platform Fee & Catalog">
                <Layers size={24} />
              </div>
            </div>

            <div className="ent-kpi-value-row">
              <div className="ent-kpi-value">
                ₹{kpis.totalPlatformFeePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span
                style={{
                  background: '#f4f6ec',
                  color: '#636B2F',
                  border: '1px solid #d4dcbe',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <CheckCircle2 size={13} /> Active Catalog
              </span>
            </div>
          </div>

          <div className="ent-kpi-vault-footer">
            <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
              <Package size={14} color="#475569" />
              <span><strong>{kpis.totalCatalogOfferings}</strong> Live Deliverable Offerings</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/entity/orders')}
              className="ent-kpi-action-link"
              style={{ color: '#475569' }}
            >
              Manage Services <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Primary ApexChart Analytics Suite (Dual-Axis Mixed + Monthly Gauge) in 3D Luxury Design */}
      <div className="ent-chart-grid">
        {/* Chart 1: Dual-Axis Mixed Combo (Column + Line + Dashed) */}
        <div className="ent-3d-chart-card ent-3d-chart-card-olive">
          <div>
            <div className="ent-chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="ent-3d-pod ent-3d-pod-md ent-pod-olive">
                  <Activity size={24} />
                </div>
                <div>
                  <span className="ent-kpi-category-tag" style={{ background: '#f4f6ec', color: '#636B2F' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#636B2F' }} /> REAL-TIME VELOCITY
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Dual-Axis Sales & Settlement Velocity
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Gross Invoiced Turnover (Bars) vs Net Disbursed Payouts (Line)
                  </p>
                </div>
              </div>

              {/* 3D Tactile Time Toggle */}
              <div className="ent-3d-time-switcher">
                {[
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '30D' },
                  { id: '6m', label: '6M' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeRange(t.id)}
                    className={`ent-3d-time-btn ${timeRange === t.id ? 'active' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom 3D Interactive Clickable Legend Bar */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.65rem', marginBottom: '0.65rem', padding: '0 0.15rem' }}>
              <button
                type="button"
                onClick={() => toggleSeries('Gross Billed (Column)', 'gross')}
                style={{
                  background: hiddenSeries.gross ? '#f8fafc' : '#f4f6ec',
                  color: hiddenSeries.gross ? '#94a3b8' : '#636B2F',
                  border: hiddenSeries.gross ? '1.5px solid #cbd5e1' : '1.5px solid #d4dcbe',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: hiddenSeries.gross ? 0.45 : 1,
                  textDecoration: hiddenSeries.gross ? 'line-through' : 'none',
                  boxShadow: hiddenSeries.gross ? 'none' : '0 2px 6px rgba(99, 107, 47, 0.15)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(99, 107, 47, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = hiddenSeries.gross ? 'none' : '0 2px 6px rgba(99, 107, 47, 0.15)';
                }}
                title="Click to show / hide Gross Billed"
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: hiddenSeries.gross ? '#94a3b8' : '#636B2F',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
                <span>Gross Billed (Column)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('Net Bank Disbursed (Line)', 'net')}
                style={{
                  background: hiddenSeries.net ? '#f8fafc' : '#ecfdf5',
                  color: hiddenSeries.net ? '#94a3b8' : '#059669',
                  border: hiddenSeries.net ? '1.5px solid #cbd5e1' : '1.5px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: hiddenSeries.net ? 0.45 : 1,
                  textDecoration: hiddenSeries.net ? 'line-through' : 'none',
                  boxShadow: hiddenSeries.net ? 'none' : '0 2px 6px rgba(5, 150, 105, 0.15)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(5, 150, 105, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = hiddenSeries.net ? 'none' : '0 2px 6px rgba(5, 150, 105, 0.15)';
                }}
                title="Click to show / hide Net Bank Disbursed"
              >
                <span
                  style={{
                    width: 12,
                    height: 4,
                    borderRadius: 2,
                    background: hiddenSeries.net ? '#94a3b8' : '#059669',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
                <span>Net Bank Disbursed (Line)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSeries('Balance Receivables (Dashed)', 'balance')}
                style={{
                  background: hiddenSeries.balance ? '#f8fafc' : '#fffbeb',
                  color: hiddenSeries.balance ? '#94a3b8' : '#d97706',
                  border: hiddenSeries.balance ? '1.5px solid #cbd5e1' : '1.5px solid #fde68a',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: hiddenSeries.balance ? 0.45 : 1,
                  textDecoration: hiddenSeries.balance ? 'line-through' : 'none',
                  boxShadow: hiddenSeries.balance ? 'none' : '0 2px 6px rgba(217, 119, 6, 0.15)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(217, 119, 6, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = hiddenSeries.balance ? 'none' : '0 2px 6px rgba(217, 119, 6, 0.15)';
                }}
                title="Click to show / hide Balance Receivables"
              >
                <span
                  style={{
                    width: 12,
                    height: 2,
                    borderTop: hiddenSeries.balance ? '2.5px dashed #94a3b8' : '2.5px dashed #d97706',
                  }}
                />
                <span>Balance Receivables (Dashed)</span>
              </button>
            </div>
          </div>

          <div style={{ minHeight: '330px', marginTop: '0.25rem' }}>
            <Chart
              options={mixedComboOptions}
              series={mixedComboSeries}
              type="line"
              height={330}
            />
          </div>
        </div>

        {/* Chart 2: Radial Gauge / Milestone Target Accomplishment */}
        <div className="ent-3d-chart-card ent-3d-chart-card-emerald">
          <div>
            <div className="ent-chart-header" style={{ marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="ent-3d-pod ent-3d-pod-md ent-pod-emerald">
                  <Target size={24} />
                </div>
                <div>
                  <span className="ent-kpi-category-tag" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> ENTERPRISE GOAL
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Monthly Sales Quota
                  </h3>
                </div>
              </div>
              <span className="ent-3d-target-pill">
                <Target size={13} /> Target: ₹25 Lakhs
              </span>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', color: '#64748b' }}>
              Real-time accomplishment against monthly enterprise target
            </p>
          </div>

          <div style={{ minHeight: '235px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chart
              options={targetGaugeOptions}
              series={targetGaugeSeries}
              type="radialBar"
              height={260}
            />
          </div>

          {/* 3D Twin Vault Summary Bar */}
          <div>
            <div className="ent-gauge-twin-vault">
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  REALIZED TURNOVER
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  ₹{kpis.totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  <CheckCircle2 size={11} /> Verified in DB
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  REMAINING DEFICIT
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  ₹{Math.max(0, 2500000 - kpis.totalGrossSales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px', justifyContent: 'flex-end' }}>
                  <Clock size={11} /> Month-End Target
                </span>
              </div>
            </div>

            {/* Micro 3D Progress Track */}
            <div className="ent-gauge-progress-track" title={`${((kpis.totalGrossSales / 2500000) * 100).toFixed(1)}% Completed`}>
              <div
                className="ent-gauge-progress-fill"
                style={{ width: `${Math.min(100, Math.max(5, (kpis.totalGrossSales / 2500000) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Horizontal Deliverables Bar & Stacked Velocity Column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.35rem' }}>
        {/* Chart 3: Horizontal Revenue Distribution Bar */}
        <div className="ent-3d-chart-card ent-3d-chart-card-olive">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="ent-3d-pod ent-3d-pod-sm ent-pod-olive">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Deliverable Revenue Breakdown
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Top sales volume generators across services & packages
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#f4f6ec', color: '#636B2F', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid #d4dcbe' }}>
                By Product
              </span>
            </div>
          </div>

          <div style={{ minHeight: '230px', marginTop: '0.75rem' }}>
            <Chart
              options={horizontalBarOptions}
              series={horizontalBarSeries}
              type="bar"
              height={230}
            />
          </div>
        </div>

        {/* Chart 4: Stacked Invoicing Velocity Column */}
        <div className="ent-3d-chart-card ent-3d-chart-card-emerald">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="ent-3d-pod ent-3d-pod-sm ent-pod-emerald">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Daily Invoicing Velocity (Stacked)
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Weekly distribution of fully settled orders vs advance booking installments
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid #a7f3d0' }}>
                Paid vs Partial
              </span>
            </div>
          </div>

          <div style={{ minHeight: '230px', marginTop: '0.75rem' }}>
            <Chart
              options={stackedVelocityOptions}
              series={stackedVelocitySeries}
              type="bar"
              height={230}
            />
          </div>
        </div>
      </div>

      {/* 4. Merchant Operations Hub & Fast Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.15rem' }}>
        <button
          type="button"
          onClick={() => navigate('/entity/orders/create')}
          className="ent-action-card"
        >
          <div className="ent-3d-pod ent-3d-pod-sm ent-pod-olive">
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Create Sale / Invoice</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Generate GST tax bill</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/entity/payments/receive-balance')}
          className="ent-action-card"
        >
          <div className="ent-3d-pod ent-3d-pod-sm ent-pod-amber">
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Collect Balance Due</div>
            <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
              ₹{kpis.totalBalanceDue.toLocaleString('en-IN')} pending
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/entity/payments/receipts-ledger')}
          className="ent-action-card"
        >
          <div className="ent-3d-pod ent-3d-pod-sm ent-pod-emerald">
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Payment Receipts</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>Audit ledger & slips</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/entity/payments/bank-settlements')}
          className="ent-action-card"
        >
          <div className="ent-3d-pod ent-3d-pod-sm ent-pod-slate">
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Bank Settlements</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>IMPS payout reports</div>
          </div>
        </button>
      </div>

      {/* 5. Recent Customer Invoices Table & Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Invoices Table */}
        <div className="ent-table-card" style={{ flex: '2 1 540px' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fcfdfa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                Recent Customer Invoices & Cash Receipts
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Live database records of client orders, platform fee deductions, and net payouts
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/entity/orders')}
              style={{
                background: '#ffffff',
                border: '1px solid #d4dcbe',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                color: '#636B2F',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Invoices →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice / Client</th>
                  <th>Deliverable Item</th>
                  <th style={{ textAlign: 'right' }}>Gross GMV</th>
                  <th style={{ textAlign: 'right' }}>Net Disbursed</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      No recent customer invoices found.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((txn, idx) => (
                    <tr key={txn.id || idx}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{txn.customer}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {txn.id} • {txn.date}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {txn.item}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                        ₹{txn.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', color: '#059669', fontWeight: 800 }}>
                        ₹{txn.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span
                          style={{
                            background: txn.status === 'completed' ? '#ecfdf5' : '#fef3c7',
                            color: txn.status === 'completed' ? '#059669' : '#d97706',
                            border: txn.status === 'completed' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: txn.status === 'completed' ? '#059669' : '#d97706',
                            }}
                          />
                          {txn.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(txn)}
                          style={{
                            background: '#f4f6ec',
                            border: '1px solid #d4dcbe',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: '#636B2F',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <FileText size={12} /> Slip
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="ent-chart-card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="ent-3d-pod ent-3d-pod-xs ent-pod-olive">
                  <Activity size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                  Merchant Activity Feed
                </h3>
              </div>
              <span className="ent-glass-badge ent-badge-emerald" style={{ fontSize: '0.7rem' }}>
                <span className="ent-pulse-dot" /> Live
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activityFeed.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                  No recent activity recorded for this entity.
                </div>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="ent-activity-node">
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #848f3e 0%, #636B2F 100%)',
                        boxShadow: '0 0 8px rgba(99, 107, 47, 0.4)',
                        marginTop: '3px',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{act.title}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>{act.desc}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {act.time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
            <button
              type="button"
              onClick={() => navigate('/entity/payments/receipts-ledger')}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: '#f4f6ec',
                border: '1px solid #d4dcbe',
                borderRadius: '8px',
                color: '#636B2F',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              View Full Receipts Ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              border: '1px solid rgba(226, 232, 240, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #09170e 0%, #15291b 100%)',
                color: '#ffffff',
                padding: '1.4rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(74, 222, 128, 0.2)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#a3e635', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ✓ VERIFIED MERCHANT TAX INVOICE
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {selectedInvoice.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div
                style={{
                  background: '#f4f6ec',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid #d4dcbe',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#636B2F', fontWeight: 800, textTransform: 'uppercase' }}>CLIENT / CUSTOMER</span>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{selectedInvoice.customer}</div>
                </div>
                <span
                  style={{
                    background: selectedInvoice.status === 'completed' ? '#ecfdf5' : '#fef3c7',
                    color: selectedInvoice.status === 'completed' ? '#059669' : '#d97706',
                    border: selectedInvoice.status === 'completed' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  ✓ {selectedInvoice.status?.toUpperCase()}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '1.5rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Item / Deliverable</td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.item}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Invoice Date</td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.paymentMethod}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem 0', color: '#64748b' }}>Gross Invoice Amount (GMV)</td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>₹{selectedInvoice.gross.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#d97706' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 700 }}>Platform Fee Commission</td>
                    <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 700 }}>-₹{selectedInvoice.adminCut.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f4f6ec' }}>
                    <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#636B2F', fontSize: '0.9rem' }}>Net Bank Payout Receivable</td>
                    <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right', fontWeight: 800, color: '#636B2F', fontSize: '1.15rem' }}>₹{selectedInvoice.netPayout.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '0.6rem 1.15rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Printer size={15} /> Print Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    padding: '0.6rem 1.35rem',
                    background: '#636B2F',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntityDashboard;
