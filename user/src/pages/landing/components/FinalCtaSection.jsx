import React from 'react';
import {
  ArrowRight,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function FinalCtaSection({ onRegisterClick, onContactClick }) {
  return (
    <section style={{ padding: '5.5rem 0', background: '#F8FAFC' }}>
      <div className="cb-container">
        <div className="cb-cta-section">
          {/* Subtle Background Radial */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255, 122, 0, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fed7aa', padding: '4px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Fast-Track Your Client Inflow
          </span>

          <h2>
            Ready To Grow Your Business With Quality Customers?
          </h2>

          <p>
            Join over 1,000+ verified software developers, IT companies, digital agencies, and consultants scaling their turnover with Vyapar Adnet.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onRegisterClick}
              className="cb-btn-secondary"
              style={{ padding: '0.95rem 2.25rem', fontSize: '1.05rem', boxShadow: '0 8px 25px rgba(255, 122, 0, 0.4)' }}
            >
              <span>Register as a Partner Now</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={onContactClick}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.3)',
                padding: '0.95rem 1.8rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <PhoneCall size={18} />
              <span>Contact Promoter Desk</span>
            </button>
          </div>

          {/* Guarantee Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '2.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#16A34A" /> Free Partner Registration
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#16A34A" /> 100% Direct Customer Billing
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="#16A34A" /> PAN & Aadhaar KYC Verified Network
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCtaSection;
