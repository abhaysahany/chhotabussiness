import React, { useState, useEffect, useMemo } from 'react';
import { getTeamConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import './network.css';

function TeamConnectionsPage({ user, onNavigate }) {
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
          <img
            src={row.avatar || '/logo.png'}
            alt={val}
            className="cell-avatar"
            onError={(e) => {
              e.target.src = '/logo.png';
            }}
          />
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
          className="action-icon-btn"
          title="Inspect Downline Connection"
          onClick={() => setSelectedMember(row)}
        >
          👁️ Dossier
        </button>
      ),
    },
  ];

  return (
    <div className="network-page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="net-toast-alert">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="net-hero-card">
        <div className="net-hero-content">
          <div className="net-hero-badge">
            <span>🌐 10 Generation Levels (2% Equal Override Per Level)</span>
          </div>
          <h1 className="net-hero-title">Team Connections</h1>
          <p className="net-hero-subtitle">
            Complete database records across 10 generations with DataTable search, column sorting, and pagination.
          </p>
        </div>
        <div className="net-hero-actions">
          <button
            className="net-btn btn-secondary"
            onClick={fetchTeam}
          >
            🔄 Refresh Network
          </button>
          <button
            className="net-btn btn-primary"
            onClick={() => onNavigate && onNavigate('network-tree')}
          >
            🌳 Open Genealogy Tree
          </button>
        </div>
      </div>

      {/* Level Summary Pills */}
      <div className="net-level-cards-row">
        {levelBreakdown.map((item) => {
          const isActive = selectedLevel === String(item.level);
          return (
            <button
              key={item.level}
              className={`level-stat-pill ${isActive ? 'active-pill' : ''}`}
              onClick={() => setSelectedLevel(isActive ? 'all' : String(item.level))}
            >
              <div className="pill-header">
                <span className="pill-title">Level {item.level}</span>
                <span className="pill-rate">{item.rate}</span>
              </div>
              <div className="pill-count">{item.count} Partners</div>
            </button>
          );
        })}
      </div>

      {/* Metric Cards Row */}
      <div className="net-metrics-row">
        <div className="metric-box box-purple">
          <div className="metric-icon-wrap">👥</div>
          <div className="metric-info">
            <span className="metric-label">Total 10-Level Team</span>
            <h2 className="metric-value">{totalTeamSize}</h2>
            <span className="metric-sub">Across All 10 Generations</span>
          </div>
        </div>

        <div className="metric-box box-green">
          <div className="metric-icon-wrap">⚡</div>
          <div className="metric-info">
            <span className="metric-label">Active Paying Members</span>
            <h2 className="metric-value">{activeMembersCount}</h2>
            <span className="metric-sub">
              {totalTeamSize > 0 ? Math.round((activeMembersCount / totalTeamSize) * 100) : 0}% Active Ratio
            </span>
          </div>
        </div>

        <div className="metric-box box-orange">
          <div className="metric-icon-wrap">💎</div>
          <div className="metric-info">
            <span className="metric-label">Equal Rate Distribution</span>
            <h2 className="metric-value">2.0% / Level</h2>
            <span className="metric-sub">20% Equal Network Pool</span>
          </div>
        </div>

        <div className="metric-box box-blue">
          <div className="metric-icon-wrap">📈</div>
          <div className="metric-info">
            <span className="metric-label">Total 10-Gen Turnover (BV)</span>
            <h2 className="metric-value">{formatINR(totalGroupVolume)}</h2>
            <span className="metric-sub">Accumulated Network Volume</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer', background: '#fff' }}
        >
          <option value="all">All 10 Generation Levels</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
            <option key={l} value={String(l)}>
              Generation Level {l} (2.0%)
            </option>
          ))}
        </select>

        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer', background: '#fff' }}
        >
          <option value="all">All Ranks</option>
          <option value="diamond">Diamond Director</option>
          <option value="platinum">Platinum Pro</option>
          <option value="gold">Gold Executive</option>
          <option value="silver">Silver Leader</option>
          <option value="bronze">Bronze Starter</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer', background: '#fff' }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredTeam}
        defaultPageSize={10}
        searchPlaceholder="Search member name, ID, or sponsor..."
        loading={loading}
      />

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
                <img
                  src={selectedMember.avatar || '/logo.png'}
                  alt={selectedMember.name}
                  className="modal-avatar-lg"
                />
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
                  <span className="spec-val">{selectedMember.phone}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Email Address</span>
                  <span className="spec-val">{selectedMember.email}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Enrolled Date</span>
                  <span className="spec-val">{selectedMember.joiningDate}</span>
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
                  <span className="spec-val text-orange">{selectedMember.downlineCount} Partners</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="net-btn btn-secondary"
                onClick={() => setSelectedMember(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamConnectionsPage;
