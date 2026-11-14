import React, { useState, useEffect, useCallback } from 'react';
import { getUserRewards, claimReward, getUserFreshProfile, getUserDiamondRewards } from '../../api/userRewardService';
import { formatDateTime } from '../../utils/timezone';

const formatDiamonds = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num) || num === 0) return '0';
  return Number(num.toFixed(4)).toString();
};

function RewardDetails({ user }) {
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
  const [selectedReward, setSelectedReward] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userDiamonds = Number(diamondWallet.diamond_balance) || 0;

  // Claim Form Shipping Details - initialized from live database profile
  const [shippingData, setShippingData] = useState({
    shipping_address: user?.location || '',
    shipping_city: user?.city || '',
    shipping_state: user?.state || '',
    shipping_pincode: user?.pincode || '',
    shipping_phone: user?.phone || '',
  });

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
        setShippingData((prev) => ({
          shipping_address: prev.shipping_address || freshUser.location || '',
          shipping_city: prev.shipping_city || freshUser.city || '',
          shipping_state: prev.shipping_state || freshUser.state || '',
          shipping_pincode: prev.shipping_pincode || freshUser.pincode || '',
          shipping_phone: prev.shipping_phone || freshUser.phone || '',
        }));
      }

      if (showToastNotice) {
        showToast('✓ Synced with MySQL database successfully!');
      }
    } catch (err) {
      console.error('Error fetching database rewards:', err);
      showToast('Could not load rewards catalog from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  const handleOpenClaimModal = (reward) => {
    const required = Number(reward.required_bp) || 0;
    if (userDiamonds < required) {
      const diff = required - userDiamonds;
      showToast(`⚠️ Insufficient Diamond Balance! You need ${diff} more Diamonds to claim this reward.`);
      return;
    }
    setSelectedReward(reward);
  };

  const handleConfirmClaim = async (e) => {
    e.preventDefault();
    if (!selectedReward) return;

    setIsClaiming(true);
    try {
      const activeUserCode = currentUser?.user_code || userCode;
      const res = await claimReward({
        reward_id: selectedReward.id,
        user_code: activeUserCode,
        shipping_address: shippingData.shipping_address,
        shipping_city: shippingData.shipping_city,
        shipping_state: shippingData.shipping_state,
        shipping_pincode: shippingData.shipping_pincode,
        shipping_phone: shippingData.shipping_phone,
      });

      if (res.status === 'success') {
        showToast(res.message || `🎉 Claim for "${selectedReward.title}" saved in database successfully! Reference: ${res.claim?.claim_code}`);
        setSelectedReward(null);
        // Refresh database state
        await loadDatabaseData();
      } else {
        showToast(res.message || 'Failed to claim reward in database.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting claim to database. Please check your Diamond balance.';
      showToast(`❌ ${msg}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="page-container">
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

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>🎁 Diamond Rewards Desk</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Diamond Wallet & Rewards Catalog
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Redeem your accumulated Diamonds for high-value gadgets, luxury holiday packages, gold, and international tours directly from our live catalog.
            </p>
          </div>

          {/* User Diamond Wallet Pill & Database Sync */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '16px', padding: '1.25rem 1.75rem', textAlign: 'center', minWidth: '220px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', fontWeight: 700 }}>
                Your Diamond Balance
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                💎 {formatDiamonds(diamondWallet.diamond_balance)} <span style={{ fontSize: '1rem', color: '#ffffff' }}>Diamonds</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#e2e8f0', display: 'block', marginTop: '0.2rem' }}>
                Member: {currentUser?.user_code || userCode || 'Database User'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => loadDatabaseData(true)}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              🔄 {refreshing ? 'Syncing...' : 'Sync Database Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* My Diamond Rewards Section (Two-Level Sponsor Reward System) */}
      <section
        aria-label="My Diamond Rewards"
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💎</span> My Diamond Rewards
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Non-cash sponsor reward Diamonds earned from Level 1 (Direct Sponsor) and Level 2 (Sponsor's Sponsor) reward allocations. Separate from cash wallet and payouts.
            </p>
          </div>
          <span
            style={{
              background: '#ecfeff',
              border: '1px solid #a5f3fc',
              color: '#0e7490',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            Conversion Rate: ₹{Number(diamondWallet.conversion_rate_inr || 100)} = 1 Diamond
          </span>
        </div>

        {/* Diamond Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.35rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '1px solid #67e8f9', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Diamond Balance
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#155e75', marginTop: '0.25rem' }}>
              💎 {formatDiamonds(diamondWallet.diamond_balance)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#0e7490', marginTop: '0.15rem' }}>
              Non-cash reward balance
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reward Level 1 Diamonds
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
              {formatDiamonds(diamondWallet.level_1_diamonds)} 💎
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
              Earned as Direct Sponsor
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reward Level 2 Diamonds
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
              {formatDiamonds(diamondWallet.level_2_diamonds)} 💎
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>
              Earned as Sponsor's Sponsor
            </div>
          </div>
        </div>

        {/* Recent Diamond Transactions */}
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0' }}>
            Recent Diamond Transactions
          </h3>
          {diamondTransactions.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', color: '#64748b', fontSize: '0.86rem' }}>
              No Diamond reward transactions credited to your account yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155' }}>Source</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155' }}>Reward Level</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Reward Amount</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155', textAlign: 'right' }}>Diamonds</th>
                    <th style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#334155' }}>Credit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {diamondTransactions.map((tx) => {
                    const isReversal = tx.transaction_type === 'reversal' || Number(tx.diamond_quantity) < 0;
                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#0f172a' }}>
                          <div>{tx.source || tx.source_reference}</div>
                          {tx.source_member_code && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500 }}>
                              Member: {tx.source_member_code}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: Number(tx.reward_level) === 1 ? '#dbeafe' : '#f3e8ff',
                              color: Number(tx.reward_level) === 1 ? '#1d4ed8' : '#7c3aed',
                            }}
                          >
                            Level {tx.reward_level}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 700, color: isReversal ? '#dc2626' : '#0f172a' }}>
                          ₹{Math.abs(Number(tx.allocated_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 800, color: isReversal ? '#dc2626' : '#0891b2' }}>
                          {isReversal ? '-' : '+'}{formatDiamonds(Math.abs(Number(tx.diamond_quantity || 0)))} 💎
                        </td>
                        <td style={{ padding: '0.75rem 0.9rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {formatDateTime(tx.created_at)}
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

      {/* Rewards Grid */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Available Milestone Rewards
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Items are delivered directly to your registered shipping address upon redemption.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading rewards catalog...</div>
      ) : rewards.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px' }}>
          No active rewards found in the catalog.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {rewards.map((reward) => {
            const requiredDiamonds = Number(reward.required_bp) || 0;
            const hasEnough = userDiamonds >= requiredDiamonds;
            const progress = Math.min(100, Math.round((userDiamonds / (requiredDiamonds || 1)) * 100));

            return (
              <div
                key={reward.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: hasEnough ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: hasEnough ? '0 8px 25px -5px rgba(34, 197, 94, 0.2)' : '0 4px 15px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Reward Image Container */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img
                    src={reward.image || '/logo.png'}
                    alt={reward.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: hasEnough ? '#16a34a' : 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {hasEnough ? '✓ Diamonds Ready' : `${progress}% Diamonds`}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                    }}
                  >
                    💎 {reward.required_bp} Diamonds Required
                  </div>
                </div>

                {/* Reward Details Body */}
                <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      {reward.category}
                    </span>
                    <h3 style={{ margin: '0.3rem 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                      {reward.title}
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.83rem', color: '#64748b', lineHeight: 1.45 }}>
                      {reward.description}
                    </p>

                    {reward.reward_value_inr && (
                      <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '1rem', fontWeight: 600 }}>
                        Market Worth: <span style={{ color: '#0f172a', fontWeight: 800 }}>₹{Number(reward.reward_value_inr).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Progress Bar towards required Diamonds */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem' }}>
                        <span>Diamond Progress</span>
                        <span>{formatDiamonds(userDiamonds)} / {reward.required_bp} Diamonds</span>
                      </div>
                      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: hasEnough ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                            borderRadius: '4px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div>
                    {hasEnough ? (
                      <button
                        type="button"
                        onClick={() => handleOpenClaimModal(reward)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span>🎁</span> Claim Reward Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: '#f1f5f9',
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'not-allowed',
                        }}
                      >
                        🔒 Need {reward.required_bp - userDiamonds} more Diamonds
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Shipping Details Confirmation Modal */}
      {selectedReward && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                  Confirm Reward Redemption
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedReward.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Deduction Notice */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.9rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#166534' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span>Current Diamond Wallet Balance:</span>
                <strong>{formatDiamonds(userDiamonds)} Diamonds</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#b91c1c' }}>
                <span>Reward Deduction:</span>
                <strong>- {selectedReward.required_bp} Diamonds</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0', paddingTop: '0.3rem', fontWeight: 800 }}>
                <span>Balance After Claim:</span>
                <strong>{formatDiamonds(userDiamonds - selectedReward.required_bp)} Diamonds</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmClaim} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Delivery / Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={shippingData.shipping_address}
                  onChange={(e) => setShippingData({ ...shippingData, shipping_address: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingData.shipping_city}
                    onChange={(e) => setShippingData({ ...shippingData, shipping_city: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingData.shipping_state}
                    onChange={(e) => setShippingData({ ...shippingData, shipping_state: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Pincode / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingData.shipping_pincode}
                    onChange={(e) => setShippingData({ ...shippingData, shipping_pincode: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingData.shipping_phone}
                    onChange={(e) => setShippingData({ ...shippingData, shipping_phone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReward(null)}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClaiming}
                  style={{
                    flex: 1.5,
                    padding: '0.65rem 1rem',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {isClaiming ? 'Processing Claim...' : '✓ Confirm & Claim Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardDetails;
