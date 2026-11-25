import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  Gift,
  Gem,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Search,
  X,
  ShieldCheck,
  MapPin,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Copy,
  Layers,
} from 'lucide-react';
import { getUserClaims, getUserFreshProfile } from '../../api/userRewardService';
import { formatDate } from '../../utils/timezone';
import DataTable from '../common/DataTable';

function RewardsClaimed({ user, onNavigate }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleNavigate = (path) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const loadClaims = useCallback(async (showNotice = false) => {
    if (showNotice) setRefreshing(true);
    else setLoading(true);

    try {
      let activeCode = userCode;
      if (!activeCode) {
        const fresh = await getUserFreshProfile();
        if (fresh) {
          setCurrentUser(fresh);
          activeCode = fresh.user_code;
        }
      }
      const data = await getUserClaims(activeCode);
      setClaims(data || []);
      if (showNotice) {
        showToast('✓ Claimed orders refreshed from database!');
      }
    } catch (err) {
      console.error('Error loading database claims:', err);
      showToast('Could not load claims history from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userCode]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const totalPointsSpent = claims.reduce((acc, curr) => acc + (Number(curr.points_deducted) || 0), 0);
  const inTransitCount = claims.filter((c) => c.status === 'dispatched').length;
  const deliveredCount = claims.filter((c) => c.status === 'delivered').length;
  const pendingCount = claims.filter((c) => c.status === 'pending' || !c.status).length;

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = claim.claim_code?.toLowerCase().includes(q);
        const titleMatch = (claim.reward_title || claim.reward?.title)?.toLowerCase().includes(q);
        const cityMatch = claim.shipping_city?.toLowerCase().includes(q);
        const trackingMatch = claim.tracking_number?.toLowerCase().includes(q);
        const courierMatch = claim.courier_partner?.toLowerCase().includes(q);
        if (!codeMatch && !titleMatch && !cityMatch && !trackingMatch && !courierMatch) {
          return false;
        }
      }

      if (statusFilter !== 'all' && claim.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [claims, searchQuery, statusFilter]);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ ${label} copied to clipboard!`);
  };

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Claim Reference',
      accessor: 'claim_code',
      render: (val) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 800,
            color: '#1e40af',
            fontSize: '0.85rem',
            background: '#eff6ff',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid #bfdbfe',
            display: 'inline-block',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Reward Item',
      accessor: 'reward_title',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: 'radial-gradient(circle at center, #F8FAFC 0%, #EEF2F6 100%)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={row.reward_image || row.reward?.image || '/logo.png'}
              alt={val}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.png';
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.875rem', lineHeight: 1.35 }}>
              {val || row.reward?.title}
            </strong>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {row.reward?.category || 'Milestone Award'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row) => row.reward?.category || 'Milestone',
      render: (val) => (
        <span
          style={{
            background: '#f1f5f9',
            color: '#475569',
            padding: '0.22rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Market Value',
      accessor: (row) => row.reward?.reward_value_inr || 0,
      align: 'right',
      render: (_val, row) => {
        const worth = row.reward?.reward_value_inr;
        return worth ? (
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
            ₹{Number(worth).toLocaleString('en-IN')}
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
        );
      },
    },
    {
      header: 'Diamonds Spent',
      accessor: 'points_deducted',
      align: 'center',
      render: (val) => (
        <span
          style={{
            background: '#f5f3ff',
            color: '#7c3aed',
            border: '1px solid #ddd6fe',
            padding: '0.25rem 0.7rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>💎</span> {val}
        </span>
      ),
    },
    {
      header: 'Delivery Destination',
      accessor: 'shipping_address',
      render: (val, row) => (
        <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.35, maxWidth: '210px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
            <MapPin size={13} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              {row.shipping_city}, {row.shipping_state} ({row.shipping_pincode})
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Claim Date',
      accessor: 'claim_date',
      render: (val) => (
        <span style={{ fontSize: '0.82rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={13} color="#94a3b8" />
          <span>{formatDate(val)}</span>
        </span>
      ),
    },
    {
      header: 'Fulfillment Status',
      accessor: 'status',
      align: 'center',
      render: (val, row) => {
        const isDelivered = val === 'delivered';
        const isDispatched = val === 'dispatched';
        const isPending = val === 'pending' || !val;

        return (
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.24rem 0.7rem',
                borderRadius: '20px',
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                background: isDelivered ? '#ecfdf5' : isDispatched ? '#eff6ff' : isPending ? '#fefce8' : '#fef2f2',
                color: isDelivered ? '#059669' : isDispatched ? '#0284c7' : isPending ? '#d97706' : '#dc2626',
                border: `1px solid ${
                  isDelivered ? '#a7f3d0' : isDispatched ? '#bfdbfe' : isPending ? '#fde68a' : '#fecaca'
                }`,
              }}
            >
              {isDelivered && <CheckCircle2 size={12} strokeWidth={2.5} />}
              {isDispatched && <Truck size={12} strokeWidth={2.5} />}
              {isPending && <Clock size={12} strokeWidth={2.5} />}
              <span>{val || 'Pending'}</span>
            </span>

            {row.tracking_number && (
              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.3rem', fontWeight: 700 }}>
                {row.courier_partner}: <span>{row.tracking_number}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Action',
      accessor: 'id',
      align: 'center',
      render: (_val, row) => (
        <button
          type="button"
          onClick={() => setSelectedClaim(row)}
          style={{
            background: '#ffffff',
            color: '#1e40af',
            border: '1.5px solid #bfdbfe',
            padding: '0.42rem 0.9rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(30, 64, 175, 0.08)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.borderColor = '#93c5fd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#bfdbfe';
          }}
        >
          <span>View Tracking</span>
          <ChevronRight size={13} />
        </button>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1.25rem 3.5rem 1.25rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            padding: '0.9rem 1.5rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#38BDF8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <PackageCheck size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Finance • Member Redemptions & Courier Tracking</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Claimed Rewards & Fulfillment History
            </h1>
            <p className="van-catalog-hero-desc">
              Track your redeemed physical milestone awards, courier Air Waybills (AWB), and live delivery fulfillment statuses.
            </p>
          </div>
        </div>

        {/* Right Quick Stats Pod & Actions */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.85rem',
            flexShrink: 0,
          }}
        >
          {/* Redeemed Summary Glass Pod */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: '0.85rem 1.4rem',
              textAlign: 'center',
              minWidth: '220px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#c7d2fe',
                fontWeight: 800,
                display: 'block',
              }}
            >
              Total Diamonds Redeemed
            </span>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#fbbf24',
                marginTop: '0.15rem',
                textShadow: '0 2px 10px rgba(251, 191, 36, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <span>💎</span>
              <span>{totalPointsSpent}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              {claims.length} Order{claims.length === 1 ? '' : 's'} Processed
            </span>
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => loadClaims(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards/available')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 1rem',
                borderRadius: '9999px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.35) 100%)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              <Gift size={14} />
              <span>Browse Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Premium 3D KPI Summary Pods - Strictly 1 Row */}
      <div className="van-rewards-kpi-row">
        {/* Card 1: Total Claims Placed */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#2563EB' }}>
                Total Claims Placed
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-blue" title="Total Claims Placed">
                <Gift size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value">
              <span>{claims.length}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Total Orders</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Milestone orders placed
            </span>
            <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              Claims
            </span>
          </div>
        </div>

        {/* Card 2: Diamonds Redeemed */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#7C3AED' }}>
                Diamonds Redeemed
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-purple" title="Diamonds Redeemed">
                <Gem size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#7C3AED' }}>
              <span>💎 {totalPointsSpent}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Diamonds</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Milestone points spent
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              Redeemed
            </span>
          </div>
        </div>

        {/* Card 3: In Transit / Dispatched */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #38BDF8, #0284C7)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#0284C7' }}>
                In Transit / Dispatched
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-cyan" title="In Transit">
                <Truck size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: inTransitCount > 0 ? '#0284C7' : '#0F172A' }}>
              <span>{inTransitCount}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Shipments</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Active courier AWB assigned
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
              In Transit
            </span>
          </div>
        </div>

        {/* Card 4: Successfully Delivered */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #34D399, #059669)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#059669' }}>
                Successfully Delivered
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-emerald" title="Delivered">
                <CheckCircle2 size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: deliveredCount > 0 ? '#059669' : '#0F172A' }}>
              <span>{deliveredCount}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Delivered</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Door delivery completed
            </span>
            <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
              Delivered
            </span>
          </div>
        </div>
      </div>

      {/* Sleek Unified 3D Filter & Search Command Bar */}
      <div
        className="van-dir-toolbar-3d"
        style={{
          padding: '1.15rem 1.45rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Left: Search Bar with 3D Icon Pod */}
        <div className="van-dir-search-wrap">
          <div className="van-dir-search-icon-pod">
            <Search size={16} color="#2563EB" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by claim code, reward item, courier, city, or AWB tracking..."
            className="van-dir-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="van-dir-search-clear"
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Status Filter Capsule + Count + Refresh Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter Capsule */}
          <div className="van-dir-filter-capsule">
            <ShieldCheck size={15} color="#10b981" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Fulfillment Statuses ({claims.length})</option>
              <option value="pending">⏳ Pending Dispatch ({pendingCount})</option>
              <option value="dispatched">🚚 In Transit / Dispatched ({inTransitCount})</option>
              <option value="delivered">✓ Successfully Delivered ({deliveredCount})</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="van-dir-reset-btn"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}

          {/* Order Count Pill */}
          <span className="van-dir-count-pill">
            {filteredClaims.length} Order{filteredClaims.length === 1 ? '' : 's'}
          </span>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={() => loadClaims(true)}
            disabled={refreshing}
            title="Sync claims with database"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.52rem 0.95rem',
              borderRadius: '9999px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* DataTable Container with Enhanced 3D Framing */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)',
        }}
      >
        <DataTable
          columns={columns}
          data={filteredClaims}
          defaultPageSize={10}
          searchable={false}
          showPageSize={false}
          loading={loading}
          emptyMessage="No milestone reward claims found. Check Available Rewards to redeem your Diamonds!"
        />
      </div>

      {/* ============================================================== */}
      {/* CLAIM FULFILLMENT DETAILS MODAL                                */}
      {/* ============================================================== */}
      {selectedClaim && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedClaim(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.45)',
              border: '1.5px solid #e2e8f0',
              padding: '2.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    marginBottom: '0.4rem',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <PackageCheck size={14} />
                  <span>CLAIM RECORD</span> • <span>{selectedClaim.claim_code}</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Fulfillment & Courier Tracking
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              >
                ✕
              </button>
            </div>

            {/* Stepper: Fulfillment Timeline */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                Fulfillment Journey Stepper
              </div>

              <div className="van-claim-stepper-grid">
                {/* Step 1: Claim Placed */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.4rem auto',
                      boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  </div>
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block' }}>1. Placed</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{formatDate(selectedClaim.claim_date)}</span>
                </div>

                {/* Step 2: Dispatched */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background:
                        selectedClaim.status === 'dispatched' || selectedClaim.status === 'delivered'
                          ? '#0284c7'
                          : '#e2e8f0',
                      color:
                        selectedClaim.status === 'dispatched' || selectedClaim.status === 'delivered'
                          ? '#ffffff'
                          : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.4rem auto',
                      boxShadow:
                        selectedClaim.status === 'dispatched' || selectedClaim.status === 'delivered'
                          ? '0 3px 10px rgba(2, 132, 199, 0.3)'
                          : 'none',
                    }}
                  >
                    <Truck size={18} strokeWidth={2.2} />
                  </div>
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block' }}>2. Dispatched</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {selectedClaim.status === 'dispatched' || selectedClaim.status === 'delivered'
                      ? 'In Transit'
                      : 'Queued'}
                  </span>
                </div>

                {/* Step 3: Delivered */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: selectedClaim.status === 'delivered' ? '#10b981' : '#e2e8f0',
                      color: selectedClaim.status === 'delivered' ? '#ffffff' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.4rem auto',
                      boxShadow:
                        selectedClaim.status === 'delivered'
                          ? '0 3px 10px rgba(16, 185, 129, 0.3)'
                          : 'none',
                    }}
                  >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  </div>
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block' }}>3. Delivered</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {selectedClaim.status === 'delivered' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Reward Item Summary */}
            <div
              style={{
                display: 'flex',
                gap: '1.25rem',
                background: '#f8fafc',
                padding: '1.25rem 1.4rem',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                marginBottom: '1.5rem',
                alignItems: 'center',
              }}
            >
              <img
                src={selectedClaim.reward_image || selectedClaim.reward?.image || '/logo.png'}
                alt={selectedClaim.reward_title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                }}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '14px',
                  objectFit: 'cover',
                  border: '1.5px solid #cbd5e1',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  {selectedClaim.reward?.category || 'Milestone Award'}
                </span>
                <h4 style={{ margin: '0.2rem 0 0.35rem 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                  {selectedClaim.reward_title || selectedClaim.reward?.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.45 }}>
                  {selectedClaim.reward?.description || 'Official milestone physical award fulfillment.'}
                </p>
              </div>
            </div>

            {/* Key Value Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Market Worth</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedClaim.reward?.reward_value_inr ? `₹${Number(selectedClaim.reward.reward_value_inr).toLocaleString('en-IN')}` : '—'}
                </div>
              </div>

              <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '12px', border: '1.5px solid #ddd6fe' }}>
                <span style={{ fontSize: '0.72rem', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 700 }}>Diamonds Spent</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#6d28d9', marginTop: '0.2rem' }}>
                  💎 {selectedClaim.points_deducted}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Claim Date</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                  {formatDate(selectedClaim.claim_date)}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Order Status</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.22rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background:
                        selectedClaim.status === 'delivered' ? '#ecfdf5' :
                        selectedClaim.status === 'dispatched' ? '#eff6ff' :
                        selectedClaim.status === 'pending' ? '#fefce8' : '#fef2f2',
                      color:
                        selectedClaim.status === 'delivered' ? '#059669' :
                        selectedClaim.status === 'dispatched' ? '#0284c7' :
                        selectedClaim.status === 'pending' ? '#d97706' : '#dc2626',
                    }}
                  >
                    ● {selectedClaim.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Courier & Tracking Details */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '1.35rem',
                border: '1.5px solid #e2e8f0',
                marginBottom: '1.35rem',
              }}
            >
              <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.925rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Truck size={17} color="#2563EB" />
                <span>Courier & Shipment Tracking</span>
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Courier Partner:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {selectedClaim.courier_partner || 'Carrier assignment in progress'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Air Waybill (AWB) / Tracking #:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: selectedClaim.tracking_number ? '#0284c7' : '#64748b', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      {selectedClaim.tracking_number || 'Pending shipment dispatch'}
                    </strong>
                    {selectedClaim.tracking_number && (
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedClaim.tracking_number, 'AWB Tracking Number')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          cursor: 'pointer',
                          padding: '0.15rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Copy AWB Tracking Number"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(!selectedClaim.status || selectedClaim.status === 'pending') && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 0.95rem', background: '#fefce8', borderRadius: '10px', border: '1px solid #fef08a', fontSize: '0.825rem', color: '#854d0e', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <AlertCircle size={16} color="#854d0e" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>Your claim is registered and queued for verification. Courier AWB tracking number will automatically update here as soon as dispatched.</div>
                </div>
              )}
              {selectedClaim.status === 'dispatched' && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 0.95rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '0.825rem', color: '#1e40af', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Truck size={16} color="#1e40af" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>Package is currently in transit with <strong>{selectedClaim.courier_partner || 'courier partner'}</strong>.</div>
                </div>
              )}
              {selectedClaim.status === 'delivered' && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 0.95rem', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.825rem', color: '#166534', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="#166534" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>Successfully delivered to your designated delivery destination.</div>
                </div>
              )}
            </div>

            {/* Delivery Destination */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '1.35rem',
                border: '1.5px solid #e2e8f0',
                marginBottom: '1.75rem',
              }}
            >
              <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.925rem', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MapPin size={17} color="#2563EB" />
                <span>Delivery Destination & Recipient</span>
              </h5>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                <div>
                  <strong>Address: </strong>
                  {selectedClaim.shipping_address}, {selectedClaim.shipping_city}, {selectedClaim.shipping_state} - {selectedClaim.shipping_pincode}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>Contact Phone: </strong>
                  {selectedClaim.shipping_phone || currentUser?.phone || 'On file with profile'}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>Member Code: </strong>
                  {selectedClaim.user_code || userCode}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                style={{
                  background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.7rem 1.6rem',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                }}
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardsClaimed;