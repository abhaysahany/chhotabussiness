import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginEntity,
  forgotPasswordEntity,
  verifyResetOtpEntity,
  resetPasswordEntity,
} from '../api/entityService';

function EntityLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [demoOtpHint, setDemoOtpHint] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await loginEntity({
        email,
        password,
        remember: rememberMe,
      });

      if (response.success || response.status === 'success') {
        if (response.token) {
          localStorage.setItem('entity_token', response.token);
        }
        if (response.user) {
          localStorage.setItem('entity_user', JSON.stringify(response.user));
        }
        if (rememberMe) {
          localStorage.setItem('entity_remember', 'true');
        }
        navigate('/entity/dashboard');
      } else {
        setError(response.message || response.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Entity login error:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Unable to connect to backend server. Make sure the Laravel API is active.');
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const handleOpenForgotModal = () => {
    setResetEmail(email || '');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotStep(1);
    setForgotError(null);
    setDemoOtpHint(null);
    setShowForgotModal(true);
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await forgotPasswordEntity({ email: resetEmail });
      if (res.status === 'success' || res.success) {
        if (res.otp) {
          setDemoOtpHint(res.otp);
        }
        setForgotStep(2);
      } else {
        setForgotError(res.message || 'Failed to send OTP code.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotError(
        err.response?.data?.message || 'No registered entity found with this email address.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setForgotError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await verifyResetOtpEntity({ email: resetEmail, otp: resetOtp });
      if (res.status === 'success' || res.success) {
        setForgotStep(3);
      } else {
        setForgotError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
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
      const res = await resetPasswordEntity({
        email: resetEmail,
        otp: resetOtp,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (res.status === 'success' || res.success) {
        setForgotStep(4);
        setEmail(resetEmail);
        setPassword('');
        setSuccessMsg('Password reset successfully! Please sign in with your new password.');
      } else {
        setForgotError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
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
        <div className="brand-logo">
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="36" height="36" rx="10" fill="url(#entity-grad)" />
            <path
              d="M11 11H18C20.7614 11 23 13.2386 23 16V16C23 18.7614 20.7614 21 18 21H11V11Z"
              fill="white"
            />
            <path
              d="M18 21H25V25H18C15.2386 25 13 22.7614 13 20V20"
              stroke="white"
              strokeWidth="3.5"
            />
            <defs>
              <linearGradient
                id="entity-grad"
                x1="0"
                y1="0"
                x2="36"
                y2="36"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#7a8439" />
                <stop offset="1" stopColor="#505726" />
              </linearGradient>
            </defs>
          </svg>
          <span className="brand-name">Vyapar Adnet</span>
          <span className="brand-badge entity-badge">ENTITY PANEL</span>
        </div>
        <h1 className="auth-title">Entity Portal Sign In</h1>
        <p className="auth-subtitle">
          Manage your verified business entities, services, listings, and leads.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="auth-card">
        {successMsg && (
          <div className="alert alert-success" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              Entity / User Email <span className="required-asterisk">*</span>
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="e.g. contact@yourbusiness.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
          </div>

          <div className="form-options-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleOpenForgotModal}
              style={{
                background: 'none',
                border: 'none',
                color: '#636B2F',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '0.2rem 0',
                textDecoration: 'underline',
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner-sm" />
                Signing In...
              </span>
            ) : (
              'Sign In to Entity Panel'
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <div className="security-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secured 256-bit Encrypted Entity Access</span>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f4f6ec', color: '#636B2F', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                  <span>🔐 Password Recovery</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Reset Entity Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* Stepper Indicator */}
            {forgotStep < 4 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: forgotStep >= 1 ? '#636B2F' : '#e2e8f0' }} />
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: forgotStep >= 2 ? '#636B2F' : '#e2e8f0' }} />
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: forgotStep >= 3 ? '#636B2F' : '#e2e8f0' }} />
              </div>
            )}

            {/* Modal Error Alert */}
            {forgotError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ⚠️ {forgotError}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Enter the registered email associated with your business or freelance entity. We'll send you a 6-digit OTP code.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8125rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Registered Entity Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. contact@yourbusiness.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{ padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: '0.6rem 1.25rem', background: '#636B2F', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {forgotLoading ? 'Sending Code...' : 'Send Verification OTP →'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Enter the 6-digit verification code sent to <strong style={{ color: '#0f172a' }}>{resetEmail}</strong>.
                </p>

                {demoOtpHint && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⚡ Demo OTP: <strong>{demoOtpHint}</strong></span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(demoOtpHint)}
                      style={{ background: '#dcfce7', border: 'none', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8125rem', color: '#334155', marginBottom: '0.4rem' }}>
                    6-Digit Verification OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="form-input"
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', letterSpacing: '4px', fontSize: '1.25rem', textAlign: 'center', fontWeight: '700' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ← Change Email
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading}
                      style={{ padding: '0.55rem 0.85rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Resend OTP
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{ padding: '0.55rem 1.2rem', background: '#636B2F', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {forgotLoading ? 'Verifying...' : 'Verify OTP →'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: Create New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Set a new secure password for <strong style={{ color: '#0f172a' }}>{resetEmail}</strong>.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8125rem', color: '#334155', marginBottom: '0.4rem' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', paddingRight: '4.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8125rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(2)}
                    style={{ padding: '0.6rem 1.25rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{ padding: '0.6rem 1.25rem', background: '#636B2F', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password ✓'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success */}
            {forgotStep === 4 && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontSize: '1.75rem' }}>
                  ✓
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  Password Reset Complete!
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Your password has been successfully updated. You can now log in to the Entity Portal with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ width: '100%', padding: '0.75rem', background: '#636B2F', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Proceed to Sign In →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EntityLogin;
