import React, { useState } from 'react';
import { useBranding } from '../utils/branding';

function EntitySupport() {
  const { appName } = useBranding();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="page-container">
      <div className="page-subheader">
        <div>
          <h1 className="page-title">Entity Support Desk</h1>
          <p className="page-description">Get dedicated priority support for verified entities and business owners.</p>
        </div>
        <div className="page-breadcrumb">
          <span>Entity Panel</span>
          <span className="separator">/</span>
          <span className="active">Support</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="content-card">
          <h2 className="content-card-title" style={{ marginBottom: '1rem' }}>Create Support Request</h2>
          {submitted ? (
            <div className="alert" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
              Your ticket has been submitted to {appName} admin compliance team!
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="auth-form">
              <div className="form-group">
                <label>Subject</label>
                <input className="form-input" placeholder="e.g. KYC document verification assistance" required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" required>
                  <option value="KYC">KYC & Document Verification</option>
                  <option value="Payouts">Payout & Settlement</option>
                  <option value="Sales">Listing & Sales Query</option>
                  <option value="Other">General Support</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea className="form-input" rows="4" style={{ height: 'auto', padding: '0.75rem' }} placeholder="Describe your inquiry..." required></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Submit Ticket</button>
            </form>
          )}
        </div>

        <div className="content-card">
          <h2 className="content-card-title" style={{ marginBottom: '1rem' }}>Active Support Tickets</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong>#TCK-1002 - KYC Verification Status Query</strong>
                <span className="badge badge-warning">In Progress</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Compliance review is currently ongoing by Senior Admin team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntitySupport;
