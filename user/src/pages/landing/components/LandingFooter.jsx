import React from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Heart,
} from 'lucide-react';

function LandingFooter({ onLoginClick, onRegisterClick, onNavigateLegal, onScrollToSection }) {
  return (
    <footer className="cb-footer">
      <div className="cb-container">
        <div className="cb-footer-grid">
          {/* Column 1: Company Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <img src="/logo.png" alt="Vyapar AdNET" style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0F4C81', letterSpacing: '-0.02em', fontFamily: 'Poppins, sans-serif' }}>
                ADD<span style={{ color: "#FF7A00" }}>NET</span>
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              AddNet is an advertising & promotional marketplace network empowering IT companies, developers, agencies, and service providers to get genuine customers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={15} color="#0F4C81" /> support@addnet.com
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} color="#0F4C81" /> +91 (800) 194-2026 (Mon-Sat, 9AM - 7PM)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} color="#0F4C81" /> Corporate Tower, Tech Hub, Mumbai & Bengaluru, India
              </span>
            </div>
          </div>

          {/* Column 2: Key Service Sectors */}
          <div>
            <h4>Service Categories</h4>
            <ul className="cb-footer-links">
              <li><a href="#categories" onClick={() => onScrollToSection && onScrollToSection('categories')}>Software & Mobile App Dev</a></li>
              <li><a href="#categories" onClick={() => onScrollToSection && onScrollToSection('categories')}>IT Infrastructure & Cloud</a></li>
              <li><a href="#categories" onClick={() => onScrollToSection && onScrollToSection('categories')}>Digital Marketing & SEO</a></li>
              <li><a href="#categories" onClick={() => onScrollToSection && onScrollToSection('categories')}>Corporate Tour & Travel</a></li>
              <li><a href="#categories" onClick={() => onScrollToSection && onScrollToSection('categories')}>Tax, GST & Legal Advisory</a></li>
              <li><a href="#categories" onClick={() => onScrollToSection && onScrollToSection('categories')}>Startup Incubation & MVP</a></li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div>
            <h4>Platform & Model</h4>
            <ul className="cb-footer-links">
              <li><a href="#how-it-works" onClick={() => onScrollToSection && onScrollToSection('how-it-works')}>How It Works (7 Steps)</a></li>
              <li><a href="#infographic" onClick={() => onScrollToSection && onScrollToSection('infographic')}>Business Flow Infographic</a></li>
              <li><a href="#benefits" onClick={() => onScrollToSection && onScrollToSection('benefits')}>Provider & Client Benefits</a></li>
              <li><a href="#why-us" onClick={() => onScrollToSection && onScrollToSection('why-us')}>Why Choose AddNet</a></li>
              <li><a href="#pricing" onClick={() => onScrollToSection && onScrollToSection('pricing')}>Pricing & Partner Plans</a></li>
              <li><a href="#faq" onClick={() => onScrollToSection && onScrollToSection('faq')}>Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Column 4: Account & Legal */}
          <div>
            <h4>Account & Compliance</h4>
            <ul className="cb-footer-links">
              <li>
                <button
                  type="button"
                  onClick={onLoginClick}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--cb-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Partner Login ↗
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onRegisterClick}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#FF7A00', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Become a Partner ↗
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateLegal && onNavigateLegal('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateLegal && onNavigateLegal('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Privacy & Data Policy
                </button>
              </li>
              <li>
                <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                  <ShieldCheck size={14} /> Section 194H TDS Compliant
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="cb-footer-bottom">
          <div>
            © {new Date().getFullYear()} <strong>AddNet Promoters Network Ltd</strong>. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b' }}>
            <span>Made with precision for Indian Enterprises</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
