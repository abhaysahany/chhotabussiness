import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
import {
  ShieldCheck,
  Building2,
  Receipt,
  CreditCard,
  Users2,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Zap,
  RefreshCw,
  Clock,
  Printer,
  ChevronRight,
  Sparkles,
  BarChart4,
  Briefcase,
  Sliders,
  DollarSign,
  PackageCheck,
  Send,
  HelpCircle,
  Activity,
  CheckCircle2,
  Target,
  BarChart3,
  PieChart as PieIcon,
  Copy,
  Check,
  Calendar,
  Lock,
} from 'lucide-react';
import { getAdminDashboardStats } from '../../api/adminService';
import StatusBadge from '../common/StatusBadge';
import CategoryBadge from '../common/CategoryBadge';

function AdminDashboardOverview({ currentAdmin, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [timelinePeriod, setTimelinePeriod] = useState('7d');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [settlementCountdown, setSettlementCountdown] = useState({ hours: 9, minutes: 24, seconds: 15 });
  const [copiedInvoiceId, setCopiedInvoiceId] = useState(null);
  const [hiddenCashflowSeries, setHiddenCashflowSeries] = useState({
    gmv: false,
    retained: false,
    commissions: false,
  });

  const toggleCashflowSeries = (seriesName, key) => {
    try {
      ApexCharts.exec('admin-cashflow-chart', 'toggleSeries', seriesName);
    } catch (e) {
      console.error('Error toggling cashflow series:', e);
    }
    setHiddenCashflowSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [hiddenPolarSeries, setHiddenPolarSeries] = useState({});

  const togglePolarSeries = (seriesName) => {
    try {
      ApexCharts.exec('admin-polar-revenue-chart', 'toggleSeries', seriesName);
    } catch (e) {
      console.error('Error toggling polar series:', e);
    }
    setHiddenPolarSeries((prev) => ({ ...prev, [seriesName]: !prev[seriesName] }));
  };

  const [hiddenVelocitySeries, setHiddenVelocitySeries] = useState({
    newUsers: false,
    kycVerified: false,
  });

  const toggleVelocitySeries = (seriesName, key) => {
    try {
      ApexCharts.exec('admin-velocity-chart', 'toggleSeries', seriesName);
    } catch (e) {
      console.error('Error toggling velocity series:', e);
    }
    setHiddenVelocitySeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Weekly automated settlement countdown
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

  // Fetch real-time SaaS stats from backend MySQL API
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboardStats(timelinePeriod);
      if (res && res.status === 'success') {
        setData(res);
      }
    } catch (err) {
      console.error('Error loading admin enterprise stats:', err);
      setError('Failed to sync with backend MySQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timelinePeriod]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleCopyCode = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedInvoiceId(id);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Safe normalized KPIs
  const kpis = useMemo(() => {
    const raw = data?.kpis || {};
    return {
      totalGmv: Number(raw.totalGmv) || 0,
      totalPlatformRevenue: Number(raw.totalPlatformRevenue) || 0,
      totalCommissionsPaid: Number(raw.totalCommissionsPaid) || 0,
      totalTdsCollected: Number(raw.totalTdsCollected) || 0,
      totalUsers: Number(raw.totalUsers) || 0,
      activeUsers: Number(raw.activeUsers) || 0,
      newUsersThisMonth: Number(raw.newUsersThisMonth) || 0,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 0,
      pendingPayoutsCount: Number(raw.pendingPayoutsCount) || 0,
      pendingPayoutsAmount: Number(raw.pendingPayoutsAmount) || 0,
      pendingKycCount: Number(raw.pendingKycCount) || 0,
      openSupportTickets: Number(raw.openSupportTickets) || 0,
      rewardClaimsPending: Number(raw.rewardClaimsPending) || 0,
    };
  }, [data]);

  // 1. ApexCharts: Enterprise Financial Cashflow Curve (Spline Area)
  const cashflowChartOptions = useMemo(() => {
    const categories = data?.charts?.revenueCategories || (
      timelinePeriod === '6m'
        ? ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026']
        : timelinePeriod === '30d'
        ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    );

    return {
      chart: {
        id: 'admin-cashflow-chart',
        type: 'area',
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: 'transparent',
      },
      colors: ['#3569a7', '#0d9488', '#d97706'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.8 },
      xaxis: {
        categories,
        labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val) => `₹${((Number(val) || 0) / 1000).toFixed(0)}k`,
          style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 },
        },
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3,
        padding: { top: 10, right: 10, bottom: 0, left: 10 },
      },
      legend: {
        show: false,
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`,
        },
      },
    };
  }, [timelinePeriod, data]);

  const cashflowChartSeries = useMemo(() => {
    return [
      { name: 'Gross Platform GMV', data: data?.charts?.gmvSeries || [] },
      { name: 'Retained Admin Fee Pool', data: data?.charts?.netRevenueSeries || [] },
      { name: 'Disbursed Network Payouts', data: data?.charts?.commissionsSeries || [] },
    ];
  }, [data]);

  // 2. ApexCharts: Polar Area Revenue Allocation
  const polarRevenueOptions = useMemo(() => ({
    chart: {
      id: 'admin-polar-revenue-chart',
      type: 'polarArea',
      height: 270,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    stroke: { colors: ['#ffffff'], width: 2 },
    fill: { opacity: 0.88 },
    colors: ['#3569a7', '#0d9488', '#d97706', '#475569'],
    labels: data?.charts?.revenueDistribution?.labels || ['Products', 'Services', 'Packages', 'General'],
    legend: {
      show: false,
    },
    yaxis: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val}% share` },
    },
  }), [data]);

  const polarRevenueSeries = data?.charts?.revenueDistribution?.series || [0, 0, 0, 0];

  // 3. ApexCharts: Radial Gauge Target Achievement
  const radialTargetOptions = useMemo(() => ({
    chart: {
      id: 'admin-target-gauge',
      type: 'radialBar',
      height: 250,
      sparkline: { enabled: true },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      dropShadow: {
        enabled: true,
        top: 2,
        left: 0,
        blur: 6,
        opacity: 0.1,
        color: '#0d9488',
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -95,
        endAngle: 95,
        hollow: {
          size: '68%',
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
            opacity: 0.05,
          },
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '11px',
            color: '#64748b',
            offsetY: 10,
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
        gradientToColors: ['#0d9488'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    colors: ['#3569a7'],
    labels: ['Target Realized'],
  }), []);

  const targetPercent = useMemo(() => {
    if (data?.kpis?.targetProgress !== undefined && data?.kpis?.targetProgress !== null) {
      return Number(data.kpis.targetProgress);
    }
    if (kpis.totalGmv > 0) {
      return Math.min(100, Number(((kpis.totalGmv / 6500000) * 100).toFixed(1)));
    }
    return 12.7;
  }, [data, kpis.totalGmv]);

  const radialTargetSeries = [targetPercent];

  // 4. ApexCharts: Grouped Column Affiliate vs KYC Velocity
  const groupedVelocityOptions = useMemo(() => ({
    chart: {
      id: 'admin-velocity-chart',
      type: 'bar',
      height: 240,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    colors: ['#3569a7', '#0d9488'],
    xaxis: {
      categories: data?.charts?.velocityBar?.categories || ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val} accounts` },
    },
  }), [data]);

  const groupedVelocitySeries = useMemo(() => {
    return data?.charts?.velocityBar?.series || [
      { name: 'New Users', data: [] },
      { name: 'KYC Verified', data: [] },
    ];
  }, [data]);

  // Normalized Transactions
  const recentTransactions = useMemo(() => {
    return (data?.recentTransactions || []).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminFee: Number(t.adminFee) || 0,
      netEntity: Number(t.netEntity) || 0,
    }));
  }, [data]);

  // Merchant Partners Performance List
  const merchantPartners = data?.merchantPartners || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderLeft: '4px solid #3569a7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <Sparkles size={16} color="#60a5fa" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Master Enterprise Hero Header Banner */}
      <div className="adm-hero-banner">
        {/* Top Profile / Title Row */}
        <div className="adm-hero-top-row">
          {/* Prominent 3D Floating Building Pod */}
          <div className="adm-hero-pod-3d">
            <Building2 size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  background: 'rgba(53, 105, 167, 0.1)',
                  color: '#3569a7',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(53, 105, 167, 0.22)',
                  whiteSpace: 'nowrap',
                }}
              >
                ● MASTER GOVERNANCE PORTAL
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  background: 'rgba(13, 148, 136, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(13, 148, 136, 0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#0d9488',
                    boxShadow: '0 0 8px rgba(13, 148, 136, 0.65)',
                  }}
                ></span>
                Database Online (MySQL 8.0)
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                Telemetry v2.4
              </span>
            </div>

            <h1
              style={{
                margin: '0.35rem 0 0 0',
                fontSize: '1.68rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                lineHeight: 1.25,
              }}
            >
              Enterprise Platform Administration
            </h1>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.55 }}>
              Real-time platform governance, automated batch settlement telemetry, and multi-tier network revenue telemetry.
            </p>
          </div>
        </div>

        {/* Spacious Action Toolbar */}
        <div className="adm-hero-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Weekly Batch Countdown Capsule */}
            <div className="adm-batch-capsule">
              <Clock size={16} color="#d97706" />
              <div style={{ fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Weekly Batch Cycle: </span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontWeight: 800 }}>
                  {String(settlementCountdown.hours).padStart(2, '0')}h {String(settlementCountdown.minutes).padStart(2, '0')}m {String(settlementCountdown.seconds).padStart(2, '0')}s
                </strong>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#0d9488',
                background: 'rgba(13, 148, 136, 0.08)',
                padding: '0.55rem 0.85rem',
                borderRadius: '12px',
                border: '1px solid rgba(13, 148, 136, 0.18)',
              }}
            >
              <ShieldCheck size={14} color="#0d9488" />
              <span>Settlement Pipeline Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchStats}
              disabled={loading}
              className="adm-hero-btn-sync"
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Syncing...' : 'Sync MySQL'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders-management')}
              className="adm-hero-btn-primary"
            >
              <Zap size={16} />
              + New Sales Order
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four Corporate Financial Vault KPI Cards (Strict 2x2 Grid) */}
      <div className="adm-kpi-grid">
        {/* Card 1: Gross Platform GMV */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#3569a7',
                  background: 'rgba(53, 105, 167, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block',
                  marginBottom: '0.45rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● PLATFORM GMV
              </span>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                PLATFORM GROSS VOLUME (GMV)
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
              <Receipt size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.85rem 0 0.45rem 0' }}>
            <div className="adm-kpi-val">
              ₹{kpis.totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={14} color="#3569a7" />
              <span>Merchant &amp; Affiliate Sales</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0d9488' }}></span>
              Active System
            </span>
          </div>
        </div>

        {/* Card 2: Net Retained Platform Revenue Pool */}
        <div className="adm-kpi-card adm-kpi-card-emerald">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  background: 'rgba(13, 148, 136, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block',
                  marginBottom: '0.45rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● NET RETAINED POOL
              </span>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                RETAINED ADMIN FEE POOL
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.85rem 0 0.45rem 0' }}>
            <div className="adm-kpi-val" style={{ color: '#0d9488' }}>
              ₹{kpis.totalPlatformRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <DollarSign size={14} color="#0d9488" />
              <span>Net Corporate Earnings</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders-management')}
              style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              Ledger →
            </button>
          </div>
        </div>

        {/* Card 3: Disbursed Network Payouts & TDS */}
        <div className="adm-kpi-card adm-kpi-card-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block',
                  marginBottom: '0.45rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● COMMISSIONS &amp; TAX
              </span>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                DISBURSED COMMISSIONS &amp; TDS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
              <CreditCard size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.85rem 0 0.45rem 0' }}>
            <div className="adm-kpi-val" style={{ color: '#d97706' }}>
              ₹{kpis.totalCommissionsPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <CreditCard size={14} color="#d97706" />
              <span>TDS Pool: ₹{kpis.totalTdsCollected.toLocaleString('en-IN')} (5% Tax)</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800 }}>Settled</span>
          </div>
        </div>

        {/* Card 4: Active Network Members & Growth */}
        <div className="adm-kpi-card adm-kpi-card-indigo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#4f46e5',
                  background: 'rgba(79, 70, 229, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-block',
                  marginBottom: '0.45rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● AFFILIATE NETWORK
              </span>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                REGISTERED NETWORK BASE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-indigo" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
              <Users2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.85rem 0 0.45rem 0' }}>
            <div className="adm-kpi-val" style={{ color: '#0f172a' }}>
              {kpis.totalUsers.toLocaleString('en-IN')}{' '}
              <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 700 }}>({kpis.activeUsers} Active)</span>
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users2 size={14} color="#4f46e5" />
              <span>+{kpis.newUsersThisMonth} joins this month</span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('users-details')}
              style={{ background: 'none', border: 'none', color: '#3569a7', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              Directory →
            </button>
          </div>
        </div>
      </div>

      {/* 3. Operations Sentinel & Risk Triage Ribbon */}
      <div className="adm-sentinel-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
          {/* 3D Warning Pod */}
          <div
            className="adm-3d-pod adm-pod-amber"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
            }}
          >
            <AlertTriangle size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
              OPERATIONS QUEUE SENTINEL
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
              {kpis.pendingPayoutsCount} Payout Requests Pending (₹{kpis.pendingPayoutsAmount.toLocaleString('en-IN')}) • {kpis.pendingKycCount} KYC Submissions Awaiting Audit
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('users-payout-requests')}
            className="adm-sentinel-btn"
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
            }}
          >
            Review Payouts ({kpis.pendingPayoutsCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('users-kyc')}
            className="adm-sentinel-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.22)',
            }}
          >
            Review KYC ({kpis.pendingKycCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('support-tickets')}
            className="adm-sentinel-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.22)',
            }}
          >
            Support Tickets ({kpis.openSupportTickets})
          </button>
        </div>
      </div>

      {/* 4. Four Diverse ApexChart Analytics Suite */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.4rem' }}>
        {/* Chart 1: Cashflow Spline Area Chart */}
        <div className="adm-chart-card adm-chart-card-glow" style={{ flex: '2 1 560px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                  <Activity size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                      ● REAL-TIME TELEMETRY
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em' }}>
                    Enterprise Cashflow &amp; Fee Settlement Curve
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Gross merchant volume, platform cut, and commission disbursements
                  </p>
                </div>
              </div>

              {/* Timeline Filter */}
              <div style={{ display: 'flex', background: '#f8fafc', padding: '3px', borderRadius: '10px', gap: '3px', border: '1.5px solid #e2e8f0' }}>
                {[
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '30D' },
                  { id: '6m', label: '6M' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimelinePeriod(t.id)}
                    style={{
                      border: 'none',
                      background: timelinePeriod === t.id ? '#3569a7' : 'transparent',
                      color: timelinePeriod === t.id ? '#ffffff' : '#64748b',
                      padding: '0.3rem 0.85rem',
                      borderRadius: '7px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: timelinePeriod === t.id ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Single-Line Legend Pills Bar */}
            <div className="adm-chart-legend-row" style={{ marginBottom: '0.6rem' }}>
              <button
                type="button"
                onClick={() => toggleCashflowSeries('Gross Platform GMV', 'gmv')}
                className={`adm-legend-pill ${hiddenCashflowSeries.gmv ? 'is-hidden' : ''}`}
                title="Click to toggle Gross Platform GMV series"
              >
                <span className="adm-legend-dot" style={{ background: '#3569a7' }} />
                <span>Gross Platform GMV</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCashflowSeries('Retained Admin Fee Pool', 'retained')}
                className={`adm-legend-pill ${hiddenCashflowSeries.retained ? 'is-hidden' : ''}`}
                title="Click to toggle Retained Admin Fee Pool series"
              >
                <span className="adm-legend-dot" style={{ background: '#0d9488' }} />
                <span>Retained Admin Fee Pool</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCashflowSeries('Disbursed Network Payouts', 'commissions')}
                className={`adm-legend-pill ${hiddenCashflowSeries.commissions ? 'is-hidden' : ''}`}
                title="Click to toggle Disbursed Network Payouts series"
              >
                <span className="adm-legend-dot" style={{ background: '#d97706' }} />
                <span>Disbursed Network Payouts</span>
              </button>
            </div>

            <div style={{ minHeight: '320px' }}>
              <Chart
                options={cashflowChartOptions}
                series={cashflowChartSeries}
                type="area"
                height={320}
              />
            </div>
          </div>

          {/* Twin-Vault Footer */}
          <div className="adm-twin-vault" style={{ marginTop: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ background: '#f8fafc', padding: '0.65rem 0.95rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                PLATFORM TURNOVER (GMV)
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                ₹{kpis.totalGmv.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#3569a7', fontWeight: 700, marginTop: '0.1rem' }}>
                ● Merchant &amp; Network Volume
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem 0.95rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                NET RETAINED ADMIN POOL
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0d9488', marginTop: '0.15rem' }}>
                ₹{kpis.totalPlatformRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#0d9488', fontWeight: 700, marginTop: '0.1rem' }}>
                ● Platform Fee Cut Realized
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Polar Area Revenue Allocation */}
        <div className="adm-chart-card adm-chart-card-glow" style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div className="adm-3d-pod adm-pod-emerald" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                  <PieIcon size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                      ● MULTI-VERTICAL ALLOCATION
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em' }}>
                    Revenue Share by Offering
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Revenue contribution across services, products &amp; packages
                  </p>
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', padding: '3px 9px', borderRadius: '8px', fontWeight: 800, border: '1px solid rgba(13, 148, 136, 0.2)', whiteSpace: 'nowrap' }}>
                Polar Analytics
              </span>
            </div>

            <div style={{ minHeight: '270px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Chart
                options={polarRevenueOptions}
                series={polarRevenueSeries}
                type="polarArea"
                height={270}
              />
            </div>

            {/* Interactive Polar Legend Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap', margin: '0.4rem 0 0.2rem 0' }}>
              {[
                { name: 'Products', color: '#3569a7' },
                { name: 'Services', color: '#0d9488' },
                { name: 'Packages', color: '#d97706' },
                { name: 'General', color: '#475569' },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => togglePolarSeries(item.name)}
                  className={`adm-legend-pill ${hiddenPolarSeries[item.name] ? 'is-hidden' : ''}`}
                  title={`Click to toggle ${item.name} vertical`}
                  style={{ fontSize: '0.7rem', padding: '0.22rem 0.55rem' }}
                >
                  <span className="adm-legend-dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Twin-Vault Footer */}
          <div className="adm-twin-vault" style={{ marginTop: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '11px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                DOMINANT VERTICAL
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data?.charts?.revenueDistribution?.labels?.[0] ? `${data.charts.revenueDistribution.labels[0]} (${data.charts.revenueDistribution.series[0] || 0}%)` : 'Services (100%)'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '11px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                  CATALOG DIVERSITY
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                  {kpis.totalCatalogOfferings || 4} Offerings
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('orders-management')}
                style={{
                  background: 'rgba(53, 105, 167, 0.08)',
                  border: '1px solid rgba(53, 105, 167, 0.2)',
                  color: '#3569a7',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                }}
                title="View complete order breakdown"
              >
                <span>Breakdown</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Radial Gauge & Grouped Velocity Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.4rem' }}>
        {/* Chart 3: Radial Target Gauge */}
        <div className="adm-chart-card adm-chart-card-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0 }}>
                  <Target size={22} strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '2px 7px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)', whiteSpace: 'nowrap' }}>
                      ● REVENUE TRAJECTORY
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Monthly Platform GMV Target
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Overall platform revenue trajectory toward monthly target
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.45rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748b' }}>Target:</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#3569a7' }}>₹65 Lakhs</span>
              </div>
            </div>

            <div style={{ minHeight: '235px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.25rem 0' }}>
              <Chart
                options={radialTargetOptions}
                series={radialTargetSeries}
                type="radialBar"
                height={250}
              />
            </div>

            {/* Mini Progress Pace Track */}
            <div style={{ padding: '0 0.5rem 0.2rem 0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Pace: {targetPercent}% Realized</span>
                <span style={{ color: '#0d9488', fontWeight: 800 }}>{(100 - targetPercent).toFixed(1)}% to Milestone</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, targetPercent)}%`, height: '100%', background: 'linear-gradient(90deg, #3569a7 0%, #0d9488 100%)', borderRadius: '9999px', transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </div>
            </div>
          </div>

          {/* Twin-Vault Footer */}
          <div className="adm-twin-vault" style={{ marginTop: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ background: '#f8fafc', padding: '0.65rem 0.95rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                ACHIEVED VOLUME
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                ₹{kpis.totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#3569a7', fontWeight: 700, marginTop: '0.1rem' }}>
                ● {targetPercent}% of ₹65L Target
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem 0.95rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                REMAINING DEFICIT
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0d9488', marginTop: '0.15rem' }}>
                ₹{Math.max(0, 6500000 - kpis.totalGmv).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#0d9488', fontWeight: 700, marginTop: '0.1rem' }}>
                ● Run-rate on schedule
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Grouped Column Velocity */}
        <div className="adm-chart-card adm-chart-card-glow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
                <div className="adm-3d-pod adm-pod-emerald" style={{ width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0 }}>
                  <BarChart3 size={22} strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '2px 7px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)', whiteSpace: 'nowrap' }}>
                      ● NETWORK EXPANSION
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Affiliate Growth &amp; KYC Velocity
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Daily network signups vs compliance verified accounts
                  </p>
                </div>
              </div>

              <span style={{ fontSize: '0.72rem', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', padding: '3px 9px', borderRadius: '8px', fontWeight: 800, border: '1px solid rgba(13, 148, 136, 0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Weekly Velocity
              </span>
            </div>

            {/* Interactive Single-Line Legend Pills Bar */}
            <div className="adm-chart-legend-row" style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => toggleVelocitySeries('New Users', 'newUsers')}
                className={`adm-legend-pill ${hiddenVelocitySeries.newUsers ? 'is-hidden' : ''}`}
                title="Click to toggle New Users series"
              >
                <span className="adm-legend-dot" style={{ background: '#3569a7' }} />
                <span>New Users</span>
              </button>

              <button
                type="button"
                onClick={() => toggleVelocitySeries('KYC Verified', 'kycVerified')}
                className={`adm-legend-pill ${hiddenVelocitySeries.kycVerified ? 'is-hidden' : ''}`}
                title="Click to toggle KYC Verified series"
              >
                <span className="adm-legend-dot" style={{ background: '#0d9488' }} />
                <span>KYC Verified</span>
              </button>
            </div>

            <div style={{ minHeight: '220px' }}>
              <Chart
                options={groupedVelocityOptions}
                series={groupedVelocitySeries}
                type="bar"
                height={240}
              />
            </div>
          </div>

          {/* Twin-Vault Footer */}
          <div className="adm-twin-vault" style={{ marginTop: '0.75rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '11px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                NETWORK AUDIT RATIO
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem', whiteSpace: 'nowrap' }}>
                {((kpis.activeUsers || 20) / Math.max(1, kpis.totalUsers || 20) * 100).toFixed(0)}% Compliance
              </div>
              <div style={{ fontSize: '0.65rem', color: '#0d9488', fontWeight: 700, marginTop: '0.1rem' }}>
                ● {kpis.totalUsers || 20} Active Affiliates
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '11px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                  PENDING KYC
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: kpis.pendingKycCount > 0 ? '#d97706' : '#0d9488', marginTop: '0.1rem' }}>
                  {kpis.pendingKycCount} Awaiting
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('registered-users')}
                style={{
                  background: 'rgba(13, 148, 136, 0.08)',
                  border: '1px solid rgba(13, 148, 136, 0.2)',
                  color: '#0d9488',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease',
                }}
                title="Audit compliance records"
              >
                <span>Audit</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Enterprise Merchant Ledger & Top Partners (Col-12 Stack: Uppar-Niche) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%' }}>
        {/* Recent Invoices & Sales Ledger (Full Width Col-12) */}
        <div className="adm-chart-card adm-chart-card-glow" style={{ width: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem 1.6rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div className="adm-3d-pod adm-pod-steel" style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0 }}>
                <Receipt size={22} strokeWidth={2.4} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)', whiteSpace: 'nowrap' }}>
                    ● AUDITED FINANCIAL LEDGER
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em' }}>
                  Recent Merchant Invoices &amp; Automatic Settlements
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  Live database entries of corporate sales and retained admin commission cuts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders-management')}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                padding: '0.45rem 0.95rem',
                borderRadius: '10px',
                color: '#3569a7',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1.5px)';
                e.currentTarget.style.borderColor = '#3569a7';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(53, 105, 167, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.03)';
              }}
            >
              <span>View All Invoices</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#cbd5e1', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Invoice / Client</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Merchant Entity</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'right' }}>Gross GMV</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'right' }}>Admin Cut</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      No recent transactions recorded in database.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((txn, idx) => {
                    const custName = typeof txn.customer === 'object' && txn.customer !== null ? (txn.customer.name || 'Customer') : String(txn.customer || 'Customer');
                    const invId = typeof txn.id === 'object' ? 'INV' : String(txn.id);
                    const isCopied = copiedInvoiceId === invId;

                    return (
                      <tr
                        key={txn.id || idx}
                        className="adm-table-row"
                      >
                        <td style={{ padding: '0.85rem 1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="adm-avatar-3d">
                              {getInitials(custName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
                                {custName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                                <span className="adm-code-chip">{invId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(invId, invId)}
                                  style={{ background: 'none', border: 'none', color: isCopied ? '#0d9488' : '#94a3b8', cursor: 'pointer', padding: 0 }}
                                  title="Copy Invoice ID"
                                >
                                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                  • {typeof txn.date === 'object' && txn.date !== null ? (txn.date.created_at || 'Recently') : String(txn.date || 'Recently')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Building2 size={14} color="#64748b" />
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.84rem' }}>
                              {typeof txn.entity === 'object' && txn.entity !== null ? (txn.entity.name || 'Merchant Entity') : String(txn.entity || 'Merchant Entity')}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right', color: '#0f172a', fontWeight: 800, fontSize: '0.88rem' }}>
                          ₹{txn.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', textAlign: 'right', color: '#0d9488', fontWeight: 800, fontSize: '0.88rem' }}>
                          ₹{txn.adminFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', textAlign: 'center' }}>
                          <StatusBadge status={txn.status} fallback="completed" />
                        </td>
                        <td style={{ padding: '0.85rem 1.15rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(txn)}
                            style={{
                              background: '#f8fafc',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              color: '#3569a7',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#3569a7';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#3569a7';
                              e.currentTarget.style.boxShadow = '0 3px 8px rgba(53, 105, 167, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f8fafc';
                              e.currentTarget.style.color = '#3569a7';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                            }}
                          >
                            <Printer size={13} />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Card Ledger Footer */}
          <div style={{ padding: '0.75rem 1.4rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d9488', boxShadow: '0 0 8px rgba(13, 148, 136, 0.6)' }} />
              <span style={{ fontWeight: 700, color: '#334155' }}>Live Automated Fee Settlement Active</span>
            </div>
            <span style={{ fontWeight: 800, color: '#3569a7' }}>{recentTransactions.length} Invoices Recorded</span>
          </div>
        </div>

        {/* Corporate Merchant & Entity Performance Matrix (Full Width Col-12) */}
        <div className="adm-chart-card adm-chart-card-glow" style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="adm-3d-pod adm-pod-emerald" style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0 }}>
                  <Building2 size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '2px 7px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)', whiteSpace: 'nowrap' }}>
                      ● VOLUME LEADERS
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em' }}>
                    Top Merchant Entities
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                    Revenue share &amp; corporate fee throughput
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('businesses')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3569a7',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span>All Entities</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {merchantPartners.length === 0 ? (
                <div style={{ padding: '1.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  No active merchant partners found.
                </div>
              ) : (
                merchantPartners.map((m, idx) => (
                  <div
                    key={idx}
                    className="adm-entity-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                          {typeof m.name === 'object' && m.name !== null ? (m.name.name || 'Partner') : String(m.name || 'Partner')}
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <CategoryBadge category={m.category} count={m.count} fallback="Entity" />
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#3569a7',
                          background: 'rgba(53, 105, 167, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(53, 105, 167, 0.25)',
                        }}
                      >
                        {typeof m.share === 'object' ? '0%' : String(m.share || '0%')} Share
                      </span>
                    </div>

                    {/* Progress Bar for GMV Share */}
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', margin: '0.65rem 0 0.55rem 0' }}>
                      <div style={{ width: typeof m.share === 'string' ? m.share : '100%', height: '100%', background: 'linear-gradient(90deg, #3569a7 0%, #0d9488 100%)', borderRadius: '9999px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.55rem', marginTop: '0.2rem' }}>
                      <span style={{ color: '#64748b' }}>Turnover: <strong style={{ color: '#0f172a' }}>{typeof m.gmv === 'object' ? '₹0.00' : String(m.gmv || '₹0.00')}</strong></span>
                      <span style={{ color: '#0d9488', fontWeight: 800 }}>Admin Cut: {typeof m.adminCut === 'object' ? '₹0.00' : String(m.adminCut || '₹0.00')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.95rem' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('businesses')}
              className="adm-partner-btn"
            >
              <span>Manage Business &amp; Freelancer Partners</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Printable Invoice / Settlement Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
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
              borderRadius: '18px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #3569a7 0%, #1e3a5f 100%)',
                color: '#ffffff',
                padding: '1.25rem 1.6rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: '#ccfbf1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ✓ ADNET VERIFIED TAX INVOICE
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 900 }}>
                  {typeof selectedInvoice.id === 'object' ? 'INVOICE' : String(selectedInvoice.id)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '0.95rem 1.15rem',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#3569a7', fontWeight: 800, textTransform: 'uppercase' }}>
                    CORPORATE CLIENT
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.08rem', color: '#0f172a', marginTop: '2px' }}>
                    {typeof selectedInvoice.customer === 'object' && selectedInvoice.customer !== null ? (selectedInvoice.customer.name || 'Customer') : String(selectedInvoice.customer || 'Customer')}
                  </div>
                </div>
                <StatusBadge status={selectedInvoice.status} fallback="Completed" />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '1.35rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 0', color: '#64748b' }}>Merchant Entity</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {typeof selectedInvoice.entity === 'object' && selectedInvoice.entity !== null ? (selectedInvoice.entity.name || 'Merchant Entity') : String(selectedInvoice.entity || 'Merchant Entity')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 0', color: '#64748b' }}>Date &amp; Timestamp</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {typeof selectedInvoice.date === 'object' && selectedInvoice.date !== null ? (selectedInvoice.date.created_at || 'Recently') : String(selectedInvoice.date || 'Recently')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {typeof selectedInvoice.paymentMethod === 'object' && selectedInvoice.paymentMethod !== null ? (selectedInvoice.paymentMethod.name || 'Direct') : String(selectedInvoice.paymentMethod || 'Direct Settlement')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 0', color: '#64748b' }}>Gross Sale Amount (GMV)</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>₹{selectedInvoice.gross.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#0d9488' }}>
                    <td style={{ padding: '0.55rem 0', fontWeight: 800 }}>Admin Platform Fee Retained</td>
                    <td style={{ padding: '0.55rem 0', textAlign: 'right', fontWeight: 800 }}>+₹{selectedInvoice.adminFee.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '0.75rem 0.65rem', fontWeight: 800, color: '#3569a7', fontSize: '0.9rem' }}>Net Disbursed to Merchant</td>
                    <td style={{ padding: '0.75rem 0.65rem', textAlign: 'right', fontWeight: 900, color: '#3569a7', fontSize: '1.08rem' }}>₹{selectedInvoice.netEntity.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '0.55rem 1.15rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Printer size={15} />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    padding: '0.55rem 1.35rem',
                    background: '#3569a7',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(53, 105, 167, 0.3)',
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

export default AdminDashboardOverview;
