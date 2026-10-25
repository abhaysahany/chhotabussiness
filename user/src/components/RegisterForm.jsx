import React, { useState, useEffect } from 'react';
import { verifySponsor, sendOtp, verifyOtp } from '../api/userService';

function RegisterForm({ onRegisterSuccess, onSwitchToLogin, onSocialClick, onOpenLegalPage, onBackToHome }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sponsorId, setSponsorId] = useState('');

  // Real-time Auto-Verification Sponsor State
  const [sponsorStatus, setSponsorStatus] = useState(null); // { verified: boolean, name: string, user_code: string } | null
  const [verifyingSponsor, setVerifyingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');


  // Terms and Privacy Policy State
  const [termsAccepted, setTermsAccepted] = useState(false);
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
          err.response?.data?.message || 'Invalid Sponsor ID. Sponsor does not exist in database.'
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
        setSentOtpDemo(res.otp);
        setOtpStep(true);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to send OTP to email.'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP and Register
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
        err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="login-card">
      {onBackToHome && (
        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <button
            type="button"
            onClick={onBackToHome}
            style={{
              background: 'none',
              border: 'none',
              color: '#0F4C81',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: 0,
            }}
          >
            ← Back to Homepage
          </button>
        </div>
      )}

      <div className="brand-logo-container">

        <div className="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="brand-name">CHHOTABUSINESS</span>
      </div>

      <div className="login-header">
        <h2 className="welcome-title">Member Registration</h2>
        <p className="welcome-subtitle">
          {otpStep
            ? `Enter the 6-digit verification code sent to ${email}`
            : 'Enter your details and Sponsor ID to join our network.'}
        </p>
      </div>

      {errorMessage && (
        <div className="alert-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {!otpStep ? (
        /* STEP 1: REGISTRATION DETAILS & SPONSOR VERIFICATION */
        <form onSubmit={handleSendOtp} className="login-form">
          {/* REAL-TIME AUTO SPONSOR VERIFICATION INPUT */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">Sponsor ID <span style={{ color: '#ef4444' }}>*</span></label>
              {verifyingSponsor && (
                <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>
                  Checking...
                </span>
              )}
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                value={sponsorId}
                onChange={(e) => setSponsorId(e.target.value)}
                placeholder="Enter Sponsor ID (Mandatory)"
                required
              />
            </div>

            {sponsorStatus && (
              <div className="sponsor-success-badge" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0.35rem 0 0 0' }}>
                <span>✓ Verified Sponsor:</span>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sponsorStatus.name}</strong>
                <span style={{ opacity: 0.85 }}>({sponsorStatus.user_code})</span>
              </div>
            )}

            {sponsorError && !verifyingSponsor && (
              <div className="sponsor-error-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0.35rem 0 0 0' }}>
                ⚠️ {sponsorError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="input-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mandatory Terms & Privacy Policy Checkbox */}
          <div className="form-options" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
            <label className="remember-checkbox" style={{ alignItems: 'flex-start', fontSize: '0.825rem', lineHeight: '1.4' }}>
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
                  style={{ background: 'none', border: 'none', color: '#6366f1', textDecoration: 'underline', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
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
                  style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', fontWeight: '700', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                >
                  Privacy Policy
                </button>. <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={sendingOtp || !sponsorStatus || verifyingSponsor || !termsAccepted}
          >
            {sendingOtp ? 'Sending Email OTP...' : 'Send Verification OTP →'}
          </button>
        </form>
      ) : (
        /* STEP 2: EMAIL OTP VERIFICATION & REGISTRATION */
        <form onSubmit={handleCompleteRegistration} className="login-form">
          {sentOtpDemo && (
            <div className="sponsor-success-badge" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
              ℹ️ Demo Verification Code: <strong>{sentOtpDemo}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="input-label">Enter 6-Digit Email OTP</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem', fontWeight: 700 }}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.trim())}
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="social-btn"
              style={{ flex: 1 }}
              onClick={() => setOtpStep(false)}
              disabled={verifyingOtp}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="submit-btn"
              style={{ flex: 2, marginTop: 0 }}
              disabled={verifyingOtp || !termsAccepted}
            >
              {verifyingOtp ? 'Verifying & Registering...' : 'Verify OTP & Register'}
            </button>
          </div>
        </form>
      )}

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="social-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button className="social-btn google-btn" type="button" onClick={() => onSocialClick && onSocialClick('google')} style={{ width: '100%', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#ea4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"/>
            <path fill="#4285f4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#fbbc05" d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c0-.6.1-1.3.1-2.4z"/>
            <path fill="#34a853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/>
          </svg>
          <span>Sign up with Google</span>
        </button>
      </div>

      <div className="login-footer">
        <span>Already have an account? </span>
        <button type="button" className="switch-auth-btn" onClick={onSwitchToLogin}>
          Sign In Here
        </button>
      </div>

      {/* DUAL LEGAL VIEWER MODAL */}
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', background: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{legalModalTab === 'terms' ? '📜' : '🔒'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                    {legalModalTab === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                    ChhotaBusiness Legal & Data Protection Guidelines
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '0.35rem 1.5rem', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: legalModalTab === 'terms' ? '#ffffff' : 'transparent',
                  color: legalModalTab === 'terms' ? '#6366f1' : '#64748b',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: legalModalTab === 'terms' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                📜 Terms and Conditions
              </button>
              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: legalModalTab === 'privacy' ? '#ffffff' : 'transparent',
                  color: legalModalTab === 'privacy' ? '#3b82f6' : '#64748b',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: legalModalTab === 'privacy' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                🔒 Privacy Policy
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
              {legalModalTab === 'terms' ? (
                <>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '8px', color: '#166534', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                    ℹ️ <strong>Mandatory Acceptance:</strong> You must agree to these operational terms before joining the affiliate network.
                  </div>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.4rem 0' }}>1. Acceptance & Member Eligibility</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    By creating an account, you represent that you are at least 18 years old and entering with a valid, system-verified Sponsor ID. Accounts found with fraudulent or duplicate identities will be immediately deactivated.
                  </p>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.4rem 0' }}>2. Genealogy Tree & Commission Distribution</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    Affiliate commissions and referral rewards are calculated transparently based on verified product sales and team sales volume. Cross-sponsoring, poaching, or fraudulent order placement is strictly prohibited.
                  </p>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.4rem 0' }}>3. Payouts & Mandatory KYC Compliance</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    All commission payouts are subject to statutory Tax Deducted at Source (TDS) regulations. Users must complete full KYC (PAN Card and verified Bank Account) to submit payout requests.
                  </p>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.5rem 0' }}>4. Marketplace Purchases & Returns</h4>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    Products purchased via the platform are fulfilled by verified business entities. Return and replacement requests are subject to the 7-day inspection policy.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '8px', color: '#1e40af', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                    🔒 <strong>Data Privacy Standard:</strong> We protect your identity, KYC documents, and financial records with 256-bit encryption.
                  </div>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.4rem 0' }}>1. Information We Collect</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    We collect your name, verified email, phone number, PAN Card, and Bank details for required statutory TDS tax compliance and commission transfers.
                  </p>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.4rem 0' }}>2. How We Use Data</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    Your data is used strictly for account management, genealogy reward calculation, order deliveries, and fraud prevention. We never sell your personal information.
                  </p>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.4rem 0' }}>3. Social Sign In (Google & Facebook)</h4>
                  <p style={{ margin: '0 0 1rem 0' }}>
                    When signing in with Google or Facebook, we only access your basic public profile and authorized email. We never post to your social feeds without consent.
                  </p>

                  <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.5rem 0' }}>4. User Rights & Data Protection</h4>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    You have the right to review, update, or request deletion of your account data. Inquiries can be directed to our compliance team at <strong>privacy@chhotabusiness.com</strong>.
                  </p>
                </>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Updated: August 2026</span>
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowLegalModal(false);
                }}
                style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                I Agree & Accept Both ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterForm;
