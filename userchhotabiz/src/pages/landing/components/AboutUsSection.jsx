import React from 'react';
import {
  Compass,
  Target,
  HeartHandshake,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function AboutUsSection() {
  const values = [
    { title: 'Zero Vendor Conflict', desc: 'We never deliver services ourselves. We exist solely to promote and empower our verified partner providers.' },
    { title: 'Radical Transparency', desc: 'Direct client communication and direct payments. No hidden brokerage deductions or escrow holds.' },
    { title: 'Performance Accountability', desc: 'We earn our share only when our advertising network brings you real, paying customer deals.' },
  ];

  const milestones = [
    { year: '2024', title: 'Network Foundation', desc: 'Launched advertising engine focused on local IT and software developers.' },
    { year: '2025', title: 'Pan-India Expansion', desc: 'Expanded across 50+ tier-1 & tier-2 cities with over 500 verified partner businesses.' },
    { year: '2026', title: 'National B2B Promoter Network', desc: '1,000+ active partner firms, automated commission ledger, and enterprise buyer discovery.' },
  ];

  return (
    <section id="about" style={{ padding: '5.5rem 0', background: '#ffffff', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-primary">
            <Sparkles size={13} />
            <span>Our Identity & Mission</span>
          </div>
          <h2 className="cb-section-title">
            About Chhota Business
          </h2>
          <p className="cb-section-subtitle">
            We are a high-performance coalition of digital promoters, growth marketers, and advertisers committed to scaling India's service economy.
          </p>
        </div>

        {/* 3 Core Pillar Cards: Who We Are, Mission, Vision */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3.5rem' }}>
          {/* Who We Are */}
          <div className="cb-card" style={{ borderTop: '4px solid #0F4C81' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#e8f1f8', color: '#0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Compass size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.5rem 0' }}>
              Who We Are
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--cb-text-muted)', lineHeight: 1.6, margin: 0 }}>
              Chhota Business is <strong>NOT</strong> a service provider. We are an advertising and lead generation powerhouse that brings paying clients to IT firms, software developers, marketing agencies, and corporate consultants.
            </p>
          </div>

          {/* Our Mission */}
          <div className="cb-card" style={{ borderTop: '4px solid #FF7A00' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fff3e6', color: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.5rem 0' }}>
              Our Mission
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--cb-text-muted)', lineHeight: 1.6, margin: 0 }}>
              To democratize business growth for service enterprises of all sizes by connecting them with verified, high-value customer leads through cost-effective digital marketing and advertising.
            </p>
          </div>

          {/* Our Vision */}
          <div className="cb-card" style={{ borderTop: '4px solid #16A34A' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#dcfce7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <HeartHandshake size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.5rem 0' }}>
              Our Vision
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--cb-text-muted)', lineHeight: 1.6, margin: 0 }}>
              To build India's most transparent and trusted service promoter network where service providers keep 100% direct customer payments and grow sustainably.
            </p>
          </div>
        </div>

        {/* Growth Timeline */}
        <div style={{ background: '#F8FAFC', border: '1px solid var(--cb-border)', borderRadius: '20px', padding: '2.5rem 2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--cb-text-dark)', textAlign: 'center', marginBottom: '2rem' }}>
            Our Growth Trajectory
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {milestones.map((m, idx) => (
              <div key={idx} style={{ background: '#ffffff', border: '1px solid var(--cb-border)', borderRadius: '14px', padding: '1.5rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F4C81', fontFamily: 'Poppins, sans-serif' }}>
                  {m.year}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0.4rem 0 0.35rem 0' }}>
                  {m.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--cb-text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutUsSection;
