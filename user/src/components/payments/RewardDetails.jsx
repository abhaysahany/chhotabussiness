import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gem,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  Gift,
  Award,
  ExternalLink,
  Calendar,
  User,
  Layers,
  TrendingUp,
  Wallet,
  ChevronRight,
  Coins,
} from 'lucide-react';
import { getUserRewards, getUserFreshProfile, getUserDiamondRewards } from '../../api/userRewardService';
import { formatDateTime } from '../../utils/timezone';

const formatDiamonds = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num) || num === 0) return '0';
  return Number(num.toFixed(4)).toString();
};

function RewardDetails({ user, onNavigate }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [rewards, setRewards] = useState([]);
  const [diamondWallet, setDiamondWallet] = useState({
    diamond_balance: 0,
    level_1_diamonds: 0,
    level_2_diamonds: 0,
    conversion_rate_inr: 100,
  });
  const [diamondTransactions, setDiamondTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const userDiamonds = Number(diamondWallet.diamond_balance) || 0;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadDatabaseData = useCallback(async (showToastNotice = false) => {
    try {
      if (showToastNotice) setRefreshing(true);
      else setLoading(true);

      const [rewardsData, freshUser, diamondData] = await Promise.all([
        getUserRewards(),
        getUserFreshProfile(),
        getUserDiamondRewards(),
      ]);

      setRewards(rewardsData || []);
      if (diamondData?.wallet) {
        setDiamondWallet(diamondData.wallet);
      }
      setDiamondTransactions(diamondData?.transactions || []);

      if (freshUser) {
        setCurrentUser(freshUser);
      }

      if (showToastNotice) {
        showToast('✓ Synced with database successfully!');
      }
    } catch (err) {
      console.error('Error fetching database rewards:', err);
      showToast('Could not load rewards catalog from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  const handleNavigate = (path) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleNavigateToReward = (rewardId) => {
    handleNavigate(`/payments/rewards/${rewardId}`);
  };

  const eligibleRewards = rewards.filter((r) => userDiamonds >= (Number(r.required_bp) || 0));
  const lockedRewards = rewards.filter((r) => userDiamonds < (Number(r.required_bp) || 0)).sort((a, b) => (Number(a.required_bp) || 0) - (Number(b.required_bp) || 0));
  const nextMilestone = lockedRewards[0] || null;

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.9rem 1.4rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 12px 28px -4px rgba(0,0,0,0.3)',
            fontSize: '0.86rem',
            fontWeight: 800,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Gem size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Finance • Diamond Rewards & Milestone Dossier</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Diamond Wallet & Reward Overview
            </h1>
            <p className="van-catalog-hero-desc">
              Track your 2-Level Diamond accumulations, conversion rate, wallet transaction history, and milestone progress.
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
              padding: '1rem 1.5rem',
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
                fontSize: '2rem',
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
              <span>{formatDiamonds(diamondWallet.diamond_balance)}</span>
              <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>Diamonds</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#e2e8f0', display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
              Member: <strong style={{ color: '#38bdf8' }}>{currentUser?.user_code || userCode || 'Database User'}</strong>
            </span>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => loadDatabaseData(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.55rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
          >
            <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Database Wallet'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: My Diamond Rewards (Two-Level Sponsor Reward System) */}
      <section
        aria-label="My Diamond Rewards"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.75rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)',
              }}
            >
              <Gem size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                My Diamond Rewards
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Non-cash sponsor reward Diamonds earned from Level 1 (Direct Sponsor) and Level 2 (Sponsor's Sponsor) reward allocations.
              </p>
            </div>
          </div>

          <span
            style={{
              background: '#ecfeff',
              border: '1px solid #a5f3fc',
              color: '#0891b2',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(8, 145, 178, 0.15)',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} />
            Conversion Rate: ₹{Number(diamondWallet.conversion_rate_inr || 100)} = 1 Diamond
          </span>
        </div>

        {/* 3 Signature 3D Diamond Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.15rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Card 1: Total Diamond Balance */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #06B6D4, #0891B2)' }} />
            <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
              <span
                className="van-stat-card-title"
                style={{
                  color: '#0891B2',
                  whiteSpace: 'normal',
                  lineHeight: 1.3,
                  fontSize: '0.78rem',
                }}
              >
                Total Diamond Balance
              </span>
              <div
                className="van-3d-kpi-icon van-3d-icon-cyan"
                style={{ animationDelay: '0s' }}
                title="Non-cash reward balance"
              >
                <Gem size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#155E75' }}>
              💎 {formatDiamonds(diamondWallet.diamond_balance)}
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                Non-cash reward balance
              </span>
              <span className="van-card-badge-pill cyan">
                Total Balance
              </span>
            </div>
          </div>

          {/* Card 2: Reward Level 1 Diamonds */}
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
                Reward Level 1 Diamonds
              </span>
              <div
                className="van-3d-kpi-icon van-3d-icon-blue"
                style={{ animationDelay: '0.4s' }}
                title="Earned as Direct Sponsor"
              >
                <Sparkles size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#1D4ED8' }}>
              {formatDiamonds(diamondWallet.level_1_diamonds)} 💎
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                Earned as Direct Sponsor
              </span>
              <span className="van-card-badge-pill blue">
                Level 1 Sponsor
              </span>
            </div>
          </div>

          {/* Card 3: Reward Level 2 Diamonds */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)' }} />
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
                Reward Level 2 Diamonds
              </span>
              <div
                className="van-3d-kpi-icon van-3d-icon-purple"
                style={{ animationDelay: '0.8s' }}
                title="Earned as Sponsor's Sponsor"
              >
                <Layers size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#6D28D9' }}>
              {formatDiamonds(diamondWallet.level_2_diamonds)} 💎
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                Earned as Sponsor's Sponsor
              </span>
              <span className="van-card-badge-pill purple">
                Level 2 Indirect
              </span>
            </div>
          </div>
        </div>

        {/* Recent Diamond Transactions Table */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.15rem 1.35rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              Recent Diamond Transactions
            </h3>
            <span
              style={{
                fontSize: '0.78rem',
                background: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontWeight: 700,
              }}
            >
              {diamondTransactions.length} Transaction{diamondTransactions.length === 1 ? '' : 's'}
            </span>
          </div>

          {diamondTransactions.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.85rem auto',
                }}
              >
                <Gem size={24} />
              </div>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem', fontSize: '1rem' }}>
                No Diamond Transactions Recorded
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Diamond reward distributions will appear here when direct downlines and level 2 members make eligible purchases.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Source</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reward Level</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reward Amount</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Diamonds</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Credit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {diamondTransactions.map((tx) => {
                    const isReversal = tx.transaction_type === 'reversal' || tx.transaction_type === 'debit' || Number(tx.diamond_quantity) < 0;
                    return (
                      <tr
                        key={tx.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                          <div>{tx.source || tx.source_reference}</div>
                          {tx.source_member_code && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500, marginTop: '0.15rem' }}>
                              Member: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{tx.source_member_code}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background: Number(tx.reward_level) === 1 ? '#dbeafe' : '#f3e8ff',
                              color: Number(tx.reward_level) === 1 ? '#1d4ed8' : '#7c3aed',
                              border: `1px solid ${Number(tx.reward_level) === 1 ? '#bfdbfe' : '#e9d5ff'}`,
                            }}
                          >
                            Level {tx.reward_level}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: isReversal ? '#dc2626' : '#0f172a' }}>
                          ₹{Math.abs(Number(tx.allocated_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: isReversal ? '#dc2626' : '#0891b2' }}>
                          {isReversal ? '-' : '+'}{formatDiamonds(Math.abs(Number(tx.diamond_quantity || 0)))} 💎
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} color="#94a3b8" />
                            <span>{formatDateTime(tx.created_at)}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Milestone Rewards Catalog Hub (Spacious & Breathable Layout) */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '2.25rem 2.5rem',
          boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.06)',
          marginBottom: '2rem',
        }}
      >
        {/* Section Header with Generous Spacing */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            paddingBottom: '1.75rem',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px -3px rgba(79, 70, 229, 0.4)',
                flexShrink: 0,
              }}
            >
              <Gift size={26} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    background: '#eef2ff',
                    color: '#4338ca',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                  }}
                >
                  Official Rewards Tier
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Milestone Rewards Catalog
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0.35rem 0 0 0', maxWidth: '640px', lineHeight: 1.5 }}>
                Milestone physical products, electronic gadgets, luxury tours, and automobile awards organized by tier achievements.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards/available')}
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.45rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 22px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
              }}
            >
              <span>📋</span>
              <span>Browse Available Rewards (Table View) →</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards-claimed')}
              style={{
                background: '#ffffff',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '0.75rem 1.35rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <Package size={16} color="#64748b" />
              <span>View Claimed Rewards</span>
            </button>
          </div>
        </div>

        {/* 3 Spacious Milestone Status KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '1.35rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Card 1: Catalog Items */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden', padding: '1.5rem 1.65rem' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
            <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
              <span
                className="van-stat-card-title"
                style={{
                  color: '#2563EB',
                  whiteSpace: 'normal',
                  lineHeight: 1.3,
                  fontSize: '0.8rem',
                }}
              >
                Catalog Items
              </span>
              <div
                className="van-3d-kpi-icon van-3d-icon-blue"
                style={{ animationDelay: '0s' }}
                title="Active in milestone tiers"
              >
                <Package size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#0F172A', margin: '0.85rem 0' }}>
              {rewards.length} Products
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                Active in milestone tiers
              </span>
              <span className="van-card-badge-pill blue">
                Catalog
              </span>
            </div>
          </div>

          {/* Card 2: Ready to Claim Now */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden', padding: '1.5rem 1.65rem' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
            <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
              <span
                className="van-stat-card-title"
                style={{
                  color: '#059669',
                  whiteSpace: 'normal',
                  lineHeight: 1.3,
                  fontSize: '0.8rem',
                }}
              >
                Ready to Claim Now
              </span>
              <div
                className="van-3d-kpi-icon van-3d-icon-emerald"
                style={{ animationDelay: '0.4s' }}
                title="Your Diamond balance qualifies!"
              >
                <CheckCircle2 size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#15803D', margin: '0.85rem 0' }}>
              ✓ {eligibleRewards.length} Unlocked
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                {eligibleRewards.length > 0 ? 'Your Diamond balance qualifies!' : 'Accumulate more Diamonds'}
              </span>
              <span className="van-card-badge-pill emerald">
                Eligible
              </span>
            </div>
          </div>

          {/* Card 3: Next Target Milestone */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden', padding: '1.5rem 1.65rem' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
            <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
              <span
                className="van-stat-card-title"
                style={{
                  color: '#D97706',
                  whiteSpace: 'normal',
                  lineHeight: 1.3,
                  fontSize: '0.8rem',
                }}
              >
                Next Target Milestone
              </span>
              <div
                className="van-3d-kpi-icon van-3d-icon-amber"
                style={{ animationDelay: '0.8s' }}
                title="Next tier milestone"
              >
                <Award size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div
              className="van-stat-card-value"
              style={{
                color: '#B45309',
                fontSize: '1.3rem',
                margin: '0.85rem 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={nextMilestone ? nextMilestone.title : 'All Milestones Achieved!'}
            >
              {nextMilestone ? nextMilestone.title : 'All Achieved! 🎉'}
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
                {nextMilestone ? `Requires ${nextMilestone.required_bp} 💎 (${formatDiamonds(nextMilestone.required_bp - userDiamonds)} to go)` : 'Congratulations!'}
              </span>
              <span className="van-card-badge-pill amber">
                Target
              </span>
            </div>
          </div>
        </div>

        {/* Featured Milestone Rewards Showcase (Generous, High-End Product Cards) */}
        <div style={{ paddingTop: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.35rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Featured Milestone Rewards Showcase
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Preview high-value milestone rewards unlocked through your accumulated diamond balance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/payments/rewards/available')}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#2563eb',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
              }}
            >
              <span>Open Full Table View ({rewards.length} Items)</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Compact Product Cards Grid (Short, Clean & Sleek - 4 Items 2x2 Grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.15rem',
            }}
          >
            {rewards.slice(0, 4).map((r) => {
              const req = Number(r.required_bp) || 0;
              const ready = userDiamonds >= req;
              return (
                <div
                  key={r.id}
                  onClick={() => handleNavigateToReward(r.id)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: ready ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    padding: '1rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    boxShadow: ready
                      ? '0 6px 16px -2px rgba(16, 185, 129, 0.12)'
                      : '0 2px 8px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 22px -4px rgba(15, 23, 42, 0.1)';
                    e.currentTarget.style.borderColor = ready ? '#10b981' : '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = ready
                      ? '0 6px 16px -2px rgba(16, 185, 129, 0.12)'
                      : '0 2px 8px rgba(15, 23, 42, 0.04)';
                    e.currentTarget.style.borderColor = ready ? '#86efac' : '#e2e8f0';
                  }}
                >
                  {/* Thumbnail Image Container */}
                  <div
                    style={{
                      width: '68px',
                      height: '68px',
                      background: 'radial-gradient(circle, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.4rem',
                      flexShrink: 0,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <img
                      src={r.image || '/logo.png'}
                      alt={r.title}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))',
                      }}
                      onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                    />
                  </div>

                  {/* Middle Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top Chips Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: '#64748b',
                          fontWeight: 800,
                          background: '#f8fafc',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {r.category || 'Reward'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: ready ? '#15803d' : '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {ready ? <CheckCircle2 size={11} color="#15803d" /> : <Clock size={11} color="#94a3b8" />}
                        <span>{ready ? 'Ready' : 'In Progress'}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '0.35rem',
                      }}
                      title={r.title}
                    >
                      {r.title}
                    </div>

                    {/* Diamond & Valuation Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#0891b2',
                          background: '#ecfeff',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '6px',
                          border: '1px solid #cffafe',
                        }}
                      >
                        💎 {formatDiamonds(r.required_bp)}
                      </span>

                      {r.reward_value_inr && (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                          ₹{Number(r.reward_value_inr).toLocaleString('en-IN')} Value
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact Action Button on Right */}
                  <div style={{ flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        background: ready ? '#ecfdf5' : '#eff6ff',
                        color: ready ? '#047857' : '#1d4ed8',
                        border: `1px solid ${ready ? '#a7f3d0' : '#bfdbfe'}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{ready ? 'Claim' : 'View'}</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default RewardDetails;
