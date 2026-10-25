import React, { useState, useEffect } from 'react';
import {
  getAdminSupportTopics,
  createSupportTopic,
  deleteSupportTopic,
} from '../../api/adminSupportTopicService';

function AdminKnowledgeBasePage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('Payouts & Wallet');
  const [newAnswer, setNewAnswer] = useState('');
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
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        title: newQuestion,
        category: newCategory,
        summary: newAnswer.slice(0, 120),
        article_body: newAnswer,
        faq_question: newQuestion,
        faq_answer: newAnswer,
        status: 'published',
      };
      const res = await createSupportTopic(payload);
      if (res && res.status === 'success') {
        setToastMsg('New FAQ article published to MySQL database!');
        setNewQuestion('');
        setNewAnswer('');
        await fetchFaqs();
      }
    } catch (err) {
      console.error('Error publishing FAQ article:', err);
      alert('Failed to publish FAQ article to database.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleDeleteFaq = async (id, question) => {
    if (window.confirm(`Delete FAQ article [${question}] from database?`)) {
      try {
        const res = await deleteSupportTopic(id);
        if (res && res.status === 'success') {
          setToastMsg('FAQ article deleted from database!');
          await fetchFaqs();
        }
      } catch (err) {
        console.error('Error deleting FAQ:', err);
      } finally {
        setTimeout(() => setToastMsg(''), 3000);
      }
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

          <form onSubmit={handleAddFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Article Title / Question *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. How to change bank account details?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
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
            </div>

            <div className="form-group">
              <label>Detailed Answer / Solution *</label>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Write step-by-step instructions for users..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                style={{ height: '110px', padding: '0.625rem' }}
                required
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}>
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
                      <button onClick={() => handleDeleteFaq(f.id, f.question)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem' }}>🗑️</button>
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
    </div>
  );
}

export default AdminKnowledgeBasePage;
