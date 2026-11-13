import React, { useState, useEffect } from 'react';
import {
  getUserSupportTopics,
  trackSupportTopicView,
  voteSupportTopicHelpful,
} from '../api/userSupportTopicService';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Topics', icon: '📚' },
  { id: 'Download Content', label: 'Download Content', icon: '📥' },
  { id: 'Customise Content', label: 'Customise Content', icon: '🎨' },
  { id: 'Share Content', label: 'Share Content', icon: '📲' },
  { id: 'Entity Content', label: 'Entity Content', icon: '🏢' },
  { id: 'General Help', label: 'General Help', icon: '💡' },
  { id: 'Troubleshooting', label: 'Troubleshooting', icon: '🛠️' },
];

function UserContentSupportPage({ user, onNavigate }) {
  const [supportTopics, setSupportTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTopic, setActiveTopic] = useState(null);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [toastMsg, setToastMsg] = useState('');

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await getUserSupportTopics({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        search: searchTerm || undefined,
      });
      if (res && res.status === 'success') {
        setSupportTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching support topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [activeCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTopics();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenTopic = async (topic) => {
    setActiveTopic(topic);
    // Track view count in MySQL database
    try {
      await trackSupportTopicView(topic.id);
      setSupportTopics((prev) =>
        prev.map((t) => (t.id === topic.id ? { ...t, views: (Number(t.views) || 0) + 1 } : t))
      );
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const handleVoteHelpful = async (topicId) => {
    if (helpfulVotes[topicId]) return;
    setHelpfulVotes((prev) => ({ ...prev, [topicId]: true }));
    try {
      await voteSupportTopicHelpful(topicId);
      setSupportTopics((prev) =>
        prev.map((t) =>
          t.id === topicId
            ? { ...t, helpful_count: (Number(t.helpful_count) || Number(t.helpfulCount) || 0) + 1 }
            : t
        )
      );
      setToastMsg('👍 Thank you for your feedback! Recorded in database.');
    } catch (err) {
      console.error('Error voting helpful:', err);
      setToastMsg('👍 Thank you for your feedback!');
    } finally {
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="page-container">
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#059669', color: '#fff', padding: '0.85rem 1.35rem', borderRadius: '10px', fontWeight: '700', boxShadow: '0 10px 25px -5px rgba(5,150,105,0.4)', zIndex: 2000, fontSize: '0.875rem' }}>
          {toastMsg}
        </div>
      )}

      {/* Hero Banner Header */}
      <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #0f172a 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div>
          <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', display: 'inline-block', marginBottom: '0.75rem' }}>
            🎧 Official Content Support & Video Tutorials • Live Helpdesk
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>Content Support & Help Center</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem', maxWidth: '650px', margin: 0, lineHeight: '1.5' }}>
            Watch official YouTube video guides, read step-by-step help articles on downloading, customising, and sharing marketing content.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'none',
              fontSize: '0.875rem',
              fontWeight: '800',
              cursor: 'pointer',
              color: activeCategory === tab.id ? '#4338ca' : '#64748b',
              borderBottom: activeCategory === tab.id ? '3px solid #4338ca' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'all' && ` (${supportTopics.length})`}
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search help topics, tutorials or articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: '420px', padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>
          Showing {supportTopics.length} Help Topics in Database
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4338ca' }}>⏳ Loading Tutorials & Help Articles...</div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && supportTopics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#fff', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📹</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>No Support Topics Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Try searching with a different keyword or category.</p>
        </div>
      )}

      {/* Support Topic Cards Grid */}
      {!loading && supportTopics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {supportTopics.map((topic) => (
            <div key={topic.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              {/* Video Thumbnail Header */}
              <div style={{ height: '175px', backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleOpenTopic(topic)}>
                <img src={topic.thumbnail || '/logo.png'} alt={topic.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
                    ▶
                  </div>
                </div>
                <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: '#4338ca', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                  {topic.category}
                </span>
              </div>

              {/* Content Details */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.4rem 0', lineHeight: '1.3' }}>{topic.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topic.summary}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', padding: '0.5rem 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <span>👁️ <strong>{topic.views || 0}</strong> Views</span>
                    <span>👍 <strong>{topic.helpful_count || topic.helpfulCount || 0}</strong> Helpful</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenTopic(topic)}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)', color: '#fff', border: 'none', padding: '0.55rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      ▶️ Watch Video & Guide
                    </button>
                    <button
                      onClick={() => handleVoteHelpful(topic.id)}
                      disabled={helpfulVotes[topic.id]}
                      style={{ background: helpfulVotes[topic.id] ? '#dcfce7' : '#f1f5f9', color: helpfulVotes[topic.id] ? '#15803d' : '#334155', border: 'none', padding: '0.55rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: helpfulVotes[topic.id] ? 'default' : 'pointer' }}
                    >
                      {helpfulVotes[topic.id] ? '✓ Helpful' : '👍'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YOUTUBE VIDEO & HELP ARTICLE LIGHTBOX MODAL */}
      {activeTopic && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase' }}>{activeTopic.category}</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0.2rem 0 0 0', color: '#fff' }}>{activeTopic.title}</h3>
              </div>
              <button onClick={() => setActiveTopic(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Modal Body with YouTube Player & Guide */}
            <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Responsive YouTube Player */}
              {activeTopic.youtube_url && (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', backgroundColor: '#000' }}>
                  <iframe
                    src={activeTopic.youtube_url}
                    title={activeTopic.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Step-by-Step Article Guide */}
              <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.6rem' }}>📄 Step-by-Step Help Guide</h4>
              <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                {activeTopic.article_body || 'No written guide provided for this topic.'}
              </div>

              {/* FAQ Q&A Box */}
              {activeTopic.faq_question && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e40af', marginBottom: '0.35rem' }}>❓ FAQ: {activeTopic.faq_question}</div>
                  <div style={{ fontSize: '0.825rem', color: '#1e3a8a', lineHeight: '1.5' }}>💡 {activeTopic.faq_answer}</div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => {
                  setActiveTopic(null);
                  if (onNavigate) onNavigate('support-live');
                }}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}
              >
                💬 Need More Help? Open Live Ticket
              </button>
              <button onClick={() => setActiveTopic(null)} style={{ background: '#4338ca', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Close Guide</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserContentSupportPage;
