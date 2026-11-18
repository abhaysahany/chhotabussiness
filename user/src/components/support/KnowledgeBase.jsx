import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  HelpCircle,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Share2,
  Download,
  BarChart3,
  Search,
  X,
  ChevronDown,
  Sparkles,
  Headphones,
  ArrowRight,
  LifeBuoy,
  FileText,
  Compass,
} from 'lucide-react';
import { getUserSupportTopics } from '../../api/userSupportTopicService';

function KnowledgeBase({ onNavigate }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleNav = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
  };

  const categories = [
    { id: 'All', title: 'All Topics', icon: BookOpen },
    { id: 'Payouts & Wallet', title: 'Payouts & Banking', icon: Wallet },
    { id: 'KYC & Verification', title: 'KYC Verification', icon: ShieldCheck },
    { id: 'Update Content', title: 'Update Content', icon: RefreshCw },
    { id: 'Share Content', title: 'Share Content', icon: Share2 },
    { id: 'Download Content', title: 'Download Content', icon: Download },
    { id: 'Commission Plan', title: 'Commissions', icon: BarChart3 },
  ];

  const popularTags = [
    'Payout Schedule',
    'KYC Approval',
    '5% TDS Deduction',
    'Bank Account Linking',
    'Team BV Matching',
    'Direct Referrals',
  ];

  const defaultFaqs = [
    {
      id: 'd1',
      category: 'Payouts & Wallet',
      question: 'When are commission withdrawals processed?',
      answer: 'Withdrawal requests are processed in automated IMPS/NEFT batches every 2 hours on working business days. Transfers usually credit to your verified bank account within 30 minutes of initiation.',
    },
    {
      id: 'd2',
      category: 'KYC & Verification',
      question: 'What documents are required for KYC approval?',
      answer: 'You need to upload clear, non-blurred photos of your PAN Card (for 5% TDS statutory tax deduction compliance) and 12-digit Aadhaar Card (front side with photo & back side with address). Admin verification is typically completed within 2 to 4 business hours.',
    },
    {
      id: 'd3',
      category: 'Commission Plan',
      question: 'How is Team Level Matching Bonus calculated?',
      answer: 'Team matching bonus is calculated on the balanced business volume (BV) across your active network legs. Daily matching cuts off at 11:59 PM IST and credits directly to your Available Commission Wallet.',
    },
    {
      id: 'd4',
      category: 'Commission Plan',
      question: 'Where can I see my direct referral bonus statements?',
      answer: 'Go to Business Reports » Network Earnings & Commissions in your sidebar layout to view itemized commission ledgers, TDS deductions under Section 194H, and downloadable payout vouchers.',
    },
    {
      id: 'd5',
      category: 'Payouts & Wallet',
      question: 'Can I add multiple bank accounts or UPI IDs?',
      answer: 'Yes! You can register up to 3 bank accounts and 2 UPI IDs under Settings » Bank & Payout Accounts. You can designate any one as your Primary destination for 1-click withdrawals.',
    },
    {
      id: 'd6',
      category: 'KYC & Verification',
      question: 'What should I do if my KYC is marked "Rejected"?',
      answer: 'If your KYC is rejected, check the reason displayed in your KYC dashboard (e.g., blurred image or name mismatch). Click "Resubmit KYC Details" to upload corrected proof documents.',
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
    <div className="van-kb-page-wrap">
      {/* Top Luxury Hero Banner */}
      <div className="van-kb-hero-card">
        <div className="van-kb-hero-left">
          <div className="van-kb-hero-icon-pod">
            <Compass size={28} strokeWidth={2.4} />
          </div>
          <div className="van-kb-hero-title-box">
            <div className="van-kb-badge-row">
              <span className="van-kb-glass-badge indigo">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818CF8', boxShadow: '0 0 6px #818CF8' }}></span>
                Instant Resolution & Guides
              </span>
              <span className="van-kb-glass-badge">
                <BookOpen size={12} /> Official Database Articles
              </span>
              <span className="van-kb-glass-badge">
                Support » Knowledge Base
              </span>
            </div>
            <h1 className="van-kb-hero-h1">Knowledge Base & Member Resource Desk</h1>
            <p className="van-kb-hero-p">
              Find quick answers, payout walkthroughs, KYC verification guides, and complete compliance documentation for your affiliate business.
            </p>
          </div>
        </div>

        <div className="van-kb-hero-right">
          <button
            type="button"
            onClick={() => handleNav('/support/tickets')}
            className="van-notify-glass-btn primary"
            title="Raise support ticket"
          >
            <Headphones size={15} strokeWidth={2.4} />
            <span>Open Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Spotlight Search Card */}
      <div className="van-kb-search-spotlight">
        <h2 className="van-kb-spotlight-title">How can we help you today?</h2>
        <p className="van-kb-spotlight-subtitle">Search across official database articles, payout guides, tutorials, and compliance rules.</p>
        
        <div className="van-kb-search-input-wrap">
          <span className="van-kb-search-icon">
            <Search size={18} strokeWidth={2.4} />
          </span>
          <input
            type="text"
            className="van-kb-search-input"
            placeholder="Search articles e.g. 'Payout status', 'KYC approval', 'TDS rules'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="van-kb-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Popular Tags */}
        <div className="van-kb-popular-tags">
          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 650 }}>Popular Searches:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="van-kb-tag-pill"
              onClick={() => setSearchQuery(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="van-kb-categories-bar">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`van-kb-category-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveCategory(c.id)}
            >
              <Icon size={16} strokeWidth={2.2} />
              <span>{c.title}</span>
            </button>
          );
        })}
      </div>

      {/* Expandable FAQ Accordion Card */}
      <div className="van-kb-faq-card">
        <div className="van-kb-faq-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="van-3d-kpi-icon van-3d-icon-blue" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
              <HelpCircle size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="van-security-card-h2">Frequently Asked Questions</h2>
              <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Showing {filteredFaqs.length} article{filteredFaqs.length !== 1 ? 's' : ''} in {activeCategory}
              </span>
            </div>
          </div>

          <span className="van-card-badge-pill blue">
            Database Verified
          </span>
        </div>

        <div className="van-kb-faq-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="van-spinner" style={{ width: '28px', height: '28px', margin: '0 auto 0.75rem auto' }}></div>
              <span style={{ fontSize: '0.86rem', color: '#64748B', fontWeight: 600 }}>Loading database articles...</span>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <LifeBuoy size={28} strokeWidth={2.2} />
              </div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>No Matching Articles</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748B' }}>
                We couldn't find any article matching "{searchQuery}". You can raise a direct inquiry to our 24/7 support desk.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="van-vault-action-btn"
              >
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`van-kb-accordion-row ${isOpen ? 'open' : ''}`}
                >
                  <div
                    className="van-kb-question-bar"
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                  >
                    <div className="van-kb-question-left">
                      <div className="van-kb-q-icon-pod">
                        <HelpCircle size={16} strokeWidth={2.4} />
                      </div>
                      <h4 className="van-kb-q-text">{faq.question}</h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                      <span className="van-card-badge-pill teal" style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem' }}>
                        {faq.category}
                      </span>
                      <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease', color: '#64748B' }}>
                        <ChevronDown size={18} strokeWidth={2.4} />
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="van-kb-answer-box">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Support Desk Callout Bar at Bottom */}
      <div className="van-kb-support-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: 1, minWidth: '260px' }}>
          <div className="van-3d-kpi-icon van-3d-icon-cyan" style={{ width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0 }}>
            <Headphones size={24} strokeWidth={2.3} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#FFFFFF' }}>
              Still have questions or need personalized account assistance?
            </h4>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.86rem', color: '#93C5FD', lineHeight: 1.45 }}>
              Our dedicated member support specialists are available 24/7 to resolve payout queries, KYC updates, and commission settlements.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleNav('/support/tickets')}
          className="van-callout-action-btn"
        >
          <span>Raise a Support Ticket</span>
          <ArrowRight size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

export default KnowledgeBase;
