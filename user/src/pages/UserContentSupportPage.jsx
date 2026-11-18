import React, { useState, useEffect } from 'react';
import {
  Layers,
  Download,
  Palette,
  Share2,
  Building2,
  Lightbulb,
  Wrench,
  Search,
  X,
  Play,
  Eye,
  ThumbsUp,
  Check,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  Video,
  ArrowRight,
} from 'lucide-react';
import {
  getUserSupportTopics,
  trackSupportTopicView,
  voteSupportTopicHelpful,
} from '../api/userSupportTopicService';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Topics', icon: Layers },
  { id: 'Download Content', label: 'Downloads', icon: Download },
  { id: 'Customise Content', label: 'Customizing', icon: Palette },
  { id: 'Share Content', label: 'Sharing', icon: Share2 },
  { id: 'Entity Content', label: 'Entities', icon: Building2 },
  { id: 'General Help', label: 'General Help', icon: Lightbulb },
  { id: 'Troubleshooting', label: 'Troubleshoot', icon: Wrench },
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
      setToastMsg('Thank you for your feedback! Recorded.');
    } catch (err) {
      console.error('Error voting helpful:', err);
      setToastMsg('Thank you for your feedback!');
    } finally {
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#FFFFFF',
            padding: '0.85rem 1.35rem',
            borderRadius: '14px',
            zIndex: 99999,
            boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.35)',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            animation: 'van-scale-pulse 0.25s ease-out',
          }}
        >
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={13} color="#FFFFFF" strokeWidth={3} />
          </div>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header Banner (2-Color Gradient with 3D Depth) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <BookOpen size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>Official Content Support & Video Masterclasses</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Content Support & Help Center
            </h1>
            <p className="van-catalog-hero-desc">
              Watch certified video masterclasses, browse step-by-step guides, and troubleshoot questions on downloading, customizing, and sharing marketing materials.
            </p>
          </div>
        </div>

        {/* Right Summary Counters */}
        <div className="van-catalog-hero-stats">
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val">{supportTopics.length}</div>
            <div className="van-catalog-stat-chip-lbl">Help Topics</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>Free</div>
            <div className="van-catalog-stat-chip-lbl">Video Guides</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#93C5FD' }}>24/7</div>
            <div className="van-catalog-stat-chip-lbl">Support Hub</div>
          </div>
        </div>
      </div>

      {/* 2-Tier Structured Filter & Search Toolbar */}
      <div className="van-library-toolbar-3d">
        {/* Tier 1: Category Tabs + Total Counter (Clean Single-Line Alignment) */}
        <div className="van-library-toolbar-top" style={{ flexWrap: 'nowrap', gap: '1rem' }}>
          <div className="van-catalog-segmented-switch" style={{ flex: 1, minWidth: 0 }}>
            {CATEGORY_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeCategory === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`van-catalog-tab-btn ${isActive ? 'active' : ''}`}
                >
                  <IconComp size={15} />
                  <span>{tab.label}</span>
                  {tab.id === 'all' && (
                    <span className="van-catalog-tab-count">{supportTopics.length}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="van-library-status-pill" style={{ flexShrink: 0 }}>
            <Sparkles size={12} color="#2563EB" />
            <span>Showing <strong>{supportTopics.length}</strong> Topics</span>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="van-library-divider" />

        {/* Tier 2: Search Input & Quick Help Action */}
        <div className="van-library-toolbar-bottom">
          <div className="van-catalog-search-wrap" style={{ flex: 1 }}>
            <Search size={16} className="van-catalog-search-icon" />
            <input
              type="text"
              placeholder="Search help topics, tutorials, or articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="van-catalog-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('support-live')}
              className="van-btn-details-3d"
              style={{
                width: 'auto',
                padding: '0 1.15rem',
                flex: 'none',
                height: '42px',
                background: '#FFFFFF',
              }}
              title="Need dedicated assistance? Open a direct live ticket"
            >
              <MessageSquare size={15} color="#2563EB" />
              <span>Need Help? Open Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '22px',
                border: '1px solid #E2E8F0',
                height: '390px',
                animation: 'pulse 1.5s infinite ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '185px', background: '#F1F5F9' }} />
              <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '35%', height: '18px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '85%', height: '24px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '100%', height: '36px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ marginTop: 'auto', height: '42px', background: '#F1F5F9', borderRadius: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && supportTopics.length === 0 && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '22px',
            border: '1px solid #E2E8F0',
            padding: '4rem 2rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
            boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <HelpCircle size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            No Support Topics Found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            {searchTerm || activeCategory !== 'all'
              ? 'No tutorials or articles match your current search term. Try resetting your search filters.'
              : 'Certified help guides and tutorial masterclasses will appear here as soon as they are published.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setSearchTerm('');
            }}
            style={{
              padding: '0.65rem 1.4rem',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Support Topic Cards Grid */}
      {!loading && supportTopics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {supportTopics.map((topic) => (
            <div key={topic.id} className="van-product-card-3d">
              {/* Video Thumbnail Header */}
              <div
                className="van-media-preview-container"
                onClick={() => handleOpenTopic(topic)}
                title="Click to watch video guide"
              >
                <img
                  src={topic.thumbnail || '/logo.png'}
                  alt={topic.title}
                  className="van-media-preview-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/logo.png';
                  }}
                />
                <div className="van-product-media-scrim" />

                {/* 3D Glowing Red Play Button Orb */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 10px 24px rgba(239, 68, 68, 0.45), inset 0 2px 2px rgba(255,255,255,0.4)',
                    transition: 'transform 0.25s ease',
                  }}
                >
                  <Play size={22} fill="#FFFFFF" style={{ marginLeft: '3px' }} />
                </div>

                {/* Top-Left Category Badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                  <span className="van-badge-pill-3d van-badge-service">
                    <Video size={11} strokeWidth={2.5} />
                    <span>{topic.category}</span>
                  </span>
                </div>

                {/* Top-Right Video Guide Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    padding: '0.28rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    zIndex: 2,
                  }}
                >
                  <BookOpen size={11} />
                  <span>Guide</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="van-product-card-body">
                {/* Category & Status */}
                <div className="van-product-category-row">
                  <span className="van-product-category-chip" title={topic.category}>
                    {topic.category}
                  </span>
                  <span className="van-product-vendor-text">
                    Official Tutorial
                  </span>
                </div>

                {/* Title & Summary */}
                <h3 className="van-product-title" title={topic.title}>
                  {topic.title}
                </h3>
                <p className="van-product-desc" title={topic.summary}>
                  {topic.summary || 'Step-by-step masterclass with practical visual demonstration.'}
                </p>

                {/* Stats & Views Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    color: '#64748B',
                    fontWeight: 600,
                    marginBottom: '1.15rem',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Eye size={13} color="#2563EB" />
                    <span><strong>{topic.views || 0}</strong> Views</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ThumbsUp size={13} color="#10B981" />
                    <span><strong>{topic.helpful_count || topic.helpfulCount || 0}</strong> Helpful</span>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="van-product-actions">
                  <button
                    type="button"
                    onClick={() => handleOpenTopic(topic)}
                    className="van-btn-share-3d"
                    style={{ flex: 1.4 }}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Watch Video & Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(topic.id)}
                    disabled={helpfulVotes[topic.id]}
                    className="van-btn-details-3d"
                    style={{
                      flex: 0.9,
                      background: helpfulVotes[topic.id] ? '#ECFDF5' : '#F8FAFC',
                      color: helpfulVotes[topic.id] ? '#047857' : '#334155',
                      borderColor: helpfulVotes[topic.id] ? '#A7F3D0' : '#E2E8F0',
                      cursor: helpfulVotes[topic.id] ? 'default' : 'pointer',
                    }}
                    title="Vote this guide as helpful"
                  >
                    {helpfulVotes[topic.id] ? (
                      <>
                        <Check size={14} color="#10B981" strokeWidth={2.5} />
                        <span>Helpful</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp size={14} />
                        <span>Helpful</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YOUTUBE VIDEO & HELP ARTICLE LIGHTBOX MODAL */}
      {activeTopic && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '22px',
              width: '100%',
              maxWidth: '740px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0B1727 0%, #1E3A8A 100%)',
                padding: '1.25rem 1.5rem',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#BAE6FD', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activeTopic.category} • Official Guide
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: '#FFFFFF' }}>
                  {activeTopic.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body with YouTube Player & Guide */}
            <div style={{ padding: '1.75rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Responsive YouTube Player */}
              {activeTopic.youtube_url && (
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    backgroundColor: '#0F172A',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                  }}
                >
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                <FileText size={18} color="#2563EB" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Step-by-Step Help Guide
                </h4>
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  color: '#334155',
                  lineHeight: '1.65',
                  whiteSpace: 'pre-wrap',
                  background: '#F8FAFC',
                  padding: '1.35rem',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '1.5rem',
                }}
              >
                {activeTopic.article_body || 'No written step-by-step documentation provided for this topic.'}
              </div>

              {/* FAQ Q&A Box */}
              {activeTopic.faq_question && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
                    border: '1px solid #DBEAFE',
                    borderRadius: '14px',
                    padding: '1.15rem 1.35rem',
                  }}
                >
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1E40AF', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <HelpCircle size={15} />
                    <span>FAQ: {activeTopic.faq_question}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#1E3A8A', lineHeight: '1.55' }}>
                    {activeTopic.faq_answer}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                background: '#FFFFFF',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTopic(null);
                  if (onNavigate) onNavigate('support-live');
                }}
                style={{
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <MessageSquare size={14} color="#2563EB" />
                <span>Need Live Help? Open Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserContentSupportPage;
