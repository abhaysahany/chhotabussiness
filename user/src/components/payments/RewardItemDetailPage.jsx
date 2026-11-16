import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserRewardById,
  claimReward,
  getUserFreshProfile,
  getUserDiamondRewards,
} from '../../api/userRewardService';

const formatDiamonds = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num) || num === 0) return '0';
  return Number(num.toFixed(4)).toString();
};

function RewardItemDetailPage({ user, onNavigate }) {
  const { rewardId } = useParams();
  const navigate = useNavigate();

  const [reward, setReward] = useState(null);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [diamondBalance, setDiamondBalance] = useState(0);
  const [conversionRate, setConversionRate] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Claim State
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Shipping Details (Pre-filled from authenticated profile)
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

  const handleBackToRewards = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('/payments/rewards/available');
    } else {
      navigate('/payments/rewards/available');
    }
  };

  const handleGoToClaimed = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('/payments/rewards-claimed');
    } else {
      navigate('/payments/rewards-claimed');
    }
  };

  // Load Reward & User Diamond Data from Live Database
  const loadRewardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rewardData, freshProfile, diamondData] = await Promise.all([
        getUserRewardById(rewardId),
        getUserFreshProfile(),
        getUserDiamondRewards(),
      ]);

      if (!rewardData) {
        setError(`Milestone Reward #${rewardId} was not found or is currently inactive.`);
        return;
      }

      setReward(rewardData);

      if (diamondData?.wallet) {
        setDiamondBalance(Number(diamondData.wallet.diamond_balance) || 0);
        if (diamondData.wallet.conversion_rate_inr) {
          setConversionRate(Number(diamondData.wallet.conversion_rate_inr));
        }
      }

      if (freshProfile) {
        setCurrentUser(freshProfile);
        setShippingData({
          shipping_address: freshProfile.location || '',
          shipping_city: freshProfile.city || '',
          shipping_state: freshProfile.state || '',
          shipping_pincode: freshProfile.pincode || '',
          shipping_phone: freshProfile.phone || '',
        });
      }
    } catch (err) {
      console.error('Error loading reward item details:', err);
      setError(err?.message || 'Failed to fetch reward information from backend database.');
    } finally {
      setLoading(false);
    }
  }, [rewardId]);

  useEffect(() => {
    loadRewardData();
  }, [loadRewardData]);

  const requiredDiamonds = Number(reward?.required_bp) || 0;
  const hasEnoughDiamonds = diamondBalance >= requiredDiamonds;
  const remainingBalance = diamondBalance - requiredDiamonds;
  const diamondDeficit = requiredDiamonds - diamondBalance;
  const progressPercent = Math.min(100, Math.round((diamondBalance / (requiredDiamonds || 1)) * 100));

  // Submit Claim
  const handleExecuteClaim = async (e) => {
    if (e) e.preventDefault();
    if (!reward || !hasEnoughDiamonds || isClaiming) return;

    if (!shippingData.shipping_address || !shippingData.shipping_city || !shippingData.shipping_pincode) {
      showToast('⚠️ Please provide a complete delivery address, city, and pincode.');
      return;
    }

    setIsClaiming(true);
    try {
      const activeUserCode = currentUser?.user_code || user?.user_code || '';
      const res = await claimReward({
        reward_id: reward.id,
        user_code: activeUserCode,
        shipping_address: shippingData.shipping_address,
        shipping_city: shippingData.shipping_city,
        shipping_state: shippingData.shipping_state,
        shipping_pincode: shippingData.shipping_pincode,
        shipping_phone: shippingData.shipping_phone,
      });

      if (res.status === 'success') {
        const remaining = res.remaining_diamonds !== undefined ? Number(res.remaining_diamonds) : remainingBalance;
        setDiamondBalance(remaining);
        setClaimSuccess({
          claimCode: res.claim?.claim_code || 'CLM-SUCCESS',
          rewardTitle: reward.title,
          pointsDeducted: requiredDiamonds,
          remainingBalance: remaining,
          shippingAddress: `${shippingData.shipping_address}, ${shippingData.shipping_city}, ${shippingData.shipping_state} - ${shippingData.shipping_pincode}`,
          phone: shippingData.shipping_phone,
        });
        setIsConfirming(false);
        showToast('🎉 Reward claimed successfully! Reference: ' + (res.claim?.claim_code || ''));
      } else {
        showToast(res.message || 'Failed to process reward claim.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error communicating with database to submit claim.';
      showToast(`❌ ${msg}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
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

      {/* Top Navigation & Breadcrumbs Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={handleBackToRewards}
          style={{
            background: '#ffffff',
            color: '#1e40af',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0.55rem 1.15rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease',
          }}
        >
          <span>←</span> Back to Available Rewards
        </button>

        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
          <span>Rewards</span> / <span style={{ cursor: 'pointer', color: '#1e40af' }} onClick={handleBackToRewards}>Available Rewards</span> / <span style={{ color: '#0f172a', fontWeight: 600 }}>{reward?.title || 'Reward Detail'}</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💎</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Loading Reward Details...</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>Fetching live database specifications and wallet balance.</p>
        </div>
      ) : error ? (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '3.5rem 2rem', textAlign: 'center', border: '1px solid #fecaca', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.05)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>Reward Unavailable</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0.5rem auto 1.5rem auto' }}>{error}</p>
          <button
            type="button"
            onClick={handleBackToRewards}
            style={{ background: '#1e40af', color: '#ffffff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            Browse Other Milestone Rewards
          </button>
        </div>
      ) : claimSuccess ? (
        /* ============================================================== */
        /* CLAIM SUCCESS VIEW                                             */
        /* ============================================================== */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #22c55e',
            padding: '2.5rem 2rem',
            boxShadow: '0 15px 35px -5px rgba(34, 197, 94, 0.15)',
            textAlign: 'center',
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            ✓
          </div>
          <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Claim Confirmed in Database
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.75rem 0 0.4rem 0' }}>
            Congratulations! Reward Claimed
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.925rem', maxWidth: '580px', margin: '0 auto 1.75rem auto', lineHeight: 1.5 }}>
            Your claim for <strong>{claimSuccess.rewardTitle}</strong> has been saved directly to the database. The fulfillment department will process and dispatch your item to the verified delivery address.
          </p>

          {/* Reference Receipt Box */}
          <div style={{ maxWidth: '540px', margin: '0 auto 2rem auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', textAlign: 'left', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.65rem' }}>
              <span style={{ color: '#64748b' }}>Claim Reference Code:</span>
              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{claimSuccess.claimCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.65rem' }}>
              <span style={{ color: '#64748b' }}>Diamonds Deducted:</span>
              <strong style={{ color: '#b91c1c' }}>- {claimSuccess.pointsDeducted} Diamonds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.65rem' }}>
              <span style={{ color: '#64748b' }}>Remaining Diamond Balance:</span>
              <strong style={{ color: '#0284c7' }}>💎 {formatDiamonds(claimSuccess.remainingBalance)} Diamonds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.65rem' }}>
              <span style={{ color: '#64748b' }}>Fulfillment Status:</span>
              <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                Pending Dispatch
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Delivery Address:</span>
              <div style={{ color: '#334155', fontWeight: 600 }}>{claimSuccess.shippingAddress}</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>Contact: {claimSuccess.phone}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGoToClaimed}
              style={{
                background: 'linear-gradient(105deg, #0B192C 0%, #1E40AF 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
              }}
            >
              View in Rewards Claimed History →
            </button>
            <button
              type="button"
              onClick={handleBackToRewards}
              style={{
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Back to Available Rewards
            </button>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* SELECTED REWARD DETAIL & CLAIM VIEW                            */
        /* ============================================================== */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: REWARD IMAGE & PRODUCT SPECIFICATIONS */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            {/* Reward Image */}
            <div style={{ position: 'relative', height: '280px', background: '#0f172a', overflow: 'hidden' }}>
              <img
                src={reward.image || '/logo.png'}
                alt={reward.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                📁 {reward.category || 'Milestone Reward'}
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  right: '14px',
                  background: hasEnoughDiamonds ? '#16a34a' : 'rgba(15, 23, 42, 0.85)',
                  color: '#ffffff',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {hasEnoughDiamonds ? '✓ Diamonds Ready' : `${progressPercent}% Diamonds`}
              </div>
            </div>

            {/* Specifications Details */}
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Item ID: #{reward.id}
                </span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                  ● Active in Catalog
                </span>
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0', lineHeight: 1.3 }}>
                {reward.title}
              </h1>

              {reward.reward_value_inr && (
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.95rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Estimated Market Value:</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>₹{Number(reward.reward_value_inr).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.4rem 0' }}>
                  Description & Fulfillment Notes
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {reward.description || 'Exclusive milestone award delivered directly to winner upon redemption verification.'}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DIAMOND WALLET CALCULATION & CLAIM ACTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Diamond Calculation Summary Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💎</span> Diamond Ledger Breakdown
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                  ₹{conversionRate} = 1 Diamond
                </span>
              </div>

              {/* Required Diamonds Hero Callout */}
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '12px', padding: '1.25rem 1.5rem', color: '#ffffff', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#c7d2fe', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Diamonds Required for this Reward
                </span>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
                  💎 {reward.required_bp} <span style={{ fontSize: '1rem', color: '#ffffff' }}>Diamonds</span>
                </div>
              </div>

              {/* Exact Balance Calculations Table */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '1rem 1.15rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ color: '#64748b' }}>Your Current Diamond Balance:</span>
                  <strong style={{ color: '#0f172a' }}>💎 {formatDiamonds(diamondBalance)} Diamonds</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', color: '#dc2626' }}>
                  <span>Required for Redemption:</span>
                  <strong>- {reward.required_bp} Diamonds</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', fontWeight: 800 }}>
                  {hasEnoughDiamonds ? (
                    <>
                      <span style={{ color: '#15803d' }}>Remaining Balance After Claim:</span>
                      <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>💎 {formatDiamonds(remainingBalance)} Diamonds</strong>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#b91c1c' }}>Additional Diamonds Needed:</span>
                      <strong style={{ color: '#b91c1c', fontSize: '0.95rem' }}>⚠️ Short by {formatDiamonds(diamondDeficit)} Diamonds</strong>
                    </>
                  )}
                </div>
              </div>

              {/* Diamond Progress Bar */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem' }}>
                  <span>Redemption Readiness</span>
                  <span>{formatDiamonds(diamondBalance)} / {reward.required_bp} ({progressPercent}%)</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: hasEnoughDiamonds ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Eligibility Banner */}
              {hasEnoughDiamonds ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#065f46', fontSize: '0.825rem', fontWeight: 700 }}>
                  <span style={{ fontSize: '1.2rem' }}>✓</span>
                  <div>You have sufficient Diamonds! Complete your delivery shipping details below to confirm this reward.</div>
                </div>
              ) : (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#991b1b', fontSize: '0.825rem' }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🔒</span>
                  <div>
                    <strong>Insufficient Diamond Balance.</strong> You currently have {formatDiamonds(diamondBalance)} Diamonds and require <strong>{formatDiamonds(diamondDeficit)} more Diamonds</strong> to unlock this milestone. Earn more Diamonds from Level 1 and Level 2 sponsor sales!
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Shipping Details & Claim Action Box */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                📦 Delivery Shipping Destination
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                Verify or update your shipping address for courier fulfillment upon reward approval.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    Street / Delivery Address *
                  </label>
                  <input
                    type="text"
                    disabled={!hasEnoughDiamonds || isClaiming}
                    value={shippingData.shipping_address}
                    onChange={(e) => setShippingData({ ...shippingData, shipping_address: e.target.value })}
                    placeholder="House / Flat / Street Address"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_city}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_city: e.target.value })}
                      placeholder="City"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_state}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_state: e.target.value })}
                      placeholder="State"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Pincode / Postal Code *
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_pincode}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_pincode: e.target.value })}
                      placeholder="e.g. 400001"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                      Recipient Contact Phone *
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_phone}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Claim Action Confirmation & Button */}
              {hasEnoughDiamonds ? (
                <div>
                  {!isConfirming ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirming(true)}
                      style={{
                        width: '100%',
                        padding: '0.9rem 1.5rem',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(22, 163, 74, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <span>🎁</span> Claim This Reward Now
                    </button>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1.05rem', fontWeight: 800 }}>
                        Confirm Redemption of {reward.required_bp} Diamonds?
                      </h4>
                      <div style={{ background: '#ffffff', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid #bbf7d0', marginBottom: '1rem', textAlign: 'left', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ color: '#64748b' }}>Selected Reward:</span>
                          <strong style={{ color: '#0f172a' }}>{reward.title}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ color: '#64748b' }}>Diamonds Required:</span>
                          <strong style={{ color: '#b91c1c' }}>💎 {reward.required_bp} Diamonds</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ color: '#64748b' }}>Current Diamond Balance:</span>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>💎 {formatDiamonds(diamondBalance)} Diamonds</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.3rem' }}>
                          <span style={{ color: '#64748b' }}>Balance After Redemption:</span>
                          <strong style={{ color: '#16a34a' }}>💎 {formatDiamonds(remainingBalance)} Diamonds</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '0.3rem' }}>
                          <span style={{ color: '#64748b' }}>Delivery Destination:</span>
                          <span style={{ color: '#334155', fontWeight: 600 }}>{shippingData.shipping_city || 'Profile City'}, {shippingData.shipping_state || 'State'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          disabled={isClaiming}
                          onClick={() => setIsConfirming(false)}
                          style={{
                            padding: '0.65rem 1.25rem',
                            background: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isClaiming}
                          onClick={handleExecuteClaim}
                          style={{
                            padding: '0.65rem 1.5rem',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: isClaiming ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                          }}
                        >
                          {isClaiming ? 'Processing Claim...' : '✓ Yes, Confirm Redemption'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    background: '#f1f5f9',
                    color: '#94a3b8',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>🔒</span> Insufficient Balance ({formatDiamonds(diamondBalance)} / {reward.required_bp} Diamonds)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardItemDetailPage;
