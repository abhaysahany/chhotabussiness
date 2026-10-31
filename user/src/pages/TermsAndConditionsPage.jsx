import React, { useState } from 'react';

function TermsAndConditionsPage({ onNavigate, onAccept }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [accepted, setAccepted] = useState(false);

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms & Eligibility',
      content: `By registering, accessing, or using the AddNet Platform (including web portals, mobile interfaces, and associated services), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, you must not register or use the platform.
      
To register as an Affiliate Partner or Community Member, you must be at least 18 years of age and legally capable of entering into binding contracts under applicable laws. Registration requires a verified Sponsor ID and a validated Email Address OTP code.`,
    },
    {
      id: 'accounts',
      title: '2. User Accounts, Sponsor Genealogy & Referral Network',
      content: `Each user is permitted one primary registered account. Multi-accounting, artificial placement manipulation, or fake referrals are strictly prohibited.
      
Your position in the affiliate referral tree is permanent upon registration with your verified Sponsor. Transferring sponsors, cross-recruiting, or poaching members from other active network legs is grounds for immediate account suspension and forfeiture of accumulated bonuses.`,
    },

    {
      id: 'commissions',
      title: '3. Commissions, TDS Deductions & Payout Guidelines',
      content: `Commissions and reward points are calculated based on genuine sales volume and verified team network performance. 
      
All payouts are subject to statutory Tax Deducted at Source (TDS) compliance under Indian Income Tax regulations. Members must complete mandatory KYC verification (PAN Card and Bank Account validation) before requesting payouts or withdrawals. Minimum withdrawal thresholds and scheduled payout processing cycles apply as displayed in your payment ledger.`,
    },
    {
      id: 'purchases',
      title: '4. Product & Service Orders, Pricing & Refunds',
      content: `Prices for products and services listed on the marketplace are subject to applicable GST and shipping costs. Orders are fulfilled through verified Business Entities and Freelance Partners.
      
Refunds, cancellations, and replacement requests must adhere to our standardized Return & Refund Policy (typically 7-day inspection window from date of delivery for eligible physical merchandise). Digital services and subscription fees are non-refundable once activated.`,
    },
    {
      id: 'conduct',
      title: '5. Prohibited Conduct & Anti-Spam Policy',
      content: `Users agree not to:
• Use automated bots, scrapers, or unauthorized API scripts.
• Send unsolicited spam marketing messages or make false income claims regarding the affiliate earnings potential.
• Engage in fraudulent, misleading, or deceptive marketing practices.
• Harass other members, entities, or platform support personnel.`,
    },
    {
      id: 'privacy',
      title: '6. Data Privacy, Confidentiality & Intellectual Property',
      content: `We take privacy seriously. Your personal information, payment credentials, and KYC documentation are encrypted and processed strictly in accordance with our Privacy Policy.
      
All logos, branding, trademarks, design elements, and proprietary software architecture belong exclusively to AddNet. Users may not copy, reverse-engineer, or commercially exploit platform assets without prior written consent.`,
    },
    {
      id: 'liability',
      title: '7. Limitation of Liability, Disclaimers & Termination',
      content: `AddNet provides the platform on an "as is" and "as available" basis without warranties of uninterrupted service. We are not liable for indirect, incidental, or consequential damages arising from business disruptions or network latency.
      
AddNet reserves the right to suspend or terminate accounts that violate these terms, fail compliance audits, or engage in illegal activities.`,
    },
  ];

  const filteredSections = searchQuery.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  const handleAcceptClick = () => {
    setAccepted(true);
    if (onAccept) onAccept();
    if (onNavigate) onNavigate('dashboard');
  };

  return (
    <div className="terms-page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', color: '#0f172a' }}>
      {/* Top Header Card */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <span>📜 Legal & Governance Documentation</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
              Terms and Conditions
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '650px', margin: 0 }}>
              Please review the membership, affiliate governance, and platform operational guidelines for AddNet.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>Effective Date</span>
            <strong style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>August 19, 2026</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
              >
                🖨️ Print Terms
              </button>
            </div>
          </div>
        </div>

        {/* Search filter */}
        <div style={{ marginTop: '1.5rem', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search clauses (e.g. commission, sponsor, payout, refund, privacy)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', paddingLeft: '2.5rem', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '0.875rem' }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔍</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '2rem', alignItems: 'start' }}>
        {/* Clauses List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredSections.length === 0 ? (
            <div style={{ background: '#ffffff', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>No clauses found matching "{searchQuery}".</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ marginTop: '1rem', background: '#6366f1', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredSections.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                style={{ background: '#ffffff', borderRadius: '14px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sec.title}
                </h3>
                <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {sec.content}
                </div>
              </div>
            ))
          )}

          {/* User Acceptance Callout */}
          <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.5rem', border: '2px dashed #cbd5e1', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              ✓ Registration Acknowledgment
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 1rem 0' }}>
              By submitting the registration form on AddNet, you formally confirm that you have read and unconditionally accepted all the operating policies outlined above.
            </p>
            {onNavigate && (
              <button
                type="button"
                onClick={handleAcceptClick}
                style={{ background: '#6366f1', color: '#ffffff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Accept & Return to App →
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Table of Contents */}
        <div style={{ position: 'sticky', top: '1rem', background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', letterSpacing: '0.05em' }}>
            Table of Contents
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sections.map((sec, idx) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  style={{ color: '#334155', textDecoration: 'none', fontSize: '0.82rem', display: 'block', padding: '0.35rem 0.5rem', borderRadius: '6px', transition: 'background 0.2s ease', fontWeight: '500' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>

          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.5' }}>
              Need legal clarifications? Contact our compliance department via support ticket.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditionsPage;
