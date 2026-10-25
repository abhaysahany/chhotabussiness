import React from 'react';
import {
  Check,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Megaphone,
  Users,
  CheckCircle2,
} from 'lucide-react';

function PricingSection({ onSelectPlan }) {
  const plans = [
    {
      id: 'provider',
      name: 'Service Providers',
      subtitle: 'Developers, IT Firms, Agencies & Consultants',
      badge: 'Pay ONLY On Business Generated',
      price: '₹0',
      period: 'No Registration Fee • Zero Upfront Cost',
      description: 'List your services for free. You ONLY pay a nominal commission when you get actual business through Chhota Business.',
      icon: <Briefcase size={22} color="#0F4C81" />,
      iconBg: '#e8f1f8',
      features: [
        'Free Business & Catalog Registration',
        'Pay ONLY When You Get Business Through Us',
        'Zero Monthly, Upfront, or Listing Fees',
        '100% Direct Customer Payment to Your Bank/UPI',
        'Receive High-Intent Verified Leads',
        'Zero Business Generated = ₹0 Fee Guarantee',
      ],
      featured: false,
      ctaText: 'Register as Provider (Free)',
      ctaStyle: 'cb-btn-outline',

    },
    {
      id: 'promoter',
      name: 'Promoters & Advertisers',
      subtitle: 'Digital Marketers, Affiliates & Business Promoters',
      badge: 'Free & High Earning ⭐',
      price: '₹0',
      period: 'Free Affiliate Onboarding • Daily Payouts',
      description: 'Promote verified service packages through our advertising tools and earn referral commissions.',
      icon: <Megaphone size={22} color="#FF7A00" />,
      iconBg: '#fff3e6',
      features: [
        'Free Promoter & Affiliate Account',
        'Access to High-Converting Ad Creatives & Banners',
        'Multi-Tier Direct & Team Commission Earnings',
        'Automated Real-Time Tracking Dashboard',
        'Fast Payouts with Instant Bank & UPI Withdrawals',
        'Dedicated Promoter Training & Support',
      ],
      featured: true,
      ctaText: 'Join as Promoter (Free)',
      ctaStyle: 'cb-btn-secondary',
    },
    {
      id: 'customer',
      name: 'End Customers & Buyers',
      subtitle: 'Startups, Businesses & Individual Clients',
      badge: 'Always 100% Free',
      price: '₹0',
      period: 'Zero Platform Markup • Free Search',
      description: 'Discover, compare, and hire verified service providers across 50+ categories with zero broker fees.',
      icon: <Users size={22} color="#16A34A" />,
      iconBg: '#dcfce7',
      features: [
        '100% Free Directory Search & Provider Comparison',
        'Direct Phone & WhatsApp Contact with Providers',
        'Zero Hidden Intermediary or Booking Charges',
        'Direct Payments with Full GST Tax Invoices',
        'Verified KYC & Credibility Background Checks',
        'Dedicated Client Assistance Desk',
      ],
      featured: false,
      ctaText: 'Find Providers (Free)',
      ctaStyle: 'cb-btn-outline',
    },
  ];

  return (
    <section id="pricing" style={{ padding: '5.5rem 0', background: '#F8FAFC', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-orange">
            <Sparkles size={13} />
            <span>Zero Joining Fee • 100% Free For Everyone</span>
          </div>
          <h2 className="cb-section-title">
            Simple, Performance-Driven Model
          </h2>
          <p className="cb-section-subtitle">
            Joining Chhota Business is <strong>completely free of cost</strong> for Service Providers, Advertisers/Promoters, and End Customers. No hidden subscriptions or upfront fees.
          </p>
        </div>

        {/* 3 Free Role Cards Grid */}
        <div className="cb-pricing-grid">
          {plans.map((p) => (
            <div key={p.id} className={`cb-pricing-card ${p.featured ? 'featured' : ''}`}>
              {p.featured && (
                <span className="cb-pricing-badge">
                  {p.badge}
                </span>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: p.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: 0 }}>
                      {p.name}
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{p.subtitle}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--cb-text-muted)', minHeight: '38px', margin: '0.75rem 0 1.25rem 0', lineHeight: 1.5 }}>
                  {p.description}
                </p>

                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--cb-border)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F4C81', fontFamily: 'Poppins, sans-serif' }}>
                      {p.price}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16A34A', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
                      Free Forever
                    </span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                    {p.period}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {p.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.85rem' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span style={{ color: 'var(--cb-text-dark)' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onSelectPlan && onSelectPlan(p.id)}
                  className={p.ctaStyle}
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  <span>{p.ctaText}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Assurance Strip */}
        <div style={{ marginTop: '3rem', background: '#ffffff', border: '1px solid var(--cb-border)', borderRadius: '16px', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', textAlign: 'center' }}>
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#0F4C81', display: 'block' }}>₹0 Upfront Registration</strong>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No setup or listing fees</span>
          </div>
          <div style={{ width: '1px', height: '35px', background: '#e2e8f0' }} />
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#16A34A', display: 'block' }}>100% Direct Client Payment</strong>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Client pays directly to provider</span>
          </div>
          <div style={{ width: '1px', height: '35px', background: '#e2e8f0' }} />
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#FF7A00', display: 'block' }}>Pure Performance Model</strong>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Commission only when you earn</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
