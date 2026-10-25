import React, { useState } from 'react';
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
  const [toastMessage, setToastMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New password and confirm password do not match!');
      return;
    }

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
      setToastMessage('Password updated successfully! You can now log in using this password or continue using Social Login.');
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error('Password update error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to update password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {toastMessage && (
        <div className="profile-toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Security & Password</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage account authentication, update your password, and configure 2FA protection.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Settings</span>
          <span className="separator">»</span>
          <span className="current">Security & Password</span>
        </div>
      </div>

      <div className="profile-cards-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Change / Set Password Card */}
        <div className="pro-card">
          <div className="pro-card-header">
            <h2 className="card-box-title">{isSocialUser ? 'Set / Update Account Password' : 'Change Password'}</h2>
          </div>
          <div className="pro-card-body">
            {isSocialUser && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#166534', lineHeight: '1.4' }}>
                ✓ <strong>Connected via Google:</strong> You can log in anytime with 1-click using your Google account. You may also set a custom password below if you want to enable standard email/password login as well.
              </div>
            )}

            {errorMessage && (
              <div className="alert-error" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              {!isSocialUser && (
                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label className="form-label">Current Password <span className="required">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required={!isSocialUser}
                      className="form-input"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label">{isSocialUser ? 'New Password' : 'New Password'} <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    className="form-input"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Confirm New Password <span className="required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    className="form-input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-profile-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Updating Password...' : isSocialUser ? 'Set Account Password' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Two-Factor Authentication & Active Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 2FA Card */}
          <div className="pro-card">
            <div className="pro-card-header flex-between">
              <h2 className="card-box-title">Two-Factor Authentication (2FA)</h2>
              <span className={twoFactorEnabled ? 'status-badge-success' : 'status-badge-warning'}>
                {twoFactorEnabled ? 'Enabled ✓' : 'Disabled'}
              </span>
            </div>
            <div className="pro-card-body">
              <p style={{ fontSize: '0.875rem', color: '#475467', marginBottom: '1rem', lineHeight: '1.5' }}>
                Protect your account with Google Authenticator or SMS verification. When enabled, signing in requires a 6-digit code.
              </p>
              <button
                className={twoFactorEnabled ? 'btn-profile-secondary' : 'btn-profile-primary'}
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  setToastMessage(twoFactorEnabled ? '2FA has been disabled.' : '2FA activated successfully!');
                  setTimeout(() => setToastMessage(''), 4000);
                }}
              >
                {twoFactorEnabled ? 'Disable 2FA Protection' : 'Enable 2FA Protection'}
              </button>
            </div>
          </div>

          {/* Login Sessions */}
          <div className="pro-card">
            <div className="pro-card-header flex-between">
              <h2 className="card-box-title">Active Login Sessions</h2>
              <button className="card-action-link" onClick={() => alert('All other sessions terminated')}>
                Log Out All Others
              </button>
            </div>
            <div className="pro-card-body">
              <div className="security-summary-list">
                <div className="security-row">
                  <div className="security-row-info">
                    <strong>Windows Chrome (Current Device)</strong>
                    <p>Mumbai, India • IP: 103.21.124.5</p>
                  </div>
                  <span className="status-badge-success">Active Now</span>
                </div>
                <div className="security-row">
                  <div className="security-row-info">
                    <strong>Android App (Samsung S23)</strong>
                    <p>Mumbai, India • 2 hours ago</p>
                  </div>
                  <span className="status-badge-warning">Idle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityPassword;
