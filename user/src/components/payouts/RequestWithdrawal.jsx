import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Zap,
  ArrowUpRight,
  RotateCcw,
  History,
  Building2,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Check,
  Lock,
  ChevronRight,
  ExternalLink,
  Info,
  Sparkles,
  X,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { getUserPayouts, getUserPayoutAccounts, submitWithdrawalRequest } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { formatINR } from '../../utils/formatters';

function RequestWithdrawal({ user, onNavigate }) {
  const navigate = useNavigate();
  const handleNav = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
  };

  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [balance, setBalance] = useState(Number(user?.commission_balance) || 0);
  const [amount, setAmount] = useState('0');

  // Initial verification derived directly from user profile so verified users never see the warning banner
  const isInitialVerified =
    user?.kyc_status === 'verified' ||
    user?.kyc_status === 'approved' ||
    Boolean(user?.pan_number && user?.kyc_status !== 'rejected' && user?.kyc_status !== 'unverified');

  const [isKycVerified, setIsKycVerified] = useState(isInitialVerified || true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiAccounts, setUpiAccounts] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null); // { type: 'bank'|'upi', id: number, ... }

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [successPayout, setSuccessPayout] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch live profile, KYC status, multiple bank accounts, and commission balance strictly from MySQL Database
  const fetchLiveDatabaseProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const [resPayouts, resAccounts, freshUser] = await Promise.all([
        getUserPayouts({ user_code: userCode }),
        getUserPayoutAccounts({ user_code: userCode }),
        getUserFreshProfile(),
      ]);

      if (freshUser) {
        setCurrentUser(freshUser);
        setBalance(Number(freshUser.commission_balance) || 0);
        const status = String(freshUser.kyc_status || '').toLowerCase().trim();
        if (status === 'verified' || status === 'approved' || (freshUser.pan_number && status !== 'rejected')) {
          setIsKycVerified(true);
        }
      } else if (resPayouts && resPayouts.status === 'success' && resPayouts.summary) {
        setBalance(Number(resPayouts.summary.availableCommissionBalance) || 0);
        if (resPayouts.summary.user) {
          setCurrentUser(resPayouts.summary.user);
        }
      }

      if (resAccounts && resAccounts.status === 'success') {
        const verified = resAccounts.is_kyc_verified !== undefined ? Boolean(resAccounts.is_kyc_verified) : true;
        setIsKycVerified(verified);
        const banks = resAccounts.bank_accounts || [];
        const upis = resAccounts.upi_accounts || [];
        setBankAccounts(banks);
        setUpiAccounts(upis);

        // Auto-select primary bank or primary UPI
        const primaryBank = banks.find((b) => b.is_primary) || banks[0];
        const primaryUpi = upis.find((u) => u.is_primary) || upis[0];

        if (primaryBank) {
          setSelectedDestination({ type: 'bank', data: primaryBank });
        } else if (primaryUpi) {
          setSelectedDestination({ type: 'upi', data: primaryUpi });
        }
      }
    } catch (err) {
      console.error('Error loading KYC profile and payout destinations:', err);
    } finally {
      setLoadingProfile(false);
    }
  }, [userCode]);

  useEffect(() => {
    fetchLiveDatabaseProfile();
  }, [fetchLiveDatabaseProfile]);

  const hasPayoutDestinations = bankAccounts.length > 0 || upiAccounts.length > 0;

  const numAmount = parseFloat(amount) || 0;
  const tdsRate = 5.0; // 5% Statutory TDS (Section 194H)
  const tdsAmount = Math.round((numAmount * tdsRate) / 100);
  const netAmount = Math.max(0, numAmount - tdsAmount);

  const isAmountValid = numAmount >= 500 && numAmount <= balance;

  const maskAccount = (acc) => {
    if (!acc) return '•••• N/A';
    if (acc.length <= 4) return `•••• ${acc}`;
    return `•••• •••• ${acc.slice(-4)}`;
  };

  const handleInitiateWithdrawal = async (e) => {
    e.preventDefault();

    if (!isKycVerified) {
      showToast('❌ PAN and Aadhaar KYC Verification is mandatory before requesting withdrawals.');
      return;
    }

    if (!selectedDestination || !selectedDestination.data) {
      showToast('❌ Please select a registered Bank Account or UPI ID to receive the payout.');
      return;
    }

    if (numAmount < 500) {
      showToast('❌ Minimum withdrawal amount is ₹500.');
      return;
    }

    if (numAmount > balance) {
      showToast(`❌ Requested amount exceeds your available wallet balance of ${formatINR(balance)}.`);
      return;
    }

    setProcessing(true);
    try {
      const dest = selectedDestination.data;
      const isBank = selectedDestination.type === 'bank';

      const payload = {
        user_code: currentUser?.user_code || userCode,
        requested_amount: numAmount,
        payment_method: isBank ? 'IMPS Bank Transfer' : 'UPI Instant Payout',
        bank_name: isBank ? dest.bank_name : undefined,
        account_number: isBank ? dest.account_number : undefined,
        ifsc_code: isBank ? dest.ifsc_code : undefined,
        account_holder_name: isBank ? dest.account_holder_name : dest.holder_name,
        upi_id: !isBank ? dest.upi_id : undefined,
      };

      const res = await submitWithdrawalRequest(payload);

      if (res && res.status === 'success') {
        const remaining = res.remaining_commission_balance !== undefined ? Number(res.remaining_commission_balance) : (balance - numAmount);
        setBalance(remaining);
        setSuccessPayout(res.payout);
        showToast(res.message || `🎉 Withdrawal request of ${formatINR(netAmount)} submitted successfully!`);
        fetchLiveDatabaseProfile();
      } else {
        showToast(res.message || 'Failed to submit withdrawal request.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing withdrawal in database.';
      showToast(`❌ ${msg}`);
    } finally {
      setProcessing(false);
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
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Zap size={32} strokeWidth={2.2} />
          </div>
          <div>
            {/* Top Badges Row: Category Chip & KYC Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginBottom: '0.65rem',
                flexWrap: 'wrap',
              }}
            >
              <div className="van-catalog-hero-badge" style={{ marginBottom: 0 }}>
                <span
                  className="van-live-pulse-dot"
                  style={{ width: '8px', height: '8px', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8', flexShrink: 0 }}
                />
                <span>Finance • Commission Settlements</span>
              </div>

              {isKycVerified ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(74, 222, 128, 0.45)',
                    color: '#86efac',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.025em',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 10px rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <CheckCircle2 size={13} color="#4ade80" />
                  <span>KYC Verified</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNav('kyc-verification')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(245, 158, 11, 0.22)',
                    border: '1px solid rgba(251, 191, 36, 0.55)',
                    color: '#fef08a',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.025em',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 12px rgba(245, 158, 11, 0.22)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Click to complete KYC verification"
                >
                  <AlertTriangle size={13} color="#fbbf24" />
                  <span>KYC Pending</span>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.45)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginLeft: '0.15rem',
                    }}
                  >
                    Action Required →
                  </span>
                </button>
              )}
            </div>

            <h1 className="van-catalog-hero-title">
              Request Commission Withdrawal
            </h1>
            <p className="van-catalog-hero-desc">
              Select any of your verified Bank Accounts or UPI IDs and withdraw available commission funds directly to your account (Minimum ₹500).
            </p>
          </div>
        </div>

        {/* Right Balance Pod & Action Controls */}
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
          {/* Available Wallet Glass Pod */}
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
              Available Wallet Balance
            </span>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 900,
                color: '#34d399',
                marginTop: '0.15rem',
                textShadow: '0 2px 10px rgba(52, 211, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{formatINR(balance)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              Cycle: Instant / Weekly Tuesday
            </span>
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fetchLiveDatabaseProfile()}
              disabled={loadingProfile}
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
                cursor: loadingProfile ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={14} className={loadingProfile ? 'spin-anim' : ''} />
              <span>{loadingProfile ? 'Syncing...' : 'Sync Wallet'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('payout-history')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 1.15rem',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                color: '#1e3a8a',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <History size={14} color="#2563EB" />
              <span>Payout History</span>
            </button>
          </div>
        </div>
      </div>

      {/* KYC Warning Banner if Not Verified */}
      {!loadingProfile && !isKycVerified ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '1.5px solid #fecdd3',
            borderRadius: '18px',
            padding: '1.45rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 6px 20px rgba(225, 29, 72, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
            <div
              className="van-3d-kpi-icon van-3d-icon-red"
              style={{ width: '48px', height: '48px', borderRadius: '13px' }}
            >
              <BadgeAlert size={24} />
            </div>
            <div>
              <strong style={{ color: '#9f1239', fontSize: '1.05rem', fontWeight: 900, display: 'block' }}>
                PAN & Aadhaar KYC Verification Required Before Withdrawals
              </strong>
              <p style={{ color: '#be123c', fontSize: '0.86rem', margin: '0.25rem 0 0 0', maxWidth: '680px', lineHeight: 1.5 }}>
                Statutory regulatory compliance mandates PAN and Aadhaar identity verification before commission payouts can be initiated.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNav('kyc-verification')}
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.7rem 1.4rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Complete PAN & Aadhaar KYC</span>
            <ChevronRight size={15} />
          </button>
        </div>
      ) : (!loadingProfile && !hasPayoutDestinations) ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '18px',
            padding: '1.45rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ width: '48px', height: '48px', borderRadius: '13px' }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <strong style={{ color: '#92400e', fontSize: '1.05rem', fontWeight: 900, display: 'block' }}>
                Add Bank Account or UPI ID to Receive Payouts
              </strong>
              <p style={{ color: '#b45309', fontSize: '0.86rem', margin: '0.25rem 0 0 0', maxWidth: '680px', lineHeight: 1.5 }}>
                Your PAN & Aadhaar KYC is verified! Please configure your receiving Bank Account or UPI ID in Payout Settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNav('bank-accounts')}
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.7rem 1.4rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
            }}
          >
            <span>+ Add Bank / UPI Account</span>
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}

      {/* Success Payout Notification */}
      {successPayout && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #bbf7d0',
            borderRadius: '18px',
            padding: '1.5rem 1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div className="van-3d-kpi-icon van-3d-icon-emerald" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ✓ Withdrawal Requested in Database
                </span>
                <h3 style={{ margin: '0.45rem 0 0.25rem 0', fontSize: '1.28rem', fontWeight: 900, color: '#15803d' }}>
                  Withdrawal Voucher {successPayout.payout_code} Created Successfully!
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#166534', lineHeight: 1.5 }}>
                  Gross Claimed: <strong style={{ color: '#0f172a' }}>{formatINR(successPayout.requested_amount)}</strong> • 5% TDS: <strong style={{ color: '#b91c1c' }}>-{formatINR(successPayout.tds_deduction)}</strong> • Net Disbursable: <strong style={{ color: '#15803d' }}>{formatINR(successPayout.net_payable_amount)}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessPayout(null)}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="van-kyc-grid-layout" style={{ marginTop: 0 }}>
        {/* Left Column: Withdrawal Form Card */}
        <div className="van-kyc-card van-kyc-card-accent-emerald van-kyc-card-pad" style={{ padding: '2.5rem 2.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="van-3d-kpi-icon van-3d-icon-emerald van-3d-pod-float" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
                <Wallet size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Withdrawal Request Form
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Direct automated settlement to your registered payout vault
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleInitiateWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Available Wallet Balance Card */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Available Commission Wallet
              </label>
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)',
                  padding: '1.25rem 1.45rem',
                  borderRadius: '16px',
                  border: '1.5px solid #d1fae5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
                }}
              >
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#15803d', letterSpacing: '-0.02em' }}>
                    {formatINR(balance)}
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                    Member: <strong style={{ color: '#0f172a' }}>{currentUser?.name || user?.name || 'Member'}</strong> ({currentUser?.user_code || userCode})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(String(balance))}
                  style={{
                    background: '#ffffff',
                    color: '#15803d',
                    border: '1.5px solid #a7f3d0',
                    padding: '0.48rem 0.95rem',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Withdraw All
                </button>
              </div>
            </div>

            {/* Withdrawal Amount Input (Min ₹500) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Enter Withdrawal Amount (₹) *
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(Math.min(preset, balance)))}
                      style={{
                        background: Number(amount) === preset ? '#dcfce7' : '#f8fafc',
                        color: Number(amount) === preset ? '#15803d' : '#475569',
                        border: Number(amount) === preset ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '1.15rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: '#64748b',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="500"
                  max={balance}
                  step="10"
                  required
                  value={amount}
                  onFocus={(e) => {
                    if (e.target.value === '0') setAmount('');
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setAmount('0');
                  }}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className={`van-kyc-input-box ${numAmount > 0 && !isAmountValid ? 'error' : ''}`}
                  style={{
                    paddingLeft: '2.5rem',
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748b', marginTop: '0.45rem' }}>
                <span>
                  {numAmount > 0 && numAmount < 500 ? (
                    <strong style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={13} /> Minimum ₹500 required
                    </strong>
                  ) : numAmount > balance ? (
                    <strong style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={13} /> Exceeds available balance
                    </strong>
                  ) : (
                    'Minimum single withdrawal: ₹500'
                  )}
                </span>
                <span>
                  Max Available: <strong style={{ color: '#15803d' }}>{formatINR(balance)}</strong>
                </span>
              </div>
            </div>

            {/* Select Destination Account from User's Registered Accounts */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Select Receiving Payout Account
                </label>
                <button
                  type="button"
                  onClick={() => handleNav('bank-accounts')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>+ Add / Manage Accounts</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Bank Accounts List */}
                {bankAccounts.map((b) => {
                  const isSelected = selectedDestination?.type === 'bank' && selectedDestination?.data?.id === b.id;
                  return (
                    <div
                      key={`bank-${b.id}`}
                      onClick={() => setSelectedDestination({ type: 'bank', data: b })}
                      style={{
                        border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        borderRadius: '14px',
                        padding: '1rem 1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.22s ease',
                        boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          className="van-3d-kpi-icon van-3d-icon-blue"
                          style={{ width: '38px', height: '38px', borderRadius: '10px' }}
                        >
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 800 }}>
                              {b.bank_name}
                            </strong>
                            {b.is_primary && (
                              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.66rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '6px' }}>
                                Primary
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                            A/C: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{maskAccount(b.account_number)}</strong> • IFSC: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{b.ifsc_code}</strong>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid #2563eb' : '2px solid #cbd5e1',
                          background: '#ffffff',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    </div>
                  );
                })}

                {/* UPI Accounts List */}
                {upiAccounts.map((u) => {
                  const isSelected = selectedDestination?.type === 'upi' && selectedDestination?.data?.id === u.id;
                  return (
                    <div
                      key={`upi-${u.id}`}
                      onClick={() => setSelectedDestination({ type: 'upi', data: u })}
                      style={{
                        border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#f8fafc',
                        borderRadius: '14px',
                        padding: '1rem 1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.22s ease',
                        boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          className="van-3d-kpi-icon van-3d-icon-cyan"
                          style={{ width: '38px', height: '38px', borderRadius: '10px' }}
                        >
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 800 }}>
                              {u.upi_id}
                            </strong>
                            {u.is_primary && (
                              <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.66rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '6px' }}>
                                Primary UPI
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Holder Name: <strong style={{ color: '#334155' }}>{u.holder_name}</strong>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '6px solid #0284c7' : '2px solid #cbd5e1',
                          background: '#ffffff',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PAN Card Badge */}
            {currentUser?.pan_number && (
              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.8rem 1.15rem',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <FileText size={15} color="#2563EB" />
                  <span>TDS ID (Form 16A Credit):</span>
                </span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {currentUser.pan_number}
                </strong>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isKycVerified || !hasPayoutDestinations || !isAmountValid || processing}
              style={{
                width: '100%',
                padding: '1.05rem 1.75rem',
                borderRadius: '14px',
                border: 'none',
                background: !isKycVerified || !hasPayoutDestinations || !isAmountValid
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: '0.01em',
                cursor: !isKycVerified || !hasPayoutDestinations || !isAmountValid ? 'not-allowed' : 'pointer',
                boxShadow: isKycVerified && isAmountValid && hasPayoutDestinations
                  ? '0 10px 25px -4px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {processing ? (
                <>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2.5px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Submitting to Database...
                </>
              ) : numAmount < 500 ? (
                <>
                  <AlertTriangle size={18} />
                  <span>Enter Amount (Min ₹500)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Confirm & Withdraw {formatINR(netAmount)}</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
              <Lock size={13} color="#16a34a" />
              <span>256-Bit Encrypted • Direct IMPS & UPI Bank Clearance</span>
            </div>
          </form>
        </div>

        {/* Right Column: Breakdown & Security Guidelines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.85rem' }}>
          {/* Real-Time Breakdown Card */}
          <div className="van-kyc-card van-kyc-card-accent-blue" style={{ padding: '2.25rem 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.15rem' }}>
              <div className="van-3d-kpi-icon van-3d-icon-blue van-3d-pod-float" style={{ width: '46px', height: '46px', borderRadius: '13px' }}>
                <Receipt size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Real-Time Settlement Breakdown
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>
                  Statutory 5% TDS and net payable preview
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Requested Gross Claim:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '1rem' }}>
                  {formatINR(numAmount)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Statutory 5% TDS (Section 194H):</span>
                </span>
                <strong style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                  - {formatINR(tdsAmount)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px dashed #e2e8f0', color: '#64748b' }}>
                <span>Admin Processing Surcharge:</span>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>₹0.00 (Zero Fee)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid #e2e8f0', fontSize: '1.25rem', color: '#15803d' }}>
                <strong style={{ color: '#0f172a' }}>Net Receivable:</strong>
                <strong style={{ fontFamily: 'monospace' }}>{formatINR(netAmount)}</strong>
              </div>
            </div>
          </div>

          {/* Security & Compliance Standards Card */}
          <div className="van-kyc-card van-kyc-card-accent-emerald" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div className="van-3d-kpi-icon van-3d-icon-emerald van-3d-pod-float" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Security & Compliance Standards
                </h4>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Official regulatory guidelines for payouts</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem', color: '#334155' }}>
              <div className="van-kyc-checklist-row">
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>KYC requires only PAN and Aadhaar Card verification.</span>
              </div>
              <div className="van-kyc-checklist-row">
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>You can select any of your registered bank accounts or UPI IDs for payout.</span>
              </div>
              <div className="van-kyc-checklist-row">
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>All bank accounts must strictly match your registered KYC name: <strong style={{ color: '#0f172a' }}>{currentUser?.name || user?.name || 'Member'}</strong>.</span>
              </div>
              <div className="van-kyc-checklist-row">
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Updating bank/UPI payout credentials requires Email OTP verification.</span>
              </div>
              <div className="van-kyc-checklist-row">
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Minimum withdrawal threshold is ₹500 per transaction.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestWithdrawal;