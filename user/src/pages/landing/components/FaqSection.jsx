import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How does Vyapar Adnet work?',
      a: 'Vyapar Adnet is a dedicated advertising network and B2B marketplace. Service providers (developers, IT agencies, tour operators, consultants) list their services with us. We run digital marketing and promotional campaigns to drive genuine customers to your listings. When customers contact you, you close the deal and receive direct payment.',
    },
    {
      q: 'Who receives the customer payment?',
      a: 'The customer pays 100% directly to YOU (the Service Provider) via your bank account, official tax invoice, or UPI gateway. Vyapar Adnet never holds your client funds in escrow.',
    },
    {
      q: 'When do Service Providers pay Vyapar Adnet?',
      a: 'Service providers ONLY pay when they receive actual business and direct customer payment through Vyapar Adnet. Registration is 100% free, catalog listing is free, and verified leads are delivered with zero upfront charges. If no business is generated, you pay ₹0.',
    },

    {
      q: 'Can I list multiple service categories and packages?',
      a: 'Yes! Once registered, you can publish multiple products, services, pricing packages, and portfolio deliverables in our catalog across categories like Web Dev, Cloud Solutions, Digital Marketing, Travel, and Consulting.',
    },
    {
      q: 'Is registration free?',
      a: 'Yes, basic partner registration and marketplace listing are 100% free. You can register your business profile, complete your PAN/Aadhaar KYC verification, and start receiving inquiries immediately.',
    },
    {
      q: 'Why is PAN & Aadhaar KYC required for partners?',
      a: 'Under Indian taxation regulations (Section 194H TDS compliance) and B2B marketplace integrity rules, all verified partner providers undergo identity and PAN validation to ensure buyers receive genuine, high-credibility services.',
    },
  ];

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faq" style={{ padding: '5.5rem 0', background: '#ffffff', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-primary">
            <Sparkles size={13} />
            <span>Got Questions?</span>
          </div>
          <h2 className="cb-section-title">
            Frequently Asked Questions
          </h2>
          <p className="cb-section-subtitle">
            Everything you need to know about our business promoter network, client flow, and payout model.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="cb-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="cb-faq-item" style={{ border: isOpen ? '1.5px solid #0F4C81' : '1px solid var(--cb-border)' }}>
                <div className="cb-faq-question" onClick={() => toggleFaq(idx)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <HelpCircle size={18} color={isOpen ? '#0F4C81' : '#64748B'} />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? <ChevronUp size={20} color="#0F4C81" /> : <ChevronDown size={20} color="#64748B" />}
                </div>

                {isOpen && (
                  <div className="cb-faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
