import React from 'react';
import {
  Target,
  TrendingUp,
  Share2,
  ShieldCheck,
  CreditCard,
  Percent,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

function WhyChooseUsSection() {
  const features = [
    {
      title: 'Genuine Verified Leads',
      desc: 'Our AI and human verification filter out fake inquiries, delivering only high-intent buyers ready to purchase.',
      icon: <Target size={24} color="#0F4C81" />,
      bg: '#e8f1f8',
    },
    {
      title: 'Accelerated Business Growth',
      desc: 'Double your project pipelines in 90 days by leveraging our national business promotional campaigns.',
      icon: <TrendingUp size={24} color="#16A34A" />,
      bg: '#dcfce7',
    },
    {
      title: 'Omni-Channel Ad Network',
      desc: 'We promote your brand across Google, Meta, LinkedIn, B2B industry portals, and offline business hubs.',
      icon: <Share2 size={24} color="#FF7A00" />,
      bg: '#fff3e6',
    },
    {
      title: 'Trusted B2B Marketplace',
      desc: 'Build instant buyer confidence with verified KYC compliance, documented case studies, and transparent ratings.',
      icon: <ShieldCheck size={24} color="#0F4C81" />,
      bg: '#e8f1f8',
    },
    {
      title: '100% Direct Transactions',
      desc: 'Clients pay your company directly without escrow delays. You maintain complete financial independence.',
      icon: <CreditCard size={24} color="#059669" />,
      bg: '#ecfdf5',
    },
    {
      title: 'Performance Based Model',
      desc: 'Zero hefty upfront agency retainers. Pay nominal promotion commission only when deals are successfully closed.',
      icon: <Percent size={24} color="#FF7A00" />,
      bg: '#fff3e6',
    },
  ];

  return (
    <section id="why-us" style={{ padding: '5.5rem 0', background: '#ffffff', borderTop: '1px solid var(--cb-border)', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-orange">
            <Sparkles size={13} />
            <span>Market Advantages</span>
          </div>
          <h2 className="cb-section-title">
            Why Choose AddNet?
          </h2>
          <p className="cb-section-subtitle">
            We operate on a pure win-win promoter model designed to scale your client base with maximum efficiency.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {features.map((feat, idx) => (
            <div key={idx} className="cb-card" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: feat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                {feat.icon}
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.5rem 0' }}>
                {feat.title}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--cb-text-muted)', lineHeight: 1.6, margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUsSection;
