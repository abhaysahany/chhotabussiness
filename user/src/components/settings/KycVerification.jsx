import React, { useState, useEffect, useCallback } from 'react';
import { submitPanAadhaarKyc } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { compressImageFile } from '../../utils/imageCompressor';

function KycVerification({ user, onNavigate }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [panNumber, setPanNumber] = useState(user?.pan_number || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(user?.aadhaar_number || '');

  // Previews / Uploaded base64 images
  const [panPreview, setPanPreview] = useState(user?.pan_card_image || '');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(user?.aadhaar_front_image || '');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(user?.aadhaar_back_image || '');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalImage, setModalImage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const fetchKycDetails = useCallback(async () => {
    try {
      setLoading(true);
      const fresh = await getUserFreshProfile();
      if (fresh) {
        setCurrentUser(fresh);
        setPanNumber(fresh.pan_number || '');
        setAadhaarNumber(fresh.aadhaar_number || '');
        if (fresh.pan_card_image) setPanPreview(fresh.pan_card_image);
        if (fresh.aadhaar_front_image) setAadhaarFrontPreview(fresh.aadhaar_front_image);
        if (fresh.aadhaar_back_image) setAadhaarBackPreview(fresh.aadhaar_back_image);
      }
    } catch (err) {
      console.error('Error loading KYC profile from database:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKycDetails();
  }, [fetchKycDetails]);

  const kycStatus = (currentUser?.kyc_status || 'unverified').toLowerCase();
  const isPending = kycStatus === 'pending' || kycStatus === 'under_process';
  const isVerified = kycStatus === 'verified' || kycStatus === 'approved';
  const isRejected = kycStatus === 'rejected';
  const isUnsubmitted = !isPending && !isVerified && !isRejected;

  // File upload handler with automatic client-side image compression
  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast('⏳ Compressing document image...');
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.85);

      if (type === 'pan') {
        setPanPreview(compressedDataUrl);
      } else if (type === 'aadhaar_front') {
        setAadhaarFrontPreview(compressedDataUrl);
      } else if (type === 'aadhaar_back') {
        setAadhaarBackPreview(compressedDataUrl);
      }
      showToast('✓ Document attached successfully!');
    } catch (err) {
      console.error('Image compression failed:', err);
      showToast('❌ Failed to process image file. Please try another image.');
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    const cleanPan = panNumber.trim().toUpperCase();
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');

    if (cleanPan.length < 10) {
      showToast('❌ Please enter a valid 10-character PAN Card number.');
      return;
    }

    if (cleanAadhaar.length < 12) {
      showToast('❌ Please enter a valid 12-digit Aadhaar Card number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_code: currentUser?.user_code || userCode,
        pan_number: cleanPan,
        aadhaar_number: cleanAadhaar,
        pan_card_image: panPreview || null,
        aadhaar_front_image: aadhaarFrontPreview || null,
        aadhaar_back_image: aadhaarBackPreview || null,
      };

      const res = await submitPanAadhaarKyc(payload);

      if (res && res.status === 'success') {
        setCurrentUser(res.user);
        setIsEditing(false);
        showToast(res.message || '🎉 KYC submitted! Your status is now Under Process ⏳');
        fetchKycDetails();
      } else {
        showToast(res.message || 'Failed to submit KYC.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting KYC to database.';
      showToast(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatAadhaarDisplay = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    if (!digits) return '•••• •••• ••••';
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
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
            zIndex: 999999,
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', border: '1px solid #bae6fd' }}>
            <span>🪪 Identity & TDS Compliance</span>
            <span>• PAN & Aadhaar Only</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
            KYC Verification Desk
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Submit PAN & Aadhaar proofs for statutory verification. Once Admin approves your KYC, Bank & UPI payout accounts will be unlocked.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={fetchKycDetails}
            disabled={loading}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '0.55rem 0.95rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 {loading ? 'Syncing...' : 'Sync Status'}
          </button>

          {isVerified && (
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('bank-accounts')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🏦</span> Go to Bank & UPI Accounts →
            </button>
          )}
        </div>
      </div>

      {/* STATUS BANNER 1: UNDER PROCESS / PENDING */}
      {isPending && !isEditing && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '2.2rem' }}>⏳</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <strong style={{ color: '#92400e', fontSize: '1.15rem' }}>
                  KYC Status: Under Process (In Review)
                </strong>
                <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', textTransform: 'uppercase' }}>
                  Under Review
                </span>
              </div>
              <p style={{ color: '#b45309', fontSize: '0.875rem', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                Your PAN and Aadhaar identity documents have been submitted to Admin. Once Admin completes the compliance verification, your status will change to <strong>Verified ✓</strong> and Bank/UPI payout accounts will be enabled.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              background: '#ffffff',
              color: '#92400e',
              border: '1px solid #fcd34d',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            ✏️ Edit / Resubmit Documents
          </button>
        </div>
      )}

      {/* STATUS BANNER 2: VERIFIED */}
      {isVerified && !isEditing && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.2rem' }}>✅</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <strong style={{ color: '#15803d', fontSize: '1.15rem' }}>
                  KYC Status: Verified & Approved
                </strong>
                <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', textTransform: 'uppercase' }}>
                  Verified ✓
                </span>
              </div>
              <p style={{ color: '#166534', fontSize: '0.875rem', margin: 0 }}>
                Your PAN and Aadhaar identity documents are approved in the database. You can now add multiple Bank Accounts, UPI IDs with QR codes, and withdraw commission earnings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('bank-accounts')}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.35rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
            }}
          >
            Manage Bank & UPI Accounts →
          </button>
        </div>
      )}

      {/* STATUS BANNER 3: REJECTED */}
      {isRejected && !isEditing && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
            border: '1px solid #fecdd3',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <span style={{ fontSize: '2.2rem' }}>❌</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <strong style={{ color: '#9f1239', fontSize: '1.15rem' }}>
                  KYC Status: Rejected
                </strong>
                <span style={{ background: '#e11d48', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', textTransform: 'uppercase' }}>
                  Action Required
                </span>
              </div>
              <p style={{ color: '#be123c', fontSize: '0.875rem', margin: 0, maxWidth: '650px' }}>
                Your submitted documents could not be approved by Admin. Please ensure your name matches registered profile details, check photo clarity, and resubmit below.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              background: '#e11d48',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Resubmit KYC Details →
          </button>
        </div>
      )}

      {/* UPLOADED DATA VIEW (Active when documents exist & not in edit mode) */}
      {(isPending || isVerified || isRejected) && !isEditing ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {/* Card 1: Identification Summary */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Submitted KYC Identification Record
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  background: isVerified ? '#dcfce7' : isPending ? '#fef3c7' : '#fee2e2',
                  color: isVerified ? '#15803d' : isPending ? '#b45309' : '#b91c1c',
                }}
              >
                ● {isVerified ? 'Verified' : isPending ? 'Under Process' : 'Rejected'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Registered Full Name:</span>
                <strong style={{ color: '#0f172a' }}>{currentUser?.name || user?.name || 'Member'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>PAN Card Number:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>{currentUser?.pan_number || 'N/A'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>12-Digit Aadhaar UID:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {formatAadhaarDisplay(currentUser?.aadhaar_number)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Submission Date:</span>
                <span style={{ color: '#334155', fontWeight: 600 }}>
                  {currentUser?.kyc_submitted_at ? new Date(currentUser.kyc_submitted_at).toLocaleString('en-IN') : 'Saved in Database'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                ✏️ Edit / Resubmit PAN & Aadhaar Proofs
              </button>
            </div>
          </div>

          {/* Card 2: Attached Document Scans Preview */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0' }}>
              Attached Document Proofs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* PAN Photo */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>📄 PAN Card Document</strong>
                  <span style={{ fontSize: '0.7rem', color: panPreview ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                    {panPreview ? '✓ Attached' : 'Not Attached'}
                  </span>
                </div>
                {panPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={panPreview}
                      alt="PAN Proof"
                      onClick={() => setModalImage({ title: 'PAN Card Document Proof', src: panPreview })}
                      style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                    <span
                      onClick={() => setModalImage({ title: 'PAN Card Document Proof', src: panPreview })}
                      style={{ fontSize: '0.75rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🔍 Click to Inspect Full Scan
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>PAN Number saved ({currentUser?.pan_number})</span>
                )}
              </div>

              {/* Aadhaar Front Photo */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>🪪 Aadhaar Front Side</strong>
                  <span style={{ fontSize: '0.7rem', color: aadhaarFrontPreview ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                    {aadhaarFrontPreview ? '✓ Attached' : 'Not Attached'}
                  </span>
                </div>
                {aadhaarFrontPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={aadhaarFrontPreview}
                      alt="Aadhaar Front"
                      onClick={() => setModalImage({ title: 'Aadhaar Card Front Side', src: aadhaarFrontPreview })}
                      style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                    <span
                      onClick={() => setModalImage({ title: 'Aadhaar Card Front Side', src: aadhaarFrontPreview })}
                      style={{ fontSize: '0.75rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🔍 Click to Inspect Full Scan
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Aadhaar UID saved ({formatAadhaarDisplay(currentUser?.aadhaar_number)})</span>
                )}
              </div>

              {/* Aadhaar Back Photo */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>🪪 Aadhaar Back Side</strong>
                  <span style={{ fontSize: '0.7rem', color: aadhaarBackPreview ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                    {aadhaarBackPreview ? '✓ Attached' : 'Optional'}
                  </span>
                </div>
                {aadhaarBackPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={aadhaarBackPreview}
                      alt="Aadhaar Back"
                      onClick={() => setModalImage({ title: 'Aadhaar Card Back Side', src: aadhaarBackPreview })}
                      style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                    <span
                      onClick={() => setModalImage({ title: 'Aadhaar Card Back Side', src: aadhaarBackPreview })}
                      style={{ fontSize: '0.75rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🔍 Click to Inspect Full Scan
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Back side scan attached</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* KYC SUBMISSION / EDIT FORM */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {/* Form Box */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isEditing ? 'Resubmit / Edit KYC Identification' : 'Submit KYC Identification'}
              </h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleKycSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* Registered Full Name Banner */}
              <div style={{ background: '#f8fafc', padding: '0.85rem 1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.825rem' }}>
                <span style={{ color: '#64748b' }}>Registered Full Name:</span>{' '}
                <strong style={{ color: '#0f172a' }}>{currentUser?.name || user?.name || 'Member'}</strong>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  * Name must match exactly on PAN and Aadhaar records.
                </div>
              </div>

              {/* Requirement 1: PAN Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>📄</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>1. PAN Card (Section 194H TDS) *</strong>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    10-Digit PAN Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="10"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Upload PAN Card Photo / Scan (Auto-Compressed)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'pan')}
                    style={{ fontSize: '0.78rem', color: '#64748b' }}
                  />
                  {panPreview && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={panPreview} alt="PAN Scan" style={{ width: '70px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>✓ Attached</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement 2: Aadhaar Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🪪</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>2. Aadhaar Card (Identity Proof) *</strong>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    12-Digit Aadhaar Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="14"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    placeholder="e.g. 1234 5678 9012"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Front Side Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'aadhaar_front')}
                      style={{ fontSize: '0.75rem', color: '#64748b' }}
                    />
                    {aadhaarFrontPreview && (
                      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <img src={aadhaarFrontPreview} alt="Aadhaar Front" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>✓ Attached</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Back Side Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'aadhaar_back')}
                      style={{ fontSize: '0.75rem', color: '#64748b' }}
                    />
                    {aadhaarBackPreview && (
                      <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <img src={aadhaarBackPreview} alt="Aadhaar Back" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>✓ Attached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                {submitting ? 'Submitting to Database...' : '✓ Submit KYC for Admin Verification'}
              </button>
            </form>
          </div>

          {/* Guidelines Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0' }}>
                KYC Verification Lifecycle
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                  <strong style={{ color: '#1d4ed8', display: 'block', fontSize: '0.85rem' }}>1. Submit PAN & Aadhaar Only</strong>
                  <span style={{ color: '#3b82f6', fontSize: '0.78rem' }}>
                    Provide 10-digit PAN and 12-digit Aadhaar UID.
                  </span>
                </div>

                <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <strong style={{ color: '#b45309', display: 'block', fontSize: '0.85rem' }}>2. Status: Under Process ⏳</strong>
                  <span style={{ color: '#92400e', fontSize: '0.78rem' }}>
                    Your submission goes to Admin for review.
                  </span>
                </div>

                <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                  <strong style={{ color: '#15803d', display: 'block', fontSize: '0.85rem' }}>3. Admin Verifies & Unlocks Bank/UPI</strong>
                  <span style={{ color: '#166534', fontSize: '0.78rem' }}>
                    Upon Admin verification, you can add any number of Bank Accounts & UPI IDs with QR codes.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM INSPECTION MODAL */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', maxWidth: '560px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{modalImage.title}</h4>
            <img src={modalImage.src} alt="Document Proof" style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <button
              type="button"
              onClick={() => setModalImage(null)}
              style={{ marginTop: '1rem', width: '100%', padding: '0.65rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KycVerification;
