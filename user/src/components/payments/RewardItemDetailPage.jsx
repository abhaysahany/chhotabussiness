import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Gift,
  Gem,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  MapPin,
  Building2,
  Phone,
  Hash,
  RotateCcw,
  Package,
  Award,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
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
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1.25rem 3.5rem 1.25rem' }}>
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
      <div className="van-catalog-hero-3d" style={{ marginBottom: '1.75rem' }}>
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
              <span>Milestone Rewards • Product Specifications</span>
            </div>
            <h1 className="van-catalog-hero-title">
              {reward?.title || 'Reward Specification Dossier'}
            </h1>
            <p className="van-catalog-hero-desc">
              Complete milestone specifications, market valuation, diamond redemption ledger, and verified courier fulfillment.
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
          {/* Diamond Balance Pod */}
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
              Your Diamond Balance
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
              <span>{formatDiamonds(diamondBalance)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              ₹{conversionRate} = 1 Diamond
            </span>
          </div>

          {/* Back Action Pill */}
          <button
            type="button"
            onClick={handleBackToRewards}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.15rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Available Rewards</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '5rem 2rem',
            textAlign: 'center',
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
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
            Loading Reward Details...
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Fetching live database specifications and real-time Diamond wallet calculations.
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '1.5px solid #fecaca',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.05)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <AlertCircle size={34} color="#DC2626" />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.4rem 0' }}>
            Reward Unavailable
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={handleBackToRewards}
            style={{
              background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.7rem 1.6rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Browse Other Milestone Rewards</span>
          </button>
        </div>
      ) : claimSuccess ? (
        /* ============================================================== */
        /* CLAIM SUCCESS VIEW                                             */
        /* ============================================================== */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '2px solid #22c55e',
            padding: '3rem 2.5rem',
            boxShadow: '0 20px 45px -10px rgba(34, 197, 94, 0.2)',
            textAlign: 'center',
            maxWidth: '780px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 6px 20px rgba(34, 197, 94, 0.25)',
            }}
          >
            <CheckCircle2 size={40} strokeWidth={2.5} />
          </div>

          <span
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '0.3rem 0.95rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Claim Confirmed in Database
          </span>

          <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', margin: '0.85rem 0 0.4rem 0' }}>
            Congratulations! Reward Claimed
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto 1.75rem auto', lineHeight: 1.5 }}>
            Your claim for <strong style={{ color: '#0f172a' }}>{claimSuccess.rewardTitle}</strong> has been saved directly to the database. The fulfillment department will process and dispatch your item to the verified delivery address.
          </p>

          {/* Reference Receipt Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'left',
              fontSize: '0.875rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Claim Reference Code:</span>
              <strong style={{ color: '#0f172a', fontSize: '1rem', fontFamily: 'monospace' }}>{claimSuccess.claimCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Diamonds Deducted:</span>
              <strong style={{ color: '#b91c1c' }}>- {claimSuccess.pointsDeducted} Diamonds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Remaining Diamond Balance:</span>
              <strong style={{ color: '#0284c7' }}>💎 {formatDiamonds(claimSuccess.remainingBalance)} Diamonds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Fulfillment Status:</span>
              <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                Pending Dispatch
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Delivery Address:</span>
              <div style={{ color: '#334155', fontWeight: 600 }}>{claimSuccess.shippingAddress}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.25rem' }}>Contact: {claimSuccess.phone}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGoToClaimed}
              style={{
                background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.6rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>View in Rewards Claimed</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleBackToRewards}
              style={{
                background: '#ffffff',
                color: '#475569',
                border: '1.5px solid #cbd5e1',
                padding: '0.75rem 1.4rem',
                borderRadius: '10px',
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1.25fr)',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: REWARD IMAGE & PRODUCT SPECIFICATIONS */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
            }}
          >
            {/* Reward Image with Radial Backdrop */}
            <div
              style={{
                position: 'relative',
                height: '320px',
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
              />

              {/* Category Pill Tag */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                {reward.category || 'Milestone Reward'}
              </div>

              {/* Eligibility Tag */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: hasEnoughDiamonds ? 'rgba(16, 185, 129, 0.95)' : 'rgba(217, 119, 6, 0.95)',
                  color: '#ffffff',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: hasEnoughDiamonds
                    ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                    : '0 4px 14px rgba(217, 119, 6, 0.35)',
                }}
              >
                {hasEnoughDiamonds ? (
                  <>
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    <span>Unlocked & Ready</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} strokeWidth={2.5} />
                    <span>{progressPercent}% Progress</span>
                  </>
                )}
              </div>
            </div>

            {/* Specifications Details */}
            <div style={{ padding: '1.75rem 2rem 2rem 2rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  ITEM ID: #{reward.id}
                </span>
                <span
                  style={{
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                  }}
                >
                  ● Active in Catalog
                </span>
              </div>

              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  margin: '0 0 1rem 0',
                  lineHeight: 1.3,
                  letterSpacing: '-0.02em',
                }}
              >
                {reward.title}
              </h1>

              {/* 3 Highlight Specification Chips */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                {reward.reward_value_inr && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                      Market Value
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 900 }}>
                      ₹{Number(reward.reward_value_inr).toLocaleString('en-IN')}
                    </strong>
                  </div>
                )}

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    Required BP
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#7c3aed', fontWeight: 900 }}>
                    💎 {requiredDiamonds}
                  </strong>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    Delivery Mode
                  </span>
                  <strong style={{ fontSize: '0.925rem', color: '#0284c7', fontWeight: 800 }}>
                    Verified Courier
                  </strong>
                </div>
              </div>

              {/* Description Section */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h4
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: '0 0 0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Package size={15} color="#2563EB" />
                  <span>Description & Specifications</span>
                </h4>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#475569',
                    lineHeight: 1.65,
                    margin: 0,
                    background: '#f8fafc',
                    padding: '1rem 1.15rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {reward.description || 'Exclusive verified milestone award delivered directly to member upon redemption confirmation.'}
                </p>
              </div>

              {/* Trust & Guarantee Assurance Pods */}
              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: '#334155' }}>
                  <ShieldCheck size={16} color="#10b981" />
                  <span>100% Genuine brand-new physical milestone product.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: '#334155' }}>
                  <Truck size={16} color="#2563eb" />
                  <span>Free doorstep dispatch with active courier tracking reference.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.825rem', color: '#334155' }}>
                  <Award size={16} color="#d97706" />
                  <span>Redeemable exclusively through earned Diamond accumulations.</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DIAMOND WALLET CALCULATION & CLAIM ACTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Diamond Calculation Summary Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '1.75rem 2rem',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.35rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Gem size={20} color="#0284C7" />
                  <span>Diamond Ledger Breakdown</span>
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#0284c7',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '20px',
                    fontWeight: 800,
                  }}
                >
                  ₹{conversionRate} = 1 Diamond
                </span>
              </div>

              {/* Required Diamonds Hero Callout */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
                  borderRadius: '16px',
                  padding: '1.35rem 1.6rem',
                  color: '#ffffff',
                  marginBottom: '1.35rem',
                  boxShadow: '0 6px 20px rgba(30, 64, 175, 0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    color: '#c7d2fe',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}
                >
                  Diamonds Required for this Reward
                </span>
                <div
                  style={{
                    fontSize: '2.3rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    marginTop: '0.2rem',
                    textShadow: '0 2px 10px rgba(251, 191, 36, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span>💎</span>
                  <span>{reward.required_bp}</span>
                  <span style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 600 }}>Diamonds</span>
                </div>
              </div>

              {/* Exact Balance Calculations Table */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '14px',
                  border: '1.5px solid #e2e8f0',
                  padding: '1.15rem 1.35rem',
                  marginBottom: '1.35rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#64748b' }}>Your Current Diamond Balance:</span>
                  <strong style={{ color: '#0f172a' }}>💎 {formatDiamonds(diamondBalance)} Diamonds</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#dc2626' }}>
                  <span>Required for Redemption:</span>
                  <strong>- {reward.required_bp} Diamonds</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '0.75rem',
                    fontWeight: 900,
                  }}
                >
                  {hasEnoughDiamonds ? (
                    <>
                      <span style={{ color: '#15803d' }}>Remaining Balance After Claim:</span>
                      <strong style={{ color: '#15803d', fontSize: '1rem' }}>💎 {formatDiamonds(remainingBalance)} Diamonds</strong>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#b91c1c' }}>Additional Diamonds Needed:</span>
                      <strong style={{ color: '#b91c1c', fontSize: '1rem' }}>⚠️ Short by {formatDiamonds(diamondDeficit)} Diamonds</strong>
                    </>
                  )}
                </div>
              </div>

              {/* Diamond Progress Bar */}
              <div style={{ marginBottom: '1.35rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#64748b',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span>Redemption Readiness</span>
                  <span style={{ color: hasEnoughDiamonds ? '#059669' : '#d97706' }}>
                    {formatDiamonds(diamondBalance)} / {reward.required_bp} ({progressPercent}%)
                  </span>
                </div>
                <div style={{ height: '9px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: hasEnoughDiamonds
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Eligibility Banner */}
              {hasEnoughDiamonds ? (
                <div
                  style={{
                    background: '#ecfdf5',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '0.95rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#065f46',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={20} color="#059669" />
                  <div>You have sufficient Diamonds! Complete your delivery shipping details below to confirm this reward.</div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    padding: '0.95rem 1.15rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                  }}
                >
                  <Lock size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
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
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '1.75rem 2rem',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  margin: '0 0 0.35rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Truck size={20} color="#2563EB" />
                <span>Delivery Shipping Destination</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.35rem 0' }}>
                Verify or update your shipping address for verified courier fulfillment upon reward redemption.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', marginBottom: '1.75rem' }}>
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <MapPin size={14} color="#64748B" />
                    <span>Street / Delivery Address *</span>
                  </label>
                  <input
                    type="text"
                    disabled={!hasEnoughDiamonds || isClaiming}
                    value={shippingData.shipping_address}
                    onChange={(e) => setShippingData({ ...shippingData, shipping_address: e.target.value })}
                    placeholder="House / Flat / Building / Street Address"
                    style={{
                      width: '100%',
                      padding: '0.72rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.875rem',
                      background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <Building2 size={14} color="#64748B" />
                      <span>City *</span>
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_city}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_city: e.target.value })}
                      placeholder="City"
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.875rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
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
                        padding: '0.72rem 0.95rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.875rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <Hash size={14} color="#64748B" />
                      <span>Pincode / Postal Code *</span>
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_pincode}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_pincode: e.target.value })}
                      placeholder="e.g. 400001"
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.875rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <Phone size={14} color="#64748B" />
                      <span>Contact Phone *</span>
                    </label>
                    <input
                      type="text"
                      disabled={!hasEnoughDiamonds || isClaiming}
                      value={shippingData.shipping_phone}
                      onChange={(e) => setShippingData({ ...shippingData, shipping_phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      style={{
                        width: '100%',
                        padding: '0.72rem 0.95rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.875rem',
                        background: hasEnoughDiamonds ? '#ffffff' : '#f8fafc',
                        outline: 'none',
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
                        padding: '0.95rem 1.6rem',
                        background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>🎁</span>
                      <span>Claim This Reward Now</span>
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '2px solid #86efac',
                        borderRadius: '14px',
                        padding: '1.35rem',
                        textAlign: 'center',
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1.1rem', fontWeight: 900 }}>
                        Confirm Redemption of {reward.required_bp} Diamonds?
                      </h4>
                      <div
                        style={{
                          background: '#ffffff',
                          borderRadius: '10px',
                          padding: '0.85rem 1.15rem',
                          border: '1px solid #bbf7d0',
                          marginBottom: '1rem',
                          textAlign: 'left',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Selected Reward:</span>
                          <strong style={{ color: '#0f172a' }}>{reward.title}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Diamonds Required:</span>
                          <strong style={{ color: '#b91c1c' }}>💎 {reward.required_bp} Diamonds</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Current Diamond Balance:</span>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>💎 {formatDiamonds(diamondBalance)} Diamonds</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Balance After Redemption:</span>
                          <strong style={{ color: '#16a34a' }}>💎 {formatDiamonds(remainingBalance)} Diamonds</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '0.35rem' }}>
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
                            padding: '0.65rem 1.35rem',
                            background: '#ffffff',
                            color: '#475569',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '10px',
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
                            padding: '0.65rem 1.6rem',
                            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: isClaiming ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
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
                    padding: '0.9rem 1.4rem',
                    background: '#f8fafc',
                    color: '#94a3b8',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Lock size={16} />
                  <span>Insufficient Balance ({formatDiamonds(diamondBalance)} / {reward.required_bp} Diamonds)</span>
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