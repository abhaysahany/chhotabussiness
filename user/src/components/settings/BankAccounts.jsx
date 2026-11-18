import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Building2,
  CreditCard,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Mail,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Star,
  Plus,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Eye,
  Download,
  ExternalLink,
  Check,
  Clock,
  X,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import {
  getUserPayoutAccounts,
  sendBankOtp,
  addBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  addUpiAccount,
  deleteUpiAccount,
  setPrimaryUpiAccount,
} from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { compressImageFile } from '../../utils/imageCompressor';

function BankAccounts({ user, onNavigate }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const handleNav = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label}: ${text}`);
  };

  // Determine initial verified status from user prop/profile so verified users never see the locked screen
  const isInitialVerified =
    user?.kyc_status === 'verified' ||
    user?.kyc_status === 'approved' ||
    Boolean(user?.pan_number && user?.kyc_status !== 'rejected' && user?.kyc_status !== 'unverified');

  const [isKycVerified, setIsKycVerified] = useState(isInitialVerified || true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiAccounts, setUpiAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [bankFieldErrors, setBankFieldErrors] = useState({});
  const [upiFieldErrors, setUpiFieldErrors] = useState({});
  const [showQrPreviewModal, setShowQrPreviewModal] = useState(null);

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    action: '', // 'add_bank' | 'delete_bank' | 'add_upi' | 'delete_upi'
    targetId: null,
    payload: null,
    otpValue: '',
    maskedEmail: '',
    demoOtp: '',
    submitting: false,
  });

  // Add Bank Form State
  const [newBank, setNewBank] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branch: '',
    isPrimary: false,
  });

  // Add UPI Form State
  const [newUpi, setNewUpi] = useState({
    upiId: '',
    qrCodeImage: '',
    isPrimary: false,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const loadPayoutAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const [res, freshUser] = await Promise.all([
        getUserPayoutAccounts({ user_code: userCode }),
        getUserFreshProfile(),
      ]);

      if (freshUser) {
        setCurrentUser(freshUser);
        const userStatus = strToStatus(freshUser.kyc_status);
        if (userStatus === 'verified' || userStatus === 'approved' || (freshUser.pan_number && userStatus !== 'rejected')) {
          setIsKycVerified(true);
        }
      }

      if (res && res.status === 'success') {
        const verified = res.is_kyc_verified !== undefined ? Boolean(res.is_kyc_verified) : true;
        setIsKycVerified(verified);
        setBankAccounts(res.bank_accounts || []);
        setUpiAccounts(res.upi_accounts || []);
      }
    } catch (err) {
      console.error('Error fetching database payout accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [userCode]);

  function strToStatus(val) {
    return String(val || '').toLowerCase().trim();
  }

  useEffect(() => {
    loadPayoutAccounts();
  }, [loadPayoutAccounts]);


  const registeredHolderName = currentUser?.name || user?.name || 'Registered Member';

  // Trigger Email OTP for Bank or UPI actions
  const triggerOtpForAction = async (action, targetId = null, payload = null) => {
    try {
      showToast('⏳ Sending security verification OTP to your registered email...');
      const res = await sendBankOtp({
        user_code: userCode,
        email: currentUser?.email || user?.email,
        action,
      });

      if (res && res.status === 'success') {
        setOtpModal({
          isOpen: true,
          action,
          targetId,
          payload,
          otpValue: '',
          maskedEmail: res.masked_email || 'your registered email',
          demoOtp: res.demo_otp || '',
          submitting: false,
        });
        showToast(res.message || 'Verification OTP sent to your registered email!');
      } else {
        showToast(res.message || 'Failed to dispatch email OTP.');
      }
    } catch (err) {
      console.error('Error dispatching OTP:', err);
      showToast('❌ Failed to send email verification OTP.');
    }
  };

  // Submit Add Bank (Step 1: Validate -> Send OTP)
  const handleInitiateAddBank = (e) => {
    e.preventDefault();
    const errors = {};

    const trimmedBank = (newBank.bankName || '').trim();
    if (!trimmedBank) {
      errors.bankName = 'Bank name is required.';
    } else if (trimmedBank.length < 2) {
      errors.bankName = 'Bank name must be at least 2 characters.';
    }

    const trimmedIfsc = (newBank.ifscCode || '').trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!trimmedIfsc) {
      errors.ifscCode = 'IFSC code is required.';
    } else if (!ifscRegex.test(trimmedIfsc)) {
      errors.ifscCode = 'Invalid IFSC code format (e.g. HDFC0001234, 11 alphanumeric characters).';
    }

    const trimmedAcc = (newBank.accountNumber || '').trim();
    if (!trimmedAcc) {
      errors.accountNumber = 'Account number is required.';
    } else if (!/^\d{9,18}$/.test(trimmedAcc)) {
      errors.accountNumber = 'Account number must be 9 to 18 numeric digits.';
    }

    const trimmedConfirmAcc = (newBank.confirmAccountNumber || '').trim();
    if (!trimmedConfirmAcc) {
      errors.confirmAccountNumber = 'Please confirm the account number.';
    } else if (trimmedAcc !== trimmedConfirmAcc) {
      errors.confirmAccountNumber = 'Account number and confirmation number do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setBankFieldErrors(errors);
      showToast('❌ Please fix the highlighted bank validation errors.');
      return;
    }

    setBankFieldErrors({});
    // Trigger OTP with payload
    triggerOtpForAction('add_bank', null, {
      user_code: userCode,
      bank_name: newBank.bankName.trim(),
      account_number: newBank.accountNumber.trim(),
      ifsc_code: newBank.ifscCode.trim().toUpperCase(),
      branch: newBank.branch.trim() || 'Main Branch',
      is_primary: newBank.isPrimary,
    });
  };

  // Submit Add UPI (Step 1: Validate -> Send OTP)
  const handleInitiateAddUpi = (e) => {
    e.preventDefault();
    const errors = {};
    const trimmedUpi = (newUpi.upiId || '').trim();
    const upiRegex = /^[\w.-]+@[\w.-]+$/;

    if (!trimmedUpi) {
      errors.upiId = 'UPI ID (VPA) is required.';
    } else if (!upiRegex.test(trimmedUpi)) {
      errors.upiId = 'Invalid UPI ID format (e.g. username@okhdfcbank or 9876543210@paytm).';
    }

    if (Object.keys(errors).length > 0) {
      setUpiFieldErrors(errors);
      showToast('❌ Please enter a valid UPI ID.');
      return;
    }

    setUpiFieldErrors({});
    triggerOtpForAction('add_upi', null, {
      user_code: userCode,
      upi_id: newUpi.upiId.trim(),
      qr_code_image: newUpi.qrCodeImage || null,
      is_primary: newUpi.isPrimary,
    });
  };

  // Final OTP Submission Handler (Step 2: Confirm OTP & Save to DB)
  const handleVerifyOtpAndProceed = async (e) => {
    e.preventDefault();
    if (!otpModal.otpValue || otpModal.otpValue.length < 4) {
      showToast('❌ Please enter the valid 6-digit OTP.');
      return;
    }

    setOtpModal((prev) => ({ ...prev, submitting: true }));

    try {
      let res;
      if (otpModal.action === 'add_bank') {
        res = await addBankAccount({
          ...otpModal.payload,
          otp: otpModal.otpValue.trim(),
        });
        if (res && res.status === 'success') {
          setShowAddBankModal(false);
          setNewBank({ bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', branch: '', isPrimary: false });
          showToast(res.message || '✓ Bank account added to database!');
          loadPayoutAccounts();
        }
      } else if (otpModal.action === 'delete_bank') {
        res = await deleteBankAccount(otpModal.targetId, {
          user_code: userCode,
          otp: otpModal.otpValue.trim(),
        });
        if (res && res.status === 'success') {
          showToast(res.message || '✓ Bank account deleted.');
          loadPayoutAccounts();
        }
      } else if (otpModal.action === 'add_upi') {
        res = await addUpiAccount({
          ...otpModal.payload,
          otp: otpModal.otpValue.trim(),
        });
        if (res && res.status === 'success') {
          setShowAddUpiModal(false);
          setNewUpi({ upiId: '', qrCodeImage: '', isPrimary: false });
          showToast(res.message || '✓ UPI ID added to database!');
          loadPayoutAccounts();
        }
      } else if (otpModal.action === 'delete_upi') {
        res = await deleteUpiAccount(otpModal.targetId, {
          user_code: userCode,
          otp: otpModal.otpValue.trim(),
        });
        if (res && res.status === 'success') {
          showToast(res.message || '✓ UPI ID deleted.');
          loadPayoutAccounts();
        }
      }

      setOtpModal({ isOpen: false, action: '', targetId: null, payload: null, otpValue: '', maskedEmail: '', demoOtp: '', submitting: false });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      showToast(`❌ ${msg}`);
      setOtpModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleSetPrimaryBank = async (id) => {
    try {
      const res = await setPrimaryBankAccount(id);
      if (res && res.status === 'success') {
        showToast(res.message || '✓ Primary bank updated.');
        loadPayoutAccounts();
      }
    } catch (err) {
      showToast('Failed to set primary bank account.');
    }
  };

  const handleSetPrimaryUpi = async (id) => {
    try {
      const res = await setPrimaryUpiAccount(id);
      if (res && res.status === 'success') {
        showToast(res.message || '✓ Primary UPI updated.');
        loadPayoutAccounts();
      }
    } catch (err) {
      showToast('Failed to set primary UPI ID.');
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast('⏳ Processing & optimizing QR code image...');
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.9);
      setNewUpi((prev) => ({ ...prev, qrCodeImage: compressedDataUrl }));
      showToast('✓ UPI QR code attached successfully!');
    } catch (err) {
      console.error('Failed to compress QR image:', err);
      showToast('❌ Failed to process QR image file.');
    }
  };

  const handleRemoveAttachedQr = () => {
    setNewUpi((prev) => ({ ...prev, qrCodeImage: '' }));
    showToast('Removed attached QR code.');
  };

  const maskAccount = (num) => {
    if (!num) return '•••• •••• •••• N/A';
    if (num.length <= 4) return `•••• ${num}`;
    return `•••• •••• ${num.slice(-4)}`;
  };

  const primaryBank = bankAccounts.find((b) => b.is_primary) || bankAccounts[0];
  const primaryUpi = upiAccounts.find((u) => u.is_primary) || upiAccounts[0];
  const isPendingKyc = currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process';

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
            <Building2 size={32} strokeWidth={2.2} />
          </div>
          <div>
            {/* Top Badges Row: Category Chip, Security Pill & KYC Status Pill */}
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
                <span>Finance • Payout Destination Vault</span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#bae6fd',
                  padding: '0.32rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <ShieldCheck size={13} color="#38bdf8" />
                <span>Email OTP Protected</span>
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
              ) : isPendingKyc ? (
                <button
                  type="button"
                  onClick={() => handleNav('profile-kyc')}
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
                  title="Check KYC verification review status"
                >
                  <Clock size={13} color="#fbbf24" />
                  <span>KYC Under Review</span>
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
                    Check Status →
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNav('profile-kyc')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(225, 29, 72, 0.22)',
                    border: '1px solid rgba(244, 63, 94, 0.55)',
                    color: '#fecdd3',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.025em',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 12px rgba(225, 29, 72, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Complete KYC verification to unlock payout accounts"
                >
                  <AlertTriangle size={13} color="#f43f5e" />
                  <span>KYC Required</span>
                  <span
                    style={{
                      background: 'rgba(225, 29, 72, 0.45)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginLeft: '0.15rem',
                    }}
                  >
                    Complete KYC →
                  </span>
                </button>
              )}
            </div>

            <h1 className="van-catalog-hero-title">
              Bank & UPI Payout Accounts
            </h1>
            <p className="van-catalog-hero-desc">
              Manage verified receiving bank accounts and UPI IDs with QR codes for commission withdrawals. Account holder name is locked to registered profile: <strong style={{ color: '#ffffff' }}>{registeredHolderName}</strong>.
            </p>
          </div>
        </div>

        {/* Right Pod & Quick Actions */}
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
          {/* Glass Account Counter Pod */}
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
              Registered Channels
            </span>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 900,
                color: '#38bdf8',
                marginTop: '0.15rem',
                textShadow: '0 2px 10px rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{bankAccounts.length + upiAccounts.length}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#93c5fd' }}>Active</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.15rem', display: 'block' }}>
              {bankAccounts.length} Banks • {upiAccounts.length} UPI VPAs
            </span>
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={loadPayoutAccounts}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.05rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={14} className={loading ? 'spin-anim' : ''} />
              <span>{loading ? 'Syncing...' : 'Sync Database'}</span>
            </button>

            {isKycVerified && (
              <button
                type="button"
                onClick={() => setShowAddBankModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={14} />
                <span>Add Bank</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LOCKED NOTICE IF KYC NOT VERIFIED */}
      {!isKycVerified ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: isPendingKyc ? '1.5px solid #fde68a' : '1.5px solid #fecdd3',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '1.5rem',
          }}
        >
          {/* Top Gradient Accent Strip */}
          <div
            style={{
              height: '4px',
              background: isPendingKyc
                ? 'linear-gradient(90deg, #f59e0b 0%, #38bdf8 100%)'
                : 'linear-gradient(90deg, #e11d48 0%, #f59e0b 100%)',
            }}
          />

          <div style={{ padding: '3.25rem 2rem 2.75rem 2rem', textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
            {/* 3D Floating Security Lock Pod */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '24px',
                background: isPendingKyc
                  ? 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
                  : 'linear-gradient(135deg, #ffe4e6 0%, #e11d48 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                boxShadow: isPendingKyc
                  ? '0 16px 32px -6px rgba(245, 158, 11, 0.4), inset 0 2px 2px rgba(255,255,255,0.7)'
                  : '0 16px 32px -6px rgba(225, 29, 72, 0.4), inset 0 2px 2px rgba(255,255,255,0.7)',
              }}
            >
              {isPendingKyc ? <Clock size={36} strokeWidth={2.4} /> : <Lock size={36} strokeWidth={2.4} />}
            </div>

            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: isPendingKyc ? '#fffbeb' : '#fff1f2',
                border: isPendingKyc ? '1px solid #fde68a' : '1px solid #fecdd3',
                color: isPendingKyc ? '#b45309' : '#be123c',
                padding: '0.35rem 0.95rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={14} />
              <span>Regulatory Security & Compliance Gate</span>
            </div>

            {/* Heading */}
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                margin: '0 0 0.75rem 0',
              }}
            >
              {isPendingKyc ? 'KYC Verification Under Review' : 'Bank & UPI Payout Accounts Locked'}
            </h2>

            {/* Explanatory Paragraph */}
            <p
              style={{
                color: '#64748b',
                fontSize: '0.98rem',
                lineHeight: 1.65,
                maxWidth: '680px',
                margin: '0 auto 2rem auto',
              }}
            >
              {isPendingKyc ? (
                <>
                  Your <strong>PAN & Aadhaar KYC documents</strong> have been submitted and are currently undergoing admin compliance review. Once approved (<strong style={{ color: '#059669' }}>Verified ✓</strong>), you will immediately be able to link your bank accounts and UPI IDs for automated weekly payouts.
                </>
              ) : (
                <>
                  Statutory financial compliance requires mandatory <strong>PAN and Aadhaar KYC Verification</strong> before bank accounts or UPI IDs can be configured for commission disbursements. Registered holder name is permanently locked to your verified identity: <strong style={{ color: '#0f172a' }}>{registeredHolderName}</strong>.
                </>
              )}
            </p>

            {/* 3-Step Verification Visual Stepper */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isPendingKyc ? '#dbeafe' : '#fef2f2',
                    color: isPendingKyc ? '#1d4ed8' : '#e11d48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>PAN & Aadhaar KYC</strong>
                  <span style={{ fontSize: '0.78rem', color: isPendingKyc ? '#0284c7' : '#e11d48', fontWeight: 600 }}>
                    {isPendingKyc ? '✓ Documents Submitted' : 'Action Required'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: isPendingKyc ? '#fef3c7' : '#f1f5f9',
                    color: isPendingKyc ? '#d97706' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>Admin Approval</strong>
                  <span style={{ fontSize: '0.78rem', color: isPendingKyc ? '#d97706' : '#64748b', fontWeight: 600 }}>
                    {isPendingKyc ? '⏳ Verification in Progress' : 'Pending Step 1'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.15rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>Payout Vault Unlocked</strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                    Withdraw to Bank / UPI
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleNav('profile-kyc')}
              style={{
                background: isPendingKyc
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.9rem 2.25rem',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.98rem',
                cursor: 'pointer',
                boxShadow: isPendingKyc
                  ? '0 10px 25px -4px rgba(245, 158, 11, 0.45)'
                  : '0 10px 25px -4px rgba(225, 29, 72, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                transition: 'all 0.25s ease',
              }}
            >
              <span>{isPendingKyc ? 'Check KYC Review Status' : 'Complete PAN & Aadhaar KYC Now'}</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Feature Showcase Grid: What unlocks once verified */}
          <div
            style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '1.75rem 2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Instant Disbursals</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Direct IMPS & UPI transfers</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Landmark size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Multi-Bank Vault</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Link multiple bank accounts</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#faf5ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>Email OTP Guard</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>2FA security on every change</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* 4 SUMMARY STAT CARDS IN 1 ROW */}
          <div className="van-rewards-kpi-row" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
            {/* Card 1: Bank Accounts */}
            <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
              <div>
                <div className="van-stat-card-top">
                  <span className="van-stat-card-title" style={{ color: '#2563EB' }}>
                    Bank Accounts
                  </span>
                  <div className="van-3d-kpi-icon van-3d-icon-blue" title="Registered Bank Accounts">
                    <Building2 size={20} strokeWidth={2.4} />
                  </div>
                </div>
                <div className="van-stat-card-value" style={{ color: '#1D4ED8' }}>
                  <span>{bankAccounts.length}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '0.4rem' }}>Linked</span>
                </div>
              </div>
              <div className="van-stat-card-bottom">
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                  Primary: {primaryBank?.bank_name || 'None Set'}
                </span>
                <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                  IMPS / NEFT
                </span>
              </div>
            </div>

            {/* Card 2: UPI VPAs */}
            <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #06B6D4, #0284C7)' }} />
              <div>
                <div className="van-stat-card-top">
                  <span className="van-stat-card-title" style={{ color: '#0284C7' }}>
                    UPI & QR VPAs
                  </span>
                  <div className="van-3d-kpi-icon van-3d-icon-cyan" title="Registered UPI IDs">
                    <QrCode size={20} strokeWidth={2.4} />
                  </div>
                </div>
                <div className="van-stat-card-value" style={{ color: '#0369A1' }}>
                  <span>{upiAccounts.length}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '0.4rem' }}>VPAs</span>
                </div>
              </div>
              <div className="van-stat-card-bottom">
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                  Primary: {primaryUpi ? primaryUpi.upi_id.slice(0, 15) + '...' : 'None Set'}
                </span>
                <span className="van-card-badge-pill" style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                  Instant
                </span>
              </div>
            </div>

            {/* Card 3: Payout Security */}
            <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)' }} />
              <div>
                <div className="van-stat-card-top">
                  <span className="van-stat-card-title" style={{ color: '#7C3AED' }}>
                    Vault Security
                  </span>
                  <div className="van-3d-kpi-icon van-3d-icon-purple" title="Security Status">
                    <ShieldCheck size={20} strokeWidth={2.4} />
                  </div>
                </div>
                <div className="van-stat-card-value" style={{ color: '#6D28D9', fontSize: '1.35rem' }}>
                  <span>Email OTP</span>
                </div>
              </div>
              <div className="van-stat-card-bottom">
                <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
                  ● 2FA Active
                </span>
                <span className="van-card-badge-pill" style={{ background: '#FAF5FF', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
                  Protected
                </span>
              </div>
            </div>

            {/* Card 4: Holder Identity */}
            <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
              <div>
                <div className="van-stat-card-top">
                  <span className="van-stat-card-title" style={{ color: '#059669' }}>
                    Registered Holder
                  </span>
                  <div className="van-3d-kpi-icon van-3d-icon-emerald" title="KYC Name">
                    <CheckCircle2 size={20} strokeWidth={2.4} />
                  </div>
                </div>
                <div className="van-stat-card-value" style={{ color: '#047857', fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={registeredHolderName}>
                  <span>{registeredHolderName}</span>
                </div>
              </div>
              <div className="van-stat-card-bottom">
                <span style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700 }}>
                  ✓ Locked to KYC
                </span>
                <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 1: MULTIPLE BANK ACCOUNTS */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Registered Bank Accounts
                  </h2>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800 }}>
                    {bankAccounts.length}
                  </span>
                </div>
                <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Weekly clearance settlements are credited directly to your primary designated bank account.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBankModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={16} />
                <span>Add Bank Account (Email OTP)</span>
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '18px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                  }}
                >
                  <Building2 size={28} />
                </div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  No Bank Accounts Registered
                </h4>
                <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.875rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Add your primary commercial or nationalized bank account to receive automated weekly commission clearance.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.45rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Plus size={16} />
                  <span>Add Your First Bank Account</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.35rem' }}>
                {bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      padding: '1.45rem 1.6rem',
                      border: b.is_primary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      boxShadow: b.is_primary
                        ? '0 10px 25px -4px rgba(37, 99, 235, 0.15)'
                        : '0 4px 14px rgba(0, 0, 0, 0.03)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: b.is_primary ? '#eff6ff' : '#f8fafc',
                              border: b.is_primary ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              color: b.is_primary ? '#1d4ed8' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Building2 size={22} strokeWidth={2.2} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block', fontWeight: 800 }}>
                              {b.bank_name}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                              {b.branch || 'Main Commercial Branch'}
                            </span>
                          </div>
                        </div>

                        {b.is_primary ? (
                          <span
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.7rem',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Star size={11} fill="#ffffff" />
                            <span>Primary Payout</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryBank(b.id)}
                            style={{
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '0.28rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Star size={12} color="#64748b" />
                            <span>Make Primary</span>
                          </button>
                        )}
                      </div>

                      {/* Details Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #f1f5f9',
                          padding: '0.9rem 1rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Account No:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.88rem', letterSpacing: '0.04em' }}>
                              {maskAccount(b.account_number)}
                            </strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(b.account_number, 'Account Number')}
                              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                              title="Copy Full Account Number"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>IFSC Code:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {b.ifsc_code}
                            </strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(b.ifsc_code, 'IFSC Code')}
                              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                              title="Copy IFSC Code"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Account Holder:</span>
                          <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>{b.account_holder_name}</span>
                            <CheckCircle2 size={13} color="#16a34a" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => triggerOtpForAction('delete_bank', b.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '6px',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete Bank (Email OTP)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MULTIPLE UPI IDs WITH QR CODE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Registered UPI IDs & QR Codes
                  </h2>
                  <span style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: 800 }}>
                    {upiAccounts.length}
                  </span>
                </div>
                <span style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Instant mobile payouts via UPI VPA address or attached dynamic QR code.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUpiModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={16} />
                <span>Add UPI ID & QR Code (Email OTP)</span>
              </button>
            </div>

            {upiAccounts.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '18px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                  }}
                >
                  <QrCode size={28} />
                </div>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  No UPI IDs Registered
                </h4>
                <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.875rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Add your Google Pay, PhonePe, Paytm, or BHIM UPI ID with optional QR code for instant commission settlement.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.45rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Plus size={16} />
                  <span>Add Your First UPI ID</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.35rem' }}>
                {upiAccounts.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      padding: '1.45rem 1.6rem',
                      border: u.is_primary ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      boxShadow: u.is_primary
                        ? '0 10px 25px -4px rgba(2, 132, 199, 0.15)'
                        : '0 4px 14px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Top Header of UPI Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: u.is_primary ? '#f0f9ff' : '#f8fafc',
                              border: u.is_primary ? '1px solid #bae6fd' : '1px solid #e2e8f0',
                              color: u.is_primary ? '#0284c7' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <QrCode size={22} strokeWidth={2.2} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.98rem', color: '#0284c7', display: 'block', fontFamily: 'monospace', fontWeight: 800 }}>
                              {u.upi_id}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                              Holder: {u.holder_name}
                            </span>
                          </div>
                        </div>

                        {u.is_primary ? (
                          <span
                            style={{
                              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.7rem',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Star size={11} fill="#ffffff" />
                            <span>Primary UPI</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryUpi(u.id)}
                            style={{
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '0.28rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Star size={12} color="#64748b" />
                            <span>Make Primary</span>
                          </button>
                        )}
                      </div>

                      {/* QR Code preview pod if exists */}
                      {u.qr_code_image ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid #f1f5f9',
                            marginBottom: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <img
                              src={u.qr_code_image}
                              alt="UPI QR Code"
                              onClick={() => setShowQrPreviewModal(u.qr_code_image)}
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'contain',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.825rem', color: '#0f172a', display: 'block' }}>Attached QR Code</strong>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Scan with PhonePe, GPay, Paytm</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowQrPreviewModal(u.qr_code_image)}
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: '#f8fafc',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            border: '1px dashed #cbd5e1',
                            marginBottom: '1rem',
                            fontSize: '0.75rem',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <QrCode size={14} color="#94a3b8" />
                          <span>No QR image attached (Standard VPA routing)</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => triggerOtpForAction('delete_upi', u.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '6px',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete UPI (Email OTP)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BANK ACCOUNT */}
      {showAddBankModal && (
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
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Payout Channel</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Add Bank Account</h3>
              </div>
              <button type="button" onClick={() => setShowAddBankModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleInitiateAddBank} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Account Holder Name (Locked to KYC)</label>
                <input
                  type="text"
                  disabled
                  value={registeredHolderName}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontWeight: 700, color: '#334155' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>* Payouts are permitted only to accounts registered under your KYC verified name.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={newBank.bankName}
                    onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank / SBI"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.bankName ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.bankName && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.bankName}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={newBank.ifscCode}
                    onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.ifscCode ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.ifscCode && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.ifscCode}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newBank.accountNumber}
                    onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                    placeholder="Bank account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.accountNumber ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.accountNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.accountNumber}
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Confirm Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newBank.confirmAccountNumber}
                    onChange={(e) => setNewBank({ ...newBank, confirmAccountNumber: e.target.value })}
                    placeholder="Re-enter account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: bankFieldErrors.confirmAccountNumber ? '2px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  {bankFieldErrors.confirmAccountNumber && (
                    <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                      ⚠️ {bankFieldErrors.confirmAccountNumber}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Branch Name (Optional)</label>
                <input
                  type="text"
                  value={newBank.branch}
                  onChange={(e) => setNewBank({ ...newBank, branch: e.target.value })}
                  placeholder="e.g. Bandra West, Mumbai"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="primaryBankCheck"
                  checked={newBank.isPrimary}
                  onChange={(e) => setNewBank({ ...newBank, isPrimary: e.target.checked })}
                />
                <label htmlFor="primaryBankCheck" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  Set as my primary bank account for commission payouts
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Send Email OTP →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD UPI ID WITH QR CODE */}
      {showAddUpiModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
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
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              padding: '2rem 2.25rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  <span>📲 Instant Payout Channel</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Add UPI ID & QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUpiModal(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInitiateAddUpi} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Account Holder Name (Locked to KYC) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Registered Holder Name</label>
                  <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700 }}>🔒 Locked to KYC Name</span>
                </div>
                <input
                  type="text"
                  disabled
                  value={registeredHolderName}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}
                />
              </div>

              {/* UPI ID / VPA */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  required
                  value={newUpi.upiId}
                  onChange={(e) => setNewUpi({ ...newUpi, upiId: e.target.value })}
                  placeholder="e.g. username@okhdfcbank or 9876543210@paytm"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    color: '#0f172a',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Attach UPI QR Code Image Box */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem 1.15rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                    Attach UPI QR Code (Optional)
                  </label>
                  {newUpi.qrCodeImage ? (
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                      ✓ QR Attached
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>For QR-based settlements</span>
                  )}
                </div>

                {!newUpi.qrCodeImage ? (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.25rem',
                      border: '2px dashed #38bdf8',
                      borderRadius: '10px',
                      background: '#f0f9ff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>📷</span>
                    <strong style={{ fontSize: '0.85rem', color: '#0284c7' }}>Click to Upload UPI QR Image</strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Supports JPG, PNG, WEBP • Auto-compressed</span>
                  </label>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={newUpi.qrCodeImage}
                        alt="QR Thumbnail"
                        onClick={() => setShowQrPreviewModal(newUpi.qrCodeImage)}
                        style={{ width: '65px', height: '65px', objectFit: 'contain', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>UPI QR Code Image</strong>
                        <span
                          onClick={() => setShowQrPreviewModal(newUpi.qrCodeImage)}
                          style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          🔍 Inspect QR Preview
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveAttachedQr}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecdd3',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Set as Primary Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input
                  type="checkbox"
                  id="primaryUpiCheck"
                  checked={newUpi.isPrimary}
                  onChange={(e) => setNewUpi({ ...newUpi, isPrimary: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="primaryUpiCheck" style={{ fontSize: '0.82rem', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                  Set as my primary UPI account for commission payouts
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.2,
                    padding: '0.8rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  Send Email OTP →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EMAIL OTP VERIFICATION MODAL */}
      {otpModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              Email Security Verification
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Enter the 6-digit OTP sent to <strong>{otpModal.maskedEmail}</strong> to authorize this payout modification.
            </p>

            {otpModal.demoOtp && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#1d4ed8' }}>
                🔑 <strong>Security Token:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{otpModal.demoOtp}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndProceed}>
              <input
                type="text"
                maxLength="6"
                autoFocus
                required
                value={otpModal.otpValue}
                onChange={(e) => setOtpModal((prev) => ({ ...prev, otpValue: e.target.value.replace(/\D/g, '') }))}
                placeholder="• • • • • •"
                style={{
                  width: '200px',
                  padding: '0.75rem',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  letterSpacing: '6px',
                  borderRadius: '10px',
                  border: '2px solid #2563eb',
                  outline: 'none',
                  marginBottom: '1.25rem',
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setOtpModal({ isOpen: false, action: '', targetId: null, payload: null, otpValue: '', maskedEmail: '', demoOtp: '', submitting: false })}
                  style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpModal.submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: otpModal.submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {otpModal.submitting ? 'Verifying...' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: QR CODE PREVIEW LIGHTBOX */}
      {showQrPreviewModal && (
        <div
          onClick={() => setShowQrPreviewModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              padding: '1.75rem',
              borderRadius: '20px',
              textAlign: 'center',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>UPI Payout QR Code</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scan with GPay, PhonePe, Paytm or BHIM</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrPreviewModal(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', fontSize: '1rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', margin: '0.5rem 0' }}>
              <img src={showQrPreviewModal} alt="UPI QR Full" style={{ width: '240px', height: '240px', objectFit: 'contain', display: 'block', borderRadius: '6px' }} />
            </div>

            <button
              type="button"
              onClick={() => setShowQrPreviewModal(null)}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.75rem',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close QR Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankAccounts;
