import React from 'react';
import {
  Building2,
  Users,
  MapPin,
  Layers,
  Sparkles,
} from 'lucide-react';

function StatsSection() {
  const stats = [
    {
      number: '1,000+',
      label: 'Verified Businesses',
      desc: 'Software firms, IT agencies & freelancers',
      icon: <Building2 size={24} color="#0F4C81" />,
    },
    {
      number: '5,000+',
      label: 'Happy Customers',
      desc: 'Startups & enterprises served nationwide',
      icon: <Users size={24} color="#16A34A" />,
    },
    {
      number: '100+',
      label: 'Cities Across India',
      desc: 'Active promotional hub presence',
      icon: <MapPin size={24} color="#FF7A00" />,
    },
    {
      number: '50+',
      label: 'Specialized Categories',
      desc: 'Covering IT, travel, design & legal',
      icon: <Layers size={24} color="#0284c7" />,
    },
  ];

  return (
    <section style={{ padding: '5rem 0', background: 'linear-gradient(135deg, #0F4C81 0%, #173757 100%)', color: '#ffffff' }}>
      <div className="cb-container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem auto' }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fed7aa', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Proven Track Record
          </span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ffffff', margin: '0.75rem 0 0.5rem 0' }}>
            Driving Tangible Results Every Single Day
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0 }}>
            Our promoter network connects growing service businesses with active buyers across India.
          </p>
        </div>

        {/* 4 Counter Cards */}
        <div className="cb-stats-grid">
          {stats.map((st, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                transition: 'transform 0.25s ease',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {st.icon}
              </div>

              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>
                {st.number}
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FF7A00', marginTop: '0.4rem' }}>
                {st.label}
              </div>

              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '0.35rem 0 0 0' }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
