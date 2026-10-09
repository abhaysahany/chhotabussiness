import React from 'react';
import {
  UserPlus,
  FileSpreadsheet,
  Share2,
  Search,
  PhoneCall,
  CreditCard,
  Percent,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

function HowItWorksSection({ onRegisterClick }) {
  const steps = [
    {
      number: '01',
      title: 'Register Business',
      desc: 'Sign up in under 2 minutes with basic business and KYC details.',
      icon: <UserPlus size={22} color="#0F4C81" />,
      tag: 'Quick Setup',
    },
    {
      number: '02',
      title: 'Create Profile & Catalog',
      desc: 'Add your service packages, portfolio links, pricing, and specialties.',
      icon: <FileSpreadsheet size={22} color="#0F4C81" />,
      tag: 'Publish',
    },
    {
      number: '03',
      title: 'Chhota Business Promotes',
      desc: 'We launch targeted ad campaigns, SEO outreach, and social promotion.',
      icon: <Share2 size={22} color="#FF7A00" />,
      tag: 'Ad Network',
    },
    {
      number: '04',
      title: 'Customers Discover',
      desc: 'High-intent clients find your services across India.',
      icon: <Search size={22} color="#0F4C81" />,
      tag: 'Traffic',
    },
    {
      number: '05',
      title: 'Direct Client Contact',
      desc: 'Customers call, WhatsApp, or message you directly without middlemen.',
      icon: <PhoneCall size={22} color="#059669" />,
      tag: 'Direct Leads',
    },
    {
      number: '06',
      title: 'Direct 100% Payment',
      desc: 'Customer pays full project cost directly to your bank account or UPI.',
      icon: <CreditCard size={22} color="#16A34A" />,
      tag: 'You Get Paid',
    },
    {
      number: '07',
      title: 'Success Commission',
      desc: 'Pay a small performance commission to Chhota Business upon completion.',
      icon: <Percent size={22} color="#FF7A00" />,
      tag: 'Win-Win',
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: '5.5rem 0', background: '#F8FAFC' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-orange">
            <Sparkles size={13} />
            <span>Simple 7-Step Workflow</span>
          </div>
          <h2 className="cb-section-title">
            How Chhota Business Works
          </h2>
          <p className="cb-section-subtitle">
            From registration to direct customer payments, here is how our advertising network powers your business growth.
          </p>
        </div>

        {/* 7-Step Grid / Timeline */}
        <div className="cb-timeline-grid">
          {steps.map((step, idx) => (
            <div key={step.number} className="cb-step-card">
              <span className="cb-step-number-badge">
                Step {step.number}
              </span>

              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#e8f1f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  marginTop: '0.25rem',
                }}
              >
                {step.icon}
              </div>

              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FF7A00', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                {step.tag}
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.4rem 0' }}>
                {step.title}
              </h4>

              <p style={{ fontSize: '0.82rem', color: 'var(--cb-text-muted)', lineHeight: 1.5, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Fast CTA */}
        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button
            type="button"
            onClick={onRegisterClick}
            className="cb-btn-secondary"
            style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}
          >
            <span>Start Partnering Today</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
