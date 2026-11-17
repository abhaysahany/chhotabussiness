import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Wallet,
  Users2,
  UserCheck,
  Layers,
  Network,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Filter,
  Calendar,
  ShieldCheck,
  Award,
  Trophy,
  Gem,
  CheckCircle2,
  Clock,
  ArrowRight,
  Gift
} from 'lucide-react';
import { getTeamConnections, getDirectConnections } from '../../api/userNetworkService';
import { getUserRewards, getUserClaims, getUserFreshProfile, getUserDiamondRewards } from '../../api/userRewardService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';

function MlmEarningsPage({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'base' | 'team' | 'rewards'
  const [teamMembers, setTeamMembers] = useState([]);
  const [directMembers, setDirectMembers] = useState([]);
  const [rewardsList, setRewardsList] = useState([]);
  const [claimsList, setClaimsList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [diamondBalance, setDiamondBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Date Filters
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Additional Filters
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRewardCategory, setSelectedRewardCategory] = useState('all');

  const userCode = currentUser?.user_code || user?.user_code || '';

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [teamRes, directRes, rewRes, claimsRes, freshUser, diamondData] = await Promise.all([
        getTeamConnections({ user_code: userCode }),
        getDirectConnections({ user_code: userCode }),
        getUserRewards(),
        getUserClaims(userCode),
        getUserFreshProfile(),
        getUserDiamondRewards(),
      ]);

      if (teamRes && teamRes.status === 'success') {
        setTeamMembers(teamRes.teamMembers || []);
        setSummary(teamRes.summary || null);
      }
      if (directRes && directRes.status === 'success') {
        setDirectMembers(directRes.directs || []);
      }
      setRewardsList(rewRes || []);
      setClaimsList(claimsRes || []);
      if (diamondData?.wallet?.diamond_balance !== undefined) {
        setDiamondBalance(Number(diamondData.wallet.diamond_balance) || 0);
      }
      if (freshUser) {
        setCurrentUser(freshUser);
      }
    } catch (err) {
      console.error('Error fetching live Network Commission reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // Date Filtering Engine
  const isWithinDateFilter = (itemDate) => {
    if (!itemDate || datePreset === 'all') return true;
    const targetDate = new Date(itemDate);
    if (isNaN(targetDate.getTime())) return true;

    const now = new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (datePreset === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return targetDate.getTime() === today.getTime();
    }
    if (datePreset === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(now.getDate() - 7);
      pastWeek.setHours(0, 0, 0, 0);
      return targetDate >= pastWeek;
    }
    if (datePreset === 'month') {
      const pastMonth = new Date();
      pastMonth.setDate(now.getDate() - 30);
      pastMonth.setHours(0, 0, 0, 0);
      return targetDate >= pastMonth;
    }
    if (datePreset === 'quarter') {
      const pastQuarter = new Date();
      pastQuarter.setDate(now.getDate() - 90);
      pastQuarter.setHours(0, 0, 0, 0);
      return targetDate >= pastQuarter;
    }
    if (datePreset === 'year') {
      const pastYear = new Date();
      pastYear.setDate(now.getDate() - 365);
      pastYear.setHours(0, 0, 0, 0);
      return targetDate >= pastYear;
    }
    if (datePreset === 'custom') {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (targetDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (targetDate > end) return false;
      }
      return true;
    }
    return true;
  };

  // Direct / Base Commission Logs
  const baseCommissionLogs = useMemo(() => {
    return directMembers.map((member, idx) => {
      const vol = Number(member.personalPv || member.personalBv || 1000);
      const commRate = 10;
      const earned = Math.round((vol * commRate) / 100);
      return {
        id: `BC-${member.id}-${idx + 1}`,
        memberId: member.id,
        memberName: member.name,
        rank: member.rank || 'Bronze Starter',
        joiningDate: member.joiningDate || '2026-08-10',
        businessVolume: vol,
        commPercent: `${commRate}%`,
        earnedCommission: earned,
        status: member.status === 'active' ? 'Distributed' : 'Pending Verification',
      };
    });
  }, [directMembers]);

  // Team Commission Logs (10 Generations at 2% Override per level)
  const teamCommissionLogs = useMemo(() => {
    return teamMembers.map((member, idx) => {
      const vol = Number(member.groupPv || member.groupBv || member.personalPv || 5000);
      const level = member.level || 1;
      const rate = 2;
      const earned = Math.round((vol * rate) / 100);
      return {
        id: `TC-L${level}-${member.id}-${idx + 1}`,
        level: level,
        memberId: member.id,
        memberName: member.name,
        rank: member.rank || 'Silver Leader',
        sponsorName: member.sponsorName || 'Direct Team',
        joiningDate: member.joiningDate || '2026-08-10',
        personalPv: member.personalPv || 0,
        groupPv: vol,
        overrideRate: `${rate}%`,
        earnedCommission: earned,
        status: member.status === 'active' ? 'Distributed' : 'Active',
      };
    });
  }, [teamMembers]);

  // Aggregated Totals
  const totalBaseCommission = useMemo(() => {
    return baseCommissionLogs.reduce((sum, item) => sum + item.earnedCommission, 0);
  }, [baseCommissionLogs]);

  const totalTeamCommission = useMemo(() => {
    return teamCommissionLogs.reduce((sum, item) => sum + item.earnedCommission, 0);
  }, [teamCommissionLogs]);

  const totalNetworkVolume = useMemo(() => {
    return teamMembers.reduce((sum, item) => sum + (Number(item.groupPv || item.groupBv) || 0), 0);
  }, [teamMembers]);

  const totalCombinedCommission = totalBaseCommission + totalTeamCommission;

  // Filtered Team Members with Date & Search Filters
  const filteredTeam = useMemo(() => {
    return teamCommissionLogs.filter((member) => {
      const matchesRank = rankFilter === 'all' || member.rank?.toLowerCase().includes(rankFilter.toLowerCase());
      const matchesLevel = selectedLevel === 'all' || String(member.level) === String(selectedLevel);
      const matchesStatus = statusFilter === 'all' || member.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = isWithinDateFilter(member.joiningDate);

      return matchesRank && matchesLevel && matchesStatus && matchesDate;
    });
  }, [teamCommissionLogs, rankFilter, selectedLevel, statusFilter, datePreset, startDate, endDate]);

  // Filtered Base Commission with Date & Search Filters
  const filteredBase = useMemo(() => {
    return baseCommissionLogs.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = isWithinDateFilter(item.joiningDate);

      return matchesStatus && matchesDate;
    });
  }, [baseCommissionLogs, statusFilter, datePreset, startDate, endDate]);

  // Filtered Rewards
  const filteredRewards = useMemo(() => {
    return rewardsList.filter((r) => {
      return selectedRewardCategory === 'all' || r.category?.toLowerCase() === selectedRewardCategory.toLowerCase();
    });
  }, [rewardsList, selectedRewardCategory]);

  const hasActiveFilters = Boolean(
    datePreset !== 'all' ||
    selectedLevel !== 'all' ||
    rankFilter !== 'all' ||
    statusFilter !== 'all' ||
    selectedRewardCategory !== 'all'
  );

  const resetAllFilters = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedLevel('all');
    setRankFilter('all');
    setStatusFilter('all');
    setSelectedRewardCategory('all');
  };

  const currentTabCount = useMemo(() => {
    if (activeTab === 'base') return filteredBase.length;
    if (activeTab === 'rewards') return filteredRewards.length;
    return filteredTeam.length;
  }, [activeTab, filteredBase, filteredRewards, filteredTeam]);

  // DataTable Columns: All / Combined Ledger
  const combinedColumns = [
    {
      header: 'Gen Level',
      accessor: 'level',
      render: (val) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.2rem 0.6rem',
            borderRadius: '7px',
            fontSize: '0.76rem',
            fontWeight: 850,
            background: val === 1 ? '#EFF6FF' : '#F5F3FF',
            color: val === 1 ? '#1D4ED8' : '#7C3AED',
            border: `1px solid ${val === 1 ? '#BFDBFE' : '#DDD6FE'}`,
          }}
        >
          Gen L{val}
        </span>
      ),
      width: '110px',
    },
    {
      header: 'Member & User ID',
      accessor: 'memberName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.86rem' }}>{val}</div>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#2563EB',
              fontWeight: 800,
              background: '#EFF6FF',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '0.15rem',
              border: '1px solid #DBEAFE',
            }}
          >
            {row.memberId}
          </span>
        </div>
      ),
    },
    {
      header: 'Rank',
      accessor: 'rank',
      render: (val) => (
        <span
          style={{
            background: '#F1F5F9',
            color: '#334155',
            padding: '0.22rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 750,
            border: '1px solid #E2E8F0',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Immediate Sponsor',
      accessor: 'sponsorName',
      render: (val) => <span style={{ color: '#475569', fontWeight: 650, fontSize: '0.82rem' }}>{val}</span>,
    },
    {
      header: 'Team Volume (BV)',
      accessor: 'groupPv',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.88rem' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Rate',
      accessor: 'overrideRate',
      align: 'center',
      render: (val) => (
        <span
          style={{
            fontWeight: 850,
            color: '#2563EB',
            background: '#EFF6FF',
            padding: '0.15rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.78rem',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Earned Commission',
      accessor: 'earnedCommission',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.9rem' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 800,
          }}
        >
          <CheckCircle2 size={12} strokeWidth={2.6} />
          <span>{val}</span>
        </span>
      ),
    },
  ];

  // DataTable Columns: Base Commission
  const baseColumns = [
    {
      header: 'Direct Member',
      accessor: 'memberName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.86rem' }}>{val}</div>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#2563EB',
              fontWeight: 800,
              background: '#EFF6FF',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '0.15rem',
              border: '1px solid #DBEAFE',
            }}
          >
            {row.memberId}
          </span>
        </div>
      ),
    },
    {
      header: 'Rank',
      accessor: 'rank',
      render: (val) => (
        <span
          style={{
            background: '#EFF6FF',
            color: '#1D4ED8',
            padding: '0.22rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 750,
            border: '1px solid #BFDBFE',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Joining Date',
      accessor: 'joiningDate',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748B', fontSize: '0.78rem', fontWeight: 650 }}>
          <Calendar size={12} color="#94A3B8" />
          <span>{val}</span>
        </div>
      ),
    },
    {
      header: 'Self Business (BV)',
      accessor: 'businessVolume',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.88rem' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Rate',
      accessor: 'commPercent',
      align: 'center',
      render: (val) => (
        <span
          style={{
            fontWeight: 850,
            color: '#2563EB',
            background: '#EFF6FF',
            padding: '0.15rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.78rem',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Earned Base Income',
      accessor: 'earnedCommission',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.9rem' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 800,
          }}
        >
          <CheckCircle2 size={12} strokeWidth={2.6} />
          <span>{val}</span>
        </span>
      ),
    },
  ];

  // DataTable Columns: Team Commission
  const teamColumns = [
    {
      header: 'Generation',
      accessor: 'level',
      render: (val) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.2rem 0.6rem',
            borderRadius: '7px',
            fontSize: '0.76rem',
            fontWeight: 850,
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
          }}
        >
          Gen L{val}
        </span>
      ),
      width: '110px',
    },
    {
      header: 'Team Member',
      accessor: 'memberName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.86rem' }}>{val}</div>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#2563EB',
              fontWeight: 800,
              background: '#EFF6FF',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '0.15rem',
              border: '1px solid #DBEAFE',
            }}
          >
            {row.memberId}
          </span>
        </div>
      ),
    },
    {
      header: 'Rank',
      accessor: 'rank',
      render: (val) => (
        <span
          style={{
            background: '#F1F5F9',
            color: '#334155',
            padding: '0.22rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 750,
            border: '1px solid #E2E8F0',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Immediate Sponsor',
      accessor: 'sponsorName',
      render: (val) => <span style={{ color: '#475569', fontWeight: 650, fontSize: '0.82rem' }}>{val}</span>,
    },
    {
      header: 'Team Turnover (BV)',
      accessor: 'groupPv',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.88rem' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Override Rate',
      accessor: 'overrideRate',
      align: 'center',
      render: (val) => (
        <span
          style={{
            fontWeight: 850,
            color: '#059669',
            background: '#ECFDF5',
            padding: '0.15rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.78rem',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Earned Override',
      accessor: 'earnedCommission',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.9rem' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 800,
          }}
        >
          <CheckCircle2 size={12} strokeWidth={2.6} />
          <span>{val}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Network size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>10-Level Database Commission & Rewards Engine</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Network Income Overview
            </h1>
            <p className="van-catalog-hero-desc">
              Live database audit with multi-column sorting, pagination DataTable, and 10-Level 2% overrides.
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
          {/* Top Row: Diamond Balance & Level Stat Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              className="van-catalog-stat-chip"
              style={{
                background: 'rgba(56, 189, 248, 0.14)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
              }}
            >
              <div
                className="van-catalog-stat-chip-val"
                style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Gem size={16} />
                <span>{diamondBalance} Diamonds</span>
              </div>
              <div className="van-catalog-stat-chip-lbl">Diamond Balance</div>
            </div>

            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                10 Levels
              </div>
              <div className="van-catalog-stat-chip-lbl">2% Overrides</div>
            </div>
          </div>

          {/* Bottom Row: 3D Refresh Action Button */}
          <button
            type="button"
            onClick={fetchAllData}
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
            title="Refresh live network commission records"
          >
            <RotateCcw size={16} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Network Data'}</span>
          </button>
        </div>
      </div>

      {/* 4 Signature 3D KPI Cards Grid (4 in a row Desktop, 2x2 Tablet, 1 col Mobile) */}
      <div className="van-business-kpi-grid">
        {/* Card 1: Total Combined Commission */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #7C3AED, #5B21B6)' }} />
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
              Total Combined Commission
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '0s' }}
              title="Combined Network Commission"
            >
              <Crown size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#4C1D95' }}>
            {formatINR(totalCombinedCommission)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Base + 10-Level Overrides
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
              Total Payout
            </span>
          </div>
        </div>

        {/* Card 2: Base / Direct Commission */}
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
              Base / Direct Commission
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '0.4s' }}
              title="Direct Sponsored Leg Earnings"
            >
              <UserCheck size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#1E3A8A' }}>
            {formatINR(totalBaseCommission)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {directMembers.length} Direct Sponsored Legs
            </span>
            <span className="van-card-badge-pill blue">
              10% Direct
            </span>
          </div>
        </div>

        {/* Card 3: 10-Level Team Overrides */}
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
              10-Level Team Overrides
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.8s' }}
              title="10-Generation Turnover Earnings"
            >
              <Layers size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#047857' }}>
            {formatINR(totalTeamCommission)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              2% Equal Split Per Level
            </span>
            <span className="van-card-badge-pill emerald">
              20% Pool
            </span>
          </div>
        </div>

        {/* Card 4: Total Network Volume (BV) */}
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
              Total Network Volume (BV)
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '1.2s' }}
              title="Total Downline Group Business Volume"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#B45309' }}>
            {formatINR(totalNetworkVolume)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {teamMembers.length} Total Downline Members
            </span>
            <span className="van-card-badge-pill amber" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              Network BV
            </span>
          </div>
        </div>
      </div>

      {/* 3D Segmented Navigation Sub-Tabs */}
      <div className="van-mlm-tabs-container">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`van-mlm-tab-btn ${activeTab === 'all' ? 'active purple' : ''}`}
        >
          <Layers size={15} />
          <span>All Network Commissions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('base')}
          className={`van-mlm-tab-btn ${activeTab === 'base' ? 'active' : ''}`}
        >
          <UserCheck size={15} />
          <span>Base Commission (Direct)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`van-mlm-tab-btn ${activeTab === 'team' ? 'active emerald' : ''}`}
        >
          <Network size={15} />
          <span>10-Level Team Overrides</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`van-mlm-tab-btn ${activeTab === 'rewards' ? 'active amber' : ''}`}
        >
          <Trophy size={15} />
          <span>Reward Statistics & Milestones</span>
        </button>
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

            {/* Date Range Preset Selector */}
            <div className={`van-dir-filter-capsule ${datePreset !== 'all' ? 'active' : ''}`}>
              <Calendar size={15} color="#2563EB" strokeWidth={2.2} />
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                aria-label="Filter by Date Range"
              >
                <option value="all">Date: All Time</option>
                <option value="today">Date: Today</option>
                <option value="week">Date: Last 7 Days</option>
                <option value="month">Date: Last 30 Days</option>
                <option value="quarter">Date: Last 90 Days</option>
                <option value="year">Date: Last 1 Year</option>
                <option value="custom">Date: Custom Range...</option>
              </select>
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    borderRadius: '9px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.8rem',
                    borderRadius: '9px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Generation Level Filter */}
            {(activeTab === 'all' || activeTab === 'team') && (
              <div className={`van-dir-filter-capsule ${selectedLevel !== 'all' ? 'active' : ''}`}>
                <Layers size={15} color="#7C3AED" strokeWidth={2.2} />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  aria-label="Filter by Generation Level"
                >
                  <option value="all">All 10 Generations</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                    <option key={lvl} value={String(lvl)}>
                      Generation Level {lvl} (2% Override)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rank Filter */}
            {activeTab !== 'rewards' && (
              <div className={`van-dir-filter-capsule ${rankFilter !== 'all' ? 'active' : ''}`}>
                <Award size={15} color="#D97706" strokeWidth={2.2} />
                <select
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  aria-label="Filter by Rank"
                >
                  <option value="all">All Ranks</option>
                  <option value="diamond">Diamond Director</option>
                  <option value="platinum">Platinum Pro</option>
                  <option value="gold">Gold Executive</option>
                  <option value="silver">Silver Leader</option>
                  <option value="bronze">Bronze Starter</option>
                </select>
              </div>
            )}

            {/* Status Filter */}
            {activeTab !== 'rewards' && (
              <div className={`van-dir-filter-capsule ${statusFilter !== 'all' ? 'active' : ''}`}>
                <ShieldCheck size={15} color="#10B981" strokeWidth={2.2} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by Status"
                >
                  <option value="all">All Statuses</option>
                  <option value="distributed">Distributed</option>
                  <option value="active">Active</option>
                </select>
              </div>
            )}

            {/* Reward Category Filter */}
            {activeTab === 'rewards' && (
              <div className={`van-dir-filter-capsule ${selectedRewardCategory !== 'all' ? 'active' : ''}`}>
                <Trophy size={15} color="#7C3AED" strokeWidth={2.2} />
                <select
                  value={selectedRewardCategory}
                  onChange={(e) => setSelectedRewardCategory(e.target.value)}
                  aria-label="Filter by Reward Category"
                >
                  <option value="all">All Reward Categories</option>
                  <option value="welcome">Welcome</option>
                  <option value="gadgets">Gadgets</option>
                  <option value="electronics">Electronics</option>
                  <option value="travel">Travel</option>
                  <option value="international travel">International Travel</option>
                  <option value="automobile">Automobile</option>
                </select>
              </div>
            )}

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="van-dir-reset-btn"
                onClick={resetAllFilters}
                title="Reset all active filters"
              >
                <RotateCcw size={13} strokeWidth={2.4} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right: Actions & Metric Chips */}
          <div className="van-dir-actions-cluster">
            <div className="van-dir-count-pill">
              <span style={{ color: '#0F172A', fontWeight: 800 }}>{currentTabCount}</span>
              <span>{currentTabCount === 1 ? 'record found' : 'records found'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: ALL COMMISSIONS & OVERVIEW (DataTable) */}
      {activeTab === 'all' && (
        <DataTable
          columns={combinedColumns}
          data={filteredTeam}
          defaultPageSize={10}
          searchPlaceholder="Search member name, ID, or sponsor..."
          loading={loading}
        />
      )}

      {/* TAB 2: BASE COMMISSION (DIRECT) (DataTable) */}
      {activeTab === 'base' && (
        <DataTable
          columns={baseColumns}
          data={filteredBase}
          defaultPageSize={10}
          searchPlaceholder="Search direct member or ID..."
          loading={loading}
        />
      )}

      {/* TAB 3: TEAM COMMISSION (10-LEVEL OVERRIDES) (DataTable) */}
      {activeTab === 'team' && (
        <DataTable
          columns={teamColumns}
          data={filteredTeam}
          defaultPageSize={10}
          searchPlaceholder="Search team member or sponsor..."
          loading={loading}
        />
      )}

      {/* TAB 4: REWARDS STATISTICS & MILESTONES */}
      {!loading && activeTab === 'rewards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Diamond Wallet Status Card (3D Glassmorphic Experience) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #1E3A8A 100%)',
              borderRadius: '20px',
              padding: '1.75rem 2.25rem',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
              boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1.5px solid rgba(56, 189, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8',
                  boxShadow: '0 8px 20px rgba(56, 189, 248, 0.2)',
                  flexShrink: 0,
                }}
              >
                <Gem size={28} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                  Your Rewards Diamond Wallet
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38BDF8', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
                  {diamondBalance} Diamonds Available
                </div>
                <div style={{ fontSize: '0.84rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                  Accumulated automatically from sponsor rewards and network sales turnover.
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.85rem 1.45rem',
                borderRadius: '14px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 750 }}>
                Total Claims Done
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4ADE80', marginTop: '0.2rem' }}>
                {claimsList.length} Claims
              </div>
            </div>
          </div>

          {/* Reward Milestone Cards Grid */}
          <div className="van-mlm-reward-grid">
            {filteredRewards.map((reward) => {
              const reqDiamonds = Number(reward.required_bp) || 100;
              const progressPct = Math.min(100, Math.round((diamondBalance / reqDiamonds) * 100));
              const isEligible = diamondBalance >= reqDiamonds;

              return (
                <div
                  key={reward.id}
                  className="van-mlm-reward-card"
                >
                  <div style={{ position: 'relative', width: '100%', height: '170px', overflow: 'hidden', background: '#F8FAFC' }}>
                    <img
                      src={reward.image || '/logo.png'}
                      alt={reward.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.85rem',
                        left: '0.85rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {reward.category}
                    </div>
                  </div>

                  <div style={{ padding: '1.45rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <span
                          style={{
                            background: '#F5F3FF',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                          }}
                        >
                          Milestone Tier
                        </span>
                        <strong style={{ fontSize: '1.05rem', color: '#7C3AED', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Gem size={15} /> {reqDiamonds} Diamonds
                        </strong>
                      </div>

                      <h4 style={{ fontSize: '1.15rem', fontWeight: 850, color: '#0F172A', margin: '0 0 0.4rem 0', lineHeight: 1.3 }}>
                        {reward.title}
                      </h4>
                      <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
                        {reward.description}
                      </p>

                      {reward.reward_value_inr && (
                        <div style={{ fontSize: '0.86rem', color: '#047857', fontWeight: 800, marginBottom: '0.75rem' }}>
                          Estimated Cash Value: {formatINR(reward.reward_value_inr)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: '0.45rem', fontWeight: 700 }}>
                        <span>Progress: {diamondBalance} / {reqDiamonds} Diamonds</span>
                        <strong style={{ color: isEligible ? '#047857' : '#2563EB' }}>{progressPct}%</strong>
                      </div>
                      <div style={{ background: '#F1F5F9', height: '8px', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.15rem' }}>
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: isEligible ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)' : 'linear-gradient(90deg, #38BDF8 0%, #2563EB 100%)',
                            borderRadius: '9999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!isEligible}
                        style={{
                          width: '100%',
                          padding: '0.7rem',
                          borderRadius: '11px',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: isEligible ? 'pointer' : 'not-allowed',
                          background: isEligible ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#E2E8F0',
                          color: isEligible ? '#FFFFFF' : '#94A3B8',
                          boxShadow: isEligible ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isEligible ? '🎁 Claim This Reward Now' : `🔒 Needs ${reqDiamonds - diamondBalance} More Diamonds`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MlmEarningsPage;
