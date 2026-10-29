import React from 'react';
import { useNavigate } from 'react-router-dom';

function EntityHelp() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      {/* Page Subheader */}
      <div className="page-subheader">
        <div>
          <h1 className="page-title">Help & Documentation</h1>
          <p className="page-description">Get guidance, tutorials, and assistance for managing your business entity.</p>
        </div>
        <div className="page-breadcrumb">
          <span>Entity Panel</span>
          <span className="separator">/</span>
          <span className="active">Help & Guide</span>
        </div>
      </div>

      {/* Starter Empty State Canvas Card */}
      <div className="starter-canvas-card">
        <div className="starter-empty-state">
          <div className="empty-icon-wrapper">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2 className="empty-title">How can we help your business today?</h2>
          <p className="empty-description">
            Welcome to the Entity Help Desk. Learn how to verify documents, publish new services, manage incoming sales orders, and withdraw commission payouts.
          </p>

          <div className="empty-actions">
            <button
              className="btn-primary"
              onClick={() => navigate('/entity/support')}
            >
              Contact Support
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/entity/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Help Topics Grid */}
      <div className="help-topics-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="help-topic-card">
          <div className="help-topic-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3>KYC & Entity Verification</h3>
          <p>Learn how to submit PAN, GSTIN, Aadhaar, and business registration certificates for instant verification.</p>
        </div>

        <div className="help-topic-card">
          <div className="help-topic-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3>Sales & Orders Management</h3>
          <p>Track inquiries from customers across the Vyapar Adnet marketplace and process customer bookings.</p>
        </div>

        <div className="help-topic-card">
          <div className="help-topic-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h3>Payouts & Bank Settlements</h3>
          <p>Direct bank transfers, payment gateway processing schedules, and automatic GST invoice generation.</p>
        </div>
      </div>
    </div>
  );
}

export default EntityHelp;
