import React, { useState } from 'react';
import { useBranding } from '../utils/branding';

function EntitySettings() {
  const { appName } = useBranding();
  const rawUser = JSON.parse(localStorage.getItem('entity_user') || '{}');
  const [ownerName, setOwnerName] = useState(rawUser.name || `${appName} Partner`);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmed = (ownerName || '').trim();
    if (!trimmed) {
      setError('Entity Owner / Sponsor Name cannot be empty.');
      return;
    }
    if (trimmed.length < 3) {
      setError('Name must be at least 3 characters long.');
    } else if (trimmed.length > 80) {
      setError('Name cannot exceed 80 characters.');
    } else if (!/^[a-zA-Z0-9\s.,'-]+$/.test(trimmed)) {
      setError('Name contains invalid characters.');
    }

    setSaving(true);
    setTimeout(() => {
      rawUser.name = trimmed;
      if (rawUser.entity_details) {
        rawUser.entity_details.business_name = trimmed;
      }
      localStorage.setItem('entity_user', JSON.stringify(rawUser));
      setSaving(false);
      setSuccessMsg('✓ Entity settings updated and saved successfully!');
    }, 400);
  };

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

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="auth-form" noValidate>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="ent-field-label">
              Entity Owner / Sponsor Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="form-input"
              value={ownerName}
              onChange={(e) => { setOwnerName(e.target.value); setError(''); }}
              style={{ width: '100%', borderColor: error ? '#ef4444' : undefined }}
            />
            {error && (
              <span className="ent-field-error">
                ⚠️ {error}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="ent-field-label">
              Registered Email (Primary Authentication)
            </label>
            <input className="form-input" value={rawUser.email || ''} disabled style={{ width: '100%', background: 'var(--bg-hover)', cursor: 'not-allowed', opacity: 0.85 }} />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="ent-field-label">
              Member ID / Entity Code
            </label>
            <input className="form-input" value={rawUser.user_code || ''} disabled style={{ width: '100%', background: 'var(--bg-hover)', cursor: 'not-allowed', opacity: 0.85 }} />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EntitySettings;
