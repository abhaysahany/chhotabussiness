import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
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
        type: 'area',
        height: 330,
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
        borderColor: '#e2e8f0',
        strokeDashArray: 3,
        padding: { top: 10, right: 10, bottom: 0, left: 10 },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        fontWeight: 700,
        markers: { radius: 4 },
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
      type: 'polarArea',
      height: 270,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    stroke: { colors: ['#ffffff'] },
    fill: { opacity: 0.88 },
    colors: ['#3569a7', '#0d9488', '#d97706', '#475569'],
    labels: data?.charts?.revenueDistribution?.labels || ['Products', 'Services', 'Packages', 'General'],
    legend: {
      position: 'bottom',
      fontSize: '11px',
      fontWeight: 700,
      markers: { radius: 3 },
      itemMargin: { horizontal: 6, vertical: 4 },
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
      type: 'radialBar',
      height: 240,
      sparkline: { enabled: true },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      radialBar: {
        startAngle: -110,
        endAngle: 110,
        track: {
          background: '#eaf1f8',
          strokeWidth: '97%',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '12px',
            color: '#475569',
            offsetY: 20,
            fontWeight: 700,
          },
          value: {
            offsetY: -15,
            fontSize: '22px',
            fontWeight: 800,
            color: '#3569a7',
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
        gradientToColors: ['#0d9488'],
        stops: [0, 100],
      },
    },
    colors: ['#3569a7'],
    labels: ['Monthly Target Progress'],
  }), []);

  const radialTargetSeries = [Number(data?.kpis?.targetProgress) || 0];

  // 4. ApexCharts: Grouped Column Affiliate vs KYC Velocity
  const groupedVelocityOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 240,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    colors: ['#3569a7', '#0d9488'],
    xaxis: {
      categories: data?.charts?.velocityBar?.categories || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 700 } },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } },
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    legend: { position: 'top', fontSize: '11px', fontWeight: 700 },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#1e293b',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 99999,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderLeft: '4px solid #3569a7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#3569a7" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Master Enterprise Top Navigation Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #b3cbe6',
          padding: '1.1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(53, 105, 167, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3569a7 0%, #1e3a5f 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(53, 105, 167, 0.25)',
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', background: '#eaf1f8', color: '#3569a7', padding: '2px 8px', borderRadius: '4px', border: '1px solid #b3cbe6' }}>
                MASTER GOVERNANCE PORTAL
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0d9488', background: '#ccfbf1', padding: '2px 8px', borderRadius: '4px' }}>
                ● Database Online (MySQL 8.0)
              </span>
            </div>
            <h1 style={{ margin: '0.2rem 0 0 0', fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Enterprise Platform Administration
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Tuesday Auto Settlement Pill */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Clock size={15} color="#d97706" />
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Weekly Batch Cycle: </span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                {String(settlementCountdown.hours).padStart(2, '0')}h {String(settlementCountdown.minutes).padStart(2, '0')}m {String(settlementCountdown.seconds).padStart(2, '0')}s
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStats}
            style={{
              background: '#ffffff',
              border: '1px solid #b3cbe6',
              color: '#3569a7',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync MySQL</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('orders-management')}
            style={{
              background: 'linear-gradient(135deg, #3569a7 0%, #264e7e 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(53, 105, 167, 0.25)',
            }}
          >
            <Zap size={15} />
            + New Sales Order
          </button>
        </div>
      </div>

      {/* 2. Four Corporate Financial Vault KPI Cards (Steel Theme) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Gross Platform GMV */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            borderTop: '4px solid #3569a7',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#3569a7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Platform Gross Volume (GMV)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#eaf1f8', color: '#3569a7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>Merchant & Affiliate Sales</span>
            <strong style={{ color: '#0d9488' }}>Active System</strong>
          </div>
        </div>

        {/* Card 2: Net Retained Platform Revenue Pool */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #99f6e4',
            borderTop: '4px solid #0d9488',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Retained Admin Fee Pool
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalPlatformRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>Net Corporate Earnings</span>
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
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fde68a',
            borderTop: '4px solid #d97706',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Disbursed Commissions & TDS
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalCommissionsPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>TDS Pool: ₹{kpis.totalTdsCollected.toLocaleString('en-IN')} (5% Tax)</span>
            <span style={{ color: '#d97706', fontWeight: 700 }}>Settled</span>
          </div>
        </div>

        {/* Card 4: Active Network Members & Growth */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            borderTop: '4px solid #475569',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Registered Network Base
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users2 size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {kpis.totalUsers.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>({kpis.activeUsers} Active)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>+{kpis.newUsersThisMonth} joins this month</span>
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
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid #334155',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgba(217, 119, 6, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
              OPERATIONS QUEUE SENTINEL
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
              {kpis.pendingPayoutsCount} Payout Requests Pending (₹{kpis.pendingPayoutsAmount.toLocaleString('en-IN')}) • {kpis.pendingKycCount} KYC Submissions Awaiting Audit
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('users-payout-requests')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Review Payouts ({kpis.pendingPayoutsCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('users-kyc')}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Review KYC ({kpis.pendingKycCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('support-tickets')}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0.45rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Support Tickets ({kpis.openSupportTickets})
          </button>
        </div>
      </div>

      {/* 4. Four Diverse ApexChart Analytics Suite for Admin */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Cashflow Spline Area Chart */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '2 1 540px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={17} color="#3569a7" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Enterprise Cashflow & Fee Settlement Curve (Spline Area)
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Gross merchant volume, platform cut, and commission disbursements
              </p>
            </div>

            {/* Timeline Filter */}
            <div style={{ display: 'flex', background: '#eaf1f8', padding: '3px', borderRadius: '6px', gap: '2px', border: '1px solid #b3cbe6' }}>
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
                    color: timelinePeriod === t.id ? '#ffffff' : '#3569a7',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ minHeight: '330px' }}>
            <Chart
              options={cashflowChartOptions}
              series={cashflowChartSeries}
              type="area"
              height={330}
            />
          </div>
        </div>

        {/* Chart 2: Polar Area Revenue Allocation */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '1 1 320px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PieIcon size={17} color="#3569a7" /> Revenue Share by Offering (Polar Area)
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#eaf1f8', color: '#3569a7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                Polar View
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
              Revenue contribution across services, hardware, packages & royalties
            </p>
          </div>

          <div style={{ minHeight: '270px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chart
              options={polarRevenueOptions}
              series={polarRevenueSeries}
              type="polarArea"
              height={270}
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {data?.charts?.revenueDistribution?.labels?.[0] ? `Leading: ${data.charts.revenueDistribution.labels[0]} (${data.charts.revenueDistribution.series[0] || 0}%)` : 'Catalog Distribution'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders-management')}
              style={{ background: 'none', border: 'none', color: '#3569a7', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Full Breakdown →
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Radial Gauge & Grouped Velocity Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 3: Radial Target Gauge */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={17} color="#3569a7" /> Monthly Platform GMV Target (Radial Gauge)
            </h3>
            <span style={{ fontSize: '0.72rem', background: '#eaf1f8', color: '#3569a7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              Goal: ₹65 Lakhs
            </span>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.76rem', color: '#64748b' }}>
            Overall platform revenue trajectory toward monthly milestone
          </p>

          <div style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chart
              options={radialTargetOptions}
              series={radialTargetSeries}
              type="radialBar"
              height={240}
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>Achieved: <strong>₹{kpis.totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
            <span style={{ color: '#0d9488', fontWeight: 800 }}>Remaining: ₹{Math.max(0, 6500000 - kpis.totalGmv).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Chart 4: Grouped Column Velocity */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={17} color="#0d9488" /> Affiliate Growth & KYC Velocity (Grouped Bars)
            </h3>
            <span style={{ fontSize: '0.72rem', background: '#ccfbf1', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              Weekly Velocity
            </span>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.76rem', color: '#64748b' }}>
            Daily network signups vs compliance verified accounts
          </p>

          <div style={{ minHeight: '220px' }}>
            <Chart
              options={groupedVelocityOptions}
              series={groupedVelocitySeries}
              type="bar"
              height={240}
            />
          </div>
        </div>
      </div>

      {/* 5. Enterprise Merchant Ledger & Fast Settlement Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Invoices & Sales Ledger */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '2 1 540px',
          }}
        >
          <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Recent Merchant Invoices & Automatic Settlements
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Live database entries of corporate sales and retained admin commission cuts
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders-management')}
              style={{
                background: '#ffffff',
                border: '1px solid #b3cbe6',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                color: '#3569a7',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              View All Invoices →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#3569a7', color: '#ffffff', fontWeight: 700 }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Invoice / Client</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Merchant Entity</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Gross GMV</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Admin Cut</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                      No recent transactions recorded in database.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((txn, idx) => (
                  <tr key={txn.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {typeof txn.customer === 'object' && txn.customer !== null ? (txn.customer.name || 'Customer') : String(txn.customer || 'Customer')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {typeof txn.id === 'object' ? 'INV' : String(txn.id)} • {typeof txn.date === 'object' && txn.date !== null ? (txn.date.created_at || 'Recently') : String(txn.date || 'Recently')}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {typeof txn.entity === 'object' && txn.entity !== null ? (txn.entity.name || 'Merchant Entity') : String(txn.entity || 'Merchant Entity')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                      ₹{txn.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0d9488', fontWeight: 800 }}>
                      ₹{txn.adminFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusBadge status={txn.status} fallback="completed" />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(txn)}
                        style={{
                          background: '#eaf1f8',
                          border: '1px solid #b3cbe6',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#3569a7',
                          cursor: 'pointer',
                        }}
                      >
                        Slip
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Corporate Merchant & Entity Performance Matrix */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #b3cbe6',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '1 1 320px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Briefcase size={17} color="#3569a7" /> Top Merchant Entities
            </h3>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('businesses')}
              style={{ background: 'none', border: 'none', color: '#3569a7', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
            >
              All Entities →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {merchantPartners.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                No active merchant partners found.
              </div>
            ) : (
              merchantPartners.map((m, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                      {typeof m.name === 'object' && m.name !== null ? (m.name.name || 'Partner') : String(m.name || 'Partner')}
                    </div>
                    <CategoryBadge category={m.category} count={m.count} fallback="Entity" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3569a7', background: '#eaf1f8', padding: '2px 6px', borderRadius: '4px' }}>
                    {typeof m.share === 'object' ? '0%' : String(m.share || '0%')} Share
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Turnover: <strong>{typeof m.gmv === 'object' ? '₹0.00' : String(m.gmv || '₹0.00')}</strong></span>
                  <span style={{ color: '#0d9488', fontWeight: 800 }}>Admin Cut: {typeof m.adminCut === 'object' ? '₹0.00' : String(m.adminCut || '₹0.00')}</span>
                </div>
              </div>
            )))}
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('businesses')}
              style={{ width: '100%', padding: '0.5rem', background: '#eaf1f8', border: '1px solid #b3cbe6', borderRadius: '6px', color: '#3569a7', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
            >
              Manage Business & Freelancer Partners →
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
            backdropFilter: 'blur(4px)',
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
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #b3cbe6',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#3569a7', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#ccfbf1', fontWeight: 800, textTransform: 'uppercase' }}>✓ ADDNET VERIFIED INVOICE</div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 800 }}>{selectedInvoice.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.4rem' }}>
              <div style={{ background: '#eaf1f8', borderRadius: '8px', padding: '0.85rem', border: '1px solid #b3cbe6', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#3569a7', fontWeight: 700 }}>CORPORATE CLIENT</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                    {typeof selectedInvoice.customer === 'object' && selectedInvoice.customer !== null ? (selectedInvoice.customer.name || 'Customer') : String(selectedInvoice.customer || 'Customer')}
                  </div>
                </div>
                <StatusBadge status={selectedInvoice.status} fallback="Completed" />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Merchant Entity</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {typeof selectedInvoice.entity === 'object' && selectedInvoice.entity !== null ? (selectedInvoice.entity.name || 'Merchant Entity') : String(selectedInvoice.entity || 'Merchant Entity')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Date & Timestamp</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {typeof selectedInvoice.date === 'object' && selectedInvoice.date !== null ? (selectedInvoice.date.created_at || 'Recently') : String(selectedInvoice.date || 'Recently')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>
                      {typeof selectedInvoice.paymentMethod === 'object' && selectedInvoice.paymentMethod !== null ? (selectedInvoice.paymentMethod.name || 'Direct') : String(selectedInvoice.paymentMethod || 'Direct Settlement')}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Gross Sale Amount (GMV)</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>₹{selectedInvoice.gross.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#0d9488' }}>
                    <td style={{ padding: '0.45rem 0', fontWeight: 800 }}>Admin Platform Fee Retained</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 800 }}>+₹{selectedInvoice.adminFee.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800, color: '#3569a7', fontSize: '0.88rem' }}>Net Disbursed to Merchant</td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#3569a7', fontSize: '1.05rem' }}>₹{selectedInvoice.netEntity.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '0.5rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  style={{ padding: '0.5rem 1.25rem', background: '#3569a7', border: 'none', borderRadius: '6px', color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
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
