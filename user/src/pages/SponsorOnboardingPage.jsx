import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogIn,
  Shield,
  ShieldCheck,
  Briefcase,
  Star,
  Sparkles,
} from 'lucide-react';
import { useBranding } from '../utils/branding';
import { verifySponsor, completeSponsorOnboarding, skipSponsorOnboarding } from '../api/userService';
import '../components/auth.css';

/**
 * SponsorOnboardingPage
 * 
 * Standalone, full-page onboarding screen displayed exclusively for Google
 * authenticated users who do not yet have an established sponsor relationship.
 */
export default function SponsorOnboardingPage({ user, onComplete, onLogout }) {
  const { appName, logoUrl } = useBranding();

  const [sponsorId, setSponsorId] = useState('');
  const [verifyingSponsor, setVerifyingSponsor] = useState(false);
  const [sponsorStatus, setSponsorStatus] = useState(null); // { verified: boolean, name: string, user_code: string } | null
  const [errorMessage, setErrorMessage] = useState('');
  const [submittingNext, setSubmittingNext] = useState(false);
  const [submittingSkip, setSubmittingSkip] = useState(false);

  // Debounced real-time sponsor verification as user types
  useEffect(() => {
    const trimmed = sponsorId.trim();
    if (!trimmed) {
      setSponsorStatus(null);
      setErrorMessage('');
      return;
    }

    setVerifyingSponsor(true);
    setErrorMessage('');

    const timer = setTimeout(async () => {
      try {
        const res = await verifySponsor(trimmed);
        if (res.verified) {
          setSponsorStatus(res.sponsor);
          setErrorMessage('');
        }
      } catch (err) {
        setSponsorStatus(null);
        // Do not spam error while typing; validation on submit will enforce strict check
      } finally {
        setVerifyingSponsor(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [sponsorId]);

  // Handle "Next" click
  const handleNext = async (e) => {
    if (e) e.preventDefault();
    const cleanId = sponsorId.trim();

    if (!cleanId) {
      setErrorMessage('Please enter a Sponsor ID or click "Skip for now" to continue.');
      return;
    }

    // Client-side self-referral check
    if (user && (
      (user.user_code && cleanId.toLowerCase() === user.user_code.toLowerCase()) ||
      (user.email && cleanId.toLowerCase() === user.email.toLowerCase()) ||
      String(user.id) === cleanId
    )) {
      setErrorMessage('You cannot enter your own User Code or email as Sponsor ID.');
      return;
    }

    setSubmittingNext(true);
    setErrorMessage('');

    try {
      const res = await completeSponsorOnboarding(cleanId);
      if (res.status === 'success' && res.user) {
        if (onComplete) {
          onComplete(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Failed to link sponsor ID. Please try again.');
      }
    } catch (err) {
      console.error('Complete sponsor onboarding error:', err);
      const data = err.response?.data;
      const msg = data?.message ||
        (data?.errors?.sponsor_id ? data.errors.sponsor_id[0] : null) ||
        err.message ||
        'Invalid Sponsor ID. Sponsor does not exist in our database.';
      setErrorMessage(msg);
    } finally {
      setSubmittingNext(false);
    }
  };

  // Handle "Skip for now" click
  const handleSkip = async () => {
    setSubmittingSkip(true);
    setErrorMessage('');

    try {
      const res = await skipSponsorOnboarding();
      if (res.status === 'success' && res.user) {
        if (onComplete) {
          onComplete(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Failed to complete skip. Please try again.');
      }
    } catch (err) {
      console.error('Skip sponsor onboarding error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to skip onboarding. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmittingSkip(false);
    }
  };

  const handleGoToLogin = () => {
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  };

  return (
    <div className="cb-auth-page">
      {/* 1. Top Navigation Bar (Matches Login Page Topbar) */}
      <header className="cb-auth-topbar">
        <div className="cb-topbar-brand">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              className="cb-topbar-brand-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="cb-topbar-brand-badge">
              <Building2 size={20} />
            </div>
          )}
          <span className="cb-topbar-brand-name">
            {appName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoToLogin}
          className="cb-auth-back-btn cb-auth-login-nav-btn"
          title="Go to Partner Login Page"
        >
          <LogIn size={16} />
          <span>Go to Login</span>
        </button>
      </header>

      {/* 2. Main Auth Container (Matches Login Page Split Showcase & Form Panel) */}
      <main className="cb-auth-main">
        <div className="cb-auth-container">

          {/* Left Column: Corporate Showcase (Desktop >= 1025px) */}
          <div className="cb-auth-showcase">
            <div>
              <div className="cb-showcase-badge">
                <Sparkles size={13} />
                <span>Google Account Connected • Final Step</span>
              </div>

              <h2 className="cb-showcase-title">
                Complete Your <span className="text-orange">Partner Setup</span>
              </h2>

              <p className="cb-showcase-desc">
                Connect with your referrer to unlock network mentorship and team placement, or skip this step to access your business dashboard immediately.
              </p>

              <div className="cb-showcase-features">
                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <Briefcase size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Instant Partner Activation</h4>
                    <p>Your partner portal, referral code, and income tracking activate as soon as you proceed.</p>
                  </div>
                </div>

                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <Users size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Verified Sponsor Connection</h4>
                    <p>Enter a valid Sponsor ID to link your account directly under your upline team leader.</p>
                  </div>
                </div>

                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Flexible Onboarding</h4>
                    <p>Don&apos;t have a Sponsor ID right now? Click &quot;Skip for now&quot; anytime to continue safely.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="cb-showcase-testimonial">
              <div className="cb-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#FF7A00" color="#FF7A00" />
                ))}
              </div>
              <p className="cb-testimonial-quote">
                &quot;{appName} made our partner onboarding effortless with instant Google setup and transparent network tracking.&quot;
              </p>
              <div className="cb-testimonial-author">
                <div className="cb-author-avatar">R</div>
                <div className="cb-author-info">
                  <span className="cb-author-name">Rajesh Sharma</span>
                  <span className="cb-author-role">Enterprise IT Solutions Partner</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Onboarding Form Panel */}
          <div className="cb-auth-form-panel">

            {/* Brand Logo Header (Identical to LoginForm) */}
            <div className="cb-auth-brand-header">
              <div className="cb-auth-logo-badge" style={{ background: 'transparent', padding: 0 }}>
                <img
                  src={logoUrl || '/logo.png'}
                  alt={appName}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'contain' }}
                  onError={(e) => { e.target.src = '/logo.png'; }}
                />
              </div>
              <div>
                <div className="cb-auth-logo-text-title">
                  {appName}
                </div>
                <span className="cb-auth-logo-text-sub">
                  Business Promoter Network
                </span>
              </div>
            </div>

            {/* Step Badge */}
            <div className="cb-onboarding-badge">
              <Sparkles size={13} style={{ color: '#FF7A00' }} />
              <span>Account Setup</span>
            </div>

            {/* Heading & Subtitle */}
            <div className="cb-form-header">
              <h1 className="cb-form-title">Complete Your Registration</h1>
              <p className="cb-form-subtitle">
                Enter your Sponsor ID to continue. You can also skip this step.
              </p>
            </div>

            {/* Separate Google Authenticated Account Banner */}
            {user?.email && (
              <div className="cb-google-account-card">
                {(user.avatar_url || user.avatar) ? (
                  <img
                    src={user.avatar_url || user.avatar}
                    alt={user.name || 'User'}
                    className="cb-google-avatar-img"
                  />
                ) : (
                  <div className="cb-google-avatar-fallback">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="cb-google-account-meta">
                  <div className="cb-google-account-top">
                    <span className="cb-google-account-name">
                      {user.name || 'Google Partner'}
                    </span>
                    <span className="cb-google-verified-pill">
                      Google Verified
                    </span>
                  </div>
                  <div className="cb-google-account-email" title={user.email}>
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Sponsor ID Form */}
            <form onSubmit={handleNext} noValidate>
              <div className="cb-form-group">
                <label htmlFor="sponsorIdInput" className="cb-input-label">
                  <span>Sponsor ID</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                    {verifyingSponsor ? 'Verifying...' : 'Optional'}
                  </span>
                </label>

                <div className="cb-input-wrapper">
                  <span className="cb-input-icon">
                    <Users size={18} />
                  </span>

                  <input
                    id="sponsorIdInput"
                    type="text"
                    value={sponsorId}
                    onChange={(e) => {
                      setSponsorId(e.target.value.toUpperCase());
                      setErrorMessage('');
                    }}
                    placeholder="e.g. CB100001"
                    autoFocus
                    autoComplete="off"
                    disabled={submittingNext || submittingSkip}
                    className={`cb-input-field has-status-icon ${
                      errorMessage ? 'has-error' : sponsorStatus ? 'has-success' : ''
                    }`}
                    style={{ fontWeight: 600, letterSpacing: '0.03em' }}
                  />

                  <div className="cb-input-status-icon">
                    {verifyingSponsor && (
                      <Loader2 size={18} className="cb-spin" style={{ color: '#0F4C81' }} />
                    )}
                    {!verifyingSponsor && sponsorStatus && (
                      <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                    )}
                  </div>
                </div>

                {/* Verified Sponsor Confirmation Badge */}
                {sponsorStatus && (
                  <div className="cb-sponsor-badge-success">
                    <CheckCircle2 size={16} style={{ color: '#059669', flexShrink: 0 }} />
                    <span>
                      Verified Sponsor: <strong>{sponsorStatus.name}</strong> ({sponsorStatus.user_code})
                    </span>
                  </div>
                )}

                {/* Inline Validation Error Message */}
                {errorMessage && (
                  <div className="cb-sponsor-badge-error">
                    <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="cb-onboarding-actions">
                <button
                  type="submit"
                  className="cb-submit-btn"
                  disabled={submittingNext || submittingSkip}
                >
                  {submittingNext ? (
                    <>
                      <Loader2 size={18} className="cb-spin" />
                      <span>Verifying Sponsor...</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="cb-btn-ghost"
                  disabled={submittingNext || submittingSkip}
                >
                  {submittingSkip ? (
                    <>
                      <Loader2 size={16} className="cb-spin" />
                      <span>Skipping...</span>
                    </>
                  ) : (
                    <span>Skip for now</span>
                  )}
                </button>
              </div>
            </form>

            {/* Security Note */}
            <div className="cb-onboarding-security">
              <Shield size={14} style={{ color: '#0F4C81', flexShrink: 0 }} />
              <span>Secure 256-bit encrypted partner registration</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Bottom Legal Footer (Matches Login Page Footer) */}
      <footer className="cb-auth-bottom-footer">
        <span>© {new Date().getFullYear()} {appName} Pvt. Ltd. All rights reserved.</span>
      </footer>
    </div>
  );
}
