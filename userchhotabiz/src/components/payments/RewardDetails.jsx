import React, { useState, useEffect, useCallback } from 'react';
import { getUserRewards, claimReward, getUserFreshProfile } from '../../api/userRewardService';

function RewardDetails({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';
  const [userBp, setUserBp] = useState(Number(user?.bp_balance) || 0);

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

      const [rewardsData, freshUser] = await Promise.all([
        getUserRewards(),
        getUserFreshProfile(),
      ]);

      setRewards(rewardsData || []);

      if (freshUser) {
        setCurrentUser(freshUser);
        setUserBp(Number(freshUser.bp_balance) || 0);
        setShippingData((prev) => ({
          shipping_address: prev.shipping_address || freshUser.location || '',
          shipping_city: prev.shipping_city || freshUser.city || '',
          shipping_state: prev.shipping_state || freshUser.state || '',
          shipping_pincode: prev.shipping_pincode || freshUser.pincode || '',
          shipping_phone: prev.shipping_phone || freshUser.phone || '',
        }));
      } else if (user?.bp_balance !== undefined) {
        setUserBp(Number(user.bp_balance) || 0);
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
    if (userBp < reward.required_bp) {
      const diff = reward.required_bp - userBp;
      showToast(`⚠️ Insufficient BP Balance in database! You need ${diff} more Business Points to claim this reward.`);
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
        const remaining = res.remaining_bp !== undefined ? Number(res.remaining_bp) : (userBp - selectedReward.required_bp);
        setUserBp(remaining);
        showToast(res.message || `🎉 Claim for "${selectedReward.title}" saved in database successfully! Reference: ${res.claim?.claim_code}`);
        setSelectedReward(null);
        // Refresh database state
        await loadDatabaseData();
      } else {
        showToast(res.message || 'Failed to claim reward in database.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting claim to database. Please check your BP balance.';
      showToast(`❌ ${msg}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="page-content-wrapper" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
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
              <span>🎁 Database-Backed Business Points (BP) Rewards Desk</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Business Points (BP) Wallet & Rewards Catalog
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Redeem your accumulated Business Points for high-value gadgets, luxury holiday packages, gold, and international tours directly from our live database catalog.
            </p>
          </div>

          {/* User BP Wallet Pill & Database Sync */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '16px', padding: '1.25rem 1.75rem', textAlign: 'center', minWidth: '220px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7d2fe', fontWeight: 700 }}>
                Your Database BP Balance
              </span>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                💎 {userBp.toLocaleString()} <span style={{ fontSize: '1rem', color: '#ffffff' }}>BP</span>
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
            const hasEnough = userBp >= reward.required_bp;
            const progress = Math.min(100, Math.round((userBp / reward.required_bp) * 100));

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
                    src={reward.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}
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
                    {hasEnough ? '✓ BP Ready' : `${progress}% BP`}
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
                    💎 {reward.required_bp} BP Required
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

                    {/* Progress Bar towards required BP */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem' }}>
                        <span>BP Progress</span>
                        <span>{userBp} / {reward.required_bp} BP</span>
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
                        🔒 Need {reward.required_bp - userBp} more BP
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
                <span>Current BP Wallet Balance:</span>
                <strong>{userBp} BP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: '#b91c1c' }}>
                <span>Reward Deduction:</span>
                <strong>- {selectedReward.required_bp} BP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0', paddingTop: '0.3rem', fontWeight: 800 }}>
                <span>Balance After Claim:</span>
                <strong>{userBp - selectedReward.required_bp} BP</strong>
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
