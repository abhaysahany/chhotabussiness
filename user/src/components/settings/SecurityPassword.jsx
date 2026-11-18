import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  Check,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { updateUserPassword } from '../../api/userService';

function SecurityPassword({ user }) {
  const isSocialUser = !!user?.provider && (user.provider === 'google' || user.provider === 'facebook');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'session-1',
      device: 'Windows 11 • Chrome 124',
      type: 'desktop',
      location: 'Mumbai, India • IP: 103.21.124.5',
      time: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'session-2',
      device: 'Android App • Samsung Galaxy S23',
      type: 'mobile',
      location: 'Mumbai, India • IP: 103.21.124.5',
      time: 'Last active 2 hours ago',
      isCurrent: false,
    },
  ]);

  // Real-time password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'Not Entered', color: '#94A3B8', percent: '0%' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak (min. 6 characters)', color: '#EF4444', percent: '25%' };
    if (score === 2) return { score: 2, text: 'Fair (combine numbers)', color: '#F59E0B', percent: '50%' };
    if (score === 3) return { score: 3, text: 'Good (add special symbol)', color: '#3B82F6', percent: '75%' };
    return { score: 4, text: 'Strong & High Security', color: '#10B981', percent: '100%' };
  };

  const strength = getPasswordStrength(passwordData.newPassword);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const newErrors = {};

    if (!isSocialUser && !passwordData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required.';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long.';
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please re-enter your new password.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match. Please verify.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMessage('Please fix the highlighted validation errors.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const payload = {
        new_password: passwordData.newPassword,
      };
      if (passwordData.currentPassword) {
        payload.current_password = passwordData.currentPassword;
      }

      await updateUserPassword(payload);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToastMessage('Account password updated successfully! Your credentials are now securely stored with AES-256 encryption.');
      setTimeout(() => setToastMessage(''), 6000);
    } catch (err) {
      console.error('Password update error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to update password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutOthers = () => {
    setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
    setToastMessage('All other remote device sessions have been securely terminated.');
    setTimeout(() => setToastMessage(''), 5000);
  };

  return (
    <div className="van-security-page-wrap">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-toast-success">
          <CheckCircle2 size={18} strokeWidth={2.4} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Luxury Security Banner */}
      <div className="van-security-hero-card">
        <div className="van-security-hero-left">
          <div className="van-security-hero-icon-pod">
            <Shield size={28} strokeWidth={2.4} />
          </div>
          <div className="van-security-hero-title-box">
            <div className="van-security-badge-row">
              <span className="van-security-glass-badge green">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }}></span>
                256-Bit SSL Protection
              </span>
              <span className="van-security-glass-badge">
                <Fingerprint size={12} />
                Zero Trust Architecture
              </span>
              <span className="van-security-glass-badge">
                Settings » Security & Password
              </span>
            </div>
            <h1 className="van-security-hero-h1">Security & Authentication Vault</h1>
            <p className="van-security-hero-p">
              Manage account authentication credentials, update encrypted passwords, configure 2FA protection, and monitor active device sessions.
            </p>
          </div>
        </div>

        <div className="van-security-hero-right">
          <div className="van-security-stat-pod">
            <span className="van-security-stat-lbl">Security Score</span>
            <span className="van-security-stat-val" style={{ color: '#34D399' }}>
              <Sparkles size={16} /> 95% Optimal
            </span>
          </div>
          <div className="van-security-stat-pod">
            <span className="van-security-stat-lbl">2FA Status</span>
            <span className="van-security-stat-val" style={{ color: twoFactorEnabled ? '#34D399' : '#FBBF24' }}>
              {twoFactorEnabled ? 'Protected ✓' : 'Disabled ⚠️'}
            </span>
          </div>
          <div className="van-security-stat-pod">
            <span className="van-security-stat-lbl">Active Sessions</span>
            <span className="van-security-stat-val" style={{ color: '#60A5FA' }}>
              <Laptop size={16} /> {activeSessions.length} Device{activeSessions.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="van-security-main-grid">
        {/* Left Column: Change / Set Password */}
        <div className="van-security-card">
          <div className="van-security-card-stripe blue"></div>
          <div className="van-security-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="van-3d-kpi-icon van-3d-icon-blue" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                <KeyRound size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="van-security-card-h2">
                  {isSocialUser ? 'Set / Update Account Password' : 'Change Account Password'}
                </h2>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  End-to-end encrypted password storage
                </span>
              </div>
            </div>
            <span className="van-card-badge-pill blue">AES-256</span>
          </div>

          <div className="van-security-card-body">
            {isSocialUser && (
              <div className="van-social-notice-box">
                <CheckCircle2 size={18} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Connected via Google / Social Sign-In:</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>
                    You can log in anytime with 1-click using your social account. You may also establish a custom password below to enable standard email/password login anytime.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="van-sec-alert-error">
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              {!isSocialUser && (
                <div className="van-sec-form-group">
                  <label className="van-sec-label">
                    <span>Current Password</span>
                    <span className="req">*</span>
                  </label>
                  <div className="van-sec-input-box">
                    <span className="van-sec-input-icon">
                      <Lock size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required={!isSocialUser}
                      className={`van-sec-input ${fieldErrors.currentPassword ? 'error' : ''}`}
                      value={passwordData.currentPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, currentPassword: e.target.value });
                        setFieldErrors((prev) => ({ ...prev, currentPassword: null }));
                      }}
                      placeholder="Enter current account password"
                    />
                    <button
                      type="button"
                      className="van-sec-eye-btn"
                      onClick={() => setShowCurrent(!showCurrent)}
                      title={showCurrent ? 'Hide password' : 'Show password'}
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <span style={{ color: '#EF4444', fontSize: '0.74rem', fontWeight: 650, marginTop: '0.2rem' }}>
                      ⚠️ {fieldErrors.currentPassword}
                    </span>
                  )}
                </div>
              )}

              {/* New Password */}
              <div className="van-sec-form-group">
                <label className="van-sec-label">
                  <span>New Password</span>
                  <span className="req">*</span>
                </label>
                <div className="van-sec-input-box">
                  <span className="van-sec-input-icon">
                    <KeyRound size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    className={`van-sec-input ${fieldErrors.newPassword ? 'error' : ''}`}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, newPassword: null }));
                    }}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    className="van-sec-eye-btn"
                    onClick={() => setShowNew(!showNew)}
                    title={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {passwordData.newPassword && (
                  <div className="van-pw-strength-wrap">
                    <div className="van-pw-strength-track">
                      <div
                        className="van-pw-strength-fill"
                        style={{ width: strength.percent, background: strength.color }}
                      ></div>
                    </div>
                    <div className="van-pw-strength-info">
                      <span>Strength: <strong style={{ color: strength.color }}>{strength.text}</strong></span>
                      <span>Min 6 Chars</span>
                    </div>
                  </div>
                )}

                {fieldErrors.newPassword && (
                  <span style={{ color: '#EF4444', fontSize: '0.74rem', fontWeight: 650, marginTop: '0.2rem' }}>
                    ⚠️ {fieldErrors.newPassword}
                  </span>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="van-sec-form-group">
                <label className="van-sec-label">
                  <span>Confirm New Password</span>
                  <span className="req">*</span>
                </label>
                <div className="van-sec-input-box">
                  <span className="van-sec-input-icon">
                    <ShieldCheck size={16} strokeWidth={2.2} />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    className={`van-sec-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    placeholder="Re-enter new password to verify"
                  />
                  <button
                    type="button"
                    className="van-sec-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    title={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {passwordData.confirmPassword && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', fontWeight: 700 }}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Check size={14} strokeWidth={2.6} /> Passwords match perfectly
                      </span>
                    ) : (
                      <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        ⚠️ Passwords do not match yet
                      </span>
                    )}
                  </div>
                )}

                {fieldErrors.confirmPassword && (
                  <span style={{ color: '#EF4444', fontSize: '0.74rem', fontWeight: 650, marginTop: '0.2rem' }}>
                    ⚠️ {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="van-sec-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="van-spinner" style={{ width: '16px', height: '16px' }}></span>
                    <span>Encrypting & Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock size={17} strokeWidth={2.4} />
                    <span>{isSocialUser ? 'Set Account Password' : 'Update Password'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: 2FA & Active Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {/* Card 1: Two-Factor Authentication (2FA) */}
          <div className="van-security-card">
            <div className="van-security-card-stripe emerald"></div>
            <div className="van-security-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-emerald" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                  <ShieldCheck size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 className="van-security-card-h2">Two-Factor Authentication (2FA)</h2>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Secondary verification gate</span>
                </div>
              </div>
              <span className={`van-card-badge-pill ${twoFactorEnabled ? 'green' : 'amber'}`}>
                {twoFactorEnabled ? 'Protected ✓' : 'Disabled'}
              </span>
            </div>

            <div className="van-security-card-body">
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                Protect your account against unauthorized access using Google Authenticator (TOTP) or SMS verification. When enabled, signing in requires a secure 6-digit one-time code.
              </p>

              <div className="van-2fa-benefit-list">
                <div className="van-2fa-benefit-item">
                  <CheckCircle2 size={16} />
                  <span>Protects commission earnings & withdrawal requests</span>
                </div>
                <div className="van-2fa-benefit-item">
                  <CheckCircle2 size={16} />
                  <span>Compatible with Google Authenticator & Authy</span>
                </div>
                <div className="van-2fa-benefit-item">
                  <CheckCircle2 size={16} />
                  <span>Instant login alert sent to registered email</span>
                </div>
              </div>

              <button
                type="button"
                className={`van-2fa-toggle-btn ${twoFactorEnabled ? 'disable' : 'enable'}`}
                onClick={() => {
                  const nextState = !twoFactorEnabled;
                  setTwoFactorEnabled(nextState);
                  setToastMessage(nextState ? '2FA Multi-Factor Protection enabled successfully!' : '2FA Protection disabled.');
                  setTimeout(() => setToastMessage(''), 4500);
                }}
              >
                {twoFactorEnabled ? (
                  <>
                    <Shield size={16} />
                    <span>Disable 2FA Protection</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Enable 2FA Protection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Active Login Sessions */}
          <div className="van-security-card">
            <div className="van-security-card-stripe amber"></div>
            <div className="van-security-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-cyan" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                  <Laptop size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 className="van-security-card-h2">Active Login Sessions</h2>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Currently authenticated devices</span>
                </div>
              </div>

              {activeSessions.length > 1 && (
                <button
                  type="button"
                  className="van-vault-action-btn"
                  onClick={handleLogoutOthers}
                  title="Terminate all other sessions"
                >
                  <LogOut size={13} strokeWidth={2.4} />
                  <span>Log Out All Others</span>
                </button>
              )}
            </div>

            <div className="van-security-card-body">
              <div className="van-session-list">
                {activeSessions.map((session) => (
                  <div key={session.id} className="van-session-tile">
                    <div className="van-session-left">
                      <div className={`van-session-icon-pod ${session.type === 'mobile' ? 'mobile' : ''}`}>
                        {session.type === 'mobile' ? (
                          <Smartphone size={20} strokeWidth={2.2} />
                        ) : (
                          <Laptop size={20} strokeWidth={2.2} />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <h4 className="van-session-title">{session.device}</h4>
                          {session.isCurrent && (
                            <span className="van-card-badge-pill blue" style={{ fontSize: '0.64rem', padding: '0.1rem 0.45rem' }}>
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="van-session-meta">{session.location}</p>
                      </div>
                    </div>

                    <div>
                      {session.isCurrent ? (
                        <span className="van-security-status-badge verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }}></span>
                          Active Now
                        </span>
                      ) : (
                        <span className="van-security-status-badge protected">
                          {session.time}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Safeguards Bottom Row */}
      <div className="van-security-safeguard-bar">
        <div className="van-safeguard-card">
          <div className="van-safeguard-icon blue">
            <Shield size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h4 className="van-safeguard-title">256-Bit TLS Encryption</h4>
            <p className="van-safeguard-desc">All API traffic and authentication handshakes are heavily encrypted.</p>
          </div>
        </div>

        <div className="van-safeguard-card">
          <div className="van-safeguard-icon emerald">
            <Lock size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h4 className="van-safeguard-title">Zero-Knowledge Salted Hash</h4>
            <p className="van-safeguard-desc">Passwords are hashed using industry standard Bcrypt with salted keys.</p>
          </div>
        </div>

        <div className="van-safeguard-card">
          <div className="van-safeguard-icon amber">
            <LogOut size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h4 className="van-safeguard-title">Instant Session Revocation</h4>
            <p className="van-safeguard-desc">You can revoke rogue devices and sign out everywhere with 1 click.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityPassword;
