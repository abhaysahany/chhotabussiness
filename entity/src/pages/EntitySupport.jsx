import React, { useState, useEffect, useCallback } from 'react';
import { useBranding } from '../utils/branding';
import api from '../api/axios';

function EntitySupport() {
  const { appName } = useBranding();
  const rawEntity = JSON.parse(localStorage.getItem('entity_user') || '{}');
  const entityName = rawEntity?.entity_details?.business_name || rawEntity?.name || '';
  const entityEmail = rawEntity?.email || '';

  const [formData, setFormData] = useState({
    subject: '',
    category: 'KYC',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const loadEntityTickets = useCallback(async () => {
    if (!entityEmail && !entityName) {
      setTickets([]);
      setLoadingTickets(false);
      return;
    }
    setLoadingTickets(true);
    try {
      const res = await api.get('/admin/support/tickets', {
        params: { search: entityEmail || entityName },
      });
      const list = res.data?.tickets || [];
      setTickets(
        list.filter(
          (t) =>
            (entityEmail && String(t.user_email || '').toLowerCase() === entityEmail.toLowerCase()) ||
            (entityName && String(t.user_name || '').toLowerCase() === entityName.toLowerCase())
        )
      );
    } catch (err) {
      console.error('Error loading entity support tickets from database:', err);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [entityEmail, entityName]);

  useEffect(() => {
    loadEntityTickets();
  }, [loadEntityTickets]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
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

    if (!entityEmail || !entityName) {
      setSubmitError('Entity account email/name is required to submit a ticket.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/support/tickets', {
        user_name: entityName,
        user_email: entityEmail,
        subject: trimmedSubject,
        category: formData.category,
        message: trimmedMessage,
      });
      setSubmitted(true);
      setFormData({ subject: '', category: 'KYC', message: '' });
      setErrors({});
      loadEntityTickets();
    } catch (err) {
      console.error('Failed to submit entity support ticket:', err);
      setSubmitError(err?.response?.data?.message || 'Unable to submit support ticket to database.');
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="ent-grid-2-lg">
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
                <label className="ent-field-label">
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. KYC document verification assistance"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  style={{ width: '100%', borderColor: errors.subject ? '#ef4444' : undefined }}
                />
                {errors.subject && (
                  <span className="ent-field-error">
                    ⚠️ {errors.subject}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="ent-field-label">
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  style={{ width: '100%', borderColor: errors.category ? '#ef4444' : undefined }}
                >
                  <option value="KYC">KYC & Document Verification</option>
                  <option value="Payouts">Payout & Settlement</option>
                  <option value="Sales">Listing & Sales Query</option>
                  <option value="Other">General Support</option>
                </select>
                {errors.category && (
                  <span className="ent-field-error">
                    ⚠️ {errors.category}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="ent-field-label">
                  Message / Inquiry Details <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows="4"
                  style={{ width: '100%', height: 'auto', padding: '0.75rem', borderColor: errors.message ? '#ef4444' : undefined }}
                  placeholder="Describe your inquiry with relevant order/invoice details..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                ></textarea>
                {errors.message && (
                  <span className="ent-field-error">
                    ⚠️ {errors.message}
                  </span>
                )}
              </div>

              {submitError && (
                <div className="alert" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem' }}>
                  {submitError}
                </div>
              )}

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
            {loadingTickets ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading support tickets from database...</p>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '1.25rem', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No support tickets found in database for your entity account.
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <strong>#{ticket.ticket_code || ticket.id} - {ticket.subject}</strong>
                    <span className="badge badge-warning">{ticket.status || 'Open'}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {ticket.messages?.[ticket.messages.length - 1]?.message || `Category: ${ticket.category || 'General'}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntitySupport;
