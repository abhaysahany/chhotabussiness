import React, { useState, useEffect } from 'react';
import {
  getAdminSupportTopics,
  createSupportTopic,
  deleteSupportTopic,
} from '../../api/adminSupportTopicService';
import {
  isRequired,
  extractBackendErrors,
  FieldError,
  getInputErrorStyle,
} from '../../utils/validation';

function AdminKnowledgeBasePage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('Payouts & Wallet');
  const [newAnswer, setNewAnswer] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [bannerError, setBannerError] = useState('');
  const [deleteConfirmFaq, setDeleteConfirmFaq] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await getAdminSupportTopics();
      if (res && res.status === 'success') {
        // Transform support topics to FAQ items
        const items = res.topics.map((t) => ({
          id: t.id,
          question: t.faq_question || t.title,
          category: t.category,
          answer: t.faq_answer || t.article_body || t.summary || '',
          views: t.views || 0,
        }));
        setFaqs(items);
      }
    } catch (err) {
      console.error('Error fetching FAQs from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async (e) => {
    e.preventDefault();
    const errs = {};

    const trimmedQ = newQuestion.trim();
    if (!trimmedQ) {
      errs.question = 'Article title or question is required.';
    } else if (trimmedQ.length < 3) {
      errs.question = 'Title must be at least 3 characters.';
    } else if (trimmedQ.length > 255) {
      errs.question = 'Title cannot exceed 255 characters.';
    }

    if (!newCategory || !newCategory.trim()) {
      errs.category = 'Please select a valid category.';
    }

    const trimmedA = newAnswer.trim();
    if (!trimmedA) {
      errs.answer = 'Detailed answer/solution is required.';
    } else if (trimmedA.length < 5) {
      errs.answer = 'Answer must be at least 5 characters.';
    } else if (trimmedA.length > 5000) {
      errs.answer = 'Answer cannot exceed 5000 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setBannerError('');
    setIsSubmitting(true);
    try {
      const payload = {
        title: trimmedQ,
        category: newCategory,
        summary: trimmedA.slice(0, 120),
        article_body: trimmedA,
        faq_question: trimmedQ,
        faq_answer: trimmedA,
        status: 'published',
      };
      const res = await createSupportTopic(payload);
      if (res && res.status === 'success') {
        setToastMsg('New FAQ article published to MySQL database!');
        setNewQuestion('');
        setNewAnswer('');
        setFieldErrors({});
        await fetchFaqs();
      }
    } catch (err) {
      const backendErr = extractBackendErrors(err);
      if (backendErr.errors && Object.keys(backendErr.errors).length > 0) {
        setFieldErrors(backendErr.errors);
      }
      setBannerError(backendErr.message || 'Failed to publish FAQ article to database.');
      setToastMsg('Failed to publish FAQ article to database.');
      console.error('Error publishing FAQ article:', err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmFaq) return;
    setIsDeleting(true);
    try {
      const res = await deleteSupportTopic(deleteConfirmFaq.id);
      if (res && res.status === 'success') {
        setToastMsg('FAQ article deleted from database!');
        setDeleteConfirmFaq(null);
        await fetchFaqs();
      }
    } catch (err) {
      setToastMsg('Failed to delete FAQ article.');
      console.error('Error deleting FAQ:', err);
    } finally {
      setIsDeleting(false);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="page-content-wrapper">
      <div className="page-subheader">
        <div>
          <h2 className="page-title">Knowledge Base & FAQ Editor</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Publish help guides, documentation articles, and FAQs stored directly in MySQL database.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">›</span>
          <span className="active">Knowledge Base</span>
        </div>
      </div>

      {toastMsg && (
        <div className="alert" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
          ✓ {toastMsg}
        </div>
      )}

      <div className="status-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.25rem', alignItems: 'stretch' }}>
        {/* Left Column: Publish New FAQ Form */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            + Publish New Article
          </h3>

          {bannerError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1rem', fontWeight: 600 }}>
              ⚠️ {bannerError}
            </div>
          )}

          <form onSubmit={handleAddFaq} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Article Title / Question <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. How to change bank account details?"
                value={newQuestion}
                onChange={(e) => {
                  setNewQuestion(e.target.value);
                  if (fieldErrors.question) setFieldErrors({ ...fieldErrors, question: null });
                }}
                style={getInputErrorStyle(fieldErrors.question)}
              />
              <FieldError error={fieldErrors.question} />
            </div>

            <div className="form-group">
              <label>Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                className="form-input"
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  if (fieldErrors.category) setFieldErrors({ ...fieldErrors, category: null });
                }}
              >
                <option value="Payouts & Wallet">Payouts & Wallet</option>
                <option value="KYC & Verification">KYC & Verification</option>
                <option value="Commission Plan">Commission Plan</option>
                <option value="Update Content">Update Content</option>
                <option value="Share Content">Share Content</option>
                <option value="Download Content">Download Content</option>
                <option value="Entity Content">Entity Content</option>
                <option value="Account & Security">Account & Security</option>
                <option value="General Help">General Help</option>
              </select>
              <FieldError error={fieldErrors.category} />
            </div>

            <div className="form-group">
              <label>Detailed Answer / Solution <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Write step-by-step instructions for users..."
                value={newAnswer}
                onChange={(e) => {
                  setNewAnswer(e.target.value);
                  if (fieldErrors.answer) setFieldErrors({ ...fieldErrors, answer: null });
                }}
                style={{ height: '110px', padding: '0.625rem', ...getInputErrorStyle(fieldErrors.answer) }}
              />
              <FieldError error={fieldErrors.answer} />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{ marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Saving to Database...' : 'Publish Article to Database'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Published FAQs */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Published Knowledge Base Articles ({faqs.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading articles from database...</div>
          ) : faqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No articles published yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {faqs.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{f.question}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#3569a7', backgroundColor: '#eef2ff', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        {f.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmFaq(f)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}
                        title="Delete article"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {f.answer}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    👁 {f.views} User Views
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmFaq && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>
              🗑️ Delete Article?
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to delete article <strong>"{deleteConfirmFaq.question}"</strong> from the database?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmFaq(null)}
                disabled={isDeleting}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: isDeleting ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminKnowledgeBasePage;
