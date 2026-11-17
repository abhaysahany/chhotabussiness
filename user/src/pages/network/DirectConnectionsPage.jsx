import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Zap, 
  Coins, 
  TrendingUp, 
  Copy, 
  Check, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  RotateCcw,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Globe,
  Filter,
  UserCheck
} from 'lucide-react';
import { getDirectConnections } from '../../api/userNetworkService';
import { formatINR, formatNumberIN, formatBV } from '../../utils/formatters';
import { useBranding } from '../../utils/branding';
import DataTable from '../../components/common/DataTable';
import './network.css';

function DirectConnectionsPage({ user, onNavigate }) {
  const { appName } = useBranding();
  const [directMembers, setDirectMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankFilter, setRankFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

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

  const copySponsorLink = () => {
    const link = `${window.location.origin}/register?ref=${user?.user_code || 'CB100001'}`;
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => showToast('Sponsor referral link copied to clipboard!'))
        .catch(() => fallbackCopy(link));
    } else {
      fallbackCopy(link);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Sponsor referral link copied to clipboard!');
    } catch (e) {
      showToast(`Link: ${text}`);
    }
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
          type="button"
          className="van-btn-details-3d"
          style={{ height: '34px', padding: '0 0.85rem', fontSize: '0.8rem', borderRadius: '10px' }}
          title="View Complete Member Dossier"
          onClick={() => setSelectedMember(row)}
        >
          <Eye size={13} />
          <span>View</span>
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
            <Check size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner (2-Color Gradient with 3D Depth) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Users size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>Level 1 Direct Network • Unilevel Structure</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Direct Connections & Team Partners
            </h1>
            <p className="van-catalog-hero-desc">
              All partners directly sponsored by you in the database. Filterable with multi-column sorting, active status indicators, and real-time bonus analytics.
            </p>
          </div>
        </div>

        {/* Right Action & Stats Chips */}
        <div className="van-catalog-hero-stats" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val">{stats.totalCount}</div>
            <div className="van-catalog-stat-chip-lbl">Total Directs</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
              {stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0}%
            </div>
            <div className="van-catalog-stat-chip-lbl">Active Ratio</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#FBBF24' }}>
              {formatINR(stats.totalBonus)}
            </div>
            <div className="van-catalog-stat-chip-lbl">10% Bonus</div>
          </div>

          <button
            type="button"
            onClick={copySponsorLink}
            className="van-btn-share-3d"
            style={{
              padding: '0.75rem 1.35rem',
              height: 'auto',
              textDecoration: 'none',
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
              whiteSpace: 'nowrap',
            }}
            title="Copy your personal sponsor registration link"
          >
            {copiedLink ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Sponsor Link'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Upgraded to Signature 3D Premium Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Total Direct Sponsors */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#6366F1' }}>Total Direct Sponsors</span>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.15)',
              }}
            >
              <Users size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {stats.totalCount}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Personal Level 1 Team</span>
            <span className="van-card-badge-pill" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
              Level 1
            </span>
          </div>
        </div>

        {/* Card 2: Active Paying Members */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#10B981' }}>Active Paying Members</span>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)',
              }}
            >
              <Zap size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {stats.activeCount}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0}% Active Ratio
            </span>
            <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
              ⚡ Verified
            </span>
          </div>
        </div>

        {/* Card 3: Total Direct Commissions */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#D97706' }}>Total Direct Commissions</span>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.15)',
              }}
            >
              <Coins size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {formatINR(stats.totalBonus)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>10% Instant Referral Bonus</span>
            <span className="van-card-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
              10% Instant
            </span>
          </div>
        </div>

        {/* Card 4: L1 Group Volume (BV) */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #2563EB, #0284C7)' }} />
          <div className="van-stat-card-top">
            <span className="van-stat-card-title" style={{ color: '#2563EB' }}>L1 Group Volume (BV)</span>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
              }}
            >
              <TrendingUp size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {formatINR(stats.totalTurnover)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Total Downline Group Volume</span>
            <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              Group BV
            </span>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div
        className="van-library-toolbar-3d"
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '0.85rem 1.25rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Rank Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '0.45rem 0.85rem' }}>
            <Award size={15} color="#6366F1" />
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.84rem', fontWeight: 600, color: '#1E293B', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Achievement Ranks</option>
              <option value="diamond">Diamond Director</option>
              <option value="platinum">Platinum Pro</option>
              <option value="gold">Gold Executive</option>
              <option value="silver">Silver Leader</option>
              <option value="bronze">Bronze Starter</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '0.45rem 0.85rem' }}>
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
          {(rankFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setRankFilter('all'); setStatusFilter('all'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#F1F5F9', padding: '0.45rem 0.95rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
          <Users size={14} color="#2563EB" />
          <span>Showing {filteredMembers.length} of {directMembers.length} Direct Partners</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredMembers}
        defaultPageSize={10}
        searchPlaceholder="Search direct member by name, code, phone..."
        loading={loading}
        emptyMessage={
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 8px 20px -3px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Users size={28} />
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
              No Direct Connections Found
            </h4>
            <p style={{ margin: '0 auto 1.5rem auto', maxWidth: '440px', fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
              {directMembers.length === 0
                ? "You haven't directly sponsored any partners yet. Copy and share your sponsor registration link to start growing your Level 1 direct team!"
                : "No direct team members match your current rank or status filter. Try clearing the filters to view all partners."}
            </p>
            {directMembers.length === 0 ? (
              <button
                type="button"
                onClick={copySponsorLink}
                className="van-btn-share-3d"
                style={{
                  padding: '0.65rem 1.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  borderBottom: '2.5px solid #1E40AF',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  margin: '0 auto',
                }}
              >
                <Copy size={14} />
                <span>Copy Sponsor Link</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setRankFilter('all'); setStatusFilter('all'); }}
                className="van-btn-details-3d"
                style={{
                  padding: '0.65rem 1.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  margin: '0 auto',
                }}
              >
                <RotateCcw size={14} />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        }
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
                    fontWeight: 850,
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
                  <span className="spec-val">{selectedMember.email || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Mobile Number</span>
                  <span className="spec-val">{selectedMember.phone || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Location</span>
                  <span className="spec-val">{selectedMember.location || 'N/A'}</span>
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
                  <span className="spec-val text-emerald">{selectedMember.teamTurnover?.startsWith('₹') ? selectedMember.teamTurnover : formatINR(selectedMember.groupPv || selectedMember.groupBv || 0)}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Level 2 Members Sponsored</span>
                  <span className="spec-val text-blue">{selectedMember.level2Count || 0} Members</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Level 1 Commission Received</span>
                  <span className="spec-val text-orange">{selectedMember.level1Bonus?.startsWith('₹') ? selectedMember.level1Bonus : formatINR(selectedMember.level1Bonus || 0)}</span>
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

export default DirectConnectionsPage;