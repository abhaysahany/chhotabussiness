import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../utils/branding';
import { initSession, getExpiredNotice } from '../utils/sessionManager';
import {
  loginEntity,
  forgotPasswordEntity,
  verifyResetOtpEntity,
  resetPasswordEntity,
} from '../api/entityService';

function EntityLogin({ onLoginSuccess }) {
  const { appName, logoUrl } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotFieldErrors, setForgotFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(null);

  useEffect(() => {
    const notice = getExpiredNotice();
    if (notice) {
      setSessionExpiredNotice(notice);
    }
  }, []);
  const navigate = useNavigate();

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [resetEmail, setResetEmail] = useState('');
  const [resetEntityType, setResetEntityType] = useState('business');
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
    setError(null);
    setSuccessMsg(null);
    const newErrors = {};

    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) {
      newErrors.email = 'Registered email or entity login ID is required.';
    } else if (trimmedEmail.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Please enter a valid email address format.';
      }
    }

    const trimmedPassword = (password || '').trim();
    if (!trimmedPassword) {
      newErrors.password = 'Password is required.';
    } else if (trimmedPassword.length < 4) {
      newErrors.password = 'Password must be at least 4 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Please resolve the highlighted validation errors.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const response = await loginEntity({
        email: trimmedEmail,
        password,
        remember: rememberMe,
      });

      if (response.success || response.status === 'success') {
        if (response.token) {
          initSession(response.token, { rememberMe, user: response.user });
        }
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(response);
        }
        navigate('/entity/dashboard');
      } else {
        setError(response.message || response.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Entity login error:', err);
      const networkMsg = typeof window !== 'undefined' && window.location.origin.includes('vyaparadnet.com')
        ? 'Unable to connect to backend server. Please verify your connection or try again shortly.'
        : 'Unable to connect to backend server. Please verify that "php artisan serve" is running.';
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : (!err.response ? networkMsg : 'Invalid credentials or unable to connect to backend server.'));
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const handleOpenForgotModal = () => {
    setResetEmail(email || '');
    setResetEntityType('business');
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

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError(null);
    setForgotFieldErrors({});
    const trimmed = (resetEmail || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed) {
      setForgotError('Please enter your registered email address.');
      setForgotFieldErrors({ email: 'Registered email address is required.' });
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setForgotError('Please enter a valid email address (e.g. contact@business.com).');
      setForgotFieldErrors({ email: 'Invalid email address format.' });
      return;
    }

    setForgotLoading(true);

    try {
      const res = await forgotPasswordEntity({
        email: resetEmail,
        entity_type: resetEntityType,
      });
      if (res.status === 'success' || res.success) {
        if (res.masked_email) {
          setMaskedEmail(res.masked_email);
        }
        if (res.entity_type) {
          setResetEntityType(res.entity_type);
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
      console.error('Forgot password error:', err);
      const remainingSeconds = err.response?.data?.retry_after_seconds;
      if (remainingSeconds) {
        setResendCooldown(remainingSeconds);
      }
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
    setForgotError(null);
    setForgotFieldErrors({});
    const cleanOtp = (resetOtp || '').trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setForgotError('Please enter a valid 6-digit numeric OTP code.');
      setForgotFieldErrors({ otp: 'Valid 6-digit numeric OTP required.' });
      return;
    }

    setForgotLoading(true);

    try {
      const res = await verifyResetOtpEntity({
        email: resetEmail,
        entity_type: resetEntityType,
        otp: resetOtp,
      });
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
    setForgotError(null);
    setForgotFieldErrors({});
    const pwErrors = {};
    if (!newPassword || newPassword.length < 6) {
      pwErrors.newPassword = 'New password must be at least 6 characters long.';
    }
    if (!confirmPassword) {
      pwErrors.confirmPassword = 'Confirm password is required.';
    } else if (newPassword !== confirmPassword) {
      pwErrors.confirmPassword = 'Password confirmation does not match.';
    }
    if (Object.keys(pwErrors).length > 0) {
      setForgotFieldErrors(pwErrors);
      setForgotError(Object.values(pwErrors)[0]);
      return;
    }

    setForgotLoading(true);

    try {
      const res = await resetPasswordEntity({
        email: resetEmail,
        entity_type: resetEntityType,
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
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
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
          )}
          <span className="brand-name">{appName}</span>
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              Registered Email / Login ID <span className="required-asterisk">*</span>
            </label>
            <input
              id="email"
              type="text"
              className="form-input"
              placeholder="e.g. contact@yourbusiness.com, phone, or registration ID"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: null })); }}
              required
              autoComplete="username email"
            />
            {fieldErrors.email && (<span style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {fieldErrors.email}</span>)}
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
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: null })); }}
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
            {fieldErrors.password && (<span style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {fieldErrors.password}</span>)}
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

            {/* STEP 1: Enter Email & Type */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Select your account type and enter your registered email. We'll send a 6-digit verification code to your inbox.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8125rem', color: '#334155', marginBottom: '0.5rem' }}>
                    Select Entity Type *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setResetEntityType('business')}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.5rem',
                        borderRadius: '8px',
                        border: resetEntityType === 'business' ? '2px solid #636B2F' : '1px solid #cbd5e1',
                        background: resetEntityType === 'business' ? '#f4f6ec' : '#ffffff',
                        color: resetEntityType === 'business' ? '#636B2F' : '#64748b',
                        fontWeight: resetEntityType === 'business' ? '700' : '600',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>🏢</span> Business Entity
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetEntityType('freelancer')}
                      style={{
                        flex: 1,
                        padding: '0.65rem 0.5rem',
                        borderRadius: '8px',
                        border: resetEntityType === 'freelancer' ? '2px solid #636B2F' : '1px solid #cbd5e1',
                        background: resetEntityType === 'freelancer' ? '#f4f6ec' : '#ffffff',
                        color: resetEntityType === 'freelancer' ? '#636B2F' : '#64748b',
                        fontWeight: resetEntityType === 'freelancer' ? '700' : '600',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>💼</span> Freelancer
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '0.8125rem', color: '#334155', marginBottom: '0.4rem' }}>
                    Registered {resetEntityType === 'freelancer' ? 'Freelancer' : 'Business'} Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder={resetEntityType === 'freelancer' ? 'e.g. freelancer@example.com' : 'e.g. contact@yourbusiness.com'}
                    value={resetEmail}
                    onChange={(e) => { setResetEmail(e.target.value); setForgotFieldErrors(prev => ({ ...prev, email: null })); }}
                    style={{ width: '100%' }}
                  />
                  {forgotFieldErrors.email && (<span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block", fontWeight: 600 }}>⚠️ {forgotFieldErrors.email}</span>)}
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
                  Enter the 6-digit verification code sent to {maskedEmail ? <strong style={{ color: '#0f172a' }}>{maskedEmail}</strong> : <strong style={{ color: '#0f172a' }}>{resetEmail}</strong>} ({resetEntityType === 'freelancer' ? 'Freelancer' : 'Business Entity'}).
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
                    onChange={(e) => { setResetOtp(e.target.value.replace(/\D/g, '')); setForgotFieldErrors(prev => ({ ...prev, otp: null })); }}
                    style={{ width: '100%', letterSpacing: '4px', fontSize: '1.25rem', textAlign: 'center', fontWeight: '700' }}
                  />
                  {forgotFieldErrors.otp && (<span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem", display: "block", textAlign: "center", fontWeight: 600 }}>⚠️ {forgotFieldErrors.otp}</span>)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ← Change Email / Type
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading || resendCooldown > 0}
                      style={{ padding: '0.55rem 0.85rem', background: '#f1f5f9', color: resendCooldown > 0 ? '#94a3b8' : '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
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
                  Set a new secure password for <strong style={{ color: '#0f172a' }}>{resetEmail}</strong> ({resetEntityType === 'freelancer' ? 'Freelancer' : 'Business Entity'}).
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
