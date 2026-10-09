import React, { useState, useEffect, useCallback } from 'react';
import { getUserPayouts, getUserPayoutAccounts, submitWithdrawalRequest } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { formatINR } from '../../utils/formatters';

function RequestWithdrawal({ user, onNavigate }) {
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

      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', border: '1px solid #a7f3d0' }}>
            <span>🔒 KYC Verified Payouts</span>
            <span>• Direct Database Ledger</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
            Request Commission Withdrawal
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Select any of your registered Bank Accounts or UPI IDs and withdraw available commission funds (Minimum ₹500).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => fetchLiveDatabaseProfile()}
            disabled={loadingProfile}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.55rem 0.95rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: loadingProfile ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 {loadingProfile ? 'Syncing...' : 'Sync Wallet'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('current-payouts')}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            ← Back to Payout Ledger
          </button>
        </div>
      </div>

      {/* KYC Warning Banner if Not Verified */}
      {!loadingProfile && !isKycVerified ? (
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#9f1239', fontSize: '1.05rem', display: 'block' }}>
                PAN & Aadhaar KYC Verification Required Before Withdrawals
              </strong>
              <p style={{ color: '#be123c', fontSize: '0.875rem', margin: '0.25rem 0 0 0', maxWidth: '650px', lineHeight: 1.5 }}>
                Statutory regulatory compliance mandates PAN and Aadhaar identity verification before commission payouts can be initiated.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('profile-kyc')}
            style={{
              background: '#e11d48',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
            }}
          >
            Complete PAN & Aadhaar KYC →
          </button>
        </div>
      ) : (!loadingProfile && !hasPayoutDestinations) ? (

        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🏦</span>
            <div>
              <strong style={{ color: '#92400e', fontSize: '1.05rem', display: 'block' }}>
                Add Bank Account or UPI ID to Receive Payouts
              </strong>
              <p style={{ color: '#b45309', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                Your PAN & Aadhaar KYC is verified! Please configure your receiving Bank Account or UPI ID in Payout Settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('bank-accounts')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            + Add Bank / UPI Account →
          </button>
        </div>
      ) : null}

      {/* Success Payout Notification */}
      {successPayout && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px', textTransform: 'uppercase' }}>
                ✓ Withdrawal Requested in Database
              </span>
              <h3 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                Withdrawal Voucher {successPayout.payout_code} Created Successfully!
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
                Gross Claimed: <strong>{formatINR(successPayout.requested_amount)}</strong> • 5% TDS: <strong style={{ color: '#b91c1c' }}>-{formatINR(successPayout.tds_deduction)}</strong> • Net Disbursable: <strong>{formatINR(successPayout.net_payable_amount)}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessPayout(null)}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#15803d', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
        {/* Withdrawal Form */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>
            Withdrawal Request
          </h2>

          <form onSubmit={handleInitiateWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Available Wallet Balance */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Available Commission Wallet
              </label>
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d' }}>
                    {formatINR(balance)}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Member: {currentUser?.name || user?.name} ({currentUser?.user_code || userCode})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(String(balance))}
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Withdraw All
                </button>
              </div>
            </div>

            {/* Withdrawal Amount (Min ₹500, starts at 0) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                  Enter Withdrawal Amount (₹) * <span style={{ color: '#b91c1c' }}>Min ₹500</span>
                </label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(String(Math.min(preset, balance)))}
                      style={{
                        background: Number(amount) === preset ? '#dcfce7' : '#f1f5f9',
                        color: Number(amount) === preset ? '#15803d' : '#475569',
                        border: Number(amount) === preset ? '1px solid #86efac' : '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

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
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: (numAmount === 0 || isAmountValid) ? '1px solid #cbd5e1' : '1px solid #ef4444',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  outline: 'none',
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                <span>{numAmount > 0 && numAmount < 500 ? <strong style={{ color: '#b91c1c' }}>⚠️ Minimum ₹500 required</strong> : 'Minimum withdrawal: ₹500'}</span>
                <span>Max Available: <strong style={{ color: '#15803d' }}>{formatINR(balance)}</strong></span>
              </div>
            </div>


            {/* Select Destination Account from User's Registered Accounts */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                  Select Receiving Payout Account
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('bank-accounts')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add / Manage Accounts ↗
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Bank Accounts List */}
                {bankAccounts.map((b) => {
                  const isSelected = selectedDestination?.type === 'bank' && selectedDestination?.data?.id === b.id;
                  return (
                    <div
                      key={`bank-${b.id}`}
                      onClick={() => setSelectedDestination({ type: 'bank', data: b })}
                      style={{
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        borderRadius: '12px',
                        padding: '0.85rem 1.15rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.35rem' }}>🏦</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{b.bank_name}</strong>
                            {b.is_primary && (
                              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                Primary
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            A/C: <strong style={{ color: '#334155' }}>{maskAccount(b.account_number)}</strong> • IFSC: <strong style={{ color: '#334155' }}>{b.ifsc_code}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #2563eb' : '2px solid #cbd5e1', background: '#ffffff' }} />
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
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#f8fafc',
                        borderRadius: '12px',
                        padding: '0.85rem 1.15rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.35rem' }}>📲</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#0284c7', fontFamily: 'monospace' }}>{u.upi_id}</strong>
                            {u.is_primary && (
                              <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                Primary UPI
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            Holder: {u.holder_name}
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: isSelected ? '5px solid #0284c7' : '2px solid #cbd5e1', background: '#ffffff' }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PAN Card Badge */}
            {currentUser?.pan_number && (
              <div style={{ background: '#f8fafc', padding: '0.65rem 0.95rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>TDS ID (Form 16A Credit):</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{currentUser.pan_number}</strong>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isKycVerified || !hasPayoutDestinations || !isAmountValid || processing}
              style={{
                width: '100%',
                padding: '0.95rem',
                borderRadius: '10px',
                border: 'none',
                background: !isKycVerified || !hasPayoutDestinations || !isAmountValid ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.98rem',
                cursor: !isKycVerified || !hasPayoutDestinations || !isAmountValid ? 'not-allowed' : 'pointer',
                boxShadow: isKycVerified && isAmountValid && hasPayoutDestinations ? '0 4px 14px rgba(22, 163, 74, 0.3)' : 'none',
                marginTop: '0.5rem',
              }}
            >
              {processing
                ? 'Submitting to Database...'
                : numAmount < 500
                ? 'Enter Amount (Min ₹500)'
                : `✓ Confirm & Withdraw ${formatINR(netAmount)}`}
            </button>

          </form>
        </div>

        {/* Sidebar Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
              Real-Time Settlement Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Requested Gross Claim:</span>
                <strong style={{ color: '#0f172a' }}>{formatINR(numAmount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
                <span>Statutory 5% TDS (Section 194H):</span>
                <strong>- {formatINR(tdsAmount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                <span>Admin Processing Surcharge:</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>₹0.00 (Free)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0', fontSize: '1.2rem', color: '#15803d' }}>
                <strong>Net Receivable:</strong>
                <strong>{formatINR(netAmount)}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>🛡️ Security & Compliance Standards:</div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>KYC requires only PAN and Aadhaar Card.</li>
                  <li>You can select any of your registered bank accounts or UPI IDs.</li>
                  <li>All bank accounts must match your registered KYC name.</li>
                  <li>Updating bank/UPI payout credentials requires Email OTP verification.</li>
                  <li>Minimum withdrawal limit is ₹500 per transaction.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestWithdrawal;
