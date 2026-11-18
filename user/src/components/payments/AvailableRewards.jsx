import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  Gem,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Search,
  X,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Award,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Package,
} from 'lucide-react';
import {
  getUserRewards,
  getUserFreshProfile,
  getUserDiamondRewards,
} from '../../api/userRewardService';

const formatDiamonds = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num) || num === 0) return '0';
  return Number(num.toFixed(4)).toString();
};

function AvailableRewards({ user, onNavigate }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user || null);

  const [rawRewards, setRawRewards] = useState([]);
  const [diamondWallet, setDiamondWallet] = useState({
    diamond_balance: 0,
    level_1_diamonds: 0,
    level_2_diamonds: 0,
    conversion_rate_inr: 100,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all | ready | locked
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const userDiamonds = Number(diamondWallet.diamond_balance) || 0;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadData = useCallback(async (showNotice = false) => {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);

      const [rewardsData, freshUser, diamondData] = await Promise.all([
        getUserRewards(),
        getUserFreshProfile(),
        getUserDiamondRewards(),
      ]);

      setRawRewards(rewardsData || []);
      if (diamondData?.wallet) {
        setDiamondWallet(diamondData.wallet);
      }
      if (freshUser) {
        setCurrentUser(freshUser);
      }

      if (showNotice) {
        showToast('✓ Diamond Balance and Rewards synced from database!');
      }
    } catch (err) {
      console.error('Error fetching available rewards data:', err);
      showToast('Could not refresh rewards catalog from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNavigate = (path) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  // 1. Filter out inactive/deleted rewards & deduplicate by ID
  const activeRewards = useMemo(() => {
    const seen = new Set();
    const result = [];
    (rawRewards || []).forEach((r) => {
      if (!r || !r.id || seen.has(r.id)) return;
      if (r.status && r.status !== 'active') return;
      if (r.is_active === false || r.is_active === 0 || r.is_active === '0') return;
      seen.add(r.id);
      result.push(r);
    });
    return result;
  }, [rawRewards]);

  // 2. Distinct categories from active rewards
  const categories = useMemo(() => {
    const set = new Set();
    activeRewards.forEach((r) => {
      if (r.category && typeof r.category === 'string') {
        const cat = r.category.trim();
        if (cat) set.add(cat);
      }
    });
    return Array.from(set).sort();
  }, [activeRewards]);

  // 3. Filter active rewards by search query, category, and eligibility status
  const filteredRewards = useMemo(() => {
    return activeRewards.filter((reward) => {
      // Search by reward name, category, or description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = reward.title?.toLowerCase().includes(q);
        const catMatch = reward.category?.toLowerCase().includes(q);
        const descMatch = reward.description?.toLowerCase().includes(q);
        if (!titleMatch && !catMatch && !descMatch) {
          return false;
        }
      }

      // Filter by category
      if (selectedCategory !== 'all' && reward.category !== selectedCategory) {
        return false;
      }

      // Filter by eligibility status
      const required = Number(reward.required_bp) || 0;
      const isEligible = userDiamonds >= required;
      if (selectedStatus === 'ready' && !isEligible) {
        return false;
      }
      if (selectedStatus === 'locked' && isEligible) {
        return false;
      }

      return true;
    });
  }, [activeRewards, searchQuery, selectedCategory, selectedStatus, userDiamonds]);

  // 4. Calculate nearest locked milestone (if any)
  const nearestMilestone = useMemo(() => {
    const locked = activeRewards
      .map((r) => {
        const req = Number(r.required_bp) || 0;
        return { ...r, req, deficit: req - userDiamonds };
      })
      .filter((r) => r.deficit > 0)
      .sort((a, b) => a.deficit - b.deficit);
    return locked.length > 0 ? locked[0] : null;
  }, [activeRewards, userDiamonds]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRewards.length / pageSize));
  const paginatedRewards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRewards.slice(start, start + pageSize);
  }, [filteredRewards, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const eligibleCount = activeRewards.filter(
    (r) => userDiamonds >= (Number(r.required_bp) || 0)
  ).length;

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
            <Gift size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Finance • Milestone Rewards Catalog</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Available Milestone Rewards
            </h1>
            <p className="van-catalog-hero-desc">
              Explore eligible physical products, gadgets, and luxury milestones unlocked through your accumulated Diamond balance.
            </p>
          </div>
        </div>

        {/* Right Diamond Wallet Pod & Actions */}
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
          {/* Diamond Balance Glass Pod */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: '0.9rem 1.4rem',
              textAlign: 'center',
              minWidth: '220px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#c7d2fe',
                fontWeight: 800,
                display: 'block',
              }}
            >
              Your Diamond Balance
            </span>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 900,
                color: '#fbbf24',
                marginTop: '0.2rem',
                textShadow: '0 2px 10px rgba(251, 191, 36, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>💎</span>
              <span>{formatDiamonds(userDiamonds)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              Member ID: #{currentUser?.id || '—'}
            </span>
          </div>

          {/* Fast Navigation & Sync Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => loadData(true)}
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
              <span>{refreshing ? 'Syncing...' : 'Sync Wallet'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards')}
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
              <BarChart3 size={14} />
              <span>Reward Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Premium 3D KPI Summary Pods Grid */}
      <div
        className="van-business-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Card 1: Total Catalog Rewards */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#2563EB' }}>
                Catalog Rewards
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-blue" title="Catalog Rewards">
                <Gift size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value">
              <span>{activeRewards.length}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Products</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Active milestone tiers
            </span>
            <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              Active
            </span>
          </div>
        </div>

        {/* Card 2: Unlocked & Eligible */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #34D399, #059669)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#059669' }}>
                Ready to Claim
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-emerald" title="Ready to Claim">
                <CheckCircle2 size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#059669' }}>
              <span>{eligibleCount}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Unlocked</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {eligibleCount > 0 ? 'Eligible for claim' : 'Accumulate Diamonds'}
            </span>
            <span
              className="van-card-badge-pill"
              style={{
                background: eligibleCount > 0 ? '#ECFDF5' : '#F1F5F9',
                color: eligibleCount > 0 ? '#047857' : '#64748B',
                border: `1px solid ${eligibleCount > 0 ? '#A7F3D0' : '#E2E8F0'}`,
              }}
            >
              {eligibleCount > 0 ? '✓ Claimable' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Card 3: Your Diamond Balance */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #38BDF8, #0284C7)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#0284C7' }}>
                Diamond Balance
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-cyan" title="Diamond Balance">
                <Gem size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#0284C7' }}>
              <span>💎 {formatDiamonds(userDiamonds)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Level 1 & 2 earnings
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
              Balance
            </span>
          </div>
        </div>

        {/* Card 4: Next Target Milestone */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #FBBF24, #D97706)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#D97706' }}>
                Next Target Milestone
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-amber" title="Target Milestone">
                <Award size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div
              className="van-stat-card-value"
              style={{
                fontSize: '1.2rem',
                lineHeight: '1.3',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={nearestMilestone ? nearestMilestone.title : 'All Milestones Achieved!'}
            >
              <span>{nearestMilestone ? nearestMilestone.title : 'All Unlocked! 🎉'}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              {nearestMilestone
                ? `Need ${formatDiamonds(nearestMilestone.deficit)} more 💎`
                : 'All rewards unlocked'}
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
              {nearestMilestone ? 'Target' : 'Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Proven Executive 2-Tier 3D Filter Command Toolbar */}
      <div className="van-dir-toolbar-3d" style={{ marginBottom: '2rem' }}>
        {/* Tier 1: Search Bar & Count Action */}
        <div className="van-dir-toolbar-top">
          <div className="van-dir-search-wrap" style={{ flex: '1 1 380px' }}>
            <div className="van-dir-search-icon-pod">
              <Search size={16} color="#2563EB" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rewards by name, category, or specification..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="van-dir-count-pill">
              {filteredRewards.length} Product{filteredRewards.length === 1 ? '' : 's'} Found
            </span>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="Sync rewards catalog with database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.52rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Catalog'}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="van-dir-toolbar-divider" />

        {/* Tier 2: Filter Capsules */}
        <div className="van-dir-toolbar-bottom">
          {/* Category Filter Capsule */}
          <div className="van-dir-filter-capsule">
            <Layers size={15} color="#6366f1" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories ({activeRewards.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability / Eligibility Filter Capsule */}
          <div className="van-dir-filter-capsule">
            <ShieldCheck size={15} color="#10b981" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Eligibility Statuses</option>
              <option value="ready">✓ Eligible to Claim ({eligibleCount})</option>
              <option value="locked">🔒 Locked ({activeRewards.length - eligibleCount})</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="van-dir-reset-btn"
            >
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Rewards Catalog Content */}
      {loading ? (
        <div
          style={{
            padding: '5rem 2rem',
            textAlign: 'center',
            color: '#64748b',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)',
            }}
          >
            <RotateCcw size={28} color="#2563EB" className="spin-anim" />
          </div>
          <h3 style={{ margin: '0 0 0.4rem 0', color: '#0f172a', fontWeight: 800, fontSize: '1.25rem' }}>
            Loading Milestone Rewards...
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Fetching live catalog specifications and diamond calculations from database.</p>
        </div>
      ) : filteredRewards.length === 0 ? (
        <div
          style={{
            padding: '4.5rem 2rem',
            textAlign: 'center',
            color: '#64748b',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <Package size={32} color="#64748B" />
          </div>
          <h3 style={{ margin: '0 0 0.4rem 0', color: '#0f172a', fontWeight: 800, fontSize: '1.25rem' }}>
            No Matching Rewards Found
          </h3>
          <p style={{ margin: '0 auto 1.5rem auto', fontSize: '0.875rem', maxWidth: '440px', lineHeight: 1.5 }}>
            No milestone products match your selected search keywords or filters. Try adjusting your query or reset filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            style={{
              background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.45rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <RotateCcw size={15} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <>
          {/* Responsive 3D Product Card Grid */}
          <div className="available-rewards-grid">
            {paginatedRewards.map((reward) => {
              const requiredDiamonds = Number(reward.required_bp) || 0;
              const isEligible = userDiamonds >= requiredDiamonds;
              const deficit = Math.max(0, requiredDiamonds - userDiamonds);
              const worthFormatted = Number(reward.reward_value_inr || 0).toLocaleString('en-IN');
              const progressPct = requiredDiamonds > 0
                ? Math.min(100, Math.round((userDiamonds / requiredDiamonds) * 100))
                : 100;

              return (
                <div key={reward.id} className={`reward-product-card ${isEligible ? 'eligible' : 'locked'}`}>
                  {/* Product Image Area with Subtle Radial Backdrop */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '195px',
                      background: 'radial-gradient(circle at center, #F8FAFC 0%, #EEF2F6 100%)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <img
                      src={reward.image || '/logo.png'}
                      alt={reward.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logo.png';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.35s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />

                    {/* Category Capsule Tag */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        padding: '0.24rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {reward.category || 'Milestone'}
                    </span>

                    {/* Eligibility Status Pill */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: isEligible ? 'rgba(16, 185, 129, 0.95)' : 'rgba(217, 119, 6, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        padding: '0.24rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: isEligible
                          ? '0 4px 12px rgba(16, 185, 129, 0.35)'
                          : '0 4px 12px rgba(217, 119, 6, 0.35)',
                      }}
                    >
                      {isEligible ? (
                        <>
                          <CheckCircle2 size={13} strokeWidth={2.5} />
                          <span>Unlocked</span>
                        </>
                      ) : (
                        <>
                          <Lock size={13} strokeWidth={2.5} />
                          <span>Locked</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Product Details & Information */}
                  <div
                    style={{
                      padding: '1.25rem 1.35rem 1.15rem 1.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      {/* Reward Title */}
                      <h3
                        style={{
                          fontSize: '1.08rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          margin: '0 0 0.5rem 0',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {reward.title}
                      </h3>

                      {/* Retail Worth Pill */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.9rem',
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Category: <strong style={{ color: '#334155' }}>{reward.category || 'General'}</strong>
                        </span>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            background: '#f1f5f9',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          ₹{worthFormatted} Value
                        </span>
                      </div>

                      {/* Requirements & Balance Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '0.85rem 0.95rem',
                          marginBottom: '0.9rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                          <span style={{ color: '#64748b' }}>Required Diamonds:</span>
                          <span style={{ fontWeight: 800, color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>💎</span> {requiredDiamonds.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                          <span style={{ color: '#64748b' }}>Your Balance:</span>
                          <span style={{ fontWeight: 800, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>💎</span> {formatDiamonds(userDiamonds)}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            marginBottom: '0.35rem',
                          }}
                        >
                          <span style={{ color: isEligible ? '#059669' : '#d97706' }}>
                            {isEligible ? 'Milestone Complete' : `${progressPct}% Milestone Progress`}
                          </span>
                          <span style={{ color: '#64748b' }}>
                            {isEligible ? 'Ready to Claim' : `${formatDiamonds(deficit)} 💎 to go`}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background: isEligible
                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                : 'linear-gradient(90deg, #f59e0b, #d97706)',
                              borderRadius: '9999px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* View Details Action Button */}
                    <button
                      type="button"
                      onClick={() => handleNavigate(`/payments/rewards/${reward.id}`)}
                      style={{
                        width: '100%',
                        padding: '0.72rem 1rem',
                        background: isEligible
                          ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                          : 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        boxShadow: isEligible
                          ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                          : '0 4px 14px rgba(30, 64, 175, 0.2)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>{isEligible ? 'Claim Reward Now' : 'View Details & Specs'}</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modern Pagination Bar */}
          {filteredRewards.length > pageSize && (
            <div
              style={{
                padding: '1.15rem 1.5rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                background: '#ffffff',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing Page <strong style={{ color: '#0f172a' }}>{currentPage}</strong> of{' '}
                <strong style={{ color: '#0f172a' }}>{totalPages}</strong> ({filteredRewards.length} total rewards)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                    color: currentPage <= 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      minWidth: '36px',
                      height: '36px',
                      padding: '0 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: currentPage === page ? '#1e40af' : '#cbd5e1',
                      background: currentPage === page ? '#1e40af' : '#ffffff',
                      color: currentPage === page ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: currentPage === page ? '0 2px 8px rgba(30, 64, 175, 0.25)' : 'none',
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                    color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AvailableRewards;