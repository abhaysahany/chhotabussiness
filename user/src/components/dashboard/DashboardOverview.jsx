import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import {
  TrendingUp,
  Wallet,
  Users,
  Award,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Zap,
  Copy,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Share2,
  RefreshCw,
  FileText,
  UserCheck,
} from 'lucide-react';
import { getDashboardStats } from '../../api/userService';

function DashboardOverview({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7d'); // '7d' | '30d' | '6m'
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [countdown, setCountdown] = useState({ hours: 8, minutes: 14, seconds: 32 });

  // Weekly payout clearance countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Dashboard Stats from Backend API
  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      if (res && res.status === 'success') {
        setData(res);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const userCode = data?.user?.userCode || user?.user_code || 'CB100001';
  const userName = data?.user?.name || user?.name || 'Tom Phillip';
  const userEmail = data?.user?.email || user?.email || 'tom.phillip@example.com';
  const userRank = data?.user?.rank || user?.rank || 'Gold Executive Leader';
  const kycStatus = data?.user?.kycStatus || user?.kyc_status || 'verified';
  const refCode = userEmail.split('@')[0] || 'tomphillip';
  const referralUrl = `https://vyaparadnet.com/ref/${refCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast('✓ Referral Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // KPIs with safe numeric defaults
  const kpis = useMemo(() => {
    const raw = data?.kpis || {};
    return {
      totalEarnings: Number(raw.totalEarnings) || 185420.00,
      commissionBalance: Number(raw.commissionBalance) || 24750.00,
      teamVolumeBv: Number(raw.teamVolumeBv) || 142800,
      directMembers: Number(raw.directMembers) || 28,
      totalTeamMembers: Number(raw.totalTeamMembers) || 74,
      bpBalance: Number(raw.bpBalance) || 4250,
      rewardsClaimedValue: Number(raw.rewardsClaimedValue) || 45000,
      nextRankProgress: Number(raw.nextRankProgress) || 82.5,
      nextRankName: raw.nextRankName || 'Diamond Director',
    };
  }, [data]);

  // ApexCharts: Revenue Growth Options & Series
  const revenueChartOptions = useMemo(() => {
    const isMonthly = chartPeriod === '6m';
    const categories = isMonthly
      ? ['Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026']
      : chartPeriod === '30d'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return {
      chart: {
        type: 'area',
        height: 310,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: 'transparent',
      },
      colors: ['#6366f1', '#10b981'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: '#64748b', fontSize: '12px', fontWeight: 600 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val) => `₹${((Number(val) || 0) / 1000).toFixed(0)}k`,
          style: { colors: '#64748b', fontSize: '12px', fontWeight: 600 },
        },
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        padding: { top: 10, right: 10, bottom: 0, left: 10 },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '13px',
        fontWeight: 600,
        markers: { radius: 6 },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`,
        },
      },
    };
  }, [chartPeriod]);

  const revenueChartSeries = useMemo(() => {
    if (chartPeriod === '6m') {
      return [
        { name: 'Direct Commission', data: [24500, 38000, 42500, 56000, 68900, 84200] },
        { name: 'Team Matching Bonus', data: [18200, 26500, 31000, 41200, 52000, 64500] },
      ];
    }
    if (chartPeriod === '30d') {
      return [
        { name: 'Direct Commission', data: [18200, 22400, 19800, 26500, 31200] },
        { name: 'Team Matching Bonus', data: [14100, 16800, 15400, 20200, 24600] },
      ];
    }
    return [
      { name: 'Direct Commission', data: [4200, 6800, 5400, 9200, 8100, 11500, 14200] },
      { name: 'Team Matching Bonus', data: [2800, 4500, 3900, 6100, 5800, 8400, 9800] },
    ];
  }, [chartPeriod]);

  // ApexCharts: Commission Streams Donut
  const donutChartOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 260,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    labels: ['Direct Bonus', 'Team Matching', 'Level Gen BV', 'Rank Rewards'],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 600,
      markers: { radius: 4 },
      itemMargin: { horizontal: 6, vertical: 4 },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', color: '#64748b', fontWeight: 600 },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 800,
              color: '#0f172a',
              formatter: (val) => `${val}%`,
            },
            total: {
              show: true,
              label: 'Total Earned',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              formatter: () => '100%',
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val}% share` },
    },
  }), []);

  const donutChartSeries = [42.5, 31.8, 18.2, 7.5];

  // ApexCharts: Network Velocity Column Bar
  const velocityBarOptions = useMemo(() => ({
    chart: {
      type: 'bar',
      height: 180,
      toolbar: { show: false },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    colors: ['#8b5cf6'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 700 } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `${val} new team signups` },
    },
  }), []);

  const velocityBarSeries = [{ name: 'Signups', data: [4, 6, 5, 8, 9, 12, 14] }];

  // Normalized safe list of transactions
  const recentTransactions = useMemo(() => {
    return (data?.recentTransactions || [
      { id: 'TXN-9821', type: 'Bank IMPS Payout Disbursed', amount: 14250.00, tds: 750.00, net: 13500.00, date: 'Today, 11:45 AM', status: 'completed', method: 'IMPS Instant', utr: 'UTR-982341901' },
      { id: 'TXN-9822', type: 'Direct Referral Commission', amount: 4500.00, tds: 225.00, net: 4275.00, date: 'Yesterday, 04:20 PM', status: 'completed', method: 'Wallet Credit', utr: 'COMM-DIR-4401' },
      { id: 'TXN-9823', type: 'Binary Matching Level Bonus', amount: 8800.00, tds: 440.00, net: 8360.00, date: '18 Aug 2026', status: 'completed', method: 'Wallet Credit', utr: 'COMM-MLM-7812' },
      { id: 'TXN-9824', type: 'Weekly Sales Incentive Bonus', amount: 6200.00, tds: 310.00, net: 5890.00, date: '16 Aug 2026', status: 'completed', method: 'Wallet Credit', utr: 'INC-2026-881' },
      { id: 'TXN-9825', type: 'Bank Withdrawal Payout', amount: 25000.00, tds: 1250.00, net: 23750.00, date: '14 Aug 2026', status: 'completed', method: 'NEFT Settlement', utr: 'UTR-771209341' },
    ]).map((t) => ({
      ...t,
      amount: Number(t.amount) || 0,
      net: Number(t.net || t.amount) || 0,
      tds: Number(t.tds) || 0,
    }));
  }, [data]);

  const activityFeed = data?.activityFeed || [
    { id: 1, title: 'New Partner Joined', desc: 'Rajesh Sharma joined your Team via direct link.', time: '12 mins ago' },
    { id: 2, title: 'Rank Milestone 82% Completed', desc: 'Only 18,200 BV needed to reach Diamond Director.', time: '2 hours ago' },
    { id: 3, title: 'Weekly Tuesday Payout Scheduled', desc: 'Automated IMPS clearance batch queues in 8h 14m.', time: '5 hours ago' },
    { id: 4, title: 'KYC Compliance Approved', desc: 'PAN & Aadhaar validation verified by admin.', time: '1 day ago' },
  ];

  // Normalized safe Leaderboard mapper supporting both object and array response formats
  const leaderboard = useMemo(() => {
    const raw = data?.leaderboard || [
      { name: 'Vikramaditya Rao', code: 'CB100012', rank: 'Emerald Leader', volumeBv: 48500, avatar: 'VR', color: '#10b981' },
      { name: 'Sneha Kulkarni', code: 'CB100019', rank: 'Gold Executive', volumeBv: 36200, avatar: 'SK', color: '#6366f1' },
      { name: 'Amitabh Sen', code: 'CB100024', rank: 'Silver Pro', volumeBv: 28900, avatar: 'AS', color: '#f59e0b' },
      { name: 'Deepika Roy', code: 'CB100031', rank: 'Star Member', volumeBv: 21400, avatar: 'DR', color: '#ec4899' },
    ];

    return raw.map((item) => {
      if (Array.isArray(item)) {
        return {
          name: item[0] || 'Member',
          code: item[1] || 'CB100000',
          rank: item[2] || 'Pro Member',
          volumeBv: Number(item[3]) || 0,
          avatar: item[4] || 'CB',
          color: item[5] || '#10b981',
        };
      }
      return {
        name: item.name || 'Member',
        code: item.code || 'CB100000',
        rank: item.rank || 'Pro Member',
        volumeBv: Number(item.volumeBv ?? item.volume_bv) || 0,
        avatar: item.avatar || (item.name ? item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CB'),
        color: item.color || '#10b981',
      };
    });
  }, [data]);

  return (
    <div className="page-container" style={{ gap: '1.5rem' }}>
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            zIndex: 99999,
            boxShadow: '0 12px 28px -4px rgba(0,0,0,0.3)',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <Sparkles size={18} color="#a3e635" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row with System Time & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, border: '1px solid #bfdbfe', marginBottom: '0.35rem' }}>
            <Zap size={13} className="text-blue-600" />
            VYAPAR ADNET SAAS PORTAL • V2.4 ENTERPRISE
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
            Executive Dashboard
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Real-time analytics for earnings, MLM network performance, sales settlements, and rewards.
          </p>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Tuesday Cycle Timer Pill */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <Clock size={16} color="#f59e0b" />
            <div style={{ fontSize: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Next Payout Batch: </span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStats}
            title="Refresh Live Data"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.82rem',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Stripe/SaaS Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #171d31 45%, #1e1b4b 100%)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.45)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #1e293b',
        }}
      >
        {/* Glow decoration */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  color: '#ffffff',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.35)',
                  border: '2px solid rgba(255,255,255,0.2)',
                }}
              >
                {userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '3px solid #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Account Verified"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                  ⭐ {userRank}
                </span>
                <span style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700 }}>
                  ID: {userCode}
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                  ✓ KYC Verified
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.35rem 0 0.15rem 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
                Welcome back, {userName}!
              </h2>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
                {userEmail} • License: <strong>Enterprise Pro Suite</strong> • Sponsor: <strong>Root System</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Commands */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Zap size={16} />
              Request Payout
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-genealogy')}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Users size={16} />
              Genealogy Tree
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('reward-details')}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Award size={16} />
              Rewards
            </button>
          </div>
        </div>

        {/* Live Referral Link Copier Bar inside Hero */}
        <div
          style={{
            marginTop: '1.4rem',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '0.6rem 0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            <Share2 size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Your Sponsor Link:</span>
            <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {referralUrl}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={copyReferralLink}
              style={{
                background: copiedLink ? '#10b981' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s',
              }}
            >
              {copiedLink ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copiedLink ? 'Copied Link!' : 'Copy Link'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-referral')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              QR Card →
            </button>
          </div>
        </div>
      </div>

      {/* 6 SaaS Core KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Total Earnings */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lifetime Earnings
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{kpis.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#16a34a', fontWeight: 700 }}>
            <ArrowUpRight size={14} />
            <span>+18.4% this month</span>
          </div>
        </div>

        {/* KPI 2: Available Commission Balance */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            borderRadius: '14px',
            border: '1px solid #bbf7d0',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Commission Balance
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#bbf7d0', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#14532d', letterSpacing: '-0.02em' }}>
            ₹{kpis.commissionBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600 }}>Ready to withdraw</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              style={{ background: 'none', border: 'none', color: '#15803d', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Withdraw →
            </button>
          </div>
        </div>

        {/* KPI 3: Team Volume (BV) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Network Team Volume
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {kpis.teamVolumeBv.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>BV</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#2563eb', fontWeight: 700 }}>
            <ArrowUpRight size={14} />
            <span>+24.0% Volume Growth</span>
          </div>
        </div>

        {/* KPI 4: Direct Connections */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Direct Referrals
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {kpis.directMembers}{' '}
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
              ({kpis.totalTeamMembers} Team)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#9333ea', fontWeight: 700 }}>
            <span>⚡ 94.2% Active lines</span>
          </div>
        </div>

        {/* KPI 5: Business Points (BP) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Business Points (BP)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {kpis.bpBalance.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>BP</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#d97706', fontWeight: 700 }}>
            <span>⭐ Tier 3 Executive Pass</span>
          </div>
        </div>

        {/* KPI 6: Next Rank Progress */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf4ff 100%)',
            borderRadius: '14px',
            border: '1px solid #f5d0fe',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(217, 70, 239, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#86198f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Next Rank Target
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fae8ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#701a75' }}>
              {kpis.nextRankName}
            </div>
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '7px', background: '#f3e8ff', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${kpis.nextRankProgress}%`, height: '100%', background: 'linear-gradient(90deg, #c026d3, #ec4899)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem', color: '#a21caf', fontWeight: 700 }}>
            <span>{kpis.nextRankProgress}% Completed</span>
            <span>18.2k BV left</span>
          </div>
        </div>
      </div>

      {/* Main SaaS Visualizations: Revenue Area Chart (ApexCharts) & Commission Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Revenue Growth Area Chart Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            flex: '2 1 540px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📈</span> Revenue & Commission Growth
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Direct referral earnings vs team binary matching bonus
              </p>
            </div>

            {/* Time Toggle Pills */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '2px' }}>
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '6m', label: '6M' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartPeriod(t.id)}
                  style={{
                    border: 'none',
                    background: chartPeriod === t.id ? '#ffffff' : 'transparent',
                    color: chartPeriod === t.id ? '#0f172a' : '#64748b',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: chartPeriod === t.id ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: chartPeriod === t.id ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ApexChart Render */}
          <div style={{ minHeight: '310px' }}>
            <Chart
              options={revenueChartOptions}
              series={revenueChartSeries}
              type="area"
              height={310}
            />
          </div>
        </div>

        {/* Commission Streams Donut Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            flex: '1 1 320px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PieIcon size={18} color="#6366f1" /> Commission Streams
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                100% Verified
              </span>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#64748b' }}>
              Breakdown of all 4 active MLM payout channels
            </p>
          </div>

          <div style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={260}
            />
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Top earner: Direct Bonus</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('base-commission')}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
            >
              View Full Commission Ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Fast Operations Command & Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Quick Utilities Hub */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚡ Fast Operations Command
            </h3>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#c7d2fe', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
              Instant Actions
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Wallet size={20} color="#34d399" />
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '0.4rem' }}>Withdraw Cash</div>
              <div style={{ fontSize: '0.72rem', color: '#c7d2fe' }}>Instant IMPS Clearance</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-direct')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <UserCheck size={20} color="#38bdf8" />
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '0.4rem' }}>Direct Team</div>
              <div style={{ fontSize: '0.72rem', color: '#c7d2fe' }}>{kpis.directMembers} Active Referrals</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('reports-sales')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <FileText size={20} color="#fbbf24" />
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '0.4rem' }}>Sales Reports</div>
              <div style={{ fontSize: '0.72rem', color: '#c7d2fe' }}>Audit & Invoice Ledger</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('profile-kyc')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                padding: '0.85rem',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <ShieldCheck size={20} color="#a78bfa" />
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginTop: '0.4rem' }}>KYC Security</div>
              <div style={{ fontSize: '0.72rem', color: '#c7d2fe' }}>Bank & PAN Compliance</div>
            </button>
          </div>
        </div>

        {/* Weekly Network Velocity Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Weekly Network Velocity
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', background: '#f5f3ff', padding: '2px 8px', borderRadius: '10px' }}>
                +14 Today
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Daily downline additions and active team signups
            </p>
          </div>

          <div style={{ minHeight: '180px' }}>
            <Chart
              options={velocityBarOptions}
              series={velocityBarSeries}
              type="bar"
              height={180}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
            <span>Weekly Target: <strong>50 members</strong></span>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ 114% Achieved</span>
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              🏆 Top Team Leaders
            </h3>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-team')}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboard.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: item.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                    {item.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.code} • {item.rank}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>
                    {item.volumeBv.toLocaleString('en-IN')} BV
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>Top Tier</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row: Recent Transactions Table & Real-time Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Transactions Table */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            flex: '2 1 540px',
          }}
        >
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Recent Transactions & Settlements
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                Real-time automated ledger of bonuses, withdrawals, and commissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('payout-history')}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Payouts →
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '0.65rem 1rem' }}>Transaction / ID</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Mode</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Gross</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>Net Disbursed</th>
                  <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>Slip</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn, idx) => (
                  <tr key={txn.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{txn.type}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {txn.id} • {txn.date}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600 }}>
                        {txn.method}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                      ₹{txn.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                        {txn.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTxn(txn)}
                        style={{
                          background: 'none',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity & Notifications Feed */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            flex: '1 1 300px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔔 Real-time Activity Feed
            </h3>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
              Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activityFeed.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', marginTop: '4px', flexShrink: 0 }} />
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
              onClick={() => onNavigate && onNavigate('support-notifications')}
              style={{ width: '100%', padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
            >
              View Full Notification Center →
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTxn && (
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
          onClick={() => setSelectedTxn(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#a3e635', fontWeight: 800 }}>✓ VERIFIED TRANSACTION SLIP</div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 800 }}>{selectedTxn.type}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>TRANSACTION REFERENCE</span>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', fontFamily: 'monospace' }}>{selectedTxn.id}</div>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 800 }}>
                  ✓ {selectedTxn.status?.toUpperCase()}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Date & Time</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedTxn.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Payment Mode</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>{selectedTxn.method}</td>
                  </tr>
                  {selectedTxn.utr && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Bank UTR / Ref</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>{selectedTxn.utr}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0', color: '#64748b' }}>Gross Amount</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>₹{selectedTxn.amount.toFixed(2)}</td>
                  </tr>
                  {selectedTxn.tds > 0 && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
                      <td style={{ padding: '0.5rem 0' }}>TDS Deducted (5% u/s 194H)</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>-₹{selectedTxn.tds.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#f0fdf4' }}>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800, color: '#15803d', fontSize: '0.9rem' }}>Net Amount</td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '1.1rem' }}>₹{selectedTxn.net.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '0.5rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  🖨️ Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  style={{ padding: '0.5rem 1.25rem', background: '#0f172a', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
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

export default DashboardOverview;
