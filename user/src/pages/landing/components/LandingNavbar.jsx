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
      <div className="cb-container cb-nav-inner">
        {/* Brand Logo */}
        <div className="cb-nav-logo" onClick={() => handleScrollTo('hero')}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(15, 76, 129, 0.25)',
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.03em', fontFamily: 'Poppins, sans-serif' }}>
                ADD<span style={{ color: "#FF7A00" }}>NET</span>
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginTop: '-2px' }}>
              Business Promoter Network
            </span>
          </div>
        </div>

        {/* Center Desktop Navigation */}
        <nav>
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
            className="cb-btn-outline"
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.88rem' }}
          >
            <LogIn size={16} />
            <span>Login</span>
          </button>

          <button
            type="button"
            onClick={onRegisterClick}
            className="cb-btn-secondary"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
          >
            <span>Become a Partner</span>
            <ArrowRight size={16} />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="cb-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
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
