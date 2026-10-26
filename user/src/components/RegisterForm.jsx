import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Lock,
  User,
  Users,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Star,
  AlertCircle,
  Loader2,
  HelpCircle,
  LogIn,
  UserPlus,
  KeyRound,
  FileText,
  X,
  Info,
} from 'lucide-react';
import { verifySponsor, sendOtp, verifyOtp } from '../api/userService';
import './auth.css';

function RegisterForm({ onRegisterSuccess, onSwitchToLogin, onSocialClick, onOpenLegalPage, onBackToHome }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sponsorId, setSponsorId] = useState('CB100201');

  // Real-time Auto-Verification Sponsor State
  const [sponsorStatus, setSponsorStatus] = useState(null); // { verified: boolean, name: string, user_code: string } | null
  const [verifyingSponsor, setVerifyingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');

  // Terms and Privacy Policy State
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms'); // 'terms' | 'privacy'

  // OTP State
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sentOtpDemo, setSentOtpDemo] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-verify Sponsor ID in real-time as user types (Debounced 400ms)
  useEffect(() => {
    const trimmedId = sponsorId.trim();
    if (!trimmedId) {
      setSponsorStatus(null);
      setSponsorError('');
      return;
    }

    setVerifyingSponsor(true);
    setSponsorError('');

    const timer = setTimeout(async () => {
      try {
        const res = await verifySponsor(trimmedId);
        if (res.verified) {
          setSponsorStatus(res.sponsor);
          setSponsorError('');
        }
      } catch (err) {
        console.error('Real-time sponsor verify error:', err);
        setSponsorStatus(null);
        setSponsorError(
          err.response?.data?.message || 'Invalid Sponsor ID. Sponsor does not exist in our database.'
        );
      } finally {
        setVerifyingSponsor(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [sponsorId]);

  // Open Legal Modal on specific tab
  const handleOpenLegal = (tab) => {
    setLegalModalTab(tab);
    setShowLegalModal(true);
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSponsorError('');

    if (!termsAccepted) {
      setErrorMessage('You must read and agree to the Terms and Conditions and Privacy Policy to proceed.');
      return;
    }

    if (!sponsorStatus) {
      setSponsorError('Please enter a valid, database-verified Sponsor ID to continue.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(email);
      if (res.status === 'success') {
        setSentOtpDemo(res.otp || '');
        setOtpStep(true);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to send verification OTP to email.'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and Complete Registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms and Conditions and Privacy Policy to complete registration.');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      await onRegisterSuccess({
        name,
        email,
        password,
        sponsor_id: sponsorStatus.user_code || sponsorId,
        otp: otpCode,
        terms_accepted: true,
      });
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Registration failed. Please verify the OTP and try again.'
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="cb-auth-page">
      {/* 1. Top Navigation Bar */}
      <header className="cb-auth-topbar">
        {onBackToHome ? (
          <button
            type="button"
            onClick={onBackToHome}
            className="cb-auth-back-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Homepage</span>
          </button>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              handleOpenLegal('terms');
            }}
            className="cb-auth-help-link"
          >
            <HelpCircle size={15} />
            <span>Partner Help</span>
          </a>
        </div>
      </header>

      {/* 2. Main Auth Content */}
      <main className="cb-auth-main">
        <div className="cb-auth-container">
          
          {/* Left Column: ChhotaBusiness Value Showcase (Desktop) */}
          <div className="cb-auth-showcase">
            <div>
              {/* Top Pill Badge */}
              <div className="cb-showcase-badge">
                <Sparkles size={13} />
                <span>Zero Upfront Fee • High-Intent Deals</span>
              </div>

              {/* Title */}
              <h2 className="cb-showcase-title">
                Grow Your Business with <span className="text-orange">Quality Customers</span>
              </h2>

              <p className="cb-showcase-desc">
                Join India's premier nationwide business promoter network. Connect with software clients, agency contracts, and service buyers with zero marketing risk.
              </p>

              {/* 3 Key Value Points */}
              <div className="cb-showcase-features">
                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <Briefcase size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Pay Only When You Close</h4>
                    <p>Zero upfront fees. You only pay a minor success-based commission when clients pay you.</p>
                  </div>
                </div>

                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>100% Direct Customer Settlements</h4>
                    <p>Clients pay directly into your company bank account. Complete cash flow independence.</p>
                  </div>
                </div>

                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <Users size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Verified Sponsor & Downline Credits</h4>
                    <p>Build your promoter team and earn ongoing referral incentives across all verified sales.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial / Trust Social Proof */}
            <div className="cb-showcase-testimonial">
              <div className="cb-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#FF7A00" color="#FF7A00" />
                ))}
              </div>
              <p className="cb-testimonial-quote">
                "Signing up as a verified partner opened up corporate client leads we couldn't reach on our own. Transparent, simple, and high return."
              </p>
              <div className="cb-testimonial-author">
                <div className="cb-author-avatar">A</div>
                <div className="cb-author-info">
                  <span className="cb-author-name">Anand Kulkarni</span>
                  <span className="cb-author-role">Director, Cloud & App Services</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Registration Form Panel */}
          <div className="cb-auth-form-panel">
            
            {/* Brand Logo Header */}
            <div className="cb-auth-brand-header">
              <div className="cb-auth-logo-badge">
                <Building2 size={24} />
              </div>
              <div>
                <div className="cb-auth-logo-text-title">
                  CHHOTA<span>BUSINESS</span>
                </div>
                <span className="cb-auth-logo-text-sub">
                  Business Promoter Network
                </span>
              </div>
            </div>

            {/* Switch Tabs (Login vs Register) */}
            <div className="cb-auth-tabs">
              <button
                type="button"
                className="cb-auth-tab"
                onClick={onSwitchToLogin}
              >
                <LogIn size={15} />
                <span>Partner Sign In</span>
              </button>
              <button
                type="button"
                className="cb-auth-tab active"
              >
                <UserPlus size={15} />
                <span>Register Partner</span>
              </button>
            </div>

            {/* Form Headline */}
            <div className="cb-form-header">
              <h1 className="cb-form-title">
                {otpStep ? 'Verify Email Address' : 'Create Partner Account'}
              </h1>
              <p className="cb-form-subtitle">
                {otpStep
                  ? `Enter the 6-digit verification code sent to ${email}`
                  : 'Enter your details and verified Sponsor ID to activate your partner portal.'}
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="cb-alert-error">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {!otpStep ? (
              /* STEP 1: REGISTRATION DETAILS & SPONSOR VERIFICATION */
              <form onSubmit={handleSendOtp}>
                
                {/* SPONSOR ID FIELD WITH LIVE REAL-TIME VERIFICATION */}
                <div className="cb-form-group">
                  <div className="cb-input-label">
                    <span>Sponsor ID</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {verifyingSponsor && (
                        <span style={{ fontSize: '0.74rem', color: '#0F4C81', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Loader2 size={12} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                          Checking...
                        </span>
                      )}
                      <span className="required-dot">*</span>
                    </div>
                  </div>

                  <div className="cb-input-wrapper">
                    <span className="cb-input-icon">
                      <Users size={18} />
                    </span>
                    <input
                      type="text"
                      className="cb-input-field"
                      value={sponsorId}
                      onChange={(e) => setSponsorId(e.target.value)}
                      placeholder="e.g. CB100201 (Mandatory)"
                      required
                    />
                  </div>

                  {/* Real-time Verified Sponsor Confirmation */}
                  {sponsorStatus && (
                    <div className="cb-sponsor-badge-success">
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span>Verified Sponsor: </span>
                        <strong>{sponsorStatus.name}</strong>
                        <span style={{ opacity: 0.85, marginLeft: '0.25rem' }}>({sponsorStatus.user_code})</span>
                      </div>
                    </div>
                  )}

                  {/* Real-time Sponsor Error */}
                  {sponsorError && !verifyingSponsor && (
                    <div className="cb-sponsor-badge-error">
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sponsorError}</span>
                    </div>
                  )}
                </div>

                {/* FULL NAME FIELD */}
                <div className="cb-form-group">
                  <label className="cb-input-label">
                    <span>Full Name / Business Name</span>
                    <span className="required-dot">*</span>
                  </label>
                  <div className="cb-input-wrapper">
                    <span className="cb-input-icon">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      className="cb-input-field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma / WebTech Agency"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                {/* EMAIL ADDRESS FIELD */}
                <div className="cb-form-group">
                  <label className="cb-input-label">
                    <span>Email Address</span>
                    <span className="required-dot">*</span>
                  </label>
                  <div className="cb-input-wrapper">
                    <span className="cb-input-icon">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="cb-input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@yourcompany.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD FIELD */}
                <div className="cb-form-group">
                  <div className="cb-input-label">
                    <span>Password</span>
                    <span className="required-dot">*</span>
                  </div>
                  <div className="cb-input-wrapper">
                    <span className="cb-input-icon">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="cb-input-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create secure password (min 6 chars)"
                      minLength={6}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="cb-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* MANDATORY TERMS & PRIVACY CHECKBOX */}
                <div style={{ margin: '1rem 0 1.25rem 0' }}>
                  <label className="cb-checkbox-label" style={{ alignItems: 'flex-start', fontSize: '0.84rem', lineHeight: 1.45 }}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{ marginTop: '0.15rem' }}
                      required
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenLegal('terms');
                        }}
                        className="cb-link-btn"
                        style={{ color: 'var(--cb-primary, #0F4C81)' }}
                      >
                        Terms and Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleOpenLegal('privacy');
                        }}
                        className="cb-link-btn"
                        style={{ color: 'var(--cb-primary, #0F4C81)' }}
                      >
                        Privacy Policy
                      </button>
                      . <span className="required-dot">*</span>
                    </span>
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="cb-submit-btn"
                  disabled={sendingOtp || !sponsorStatus || verifyingSponsor || !termsAccepted}
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Sending Verification OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2: EMAIL OTP VERIFICATION & REGISTRATION */
              <form onSubmit={handleCompleteRegistration}>
                {sentOtpDemo && (
                  <div className="cb-alert-info">
                    <Info size={18} style={{ flexShrink: 0 }} />
                    <span>
                      Demo OTP Code: <strong>{sentOtpDemo}</strong> (Use this to verify instantly)
                    </span>
                  </div>
                )}

                <div className="cb-form-group">
                  <label className="cb-input-label">
                    <span>Enter 6-Digit Email Verification Code</span>
                    <span className="required-dot">*</span>
                  </label>
                  <div className="cb-input-wrapper">
                    <span className="cb-input-icon">
                      <KeyRound size={18} />
                    </span>
                    <input
                      type="text"
                      className="cb-input-field"
                      style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.25rem', fontWeight: 800 }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.trim())}
                      placeholder="••••••"
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="cb-btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => setOtpStep(false)}
                    disabled={verifyingOtp}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="cb-submit-btn"
                    style={{ flex: 2 }}
                    disabled={verifyingOtp || !termsAccepted}
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Social Divider */}
            <div className="cb-auth-divider">
              <span>Or sign up with</span>
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              className="cb-google-sso-btn"
              onClick={() => onSocialClick && onSocialClick('google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#ea4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"/>
                <path fill="#4285f4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#fbbc05" d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c0-.6.1-1.3.1-2.4z"/>
                <path fill="#34a853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/>
              </svg>
              <span>Sign up with Google</span>
            </button>

            {/* Footer Prompt */}
            <div className="cb-auth-footer-text">
              <span>Already registered as a partner?</span>
              <button
                type="button"
                className="highlight-link"
                onClick={onSwitchToLogin}
              >
                Sign In to Portal →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Bottom Legal Footer */}
      <footer className="cb-auth-bottom-footer">
        <span>© {new Date().getFullYear()} Chhota Business Pvt. Ltd. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <a
            href="#terms"
            onClick={(e) => {
              e.preventDefault();
              handleOpenLegal('terms');
            }}
          >
            Terms of Service
          </a>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              handleOpenLegal('privacy');
            }}
          >
            Privacy Policy
          </a>
        </div>
      </footer>

      {/* DUAL LEGAL VIEWER MODAL (MATCHING SAAS LIGHT DESIGN) */}
      {showLegalModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(15, 76, 129, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              animation: 'cbFadeIn 0.25s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                background: 'linear-gradient(135deg, #0F4C81 0%, #0a355c 100%)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>
                    {legalModalTab === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                    Chhota Business Legal & Affiliate Operating Standards
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                padding: '0.5rem 1.75rem',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: legalModalTab === 'terms' ? '#ffffff' : 'transparent',
                  color: legalModalTab === 'terms' ? '#0F4C81' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: legalModalTab === 'terms' ? '0 2px 4px rgba(15, 76, 129, 0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <FileText size={15} />
                <span>Terms & Conditions</span>
              </button>
              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: legalModalTab === 'privacy' ? '#ffffff' : 'transparent',
                  color: legalModalTab === 'privacy' ? '#0F4C81' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: legalModalTab === 'privacy' ? '0 2px 4px rgba(15, 76, 129, 0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <ShieldCheck size={15} />
                <span>Privacy Policy</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div
              style={{
                padding: '1.75rem',
                overflowY: 'auto',
                flex: 1,
                fontSize: '0.88rem',
                color: '#334155',
                lineHeight: '1.65',
              }}
            >
              {legalModalTab === 'terms' ? (
                <>
                  <div
                    style={{
                      background: 'var(--cb-success-light, #DCFCE7)',
                      border: '1px solid #86EFAC',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '10px',
                      color: '#166534',
                      marginBottom: '1.5rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Mandatory Acceptance:</strong> You must agree to these terms before registering as an active promoter partner.
                    </span>
                  </div>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    1. Acceptance & Member Eligibility
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    By creating an account, you represent that you are at least 18 years old and entering with a valid, database-verified Sponsor ID. Accounts found with fraudulent or duplicate identities will be immediately deactivated.
                  </p>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    2. Genealogy Tree & Commission Distribution
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    Affiliate commissions and referral rewards are calculated transparently based on verified product sales and team sales volume. Cross-sponsoring, poaching, or fraudulent order placement is strictly prohibited.
                  </p>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    3. Payouts & Mandatory KYC Compliance
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    All commission payouts are subject to statutory Tax Deducted at Source (TDS) regulations. Users must complete full KYC (PAN Card and verified Bank Account) to submit payout requests.
                  </p>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    4. Marketplace Purchases & Returns
                  </h4>
                  <p style={{ margin: '0' }}>
                    Products purchased via the platform are fulfilled by verified business entities. Return and replacement requests are subject to the 7-day inspection policy.
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: 'var(--cb-primary-light, #E8F1F8)',
                      border: '1px solid #BFDBFE',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '10px',
                      color: '#1E40AF',
                      marginBottom: '1.5rem',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Enterprise Privacy Standards:</strong> We protect your identity, KYC documents, and financial records with 256-bit encryption.
                    </span>
                  </div>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    1. Information We Collect
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    We collect your name, verified email, phone number, PAN Card, and Bank details for required statutory TDS tax compliance and commission transfers.
                  </p>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    2. How We Use Data
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    Your data is used strictly for account management, genealogy reward calculation, order deliveries, and fraud prevention. We never sell your personal information.
                  </p>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    3. Social Sign In (Google OAuth)
                  </h4>
                  <p style={{ margin: '0 0 1.25rem 0' }}>
                    When signing in with Google, we only access your basic public profile and authorized email. We never access private files or post to external feeds.
                  </p>

                  <h4 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.4rem 0', fontFamily: 'Poppins, sans-serif' }}>
                    4. User Rights & Data Protection
                  </h4>
                  <p style={{ margin: '0' }}>
                    You have the right to review, update, or request deletion of your account data. Inquiries can be directed to our compliance team at <strong>privacy@chhotabusiness.com</strong>.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.25rem 1.75rem',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Compliance Version 2.4 • Updated 2026
              </span>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowLegalModal(false);
                }}
                style={{
                  background: 'var(--cb-success, #16A34A)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>I Agree & Accept Both</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterForm;
