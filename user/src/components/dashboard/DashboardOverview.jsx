import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import {
  TrendingUp,
  Wallet,
  Users,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Copy,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
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
    setTimeout(() => setToastMessage(''), 3000);
  };

  const userCode = data?.user?.userCode || user?.user_code || user?.sponsor_id || 'CB100001';
  const userName = data?.user?.name || user?.name || 'Partner Account';
  const userEmail = data?.user?.email || user?.email || `${userCode}@addnet.com`;
  const userRank = data?.user?.rank || user?.rank || 'Partner Member';
  const kycStatus = data?.user?.kycStatus || user?.kyc_status || 'verified';
  const userInitial = userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const baseUrl = window.location.origin || 'https://addnet.com';
  const referralUrl = `${baseUrl}/register?ref=${userCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast('✓ Referral Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // KPIs with safe numeric defaults
  const kpis = useMemo(() => {
    const raw = data?.kpis || {};
    return {
      totalEarnings: Number(raw.totalEarnings) || 0,
      commissionBalance: Number(raw.commissionBalance) || 0,
      teamVolumeBv: Number(raw.teamVolumeBv) || 0,
      directMembers: Number(raw.directMembers) || 0,
      totalTeamMembers: Number(raw.totalTeamMembers) || 0,
      bpBalance: Number(raw.bpBalance) || 0,
      rewardsClaimedValue: Number(raw.rewardsClaimedValue) || 0,
      nextRankProgress: Number(raw.nextRankProgress) || 0,
      nextRankName: raw.nextRankName || 'Executive Member',
    };
  }, [data]);

  // ApexCharts: Revenue Growth Options & Series
  const revenueChartOptions = useMemo(() => {
    const isMonthly = chartPeriod === '6m';
    const categories = isMonthly
      ? ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6']
      : chartPeriod === '30d'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return {
      chart: {
        type: 'area',
        height: 290,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: 'transparent',
      },
      colors: ['#1E40AF', '#0284C7'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.5 },
      xaxis: {
        categories,
        labels: { style: { colors: '#64748B', fontSize: '11px', fontWeight: 600 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748B', fontSize: '11px', fontWeight: 600 },
          formatter: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
        },
      },
      grid: {
        borderColor: '#E2E8F0',
        strokeDashArray: 4,
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val) => `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      },
    };
  }, [chartPeriod]);

  const revenueChartSeries = useMemo(() => {
    if (chartPeriod === '6m') {
      return [
        { name: 'Direct Referral Bonus', data: [12000, 18500, 24000, 31000, 38000, 45000] },
        { name: 'Binary Team Commissions', data: [8000, 14000, 19500, 26000, 32000, 41000] },
      ];
    }
    if (chartPeriod === '30d') {
      return [
        { name: 'Direct Referral Bonus', data: [4500, 8200, 11400, 16800] },
        { name: 'Binary Team Commissions', data: [3100, 6400, 9100, 13500] },
      ];
    }
    return [
      { name: 'Direct Referral Bonus', data: [800, 1200, 950, 1600, 2100, 1800, 2400] },
      { name: 'Binary Team Commissions', data: [400, 750, 600, 1100, 1400, 1300, 1900] },
    ];
  }, [chartPeriod]);

  // ApexCharts: Commission Breakdown Donut
  const donutChartOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 250,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: 'transparent',
    },
    colors: ['#0B192C', '#1E40AF', '#0284C7', '#D97706'],
    labels: ['Direct Bonus', 'Team Match', 'Leadership Bonus', 'Rewards'],
    legend: {
      position: 'bottom',
      fontSize: '11px',
      fontWeight: 600,
      itemMargin: { horizontal: 6, vertical: 4 },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', color: '#64748B', fontWeight: 600 },
            value: {
              show: true,
              fontSize: '18px',
              fontWeight: 800,
              color: '#0F172A',
              formatter: (val) => `${val}%`,
            },
            total: {
              show: true,
              label: 'Distribution',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748B',
              formatter: () => '100%',
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (val) => `${val}% share` },
    },
  }), []);

  const donutChartSeries = [45, 30, 15, 10];

  // Normalized safe list of transactions
  const recentTransactions = useMemo(() => {
    return (data?.recentTransactions || []).map((t) => ({
      ...t,
      amount: Number(t.amount) || 0,
      net: Number(t.net || t.amount) || 0,
      tds: Number(t.tds) || 0,
    }));
  }, [data]);

  const activityFeed = data?.activityFeed || [];

  // Normalized safe Leaderboard mapper
  const leaderboard = useMemo(() => {
    const raw = data?.leaderboard || [];

    return raw.map((item) => {
      if (Array.isArray(item)) {
        return {
          name: item[0] || 'Member',
          code: item[1] || 'CB100000',
          rank: item[2] || 'Partner',
          volumeBv: Number(item[3]) || 0,
          avatar: item[4] || 'CB',
          color: item[5] || '#1E40AF',
        };
      }
      return {
        name: item.name || 'Member',
        code: item.code || 'CB100000',
        rank: item.rank || 'Partner',
        volumeBv: Number(item.volumeBv ?? item.volume_bv) || 0,
        avatar: item.avatar || (item.name ? item.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CB'),
        color: item.color || '#1E40AF',
      };
    });
  }, [data]);

  return (
    <div className="page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--van-brand-navy)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--van-radius-button)',
            zIndex: 99999,
            boxShadow: 'var(--van-shadow-modal)',
            fontSize: '0.84rem',
            fontWeight: 700,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Header Row with System Title & Sync */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span className="van-badge van-badge-info">Vyapar AdNET Portal</span>
          </div>
          <h1 className="van-h1">Business Executive Dashboard</h1>
          <p className="van-body" style={{ marginTop: '0.15rem' }}>
            Real-time analytics for earnings, network volume, payouts, and reward milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          className="van-btn van-btn-outline van-btn-sm"
          title="Sync live stats"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Corporate Executive Profile Summary Card (Calm Light Surface with Navy / Blue Highlights) */}
      <div className="van-card" style={{ padding: '1.25rem 1.5rem', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="van-avatar" style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
              {userInitial}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="van-badge van-badge-neutral">{userCode}</span>
                <span className="van-badge van-badge-warning">⭐ {userRank}</span>
                <span className="van-badge van-badge-success">✓ KYC {kycStatus}</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0 0.1rem 0', color: 'var(--van-brand-navy)' }}>
                Welcome back, {userName}
              </h2>
              <p className="van-text-xs van-text-muted" style={{ margin: 0 }}>
                {userEmail}
              </p>
            </div>
          </div>

          {/* Quick Action Commands Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="van-btn van-btn-cta van-btn-md"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
            >
              <Wallet size={15} />
              <span>Request Payout</span>
            </button>

            <button
              type="button"
              className="van-btn van-btn-primary van-btn-md"
              onClick={() => onNavigate && onNavigate('network-genealogy')}
            >
              <Users size={15} />
              <span>Genealogy Tree</span>
            </button>

            <button
              type="button"
              className="van-btn van-btn-secondary van-btn-md"
              onClick={() => onNavigate && onNavigate('reward-details')}
            >
              <Award size={15} />
              <span>Rewards</span>
            </button>
          </div>
        </div>

        {/* Live Referral Link Copier Toolbar */}
        <div
          style={{
            marginTop: '1.15rem',
            background: 'var(--van-bg-surface)',
            border: '1px solid var(--van-border-subtle)',
            borderRadius: 'var(--van-radius-button)',
            padding: '0.55rem 0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            <Share2 size={15} color="var(--van-brand-blue)" />
            <span className="van-text-xs van-text-muted van-text-bold">Official Sponsor URL:</span>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--van-brand-navy)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {referralUrl}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`van-btn van-btn-sm ${copiedLink ? 'van-btn-cta' : 'van-btn-primary'}`}
              onClick={copyReferralLink}
            >
              {copiedLink ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              className="van-btn van-btn-sm van-btn-outline"
              onClick={() => onNavigate && onNavigate('network-referral')}
            >
              <span>QR Card →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Lifetime Earnings */}
        <div className="van-stat-card">
          <div className="van-stat-header">
            <span className="van-stat-label">Lifetime Earnings</span>
            <div className="van-stat-icon-wrapper">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="van-stat-value">
            ₹{kpis.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="van-stat-footer">
            <span className="van-badge van-badge-success">Cumulative Total</span>
          </div>
        </div>

        {/* KPI 2: Available Commission Balance */}
        <div className="van-stat-card" style={{ borderLeft: '3px solid var(--van-brand-blue)' }}>
          <div className="van-stat-header">
            <span className="van-stat-label" style={{ color: 'var(--van-brand-blue)' }}>Commission Balance</span>
            <div className="van-stat-icon-wrapper" style={{ color: 'var(--van-brand-blue)' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div className="van-stat-value" style={{ color: 'var(--van-brand-navy)' }}>
            ₹{kpis.commissionBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="van-stat-footer" style={{ justifyContent: 'space-between' }}>
            <span className="van-text-xs van-text-muted">Available to withdraw</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              style={{ background: 'none', border: 'none', color: 'var(--van-brand-blue)', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}
            >
              Withdraw →
            </button>
          </div>
        </div>

        {/* KPI 3: Team Volume (BV) */}
        <div className="van-stat-card">
          <div className="van-stat-header">
            <span className="van-stat-label">Network Volume</span>
            <div className="van-stat-icon-wrapper">
              <BarChart3 size={16} />
            </div>
          </div>
          <div className="van-stat-value">
            {kpis.teamVolumeBv.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.85rem', color: 'var(--van-text-muted)', fontWeight: 600 }}>BV</span>
          </div>
          <div className="van-stat-footer">
            <span className="van-badge van-badge-info">Business Volume</span>
          </div>
        </div>

        {/* KPI 4: Direct Referrals */}
        <div className="van-stat-card">
          <div className="van-stat-header">
            <span className="van-stat-label">Direct Referrals</span>
            <div className="van-stat-icon-wrapper">
              <Users size={16} />
            </div>
          </div>
          <div className="van-stat-value">
            {kpis.directMembers}{' '}
            <span style={{ fontSize: '0.82rem', color: 'var(--van-text-muted)', fontWeight: 500 }}>
              ({kpis.totalTeamMembers} Team)
            </span>
          </div>
          <div className="van-stat-footer">
            <span className="van-text-xs van-text-muted">Direct Sponsees</span>
          </div>
        </div>

        {/* KPI 5: Business Points (BP) */}
        <div className="van-stat-card">
          <div className="van-stat-header">
            <span className="van-stat-label">Business Points</span>
            <div className="van-stat-icon-wrapper">
              <Zap size={16} />
            </div>
          </div>
          <div className="van-stat-value">
            {kpis.bpBalance.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.85rem', color: 'var(--van-text-muted)', fontWeight: 600 }}>BP</span>
          </div>
          <div className="van-stat-footer">
            <span className="van-badge van-badge-warning">Accumulated BP</span>
          </div>
        </div>

        {/* KPI 6: Next Rank Target */}
        <div className="van-stat-card">
          <div className="van-stat-header">
            <span className="van-stat-label">Next Target</span>
            <div className="van-stat-icon-wrapper">
              <Award size={16} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--van-brand-navy)' }}>
              {kpis.nextRankName}
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--van-bg-surface)', borderRadius: '3px', marginTop: '0.4rem', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, kpis.nextRankProgress)}%`, height: '100%', background: 'var(--van-btn-gradient-cta)', borderRadius: '3px' }} />
            </div>
          </div>
          <div className="van-stat-footer">
            <span className="van-text-xs van-text-muted">{kpis.nextRankProgress}% Completed</span>
          </div>
        </div>
      </div>

      {/* Main Visualizations: Revenue Area Chart (ApexCharts) & Commission Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Revenue Growth Area Chart Card */}
        <div className="van-card" style={{ flex: '2 1 540px' }}>
          <div className="van-card-header">
            <div>
              <h3 className="van-card-title">
                <span>📈 Revenue & Commission Growth</span>
              </h3>
              <p className="van-card-subtitle">
                Direct referral earnings vs team binary matching bonus
              </p>
            </div>

            {/* Time Toggle Pills */}
            <div style={{ display: 'flex', background: 'var(--van-bg-surface)', padding: '2px', borderRadius: 'var(--van-radius-input)', gap: '2px', border: '1px solid var(--van-border-subtle)' }}>
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
                    color: chartPeriod === t.id ? 'var(--van-brand-navy)' : 'var(--van-text-muted)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    fontWeight: chartPeriod === t.id ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: chartPeriod === t.id ? 'var(--van-shadow-xs)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="van-card-body" style={{ minHeight: '300px' }}>
            <Chart
              options={revenueChartOptions}
              series={revenueChartSeries}
              type="area"
              height={290}
            />
          </div>
        </div>

        {/* Commission Streams Donut Card */}
        <div className="van-card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column' }}>
          <div className="van-card-header">
            <div>
              <h3 className="van-card-title">
                <PieIcon size={16} color="var(--van-brand-blue)" />
                <span>Commission Streams</span>
              </h3>
              <p className="van-card-subtitle">
                Channel breakdown of earnings
              </p>
            </div>
          </div>

          <div className="van-card-body" style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Chart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={250}
            />
          </div>

          <div className="van-card-footer">
            <span className="van-text-xs van-text-muted">Channel: Direct + Team Matching</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('base-commission')}
              style={{ background: 'none', border: 'none', color: 'var(--van-brand-blue)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Commission Ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Row: Quick Links & Top Team Leaders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Quick Utilities Hub */}
        <div className="van-card">
          <div className="van-card-header">
            <h3 className="van-card-title">
              <span>⚡ Fast Navigation</span>
            </h3>
          </div>

          <div className="van-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className="van-btn van-btn-outline van-btn-md"
              style={{ justifyContent: 'flex-start', height: 'auto', padding: '0.75rem' }}
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
            >
              <Wallet size={18} color="var(--van-brand-blue)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Withdraw</div>
                <div className="van-text-xs van-text-muted">Payout Request</div>
              </div>
            </button>

            <button
              type="button"
              className="van-btn van-btn-outline van-btn-md"
              style={{ justifyContent: 'flex-start', height: 'auto', padding: '0.75rem' }}
              onClick={() => onNavigate && onNavigate('network-direct')}
            >
              <UserCheck size={18} color="var(--van-brand-cyan)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Direct Team</div>
                <div className="van-text-xs van-text-muted">{kpis.directMembers} Members</div>
              </div>
            </button>

            <button
              type="button"
              className="van-btn van-btn-outline van-btn-md"
              style={{ justifyContent: 'flex-start', height: 'auto', padding: '0.75rem' }}
              onClick={() => onNavigate && onNavigate('reports-sales')}
            >
              <FileText size={18} color="var(--van-accent-amber)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Sales Reports</div>
                <div className="van-text-xs van-text-muted">Audit & Invoices</div>
              </div>
            </button>

            <button
              type="button"
              className="van-btn van-btn-outline van-btn-md"
              style={{ justifyContent: 'flex-start', height: 'auto', padding: '0.75rem' }}
              onClick={() => onNavigate && onNavigate('profile-kyc')}
            >
              <ShieldCheck size={18} color="var(--van-brand-navy)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>KYC Security</div>
                <div className="van-text-xs van-text-muted">Verification</div>
              </div>
            </button>
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="van-card">
          <div className="van-card-header">
            <h3 className="van-card-title">
              <span>🏆 Top Team Leaders</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-team')}
              style={{ background: 'none', border: 'none', color: 'var(--van-brand-blue)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <div className="van-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--van-text-muted)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🏆</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--van-text-primary)' }}>No leader rankings yet</div>
                <div className="van-text-xs">Top performers will appear here once network volume generates.</div>
              </div>
            ) : (
              leaderboard.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--van-border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: item.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.74rem' }}>
                    {item.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--van-text-primary)' }}>{item.name}</div>
                    <div className="van-text-xs van-text-muted">{item.code} • {item.rank}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--van-text-primary)' }}>
                    {item.volumeBv.toLocaleString('en-IN')} BV
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row: Recent Transactions Table & Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Transactions Table */}
        <div className="van-card" style={{ flex: '2 1 540px' }}>
          <div className="van-card-header">
            <div>
              <h3 className="van-card-title">
                <span>Recent Transactions & Settlements</span>
              </h3>
              <p className="van-card-subtitle">
                Automated ledger of bonuses, withdrawals, and commissions
              </p>
            </div>
            <button
              type="button"
              className="van-btn van-btn-sm van-btn-outline"
              onClick={() => onNavigate && onNavigate('payout-history')}
            >
              All Payouts →
            </button>
          </div>

          <div className="van-table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="van-table">
              <thead>
                <tr>
                  <th>Transaction / ID</th>
                  <th>Mode</th>
                  <th className="van-table-num">Gross</th>
                  <th className="van-table-num">Net</th>
                  <th>Status</th>
                  <th className="van-table-center">Slip</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--van-text-muted)' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>💳</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--van-text-primary)' }}>No recent transactions</div>
                      <div className="van-text-xs">Payout requests and commission credits will appear here once processed.</div>
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((txn, idx) => (
                  <tr key={txn.id || idx}>
                    <td>
                      <div className="van-table-cell-bold">{txn.type}</div>
                      <div className="van-text-xs van-text-muted" style={{ fontFamily: 'monospace' }}>
                        {txn.id} • {txn.date}
                      </div>
                    </td>
                    <td>
                      <span className="van-badge van-badge-neutral">{txn.method}</span>
                    </td>
                    <td className="van-table-num">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="van-table-num" style={{ fontWeight: 700, color: 'var(--van-status-success-text)' }}>
                      ₹{txn.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="van-badge van-badge-success">{txn.status}</span>
                    </td>
                    <td className="van-table-center">
                      <button
                        type="button"
                        className="van-btn van-btn-sm van-btn-outline"
                        onClick={() => setSelectedTxn(txn)}
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="van-card" style={{ flex: '1 1 300px' }}>
          <div className="van-card-header">
            <h3 className="van-card-title">
              <span>🔔 Real-time Activity</span>
            </h3>
            <span className="van-badge van-badge-success">Live</span>
          </div>

          <div className="van-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {activityFeed.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--van-text-muted)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🔔</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--van-text-primary)' }}>No recent activity</div>
                <div className="van-text-xs">System notices and network updates will stream here.</div>
              </div>
            ) : (
              activityFeed.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '0.65rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--van-brand-blue)', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--van-text-primary)' }}>{act.title}</div>
                  <div className="van-text-xs van-text-muted" style={{ marginTop: '0.1rem' }}>{act.desc}</div>
                  <div className="van-text-xs van-text-muted" style={{ marginTop: '0.15rem' }}>{act.time}</div>
                </div>
              </div>
              ))
            )}
          </div>

          <div className="van-card-footer">
            <button
              type="button"
              className="van-btn van-btn-outline van-btn-sm van-btn-block"
              onClick={() => onNavigate && onNavigate('support-notifications')}
            >
              Notification Center →
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTxn && (
        <div className="van-modal-backdrop" onClick={() => setSelectedTxn(null)}>
          <div className="van-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="van-modal-header">
              <div>
                <span className="van-badge van-badge-success" style={{ marginBottom: '0.2rem' }}>VERIFIED SLIP</span>
                <h3 className="van-modal-title">{selectedTxn.type}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--van-text-muted)', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div className="van-modal-body">
              <div style={{ background: 'var(--van-bg-surface)', borderRadius: 'var(--van-radius-input)', padding: '0.75rem', border: '1px solid var(--van-border-subtle)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="van-text-xs van-text-muted">REFERENCE</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', color: 'var(--van-brand-navy)' }}>{selectedTxn.id}</div>
                </div>
                <span className="van-badge van-badge-success">{selectedTxn.status?.toUpperCase()}</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--van-border-subtle)' }}>
                    <td style={{ padding: '0.45rem 0', color: 'var(--van-text-muted)' }}>Date</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600 }}>{selectedTxn.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--van-border-subtle)' }}>
                    <td style={{ padding: '0.45rem 0', color: 'var(--van-text-muted)' }}>Payment Mode</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600 }}>{selectedTxn.method}</td>
                  </tr>
                  {selectedTxn.utr && (
                    <tr style={{ borderBottom: '1px solid var(--van-border-subtle)' }}>
                      <td style={{ padding: '0.45rem 0', color: 'var(--van-text-muted)' }}>Bank UTR / Ref</td>
                      <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{selectedTxn.utr}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: '1px solid var(--van-border-subtle)' }}>
                    <td style={{ padding: '0.45rem 0', color: 'var(--van-text-muted)' }}>Gross Amount</td>
                    <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600 }}>₹{selectedTxn.amount.toFixed(2)}</td>
                  </tr>
                  {selectedTxn.tds > 0 && (
                    <tr style={{ borderBottom: '1px solid var(--van-border-subtle)', color: 'var(--van-status-error-text)' }}>
                      <td style={{ padding: '0.45rem 0' }}>TDS Deducted (5% u/s 194H)</td>
                      <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 600 }}>-₹{selectedTxn.tds.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ background: 'var(--van-status-success-bg)' }}>
                    <td style={{ padding: '0.65rem 0.5rem', fontWeight: 800, color: 'var(--van-status-success-text)' }}>Net Amount</td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: 800, color: 'var(--van-status-success-text)', fontSize: '1rem' }}>₹{selectedTxn.net.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="van-modal-footer">
              <button
                type="button"
                className="van-btn van-btn-sm van-btn-outline"
                onClick={() => window.print()}
              >
                🖨️ Print
              </button>
              <button
                type="button"
                className="van-btn van-btn-sm van-btn-primary"
                onClick={() => setSelectedTxn(null)}
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

export default DashboardOverview;
