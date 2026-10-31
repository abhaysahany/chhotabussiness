import React from 'react';
import {
  TrendingUp,
  Users,
  Eye,
  Award,
  DollarSign,
  ShieldCheck,
  Scale,
  CheckCircle2,
  Clock,
  Sparkles,
  Briefcase,
  Layers,
} from 'lucide-react';

function BenefitsSection() {
  const providerBenefits = [
    { title: 'Continuous Stream of Leads', desc: 'Get matched with high-intent corporate and retail clients without spending fortunes on ad agencies.', icon: <TrendingUp size={20} /> },
    { title: '100% Direct Customer Relationships', desc: 'Own your customer relationships completely. No intermediary locks you out of future repeats.', icon: <Users size={20} /> },
    { title: 'Pan-India Brand Visibility', desc: 'Expand your market reach across 100+ cities with our targeted promotion networks.', icon: <Eye size={20} /> },
    { title: 'Enhanced Market Credibility', desc: 'Verified Partner badge elevates your conversion rate by over 45% with corporate buyers.', icon: <Award size={20} /> },
    { title: 'Higher Turnovers & Profitability', desc: 'Pay commissions only when you close actual paying deals. Zero risk, pure ROI.', icon: <DollarSign size={20} /> },
  ];

  const customerBenefits = [
    { title: '100% Verified Service Providers', desc: 'Every listed provider undergoes GST/PAN and identity document verification.', icon: <ShieldCheck size={20} /> },
    { title: 'Transparent Rate Comparison', desc: 'Compare portfolios, case studies, and transparent pricing packages easily.', icon: <Scale size={20} /> },
    { title: 'Direct Negotiation & Billing', desc: 'Communicate directly with founders and delivery heads without annoying middleman markups.', icon: <CheckCircle2 size={20} /> },
    { title: 'Safe & Direct Payments', desc: 'Pay directly via official invoice, NEFT, RTGS, or UPI with full GST tax input credit.', icon: <DollarSign size={20} /> },
    { title: 'Dedicated Priority Support', desc: 'AddNet client relationship desk helps you quickly resolve any queries.', icon: <Clock size={20} /> },
  ];

  return (
    <section id="benefits" style={{ padding: '5.5rem 0', background: '#F8FAFC' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-primary">
            <Sparkles size={13} />
            <span>Dual Advantage</span>
          </div>
          <h2 className="cb-section-title">
            Built to Benefit Both Providers & Clients
          </h2>
          <p className="cb-section-subtitle">
            A win-win business ecosystem connecting skilled service enterprises with customers seeking high-quality execution.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="cb-benefits-grid">
          {/* Left Column: For Service Providers */}
          <div className="cb-benefit-column" style={{ borderTop: '4px solid #0F4C81' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e8f1f8', color: '#0F4C81', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: 0 }}>
                  For Service Providers
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>IT Firms, Agencies, Developers & Freelancers</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {providerBenefits.map((b, idx) => (
                <div key={idx} className="cb-benefit-item" style={{ margin: 0 }}>
                  <div className="cb-benefit-icon" style={{ background: '#e8f1f8', color: '#0F4C81' }}>
                    {b.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.2rem 0' }}>
                      {b.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--cb-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: For End Customers */}
          <div className="cb-benefit-column" style={{ borderTop: '4px solid #FF7A00' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fff3e6', color: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: 0 }}>
                  For End Customers
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Startups, Corporations & Individuals</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {customerBenefits.map((b, idx) => (
                <div key={idx} className="cb-benefit-item" style={{ margin: 0 }}>
                  <div className="cb-benefit-icon" style={{ background: '#fff3e6', color: '#FF7A00' }}>
                    {b.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--cb-text-dark)', margin: '0 0 0.2rem 0' }}>
                      {b.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--cb-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BenefitsSection;
