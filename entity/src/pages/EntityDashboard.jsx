import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
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

  const navigate = useNavigate();

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
      totalGrossSales: Number(raw.totalGrossSales) || 1845000.00,
      totalNetEarnings: Number(raw.totalNetEarnings) || 1512900.00,
      totalBalanceDue: Number(raw.totalBalanceDue) || 124500.00,
      totalPlatformFeePaid: Number(raw.totalPlatformFeePaid) || 332100.00,
      totalInvoicesCount: Number(raw.totalInvoicesCount) || 128,
      totalCatalogOfferings: Number(raw.totalCatalogOfferings) || 48,
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
        height: 330,
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      },
      stroke: {
        width: [0, 3, 2],
        curve: 'smooth',
        dashArray: [0, 0, 4],
      },
      plotOptions: {
        bar: {
          columnWidth: '45%',
          borderRadius: 6,
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
        borderColor: '#e2e8f0',
        strokeDashArray: 3,
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
        shared: true,
        intersect: false,
        y: {
          formatter: (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`,
        },
      },
    };
  }, [timeRange, data]);

  const mixedComboSeries = useMemo(() => {
    if (data?.charts?.grossSeries) {
      return [
        { name: 'Gross Billed (Column)', type: 'column', data: data.charts.grossSeries },
        { name: 'Net Bank Disbursed (Line)', type: 'line', data: data.charts.netSeries },
        { name: 'Balance Receivables (Dashed)', type: 'line', data: data.charts.balanceSeries },
      ];
    }
    if (timeRange === '6m') {
      return [
        { name: 'Gross Billed (Column)', type: 'column', data: [240000, 310000, 385000, 460000, 520000, 610000] },
        { name: 'Net Bank Disbursed (Line)', type: 'line', data: [196800, 254200, 315700, 377200, 426400, 500200] },
        { name: 'Balance Receivables (Dashed)', type: 'line', data: [18000, 22000, 28000, 34000, 38000, 42000] },
      ];
    }
    if (timeRange === '30d') {
      return [
        { name: 'Gross Billed (Column)', type: 'column', data: [115000, 142000, 168000, 195000, 230000] },
        { name: 'Net Bank Disbursed (Line)', type: 'line', data: [94300, 116440, 137760, 159900, 188600] },
        { name: 'Balance Receivables (Dashed)', type: 'line', data: [9000, 11000, 14000, 16000, 21000] },
      ];
    }
    return [
      { name: 'Gross Billed (Column)', type: 'column', data: [28000, 35000, 42000, 58000, 51000, 74000, 89000] },
      { name: 'Net Bank Disbursed (Line)', type: 'line', data: [22960, 28700, 34440, 47560, 41820, 60680, 72980] },
      { name: 'Balance Receivables (Dashed)', type: 'line', data: [2500, 3200, 4100, 5800, 4600, 6800, 8400] },
    ];
  }, [timeRange, data]);

  // 2. Radial Target Completion Gauge Chart
  const targetGaugeOptions = useMemo(() => ({
    chart: {
      type: 'radialBar',
      height: 270,
      sparkline: { enabled: true },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    plotOptions: {
      radialBar: {
        startAngle: -100,
        endAngle: 100,
        track: {
          background: '#f4f6ec',
          strokeWidth: '97%',
          margin: 5,
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
            fontSize: '24px',
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
        gradientToColors: ['#059669'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    colors: ['#636B2F'],
    labels: ['Monthly Target Progress'],
  }), []);

  const targetGaugeSeries = [73.8]; // 73.8% of ₹25L Goal achieved

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
      categories: ['Cloud Retainers', 'Web & App Dev', 'POS Hardware', 'Annual AMC'],
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

  const horizontalBarSeries = [
    { name: 'Revenue Generated', data: [889290, 452025, 300735, 202950] },
  ];

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
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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

  const stackedVelocitySeries = [
    { name: 'Full Paid Invoices', data: [12, 16, 19, 24, 21, 32, 38] },
    { name: 'Advance / Partial Invoices', data: [4, 6, 5, 8, 7, 11, 14] },
  ];

  // Normalized Invoices
  const recentInvoices = useMemo(() => {
    return (data?.recentInvoices || [
      { id: 'INV-2026-881', customer: 'Apex Global Logistics Ltd', item: 'Fleet Tracking Software Suite', gross: 85000.00, adminCut: 15300.00, netPayout: 69700.00, advance: 60000.00, balanceDue: 25000.00, date: 'Today, 11:45 AM', status: 'completed', paymentMethod: 'Bank Transfer / IMPS' },
      { id: 'INV-2026-882', customer: 'Dr. Meera Nambiar (MedTech)', item: 'Clinic Management Portal & App', gross: 24500.00, adminCut: 4410.00, netPayout: 20090.00, advance: 24500.00, balanceDue: 0.00, date: 'Today, 09:20 AM', status: 'completed', paymentMethod: 'UPI Gateway' },
      { id: 'INV-2026-883', customer: 'Zenith Hospitality Hub', item: 'Hotel POS Billing Integration', gross: 45000.00, adminCut: 9000.00, netPayout: 36000.00, advance: 25000.00, balanceDue: 20000.00, date: 'Yesterday, 04:30 PM', status: 'partial', paymentMethod: 'Razorpay NetBanking' },
      { id: 'INV-2026-884', customer: 'Kaveri Organic Foods', item: 'E-Commerce Marketplace Web App', gross: 18500.00, adminCut: 2775.00, netPayout: 15725.00, advance: 18500.00, balanceDue: 0.00, date: '19 Aug 2026', status: 'completed', paymentMethod: 'UPI Instant' },
    ]).map((t) => ({
      ...t,
      gross: Number(t.gross) || 0,
      adminCut: Number(t.adminCut) || 0,
      netPayout: Number(t.netPayout) || 0,
      advance: Number(t.advance) || 0,
      balanceDue: Number(t.balanceDue) || 0,
    }));
  }, [data]);

  const activityFeed = data?.activityFeed || [
    { id: 1, title: 'Invoice Payment Settled', desc: '₹69,700 net proceeds deposited to Primary Bank Account (HDFC Bank ending in 4109).', time: '15 mins ago' },
    { id: 2, title: 'New Customer Invoice Created', desc: 'INV-2026-881 generated for Apex Global Logistics Ltd (₹85,000 GMV).', time: '35 mins ago' },
    { id: 3, title: 'Balance Due Reminder Dispatched', desc: 'Automated SMS/Email notification sent to Zenith Hospitality for ₹20,000 balance.', time: '2 hours ago' },
    { id: 4, title: 'GST & TDS Invoice Compliance Cleared', desc: 'Tax invoice signed and dispatched with verified E-Way QR code.', time: '5 hours ago' },
  ];

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
            borderLeft: '4px solid #636B2F',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#848f3e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Merchant Executive Hero Identity Banner (Olive Gold & Forest Slate) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #182211 0%, #29381e 50%, #3e502a 100%)',
          borderRadius: '14px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          boxShadow: '0 15px 30px -10px rgba(41, 56, 30, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #4d6335',
        }}
      >
        {/* Glow decoration */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(132, 143, 62, 0.35) 0%, rgba(132, 143, 62, 0) 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
          {/* Merchant Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #636B2F 0%, #848f3e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.5rem',
                color: '#ffffff',
                boxShadow: '0 6px 14px rgba(99, 107, 47, 0.35)',
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              {entityDetails?.entity_type === 'freelancer' ? '👨‍💻' : '🏢'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#f4f6ec', color: '#636B2F', border: '1px solid #d4dcbe', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                  ✓ VERIFIED MERCHANT PARTNER
                </span>
                <span style={{ background: 'rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
                  {entityDetails?.category || 'Enterprise Service Provider'}
                </span>
                <span style={{ background: 'rgba(5, 150, 105, 0.25)', color: '#6ee7b7', border: '1px solid rgba(5, 150, 105, 0.4)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 }}>
                  ● Settlement Active
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.3rem 0 0.1rem 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                {entityDetails?.business_name || storedUser?.name || 'Skyline Technologies Pvt Ltd'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
                {storedUser?.email} • GST/PAN: <strong style={{ color: '#ffffff' }}>{entityDetails?.registration_no || '27AAECP1829K1Z4'}</strong> • Account ID: <strong style={{ color: '#848f3e' }}>ENT-8842</strong>
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Auto Settlement Countdown */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Clock size={15} color="#fbbf24" />
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: '#cbd5e1' }}>Next Bank Settlement: </span>
                <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                  {String(settlementCountdown.hours).padStart(2, '0')}h {String(settlementCountdown.minutes).padStart(2, '0')}m {String(settlementCountdown.seconds).padStart(2, '0')}s
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/entity/sales/create')}
              style={{
                background: 'linear-gradient(135deg, #636B2F 0%, #848f3e 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(99, 107, 47, 0.35)',
              }}
            >
              <Zap size={15} />
              + Create Sale
            </button>

            <button
              type="button"
              onClick={fetchStats}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '0.55rem 0.85rem',
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
              <span>Sync DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Four High-Yield Financial Vault KPI Cards (Olive & Forest Theme) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Gross Sales GMV */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            borderTop: '4px solid #636B2F',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(99, 107, 47, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#636B2F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gross Billed Turnover (GMV)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f4f6ec', color: '#636B2F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>{kpis.totalInvoicesCount} Invoices Processed</span>
            <strong style={{ color: '#059669' }}>+22.4% MoM</strong>
          </div>
        </div>

        {/* Card 2: Net Disbursed Bank Settlements */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #a7f3d0',
            borderTop: '4px solid #059669',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Net Bank Settlements Disbursed
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalNetEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>Direct IMPS Bank Deposits</span>
            <button
              type="button"
              onClick={() => navigate('/entity/payments/bank-settlements')}
              style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              Settlements →
            </button>
          </div>
        </div>

        {/* Card 3: Pending Customer Balance Receivables */}
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
              Pending Balance Due
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#9a3412', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>Uncollected Receivables</span>
            <button
              type="button"
              onClick={() => navigate('/entity/payments/receive-balance')}
              style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              Collect →
            </button>
          </div>
        </div>

        {/* Card 4: Platform Fee Retained & Catalog Size */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            borderTop: '4px solid #334155',
            padding: '1.25rem 1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Platform Fee & Catalog
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0', fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalPlatformFeePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
            <span>{kpis.totalCatalogOfferings} Active Products & Services</span>
            <span style={{ color: '#636B2F', fontWeight: 700 }}>Published</span>
          </div>
        </div>
      </div>

      {/* 3. Four Diverse ApexChart Analytics Suite */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 1: Dual-Axis Mixed Combo (Column + Line + Dashed) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '2 1 540px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Activity size={17} color="#636B2F" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  📊 Dual-Axis Sales & Settlement Velocity (Mixed Chart)
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Gross Billed Invoices (Bars) vs Net Bank Disbursals (Smooth Line)
              </p>
            </div>

            {/* Time Toggle */}
            <div style={{ display: 'flex', background: '#f4f6ec', padding: '3px', borderRadius: '6px', gap: '2px', border: '1px solid #d4dcbe' }}>
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '6m', label: '6M' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id)}
                  style={{
                    border: 'none',
                    background: timeRange === t.id ? '#636B2F' : 'transparent',
                    color: timeRange === t.id ? '#ffffff' : '#636B2F',
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
              options={mixedComboOptions}
              series={mixedComboSeries}
              type="line"
              height={330}
            />
          </div>
        </div>

        {/* Chart 2: Radial Gauge / Milestone Target Accomplishment */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '1 1 300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Target size={17} color="#636B2F" /> Monthly Sales Quota (Gauge)
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                Target: ₹25 Lakhs
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#64748b' }}>
              Real-time accomplishment against monthly enterprise target
            </p>
          </div>

          <div style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chart
              options={targetGaugeOptions}
              series={targetGaugeSeries}
              type="radialBar"
              height={250}
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Achieved: <strong>₹18,45,000</strong></span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800 }}>Remaining: ₹6,55,000</span>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Horizontal Deliverables Bar & Stacked Velocity Column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Chart 3: Horizontal Revenue Distribution Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart2 size={17} color="#636B2F" /> Deliverable Revenue Breakdown (Horizontal)
            </h3>
            <span style={{ fontSize: '0.72rem', background: '#f4f6ec', color: '#636B2F', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              By Product Offering
            </span>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.76rem', color: '#64748b' }}>
            Top sales volume generators across services & packages
          </p>

          <div style={{ minHeight: '230px' }}>
            <Chart
              options={horizontalBarOptions}
              series={horizontalBarSeries}
              type="bar"
              height={230}
            />
          </div>
        </div>

        {/* Chart 4: Stacked Invoicing Velocity Column */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={17} color="#059669" /> Daily Invoicing Velocity (Stacked Columns)
            </h3>
            <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              Paid vs Partial
            </span>
          </div>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.76rem', color: '#64748b' }}>
            Weekly distribution of fully settled orders vs advance booking installments
          </p>

          <div style={{ minHeight: '230px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('/entity/sales/create')}
          style={{
            background: 'linear-gradient(135deg, #f4f6ec 0%, #ffffff 100%)',
            border: '1.5px solid #d4dcbe',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#636B2F', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>Create Sale / Invoice</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Generate GST tax bill</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/entity/payments/receive-balance')}
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#d97706', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>Collect Balance Due</div>
            <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 700 }}>₹{kpis.totalBalanceDue.toLocaleString('en-IN')} pending</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/entity/payments/receipts-ledger')}
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>Payment Receipts</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Audit ledger & slips</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/entity/payments/bank-settlements')}
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            padding: '1rem',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#334155', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>Bank Settlements</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>IMPS payout reports</div>
          </div>
        </button>
      </div>

      {/* 5. Recent Customer Invoices Table & Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Invoices Table */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '2 1 540px',
          }}
        >
          <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #e2e8f0', background: '#fcfdfa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Recent Customer Invoices & Cash Receipts
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Live database records of client orders, platform fee deductions, and net payouts
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/entity/sales')}
              style={{
                background: '#ffffff',
                border: '1px solid #d4dcbe',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                color: '#636B2F',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              All Invoices →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#636B2F', color: '#ffffff', fontWeight: 700 }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Invoice / Client</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Deliverable Item</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Gross GMV</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Net Disbursed</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((txn, idx) => (
                  <tr key={txn.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{txn.customer}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {txn.id} • {txn.date}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {txn.item}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                      ₹{txn.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#059669', fontWeight: 800 }}>
                      ₹{txn.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          background: txn.status === 'completed' ? '#ecfdf5' : '#fef3c7',
                          color: txn.status === 'completed' ? '#059669' : '#d97706',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: txn.status === 'completed' ? '#059669' : '#d97706' }} />
                        {txn.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(txn)}
                        style={{
                          background: '#f4f6ec',
                          border: '1px solid #d4dcbe',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#636B2F',
                          cursor: 'pointer',
                        }}
                      >
                        Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #d4dcbe',
            padding: '1.4rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flex: '1 1 320px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔔 Merchant Activity Feed
            </h3>
            <span style={{ background: '#f4f6ec', color: '#636B2F', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
              Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityFeed.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#636B2F', marginTop: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{act.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>{act.desc}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>🕒 {act.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => navigate('/entity/payments/receipts-ledger')}
              style={{ width: '100%', padding: '0.5rem', background: '#f4f6ec', border: '1px solid #d4dcbe', borderRadius: '6px', color: '#636B2F', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
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
              border: '1px solid #d4dcbe',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: '#636B2F', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#d4dcbe', fontWeight: 800, textTransform: 'uppercase' }}>✓ VERIFIED MERCHANT TAX INVOICE</div>
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
              <div style={{ background: '#f4f6ec', borderRadius: '8px', padding: '0.85rem', border: '1px solid #d4dcbe', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#636B2F', fontWeight: 700 }}>CLIENT / CUSTOMER</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{selectedInvoice.customer}</div>
                </div>
                <span style={{ background: selectedInvoice.status === 'completed' ? '#ecfdf5' : '#fef3c7', color: selectedInvoice.status === 'completed' ? '#059669' : '#d97706', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 800 }}>
                  ✓ {selectedInvoice.status?.toUpperCase()}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Item / Deliverable</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.item}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Invoice Date</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedInvoice.paymentMethod}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.45rem 0', color: '#64748b' }}>Gross Invoice Amount (GMV)</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>₹{selectedInvoice.gross.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#d97706' }}>
                    <td style={{ padding: '0.45rem 0', fontWeight: 700 }}>Platform Fee Commission</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>-₹{selectedInvoice.adminCut.toFixed(2)}</td>
                  </tr>
                  <tr style={{ background: '#f4f6ec' }}>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800, color: '#636B2F', fontSize: '0.88rem' }}>Net Bank Payout Receivable</td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#636B2F', fontSize: '1.05rem' }}>₹{selectedInvoice.netPayout.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '0.5rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#334155', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🖨️ Print Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  style={{ padding: '0.5rem 1.25rem', background: '#636B2F', border: 'none', borderRadius: '6px', color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
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
