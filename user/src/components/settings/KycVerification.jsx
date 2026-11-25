import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
  Upload,
  Eye,
  Trash2,
  ExternalLink,
  ChevronRight,
  X,
  Lock,
  Building2,
  Zap,
  Check,
  Info,
  FileCheck,
  Landmark,
  UserCheck,
} from 'lucide-react';
import { submitPanAadhaarKyc } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { compressImageFile } from '../../utils/imageCompressor';
import { formatDateTime } from '../../utils/timezone';

function KycVerification({ user, onNavigate }) {
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

  const [panNumber, setPanNumber] = useState(user?.pan_number || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(user?.aadhaar_number || '');

  // Previews / Uploaded base64 images
  const [panPreview, setPanPreview] = useState(user?.pan_card_image || '');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(user?.aadhaar_front_image || '');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(user?.aadhaar_back_image || '');

  // File names for UI display
  const [panFileName, setPanFileName] = useState('');
  const [aadhaarFrontFileName, setAadhaarFrontFileName] = useState('');
  const [aadhaarBackFileName, setAadhaarBackFileName] = useState('');

  // Field validation and touched states
  const [errors, setErrors] = useState({
    pan_number: '',
    aadhaar_number: '',
    pan_card_image: '',
    aadhaar_front_image: '',
    aadhaar_back_image: '',
  });

  const [touched, setTouched] = useState({
    pan_number: false,
    aadhaar_number: false,
    pan_card_image: false,
    aadhaar_front_image: false,
    aadhaar_back_image: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalImage, setModalImage] = useState(null);

  // Field DOM refs for scrolling and focus on validation error
  const panInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const panDocRef = useRef(null);
  const aadhaarFrontDocRef = useRef(null);
  const aadhaarBackDocRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // --- Strict Validation Rules ---
  const validatePan = (val) => {
    const trimmed = (val || '').trim().toUpperCase();
    if (!trimmed) {
      return 'PAN number is required.';
    }
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(trimmed)) {
      return 'Enter a valid 10-character PAN number (ABCDE1234F).';
    }
    return '';
  };

  const validateAadhaar = (val) => {
    const raw = (val || '').trim();
    if (!raw) {
      return 'Aadhaar number is required.';
    }
    const digits = raw.replace(/\s+/g, '');
    if (/\D/.test(digits)) {
      return 'Aadhaar number must contain only numeric digits.';
    }
    if (digits.length !== 12) {
      return 'Aadhaar number must contain exactly 12 digits.';
    }
    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(digits)) {
      return 'Aadhaar number must contain exactly 12 digits.';
    }
    return '';
  };

  const validatePanDoc = (preview) => {
    if (!preview) {
      return 'Please upload a valid PAN Card document.';
    }
    return '';
  };

  const validateAadhaarFrontDoc = (front, back) => {
    if (!front) {
      return 'Please upload the Aadhaar Front Side document.';
    }
    if (back && front === back) {
      return 'Front and Back side documents cannot be identical.';
    }
    return '';
  };

  const validateAadhaarBackDoc = (back, front) => {
    if (!back) {
      return 'Please upload the Aadhaar Back Side document.';
    }
    if (front && front === back) {
      return 'Front and Back side documents cannot be identical.';
    }
    return '';
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

  // --- Input Handlers with Real-Time Sanitization & Live Validation ---
  const handlePanChange = (e) => {
    // Convert to uppercase automatically, strip spaces & non-alphanumeric, max 10
    const raw = e.target.value.toUpperCase();
    const clean = raw.replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPanNumber(clean);
    if (touched.pan_number || errors.pan_number) {
      setErrors((prev) => ({ ...prev, pan_number: validatePan(clean) }));
    }
  };

  const handlePanBlur = () => {
    setTouched((prev) => ({ ...prev, pan_number: true }));
    setErrors((prev) => ({ ...prev, pan_number: validatePan(panNumber) }));
  };

  const handleAadhaarChange = (e) => {
    // Only numeric digits (0-9), max 12 digits, preserve leading zeros
    const clean = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(clean);
    if (touched.aadhaar_number || errors.aadhaar_number) {
      setErrors((prev) => ({ ...prev, aadhaar_number: validateAadhaar(clean) }));
    }
  };

  const handleAadhaarPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    const trimmed = pasted.trim();
    // Normalize whitespace & hyphens
    const cleaned = trimmed.replace(/[\s-]+/g, '');
    if (/^\d{12}$/.test(cleaned)) {
      setAadhaarNumber(cleaned);
      setErrors((prev) => ({ ...prev, aadhaar_number: '' }));
    } else {
      // Do not silently truncate longer invalid values
      const onlyDigits = cleaned.replace(/\D/g, '').slice(0, 12);
      setAadhaarNumber(onlyDigits);
      setTouched((prev) => ({ ...prev, aadhaar_number: true }));
      setErrors((prev) => ({
        ...prev,
        aadhaar_number: 'Aadhaar number must contain exactly 12 digits.',
      }));
    }
  };

  const handleAadhaarBlur = () => {
    setTouched((prev) => ({ ...prev, aadhaar_number: true }));
    setErrors((prev) => ({ ...prev, aadhaar_number: validateAadhaar(aadhaarNumber) }));
  };

  // --- Document File Selection with Strict Format & Size Checks ---
  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const fieldMap = {
      pan: 'pan_card_image',
      aadhaar_front: 'aadhaar_front_image',
      aadhaar_back: 'aadhaar_back_image',
    };
    const errField = fieldMap[type];

    // Validate MIME type
    if (!allowedMimes.includes(file.type.toLowerCase())) {
      const err = 'Invalid file format. Please upload a JPG, PNG, or WEBP image.';
      setErrors((prev) => ({ ...prev, [errField]: err }));
      showToast(`❌ ${err}`);
      e.target.value = '';
      return;
    }

    // Validate size limit (5MB)
    if (file.size > maxSizeBytes) {
      const err = 'File size exceeds 5MB limit. Please upload a smaller document.';
      setErrors((prev) => ({ ...prev, [errField]: err }));
      showToast(`❌ ${err}`);
      e.target.value = '';
      return;
    }

    try {
      showToast('⏳ Compressing document image...');
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.85);

      if (type === 'pan') {
        setPanPreview(compressedDataUrl);
        setPanFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
        setErrors((prev) => ({ ...prev, pan_card_image: '' }));
      } else if (type === 'aadhaar_front') {
        if (aadhaarBackPreview && compressedDataUrl === aadhaarBackPreview) {
          const dupErr = 'Front and Back side documents cannot be identical.';
          setErrors((prev) => ({ ...prev, aadhaar_front_image: dupErr }));
          showToast(`❌ ${dupErr}`);
          e.target.value = '';
          return;
        }
        setAadhaarFrontPreview(compressedDataUrl);
        setAadhaarFrontFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
        setErrors((prev) => ({
          ...prev,
          aadhaar_front_image: '',
          aadhaar_back_image: aadhaarBackPreview && compressedDataUrl === aadhaarBackPreview ? 'Front and Back side documents cannot be identical.' : prev.aadhaar_back_image,
        }));
      } else if (type === 'aadhaar_back') {
        if (aadhaarFrontPreview && compressedDataUrl === aadhaarFrontPreview) {
          const dupErr = 'Front and Back side documents cannot be identical.';
          setErrors((prev) => ({ ...prev, aadhaar_back_image: dupErr }));
          showToast(`❌ ${dupErr}`);
          e.target.value = '';
          return;
        }
        setAadhaarBackPreview(compressedDataUrl);
        setAadhaarBackFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
        setErrors((prev) => ({
          ...prev,
          aadhaar_back_image: '',
          aadhaar_front_image: aadhaarFrontPreview && compressedDataUrl === aadhaarFrontPreview ? 'Front and Back side documents cannot be identical.' : prev.aadhaar_front_image,
        }));
      }

      showToast('✓ Document attached successfully!');
    } catch (err) {
      console.error('Image compression failed:', err);
      showToast('❌ Failed to process image file. Please try another image.');
    }
  };

  const handleRemoveDoc = (type) => {
    if (type === 'pan') {
      setPanPreview('');
      setPanFileName('');
      setErrors((prev) => ({ ...prev, pan_card_image: 'Please upload a valid PAN Card document.' }));
    } else if (type === 'aadhaar_front') {
      setAadhaarFrontPreview('');
      setAadhaarFrontFileName('');
      setErrors((prev) => ({ ...prev, aadhaar_front_image: 'Please upload the Aadhaar Front Side document.' }));
    } else if (type === 'aadhaar_back') {
      setAadhaarBackPreview('');
      setAadhaarBackFileName('');
      setErrors((prev) => ({ ...prev, aadhaar_back_image: 'Please upload the Aadhaar Back Side document.' }));
    }
  };

  // --- Form Submission Handler with Full Pre-Flight Validation ---
  const handleKycSubmit = async (e) => {
    e.preventDefault();

    const panErr = validatePan(panNumber);
    const aadhaarErr = validateAadhaar(aadhaarNumber);
    const panDocErr = validatePanDoc(panPreview);
    const aadhaarFrontErr = validateAadhaarFrontDoc(aadhaarFrontPreview, aadhaarBackPreview);
    const aadhaarBackErr = validateAadhaarBackDoc(aadhaarBackPreview, aadhaarFrontPreview);

    const validationErrors = {
      pan_number: panErr,
      aadhaar_number: aadhaarErr,
      pan_card_image: panDocErr,
      aadhaar_front_image: aadhaarFrontErr,
      aadhaar_back_image: aadhaarBackErr,
    };

    setErrors(validationErrors);
    setTouched({
      pan_number: true,
      aadhaar_number: true,
      pan_card_image: true,
      aadhaar_front_image: true,
      aadhaar_back_image: true,
    });

    if (panErr || aadhaarErr || panDocErr || aadhaarFrontErr || aadhaarBackErr) {
      showToast('❌ Please resolve the highlighted validation errors.');

      // Auto-focus and scroll to first invalid field
      if (panErr && panInputRef.current) {
        panInputRef.current.focus();
        panInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (aadhaarErr && aadhaarInputRef.current) {
        aadhaarInputRef.current.focus();
        aadhaarInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (panDocErr && panDocRef.current) {
        panDocRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (aadhaarFrontErr && aadhaarFrontDocRef.current) {
        aadhaarFrontDocRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (aadhaarBackErr && aadhaarBackDocRef.current) {
        aadhaarBackDocRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const cleanPan = panNumber.trim().toUpperCase();
      const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');

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
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrs = err.response.data.errors;
        setErrors((prev) => ({
          ...prev,
          pan_number: backendErrs.pan_number ? backendErrs.pan_number[0] : prev.pan_number,
          aadhaar_number: backendErrs.aadhaar_number ? backendErrs.aadhaar_number[0] : prev.aadhaar_number,
          pan_card_image: backendErrs.pan_card_image ? backendErrs.pan_card_image[0] : prev.pan_card_image,
          aadhaar_front_image: backendErrs.aadhaar_front_image ? backendErrs.aadhaar_front_image[0] : prev.aadhaar_front_image,
          aadhaar_back_image: backendErrs.aadhaar_back_image ? backendErrs.aadhaar_back_image[0] : prev.aadhaar_back_image,
        }));
      }
      const msg = err.response?.data?.message || 'Error submitting KYC to database.';
      showToast(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Masked display for sensitive Aadhaar data
  const formatAadhaarDisplay = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    if (!digits) return '•••• •••• ••••';
    if (digits.length <= 4) return `•••• •••• ${digits}`;
    const last4 = digits.slice(-4);
    return `•••• •••• ${last4}`;
  };

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
            zIndex: 999999,
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
            <ShieldCheck size={32} strokeWidth={2.2} />
          </div>
          <div>
            {/* Top Badges Row: Category Chip, Statutory Chip & Live Status Pill */}
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
                <span>Identity & Compliance Desk</span>
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
                <FileCheck size={13} color="#38bdf8" />
                <span>Section 194H TDS • UIDAI</span>
              </div>

              {isVerified ? (
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
                  <span>KYC Verified & Approved</span>
                </div>
              ) : isPending ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
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
                  }}
                >
                  <Clock size={13} color="#fbbf24" />
                  <span>Under Review • In Process</span>
                </div>
              ) : isRejected ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
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
                  }}
                >
                  <AlertTriangle size={13} color="#f43f5e" />
                  <span>Rejected • Action Required</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
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
                  }}
                >
                  <AlertTriangle size={13} color="#fbbf24" />
                  <span>Submission Required</span>
                </div>
              )}
            </div>

            <h1 className="van-catalog-hero-title">
              KYC Verification Desk
            </h1>
            <p className="van-catalog-hero-desc">
              Statutory PAN & Aadhaar identification ledger for Income Tax TDS Section 194H compliance. Unlocks receiving bank accounts and instant UPI commission payouts upon verification.
            </p>
          </div>
        </div>

        {/* Right Member Pod & Action Controls */}
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
          {/* Glass Member Identity Pod */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '16px',
              padding: '0.85rem 1.25rem',
              textAlign: 'center',
              minWidth: 'min(100%, 220px)',
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
              Registered Member
            </span>
            <div
              className="van-kyc-hero-member-name"
              style={{
                fontSize: 'clamp(1.08rem, 4vw, 1.45rem)',
                fontWeight: 900,
                color: '#ffffff',
                marginTop: '0.15rem',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                wordBreak: 'break-word',
                lineHeight: 1.25,
                maxWidth: '100%',
              }}
              title={currentUser?.name || user?.name || 'Member'}
            >
              {currentUser?.name || user?.name || 'Member'}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              Code: {userCode || 'CB9741655'}
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={fetchKycDetails}
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
              <span>{loading ? 'Syncing...' : 'Sync Status'}</span>
            </button>

            {isVerified && (
              <button
                type="button"
                onClick={() => handleNav('bank-accounts')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Building2 size={14} />
                <span>Go to Bank & UPI Accounts →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATUS BANNER 1: UNDER PROCESS / PENDING */}
      {isPending && !isEditing && (
        <div
          className="van-kyc-section-box"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '18px',
            padding: '1.4rem 1.75rem',
            marginTop: '1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0, flex: '1 1 240px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={26} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <strong style={{ color: '#92400e', fontSize: '1.1rem', fontWeight: 800 }}>
                  KYC Verification Under Review
                </strong>
                <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Under Process ⏳
                </span>
              </div>
              <p style={{ color: '#b45309', fontSize: '0.865rem', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
                Your PAN and Aadhaar identity documents are undergoing admin compliance verification. Once approved, your status will become <strong style={{ color: '#92400e' }}>Verified ✓</strong> and Bank/UPI payout accounts will be unlocked automatically.
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
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>✏️ Edit / Resubmit Proofs</span>
          </button>
        </div>
      )}

      {/* STATUS BANNER 2: VERIFIED */}
      {isVerified && !isEditing && (
        <div
          className="van-kyc-section-box"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #bbf7d0',
            borderRadius: '18px',
            padding: '1.4rem 1.75rem',
            marginTop: '1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px -4px rgba(22, 163, 74, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0, flex: '1 1 240px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckCircle2 size={26} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <strong style={{ color: '#15803d', fontSize: '1.1rem', fontWeight: 800 }}>
                  KYC Verification Approved & Active
                </strong>
                <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Verified ✓
                </span>
              </div>
              <p style={{ color: '#166534', fontSize: '0.865rem', margin: 0, maxWidth: '720px' }}>
                Your PAN and Aadhaar records are fully compliant. You can now add multiple bank accounts, link dynamic UPI QR codes, and withdraw commission earnings seamlessly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleNav('bank-accounts')}
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.45rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span>Manage Bank & UPI Accounts</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* STATUS BANNER 3: REJECTED */}
      {isRejected && !isEditing && (
        <div
          className="van-kyc-section-box"
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
            border: '1.5px solid #fecdd3',
            borderRadius: '18px',
            padding: '1.4rem 1.75rem',
            marginTop: '1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px -4px rgba(225, 29, 72, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0, flex: '1 1 240px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#fee2e2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={26} strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <strong style={{ color: '#9f1239', fontSize: '1.1rem', fontWeight: 800 }}>
                  KYC Verification Rejected
                </strong>
                <span style={{ background: '#e11d48', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '12px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Action Required
                </span>
              </div>
              <p style={{ color: '#be123c', fontSize: '0.865rem', margin: 0, maxWidth: '720px' }}>
                Your submitted documents could not be approved by Admin. Please ensure legal name matches your registered profile, check document image clarity, and resubmit below.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.45rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span>Resubmit KYC Details</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 4 CORE KYC SUMMARY STAT CARDS IN 1 ROW (Active when documents exist & not editing) */}
      {(isPending || isVerified || isRejected) && !isEditing && (
        <div className="van-rewards-kpi-row" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          {/* Card 1: KYC Status */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3.5px',
                background: isVerified
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : isPending
                  ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                  : 'linear-gradient(90deg, #E11D48, #BE123C)',
              }}
            />
            <div>
              <div className="van-stat-card-top">
                <span className="van-stat-card-title" style={{ color: isVerified ? '#059669' : isPending ? '#D97706' : '#E11D48' }}>
                  KYC Verification
                </span>
                <div
                  className={`van-3d-kpi-icon ${isVerified ? 'van-3d-icon-emerald' : isPending ? 'van-3d-icon-amber' : 'van-3d-icon-red'}`}
                  title="Compliance Status"
                >
                  {isVerified ? <CheckCircle2 size={20} strokeWidth={2.4} /> : isPending ? <Clock size={20} strokeWidth={2.4} /> : <AlertTriangle size={20} strokeWidth={2.4} />}
                </div>
              </div>
              <div className="van-stat-card-value" style={{ color: isVerified ? '#059669' : isPending ? '#B45309' : '#BE123C', fontSize: '1.45rem' }}>
                <span>{isVerified ? 'Approved' : isPending ? 'In Review' : 'Rejected'}</span>
              </div>
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                {isVerified ? 'Statutory Active' : isPending ? 'Under Admin Review' : 'Correction Needed'}
              </span>
              <span
                className="van-card-badge-pill"
                style={{
                  background: isVerified ? '#ECFDF5' : isPending ? '#FEF3C7' : '#FEE2E2',
                  color: isVerified ? '#047857' : isPending ? '#B45309' : '#B91C1C',
                  border: isVerified ? '1px solid #A7F3D0' : isPending ? '1px solid #FDE68A' : '1px solid #FECDD3',
                }}
              >
                {isVerified ? 'Verified ✓' : isPending ? 'Pending ⏳' : 'Action ⚠️'}
              </span>
            </div>
          </div>

          {/* Card 2: PAN Card */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
            <div>
              <div className="van-stat-card-top">
                <span className="van-stat-card-title" style={{ color: '#2563EB' }}>
                  PAN Card (194H)
                </span>
                <div className="van-3d-kpi-icon van-3d-icon-blue" title="PAN Number">
                  <FileText size={20} strokeWidth={2.4} />
                </div>
              </div>
              <div className="van-stat-card-value" style={{ color: '#1D4ED8', fontFamily: 'monospace', fontSize: '1.25rem' }}>
                <span>{currentUser?.pan_number || 'N/A'}</span>
              </div>
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                {panPreview ? 'Document Proof Attached' : 'Number on Record'}
              </span>
              <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                TDS 5%
              </span>
            </div>
          </div>

          {/* Card 3: Aadhaar UID */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #06B6D4, #0284C7)' }} />
            <div>
              <div className="van-stat-card-top">
                <span className="van-stat-card-title" style={{ color: '#0284C7' }}>
                  Aadhaar UID
                </span>
                <div className="van-3d-kpi-icon van-3d-icon-cyan" title="Aadhaar UIDAI">
                  <CreditCard size={20} strokeWidth={2.4} />
                </div>
              </div>
              <div className="van-stat-card-value" style={{ color: '#0369A1', fontFamily: 'monospace', fontSize: '1.2rem' }}>
                <span>{formatAadhaarDisplay(currentUser?.aadhaar_number)}</span>
              </div>
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                {aadhaarFrontPreview && aadhaarBackPreview ? 'Front & Back Scans' : '12-Digit UID'}
              </span>
              <span className="van-card-badge-pill" style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                UIDAI
              </span>
            </div>
          </div>

          {/* Card 4: Payout Vault Status */}
          <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)' }} />
            <div>
              <div className="van-stat-card-top">
                <span className="van-stat-card-title" style={{ color: '#7C3AED' }}>
                  Payout Vault
                </span>
                <div className="van-3d-kpi-icon van-3d-icon-purple" title="Payout Access">
                  {isVerified ? <Unlock size={20} strokeWidth={2.4} /> : <Lock size={20} strokeWidth={2.4} />}
                </div>
              </div>
              <div className="van-stat-card-value" style={{ color: isVerified ? '#059669' : '#6D28D9', fontSize: '1.35rem' }}>
                <span>{isVerified ? 'Unlocked' : 'Locked'}</span>
              </div>
            </div>
            <div className="van-stat-card-bottom">
              <span style={{ fontSize: '0.76rem', color: isVerified ? '#059669' : '#64748b', fontWeight: 600 }}>
                {isVerified ? 'Bank & UPI Active' : 'Unlocks upon approval'}
              </span>
              <span className="van-card-badge-pill" style={{ background: '#FAF5FF', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
                {isVerified ? 'Enabled' : 'Restricted'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* UPLOADED DATA VIEW (Active when documents exist & not in edit mode) */}
      {(isPending || isVerified || isRejected) && !isEditing ? (
        <div className="van-kyc-review-grid">
          {/* Card 1: Identification Summary */}
          <div className="van-kyc-review-card">
            <div className="van-security-card-stripe blue"></div>
            <div className="van-security-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-blue" style={{ width: '40px', height: '40px', borderRadius: '11px' }}>
                  <UserCheck size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 className="van-security-card-h2">Submitted Identification Record</h2>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Statutory government compliance profile</span>
                </div>
              </div>

              <span className={`van-card-badge-pill ${isVerified ? 'green' : isPending ? 'amber' : 'red'}`}>
                {isVerified ? '● Verified' : isPending ? '● Under Review' : '● Action Needed'}
              </span>
            </div>

            <div className="van-kyc-review-body">
              <div className="van-kyc-field-stack">
                <div className="van-kyc-field-pod">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="van-profile-field-lbl">Registered Full Name</span>
                    <span className="van-card-badge-pill blue" style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem', whiteSpace: 'nowrap' }}>Primary Beneficiary</span>
                  </div>
                  <strong style={{ color: '#0F172A', fontSize: '0.98rem', fontWeight: 800, wordBreak: 'break-word' }}>
                    {currentUser?.name || user?.name || 'Member'}
                  </strong>
                </div>

                <div className="van-kyc-field-pod">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="van-profile-field-lbl">PAN Card Number (Income Tax)</span>
                    <span className="van-card-badge-pill teal" style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem', whiteSpace: 'nowrap' }}>TDS 5% Active</span>
                  </div>
                  <span style={{ color: '#1D4ED8', fontFamily: 'monospace', fontWeight: 850, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                    {currentUser?.pan_number || 'N/A'}
                  </span>
                </div>

                <div className="van-kyc-field-pod">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="van-profile-field-lbl">12-Digit Aadhaar Identification</span>
                    <span className="van-card-badge-pill purple" style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem', whiteSpace: 'nowrap' }}>UIDAI Masked</span>
                  </div>
                  <span style={{ color: '#0369A1', fontFamily: 'monospace', fontWeight: 850, fontSize: '1.02rem', letterSpacing: '0.05em' }}>
                    {formatAadhaarDisplay(currentUser?.aadhaar_number)}
                  </span>
                </div>

                <div className="van-kyc-field-pod">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="van-profile-field-lbl">Submission Date & Audit Trail</span>
                    <span className="van-card-badge-pill green" style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem', whiteSpace: 'nowrap' }}>Encrypted Vault</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155', fontWeight: 650, fontSize: '0.88rem' }}>
                    <Clock size={15} style={{ color: '#64748B', flexShrink: 0 }} />
                    <span>{currentUser?.kyc_submitted_at ? formatDateTime(currentUser.kyc_submitted_at) : '18 Nov 2026, 01:32 pm'}</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="van-kyc-edit-btn"
                >
                  <FileText size={16} strokeWidth={2.3} />
                  <span>Edit / Resubmit PAN & Aadhaar Proofs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Attached Document Scans Preview */}
          <div className="van-kyc-review-card">
            <div className="van-security-card-stripe emerald"></div>
            <div className="van-security-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-emerald" style={{ width: '40px', height: '40px', borderRadius: '11px' }}>
                  <FileCheck size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="van-security-card-h2">Attached Document Proofs</h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Verified scans stored in encrypted storage</span>
                </div>
              </div>

              <span className="van-card-badge-pill teal">
                {panPreview && aadhaarFrontPreview && aadhaarBackPreview ? '✓ 3 Proofs Stored' : 'Document Vault'}
              </span>
            </div>

            <div className="van-kyc-review-body">
              <div className="van-kyc-doc-list">
                {/* 1. PAN Photo */}
                <div className="van-kyc-doc-pod">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} color="#2563EB" />
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>PAN Card Document</strong>
                    </div>
                    <span className="van-security-status-badge verified">
                      <Check size={12} strokeWidth={2.8} /> Attached
                    </span>
                  </div>

                  {panPreview ? (
                    <div className="van-kyc-doc-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <div
                          className="van-kyc-thumb-box"
                          onClick={() => setModalImage({ title: 'PAN Card Document Proof', src: panPreview })}
                          title="Click to preview high-res image"
                        >
                          <img src={panPreview} alt="PAN Proof" className="van-kyc-thumb-img" />
                          <div className="van-kyc-thumb-overlay">
                            <Eye size={18} strokeWidth={2.2} />
                          </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>PAN Scan File</strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Format: Valid Image Proof</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalImage({ title: 'PAN Card Document Proof', src: panPreview })}
                        className="van-vault-action-btn"
                        title="Inspect full image"
                      >
                        <Eye size={13} strokeWidth={2.4} />
                        <span>Inspect</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>PAN Number saved on file: {currentUser?.pan_number}</span>
                  )}
                </div>

                {/* 2. Aadhaar Front Photo */}
                <div className="van-kyc-doc-pod">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={16} color="#0284C7" />
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Aadhaar Front Side</strong>
                    </div>
                    <span className="van-security-status-badge verified">
                      <Check size={12} strokeWidth={2.8} /> Attached
                    </span>
                  </div>

                  {aadhaarFrontPreview ? (
                    <div className="van-kyc-doc-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <div
                          className="van-kyc-thumb-box"
                          onClick={() => setModalImage({ title: 'Aadhaar Card Front Side', src: aadhaarFrontPreview })}
                          title="Click to preview high-res image"
                        >
                          <img src={aadhaarFrontPreview} alt="Aadhaar Front" className="van-kyc-thumb-img" />
                          <div className="van-kyc-thumb-overlay">
                            <Eye size={18} strokeWidth={2.2} />
                          </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>Aadhaar Front Scan</strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Name & Photo Side</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalImage({ title: 'Aadhaar Card Front Side', src: aadhaarFrontPreview })}
                        className="van-vault-action-btn"
                        title="Inspect full image"
                      >
                        <Eye size={13} strokeWidth={2.4} />
                        <span>Inspect</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>UID saved: {formatAadhaarDisplay(currentUser?.aadhaar_number)}</span>
                  )}
                </div>

                {/* 3. Aadhaar Back Photo */}
                <div className="van-kyc-doc-pod">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={16} color="#0284C7" />
                      <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Aadhaar Back Side</strong>
                    </div>
                    <span className="van-security-status-badge verified">
                      <Check size={12} strokeWidth={2.8} /> Attached
                    </span>
                  </div>

                  {aadhaarBackPreview ? (
                    <div className="van-kyc-doc-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <div
                          className="van-kyc-thumb-box"
                          onClick={() => setModalImage({ title: 'Aadhaar Card Back Side', src: aadhaarBackPreview })}
                          title="Click to preview high-res image"
                        >
                          <img src={aadhaarBackPreview} alt="Aadhaar Back" className="van-kyc-thumb-img" />
                          <div className="van-kyc-thumb-overlay">
                            <Eye size={18} strokeWidth={2.2} />
                          </div>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A', display: 'block' }}>Aadhaar Back Scan</strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Address & QR Side</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalImage({ title: 'Aadhaar Card Back Side', src: aadhaarBackPreview })}
                        className="van-vault-action-btn"
                        title="Inspect full image"
                      >
                        <Eye size={13} strokeWidth={2.4} />
                        <span>Inspect</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Address scan on record</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* KYC SUBMISSION / EDIT FORM (Active for Unverified or In Editing Mode) */
        <div className="van-kyc-grid-layout">
          {/* Left Column: Form Box */}
          <div className="van-kyc-card van-kyc-card-accent-blue van-kyc-card-pad" style={{ padding: '2.5rem 2.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: '1 1 200px', minWidth: 0 }}>
                <div className="van-3d-kpi-icon van-3d-icon-blue van-3d-pod-float" style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0 }}>
                  <FileCheck size={24} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                    {isEditing ? 'Resubmit / Edit KYC Identification' : 'Submit KYC Identification'}
                  </h2>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem', display: 'block', lineHeight: 1.4 }}>
                    Government proof for statutory tax deduction and commission payouts
                  </span>
                </div>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '10px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleKycSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.45rem' }}>
              {/* Registered Full Name Banner */}
              <div
                className="van-kyc-name-banner"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                  padding: '1.15rem 1.35rem',
                  borderRadius: '16px',
                  border: '1.5px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
                }}
              >
                <div className="van-3d-kpi-icon van-3d-icon-cyan van-3d-pod-float" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
                  <UserCheck size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Registered Profile Name
                  </div>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', letterSpacing: '-0.01em', display: 'block', marginTop: '0.15rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {currentUser?.name || user?.name || 'Member'}
                  </strong>
                  <div style={{ fontSize: '0.74rem', color: '#b45309', marginTop: '0.25rem', fontWeight: 600, lineHeight: 1.4 }}>
                    * Important: Name on PAN and Aadhaar must match this record exactly.
                  </div>
                </div>
              </div>

              {/* Requirement 1: PAN Card Box */}
              <div
                className="van-kyc-section-box"
                style={{
                  border: errors.pan_number || errors.pan_card_image ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '1.65rem 1.65rem',
                  background: errors.pan_number || errors.pan_card_image ? '#fff5f5' : '#ffffff',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div className="van-kyc-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 180px', minWidth: 0 }}>
                    <div className="van-3d-kpi-icon van-3d-icon-blue van-3d-pod-float" style={{ width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0 }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', fontWeight: 800, lineHeight: 1.3 }}>
                        1. PAN Card (Section 194H TDS)
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.1rem' }}>Statutory tax deduction compliance</span>
                    </div>
                  </div>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Required *
                  </span>
                </div>

                {/* PAN Number Input */}
                <div style={{ marginBottom: '1.35rem' }}>
                  <label htmlFor="pan_number_input" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                    10-Character PAN Card Number *
                  </label>
                  <input
                    id="pan_number_input"
                    ref={panInputRef}
                    type="text"
                    maxLength={10}
                    value={panNumber}
                    onChange={handlePanChange}
                    onBlur={handlePanBlur}
                    placeholder="e.g. ABCDE1234F"
                    className={`van-kyc-input-box ${errors.pan_number ? 'error' : ''}`}
                  />
                  {errors.pan_number && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={14} /> {errors.pan_number}
                    </p>
                  )}
                  <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
                    Format: 5 letters, 4 digits, 1 letter (e.g. <code style={{ background: '#f1f5f9', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 700, color: '#0f172a' }}>ABCDE1234F</code>)
                  </span>
                </div>

                {/* Modern PAN File Upload */}
                <div ref={panDocRef}>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                    Upload PAN Card Photo / Scan *
                  </label>

                  {!panPreview ? (
                    <label
                      htmlFor="pan_file_input"
                      className={`van-kyc-dropzone ${errors.pan_card_image ? 'error' : ''}`}
                    >
                      <input
                        id="pan_file_input"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={(e) => handleFileChange(e, 'pan')}
                        style={{ display: 'none' }}
                      />
                      <div className="van-3d-kpi-icon van-3d-icon-blue van-3d-pod-float" style={{ width: '46px', height: '46px', borderRadius: '13px', marginBottom: '0.75rem' }}>
                        <Upload size={20} />
                      </div>
                      <strong style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 800 }}>Click to Browse or Drag PAN Photo</strong>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem' }}>Supports JPG, PNG, WEBP • Max 5MB (Auto-compressed)</span>
                    </label>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '0.9rem 1.15rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <img
                          src={panPreview}
                          alt="PAN Scan"
                          onClick={() => setModalImage({ title: 'PAN Card Scan Proof', src: panPreview })}
                          style={{ width: '70px', height: '46px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block', fontWeight: 800 }}>PAN Scan Attached</strong>
                          <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem', wordBreak: 'break-word' }}>
                            <Check size={13} style={{ flexShrink: 0 }} /> {panFileName || 'Verified Image File'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <button
                          type="button"
                          onClick={() => setModalImage({ title: 'PAN Card Scan Proof', src: panPreview })}
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.42rem 0.8rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s ease' }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc('pan')}
                          style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '0.42rem 0.8rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s ease' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {errors.pan_card_image && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={14} /> {errors.pan_card_image}
                    </p>
                  )}
                </div>
              </div>

              {/* Requirement 2: Aadhaar Card Box */}
              <div
                className="van-kyc-section-box"
                style={{
                  border: errors.aadhaar_number || errors.aadhaar_front_image || errors.aadhaar_back_image ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '1.65rem 1.65rem',
                  background: errors.aadhaar_number || errors.aadhaar_front_image || errors.aadhaar_back_image ? '#fff5f5' : '#ffffff',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                  transition: 'all 0.25s ease',
                }}
              >
                <div className="van-kyc-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 180px', minWidth: 0 }}>
                    <div className="van-3d-kpi-icon van-3d-icon-cyan van-3d-pod-float" style={{ width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0 }}>
                      <CreditCard size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', fontWeight: 800, lineHeight: 1.3 }}>
                        2. Aadhaar Card (UIDAI Identity Proof)
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.1rem' }}>Residential address & identity verification</span>
                    </div>
                  </div>
                  <span style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Required *
                  </span>
                </div>

                {/* Aadhaar Number Input */}
                <div style={{ marginBottom: '1.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.45rem' }}>
                    <label htmlFor="aadhaar_number_input" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      12-Digit Aadhaar Card Number *
                    </label>
                    <span style={{ fontSize: '0.74rem', color: aadhaarNumber.length === 12 ? '#16a34a' : '#64748b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {aadhaarNumber.length} / 12 Digits
                    </span>
                  </div>
                  <input
                    id="aadhaar_number_input"
                    ref={aadhaarInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    onPaste={handleAadhaarPaste}
                    onBlur={handleAadhaarBlur}
                    placeholder="e.g. 123456789012"
                    className={`van-kyc-input-box ${errors.aadhaar_number ? 'error' : ''}`}
                  />
                  {errors.aadhaar_number && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.4rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={14} /> {errors.aadhaar_number}
                    </p>
                  )}
                  <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
                    Rule: Exactly 12 numeric digits (0-9 only, leading zeros preserved)
                  </span>
                </div>

                {/* Aadhaar Front & Back Upload Zones */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '1.15rem' }}>
                  {/* Front Side */}
                  <div ref={aadhaarFrontDocRef}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                      Front Side Photo *
                    </label>

                    {!aadhaarFrontPreview ? (
                      <label
                        htmlFor="aadhaar_front_file"
                        className={`van-kyc-dropzone ${errors.aadhaar_front_image ? 'error' : ''}`}
                        style={{ minHeight: '135px', padding: '1.35rem 0.85rem' }}
                      >
                        <input
                          id="aadhaar_front_file"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          onChange={(e) => handleFileChange(e, 'aadhaar_front')}
                          style={{ display: 'none' }}
                        />
                        <div className="van-3d-kpi-icon van-3d-icon-cyan van-3d-pod-float" style={{ width: '38px', height: '38px', borderRadius: '10px', marginBottom: '0.45rem' }}>
                          <Upload size={17} />
                        </div>
                        <strong style={{ fontSize: '0.84rem', color: '#0369a1', fontWeight: 800 }}>Upload Front</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Photo & Name Details</span>
                      </label>
                    ) : (
                      <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <img
                            src={aadhaarFrontPreview}
                            alt="Aadhaar Front"
                            onClick={() => setModalImage({ title: 'Aadhaar Card Front Side', src: aadhaarFrontPreview })}
                            style={{ width: '56px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', fontWeight: 800 }}>Front Scan</strong>
                            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={11} /> Attached
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setModalImage({ title: 'Aadhaar Card Front Side', src: aadhaarFrontPreview })}
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Inspect"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc('aadhaar_front')}
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {errors.aadhaar_front_image && (
                      <p style={{ color: '#dc2626', fontSize: '0.73rem', fontWeight: 700, marginTop: '0.35rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={13} /> {errors.aadhaar_front_image}
                      </p>
                    )}
                  </div>

                  {/* Back Side */}
                  <div ref={aadhaarBackDocRef}>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                      Back Side Photo *
                    </label>

                    {!aadhaarBackPreview ? (
                      <label
                        htmlFor="aadhaar_back_file"
                        className={`van-kyc-dropzone ${errors.aadhaar_back_image ? 'error' : ''}`}
                        style={{ minHeight: '135px', padding: '1.35rem 0.85rem' }}
                      >
                        <input
                          id="aadhaar_back_file"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          onChange={(e) => handleFileChange(e, 'aadhaar_back')}
                          style={{ display: 'none' }}
                        />
                        <div className="van-3d-kpi-icon van-3d-icon-cyan van-3d-pod-float" style={{ width: '38px', height: '38px', borderRadius: '10px', marginBottom: '0.45rem' }}>
                          <Upload size={17} />
                        </div>
                        <strong style={{ fontSize: '0.84rem', color: '#0369a1', fontWeight: 800 }}>Upload Back</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Full Address Side</span>
                      </label>
                    ) : (
                      <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <img
                            src={aadhaarBackPreview}
                            alt="Aadhaar Back"
                            onClick={() => setModalImage({ title: 'Aadhaar Card Back Side', src: aadhaarBackPreview })}
                            style={{ width: '56px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', fontWeight: 800 }}>Back Scan</strong>
                            <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={11} /> Attached
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setModalImage({ title: 'Aadhaar Card Back Side', src: aadhaarBackPreview })}
                            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Inspect"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc('aadhaar_back')}
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', width: '28px', height: '28px', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {errors.aadhaar_back_image && (
                      <p style={{ color: '#dc2626', fontSize: '0.73rem', fontWeight: 700, marginTop: '0.35rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={13} /> {errors.aadhaar_back_image}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '1.05rem 1.75rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1rem',
                  letterSpacing: '0.01em',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 10px 25px -4px rgba(37, 99, 235, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {submitting ? (
                  <>
                    <span style={{ display: 'inline-block', width: '18px', height: '18px', border: '2.5px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Submitting Verification to Admin...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Submit KYC for Admin Verification</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.35rem 0' }}>
                <Lock size={13} color="#16a34a" />
                <span>256-Bit Encrypted & Compliant with Digital Personal Data Protection Act</span>
              </div>
            </form>
          </div>

          {/* Right Column: Guidelines & Stepper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.85rem' }}>
            {/* Visual Lifecycle Stepper */}
            <div className="van-kyc-card van-kyc-card-accent-amber van-kyc-card-pad" style={{ padding: '2.25rem 2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.15rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-amber van-3d-pod-float" style={{ width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0 }}>
                  <Zap size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    KYC Verification Lifecycle
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>
                    Step-by-step statutory verification pipeline
                  </span>
                </div>
              </div>

              <div className="van-kyc-stepper-track">
                {/* Step 1 */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div className="van-3d-kpi-icon van-3d-icon-blue van-3d-pod-float" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, fontSize: '0.9rem', fontWeight: 900 }}>
                    1
                  </div>
                  <div className="van-kyc-step-pod" style={{ background: '#f8fafc', padding: '1rem 1.2rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', flex: 1, minWidth: 0, boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.3rem' }}>
                      <strong style={{ color: '#1d4ed8', fontSize: '0.92rem', fontWeight: 800, lineHeight: 1.3 }}>
                        Submit PAN & Aadhaar Records
                      </strong>
                      <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        Step 1
                      </span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5, display: 'block' }}>
                      Provide your valid 10-character PAN and 12-digit Aadhaar UID along with legible photo scans.
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div className="van-3d-kpi-icon van-3d-icon-amber van-3d-pod-float" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, fontSize: '0.9rem', fontWeight: 900 }}>
                    2
                  </div>
                  <div className="van-kyc-step-pod" style={{ background: '#fffdf5', padding: '1rem 1.2rem', borderRadius: '14px', border: '1.5px solid #fef3c7', flex: 1, minWidth: 0, boxShadow: '0 2px 8px rgba(245, 158, 11, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.3rem' }}>
                      <strong style={{ color: '#b45309', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem', lineHeight: 1.3 }}>
                        Status: Under Process <Clock size={14} color="#d97706" style={{ flexShrink: 0 }} />
                      </strong>
                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        Step 2
                      </span>
                    </div>
                    <span style={{ color: '#78350f', fontSize: '0.78rem', lineHeight: 1.5, display: 'block' }}>
                      Admin compliance desk verifies document authenticity and matches name against records.
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div className="van-3d-kpi-icon van-3d-icon-emerald van-3d-pod-float" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, fontSize: '0.9rem', fontWeight: 900 }}>
                    3
                  </div>
                  <div className="van-kyc-step-pod" style={{ background: '#f0fdf4', padding: '1rem 1.2rem', borderRadius: '14px', border: '1.5px solid #bbf7d0', flex: 1, minWidth: 0, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.3rem' }}>
                      <strong style={{ color: '#15803d', fontSize: '0.92rem', fontWeight: 800, lineHeight: 1.3 }}>
                        Admin Verifies & Unlocks Vault
                      </strong>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                        Step 3
                      </span>
                    </div>
                    <span style={{ color: '#166534', fontSize: '0.78rem', lineHeight: 1.5, display: 'block' }}>
                      Upon verification, link multiple bank accounts & UPI IDs with QR codes to withdraw earnings.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Card */}
            <div className="van-kyc-card van-kyc-card-accent-emerald van-kyc-card-pad" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-emerald van-3d-pod-float" style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0 }}>
                  <ShieldCheck size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                    Verification Checklist
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Ensure instant one-pass admin approval</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem', color: '#334155' }}>
                <div className="van-kyc-checklist-row">
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Name must strictly match your registered profile: <strong style={{ color: '#0f172a' }}>{currentUser?.name || user?.name || 'Member'}</strong>.</span>
                </div>
                <div className="van-kyc-checklist-row">
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>PAN follows standard alphanumeric syntax: <code style={{ background: '#e2e8f0', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800, color: '#0f172a' }}>ABCDE1234F</code>.</span>
                </div>
                <div className="van-kyc-checklist-row">
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Aadhaar number must contain exactly 12 numeric digits without hyphens.</span>
                </div>
                <div className="van-kyc-checklist-row">
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Upload clear, high-resolution photos of PAN and Aadhaar Front & Back.</span>
                </div>
                <div className="van-kyc-checklist-row">
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Supported formats: JPG, PNG, WEBP (Max 5MB each, auto-compressed).</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM INSPECTION LIGHTBOX MODAL */}
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
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '560px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{modalImage.title}</h4>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>High-Resolution Document Proof Scan</span>
              </div>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.1rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '14px', border: '1px solid #e2e8f0', margin: '0.5rem 0' }}>
              <img src={modalImage.src} alt="Document Proof" style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
            </div>

            <button
              type="button"
              onClick={() => setModalImage(null)}
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
              Close Document Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default KycVerification;
