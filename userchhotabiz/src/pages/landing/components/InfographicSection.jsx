import React from 'react';
import {
  Building2,
  Users,
  Briefcase,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Sparkles,
  CreditCard,
} from 'lucide-react';

function InfographicSection() {
  return (
    <section id="infographic" style={{ padding: '5.5rem 0', background: '#ffffff', borderTop: '1px solid var(--cb-border)', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-primary">
            <Sparkles size={13} />
            <span>Transparent Business Architecture</span>
          </div>
          <h2 className="cb-section-title">
            The Chhota Business Promotion Model
          </h2>
          <p className="cb-section-subtitle">
            Chhota Business is NOT a service vendor. We are a premier advertising network connecting trusted service providers with end clients.
          </p>
        </div>

        {/* Infographic Main Container */}
        <div className="cb-infographic-box">
          {/* Top 3 Pillar Flow */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
            {/* Pillar 1: Service Providers */}
            <div className="cb-flow-node highlight-provider">
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#0F4C81', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Briefcase size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F4C81', margin: '0 0 0.4rem 0' }}>
                Service Providers
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Developers, Agencies, IT Firms & Tour Operators who deliver the actual work.
              </p>
              <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.74rem', color: '#0369a1', fontWeight: 700 }}>
                <span>• Owns Client Relationship</span>
                <span>• Sets Own Pricing</span>
              </div>
            </div>

            {/* Arrow 1 */}
            <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
              <div style={{ background: '#e8f1f8', color: '#0F4C81', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                1. Promoted →
              </div>
            </div>

            {/* Pillar 2: Chhota Business Core */}
            <div className="cb-flow-node highlight-chhota" style={{ border: '2px solid #FF7A00', boxShadow: 'var(--cb-shadow-md)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #0F4C81 0%, #FF7A00 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F4C81', margin: '0 0 0.4rem 0' }}>
                CHHOTA BUSINESS
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                <strong>The Promotion Hub:</strong> We run multi-channel digital marketing, SEO, and social ads to drive high-intent leads.
              </p>
              <span style={{ display: 'inline-block', background: '#fff3e6', color: '#FF7A00', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', marginTop: '0.65rem' }}>
                100% Advertiser / Promoter
              </span>
            </div>

            {/* Arrow 2 */}
            <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                2. Discovers →
              </div>
            </div>

            {/* Pillar 3: End Customers */}
            <div className="cb-flow-node highlight-customer">
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#16A34A', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16A34A', margin: '0 0 0.4rem 0' }}>
                End Customers
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Businesses, Startups, and Buyers seeking trusted, verified professional services.
              </p>
              <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.74rem', color: '#15803d', fontWeight: 700 }}>
                <span>• Compares Verified Rates</span>
                <span>• Direct Communication</span>
              </div>
            </div>
          </div>

          {/* Bottom Financial & Commission Flow Banner */}
          <div
            style={{
              marginTop: '2.5rem',
              background: 'linear-gradient(135deg, #0F4C81 0%, #0a355c 100%)',
              borderRadius: '16px',
              padding: '1.5rem 2rem',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            {/* Direct Payment Highlight */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={22} color="#ffffff" />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block' }}>
                  💵 100% Direct Customer Payment
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Customer pays directly to the Service Provider via Bank / UPI / Cash.
                </span>
              </div>
            </div>

            {/* Performance Fee Highlight */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} color="#ffffff" />
              </div>
              <div>
                <strong style={{ fontSize: '1rem', color: '#ffffff', display: 'block' }}>
                  🤝 Pay ONLY When You Get Business
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Provider pays nominal commission ONLY AFTER receiving payment from customer deals brought by Chhota Business. Zero business = ₹0 fee.
                </span>
              </div>
            </div>

          </div>

          {/* 4 Trust Checkmarks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--cb-border)' }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cb-text-dark)' }}>Direct Payments to You</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--cb-border)' }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cb-text-dark)' }}>No Hidden Charges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--cb-border)' }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cb-text-dark)' }}>Verified Partner Profiles</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--cb-border)' }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cb-text-dark)' }}>High-Intent Quality Leads</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InfographicSection;
