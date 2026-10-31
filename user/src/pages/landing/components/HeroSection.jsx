import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  TrendingUp,
  CreditCard,
  Zap,
  Briefcase,
  Star,
  Search,
} from 'lucide-react';

function HeroSection({ onFindServicesClick, onBecomePartnerClick }) {
  return (
    <section id="hero" className="cb-hero-section">
      <div className="cb-container">
        <div className="cb-hero-grid">
          {/* Left Column: Hero Content & CTAs */}
          <div>
            {/* Top Announcement Pill */}
            <div className="cb-badge cb-badge-orange" style={{ marginBottom: '1.25rem' }}>
              <Sparkles size={14} />
              <span>Pay ONLY When You Get Business Through Us • Zero Upfront Cost</span>
            </div>

            {/* Headline */}
            <h1 className="cb-hero-headline">
              Grow Your Business With <span className="highlight-blue">Quality</span> <span className="highlight-orange">Customers</span>
            </h1>

            {/* Subheadline */}
            <p className="cb-hero-subheadline">
              We help Software Developers, IT Companies, Tour Operators, Agencies, and Service Providers get genuine customers through our nationwide advertising network. <strong>You only pay a small commission when you get business through AddNet.</strong>
            </p>

            {/* Primary Action Buttons */}
            <div className="cb-hero-cta-group">
              <button
                type="button"
                onClick={onBecomePartnerClick}
                className="cb-btn-secondary"
                style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}
              >
                <span>Become a Partner (Free)</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={onFindServicesClick}
                className="cb-btn-outline"
                style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem' }}
              >
                <Search size={18} />
                <span>Find Services</span>
              </button>
            </div>

            {/* Trust Proof Chips */}
            <div className="cb-hero-trust-chips">
              <div className="cb-trust-chip">
                <CheckCircle2 size={16} color="#16A34A" />
                <span>Pay Only When You Close Deals</span>
              </div>
              <div className="cb-trust-chip">
                <CheckCircle2 size={16} color="#16A34A" />
                <span>100% Direct Customer Payments</span>
              </div>
              <div className="cb-trust-chip">
                <ShieldCheck size={16} color="#0F4C81" />
                <span>Zero Business = ₹0 Fee</span>
              </div>
            </div>
          </div>


          {/* Right Column: Modern Business Ecosystem Illustration */}
          <div style={{ position: 'relative' }}>
            {/* Background Glow */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '380px',
                height: '380px',
                background: 'radial-gradient(circle, rgba(15, 76, 129, 0.12) 0%, rgba(255, 122, 0, 0.08) 60%, transparent 80%)',
                filter: 'blur(30px)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* Ecosystem Architecture Card (Light Theme SaaS Card) */}
            <div
              className="cb-card cb-card-glass"
              style={{
                padding: '2rem',
                position: 'relative',
                zIndex: 2,
                boxShadow: 'var(--cb-shadow-lg)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
              }}
            >
              {/* Header Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--cb-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 10px #16A34A' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F4C81', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Live Marketplace Ecosystem
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Active Network
                </span>
              </div>

              {/* Node 1: Service Providers */}
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0F4C81', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>Service Providers</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>IT Firms, Developers & Agencies</span>
                  </div>
                </div>
                <span style={{ background: '#ffffff', color: '#0F4C81', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  Registers Profile
                </span>
              </div>

              {/* Connector 1 */}
              <div style={{ textAlign: 'center', margin: '-0.5rem 0 0.5rem 0', color: '#0F4C81' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#ffffff', padding: '2px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  ↓ Promoted by Advertising Network
                </span>
              </div>

              {/* Node 2: AddNet Core Hub */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0F4C81 0%, #1e3a5f 100%)',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '1.2rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  boxShadow: '0 8px 20px rgba(15, 76, 129, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Zap size={18} color="#FF7A00" />
                  <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>ADDNET</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Targeted Ad Campaigns • SEO • High-Intent Lead Generation
                </p>
              </div>

              {/* Connector 2 */}
              <div style={{ textAlign: 'center', margin: '-0.5rem 0 0.5rem 0', color: '#FF7A00' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#ffffff', padding: '2px 10px', borderRadius: '10px', border: '1px solid #fed7aa', color: '#FF7A00', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  ↓ Genuine Customers Discover Services
                </span>
              </div>

              {/* Node 3: End Customers */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#16A34A', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>Direct Customers</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Businesses, Startups & Buyers</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                    💵 Direct Payment
                  </span>
                </div>
              </div>

              {/* Bottom Guarantee Strip */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--cb-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                <span>✓ Customer pays 100% directly to Provider</span>
                <span style={{ fontWeight: 700, color: '#0F4C81' }}>Success-based Commission</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
