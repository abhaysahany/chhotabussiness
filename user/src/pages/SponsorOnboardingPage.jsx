import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  HelpCircle,
  Shield,
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

  return (
    <div className="cb-auth-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="cb-auth-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(15, 76, 129, 0.2)',
              }}
            >
              <Building2 size={22} />
            </div>
          )}
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em' }}>
            {appName}
          </span>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="cb-auth-back-btn"
            title="Log out and sign in with a different account"
          >
            <LogOut size={16} />
            <span>Switch Account</span>
          </button>
        )}
      </header>

      {/* Main Centered Onboarding Card */}
      <main className="cb-auth-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div
          className="cb-auth-container"
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            boxShadow: '0 20px 45px -10px rgba(15, 76, 129, 0.1)',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Progress / Step Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0F4C81',
                background: '#e8f1f8',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <Sparkles size={13} style={{ color: '#FF7A00' }} />
              Account Setup
            </span>
          </div>

          {/* Heading & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0F4C81',
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Complete Your Registration
            </h1>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#64748B',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Enter your Sponsor ID to continue. You can also skip this step.
            </p>
          </div>

          {/* Signed-in Google User Banner */}
          {user?.email && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                marginBottom: '1.75rem',
              }}
            >
              {(user.avatar_url || user.avatar) ? (
                <img
                  src={user.avatar_url || user.avatar}
                  alt={user.name || 'User'}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0F4C81',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', truncate: true }}>
                  {user.name || 'Google Partner'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleNext}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="sponsorIdInput"
                style={{
                  display: 'block',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  marginBottom: '0.45rem',
                }}
              >
                Sponsor ID
              </label>

              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Users size={18} />
                </div>

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
                  disabled={submittingNext || submittingSkip}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.85rem 2.8rem 0.85rem 2.75rem',
                    borderRadius: '12px',
                    border: errorMessage ? '1.5px solid #EF4444' : sponsorStatus ? '1.5px solid #10B981' : '1px solid #CBD5E1',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: '#ffffff',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {verifyingSponsor && <Loader2 size={18} className="cb-spin" style={{ color: '#0F4C81' }} />}
                  {!verifyingSponsor && sponsorStatus && <CheckCircle2 size={18} style={{ color: '#10B981' }} />}
                </div>
              </div>

              {/* Verified Sponsor Name Badge */}
              {sponsorStatus && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    fontSize: '0.82rem',
                    color: '#065F46',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>
                    Verified Sponsor: <strong>{sponsorStatus.name}</strong> ({sponsorStatus.user_code})
                  </span>
                </div>
              )}

              {/* Inline Validation Error Message */}
              {errorMessage && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    fontSize: '0.82rem',
                    color: '#B91C1C',
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  <AlertCircle size={16} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.75rem' }}>
              {/* Primary: Next */}
              <button
                type="submit"
                disabled={submittingNext || submittingSkip}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
                  color: '#ffffff',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: submittingNext || submittingSkip ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(15, 76, 129, 0.25)',
                  opacity: submittingNext || submittingSkip ? 0.7 : 1,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
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

              {/* Secondary: Skip for now */}
              <button
                type="button"
                onClick={handleSkip}
                disabled={submittingNext || submittingSkip}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: submittingNext || submittingSkip ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
                onMouseOver={(e) => {
                  if (!submittingNext && !submittingSkip) {
                    e.currentTarget.style.background = '#E2E8F0';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }
                }}
                onMouseOut={(e) => {
                  if (!submittingNext && !submittingSkip) {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }
                }}
              >
                {submittingSkip ? (
                  <>
                    <Loader2 size={16} className="cb-spin" style={{ marginRight: '0.4rem' }} />
                    <span>Skipping...</span>
                  </>
                ) : (
                  <span>Skip for now</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
              fontSize: '0.78rem',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Shield size={14} style={{ color: '#0F4C81' }} />
            <span>Secure 256-bit encrypted partner registration</span>
          </div>
        </div>
      </main>
    </div>
  );
}
