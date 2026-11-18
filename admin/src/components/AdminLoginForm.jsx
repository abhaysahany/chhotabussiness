import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBranding } from '../utils/branding';
import {
  adminLogin,
  adminForgotPassword,
  adminVerifyOtp,
  adminResetPassword,
} from '../api/adminService';
import { initSession, getExpiredNotice } from '../utils/sessionManager';
import { FieldError, getInputErrorStyle } from '../utils/validation';

function AdminLoginForm({ onLoginSuccess, initialShowForgot = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isForgotRoute = location.pathname.includes('/forgot-password') || location.pathname.includes('/reset-password');
  const { appName, logoUrl } = useBranding();
  const [logoFailed, setLogoFailed] = useState(false);
  const [login, setLogin] = useState('admin');

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);
  const [password, setPassword] = useState('123456');
  const [loginFieldErrors, setLoginFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(null);

  useEffect(() => {
    const notice = getExpiredNotice();
    if (notice) {
      setSessionExpiredNotice(notice);
    }
  }, []);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(() => Boolean(initialShowForgot || isForgotRoute));
  const [forgotStep, setForgotStep] = useState(1); // 1: Login/Email, 2: OTP, 3: New Password, 4: Success

  useEffect(() => {
    if (initialShowForgot || isForgotRoute) {
      setShowForgotModal(true);
    }
  }, [initialShowForgot, isForgotRoute]);
  const [resetLogin, setResetLogin] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [demoOtpHint, setDemoOtpHint] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!login || !login.trim()) {
      errs.login = 'Username or email address is required.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 3) {
      errs.password = 'Password must be at least 3 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setLoginFieldErrors(errs);
      return;
    }

    setLoginFieldErrors({});
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await adminLogin({ login: login.trim(), password });

      if (response.status === 'success' && response.token) {
        initSession(response.token, { rememberMe });
        if (onLoginSuccess) {
          onLoginSuccess(response.admin);
        }
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const errMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : !err.response
            ? (typeof window !== 'undefined' && window.location.origin.includes('vyaparadnet.com')
                ? 'Unable to connect to backend server. Please verify your connection or try again shortly.'
                : 'Unable to connect to backend server. Please verify that "php artisan serve" is running on port 8000.')
            : 'Invalid email/username or password credentials.');
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const handleOpenForgotModal = (e) => {
    if (e) e.preventDefault();
    setResetLogin(login || '');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep(1);
    setForgotError(null);
    setDemoOtpHint(null);
    setMaskedEmail('');
    setResendCooldown(0);
    setShowForgotModal(true);
  };

  // Close Forgot Password Modal
  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    if (isForgotRoute) {
      navigate('/login', { replace: true });
    }
  };

  // Step 1: Send OTP to Admin Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!resetLogin) {
      setForgotError('Please enter your admin username or email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await adminForgotPassword({ login: resetLogin });
      if (res.status === 'success' || res.success) {
        if (res.masked_email) {
          setMaskedEmail(res.masked_email);
        }
        if (res.otp) {
          setDemoOtpHint(res.otp);
        } else {
          setDemoOtpHint(null);
        }
        setResendCooldown(60);
        setForgotStep(2);
      } else {
        setForgotError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      console.error('Admin forgot password error:', err);
      const remainingSeconds = err.response?.data?.retry_after_seconds;
      if (remainingSeconds) {
        setResendCooldown(remainingSeconds);
      }
      setForgotError(
        err.response?.data?.message || 'No administrator account found with that email or username.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setForgotError('Please enter the 6-digit OTP code.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await adminVerifyOtp({ login: resetLogin, otp: resetOtp });
      if (res.status === 'success' || res.success) {
        setForgotStep(3);
      } else {
        setForgotError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      console.error('Admin verify OTP error:', err);
      setForgotError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Password confirmation does not match.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await adminResetPassword({
        login: resetLogin,
        otp: resetOtp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (res.status === 'success' || res.success) {
        setForgotStep(4);
        setLogin(resetLogin);
        setPassword('');
        setSuccessMsg('Admin password reset successfully! Please sign in with your new credentials.');
      } else {
        setForgotError(res.message || 'Failed to reset admin password.');
      }
    } catch (err) {
      console.error('Admin reset password error:', err);
      setForgotError(
        err.response?.data?.message ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(' ')
            : 'Failed to reset password.')
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Brand Header */}
      <div className="auth-header">
        <div className="brand-logo" style={{ justifyContent: 'center' }}>
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={appName}
              className="admin-login-logo"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <>
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
                <path
                  d="M10 10H16C18.2091 10 20 11.7909 20 14V14C20 16.2091 18.2091 18 16 18H10V10Z"
                  fill="white"
                />
                <path
                  d="M16 18H22V22H16C13.7909 22 12 20.2091 12 18V18"
                  stroke="white"
                  strokeWidth="3"
                />
                <defs>
                  <linearGradient
                    id="logo-grad"
                    x1="0"
                    y1="0"
                    x2="32"
                    y2="32"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#3569a7" />
                    <stop offset="1" stopColor="#264e7e" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="brand-name">{appName}</span>
              <span className="brand-badge">ADMIN</span>
            </>
          )}
        </div>
        <h1 className="auth-title">Administrator Portal</h1>
        <p className="auth-subtitle">
          Sign in to access platform controls, user management, and executive analytics.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="auth-card">
        {successMsg && (
          <div className="alert" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {sessionExpiredNotice && (
          <div
            className="alert"
            style={{
              backgroundColor: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              fontSize: '0.85rem',
              lineHeight: '1.4',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Session Expired</strong>
              <span>{sessionExpiredNotice}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="login">
              Email address / Username <span className="required-asterisk">*</span>
            </label>
            <input
              id="login"
              type="text"
              className="form-input"
              placeholder="you@example.com or admin"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                if (loginFieldErrors.login) setLoginFieldErrors({ ...loginFieldErrors, login: null });
              }}
              style={getInputErrorStyle(loginFieldErrors.login)}
              autoComplete="username"
            />
            <FieldError error={loginFieldErrors.login} />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required-asterisk">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (loginFieldErrors.password) setLoginFieldErrors({ ...loginFieldErrors, password: null });
                }}
                style={getInputErrorStyle(loginFieldErrors.password)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <FieldError error={loginFieldErrors.password} />
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">Keep me signed in</span>
            </label>

            <button
              type="button"
              className="forgot-password-link"
              onClick={handleOpenForgotModal}
              style={{
                background: 'none',
                border: 'none',
                color: '#3569a7',
                fontWeight: '600',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.8125rem',
                textDecoration: 'underline',
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner-wrapper">
                <span className="spinner"></span> Authenticating...
              </span>
            ) : (
              'Sign In to Admin Portal'
            )}
          </button>
        </form>

        <div className="auth-card-footer" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured Administrator Access (256-bit Encrypted)</span>
          </div>
        </div>
      </div>

      {/* ADMIN FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="auth-modal-overlay" onClick={handleCloseForgotModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="auth-modal-header">
              <div>
                <div className="auth-modal-badge">
                  <span>🔐 Admin Security</span>
                </div>
                <h3 className="auth-modal-title">
                  Reset Admin Password
                </h3>
              </div>
              <button
                type="button"
                className="auth-modal-close-btn"
                onClick={handleCloseForgotModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Stepper Indicator */}
            {forgotStep < 4 && (
              <div className="auth-modal-stepper">
                <div className={`auth-modal-step-bar ${forgotStep >= 1 ? 'active' : ''}`} />
                <div className={`auth-modal-step-bar ${forgotStep >= 2 ? 'active' : ''}`} />
                <div className={`auth-modal-step-bar ${forgotStep >= 3 ? 'active' : ''}`} />
              </div>
            )}

            {/* Error Message */}
            {forgotError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: Enter Username/Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp}>
                <p className="auth-modal-desc">
                  Enter your registered administrator email address or username to receive a 6-digit verification code.
                </p>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="resetLogin">
                    Admin Email or Username <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="resetLogin"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. admin@addnet.com or admin"
                    value={resetLogin}
                    onChange={(e) => setResetLogin(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="auth-modal-actions">
                  <button
                    type="button"
                    className="auth-modal-btn auth-modal-btn-secondary"
                    onClick={handleCloseForgotModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="auth-modal-btn auth-modal-btn-primary"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                        Sending...
                      </>
                    ) : (
                      'Send Verification OTP →'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <p className="auth-modal-desc">
                  Enter the 6-digit verification code sent to {maskedEmail ? <strong style={{ color: '#0f172a' }}>{maskedEmail}</strong> : `administrator ${resetLogin}`}.
                </p>

                {demoOtpHint && (
                  <div className="demo-otp-box">
                    <span>⚡ Demo OTP: <strong>{demoOtpHint}</strong></span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(demoOtpHint)}
                      className="demo-otp-fill-btn"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="resetOtp">
                    6-Digit Verification Code <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="resetOtp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    className="form-input otp-input-field"
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="step-2-actions-row">
                  <button
                    type="button"
                    className="auth-modal-btn-link"
                    onClick={() => setForgotStep(1)}
                  >
                    ← Change Username
                  </button>

                  <div className="step-2-buttons-group">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading || resendCooldown > 0}
                      className="auth-modal-btn auth-modal-btn-secondary"
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="auth-modal-btn auth-modal-btn-primary"
                    >
                      {forgotLoading ? (
                        <>
                          <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP →'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: Enter New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <p className="auth-modal-desc">
                  Create a new administrator password for <strong style={{ color: '#0f172a' }}>{resetLogin}</strong>.
                </p>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="newPassword">
                    New Admin Password <span className="required-asterisk">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="confirmPassword">
                    Confirm New Password <span className="required-asterisk">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="auth-modal-actions">
                  <button
                    type="button"
                    className="auth-modal-btn auth-modal-btn-secondary"
                    onClick={() => setForgotStep(2)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="auth-modal-btn auth-modal-btn-primary"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                        Updating...
                      </>
                    ) : (
                      'Update Password ✓'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success */}
            {forgotStep === 4 && (
              <div className="auth-modal-success-box">
                <div className="auth-modal-success-icon">
                  ✓
                </div>
                <h4 className="auth-modal-success-title">
                  Admin Password Updated!
                </h4>
                <p className="auth-modal-desc" style={{ marginBottom: '1.5rem' }}>
                  Your administrator password has been reset. You can now log in to the admin panel with your new password.
                </p>
                <button
                  type="button"
                  className="auth-modal-btn auth-modal-btn-primary"
                  style={{ width: '100%', height: '44px' }}
                  onClick={handleCloseForgotModal}
                >
                  Proceed to Sign In →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="page-footer">
        © {new Date().getFullYear()} {appName} — Powered by Laravel & React
      </footer>
    </div>
  );
}

export default AdminLoginForm;
