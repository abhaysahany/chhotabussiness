import React, { useState, useEffect } from 'react';
import {
  getAdminSupportTopics,
  createSupportTopic,
  updateSupportTopic,
  updateSupportTopicStatus,
  deleteSupportTopic,
} from '../../api/adminSupportTopicService';

const CATEGORY_OPTIONS = [
  { value: 'Download Content', label: '📥 Download Content' },
  { value: 'Customise Content', label: '🎨 Customise Content' },
  { value: 'Share Content', label: '📲 Share Content' },
  { value: 'Entity Content', label: '🏢 Entity Content' },
  { value: 'General Help', label: '💡 General Help' },
  { value: 'Troubleshooting', label: '🛠️ Troubleshooting' },
];

function AdminContentSupportUploadsPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [inspectingTopic, setInspectingTopic] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Download Content',
    youtube_url: '',
    thumbnail: '',
    summary: '',
    article_body: '',
    faq_question: '',
    faq_answer: '',
    status: 'published',
  });

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await getAdminSupportTopics({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      if (res && res.status === 'success') {
        setTopics(res.topics || []);
      }
    } catch (err) {
      console.error('Error fetching support topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [categoryFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTopics();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setFormData({
        title: topic.title || '',
        category: topic.category || 'Download Content',
        youtube_url: topic.youtube_url || '',
        thumbnail: topic.thumbnail || '',
        summary: topic.summary || '',
        article_body: topic.article_body || '',
        faq_question: topic.faq_question || '',
        faq_answer: topic.faq_answer || '',
        status: topic.status || 'published',
      });
    } else {
      setEditingTopic(null);
      setFormData({
        title: '',
        category: 'Download Content',
        youtube_url: '',
        thumbnail: '',
        summary: '',
        article_body: '',
        faq_question: '',
        faq_answer: '',
        status: 'published',
      });
    }
    setShowModal(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a support topic title');
      return;
    }

    try {
      setIsSaving(true);
      if (editingTopic) {
        const res = await updateSupportTopic(editingTopic.id, formData);
        if (res && res.status === 'success') {
          setToastMsg(`Support topic [${formData.title}] updated in database!`);
        }
      } else {
        const res = await createSupportTopic(formData);
        if (res && res.status === 'success') {
          setToastMsg(`New support video & article published to database!`);
        }
      }
      setShowModal(false);
      await fetchTopics();
    } catch (err) {
      console.error('Error saving support topic:', err);
      alert('Failed to save support topic into database. Please check connection.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleToggleStatus = async (topic) => {
    const nextStatus = topic.status === 'published' ? 'draft' : 'published';
    try {
      const res = await updateSupportTopicStatus(topic.id, nextStatus);
      if (res && res.status === 'success') {
        setToastMsg(`Topic [${topic.title}] set to ${nextStatus.toUpperCase()} in database!`);
        await fetchTopics();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to toggle status.');
    } finally {
      setTimeout(() => setToastMsg(''), 3500);
    }
  };

  const handleDeleteTopic = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete support topic [${title}] from database?`)) {
      try {
        setDeletingId(id);
        const res = await deleteSupportTopic(id);
        if (res && res.status === 'success') {
          setToastMsg(`Topic [${title}] permanently deleted from database!`);
          await fetchTopics();
        }
      } catch (err) {
        console.error('Error deleting topic:', err);
        alert('Failed to delete topic from database.');
      } finally {
        setDeletingId(null);
        setTimeout(() => setToastMsg(''), 3500);
      }
    }
  };

  const totalViews = topics.reduce((sum, item) => sum + (Number(item.views) || 0), 0);
  const totalHelpful = topics.reduce((sum, item) => sum + (Number(item.helpful_count) || 0), 0);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#059669', color: '#fff', padding: '0.85rem 1.35rem', borderRadius: '10px', fontWeight: '700', boxShadow: '0 10px 25px -5px rgba(5,150,105,0.4)', zIndex: 2000, fontSize: '0.875rem' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Hero Banner Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', display: 'inline-block', marginBottom: '0.75rem' }}>
              🎧 User Content Support & Video Tutorial Manager • MySQL Database
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>Content Support & Help Topics</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', maxWidth: '650px', margin: 0 }}>
              Upload YouTube video guides, help topics, FAQs, and step-by-step documentation saved directly in MySQL database to display in the Member Panel's Content Support section.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.4rem',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>➕ Upload New Support Video & Article</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Database Support Topics</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>{topics.length} Guides</div>
          <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: '700' }}>Live in MySQL DB</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Video Tutorials</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>▶️ {topics.filter(t => t.youtube_url).length} Videos</div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '700' }}>Embedded Video Guides</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>User Views & Likes</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>👁️ {totalViews.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700' }}>👍 {totalHelpful.toLocaleString()} Helpful Votes</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search support topic, video title, article or FAQ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', flex: '1 1 260px', maxWidth: '380px' }}
        />

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', color: '#334155' }}>
            <option value="all">All Content Support Categories</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', color: '#334155' }}>
            <option value="all">All Statuses</option>
            <option value="published">Published (Visible)</option>
            <option value="draft">Draft (Hidden)</option>
          </select>

          <button onClick={fetchTopics} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.55rem 0.85rem', borderRadius: '8px', fontSize: '0.835rem', fontWeight: '700', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#6366f1' }}>⏳ Loading Support Topics from Database...</div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && topics.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#fff', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📹</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b' }}>No Support Topics Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Start by uploading your first support video guide & article to the database.</p>
          <button onClick={() => handleOpenModal()} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
            ➕ Upload New Support Video & Article
          </button>
        </div>
      )}

      {/* GRID CARDS VIEW */}
      {!loading && topics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {topics.map((topic) => (
            <div key={topic.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              {/* Video Thumbnail Header */}
              <div style={{ height: '175px', backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setInspectingTopic(topic)}>
                <img src={topic.thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500'} alt={topic.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>
                    ▶
                  </div>
                </div>
                <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: '#6366f1', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800' }}>
                  {topic.category}
                </span>
                <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: topic.status === 'published' ? '#059669' : '#f59e0b', color: '#fff', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>
                  {topic.status}
                </span>
              </div>

              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.4rem 0', lineHeight: '1.3' }}>{topic.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{topic.summary}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', padding: '0.5rem 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <span>👁️ <strong>{topic.views || 0}</strong> Views</span>
                    <span>👍 <strong>{topic.helpful_count || topic.helpfulCount || 0}</strong> Helpful</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setInspectingTopic(topic)} style={{ flex: 1, minWidth: '90px', background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '0.45rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>▶️ Preview</button>
                    <button onClick={() => handleToggleStatus(topic)} style={{ background: topic.status === 'published' ? '#fef3c7' : '#dcfce7', color: topic.status === 'published' ? '#b45309' : '#15803d', border: 'none', padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }} title="Toggle Publish/Draft">
                      {topic.status === 'published' ? 'Draft' : 'Publish'}
                    </button>
                    <button onClick={() => handleOpenModal(topic)} style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>✏️ Edit</button>
                    <button disabled={deletingId === topic.id} onClick={() => handleDeleteTopic(topic.id, topic.title)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.45rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                      {deletingId === topic.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT SUPPORT TOPIC MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '640px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>{editingTopic ? 'Edit Support Topic' : 'Upload New Support Video & Article'}</h3>
                <span style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>Saves directly to MySQL Database</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleSaveTopic} style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>Support Topic Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g. How to Customise Marketing Assets" style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>Category Module *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>Publish Status *</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                    <option value="published">Published (Visible to Users)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>YouTube Video URL / Embed Link</label>
                <input type="url" value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=... or embed link" style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>Video Cover Thumbnail URL</label>
                <input type="url" value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} placeholder="https://images.unsplash.com/..." style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>Topic Summary</label>
                <input type="text" value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Short 1-line overview..." style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>Help Article Content / Step-by-Step Instructions</label>
                <textarea rows={5} value={formData.article_body} onChange={(e) => setFormData({ ...formData, article_body: e.target.value })} placeholder="Detailed help instructions, markdown bullet steps, etc..." style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>FAQ Question (Optional)</label>
                  <input type="text" value={formData.faq_question} onChange={(e) => setFormData({ ...formData, faq_question: e.target.value })} placeholder="Quick FAQ question..." style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '0.35rem' }}>FAQ Answer (Optional)</label>
                  <input type="text" value={formData.faq_answer} onChange={(e) => setFormData({ ...formData, faq_answer: e.target.value })} placeholder="Quick FAQ answer..." style={{ width: '100%', padding: '0.55rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', margin: '0 -1.5rem -1.5rem -1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSaving} style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving ? 'Saving to Database...' : editingTopic ? 'Update in Database' : 'Publish to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT TOPIC & YOUTUBE PLAYER MODAL */}
      {inspectingTopic && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '680px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '800', textTransform: 'uppercase' }}>{inspectingTopic.category}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0.2rem 0 0 0', color: '#fff' }}>{inspectingTopic.title}</h3>
              </div>
              <button onClick={() => setInspectingTopic(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {inspectingTopic.youtube_url && (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem', backgroundColor: '#000' }}>
                  <iframe
                    src={inspectingTopic.youtube_url}
                    title={inspectingTopic.title}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                  />
                </div>
              )}

              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>Help Article Guide</h4>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {inspectingTopic.article_body || 'No written guide provided for this topic.'}
              </div>

              {inspectingTopic.faq_question && (
                <div style={{ marginTop: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ fontWeight: '800', color: '#1e40af', fontSize: '0.85rem', marginBottom: '0.35rem' }}>❓ FAQ: {inspectingTopic.faq_question}</div>
                  <div style={{ color: '#1e3a8a', fontSize: '0.825rem' }}>{inspectingTopic.faq_answer}</div>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setInspectingTopic(null)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminContentSupportUploadsPage;
