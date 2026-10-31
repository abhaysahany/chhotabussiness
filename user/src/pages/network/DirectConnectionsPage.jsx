import React, { useState, useEffect, useMemo } from 'react';
import { getDirectConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import './network.css';

function DirectConnectionsPage({ user, onNavigate }) {
  const [directMembers, setDirectMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankFilter, setRankFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchDirects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDirectConnections({ user_code: user?.user_code });
      if (res && res.status === 'success') {
        setDirectMembers(res.directMembers || []);
      } else {
        setDirectMembers([]);
      }
    } catch (err) {
      console.error('Error fetching direct connections:', err);
      setError('Unable to load direct connections from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirects();
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter Logic
  const filteredMembers = useMemo(() => {
    return directMembers.filter((member) => {
      const matchesRank =
        rankFilter === 'all' ||
        member.rank?.toLowerCase().includes(rankFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter;

      return matchesRank && matchesStatus;
    });
  }, [directMembers, rankFilter, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCount = directMembers.length;
    const activeCount = directMembers.filter((m) => m.status === 'active').length;
    const totalBonus = directMembers.reduce((sum, m) => {
      const val = typeof m.level1Bonus === 'string'
        ? Number(m.level1Bonus.replace(/[^\d.-]/g, '')) || 0
        : Number(m.level1Bonus) || 0;
      return sum + val;
    }, 0);
    const totalTurnover = directMembers.reduce((sum, m) => {
      const val = typeof m.teamTurnover === 'string'
        ? Number(m.teamTurnover.replace(/[^\d.-]/g, '')) || 0
        : Number(m.groupPv || m.groupBv) || 0;
      return sum + val;
    }, 0);

    return { totalCount, activeCount, totalBonus, totalTurnover };
  }, [directMembers]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Direct Partner & Code',
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
          {row.kycVerified && (
            <span className="kyc-verified-badge" title="KYC Verified">✓ KYC</span>
          )}
        </div>
      ),
    },
    {
      header: 'Joined Date',
      accessor: 'joiningDate',
      render: (val, row) => (
        <div className="date-cell">
          <span className="main-date">{val}</span>
          <span className="sub-loc">{row.location}</span>
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
      header: 'Downline Turnover (BV)',
      accessor: 'groupPv',
      align: 'right',
      render: (val, row) => (
        <div className="turnover-cell">
          <strong className="text-emerald">{row.teamTurnover?.startsWith('₹') ? row.teamTurnover : formatINR(val || row.groupBv || 0)}</strong>
          <span className="turnover-sub">Downline Group BV</span>
        </div>
      ),
    },
    {
      header: 'L2 Downlines',
      accessor: 'level2Count',
      align: 'center',
      render: (val) => (
        <span className="l2-badge">
          🌐 {val || 0} Members
        </span>
      ),
    },
    {
      header: '10% Direct Bonus',
      accessor: 'level1Bonus',
      align: 'right',
      render: (val) => (
        <div className="bonus-cell">
          <strong className="text-purple">{typeof val === 'string' && val.startsWith('₹') ? val : formatINR(val || 0)}</strong>
          <span className="bonus-sub">10% Direct</span>
        </div>
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
          title="View Complete Member Dossier"
          onClick={() => setSelectedMember(row)}
        >
          👁️ View
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
            <span>🤝 Level 1 Direct Network (Unilevel Structure)</span>
          </div>
          <h1 className="net-hero-title">Direct Connections</h1>
          <p className="net-hero-subtitle">
            All partners directly sponsored by you in the database. Filterable with DataTable sorting and pagination.
          </p>
        </div>
        <div className="net-hero-actions">
          <button
            className="net-btn btn-secondary"
            onClick={fetchDirects}
          >
            🔄 Refresh List
          </button>
          <button
            className="net-btn btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + '/register?ref=' + (user?.user_code || 'CB100001'));
              showToast('Referral link copied to clipboard!');
            }}
          >
            📋 Copy Sponsor Link
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="net-metrics-row">
        <div className="metric-box box-purple">
          <div className="metric-icon-wrap">👥</div>
          <div className="metric-info">
            <span className="metric-label">Total Direct Sponsors</span>
            <h2 className="metric-value">{stats.totalCount}</h2>
            <span className="metric-sub">Personal Level 1 Team</span>
          </div>
        </div>

        <div className="metric-box box-green">
          <div className="metric-icon-wrap">⚡</div>
          <div className="metric-info">
            <span className="metric-label">Active Paying Members</span>
            <h2 className="metric-value">{stats.activeCount}</h2>
            <span className="metric-sub">{stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0}% Active Ratio</span>
          </div>
        </div>

        <div className="metric-box box-orange">
          <div className="metric-icon-wrap">💰</div>
          <div className="metric-info">
            <span className="metric-label">Total Direct Commissions</span>
            <h2 className="metric-value">{formatINR(stats.totalBonus)}</h2>
            <span className="metric-sub">10% Instant Referral Bonus</span>
          </div>
        </div>

        <div className="metric-box box-blue">
          <div className="metric-icon-wrap">📈</div>
          <div className="metric-info">
            <span className="metric-label">L1 Group Volume (BV)</span>
            <h2 className="metric-value">{formatINR(stats.totalTurnover)}</h2>
            <span className="metric-sub">Total Downline Group Volume</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer', background: '#fff' }}
        >
          <option value="all">All Achievement Ranks</option>
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
        data={filteredMembers}
        defaultPageSize={10}
        searchPlaceholder="Search direct member by name, code, phone..."
        loading={loading}
      />

      {/* Member Dossier Modal */}
      {selectedMember && (
        <div className="net-modal-backdrop" onClick={() => setSelectedMember(null)}>
          <div className="net-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <h3>Level 1 Member Dossier</h3>
                <span>Sponsor Verification & Downline Performance</span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedMember(null)}>×</button>
            </div>

            <div className="modal-body">
              {/* Profile Card Header */}
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
                    <span className={`rank-pill ${selectedMember.rankBadgeClass || 'rank-bronze'}`}>
                      {selectedMember.rank}
                    </span>
                    <span className={`status-pill ${selectedMember.status}`}>
                      {selectedMember.status.toUpperCase()}
                    </span>
                    <span className="kyc-verified-badge">
                      {selectedMember.kycVerified ? '✓ KYC Verified' : '⚠️ KYC Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Specs Grid */}
              <div className="modal-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Email Address</span>
                  <span className="spec-val">{selectedMember.email}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Mobile Number</span>
                  <span className="spec-val">{selectedMember.phone}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Location</span>
                  <span className="spec-val">{selectedMember.location}</span>
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
                  <span className="spec-val text-emerald">{selectedMember.teamTurnover?.startsWith('₹') ? selectedMember.teamTurnover : formatINR(selectedMember.groupPv || selectedMember.groupBv || 0)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Level 2 Members Sponsored</span>
                  <span className="spec-val text-blue">{selectedMember.level2Count} Members</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Level 1 Commission Received</span>
                  <span className="spec-val text-orange">{selectedMember.level1Bonus?.startsWith('₹') ? selectedMember.level1Bonus : formatINR(selectedMember.level1Bonus || 0)}</span>
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
              <a
                href={`tel:${selectedMember.phone}`}
                className="net-btn btn-primary"
              >
                📞 Call Member
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectConnectionsPage;
