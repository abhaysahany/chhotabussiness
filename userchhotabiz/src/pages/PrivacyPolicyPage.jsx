import React, { useState } from 'react';

function PrivacyPolicyPage({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      id: 'collection',
      title: '1. Information We Collect',
      content: `We collect information necessary to provide e-commerce, affiliate genealogy tracking, order fulfillment, and commission payout services:
      
• Personal & Contact Information: Full name, verified email address, mobile phone number, and residential/shipping address.
• KYC & Financial Data: Permanent Account Number (PAN Card), Aadhaar/government photo ID, and Bank Account details (Account Number, IFSC code) required for mandatory Tax Deducted at Source (TDS) compliance and commission bank transfers.
• Social Login Profile Data: Public profile identifiers, avatar photo URLs, and authorized email addresses retrieved via Google OAuth or Facebook Graph API.
• Transaction & Order Records: Order items, invoices, payment reference IDs, reward point earnings, and referral network volume.
• Technical & Device Information: IP address, browser type, operating system version, and session timestamps.`,
    },
    {
      id: 'usage',
      title: '2. How We Use Your Information',
      content: `ChhotaBusiness utilizes collected information for legitimate business purposes:
      
• Account Creation & Authentication: Provisioning your unique Member Code (e.g. CB100001), managing passwords, and verifying email OTPs.
• Genealogy & Commission Calculations: Computing affiliate rewards, direct sponsor bonuses, and team commissions.

• Order Fulfillment & Deliveries: Sharing shipping details with verified merchant business entities and logistics partners.
• Tax Compliance & Legal Invoicing: Reporting TDS deductions to tax authorities and issuing GST-compliant sales invoices.
• Security & Fraud Prevention: Detecting multi-accounting, unauthorized bot traffic, sponsor poaching, and payment chargeback abuse.`,
    },
    {
      id: 'social',
      title: '3. Social Login Data (Google & Facebook OAuth)',
      content: `When you choose to sign up or sign in using Google or Facebook:
      
• We access only the permissions you explicitly grant during the OAuth authorization screen (strictly basic public profile and email address).
• We do not post content to your Facebook timeline or access your private social messages.
• If your Facebook account does not have an attached email, our platform requests your email address directly to complete your user profile.
• You can disconnect social login access anytime via your Google Account Permissions or Facebook App Settings.`,
    },
    {
      id: 'sharing',
      title: '4. Information Sharing & Third-Party Processors',
      content: `We do not sell, rent, or trade your personal data to third-party advertisers. We share data solely with trusted service providers under strict confidentiality agreements:
      
• Payment Gateways & Banking Partners: For processing credit cards, UPI, net banking transactions, and payout settlements.
• Courier & Logistics Partners: For delivering physical goods purchased on the marketplace.
• Verified Business Entities & Freelancers: For executing client services and custom fulfillment requests.
• Regulatory & Law Enforcement Authorities: When mandated by subpoena, court order, or statutory tax reporting requirements.`,
    },
    {
      id: 'security',
      title: '5. Data Security & Storage Standards',
      content: `We implement robust technical and organizational security controls:
      
• 256-bit SSL / TLS encryption for all data in transit between your browser and our servers.
• Passwords and sensitive credentials are encrypted using industry-standard salted hashing algorithms (Bcrypt/Argon2).
• Secure database storage with role-based access control (RBAC) preventing unauthorized internal access.
• Routine server audits, automated backups, and vulnerability assessments.`,
    },
    {
      id: 'rights',
      title: '6. Your Privacy Rights & Data Control',
      content: `As a registered user of ChhotaBusiness, you have the right to:
      
• Access & Review: Inspect your personal profile data, KYC verification status, and commission payout ledgers.
• Rectification: Update or correct outdated contact information, bank account numbers, or address details.
• Consent Withdrawal: Opt out of marketing newsletters and non-essential promotional communications.
• Account Deletion: Request account deactivation and data purging subject to statutory tax ledger retention laws.`,
    },
    {
      id: 'cookies',
      title: '7. Cookies & Tracking Technologies',
      content: `We use cookies and local storage tokens strictly to maintain your authenticated login session, preserve your dark/light theme preferences, and protect against Cross-Site Request Forgery (CSRF) attacks. You can disable cookies in your browser settings, though certain interactive features may be disabled.`,
    },
    {
      id: 'contact',
      title: '8. Grievance Officer & Privacy Inquiries',
      content: `In accordance with the Information Technology Act and Digital Personal Data Protection standards, for any privacy concerns, data inquiries, or grievance redressals, please reach out to our designated Data Protection & Grievance Officer:
      
• Email: privacy@chhotabusiness.com / compliance@chhotabiz.com
• Portal: Submit a Ticket via the Helpdesk & Support Center
• Address: ChhotaBusiness Platform Compliance Unit, Tower B, Business Tech Park, Sector 62, Noida, India.`,
    },
  ];

  const filteredSections = searchQuery.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  return (
    <div className="privacy-page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem', color: '#0f172a' }}>
      {/* Top Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <span>🔒 Data Protection & Trust Framework</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
              Privacy Policy
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '650px', margin: 0 }}>
              Learn how ChhotaBusiness collects, protects, processes, and respects your personal and financial information.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>Last Updated</span>
            <strong style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>August 19, 2026</strong>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
              >
                🖨️ Print Policy
              </button>
            </div>
          </div>
        </div>

        {/* Live Search */}
        <div style={{ marginTop: '1.5rem', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search privacy topics (e.g. KYC, cookies, Facebook, sharing, PAN, security)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', paddingLeft: '2.5rem', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#ffffff', fontSize: '0.875rem' }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>🔍</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '2rem', alignItems: 'start' }}>
        {/* Policy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredSections.length === 0 ? (
            <div style={{ background: '#ffffff', padding: '3rem 2rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>No privacy sections found matching "{searchQuery}".</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ marginTop: '1rem', background: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
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

          {/* Quick Navigation Footer Card */}
          <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Also review our Operating Terms
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Check the complete ChhotaBusiness affiliate governance rules and agreements.
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('terms-conditions')}
                style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '0.6rem 1.15rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                View Terms & Conditions →
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Table of Contents */}
        <div style={{ position: 'sticky', top: '1rem', background: '#ffffff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', letterSpacing: '0.05em' }}>
            Policy Contents
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sections.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  style={{ color: '#334155', textDecoration: 'none', fontSize: '0.82rem', display: 'block', padding: '0.35rem 0.5rem', borderRadius: '6px', transition: 'background 0.2s ease', fontWeight: '500' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#3b82f6';
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
              🔒 <strong>Compliance Guaranteed:</strong> DPDP Act (2023) & IT Act Standards Compliant.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
