import React, { useState } from 'react';
import { useBranding } from '../utils/branding';

function EntitySupport() {
  const { appName } = useBranding();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'KYC',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const trimmedSubject = (formData.subject || '').trim();
    if (!trimmedSubject) {
      newErrors.subject = 'Subject is required.';
    } else if (trimmedSubject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters.';
    } else if (trimmedSubject.length > 150) {
      newErrors.subject = 'Subject cannot exceed 150 characters.';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a support category.';
    }

    const trimmedMessage = (formData.message || '').trim();
    if (!trimmedMessage) {
      newErrors.message = 'Inquiry message is required.';
    } else if (trimmedMessage.length < 10) {
      newErrors.message = 'Message must be at least 10 characters long.';
    } else if (trimmedMessage.length > 3000) {
      newErrors.message = 'Message cannot exceed 3000 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ subject: '', category: 'KYC', message: '' });
      setErrors({});
    }, 600);
  };

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
            <div>
              <div className="alert" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                ✓ Your ticket has been submitted to {appName} admin compliance team! Our representative will respond within 24 hours.
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSubmitted(false)}
                style={{ fontSize: '0.85rem' }}
              >
                + Open Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. KYC document verification assistance"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  style={{ width: '100%', border: errors.subject ? '2px solid #ef4444' : '1px solid #cbd5e1' }}
                />
                {errors.subject && (
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {errors.subject}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  style={{ width: '100%', border: errors.category ? '2px solid #ef4444' : '1px solid #cbd5e1' }}
                >
                  <option value="KYC">KYC & Document Verification</option>
                  <option value="Payouts">Payout & Settlement</option>
                  <option value="Sales">Listing & Sales Query</option>
                  <option value="Other">General Support</option>
                </select>
                {errors.category && (
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {errors.category}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Message / Inquiry Details <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ width: '100%', height: 'auto', padding: '0.75rem', border: errors.message ? '2px solid #ef4444' : '1px solid #cbd5e1' }}
                  placeholder="Describe your inquiry with relevant order/invoice details..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                ></textarea>
                {errors.message && (
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                    ⚠️ {errors.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                {isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
              </button>
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
