import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Zap, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  Phone, 
  Sparkles, 
  Network, 
  Layers, 
  GitFork,
  ArrowRight
} from 'lucide-react';
import { getTeamConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import { useBranding } from '../../utils/branding';
import DataTable from '../../components/common/DataTable';
import './network.css';

function TeamConnectionsPage({ user, onNavigate }) {
  const { appName } = useBranding();
  const [teamMembers, setTeamMembers] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeamConnections({ user_code: user?.user_code });
      if (res && res.status === 'success') {
        setTeamMembers(res.teamMembers || []);
        setLevelStats(res.levelStats || []);
      } else {
        setTeamMembers([]);
        setLevelStats([]);
      }
    } catch (err) {
      console.error('Error fetching team connections from database:', err);
      setError('Unable to load 10-level team connections from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 10-Level Rates & Member Count Breakdown Summary
  const levelBreakdown = useMemo(() => {
    const counts = {};
    for (let i = 1; i <= 10; i++) counts[i] = 0;
    teamMembers.forEach((m) => {
      const lvl = Number(m.level);
      if (lvl >= 1 && lvl <= 10) counts[lvl] = (counts[lvl] || 0) + 1;
    });

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => ({
      level: lvl,
      rate: '2%',
      count: counts[lvl] || 0,
    }));
  }, [teamMembers]);

  // Overall Statistics
  const totalTeamSize = teamMembers.length;
  const activeMembersCount = useMemo(() => {
    return teamMembers.filter((m) => m.status === 'active').length;
  }, [teamMembers]);

  const totalGroupVolume = useMemo(() => {
    return teamMembers.reduce((sum, m) => sum + (Number(m.groupPv || m.groupBv) || 0), 0);
  }, [teamMembers]);

  // Filter Logic
  const filteredTeam = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesLevel =
        selectedLevel === 'all' || String(member.level) === String(selectedLevel);

      const matchesRank =
        rankFilter === 'all' ||
        member.rank?.toLowerCase().includes(rankFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter;

      return matchesLevel && matchesRank && matchesStatus;
    });
  }, [teamMembers, selectedLevel, rankFilter, statusFilter]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Gen Level',
      accessor: 'level',
      render: (val) => (
        <div className="gen-level-cell">
          <span className={`gen-level-badge level-${val}`}>
            Gen L{val}
          </span>
          <span className="rate-subtext">2% Override</span>
        </div>
      ),
      width: '100px',
    },
    {
      header: 'Member Info',
      accessor: 'name',
      render: (val, row) => (
        <div className="user-profile-cell">
          {row.avatar && row.avatar !== '/logo.png' ? (
            <img
              src={row.avatar}
              alt={val}
              className="cell-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="cell-avatar"
            style={{
              display: (row.avatar && row.avatar !== '/logo.png') ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
            }}
          >
            {val ? val.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="cell-user-meta">
            <strong className="user-fullname">{val}</strong>
            <span className="user-subcode">{row.id}</span>
            <span className="user-phone">{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Immediate Sponsor',
      accessor: 'sponsorName',
      render: (val, row) => (
        <div className="sponsor-cell">
          <strong className="sponsor-name">{val}</strong>
          <span className="sponsor-id-code">{row.sponsorId}</span>
        </div>
      ),
    },
    {
      header: 'Rank & Status',
      accessor: 'rank',
      render: (val, row) => (
        <div className="rank-status-cell">
          <span className={`rank-pill ${row.rankBadgeClass || 'rank-bronze'}`}>
            {val}
          </span>
          <span className={`status-pill ${row.status}`}>
            {row.status === 'active' ? '● Active' : '○ Inactive'}
          </span>
        </div>
      ),
    },
    {
      header: 'Self BV',
      accessor: 'personalPv',
      align: 'right',
      render: (val, row) => (
        <div className="pv-cell">
          <strong>{formatBV(val || row.personalBv)}</strong>
          <span className="pv-sub">Personal BV</span>
        </div>
      ),
    },
    {
      header: 'Group BV (Turnover)',
      accessor: 'groupPv',
      align: 'right',
      render: (val, row) => (
        <div className="turnover-cell">
          <strong className="text-emerald">{row.groupBvFormatted || formatINR(val || row.groupBv || 0)}</strong>
          <span className="turnover-sub">Team Group BV</span>
        </div>
      ),
    },
    {
      header: 'Downlines',
      accessor: 'downlineCount',
      align: 'center',
      render: (val) => (
        <span className="l2-badge">
          👥 {val || 0} Downlines
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      align: 'center',
      render: (val, row) => (
        <button
          type="button"
          className="van-btn-details-3d"
          style={{ height: '34px', padding: '0 0.85rem', fontSize: '0.8rem', borderRadius: '10px' }}
          title="Inspect Downline Connection"
          onClick={() => setSelectedMember(row)}
        >
          <Eye size={13} />
          <span>Dossier</span>
        </button>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '0.85rem 1.35rem',
            borderRadius: '14px',
            zIndex: 99999,
            boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.35)',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            animation: 'van-scale-pulse 0.25s ease-out',
          }}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner (2-Color Gradient with 3D Depth) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Network size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>10 Generation Levels • 20% Equal Override Matrix</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Team Connections & Downlines
            </h1>
            <p className="van-catalog-hero-desc">
              Complete multi-generational network database across all 10 unilevel tiers. Filter by generation level, track personal/group volume, and inspect member dossiers.
            </p>
          </div>
        </div>

        {/* Right Action & Stats Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.4rem',
            flexShrink: 0,
          }}
        >
          {/* Top Row: Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">{totalTeamSize}</div>
              <div className="van-catalog-stat-chip-lbl">10-Lvl Team</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {totalTeamSize > 0 ? Math.round((activeMembersCount / totalTeamSize) * 100) : 0}%
              </div>
              <div className="van-catalog-stat-chip-lbl">Active Ratio</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#FBBF24' }}>2.0%</div>
              <div className="van-catalog-stat-chip-lbl">Equal / Level</div>
            </div>
          </div>

          {/* Bottom Row: 3D Genealogy Tree Navigation Button */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('network-tree')}
            className="van-btn-share-3d"
            style={{
              padding: '0.75rem 1.65rem',
              height: 'auto',
              textDecoration: 'none',
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
            }}
            title="Open Interactive Visual Genealogy Tree"
          >
            <GitFork size={16} strokeWidth={2.4} />
            <span>Open Genealogy Tree</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 10-Level Summary Pills Strip */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'thin',
        }}
      >
        {levelBreakdown.map((item) => {
          const isActive = selectedLevel === String(item.level);
          return (
            <button
              key={item.level}
              type="button"
              onClick={() => setSelectedLevel(isActive ? 'all' : String(item.level))}
              style={{
                cursor: 'pointer',
                background: isActive ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' : '#FFFFFF',
                border: isActive ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '0.75rem 1.15rem',
                minWidth: '135px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.35rem',
                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                flexShrink: 0,
                textAlign: 'left',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isActive ? '#1D4ED8' : '#334155', textTransform: 'uppercase' }}>
                  Level {item.level}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', background: 'rgba(37, 99, 235, 0.1)', padding: '0.12rem 0.45rem', borderRadius: '6px' }}>
                  {item.rate}
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                {item.count} Partners
              </div>
            </button>
          );
        })}
      </div>

      {/* KPI Cards Grid (Strict 4 in 1 row on Desktop, 2x2 on Tablet, 1 col on Mobile) */}
      <div className="van-directs-kpi-grid">
        {/* Card 1: Total 10-Level Team */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#6366F1',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Total 10-Level Team
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '0s' }}
              title="Full 10-Generation Downline"
            >
              <Users size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {totalTeamSize}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>All 10 Generations</span>
            <span className="van-card-badge-pill" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
              10 Levels
            </span>
          </div>
        </div>

        {/* Card 2: Active Paying Members */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#10B981',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Active Paying Members
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.5s' }}
              title="Active Member Count"
            >
              <Zap size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {activeMembersCount}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {totalTeamSize > 0 ? Math.round((activeMembersCount / totalTeamSize) * 100) : 0}% Active Ratio
            </span>
            <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
              ⚡ Active
            </span>
          </div>
        </div>

        {/* Card 3: Equal Rate Distribution */}
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
              Equal Rate Distribution
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '1.0s' }}
              title="2.0% Equal Override Matrix"
            >
              <Award size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            2.0% / Level
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>20% Network Pool</span>
            <span className="van-card-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
              Fixed 2%
            </span>
          </div>
        </div>

        {/* Card 4: Total 10-Gen Turnover (BV) */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #2563EB, #0284C7)' }} />
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
              10-Gen Turnover (BV)
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '1.5s' }}
              title="Accumulated 10-Gen Turnover"
            >
              <TrendingUp size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {formatINR(totalGroupVolume)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Accumulated Network Volume</span>
            <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              10-Gen BV
            </span>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div
        className="van-library-toolbar-3d"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '1rem 1.4rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Generation Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '0.5rem 0.95rem' }}>
            <Layers size={15} color="#2563EB" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.84rem', fontWeight: 600, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All 10 Generations</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                <option key={l} value={String(l)}>
                  Generation Level {l} (2.0%)
                </option>
              ))}
            </select>
          </div>

          {/* Rank Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '0.5rem 0.95rem' }}>
            <Award size={15} color="#6366F1" />
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.84rem', fontWeight: 600, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Ranks</option>
              <option value="diamond">Diamond Director</option>
              <option value="platinum">Platinum Pro</option>
              <option value="gold">Gold Executive</option>
              <option value="silver">Silver Leader</option>
              <option value="bronze">Bronze Starter</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '0.5rem 0.95rem' }}>
            <CheckCircle2 size={15} color="#10B981" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.84rem', fontWeight: 600, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(selectedLevel !== 'all' || rankFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSelectedLevel('all'); setRankFilter('all'); setStatusFilter('all'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '10px',
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Counter Pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0.5rem 1.1rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', border: '1px solid #E2E8F0' }}>
          <Users size={15} color="#2563EB" />
          <span>Showing {filteredTeam.length} of {totalTeamSize} Team Members</span>
        </div>
      </div>

      {/* Content Area: Standalone Full-Width 3D Empty Card (Zero Horizontal Overflow) OR Active DataTable */}
      {loading ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '3.5px solid #E2E8F0',
              borderTopColor: '#2563EB',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.25rem auto',
            }}
          />
          <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            Loading 10-Level Team Data...
          </h4>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
            Fetching multi-generational genealogy downlines from database.
          </p>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            padding: '4.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 6px 24px -3px rgba(15, 23, 42, 0.05)',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="van-3d-kpi-icon van-3d-icon-blue"
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 12px 30px -4px rgba(37, 99, 235, 0.42), inset 0 2px 2px rgba(255, 255, 255, 0.65)',
            }}
          >
            <Network size={32} strokeWidth={2.4} />
          </div>
          <h3 style={{ margin: '0 0 0.65rem 0', fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
            No Team Connections Found
          </h3>
          <p style={{ margin: '0 auto 1.85rem auto', maxWidth: '520px', fontSize: '0.92rem', color: '#64748B', lineHeight: 1.6 }}>
            {totalTeamSize === 0
              ? "Your 10-level downline team has not expanded yet. Sponsor direct partners to build deep generation levels and earn 2% overrides across your network!"
              : "No team members matched your selected generation level or status filter. Try clearing your filters to view all team partners."}
          </p>
          {totalTeamSize === 0 ? (
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('network-tree')}
              className="van-btn-share-3d"
              style={{
                padding: '0.75rem 1.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                borderBottom: '3px solid #1E40AF',
                color: '#FFFFFF',
                boxShadow: '0 8px 20px -3px rgba(37, 99, 235, 0.45)',
                cursor: 'pointer',
                margin: '0 auto',
              }}
            >
              <GitFork size={16} />
              <span>Explore Genealogy Tree</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setSelectedLevel('all'); setRankFilter('all'); setStatusFilter('all'); }}
              className="van-btn-details-3d"
              style={{
                padding: '0.7rem 1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.86rem',
                fontWeight: 700,
                borderRadius: '12px',
                margin: '0 auto',
              }}
            >
              <RotateCcw size={15} />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredTeam}
          defaultPageSize={10}
          searchPlaceholder="Search member name, ID, or sponsor..."
          loading={loading}
        />
      )}

      {/* Member Dossier Modal */}
      {selectedMember && (
        <div className="net-modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="net-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <h3>Generation L{selectedMember.level} Team Member</h3>
                <span>Network Genealogy & Override Details</span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedMember(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-profile-header">
                {selectedMember.avatar && selectedMember.avatar !== '/logo.png' ? (
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="modal-avatar-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="modal-avatar-lg"
                  style={{
                    display: (selectedMember.avatar && selectedMember.avatar !== '/logo.png') ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: '0 8px 18px -2px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  {selectedMember.name ? selectedMember.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="modal-header-meta">
                  <h2>{selectedMember.name}</h2>
                  <span className="code-tag">{selectedMember.id}</span>
                  <div className="modal-pills-row">
                    <span className={`gen-level-badge level-${selectedMember.level}`}>
                      Generation L{selectedMember.level} (2% Override)
                    </span>
                    <span className={`rank-pill ${selectedMember.rankBadgeClass || 'rank-bronze'}`}>
                      {selectedMember.rank}
                    </span>
                    <span className={`status-pill ${selectedMember.status}`}>
                      {selectedMember.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Immediate Sponsor</span>
                  <span className="spec-val">{selectedMember.sponsorName} ({selectedMember.sponsorId})</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Mobile Number</span>
                  <span className="spec-val">{selectedMember.phone || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Email Address</span>
                  <span className="spec-val">{selectedMember.email || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Enrolled Date</span>
                  <span className="spec-val">{selectedMember.joiningDate || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Personal Sales BV</span>
                  <span className="spec-val text-purple">{formatBV(selectedMember.personalPv || selectedMember.personalBv)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Team Group Turnover (BV)</span>
                  <span className="spec-val text-emerald">{selectedMember.groupBvFormatted || formatINR(selectedMember.groupPv || selectedMember.groupBv || 0)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Generation Level</span>
                  <span className="spec-val text-blue">Level {selectedMember.level} (2% Equal Rate)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Total Downlines</span>
                  <span className="spec-val text-orange">{selectedMember.downlineCount || 0} Partners</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="net-btn btn-secondary"
                onClick={() => setSelectedMember(null)}
              >
                Close Dossier
              </button>
              {selectedMember.phone && (
                <a
                  href={`tel:${selectedMember.phone}`}
                  className="net-btn btn-primary"
                >
                  <Phone size={14} />
                  <span>Call Member</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamConnectionsPage;