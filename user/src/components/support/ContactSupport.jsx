import React, { useState } from 'react';

function ContactSupport({ user }) {
  const [callbackForm, setCallbackForm] = useState({
    name: user?.name || 'Tom Phillip',
    phone: '+91 98765 43210',
    timeSlot: 'Morning (10 AM - 1 PM)',
    topic: 'Payout & Financial Query',
  });

  const [requesting, setRequesting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeOffice, setActiveOffice] = useState('mumbai');

  const handleRequestCallback = (e) => {
    e.preventDefault();
    if (!callbackForm.phone.trim()) {
      alert('Please enter your phone number.');
      return;
    }
    setRequesting(true);
    setTimeout(() => {
      setRequesting(false);
      setToastMessage('Callback requested! Our executive support manager will call you during ' + callbackForm.timeSlot + '.');
      setTimeout(() => setToastMessage(''), 4500);
    }, 600);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`${label} copied to clipboard!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const offices = [
    {
      id: 'mumbai',
      city: 'Mumbai (Corporate HQ)',
      address: 'Maker Maxity, Level 12, Bandra Kurla Complex (BKC), Mumbai 400051',
      phone: '+91 022 6800 9000',
      email: 'mumbai.hq@addnet.com',
      hours: 'Mon - Sat: 9:00 AM - 8:00 PM IST',
      mapBadge: 'Google Maps Verified HQ',
    },
    {
      id: 'bengaluru',
      city: 'Bengaluru (Tech Innovation Hub)',
      address: 'Embassy Tech Village, Outer Ring Road, Bellandur, Bengaluru 560103',
      phone: '+91 080 4500 1200',
      email: 'blr.office@addnet.com',
      hours: 'Mon - Sat: 9:30 AM - 7:30 PM IST',
      mapBadge: 'R&D Development Center',
    },
    {
      id: 'delhi',
      city: 'Delhi NCR (North Regional Office)',
      address: 'DLF Cyber City, Building 10, Tower B, Gurugram 122002',
      phone: '+91 0124 4900 880',
      email: 'delhi.office@addnet.com',
      hours: 'Mon - Sat: 9:00 AM - 7:00 PM IST',
      mapBadge: 'Regional Service Desk',
    },
  ];

  const currentOffice = offices.find((o) => o.id === activeOffice) || offices[0];

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-toast-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Corporate Contact & Headquarters</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Emergency helplines, executive callback requests, regional offices, and escalation matrix.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">»</span>
          <span className="current">Contact Us</span>
        </div>
      </div>

      {/* Hero Contact Channel Bar */}
      <div className="profile-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
        {/* Helpline */}
        <div className="metric-box" style={{ cursor: 'pointer' }} onClick={() => copyToClipboard('+91 1800-244-6822', 'Toll-Free Helpline')}>
          <div className="metric-icon purple">📞</div>
          <div>
            <span className="metric-title">24x7 Toll-Free Support</span>
            <h3 className="metric-value" style={{ fontSize: '1rem', color: '#4f46e5' }}>+91 1800-ADDNET</h3>
            <span className="chip-label" style={{ fontSize: '0.725rem' }}>Ext 1 for Payouts • Ext 2 for KYC</span>
          </div>
        </div>

        {/* Email */}
        <div className="metric-box" style={{ cursor: 'pointer' }} onClick={() => copyToClipboard('support@addnet.com', 'Executive Email')}>
          <div className="metric-icon blue">✉️</div>
          <div>
            <span className="metric-title">Executive Support Email</span>
            <h3 className="metric-value" style={{ fontSize: '0.925rem', color: '#0284c7' }}>support@addnet.com</h3>
            <span className="chip-label" style={{ fontSize: '0.725rem' }}>Direct response &lt; 2 hours</span>
          </div>
        </div>

        {/* HQ Address */}
        <div className="metric-box">
          <div className="metric-icon green">🏢</div>
          <div>
            <span className="metric-title">Corporate Headquarters</span>
            <h3 className="metric-value" style={{ fontSize: '0.925rem', color: '#059669' }}>BKC, Mumbai, India</h3>
            <span className="chip-label" style={{ fontSize: '0.725rem' }}>Maker Maxity, Level 12</span>
          </div>
        </div>

        {/* Tele-Support Status */}
        <div className="metric-box">
          <div className="metric-icon emerald">⚡</div>
          <div>
            <span className="metric-title">Support Hours</span>
            <h3 className="metric-value" style={{ fontSize: '0.95rem', color: '#10b981' }}>Mon - Sat: 9 AM - 8 PM</h3>
            <span className="chip-label" style={{ fontSize: '0.725rem' }}>24/7 Digital Assistant</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Request Executive Callback + Interactive Office Directory */}
      <div className="profile-cards-grid" style={{ gridTemplateColumns: '1fr 1.3fr', alignItems: 'stretch' }}>
        {/* Left Column: Request Instant Executive Callback */}
        <div className="pro-card">
          <div className="pro-card-header flex-between">
            <div className="card-header-title-flex">
              <div className="header-badge-icon purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div>
                <h2 className="card-box-title">Request Executive Phone Callback</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Our senior support manager will call you back at your preferred time.
                </p>
              </div>
            </div>
          </div>

          <div className="pro-card-body">
            <form onSubmit={handleRequestCallback}>
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={callbackForm.name}
                  onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label">Phone / WhatsApp Number <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={callbackForm.phone}
                  onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label">Preferred Time Slot <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={callbackForm.timeSlot}
                  onChange={(e) => setCallbackForm({ ...callbackForm, timeSlot: e.target.value })}
                >
                  <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM IST)</option>
                  <option value="Afternoon (2 PM - 5 PM)">Afternoon (2 PM - 5 PM IST)</option>
                  <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM IST)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Callback Topic <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={callbackForm.topic}
                  onChange={(e) => setCallbackForm({ ...callbackForm, topic: e.target.value })}
                >
                  <option value="Payout & Financial Query">Payout & Financial Query</option>
                  <option value="KYC Verification & Compliance">KYC Verification & Compliance</option>
                  <option value="Network Matching & Commissions">Network Matching & Commissions</option>

                  <option value="Franchise & Partnership Opportunity">Franchise & Partnership Opportunity</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={requesting}
                className="btn-profile-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {requesting ? (
                  <>
                    <span className="spinner-sm"></span>
                    <span>Scheduling Phone Call...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <span>Request Executive Phone Call</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Office Directory & Grievance Redressal Matrix */}
        <div className="pro-card flex-column-between">
          <div>
            <div className="pro-card-header flex-between">
              <div className="card-header-title-flex">
                <div className="header-badge-icon blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h2 className="card-box-title">Regional Office Directory</h2>
              </div>
              <span className="status-badge-success">{currentOffice.mapBadge}</span>
            </div>

            <div className="pro-card-body">
              {/* Location Selector Buttons */}
              <div className="doc-type-pills-grid" style={{ marginBottom: '1.25rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {offices.map((off) => (
                  <button
                    key={off.id}
                    type="button"
                    className={`doc-pill-btn ${activeOffice === off.id ? 'active' : ''}`}
                    onClick={() => setActiveOffice(off.id)}
                  >
                    {off.id === 'mumbai' ? 'Mumbai HQ' : off.id === 'bengaluru' ? 'Bengaluru' : 'Delhi NCR'}
                  </button>
                ))}
              </div>

              {/* Active Office Info */}
              <div className="info-details-list">
                <div className="info-item">
                  <span className="info-label">Office Center</span>
                  <span className="info-value text-semibold">{currentOffice.city}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">{currentOffice.address}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Direct Phone</span>
                  <span className="info-value highlight-blue">{currentOffice.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Official Email</span>
                  <span className="info-value highlight-purple">{currentOffice.email}</span>
                </div>
              </div>

              {/* Grievance Escalation Matrix */}
              <div className="security-summary-list" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  Grievance Escalation Matrix
                </h4>
                <div className="security-row">
                  <div className="security-row-info">
                    <strong>Level 1: Live Chat & AI Concierge</strong>
                    <p>Instant answers & ticket logging</p>
                  </div>
                  <span className="status-badge-success">Immediate</span>
                </div>
                <div className="security-row">
                  <div className="security-row-info">
                    <strong>Level 2: Nodal Officer Escalation</strong>
                    <p>Email: nodal.officer@addnet.com</p>
                  </div>
                  <span className="status-badge-success">&lt; 24 Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactSupport;
