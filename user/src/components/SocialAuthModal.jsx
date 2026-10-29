import React, { useState, useEffect } from 'react';
import { verifySponsor } from '../api/userService';
import { openGoogleAccountChooser } from '../utils/googleOAuth';

function SocialAuthModal({ provider, initialMode = 'login', onClose, onSocialSuccess }) {
  const isGoogle = provider === 'google';
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  const defaultAccounts = isGoogle
    ? [
        {
          name: 'Alex Johnson',
          email: 'alex.google@gmail.com',
          provider_id: 'google_1092837482910',
          avatar: 'https://lh3.googleusercontent.com/a/default-user',
        },
        {
          name: 'Priya Sharma',
          email: 'priya.sharma@gmail.com',
          provider_id: 'google_9823471928374',
          avatar: 'https://lh3.googleusercontent.com/a/default-user-2',
        },
        {
          name: 'Demo Portal Member',
          email: 'user@addnet.com',
          provider_id: 'google_demo_user_001',
          avatar: 'https://lh3.googleusercontent.com/a/default-user-3',
        },
      ]
    : [
        {
          name: 'Rahul Verma',
          email: 'rahul.verma@facebook.com',
          provider_id: 'fb_8837492019482',
          avatar: 'https://graph.facebook.com/default-user',
        },
        {
          name: 'Sarah Connor',
          email: 'sarah.connor@facebook.com',
          provider_id: 'fb_1928374650192',
          avatar: 'https://graph.facebook.com/default-user-2',
        },
        {
          name: 'Vikram Roy (Phone-only FB)',
          email: null, // Scenario where user registered on Facebook with only phone number
          provider_id: 'fb_9948201928374',
          avatar: 'https://graph.facebook.com/default-user-phone',
        },
        {
          name: 'Demo Portal Member',
          email: 'user@addnet.com',
          provider_id: 'fb_demo_user_001',
          avatar: 'https://graph.facebook.com/default-user-3',
        },
      ];

  // Sponsor state for Registration
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorStatus, setSponsorStatus] = useState(null);
  const [verifyingSponsor, setVerifyingSponsor] = useState(false);
  const [sponsorError, setSponsorError] = useState('');

  // Mandatory Terms and Conditions State for Social Signup
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Missing Email Fallback Flow (e.g. Phone-only FB)
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [promptForEmail, setPromptForEmail] = useState(false);
  const [userEmailInput, setUserEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');

  // Custom Account Toggle
  const [showCustomAccount, setShowCustomAccount] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notRegisteredAccount, setNotRegisteredAccount] = useState(null);

  // Auto-verify Sponsor ID in real-time as user types (Debounced 400ms)
  useEffect(() => {
    if (mode !== 'register') return;

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
  }, [sponsorId, mode]);

  // Account Click Handler
  const handleSelectAccount = async (account) => {
    setError('');
    setNotRegisteredAccount(null);

    // Missing email check
    if (!account.email) {
      setSelectedAccount(account);
      setUserEmailInput('');
      setEmailInputError('');
      setPromptForEmail(true);
      return;
    }

    if (mode === 'register') {
      if (!termsAgreed) {
        setError(`You must agree to the Terms and Conditions before continuing with ${isGoogle ? 'Google' : 'Facebook'}.`);
        return;
      }

      if (!sponsorStatus) {
        setSponsorError('Please enter a valid, database-verified Sponsor ID before proceeding.');
        return;
      }
    }

    executeSocialAuth(account, account.email);
  };

  // Launch Google Account Selector via Browser OAuth Window
  const handleGoogleBrowserLaunch = () => {
    setError('');
    setNotRegisteredAccount(null);

    if (mode === 'register') {
      if (!termsAgreed) {
        setError('Please accept the Terms and Conditions before continuing.');
        return;
      }
      if (!sponsorStatus) {
        setSponsorError('Please enter a valid, database-verified Sponsor ID before proceeding.');
        return;
      }
    }

    setLoading(true);
    openGoogleAccountChooser({
      onSuccess: (googleUser) => {
        executeSocialAuth(googleUser, googleUser.email);
      },
      onError: (errMsg) => {
        setLoading(false);
        setError(errMsg || 'Google account selection cancelled or failed.');
      },
    });
  };

  // Submit User-Provided Email
  const handleManualEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailInputError('');
    setError('');

    const trimmed = userEmailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setEmailInputError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      if (!termsAgreed) {
        setError(`You must agree to the Terms and Conditions before continuing with ${isGoogle ? 'Google' : 'Facebook'}.`);
        return;
      }

      if (!sponsorStatus) {
        setSponsorError('Please enter a valid, database-verified Sponsor ID before proceeding.');
        return;
      }
    }

    executeSocialAuth(selectedAccount, trimmed);
  };

  // Submit Custom Account Details
  const handleCustomAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = customEmail.trim();
    const trimmedName = customName.trim() || (isGoogle ? 'Google User' : 'Facebook User');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register') {
      if (!termsAgreed) {
        setError(`You must agree to the Terms and Conditions before continuing with ${isGoogle ? 'Google' : 'Facebook'}.`);
        return;
      }
      if (!sponsorStatus) {
        setSponsorError('Please enter a valid, database-verified Sponsor ID before proceeding.');
        return;
      }
    }

    const customAccount = {
      name: trimmedName,
      email: trimmedEmail,
      provider_id: `${provider}_custom_${Date.now()}`,
      avatar: isGoogle ? 'https://lh3.googleusercontent.com/a/default-user' : 'https://graph.facebook.com/default-user',
    };

    executeSocialAuth(customAccount, trimmedEmail);
  };

  const executeSocialAuth = async (account, finalEmail) => {
    setLoading(true);
    setError('');
    setNotRegisteredAccount(null);

    try {
      const payload = {
        provider,
        name: account.name ? account.name.replace(/\s*\(.*?\)\s*/g, '') : (isGoogle ? 'Google User' : 'Facebook User'),
        email: finalEmail,
        provider_id: account.provider_id || `${provider}_id_${Date.now()}`,
        avatar: account.avatar,
      };

      if (mode === 'register') {
        payload.sponsor_id = sponsorStatus?.user_code || sponsorId;
        payload.terms_accepted = true;
      }

      await onSocialSuccess(payload);
      onClose();
    } catch (err) {
      console.error('Social auth error:', err);
      const isNotRegistered =
        err.response?.status === 404 ||
        err.response?.data?.requires_registration ||
        (err.response?.data?.message && err.response.data.message.toLowerCase().includes('sign up'));

      if (mode === 'login' && isNotRegistered) {
        setNotRegisteredAccount({ account, email: finalEmail });
        setError(
          err.response?.data?.message ||
          `No account found linked to ${finalEmail}. Would you like to create a new account with this ${isGoogle ? 'Google' : 'Facebook'} profile?`
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          `Failed to ${mode === 'login' ? 'sign in' : 'sign up'} with ${isGoogle ? 'Google' : 'Facebook'}.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch to Register mode for not registered account
  const handleSwitchToRegisterWithAccount = () => {
    setMode('register');
    setError('');
    if (notRegisteredAccount) {
      setCustomEmail(notRegisteredAccount.email);
      setCustomName(notRegisteredAccount.account?.name || '');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="social-modal-card" style={{ maxWidth: '480px' }}>
        {/* Mode Toggle Tabs (Sign In / Sign Up) */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '7px',
              border: 'none',
              fontWeight: mode === 'login' ? '700' : '500',
              fontSize: '0.85rem',
              color: mode === 'login' ? '#0f172a' : '#64748b',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In ({isGoogle ? 'Google' : 'Facebook'})
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '7px',
              border: 'none',
              fontWeight: mode === 'register' ? '700' : '500',
              fontSize: '0.85rem',
              color: mode === 'register' ? '#0f172a' : '#64748b',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Sign Up ({isGoogle ? 'Google' : 'Facebook'})
          </button>
        </div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="social-modal-icon">
            {isGoogle ? (
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="#ea4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"/>
                <path fill="#4285f4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#fbbc05" d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c0-.6.1-1.3.1-2.4z"/>
                <path fill="#34a853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877f2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              {mode === 'login' ? `Sign in with ${isGoogle ? 'Google' : 'Facebook'}` : `Sign up with ${isGoogle ? 'Google' : 'Facebook'}`}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              {promptForEmail
                ? 'Provide your email to continue'
                : mode === 'login'
                ? 'Select or browse your Google/Facebook account'
                : 'Verify Sponsor ID, accept terms & select your account.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="alert-error" style={{ margin: '1rem 0', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
            <div>⚠️ {error}</div>
            {notRegisteredAccount && (
              <button
                type="button"
                onClick={handleSwitchToRegisterWithAccount}
                style={{
                  marginTop: '0.5rem',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.8rem',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Create an Account with this {isGoogle ? 'Google' : 'Facebook'} Profile →
              </button>
            )}
          </div>
        )}

        {/* Sponsor ID & Terms ONLY in Register Mode */}
        {mode === 'register' && (
          <>
            <div className="form-group" style={{ margin: '0.5rem 0 1rem 0' }}>
              <label className="input-label" style={{ fontWeight: '700', color: '#1e293b' }}>
                Sponsor Member ID <span style={{ color: '#ef4444' }}>* (Required for MLM Registration)</span>
              </label>

              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  value={sponsorId}
                  onChange={(e) => setSponsorId(e.target.value)}
                  placeholder="e.g. CB100001 (Auto-Verified)"
                  required
                />
                {verifyingSponsor && (
                  <span style={{ position: 'absolute', right: '12px', fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>
                    Checking...
                  </span>
                )}
              </div>

              {sponsorStatus && (
                <div className="sponsor-success-badge" style={{ marginTop: '0.4rem' }}>
                  ✓ Verified: <strong>{sponsorStatus.name}</strong> ({sponsorStatus.user_code})
                </div>
              )}

              {sponsorError && !verifyingSponsor && (
                <div className="sponsor-error-text" style={{ marginTop: '0.4rem' }}>
                  ⚠️ {sponsorError}
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.65rem 0.75rem', borderRadius: '8px', margin: '0 0 1rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => {
                    setTermsAgreed(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  style={{ marginTop: '0.15rem', cursor: 'pointer', accentColor: '#6366f1' }}
                  required
                />
                <span>
                  I have read, understood, and agree to the{' '}
                  <strong style={{ color: '#6366f1' }}>Terms and Conditions</strong> and Privacy Policy. <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </label>
            </div>
          </>
        )}

        {promptForEmail ? (
          /* MISSING FACEBOOK EMAIL PROMPT */
          <form onSubmit={handleManualEmailSubmit} style={{ marginTop: '0.5rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1877f2', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  f
                </div>
                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{selectedAccount?.name}</strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', lineHeight: '1.4' }}>
                ℹ️ Your Facebook profile does not have a linked email address. Please enter an email address to continue.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ fontWeight: '600', fontSize: '0.82rem', color: '#334155' }}>
                Enter Your Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="form-input"
                  value={userEmailInput}
                  onChange={(e) => setUserEmailInput(e.target.value)}
                  placeholder="e.g. yourname@example.com"
                  required
                  autoFocus
                />
              </div>
              {emailInputError && (
                <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  ⚠️ {emailInputError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="social-btn"
                onClick={() => setPromptForEmail(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || (mode === 'register' && !termsAgreed)}
                style={{
                  flex: 2,
                  marginTop: 0,
                  opacity: mode === 'register' && !termsAgreed ? 0.65 : 1,
                  cursor: mode === 'register' && !termsAgreed ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Processing...' : 'Continue →'}
              </button>
            </div>
          </form>
        ) : showCustomAccount ? (
          /* ENTER CUSTOM GOOGLE / FACEBOOK ACCOUNT EMAIL */
          <form onSubmit={handleCustomAccountSubmit} style={{ marginTop: '0.5rem' }}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label" style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                {isGoogle ? 'Google Account Email' : 'Facebook Account Email'} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                className="form-input"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder={isGoogle ? 'e.g. user@gmail.com' : 'e.g. user@facebook.com'}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="social-btn"
                onClick={() => setShowCustomAccount(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                ← Back to List
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || (mode === 'register' && (!termsAgreed || !sponsorStatus))}
                style={{
                  flex: 2,
                  marginTop: 0,
                  opacity: mode === 'register' && (!termsAgreed || !sponsorStatus) ? 0.65 : 1,
                  cursor: mode === 'register' && (!termsAgreed || !sponsorStatus) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Authenticating...' : mode === 'login' ? `Sign In with ${isGoogle ? 'Google' : 'Facebook'} →` : 'Complete Sign Up →'}
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD SELECT SOCIAL ACCOUNT VIEW */
          <>
            {/* Primary Browser Account Selection Button for Google */}
            {isGoogle && (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={handleGoogleBrowserLaunch}
                  disabled={loading || (mode === 'register' && (!termsAgreed || !sponsorStatus))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    width: '100%',
                    padding: '0.8rem 1rem',
                    background: '#ffffff',
                    border: '1.5px solid #4285f4',
                    borderRadius: '8px',
                    color: '#1a73e8',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: (mode === 'register' && (!termsAgreed || !sponsorStatus)) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 5px rgba(66, 133, 244, 0.15)',
                    opacity: (mode === 'register' && (!termsAgreed || !sponsorStatus)) ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.9 5 12 5z"/>
                    <path fill="#4285f4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#fbbc05" d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c0-.6.1-1.3.1-2.4z"/>
                    <path fill="#34a853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.2-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/>
                  </svg>
                  <span>🌐 Choose Google Account in Browser</span>
                </button>
                <div style={{ textAlign: 'center', margin: '0.5rem 0', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  <span>or select a quick account below</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                </div>
              </div>
            )}

            <div className="account-list">
              {defaultAccounts.map((acc, idx) => {
                const isItemDisabled =
                  loading ||
                  (mode === 'register' && (!sponsorStatus || verifyingSponsor || !termsAgreed));

                return (
                  <button
                    key={idx}
                    className="account-item-btn"
                    onClick={() => handleSelectAccount(acc)}
                    disabled={isItemDisabled}
                    style={{
                      opacity: isItemDisabled ? 0.6 : 1,
                      cursor: isItemDisabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      width: '100%',
                      textAlign: 'left',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div className="account-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: isGoogle ? '#f87171' : '#60a5fa', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', marginRight: '0.75rem', flexShrink: 0 }}>
                      {acc.name.charAt(0)}
                    </div>
                    <div className="account-details" style={{ flex: 1, minWidth: 0 }}>
                      <div className="account-name" style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>{acc.name}</div>
                      <div className="account-email" style={{ fontSize: '0.78rem', color: acc.email ? '#64748b' : '#d97706', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.email || '⚠️ No email linked (Click to provide email)'}
                      </div>
                    </div>
                    <span className="select-arrow" style={{ color: '#94a3b8', fontSize: '1.1rem', marginLeft: '0.5rem' }}>→</span>
                  </button>
                );
              })}
            </div>

            {/* Use Another Account Option */}
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowCustomAccount(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  textDecoration: 'underline',
                }}
              >
                + Type custom {isGoogle ? 'Google' : 'Facebook'} email address
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475467',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                {mode === 'login' ? "Don't have an account? Sign Up" : 'Already registered? Sign In'}
              </button>

              <button className="social-btn" onClick={onClose} disabled={loading} style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SocialAuthModal;
