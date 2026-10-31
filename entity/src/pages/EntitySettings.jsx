import React from 'react';
import { useBranding } from '../utils/branding';

function EntitySettings() {
  const { appName } = useBranding();
  const user = JSON.parse(localStorage.getItem('entity_user') || '{}');

  return (
    <div className="page-container">
      <div className="page-subheader">
        <div>
          <h1 className="page-title">Entity Settings & Profile</h1>
          <p className="page-description">Manage entity details, notifications, and security preferences.</p>
        </div>
        <div className="page-breadcrumb">
          <span>Entity Panel</span>
          <span className="separator">/</span>
          <span className="active">Settings</span>
        </div>
      </div>

      <div className="content-card" style={{ maxWidth: '600px' }}>
        <h2 className="content-card-title" style={{ marginBottom: '1.25rem' }}>Entity Information</h2>
        <div className="auth-form">
          <div className="form-group">
            <label>Entity Owner / Sponsor Name</label>
            <input className="form-input" defaultValue={user.name || `${appName} Admin Sponsor`} />
          </div>
          <div className="form-group">
            <label>Registered Email</label>
            <input className="form-input" defaultValue={user.email || 'partner@addnet.com'} disabled style={{ background: '#f1f5f9' }} />
          </div>
          <div className="form-group">
            <label>Member ID / Entity Code</label>
            <input className="form-input" defaultValue={user.user_code || 'CB100001'} disabled style={{ background: '#f1f5f9' }} />
          </div>

          <button className="btn-primary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default EntitySettings;
