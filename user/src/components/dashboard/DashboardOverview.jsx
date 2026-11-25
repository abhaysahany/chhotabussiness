import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import {
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
  Bell,
  TrendingUp,
} from 'lucide-react';
import { getDashboardStats } from '../../api/userService';
import { getUserDiamondRewards } from '../../api/userRewardService';

function DashboardOverview({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [diamondBalance, setDiamondBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7d'); // '7d' | '30d' | '6m'
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Fetch Dashboard Stats from Backend API
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [res, diamondRes] = await Promise.all([
        getDashboardStats(chartPeriod),
        getUserDiamondRewards(),
      ]);
      if (res && res.status === 'success') {
        setData(res);
      }
      if (diamondRes?.wallet?.diamond_balance !== undefined) {
        setDiamondBalance(Number(diamondRes.wallet.diamond_balance) || 0);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, chartPeriod]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const userCode = data?.user?.userCode || user?.user_code || user?.sponsor_id || '';
  const userName = data?.user?.name || user?.name || '';
  const userEmail = data?.user?.email || user?.email || '';
  const userRank = data?.user?.rank || user?.rank || 'Member';
  const kycStatus = data?.user?.kycStatus || user?.kyc_status || 'unverified';
  const userInitial = userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const userAvatarUrl = user?.avatar_url || user?.avatar || null;

  const baseUrl = window.location.origin || 'https://addnet.com';
  const referralUrl = `${baseUrl}/register?ref=${userCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast('✓ Referral Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // KPIs with safe numeric defaults (Including Dynamic Income Tables Integration)
  const kpis = useMemo(() => {
    const raw = data?.kpis || {};
    const incomeStats = data?.incomeStats || {};
    return {
      todayIncome: Number(raw.todayIncome ?? incomeStats.todayIncome ?? data?.todayIncome) || 0,
      totalIncome: Number(raw.totalIncome ?? incomeStats.totalIncome ?? data?.totalIncome ?? raw.totalEarnings) || 0,
      directIncome: Number(raw.directIncome ?? incomeStats.directIncome ?? data?.directIncome) || 0,
      levelIncome: Number(raw.levelIncome ?? incomeStats.levelIncome ?? data?.levelIncome) || 0,
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
    const categories = data?.charts?.revenue?.categories || [];

    return {
      chart: {
        type: 'area',
        height: 290,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: 'transparent',
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 6,
          color: '#2563EB',
          opacity: 0.16,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      colors: ['#2563EB', '#06B6D4'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.42,
          opacityTo: 0.04,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2.8 },
      xaxis: {
        categories,
        labels: { style: { colors: '#64748B', fontSize: '11px', fontWeight: 600 } },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: {
          show: true,
          stroke: { color: '#CBD5E1', width: 1, dashArray: 4 },
        },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          style: { colors: '#64748B', fontSize: '11px', fontWeight: 600 },
          formatter: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : Math.round(val)}`,
        },
      },
      grid: {
        borderColor: '#F1F5F9',
        strokeDashArray: 4,
        padding: { top: 0, right: 12, bottom: 0, left: 10 },
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '11px',
        fontWeight: 700,
        markers: { radius: 12, width: 10, height: 10 },
        itemMargin: { horizontal: 12, vertical: 6 },
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      },
    };
  }, [chartPeriod, data]);

  const revenueChartSeries = useMemo(() => {
    return data?.charts?.revenue?.series || [];
  }, [data]);

  // Check if user has active commission earnings
  const hasCommissionData = useMemo(() => {
    const s = data?.charts?.distribution?.series;
    return Array.isArray(s) && s.some((v) => Number(v) > 0);
  }, [data]);

  // ApexCharts: Commission Breakdown Donut
  const donutChartOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 250,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: 'transparent',
      dropShadow: {
        enabled: hasCommissionData,
        top: 2,
        left: 0,
        blur: 6,
        color: '#0F172A',
        opacity: 0.12,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    colors: hasCommissionData
      ? ['#0B192C', '#2563EB', '#06B6D4', '#F59E0B']
      : ['#E2E8F0'],
    labels: hasCommissionData
      ? (data?.charts?.distribution?.labels || ['Direct Bonus', 'Team Match', 'Leadership Bonus', 'Rewards'])
      : ['No Earnings Recorded'],
    legend: {
      show: hasCommissionData,
      position: 'bottom',
      fontSize: '11px',
      fontWeight: 600,
      itemMargin: { horizontal: 8, vertical: 4 },
      markers: { radius: 12 },
    },
    dataLabels: { enabled: false },
    stroke: {
      width: hasCommissionData ? 2 : 1,
      colors: ['#FFFFFF'],
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '11px',
              color: '#64748B',
              fontWeight: 600,
              offsetY: -4,
            },
            value: {
              show: true,
              fontSize: '18px',
              fontWeight: 800,
              color: '#0F172A',
              offsetY: 4,
              formatter: (val) => (hasCommissionData ? `${val}%` : '₹0.00'),
            },
            total: {
              show: true,
              label: hasCommissionData ? 'Distribution' : 'Total Earned',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748B',
              formatter: () => (hasCommissionData ? '100%' : '₹0.00'),
            },
          },
        },
      },
    },
    tooltip: {
      enabled: hasCommissionData,
      theme: 'light',
      y: { formatter: (val) => `${val}% share` },
    },
  }), [hasCommissionData, data]);

  const donutChartSeries = useMemo(() => {
    if (hasCommissionData) {
      return data?.charts?.distribution?.series || [0, 0, 0, 0];
    }
    return [100]; // Clean single ring placeholder
  }, [hasCommissionData, data]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '0.4rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
            <span className="van-badge-portal-3d">
              <span className="van-badge-portal-dot" />
              <span>Vyapar AdNET Portal</span>
            </span>
          </div>
          <h1 className="van-h1" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Business Executive Dashboard
          </h1>
          <p className="van-body" style={{ marginTop: '0.35rem', color: '#64748B', fontSize: '0.88rem' }}>
            Real-time analytics for earnings, network volume, payouts, and reward milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStats}
          className="van-btn-sync-3d"
          title="Sync live stats"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Corporate Executive Profile Summary Card (Spacious 3D Banner) */}
      <div className="van-executive-banner">
        {/* Top Profile & Command Tier */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.75rem' }}>
          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', minWidth: 0 }}>
            <div className="van-avatar-hero-container">
              <div className="van-avatar-hero-ring">
                <div className="van-avatar-hero-inner">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              {/* Primary Greeting */}
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--van-brand-navy)', letterSpacing: '-0.025em' }}>
                Welcome back, {userName}
              </h2>

              {/* Meta: Email & Member ID with comfortable spacing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748B' }}>
                  {userEmail}
                </span>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--van-brand-navy)', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '0.15rem 0.55rem', borderRadius: '6px' }}>
                  ID: {userCode}
                </span>
              </div>

              {/* Badges Row - Clean and Uncrowded */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span className="van-badge-3d van-badge-3d-rank" style={{ fontSize: '0.74rem', padding: '0.28rem 0.75rem' }}>
                  <span>⭐</span>
                  <span>{userRank}</span>
                </span>
                <span
                  className={`van-badge-3d ${kycStatus === 'verified' ? 'van-badge-3d-kyc-verified' : 'van-badge-3d-kyc-unverified'}`}
                  style={{ fontSize: '0.74rem', padding: '0.28rem 0.75rem' }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: kycStatus === 'verified' ? '#10B981' : '#F59E0B' }} />
                  <span>KYC {kycStatus}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Commands Toolbar — Shifted to align with Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <button
              type="button"
              className="van-btn-action-3d van-btn-action-amber"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              title="Request a withdrawal to your bank"
            >
              <Wallet size={14} />
              <span>Request Payout</span>
            </button>

            <button
              type="button"
              className="van-btn-action-3d van-btn-action-navy"
              onClick={() => onNavigate && onNavigate('network-genealogy')}
              title="Explore team network and binary tree"
            >
              <Users size={14} />
              <span>Genealogy Tree</span>
            </button>

            <button
              type="button"
              className="van-btn-action-3d van-btn-action-blue"
              onClick={() => onNavigate && onNavigate('reward-details')}
              title="Check milestone badges & car/house rewards"
            >
              <Award size={14} />
              <span>Rewards</span>
            </button>
          </div>
        </div>

        {/* Live Referral Link Copier Toolbar — Spacious Two-Column Layout */}
        <div className="van-sponsor-hub-3d">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 'min(100%, 240px)' }}>
            <div className="van-share-3d-badge" title="Official Referral Sponsor Link">
              <Share2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--van-brand-navy)', letterSpacing: '-0.01em' }}>
                Official Sponsor URL
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.1rem' }}>
                Share your invite link to earn direct bonus commissions
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: 'min(100%, 260px)' }}>
            <div className="van-sponsor-url-container">
              <span className="van-sponsor-dot-live" title="Active Sponsor Link" />
              <span className="van-sponsor-url-text">
                {referralUrl}
              </span>
            </div>

            <button
              type="button"
              className={`van-sponsor-copy-btn ${copiedLink ? 'copied' : 'default'}`}
              onClick={copyReferralLink}
            >
              {copiedLink ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              className="van-sponsor-qr-btn"
              onClick={() => onNavigate && onNavigate('network-referral')}
            >
              <span>QR Card →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Member Income Cards (Direct & Level Tables Integration) */}
      <div style={{ marginTop: '1.85rem', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="van-chart-badge-3d van-chart-badge-blue" style={{ width: '38px', height: '38px', borderRadius: '11px' }}>
              <TrendingUp size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--van-brand-navy)', margin: 0, letterSpacing: '-0.02em' }}>
                  Member Income Summary
                </h3>
                <span className="van-badge-portal-3d" style={{ padding: '0.18rem 0.55rem', fontSize: '0.7rem' }}>
                  <span className="van-badge-portal-dot" style={{ background: '#10B981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.35)' }} />
                  <span>Dynamic Real-Time</span>
                </span>
              </div>
              <p className="van-text-xs van-text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>
                Real-time income calculations streaming directly from your Direct and Level ledger records.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="van-btn-sync-3d"
            onClick={() => onNavigate && onNavigate('direct-income')}
            title="Open comprehensive direct income report"
          >
            <span>View Direct Income →</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Income Card 1: Today's Income */}
          <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #10b981' }}>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#047857' }}>Today's Income</span>
              <div className="van-3d-kpi-icon van-3d-icon-emerald">
                <Zap size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#065f46' }}>
              ₹{kpis.todayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="van-stat-card-bottom">
              <span className="van-card-badge-pill emerald">
                ● Daily Payout
              </span>
              <button
                type="button"
                className="van-card-action-pill"
                onClick={() => onNavigate && onNavigate('direct-income')}
                style={{ color: '#047857' }}
              >
                <span>Details →</span>
              </button>
            </div>
          </div>

          {/* Income Card 2: Total Income */}
          <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #1e40af' }}>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#1e40af' }}>Total Income</span>
              <div className="van-3d-kpi-icon van-3d-icon-blue">
                <Wallet size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#1e3a8a' }}>
              ₹{kpis.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="van-stat-card-bottom">
              <span className="van-card-badge-pill blue">
                Direct + Level
              </span>
              <button
                type="button"
                className="van-card-action-pill"
                onClick={() => onNavigate && onNavigate('direct-income')}
                style={{ color: '#1e40af' }}
              >
                <span>Ledger →</span>
              </button>
            </div>
          </div>

          {/* Income Card 3: Direct Income */}
          <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #0284c7' }}>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#0284c7' }}>Direct Income</span>
              <div className="van-3d-kpi-icon van-3d-icon-cyan">
                <Users size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#0369a1' }}>
              ₹{kpis.directIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="van-stat-card-bottom">
              <span className="van-card-badge-pill cyan">
                40% Sponsor Cut
              </span>
              <button
                type="button"
                className="van-card-action-pill"
                onClick={() => onNavigate && onNavigate('income-direct')}
                style={{ color: '#0284c7' }}
              >
                <span>Table →</span>
              </button>
            </div>
          </div>

          {/* Income Card 4: Level Income */}
          <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #7c3aed' }}>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#7c3aed' }}>Level Income</span>
              <div className="van-3d-kpi-icon van-3d-icon-purple">
                <BarChart3 size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#6d28d9' }}>
              ₹{kpis.levelIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="van-stat-card-bottom">
              <span className="van-card-badge-pill purple">
                Levels 2–5 Team
              </span>
              <button
                type="button"
                className="van-card-action-pill"
                onClick={() => onNavigate && onNavigate('income-levels')}
                style={{ color: '#7c3aed' }}
              >
                <span>Table →</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
        {/* Core KPI 1: Available Wallet Balance */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #0284c7' }}>
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#0284c7' }}>Wallet Balance</span>
            <div className="van-3d-kpi-icon van-3d-icon-sky">
              <Wallet size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#0c4a6e' }}>
            ₹{kpis.commissionBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="van-stat-card-bottom">
            <span className="van-card-badge-pill sky">
              Withdrawable
            </span>
            <button
              type="button"
              className="van-card-action-pill"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              style={{ color: '#0284c7' }}
            >
              <span>Withdraw →</span>
            </button>
          </div>
        </div>

        {/* Core KPI 2: Group Network Volume (BV) */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #4f46e5' }}>
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#4f46e5' }}>Network Volume</span>
            <div className="van-3d-kpi-icon van-3d-icon-indigo">
              <BarChart3 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#312e81' }}>
            <span>{kpis.teamVolumeBv.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>BV</span>
          </div>
          <div className="van-stat-card-bottom">
            <span className="van-card-badge-pill indigo">
              Downline Team BV
            </span>
            <button
              type="button"
              className="van-card-action-pill"
              onClick={() => onNavigate && onNavigate('network-genealogy')}
              style={{ color: '#4f46e5' }}
            >
              <span>Tree →</span>
            </button>
          </div>
        </div>

        {/* Core KPI 3: Direct Referrals */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #0d9488' }}>
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#0d9488' }}>Direct Referrals</span>
            <div className="van-3d-kpi-icon van-3d-icon-teal">
              <Users size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#134e4a' }}>
            <span>{kpis.directMembers}</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>({kpis.totalTeamMembers} Team)</span>
          </div>
          <div className="van-stat-card-bottom">
            <span className="van-card-badge-pill teal">
              Direct Sponsees
            </span>
            <button
              type="button"
              className="van-card-action-pill"
              onClick={() => onNavigate && onNavigate('network-direct')}
              style={{ color: '#0d9488' }}
            >
              <span>Team →</span>
            </button>
          </div>
        </div>

        {/* Core KPI 4: Diamond Balance */}
        <div className="van-stat-card-premium" style={{ borderTop: '3.5px solid #d97706' }}>
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#d97706' }}>Diamond Balance</span>
            <div className="van-3d-kpi-icon van-3d-icon-amber">
              <Zap size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#78350f' }}>
            <span>{diamondBalance.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '0.9rem', color: '#d97706' }}>💎</span>
          </div>
          <div className="van-stat-card-bottom">
            <span className="van-card-badge-pill amber">
              Reward Points
            </span>
            <button
              type="button"
              className="van-card-action-pill"
              onClick={() => onNavigate && onNavigate('reward-details')}
              style={{ color: '#d97706' }}
            >
              <span>Rewards →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualizations: Revenue Area Chart (ApexCharts) & Commission Distribution */}
      <div className="van-charts-grid-3d">
        {/* Revenue Growth Area Chart Card */}
        <div className="van-chart-card-3d">
          <div className="van-chart-header-3d">
            <div className="van-chart-title-group">
              <div className="van-chart-badge-3d van-chart-badge-blue">
                <BarChart3 size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="van-chart-heading">
                  Revenue & Commission Growth
                </h3>
                <p className="van-chart-subheading">
                  Direct referral earnings vs team binary matching bonus
                </p>
              </div>
            </div>

            {/* 3D Time Period Toggle Pills */}
            <div className="van-chart-period-group">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '6m', label: '6M' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartPeriod(t.id)}
                  className={`van-chart-period-btn ${chartPeriod === t.id ? 'active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="van-chart-body-3d">
            <Chart
              options={revenueChartOptions}
              series={revenueChartSeries}
              type="area"
              height={290}
            />
          </div>
        </div>

        {/* Commission Streams Donut Card */}
        <div className="van-chart-card-3d">
          <div className="van-chart-header-3d">
            <div className="van-chart-title-group">
              <div className="van-chart-badge-3d van-chart-badge-cyan">
                <PieIcon size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="van-chart-heading">
                  Commission Streams
                </h3>
                <p className="van-chart-subheading">
                  Channel breakdown of earnings
                </p>
              </div>
            </div>
          </div>

          <div className="van-chart-body-3d" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Chart
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height={250}
            />
          </div>

          <div className="van-chart-footer-3d">
            <span className="van-text-xs van-text-muted" style={{ fontWeight: 600 }}>
              Channel: Direct + Team Matching
            </span>
            <button
              type="button"
              className="van-action-link-3d"
              onClick={() => onNavigate && onNavigate('base-commission')}
              style={{ color: 'var(--van-brand-blue)' }}
            >
              <span>Commission Ledger →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row: Quick Links & Top Team Leaders */}
      <div className="van-utilities-grid-3d">
        {/* Quick Utilities Hub */}
        <div className="van-chart-card-3d">
          <div className="van-chart-header-3d">
            <div className="van-chart-title-group">
              <div className="van-chart-badge-3d van-chart-badge-amber">
                <Zap size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="van-chart-heading">
                  Fast Navigation
                </h3>
                <p className="van-chart-subheading">
                  Instant access to critical operations
                </p>
              </div>
            </div>
          </div>

          <div className="van-fast-nav-grid-3d">
            <button
              type="button"
              className="van-fast-action-card-3d"
              onClick={() => onNavigate && onNavigate('payout-withdraw')}
              title="Request a payout withdrawal"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                <div className="van-fast-icon-hero van-3d-icon-blue">
                  <Wallet size={20} strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--van-brand-navy)', marginBottom: '0.15rem' }}>
                    Withdraw
                  </div>
                  <div className="van-text-xs van-text-muted" style={{ marginBottom: '0.35rem' }}>
                    Payout Request
                  </div>
                  <span className="van-badge-3d" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                    Instant Payout
                  </span>
                </div>
              </div>
              <div className="van-fast-arrow-chip">
                <ArrowUpRight size={15} strokeWidth={2.4} />
              </div>
            </button>

            <button
              type="button"
              className="van-fast-action-card-3d"
              onClick={() => onNavigate && onNavigate('network-direct')}
              title="View your direct downline members"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                <div className="van-fast-icon-hero van-3d-icon-cyan">
                  <UserCheck size={20} strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--van-brand-navy)', marginBottom: '0.15rem' }}>
                    Direct Team
                  </div>
                  <div className="van-text-xs van-text-muted" style={{ marginBottom: '0.35rem' }}>
                    {kpis.directMembers} Active Members
                  </div>
                  <span className="van-badge-3d" style={{ background: '#ECFEFF', border: '1px solid #A5F3FC', color: '#0E7490', fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                    Network Tree
                  </span>
                </div>
              </div>
              <div className="van-fast-arrow-chip">
                <ArrowUpRight size={15} strokeWidth={2.4} />
              </div>
            </button>

            <button
              type="button"
              className="van-fast-action-card-3d"
              onClick={() => onNavigate && onNavigate('reports-sales')}
              title="Audit reports and invoices"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                <div className="van-fast-icon-hero van-3d-icon-amber">
                  <FileText size={20} strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--van-brand-navy)', marginBottom: '0.15rem' }}>
                    Sales Reports
                  </div>
                  <div className="van-text-xs van-text-muted" style={{ marginBottom: '0.35rem' }}>
                    Audit & Invoices
                  </div>
                  <span className="van-badge-3d" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                    Ledger & GST
                  </span>
                </div>
              </div>
              <div className="van-fast-arrow-chip">
                <ArrowUpRight size={15} strokeWidth={2.4} />
              </div>
            </button>

            <button
              type="button"
              className="van-fast-action-card-3d"
              onClick={() => onNavigate && onNavigate('profile-kyc')}
              title="Verify KYC and bank credentials"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', minWidth: 0 }}>
                <div className="van-fast-icon-hero van-3d-icon-navy">
                  <ShieldCheck size={20} strokeWidth={2.4} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--van-brand-navy)', marginBottom: '0.15rem' }}>
                    KYC Security
                  </div>
                  <div className="van-text-xs van-text-muted" style={{ marginBottom: '0.35rem' }}>
                    Verification Center
                  </div>
                  <span className="van-badge-3d" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#334155', fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                    Bank & Aadhaar
                  </span>
                </div>
              </div>
              <div className="van-fast-arrow-chip">
                <ArrowUpRight size={15} strokeWidth={2.4} />
              </div>
            </button>
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="van-chart-card-3d">
          <div className="van-chart-header-3d">
            <div className="van-chart-title-group">
              <div className="van-chart-badge-3d van-chart-badge-gold">
                <Award size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="van-chart-heading">
                  Top Team Leaders
                </h3>
                <p className="van-chart-subheading">
                  Highest network volume performers
                </p>
              </div>
            </div>
            <button
              type="button"
              className="van-action-link-3d"
              onClick={() => onNavigate && onNavigate('network-team')}
              style={{ color: 'var(--van-brand-blue)' }}
            >
              <span>View All →</span>
            </button>
          </div>

          <div className="van-leaders-list-3d">
            {leaderboard.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--van-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🏆</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--van-brand-navy)' }}>No leader rankings yet</div>
                <div className="van-text-xs" style={{ marginTop: '0.2rem' }}>Top performers will appear here once network volume generates.</div>
              </div>
            ) : (
              leaderboard.map((item, idx) => {
                const rankClass = idx === 0 ? 'van-leader-rank-1' : idx === 1 ? 'van-leader-rank-2' : idx === 2 ? 'van-leader-rank-3' : 'van-leader-rank-other';
                return (
                  <div key={idx} className="van-leader-row-3d">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div className={`van-leader-rank-badge ${rankClass}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>
                      <div
                        className="van-leader-avatar-3d"
                        style={{ background: item.color || '#1E40AF' }}
                      >
                        {item.avatar}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--van-brand-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div className="van-text-xs van-text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.code}</span>
                          <span>•</span>
                          <span>⭐ {item.rank}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="van-leader-volume-chip">
                        <span>{item.volumeBv.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>BV</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row: Recent Transactions Table & Activity Feed */}
      <div className="van-tables-grid-3d">
        {/* Recent Transactions Table Card */}
        <div className="van-chart-card-3d">
          <div className="van-chart-header-3d">
            <div className="van-chart-title-group">
              <div className="van-chart-badge-3d van-chart-badge-blue">
                <FileText size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="van-chart-heading">
                  Recent Transactions & Settlements
                </h3>
                <p className="van-chart-subheading">
                  Automated ledger of bonuses, withdrawals, and commissions
                </p>
              </div>
            </div>
            <button
              type="button"
              className="van-action-link-3d"
              onClick={() => onNavigate && onNavigate('payout-history')}
              style={{ color: 'var(--van-brand-blue)', whiteSpace: 'nowrap' }}
            >
              <span>All Payouts →</span>
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {recentTransactions.length === 0 ? (
              <div style={{ padding: '3.2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div className="van-3d-empty-icon-badge van-3d-icon-blue" style={{ width: '56px', height: '56px', borderRadius: '16px', marginBottom: '1rem' }}>
                  <Wallet size={26} strokeWidth={2.2} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--van-brand-navy)', marginBottom: '0.25rem' }}>
                  No Recent Transactions
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '340px', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                  Payout requests and dynamic commission credits will automatically stream here once processed.
                </p>
                <button
                  type="button"
                  className="van-btn-action-3d van-btn-action-amber"
                  style={{ height: '36px', padding: '0 1.15rem', fontSize: '0.8rem' }}
                  onClick={() => onNavigate && onNavigate('payout-withdraw')}
                >
                  <Wallet size={14} />
                  <span>Request First Payout</span>
                </button>
              </div>
            ) : (
              <div className="van-table-container-3d">
                <table className="van-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 1rem' }}>Transaction / ID</th>
                      <th style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 1rem' }}>Mode</th>
                      <th className="van-table-num" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 1rem' }}>Gross</th>
                      <th className="van-table-num" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 1rem' }}>Net</th>
                      <th style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 1rem' }}>Status</th>
                      <th className="van-table-center" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '0.75rem 1rem' }}>Slip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn, idx) => (
                      <tr key={txn.id || idx}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div className="van-table-cell-bold">{txn.type}</div>
                          <div className="van-text-xs van-text-muted" style={{ fontFamily: 'monospace' }}>
                            {txn.id} • {txn.date}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className="van-badge van-badge-neutral">{txn.method}</span>
                        </td>
                        <td className="van-table-num" style={{ padding: '0.85rem 1rem' }}>
                          ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="van-table-num" style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--van-status-success-text)' }}>
                          ₹{txn.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className="van-badge van-badge-success">{txn.status}</span>
                        </td>
                        <td className="van-table-center" style={{ padding: '0.85rem 1rem' }}>
                          <button
                            type="button"
                            className="van-btn van-btn-sm van-btn-outline"
                            onClick={() => setSelectedTxn(txn)}
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Activity Card */}
        <div className="van-chart-card-3d">
          <div className="van-chart-header-3d">
            <div className="van-chart-title-group">
              <div className="van-chart-badge-3d van-chart-badge-amber">
                <Bell size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="van-chart-heading">
                  Real-time Activity
                </h3>
                <p className="van-chart-subheading">
                  System notices & network updates
                </p>
              </div>
            </div>
            <div className="van-badge-portal-3d" style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}>
              <span className="van-badge-portal-dot" style={{ background: '#10B981', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.35)' }} />
              <span>Live</span>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            {activityFeed.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div className="van-3d-empty-icon-badge van-3d-icon-amber" style={{ width: '56px', height: '56px', borderRadius: '16px', marginBottom: '1rem' }}>
                  <Bell size={26} strokeWidth={2.2} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--van-brand-navy)', marginBottom: '0.25rem' }}>
                  All Caught Up!
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: '280px', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                  System notices, bonus alerts, and network updates will stream here live.
                </p>
                <span className="van-badge-3d" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', fontSize: '0.74rem', padding: '0.25rem 0.75rem' }}>
                  ✓ Feed Connected & Active
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activityFeed.map((act) => (
                  <div key={act.id} className="van-activity-tile-3d">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--van-brand-blue)', marginTop: '6px', flexShrink: 0, boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--van-brand-navy)' }}>{act.title}</div>
                      <div className="van-text-xs van-text-muted" style={{ marginTop: '0.15rem' }}>{act.desc}</div>
                      <div className="van-text-xs van-text-muted" style={{ marginTop: '0.25rem', fontWeight: 600, color: '#94A3B8' }}>{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="van-chart-footer-3d" style={{ padding: '0.85rem 1.4rem' }}>
            <button
              type="button"
              className="van-btn-sync-3d"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onNavigate && onNavigate('support-notifications')}
            >
              <span>Notification Center →</span>
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
