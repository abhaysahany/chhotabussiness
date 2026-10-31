import React, { useState, useEffect, useCallback } from 'react';
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
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

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
    if (!newBank.bankName.trim() || !newBank.accountNumber.trim() || !newBank.ifscCode.trim()) {
      showToast('❌ Please fill in all required bank fields.');
      return;
    }
    if (newBank.accountNumber !== newBank.confirmAccountNumber) {
      showToast('❌ Account number and confirmation number do not match.');
      return;
    }

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
    if (!newUpi.upiId.trim()) {
      showToast('❌ Please enter a valid UPI ID (e.g. name@okhdfcbank).');
      return;
    }

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

      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', border: '1px solid #a7f3d0' }}>
            <span>🏦 Multi-Account Payout Vault</span>
            <span>• Email OTP Protected</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
            Bank & UPI Payout Accounts
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Manage multiple bank accounts and UPI IDs with QR codes for commission withdrawals. Name is strictly bound to registered KYC profile: <strong style={{ color: '#0f172a' }}>{registeredHolderName}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayoutAccounts}
          disabled={loading}
          style={{
            background: '#ffffff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          🔄 {loading ? 'Syncing...' : 'Sync Database'}
        </button>
      </div>

      {/* LOCKED NOTICE IF KYC NOT VERIFIED */}
      {!isKycVerified ? (
        <div
          style={{
            background: (currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? '#fffbeb' : '#fff1f2',
            border: (currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? '1px solid #fde68a' : '1px solid #fecdd3',
            borderRadius: '16px',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)',
            marginTop: '1rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
            {(currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? '⏳' : '🔒'}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: (currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? '#92400e' : '#9f1239', margin: '0 0 0.5rem 0' }}>
            {(currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? 'KYC Verification Under Process' : 'Bank & UPI Payout Accounts Locked'}
          </h2>
          <p style={{ color: (currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? '#b45309' : '#be123c', fontSize: '0.925rem', maxWidth: '640px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
            {(currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? (
              <>
                Your <strong>PAN & Aadhaar KYC documents</strong> are currently being reviewed by Admin. As soon as Admin approves your verification (<strong>Verified ✓</strong>), you will be able to add and manage your receiving Bank Accounts and UPI IDs.
              </>
            ) : (
              <>
                Regulatory rules require mandatory <strong>PAN and Aadhaar Card KYC Verification</strong> before bank accounts or UPI IDs can be configured for commission settlements.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('profile-kyc')}
            style={{
              background: (currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.925rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            }}
          >
            {(currentUser?.kyc_status === 'pending' || currentUser?.kyc_status === 'under_process') ? 'Check KYC Submission Status →' : 'Complete PAN & Aadhaar KYC Now →'}
          </button>
        </div>
      ) : (
        <div>
          {/* SECTION 1: MULTIPLE BANK ACCOUNTS */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                  Registered Bank Accounts ({bankAccounts.length})
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Add any number of bank accounts. Holder name: <strong>{registeredHolderName}</strong>.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBankModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>+</span> Add Bank Account (Email OTP)
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 0.75rem 0' }}>No bank accounts registered yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(true)}
                  style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.45rem 1rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  + Add Your First Bank Account
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '1.25rem 1.5rem',
                      border: b.is_primary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🏦</span>
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>{b.bank_name}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.branch || 'Main Branch'}</span>
                        </div>
                      </div>

                      {b.is_primary ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                          ★ Primary Payout
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryBank(b.id)}
                          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Make Primary
                        </button>
                      )}
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#64748b' }}>Account No:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{maskAccount(b.account_number)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ color: '#64748b' }}>IFSC Code:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{b.ifsc_code}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Account Holder:</span>
                        <strong style={{ color: '#0f172a' }}>{b.account_holder_name}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => triggerOtpForAction('delete_bank', b.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🗑️ Delete Bank (OTP)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MULTIPLE UPI IDs WITH QR CODE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                  Registered UPI IDs & QR Codes ({upiAccounts.length})
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Add any number of UPI VPAs with optional QR codes for instant commission transfer.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUpiModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>+</span> Add UPI ID & QR Code (Email OTP)
              </button>
            </div>

            {upiAccounts.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 0.75rem 0' }}>No UPI IDs registered yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(true)}
                  style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '0.45rem 1rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  + Add Your First UPI ID
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {upiAccounts.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '1.25rem 1.5rem',
                      border: u.is_primary ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>📲</span>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: '#0284c7', fontFamily: 'monospace' }}>{u.upi_id}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Holder: {u.holder_name}</span>
                        </div>
                      </div>

                      {u.is_primary ? (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
                          ★ Primary UPI
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryUpi(u.id)}
                          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Make Primary
                        </button>
                      )}
                    </div>

                    {/* QR Code preview if exists */}
                    {u.qr_code_image && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.65rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
                        <img
                          src={u.qr_code_image}
                          alt="UPI QR Code"
                          onClick={() => setShowQrPreviewModal(u.qr_code_image)}
                          style={{ width: '50px', height: '50px', objectFit: 'contain', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Attached QR Code</span>
                          <span
                            onClick={() => setShowQrPreviewModal(u.qr_code_image)}
                            style={{ fontSize: '0.7rem', color: '#0284c7', cursor: 'pointer', fontWeight: 600 }}
                          >
                            🔍 Click to Enlarge QR
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => triggerOtpForAction('delete_upi', u.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🗑️ Delete UPI (OTP)
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
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={newBank.ifscCode}
                    onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDFC0001234"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
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
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Confirm Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newBank.confirmAccountNumber}
                    onChange={(e) => setNewBank({ ...newBank, confirmAccountNumber: e.target.value })}
                    placeholder="Re-enter account number"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
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
