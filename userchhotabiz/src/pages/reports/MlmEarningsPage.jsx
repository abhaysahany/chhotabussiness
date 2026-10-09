import React, { useState, useEffect, useMemo } from 'react';
import { getTeamConnections, getDirectConnections } from '../../api/userNetworkService';
import { getUserRewards, getUserClaims, getUserFreshProfile } from '../../api/userRewardService';
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
  const userBpBalance = Number(currentUser?.bp_balance ?? user?.bp_balance) || 0;

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [teamRes, directRes, rewRes, claimsRes, freshUser] = await Promise.all([
        getTeamConnections({ user_code: userCode }),
        getDirectConnections({ user_code: userCode }),
        getUserRewards(),
        getUserClaims(userCode),
        getUserFreshProfile(),
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

  // DataTable Columns: All / Combined Ledger
  const combinedColumns = [
    {
      header: 'Gen Level',
      accessor: 'level',
      render: (val) => (
        <span style={{ fontWeight: 800, color: val === 1 ? '#2563eb' : '#7c3aed' }}>
          Gen L{val}
        </span>
      ),
      width: '100px',
    },
    {
      header: 'Member & User ID',
      accessor: 'memberName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>{row.memberId}</div>
        </div>
      ),
    },
    {
      header: 'Rank',
      accessor: 'rank',
      render: (val) => (
        <span style={{ background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Immediate Sponsor',
      accessor: 'sponsorName',
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      header: 'Team Volume (BV)',
      accessor: 'groupPv',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Rate',
      accessor: 'overrideRate',
      align: 'center',
      render: (val) => <span style={{ fontWeight: 800, color: '#2563eb' }}>{val}</span>,
    },
    {
      header: 'Earned Commission',
      accessor: 'earnedCommission',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
          ✓ {val}
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
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>{row.memberId}</div>
        </div>
      ),
    },
    {
      header: 'Rank',
      accessor: 'rank',
      render: (val) => (
        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Joining Date',
      accessor: 'joiningDate',
      render: (val) => <span style={{ color: '#64748b' }}>{val}</span>,
    },
    {
      header: 'Self Business (BV)',
      accessor: 'businessVolume',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Rate',
      accessor: 'commPercent',
      align: 'center',
      render: (val) => <span style={{ fontWeight: 800, color: '#2563eb' }}>{val}</span>,
    },
    {
      header: 'Earned Base Income',
      accessor: 'earnedCommission',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
          ✓ {val}
        </span>
      ),
    },
  ];

  // DataTable Columns: Team Commission
  const teamColumns = [
    {
      header: 'Generation',
      accessor: 'level',
      render: (val) => <span style={{ fontWeight: 800, color: '#10b981' }}>Gen L{val}</span>,
      width: '100px',
    },
    {
      header: 'Team Member',
      accessor: 'memberName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>{row.memberId}</div>
        </div>
      ),
    },
    {
      header: 'Rank',
      accessor: 'rank',
      render: (val) => (
        <span style={{ background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700 }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Immediate Sponsor',
      accessor: 'sponsorName',
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      header: 'Team Turnover (BV)',
      accessor: 'groupPv',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 700, color: '#059669' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Override Rate',
      accessor: 'overrideRate',
      align: 'center',
      render: (val) => <span style={{ fontWeight: 800, color: '#10b981' }}>{val}</span>,
    },
    {
      header: 'Earned Override',
      accessor: 'earnedCommission',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'right',
      render: (val) => (
        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
          ✓ {val}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #312e81 50%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          color: '#fff',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px -5px rgba(124, 58, 237, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span
              style={{
                background: 'rgba(255,255,255,0.12)',
                padding: '0.25rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#ddd6fe',
                display: 'inline-block',
                marginBottom: '0.75rem',
              }}
            >
              🤝 10-Level Database Commission & Rewards Engine
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>
              Network Commission & Rewards Report
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', margin: 0 }}>
              Live database audit with multi-column sorting, pagination DataTable, and 10-Level 2% overrides.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: '700' }}>Available BP Balance</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#38bdf8' }}>💎 {userBpBalance} BP</div>
            </div>
            <button
              onClick={fetchAllData}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Combined Commissions */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Total Combined Commission
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>
            {formatINR(totalCombinedCommission)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: '700' }}>
            Base + 10-Level Overrides
          </div>
        </div>

        {/* Base / Direct Commission */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Base / Direct Commission
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563eb', margin: '0.3rem 0' }}>
            {formatINR(totalBaseCommission)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '700' }}>
            {directMembers.length} Direct Sponsored Legs
          </div>
        </div>

        {/* Team Commission (10-Level Overrides) */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            10-Level Team Overrides
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d', margin: '0.3rem 0' }}>
            {formatINR(totalTeamCommission)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>
            2% Equal Split Per Level
          </div>
        </div>

        {/* Total Network Volume */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Total Network Volume (BV)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b45309', margin: '0.3rem 0' }}>
            {formatINR(totalNetworkVolume)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: '700' }}>
            {teamMembers.length} Total Downline Members
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'all' ? '#7c3aed' : '#ffffff',
            color: activeTab === 'all' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'all' ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
          }}
        >
          📊 All Network Commissions
        </button>
        <button
          onClick={() => setActiveTab('base')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'base' ? '#2563eb' : '#ffffff',
            color: activeTab === 'base' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'base' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
          }}
        >
          💼 Base Commission (Direct)
        </button>
        <button
          onClick={() => setActiveTab('team')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'team' ? '#10b981' : '#ffffff',
            color: activeTab === 'team' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'team' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
          }}
        >
          👥 10-Level Team Overrides
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'rewards' ? '#f59e0b' : '#ffffff',
            color: activeTab === 'rewards' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'rewards' ? '0 4px 12px rgba(245, 158, 11, 0.25)' : 'none',
          }}
        >
          🏆 Reward Statistics & Milestones
        </button>
      </div>

      {/* Multiple Filter Toolbar */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date Range Preset Selector */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            style={{
              padding: '0.6rem 0.95rem',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#334155',
              background: '#ffffff',
            }}
          >
            <option value="all">📅 Date: All Time</option>
            <option value="today">📅 Date: Today</option>
            <option value="week">📅 Date: Last 7 Days</option>
            <option value="month">📅 Date: Last 30 Days</option>
            <option value="quarter">📅 Date: Last 90 Days</option>
            <option value="year">📅 Date: Last 1 Year</option>
            <option value="custom">📅 Date: Custom Range...</option>
          </select>

          {/* Custom Date Range Pickers */}
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {(activeTab === 'all' || activeTab === 'team') && (
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{ padding: '0.6rem 0.95rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              <option value="all">All 10 Generation Levels</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                <option key={lvl} value={String(lvl)}>
                  Generation Level {lvl} (2% Override)
                </option>
              ))}
            </select>
          )}

          {activeTab !== 'rewards' && (
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              style={{ padding: '0.6rem 0.95rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              <option value="all">All Ranks</option>
              <option value="diamond">Diamond Director</option>
              <option value="platinum">Platinum Pro</option>
              <option value="gold">Gold Executive</option>
              <option value="silver">Silver Leader</option>
              <option value="bronze">Bronze Starter</option>
            </select>
          )}

          {activeTab !== 'rewards' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 0.95rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              <option value="all">All Statuses</option>
              <option value="distributed">Distributed</option>
              <option value="active">Active</option>
            </select>
          )}

          {activeTab === 'rewards' && (
            <select
              value={selectedRewardCategory}
              onChange={(e) => setSelectedRewardCategory(e.target.value)}
              style={{ padding: '0.6rem 0.95rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
            >
              <option value="all">All Reward Categories</option>
              <option value="welcome">Welcome</option>
              <option value="gadgets">Gadgets</option>
              <option value="electronics">Electronics</option>
              <option value="travel">Travel</option>
              <option value="international travel">International Travel</option>
              <option value="automobile">Automobile</option>
            </select>
          )}

          {(datePreset !== 'all' || selectedLevel !== 'all' || rankFilter !== 'all' || statusFilter !== 'all' || selectedRewardCategory !== 'all') && (
            <button
              onClick={() => {
                setDatePreset('all');
                setStartDate('');
                setEndDate('');
                setSelectedLevel('all');
                setRankFilter('all');
                setStatusFilter('all');
                setSelectedRewardCategory('all');
              }}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* BP Wallet Status Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              borderRadius: '14px',
              padding: '1.5rem 2rem',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                Your Rewards Business Points (BP) Wallet
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.2rem' }}>
                💎 {userBpBalance} BP Available
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                Accumulated automatically from self business and network volume up to 20 levels.
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Claims Done</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4ade80' }}>{claimsList.length} Claims</div>
            </div>
          </div>

          {/* Reward Milestone Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredRewards.map((reward) => {
              const reqBp = Number(reward.required_bp) || 100;
              const progressPct = Math.min(100, Math.round((userBpBalance / reqBp) * 100));
              const isEligible = userBpBalance >= reqBp;

              return (
                <div
                  key={reward.id}
                  style={{
                    background: '#fff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <img
                    src={reward.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'}
                    alt={reward.title}
                    style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.72rem', fontWeight: '800', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                          {reward.category}
                        </span>
                        <strong style={{ fontSize: '1rem', color: '#7c3aed' }}>💎 {reqBp} BP</strong>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        {reward.title}
                      </h4>
                      <p style={{ fontSize: '0.835rem', color: '#64748b', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                        {reward.description}
                      </p>
                      {reward.reward_value_inr && (
                        <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: '700', marginBottom: '0.75rem' }}>
                          Estimated Value: {formatINR(reward.reward_value_inr)}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '0.35rem' }}>
                        <span>Progress: {userBpBalance} / {reqBp} BP</span>
                        <strong style={{ color: isEligible ? '#15803d' : '#2563eb' }}>{progressPct}%</strong>
                      </div>
                      <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: isEligible ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
                            borderRadius: '4px',
                          }}
                        ></div>
                      </div>

                      <button
                        disabled={!isEligible}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          cursor: isEligible ? 'pointer' : 'not-allowed',
                          background: isEligible ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
                          color: isEligible ? '#fff' : '#94a3b8',
                          boxShadow: isEligible ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                        }}
                      >
                        {isEligible ? '🎁 Claim This Reward Now' : `🔒 Needs ${reqBp - userBpBalance} More BP`}
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
