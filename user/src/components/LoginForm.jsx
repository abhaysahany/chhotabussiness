import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Star,
  AlertCircle,
  Loader2,
  HelpCircle,
  LogIn,
  UserPlus,
  KeyRound,
  X,
} from 'lucide-react';
import './auth.css';

function LoginForm({ onLoginSuccess, onSwitchToRegister, onSocialClick, onBackToHome, onOpenLegalPage }) {
  const [email, setEmail] = useState('user@vyaparadnet.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await onLoginSuccess({ email, password, rememberMe });
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid email or password. Please verify credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
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

        {/* Brand Center/Right in Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenLegalPage) onOpenLegalPage('terms');
            }}
            className="cb-auth-help-link"
          >
            <HelpCircle size={15} />
            <span>Need Help?</span>
          </a>
        </div>
      </header>

      {/* 2. Main Auth Content */}
      <main className="cb-auth-main">
        <div className="cb-auth-container">
          
          {/* Left Column: Vyapar Adnet Value Showcase (Desktop) */}
          <div className="cb-auth-showcase">
            <div>
              {/* Pill Badge */}
              <div className="cb-showcase-badge">
                <Sparkles size={13} />
                <span>Zero Upfront Cost • Pay On Deals</span>
              </div>

              {/* Title */}
              <h2 className="cb-showcase-title">
                Welcome Back to Your <span className="text-orange">Partner Portal</span>
              </h2>

              <p className="cb-showcase-desc">
                Access your real-time promoter network, monitor closing sales, track multi-tier commission payouts, and scale your client base across India.
              </p>

              {/* 3 Key Value Points */}
              <div className="cb-showcase-features">
                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <Briefcase size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Pay Only When You Close</h4>
                    <p>No monthly subscription or advertising risk. Pay a small commission only on closed revenue.</p>
                  </div>
                </div>

                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Direct Customer Settlements</h4>
                    <p>Clients pay 100% directly to your company account. Full financial control always.</p>
                  </div>
                </div>

                <div className="cb-showcase-feature-item">
                  <div className="cb-showcase-feature-icon">
                    <Users size={18} />
                  </div>
                  <div className="cb-showcase-feature-text">
                    <h4>Multi-Tier Network Earnings</h4>
                    <p>Transparent genealogy tree tracking and instant TDS-compliant tax summaries.</p>
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
                "Vyapar Adnet connected our software development agency with over 28 genuine corporate clients within the first 60 days."
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

          {/* Right Column: Sign In Form Box */}
          <div className="cb-auth-form-panel">
            
            {/* Brand Logo Header */}
            <div className="cb-auth-brand-header">
              <div className="cb-auth-logo-badge">
                <Building2 size={24} />
              </div>
              <div>
                <div className="cb-auth-logo-text-title">
                  VYAPAR<span>ADNET</span>
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
                className="cb-auth-tab active"
              >
                <LogIn size={15} />
                <span>Partner Sign In</span>
              </button>
              <button
                type="button"
                className="cb-auth-tab"
                onClick={onSwitchToRegister}
              >
                <UserPlus size={15} />
                <span>Register Partner</span>
              </button>
            </div>

            {/* Form Headline */}
            <div className="cb-form-header">
              <h1 className="cb-form-title">Welcome back!</h1>
              <p className="cb-form-subtitle">
                Enter your credentials to access your business dashboard.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="cb-alert-error">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
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
                    placeholder="partner@vyaparadnet.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              {/* Options: Remember Me & Forgot Password */}
              <div className="cb-form-options">
                <label className="cb-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="cb-link-btn"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSubmitted(false);
                    setShowForgotModal(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="cb-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="cb-auth-divider">
              <span>Or continue with</span>
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
              <span>Continue with Google</span>
            </button>

            {/* Footer Prompt */}
            <div className="cb-auth-footer-text">
              <span>Don't have an account yet?</span>
              <button
                type="button"
                className="highlight-link"
                onClick={onSwitchToRegister}
              >
                Register as Partner →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Bottom Legal Footer */}
      <footer className="cb-auth-bottom-footer">
        <span>© {new Date().getFullYear()} Vyapar Adnet Pvt. Ltd. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <a
            href="#terms"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenLegalPage) onOpenLegalPage('terms');
            }}
          >
            Terms of Service
          </a>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenLegalPage) onOpenLegalPage('privacy');
            }}
          >
            Privacy Policy
          </a>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
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
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 76, 129, 0.25)',
              border: '1px solid #E2E8F0',
              position: 'relative',
              animation: 'cbFadeIn 0.25s ease-out',
            }}
          >
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--cb-primary-light, #e8f1f8)',
                  color: 'var(--cb-primary, #0F4C81)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', fontFamily: 'Poppins, sans-serif' }}>
                  Reset Password
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                  We'll send password recovery instructions to your email.
                </p>
              </div>
            </div>

            {forgotSubmitted ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.1rem', fontWeight: 700 }}>
                  Reset Link Dispatched!
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
                  If an account exists for <strong>{forgotEmail}</strong>, password reset instructions have been dispatched to your inbox.
                </p>
                <button
                  type="button"
                  className="cb-submit-btn"
                  onClick={() => setShowForgotModal(false)}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="cb-form-group">
                  <label className="cb-input-label">
                    <span>Registered Account Email</span>
                  </label>
                  <div className="cb-input-wrapper">
                    <span className="cb-input-icon">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="cb-input-field"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="partner@vyaparadnet.com"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="cb-btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cb-submit-btn"
                    style={{ flex: 1.5 }}
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
