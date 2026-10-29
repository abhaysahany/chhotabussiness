import React, { useState } from 'react';

function EntityTermsModal({ currentEntity, onAccept, onLogout }) {
  const [agreed, setAgreed] = useState(false);
  const [declineWarning, setDeclineWarning] = useState(false);
  const [activeTab, setActiveTab] = useState('full'); // 'full' | 'summary'

  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Registered Business Entity';
  const entityType =
    currentEntity?.entity_details?.entity_type === 'freelancer'
      ? 'Freelance Professional Partner'
      : 'Commercial Business Partner';

  const handleAccept = () => {
    if (!agreed) {
      setDeclineWarning(true);
      return;
    }
    onAccept();
  };

  const handleDecline = () => {
    setDeclineWarning(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #636B2F 0%, #505726 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                color: '#ffffff',
              }}
            >
              📋
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                  Entity Partner Agreement
                </h3>
                <span
                  style={{
                    background: '#636B2F',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                  }}
                >
                  MANDATORY
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Terms of Service & Operational Governance for <strong>{entityName}</strong> ({entityType})
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch & Welcome banner */}
        <div style={{ padding: '0.85rem 1.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
            🔔 Please review and accept these terms to unlock your Entity Dashboard.
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'full' ? '#636B2F' : 'transparent',
                color: activeTab === 'full' ? '#ffffff' : '#64748b',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Detailed Clauses
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'summary' ? '#636B2F' : 'transparent',
                color: activeTab === 'summary' ? '#ffffff' : '#64748b',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Summary View
            </button>
          </div>
        </div>

        {/* Decline Warning Alert */}
        {declineWarning && (
          <div
            style={{
              background: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1.75rem',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span>
              <span>
                <strong>Acceptance Required:</strong> You must check the agreement box and accept the terms to proceed to your dashboard.
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Log Out Instead
              </button>
            )}
          </div>
        )}

        {/* Scrollable Terms Body */}
        <div
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            flex: 1,
            fontSize: '0.875rem',
            color: '#334155',
            lineHeight: '1.65',
          }}
        >
          {activeTab === 'summary' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f4f6ec', border: '1px solid #d4dcbe', padding: '1rem', borderRadius: '10px' }}>
                <h4 style={{ color: '#505726', margin: '0 0 0.4rem 0', fontWeight: '800' }}>⚡ Quick Partner Summary</h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.85rem' }}>
                  <li><strong>Fulfillment:</strong> Dispatch orders within 24-48 business hours.</li>
                  <li><strong>Accuracy:</strong> Maintain valid GST details, inventory, and truthful service descriptions.</li>
                  <li><strong>Settlement:</strong> Revenue settlements processed on weekly/bi-weekly cycles less platform fees.</li>
                  <li><strong>Compliance:</strong> Zero tolerance for counterfeit items, pirated content, or unauthorized transactions.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                  1. Entity Onboarding & Merchant Scope
                </h4>
                <p style={{ margin: 0 }}>
                  This Partner Agreement governs all Commercial Business Entities and Freelance Service Providers operating within the Vyapar Adnet ecosystem. By accessing the portal, you warrant that all business credentials, GST identification, tax registrations, and identity proof submitted are authentic and legally valid.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                  2. Catalog Quality, Pricing & Truthful Representation
                </h4>
                <p style={{ margin: 0 }}>
                  Entities agree to provide accurate descriptions, transparent pricing inclusive of statutory taxes, and genuine high-resolution imagery for all products and professional services. Misleading specifications or bait-and-switch pricing will result in immediate listing deactivation.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                  3. Order Fulfillment SLA & Shipping Commitments
                </h4>
                <p style={{ margin: 0 }}>
                  Physical products must be packaged securely and dispatched with valid tracking information within 24 to 48 hours of order confirmation. Freelance service milestones must adhere to the contracted timeline agreed upon with the purchasing customer.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                  4. Marketplace Commissions, Payouts & Settlement Cycles
                </h4>
                <p style={{ margin: 0 }}>
                  Vyapar Adnet deducts the standardized platform facilitation commission and applicable payment gateway processing charges from settled sales. Net earnings are deposited into the entity's verified bank account following the standard clearance window.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                  5. Customer Disputes, Returns & Warranty Obligations
                </h4>
                <p style={{ margin: 0 }}>
                  Entities are responsible for honoring customer returns within the 7-day inspection window for defective or non-conforming items. Persistent customer complaints regarding defective goods or delayed services may lead to account penalties.
                </p>
              </div>

              <div>
                <h4 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 0.35rem 0' }}>
                  6. Confidentiality, Security & Account Termination
                </h4>
                <p style={{ margin: 0 }}>
                  Customer contact information obtained through the platform must be maintained in strict confidentiality and cannot be used for off-platform solicitation. Vyapar Adnet reserves the right to suspend or terminate entity privileges for violations of these guidelines.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Acceptance Action */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#1e293b',
              fontWeight: '600',
              lineHeight: '1.4',
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked) setDeclineWarning(false);
              }}
              style={{
                marginTop: '0.15rem',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#636B2F',
              }}
            />
            <span>
              I confirm that I am authorized on behalf of <strong>{entityName}</strong> to accept the Vyapar Adnet Entity Partner Terms and Conditions, Operating Guidelines, and Privacy Policy.
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleDecline}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Decline Terms
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={!agreed}
              style={{
                padding: '0.65rem 1.75rem',
                background: agreed
                  ? 'linear-gradient(135deg, #636B2F 0%, #505726 100%)'
                  : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.9rem',
                cursor: agreed ? 'pointer' : 'not-allowed',
                boxShadow: agreed ? '0 4px 14px rgba(99, 107, 47, 0.35)' : 'none',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>Accept & Proceed to Dashboard →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntityTermsModal;
