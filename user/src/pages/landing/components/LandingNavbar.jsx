import { useBranding } from '../../../utils/branding';
import React, { useState } from 'react';
import {
  Building2,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  LogIn,
} from 'lucide-react';

function LandingNavbar({ onLoginClick, onRegisterClick, onNavigateSection }) {
  const { appName, logoUrl } = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', target: 'hero' },
    // { label: 'Categories', target: 'categories' },
    { label: 'How It Works', target: 'how-it-works' },
    { label: 'Business Model', target: 'infographic' },
    { label: 'Benefits', target: 'benefits' },
    { label: 'Why Us', target: 'why-us' },
    { label: 'FAQ', target: 'faq' },
  ];

  const handleScrollTo = (targetId) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(targetId);
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="cb-navbar">
      <style>{`
        /* Scoped responsive styles for navbar */
        .cb-nav-top-row {
          display: contents;
        }

        .cb-header-login-btn {
          padding: 0.6rem 1.15rem;
          font-size: 0.88rem;
          white-space: nowrap;
        }

        .cb-header-partner-btn {
          padding: 0.6rem 1.25rem;
          font-size: 0.88rem;
          white-space: nowrap;
        }

        .cb-brand-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: #0F4C81;
          letter-spacing: -0.03em;
          font-family: 'Poppins', sans-serif;
          white-space: nowrap;
        }

        .cb-brand-subtitle {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: block;
          margin-top: -2px;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .cb-navbar {
            padding: 0;
            overflow-x: clip;
          }

          .cb-navbar .cb-nav-inner {
            height: auto !important;
            min-height: unset !important;
            flex-direction: column;
            align-items: stretch;
            padding-top: 0.55rem;
            padding-bottom: 0.65rem;
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            gap: 0.5rem;
            box-sizing: border-box;
          }

          .cb-nav-top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .cb-nav-logo {
            gap: 0.6rem;
            min-width: 0;
            flex-shrink: 1;
          }

          .cb-nav-logo img {
            width: 36px !important;
            height: 36px !important;
            flex-shrink: 0;
          }

          .cb-brand-title {
            font-size: 1.12rem;
            line-height: 1.2;
          }

          .cb-brand-subtitle {
            font-size: 0.58rem;
            letter-spacing: 0.3px;
            margin-top: 0;
          }

          .cb-mobile-menu-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            padding: 0.35rem;
            margin-left: 0.5rem;
            flex-shrink: 0;
            color: #0F4C81;
          }

          .cb-desktop-nav {
            display: none !important;
          }

          .cb-nav-actions {
            display: flex !important;
            width: 100% !important;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box;
          }

          .cb-header-login-btn {
            flex: 1 1 0%;
            min-width: 0;
            height: 38px;
            padding: 0.45rem 0.6rem !important;
            font-size: 0.82rem !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            border-radius: 8px;
            box-sizing: border-box;
          }

          .cb-header-partner-btn {
            flex: 1.45 1 0%;
            min-width: 0;
            height: 38px;
            padding: 0.45rem 0.65rem !important;
            font-size: 0.82rem !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            border-radius: 8px;
            box-sizing: border-box;
          }
        }

        @media (max-width: 360px) {
          .cb-navbar .cb-nav-inner {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            gap: 0.45rem;
          }

          .cb-nav-logo img {
            width: 32px !important;
            height: 32px !important;
          }

          .cb-brand-title {
            font-size: 1.02rem;
          }

          .cb-brand-subtitle {
            font-size: 0.54rem;
            letter-spacing: 0.2px;
          }

          .cb-header-login-btn {
            font-size: 0.78rem !important;
            padding: 0.4rem 0.45rem !important;
            height: 36px;
          }

          .cb-header-partner-btn {
            font-size: 0.78rem !important;
            padding: 0.4rem 0.5rem !important;
            height: 36px;
          }
        }

        @media (max-width: 320px) {
          .cb-brand-title {
            font-size: 0.94rem;
          }

          .cb-brand-subtitle {
            font-size: 0.5rem;
          }

          .cb-header-login-btn {
            font-size: 0.75rem !important;
            padding: 0.35rem 0.4rem !important;
          }

          .cb-header-partner-btn {
            font-size: 0.75rem !important;
            padding: 0.35rem 0.45rem !important;
          }
        }
      `}</style>

      <div className="cb-container cb-nav-inner">
        {/* Brand Logo & Mobile Toggle Row */}
        <div className="cb-nav-top-row">
          <div className="cb-nav-logo" onClick={() => handleScrollTo('hero')}>
            <img
              src={logoUrl || "/logo.png"}
              alt={appName}
              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "contain" }}
              onError={(e) => { e.target.src = "/logo.png"; }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="cb-brand-title">
                  {appName || 'Vyapar AdNET'}
                </span>
              </div>
              <span className="cb-brand-subtitle">
                Business Promoter Network
              </span>
            </div>
          </div>

          {/* Mobile Hamburger Toggle (placed in top row on mobile, styled via CSS) */}
          <button
            type="button"
            className="cb-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="cb-desktop-nav">
          <ul className="cb-nav-links">
            {navItems.map((item) => (
              <li key={item.target}>
                <button
                  type="button"
                  onClick={() => handleScrollTo(item.target)}
                  className="cb-nav-link"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right CTA Actions */}
        <div className="cb-nav-actions">
          <button
            type="button"
            onClick={onLoginClick}
            className="cb-btn-outline cb-header-login-btn"
          >
            <LogIn size={16} />
            <span>Login</span>
          </button>

          <button
            type="button"
            onClick={onRegisterClick}
            className="cb-btn-secondary cb-header-partner-btn"
          >
            <span>Become a Partner</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid var(--cb-border)',
            padding: '1.5rem',
            boxShadow: 'var(--cb-shadow-md)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {navItems.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => handleScrollTo(item.target)}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 0',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--cb-text-dark)',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--cb-border-subtle)',
                }}
              >
                {item.label}
              </button>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="cb-btn-outline"
                style={{ width: '100%' }}
              >
                <LogIn size={16} /> Login to Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRegisterClick();
                }}
                className="cb-btn-secondary"
                style={{ width: '100%' }}
              >
                Become a Partner ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
