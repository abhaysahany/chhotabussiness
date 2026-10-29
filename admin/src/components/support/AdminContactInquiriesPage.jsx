import React, { useState } from 'react';

function AdminContactInquiriesPage() {
  const [callbacks, setCallbacks] = useState([
    { id: 1, name: 'Rajesh Sharma', phone: '+91 98765 43210', topic: 'Franchise & Binary Commission Plan', time: '10 mins ago', status: 'Pending' },
    { id: 2, name: 'Priya Patel', phone: '+91 91234 56789', topic: 'KYC Document Verification Delay', time: '45 mins ago', status: 'Contacted' },
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const handleMarkContacted = (id) => {
    setCallbacks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Contacted' } : c))
    );
    setToastMsg(`Callback status updated to Contacted`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="page-content-wrapper">
      <div className="page-subheader">
        <div>
          <h2 className="page-title">Contact Channels & Callback Desk</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage phone callback requests, official support channels, and emergency hotline inquiries.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">›</span>
          <span className="active">Contact Channels</span>
        </div>
      </div>

      {toastMsg && (
        <div className="alert" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Official Channel Settings Grid */}
      <div className="status-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📞 TOLL-FREE HELPLINE</h4>
          <div className="metric-value" style={{ fontSize: '1.15rem' }}>1800-123-4567</div>
          <p className="metric-desc">Mon - Sat: 9:00 AM - 8:00 PM IST</p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>✉️ OFFICIAL SUPPORT EMAIL</h4>
          <div className="metric-value" style={{ fontSize: '1.15rem' }}>support@vyaparadnet.com</div>
          <p className="metric-desc">Auto-ticket conversion active</p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>💬 WHATSAPP DESK</h4>
          <div className="metric-value" style={{ fontSize: '1.15rem' }}>+91 98765 00000</div>
          <p className="metric-desc">Instant bot & agent assistance</p>
        </div>
      </div>

      {/* Callback Queue Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          User Phone Callback Request Queue ({callbacks.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {callbacks.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{c.name}</strong>
                <span style={{ fontSize: '0.8125rem', color: '#3569a7', marginLeft: '0.75rem', fontWeight: 600 }}>
                  📞 {c.phone}
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Topic: <strong>{c.topic}</strong> • Requested {c.time}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    backgroundColor: c.status === 'Contacted' ? '#dcfce7' : '#fef3c7',
                    color: c.status === 'Contacted' ? '#15803d' : '#b45309',
                  }}
                >
                  {c.status}
                </span>

                {c.status === 'Pending' && (
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleMarkContacted(c.id)}
                  >
                    ✓ Mark Called
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminContactInquiriesPage;
