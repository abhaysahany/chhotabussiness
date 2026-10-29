import React, { useState } from 'react';
import {
  Star,
  Quote,
  Sparkles,
  CheckCircle2,
  Building2,
  Users,
} from 'lucide-react';

function TestimonialsSection() {
  const [filter, setFilter] = useState('all'); // 'all' | 'provider' | 'customer'

  const testimonials = [
    {
      id: 1,
      type: 'provider',
      name: 'Vikramaditya Singhania',
      role: 'Founder & CEO, Apex Cloud Technologies',
      location: 'Bengaluru, Karnataka',
      avatar: '👨‍💼',
      rating: 5,
      text: 'Vyapar Adnet completely revolutionized our lead generation. Within 60 days of partnering, we closed 14 high-value enterprise SaaS clients. The direct payment model is completely transparent and hassle-free!',
      tag: 'Service Provider',
      metric: '₹28L+ New Revenue',
    },
    {
      id: 2,
      type: 'customer',
      name: 'Dr. Meera Nambiar',
      role: 'Director, MedTech Hospitalities',
      location: 'Kochi, Kerala',
      avatar: '👩‍⚕️',
      rating: 5,
      text: 'We needed a customized clinic management portal and hospital POS billing app. Through Vyapar Adnet, we connected directly with a verified dev team in Pune. We paid them directly on milestone delivery without any third-party escrow markup.',
      tag: 'End Customer',
      metric: 'Delivered in 3 Weeks',
    },
    {
      id: 3,
      type: 'provider',
      name: 'Rohan Sharma',
      role: 'Lead Architect, DevCraft Studio (Freelance)',
      location: 'Pune, Maharashtra',
      avatar: '👨‍💻',
      rating: 5,
      text: 'As a freelance developer, managing sales calls and marketing used to consume 60% of my time. Vyapar Adnet brings me qualified project inquiries daily. I build, get paid directly, and focus on code.',
      tag: 'Service Provider',
      metric: '8 Active Retainers',
    },
    {
      id: 4,
      type: 'customer',
      name: 'Rajesh Agrawal',
      role: 'Managing Partner, Agrawal Logistics & Warehousing',
      location: 'Indore, Madhya Pradesh',
      avatar: '🏢',
      rating: 5,
      text: 'Finding trusted digital marketing agencies was a nightmare until we tried Vyapar Adnet. We hired an SEO agency with verified GST and portfolio. Our organic leads grew by 180% in 4 months.',
      tag: 'End Customer',
      metric: '180% Lead Growth',
    },
  ];

  const filtered = testimonials.filter((t) => (filter === 'all' ? true : t.type === filter));

  return (
    <section id="testimonials" style={{ padding: '5.5rem 0', background: '#F8FAFC', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-primary">
            <Sparkles size={13} />
            <span>Real Partner Success Stories</span>
          </div>
          <h2 className="cb-section-title">
            Loved by Providers & Customers Alike
          </h2>
          <p className="cb-section-subtitle">
            Hear how businesses are scaling and clients are discovering trusted service partners across India.
          </p>

          {/* Toggle Filter Chips */}
          <div style={{ display: 'inline-flex', background: '#ffffff', border: '1px solid var(--cb-border)', borderRadius: '10px', padding: '4px', marginTop: '1.5rem', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'var(--cb-primary)' : 'transparent',
                color: filter === 'all' ? '#ffffff' : 'var(--cb-text-dark)',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              All Reviews
            </button>
            <button
              type="button"
              onClick={() => setFilter('provider')}
              style={{
                background: filter === 'provider' ? 'var(--cb-primary)' : 'transparent',
                color: filter === 'provider' ? '#ffffff' : 'var(--cb-text-dark)',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Service Providers
            </button>
            <button
              type="button"
              onClick={() => setFilter('customer')}
              style={{
                background: filter === 'customer' ? 'var(--cb-primary)' : 'transparent',
                color: filter === 'customer' ? '#ffffff' : 'var(--cb-text-dark)',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              End Customers
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="cb-testimonials-grid">
          {filtered.map((t) => (
            <div key={t.id} className="cb-testimonial-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#FF7A00" color="#FF7A00" />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: t.type === 'provider' ? '#e8f1f8' : '#dcfce7',
                      color: t.type === 'provider' ? '#0F4C81' : '#15803d',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {t.tag}
                  </span>
                </div>

                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 1.5rem 0' }}>
                  "{t.text}"
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--cb-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--cb-text-dark)', display: 'block' }}>
                      {t.name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {t.role} • {t.location}
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FF7A00', background: '#fff3e6', padding: '3px 8px', borderRadius: '4px' }}>
                  {t.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
