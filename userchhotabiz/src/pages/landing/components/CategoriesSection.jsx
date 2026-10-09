import React from 'react';
import {
  Code,
  Server,
  Megaphone,
  Plane,
  TrendingUp,
  Rocket,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

function CategoriesSection({ onCategorySelect }) {
  const categories = [
    {
      id: 'software-development',
      title: 'Software Development',
      description: 'Custom web apps, mobile applications, enterprise SaaS portals, and dedicated engineering teams.',
      icon: <Code size={26} color="#0F4C81" />,
      bg: '#e8f1f8',
      popularTag: 'High Demand',
      partnersCount: '340+ Verified Firms',
    },
    {
      id: 'it-solutions',
      title: 'IT Solutions & Cloud',
      description: 'Cloud migration, DevOps infrastructure, cybersecurity auditing, database administration, and hardware POS.',
      icon: <Server size={26} color="#059669" />,
      bg: '#ecfdf5',
      popularTag: 'Enterprise',
      partnersCount: '190+ Providers',
    },
    {
      id: 'digital-marketing',
      title: 'Digital Marketing',
      description: 'Search engine optimization (SEO), social media campaigns, Google Ads PPC, content branding, and lead funnels.',
      icon: <Megaphone size={26} color="#FF7A00" />,
      bg: '#fff3e6',
      popularTag: 'Fast Growth',
      partnersCount: '280+ Agencies',
    },
    {
      id: 'tour-travel',
      title: 'Tour & Travel',
      description: 'Corporate travel management, international holiday packages, hotel bookings, and commercial fleet rentals.',
      icon: <Plane size={26} color="#0284c7" />,
      bg: '#f0f9ff',
      popularTag: 'Corporate',
      partnersCount: '150+ Operators',
    },
    {
      id: 'business-consulting',
      title: 'Business Consulting',
      description: 'GST compliance, corporate taxation, legal documentation, company registration, and financial auditing.',
      icon: <TrendingUp size={26} color="#7c3aed" />,
      bg: '#f5f3ff',
      popularTag: 'Trusted',
      partnersCount: '120+ Experts',
    },
    {
      id: 'startup-services',
      title: 'Startup Services',
      description: 'Pitch deck creation, MVP prototyping, investor readiness, go-to-market advisory, and early traction hacking.',
      icon: <Rocket size={26} color="#db2777" />,
      bg: '#fdf2f8',
      popularTag: 'New & Popular',
      partnersCount: '110+ Hubs',
    },
  ];

  return (
    <section id="categories" style={{ padding: '5.5rem 0', background: '#ffffff', borderTop: '1px solid var(--cb-border)', borderBottom: '1px solid var(--cb-border)' }}>
      <div className="cb-container">
        {/* Section Title Header */}
        <div className="cb-section-header">
          <div className="cb-badge cb-badge-primary">
            <Sparkles size={13} />
            <span>Discover High-Performing Sectors</span>
          </div>
          <h2 className="cb-section-title">
            Trusted Service Categories
          </h2>
          <p className="cb-section-subtitle">
            Explore verified service providers ready to deliver exceptional results for your business needs.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="cb-categories-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="cb-category-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div className="cb-category-icon-box" style={{ background: cat.bg }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#f8fafc', color: '#475569', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {cat.popularTag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--cb-text-dark)' }}>
                  {cat.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--cb-text-muted)', lineHeight: 1.6, margin: '0 0 1.25rem 0' }}>
                  {cat.description}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, marginBottom: '1rem' }}>
                  <CheckCircle size={14} />
                  <span>{cat.partnersCount}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onCategorySelect && onCategorySelect(cat.id)}
                  className="cb-btn-outline"
                  style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                >
                  <span>Explore Providers</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoriesSection;
