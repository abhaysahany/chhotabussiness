import React, { useState, useEffect } from 'react';
import { getUserSupportTopics } from '../../api/userSupportTopicService';

function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'All', title: 'All Topics', icon: '📚' },
    { id: 'Payouts & Wallet', title: 'Payouts & Banking', icon: '💰' },
    { id: 'KYC & Verification', title: 'KYC Verification', icon: '🪪' },
    { id: 'Update Content', title: 'Update Content', icon: '🔄' },
    { id: 'Share Content', title: 'Share Content', icon: '📲' },
    { id: 'Download Content', title: 'Download Content', icon: '📥' },
    { id: 'Commission Plan', title: 'Commissions', icon: '📊' },
  ];

  const defaultFaqs = [
    {
      id: 'd1',
      category: 'Payouts & Wallet',
      question: 'When are commission withdrawals processed?',
      answer: 'Withdrawal requests are processed in automated IMPS/NEFT batches every 2 hours on working business days. Transfers usually credit to your verified bank account within 30 minutes.',
    },
    {
      id: 'd2',
      category: 'KYC & Verification',
      question: 'What documents are required for KYC approval?',
      answer: 'You need to upload clear photos of your PAN Card (for 5% TDS tax deduction compliance) and Aadhaar Card (front & back). Approval takes less than 24 hours.',
    },
    {
      id: 'd3',
      category: 'Commission Plan',
      question: 'How is Team Level Matching Bonus calculated?',
      answer: 'Team matching bonus is calculated on the balanced business volume (BV) across your active network teams.',
    },
    {
      id: 'd4',
      category: 'Commission Plan',
      question: 'Where can I see my direct referral bonus statements?',
      answer: 'Go to Business Reports » Network Earnings & Commissions in your sidebar layout to view itemized commission ledgers and tax deductions.',
    },
  ];

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const res = await getUserSupportTopics();
        if (res && res.status === 'success' && res.topics && res.topics.length > 0) {
          const dbFaqs = res.topics.map((t) => ({
            id: t.id,
            category: t.category,
            question: t.faq_question || t.title,
            answer: t.faq_answer || t.article_body || t.summary || '',
          }));
          setFaqs([...dbFaqs, ...defaultFaqs]);
        } else {
          setFaqs(defaultFaqs);
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setFaqs(defaultFaqs);
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
  }, []);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Knowledge Base & FAQ</h1>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Find quick answers, guides, and documentation for your business portal.
          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Support</span>
          <span className="separator">»</span>
          <span className="current">Knowledge Base</span>
        </div>
      </div>

      {/* Search Hero Card */}
      <div className="pro-card" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#fff', padding: '2.5rem 2rem', textAlign: 'center', borderRadius: '1.25rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>How can we help you today?</h2>
        <p style={{ color: '#c7d2fe', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Search across official database articles, payout guides, and tutorials.</p>
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.85rem 1.25rem', borderRadius: '2rem', fontSize: '0.95rem', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            placeholder="Search articles e.g. 'Payout status', 'KYC approval'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="doc-type-pills-grid" style={{ marginTop: '1.5rem' }}>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`doc-pill-btn ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            <span>{c.icon}</span>
            <span>{c.title}</span>
          </button>
        ))}
      </div>

      {/* Expandable FAQ Accordion Card */}
      <div className="pro-card" style={{ marginTop: '1.5rem' }}>
        <div className="pro-card-header">
          <h2 className="card-box-title">Frequently Asked Questions ({filteredFaqs.length})</h2>
        </div>
        <div className="pro-card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading database articles...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden' }}
                >
                  <div
                    style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  >
                    <span>❓ {faq.question}</span>
                    <span style={{ fontSize: '1.1rem' }}>{expandedFaq === faq.id ? '−' : '+'}</span>
                  </div>
                  {expandedFaq === faq.id && (
                    <div style={{ padding: '0 1.25rem 1rem 1.25rem', color: '#475467', fontSize: '0.875rem', lineHeight: '1.6', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBase;
