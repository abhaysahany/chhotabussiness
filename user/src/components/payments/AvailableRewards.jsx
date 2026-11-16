import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header with Compact Diamond Balance Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Available Rewards
            </h1>

            {/* Small Compact Diamond Balance Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              <span style={{ color: '#64748b', fontWeight: 600 }}>Your Diamond Balance:</span>
              <span style={{ color: '#0284c7' }}>💎 {formatDiamonds(userDiamonds)}</span>
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.4rem 0 0 0' }}>
            Browse active milestone rewards. Click View Details on any product to see complete specifications and claim options.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>🔄</span> {refreshing ? 'Syncing...' : 'Sync Wallet'}
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('/payments/rewards')}
            style={{
              background: '#f1f5f9',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>📊</span> Reward Overview
          </button>
        </div>
      </div>

      {/* Compact Search & Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search by Reward Name */}
        <div style={{ flex: '1 1 260px', minWidth: '220px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rewards by name..."
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              outline: 'none',
              color: '#0f172a',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.825rem',
              color: '#334155',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <option value="all">All Categories ({activeRewards.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Availability / Eligibility Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.825rem',
              color: '#334155',
              background: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <option value="all">All Statuses</option>
            <option value="ready">✓ Eligible to Claim ({eligibleCount})</option>
            <option value="locked">🔒 Locked ({activeRewards.length - eligibleCount})</option>
          </select>

          {/* Reset Filters Button */}
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.55rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}

          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.25rem' }}>
            {filteredRewards.length} {filteredRewards.length === 1 ? 'product' : 'products'}
          </span>
        </div>
      </div>

      {/* Rewards Catalog Content */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontWeight: 800 }}>Loading Rewards Catalog...</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Fetching available milestone products from database.</p>
        </div>
      ) : filteredRewards.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
          <h4 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontWeight: 800 }}>No Rewards Found</h4>
          <p style={{ margin: '0 auto 1.25rem auto', fontSize: '0.85rem', maxWidth: '420px' }}>
            No milestone rewards match your search criteria. Try adjusting your search query or category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            style={{
              background: '#1e40af',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Responsive Product Card Grid */}
          <div className="available-rewards-grid">
            {paginatedRewards.map((reward) => {
              const requiredDiamonds = Number(reward.required_bp) || 0;
              const isEligible = userDiamonds >= requiredDiamonds;
              const deficit = Math.max(0, requiredDiamonds - userDiamonds);
              const worthFormatted = Number(reward.reward_value_inr || 0).toLocaleString('en-IN');

              return (
                <div key={reward.id} className={`reward-product-card ${isEligible ? 'eligible' : 'locked'}`}>
                  {/* Product Image */}
                  <div style={{ position: 'relative', width: '100%', height: '180px', background: '#f8fafc', overflow: 'hidden' }}>
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
                      }}
                    />

                    {/* Category Overlay Tag */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {reward.category || 'Milestone'}
                    </span>

                    {/* Eligibility Badge on Image */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: isEligible ? 'rgba(22, 163, 74, 0.95)' : 'rgba(217, 119, 6, 0.95)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {isEligible ? '✓ Unlocked' : '🔒 Locked'}
                    </span>
                  </div>

                  {/* Product Info & Specs */}
                  <div
                    style={{
                      padding: '1.1rem 1.15rem 0.85rem 1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Reward Name */}
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          margin: '0 0 0.35rem 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {reward.title}
                      </h3>

                      {/* Category */}
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.85rem' }}>
                        Category: <span style={{ fontWeight: 600, color: '#334155' }}>{reward.category || 'General'}</span>
                      </div>

                      {/* Specs Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '0.75rem 0.85rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        {/* Market Worth */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                          <span style={{ color: '#64748b' }}>Market Worth:</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{worthFormatted}</span>
                        </div>

                        {/* Diamonds Required */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                          <span style={{ color: '#64748b' }}>Required:</span>
                          <span style={{ fontWeight: 800, color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span>💎</span> {requiredDiamonds.toLocaleString('en-IN')} Diamonds
                          </span>
                        </div>

                        {/* Member Balance */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                          <span style={{ color: '#64748b' }}>Member Balance:</span>
                          <span style={{ fontWeight: 700, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span>💎</span> {formatDiamonds(userDiamonds)}
                          </span>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div style={{ marginBottom: '0.85rem' }}>
                        {isEligible ? (
                          <div
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#15803d',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>✓</span> Status: Eligible to Claim
                          </div>
                        ) : (
                          <div
                            style={{
                              background: '#fef3c7',
                              border: '1px solid #fde68a',
                              color: '#b45309',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>🔒</span> Status: Locked — {formatDiamonds(deficit)} more Diamonds required
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Details Action Button */}
                    <button
                      type="button"
                      onClick={() => handleNavigate(`/payments/rewards/${reward.id}`)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        background: 'linear-gradient(105deg, #0B192C 0%, #1E40AF 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 4px rgba(30, 64, 175, 0.15)',
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.92';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {filteredRewards.length > pageSize && (
            <div
              style={{
                padding: '1rem 1.25rem',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                background: '#ffffff',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                    color: currentPage <= 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  ← Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '0.45rem 0.8rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: currentPage === page ? '#1e40af' : '#cbd5e1',
                      background: currentPage === page ? '#1e40af' : '#ffffff',
                      color: currentPage === page ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.8rem',
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
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                    color: currentPage >= totalPages ? '#94a3b8' : '#334155',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  Next →
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
