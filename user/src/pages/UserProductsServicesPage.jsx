import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Briefcase, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  Filter, 
  Info, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Layers,
  Award,
  Zap,
  Tag
} from 'lucide-react';
import { getUserProducts, getUserServices, getUserCategories } from '../api/userCatalogService';

function UserProductsServicesPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'product' | 'service'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForShare, setSelectedItemForShare] = useState(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dbItems, setDbItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const userCode = user?.user_code || '';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, srvs, cats] = await Promise.all([
        getUserProducts(),
        getUserServices(),
        getUserCategories(),
      ]);

      const normalizedProducts = (prods || []).map((p) => ({
        id: `prod-${p.id}`,
        dbId: p.id,
        title: p.name,
        type: 'product',
        category: p.category || 'General',
        price: Number(p.price) || 0,
        status: 'Verified',
        verified: true,
        badge: p.stock < 10 ? 'Limited Stock' : 'Verified',
        image: p.image || '/logo.png',
        description: p.description || 'Quality verified commercial product with direct distributor warranty.',
        vendor: p.owner_name || '',
        referralCommissionPercent: Number(p.admin_commission_percent) || 0,
        referralBonusAmount: 0,
        teamPointsBp: 0,
        features: ['Immediate delivery', 'GST billing supported', '24/7 Dedicated Support', 'Vendor warranty included'],
      }));

      const normalizedServices = (srvs || []).map((s) => ({
        id: `srv-${s.id}`,
        dbId: s.id,
        title: s.name,
        type: 'service',
        category: s.category || 'Services',
        price: Number(s.price) || 0,
        status: 'Verified',
        verified: true,
        badge: s.duration || 'Certified Service',
        image: s.image || '/logo.png',
        description: s.description || 'Professional end-to-end execution by verified industry experts.',
        vendor: s.owner_name || '',
        referralCommissionPercent: Number(s.admin_commission_percent) || 0,
        referralBonusAmount: 0,
        teamPointsBp: 0,
        features: [`Turnaround: ${s.duration || '3 Days'}`, 'Government portal filing', 'Dedicated account manager', '100% On-time guarantee'],
      }));

      const allCombined = [...normalizedProducts, ...normalizedServices];
      setDbItems(allCombined);

      // Extract unique categories
      const extractedCats = Array.from(new Set([
        ...(cats || []).map(c => c.name),
        ...allCombined.map(i => i.category)
      ])).filter(Boolean);
      setCategoriesList(extractedCats);
    } catch (err) {
      console.warn('Could not load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = useMemo(() => {
    return {
      all: dbItems.length,
      product: dbItems.filter(i => i.type === 'product').length,
      service: dbItems.filter(i => i.type === 'service').length,
    };
  }, [dbItems]);

  const filteredItems = useMemo(() => {
    return dbItems.filter((item) => {
      const matchType = activeTab === 'all' || item.type === activeTab;
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q);

      return matchType && matchCategory && matchSearch;
    });
  }, [dbItems, activeTab, selectedCategory, searchQuery]);

  const copyReferralLink = (item) => {
    const link = `https://addnet.com/items/${item.dbId}?type=${item.type}&ref=${userCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast(`Copied referral tracking link for "${item.title}"`);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner (3D Executive Modern) */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <ShoppingBag size={30} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span className="van-live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
              <Sparkles size={13} />
              <span>Certified Commercial Catalog & Marketing Hub</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Available Products & Services
            </h1>
            <p className="van-catalog-hero-desc">
              Explore certified enterprise software, legal solutions, and commercial products. Share unique referral tracking links to earn direct cash bonuses and multi-level diamond volume.
            </p>
          </div>
        </div>

        {/* Right Summary Counters */}
        <div className="van-catalog-hero-stats">
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val">{counts.all}</div>
            <div className="van-catalog-stat-chip-lbl">Total Items</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>40%</div>
            <div className="van-catalog-stat-chip-lbl">Max Direct Bonus</div>
          </div>
          <div className="van-catalog-stat-chip">
            <div className="van-catalog-stat-chip-val" style={{ color: '#93C5FD' }}>20 Lvls</div>
            <div className="van-catalog-stat-chip-lbl">Team Diamonds</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="van-catalog-filter-bar">
        {/* Segmented Type Switch */}
        <div className="van-catalog-segmented-switch">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`van-catalog-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            <Layers size={15} />
            <span>All Items</span>
            <span className="van-catalog-tab-count">{counts.all}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('product')}
            className={`van-catalog-tab-btn ${activeTab === 'product' ? 'active' : ''}`}
          >
            <Package size={15} />
            <span>Products</span>
            <span className="van-catalog-tab-count">{counts.product}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`van-catalog-tab-btn ${activeTab === 'service' ? 'active' : ''}`}
          >
            <Briefcase size={15} />
            <span>Services</span>
            <span className="van-catalog-tab-count">{counts.service}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="van-catalog-search-wrap">
          <Search size={16} className="van-catalog-search-icon" />
          <input
            type="text"
            placeholder="Search by title, service, category, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="van-catalog-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
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

        {/* Category Dropdown */}
        <div className="van-catalog-select-wrap">
          <Filter size={14} className="van-catalog-select-icon" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="van-catalog-select"
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                height: '420px',
                animation: 'pulse 1.5s infinite ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: '185px', background: '#F1F5F9' }} />
              <div style={{ padding: '1.35rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ width: '40%', height: '18px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '80%', height: '24px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ width: '100%', height: '36px', background: '#F1F5F9', borderRadius: '6px' }} />
                <div style={{ marginTop: 'auto', height: '60px', background: '#F1F5F9', borderRadius: '12px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
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
            <Search size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            No products or services found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            We couldn't find any items matching your selected filter or search term. Try resetting your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedCategory('all');
              setSearchQuery('');
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

      {/* Products & Services Grid */}
      {!loading && filteredItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {filteredItems.map((item) => {
            const isProduct = item.type === 'product';
            // Clean title by removing trailing random hashes/uuids if present
            const displayTitle = item.title.replace(/\s+[a-f0-9]{8,}$/i, '');

            return (
              <div key={item.id} className="van-product-card-3d">
                {/* Media Image Area */}
                <div className="van-product-media">
                  <img
                    src={item.image}
                    alt={displayTitle}
                    className="van-product-media-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/logo.png';
                    }}
                  />
                  <div className="van-product-media-scrim" />

                  {/* Top Badges: Type on left, Delivery on right (Clean & Compact) */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                    <span className={`van-badge-pill-3d ${isProduct ? 'van-badge-product' : 'van-badge-service'}`}>
                      {isProduct ? <Package size={12} strokeWidth={2.5} /> : <Briefcase size={12} strokeWidth={2.5} />}
                      <span>{item.type}</span>
                    </span>
                    {item.badge && (
                      <span className="van-badge-feature">
                        <Clock size={11} />
                        <span>{item.badge}</span>
                      </span>
                    )}
                  </div>

                  {/* Verified Floater Chip */}
                  <div className="van-badge-verified-float">
                    <ShieldCheck size={12} color="#10B981" />
                    <span>Verified</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="van-product-card-body">
                  {/* Category & Vendor Row */}
                  <div className="van-product-category-row">
                    <span className="van-product-category-chip" title={item.category}>
                      {item.category}
                    </span>
                    <span className="van-product-vendor-text" title={`Provided by ${item.vendor}`}>
                      by {item.vendor}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="van-product-title" title={item.title}>
                    {displayTitle}
                  </h3>
                  <p className="van-product-desc" title={item.description}>
                    {item.description}
                  </p>

                  {/* Pricing & Earnings Split Box */}
                  <div className="van-product-earnings-box">
                    <div className="van-product-price-row">
                      <span className="van-product-price-label">
                        <Tag size={12} /> Client Price
                      </span>
                      <strong className="van-product-price-amount">
                        ₹{item.price.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div className="van-product-incentive-grid">
                      <div className="van-product-incentive-pill bonus">
                        <div className="van-incentive-header">
                          <div className="van-incentive-icon-orb">
                            <Zap size={11} strokeWidth={3} />
                          </div>
                          <span className="van-incentive-title">Direct Bonus</span>
                        </div>
                        <div className="van-incentive-val">
                          +₹{item.referralBonusAmount.toLocaleString('en-IN')}{' '}
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', opacity: 0.85 }}>
                            ({item.referralCommissionPercent}%)
                          </span>
                        </div>
                      </div>

                      <div className="van-product-incentive-pill diamonds">
                        <div className="van-incentive-header">
                          <div className="van-incentive-icon-orb">
                            <Award size={11} strokeWidth={3} />
                          </div>
                          <span className="van-incentive-title">Diamonds</span>
                        </div>
                        <div className="van-incentive-val">
                          +{item.teamPointsBp}{' '}
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6D28D9', opacity: 0.85 }}>
                            (20 Lvls)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="van-product-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedItemForDetails(item)}
                      className="van-btn-details-3d"
                    >
                      <Info size={15} />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedItemForShare(item);
                        copyReferralLink(item);
                      }}
                      className="van-btn-share-3d"
                    >
                      <Share2 size={15} />
                      <span>Share & Earn</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Share & Earn Referral Link */}
      {selectedItemForShare && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
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
              maxWidth: '540px',
              padding: '2.25rem',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 18px -3px rgba(37, 99, 235, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <Share2 size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                    Share & Earn Commissions
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    {selectedItemForShare.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForShare(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Reward Highlight Pill */}
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
                border: '1px solid #DBEAFE',
                borderRadius: '14px',
                padding: '0.9rem 1.15rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={18} />
              </div>
              <div style={{ fontSize: '0.84rem', color: '#1E293B' }}>
                Earn <strong style={{ color: '#16A34A', fontWeight: 800 }}>₹{selectedItemForShare.referralBonusAmount} Direct Bonus</strong> +{' '}
                <strong style={{ color: '#7C3AED', fontWeight: 800 }}>{selectedItemForShare.teamPointsBp} Diamonds</strong> upon purchase.
              </div>
            </div>

            {/* Referral Link Box */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Your Unique Tracking Link (Member #{userCode})
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={`https://addnet.com/items/${selectedItemForShare.dbId}?type=${selectedItemForShare.type}&ref=${userCode}`}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.84rem',
                    background: '#F8FAFC',
                    fontWeight: 600,
                    color: '#2563EB',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => copyReferralLink(selectedItemForShare)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    background: copiedLink ? '#10B981' : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copiedLink ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Social Share Buttons */}
            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Instant Share to Social Channels
              </span>
              <div className="van-share-social-grid">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${selectedItemForShare.title} on Vyapar AdNET! https://addnet.com/items/${selectedItemForShare.dbId}?type=${selectedItemForShare.type}&ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem',
                    background: '#22C55E',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(34, 197, 94, 0.25)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://addnet.com/items/${selectedItemForShare.dbId}?type=${selectedItemForShare.type}&ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem',
                    background: '#0A66C2',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(10, 102, 194, 0.25)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span>LinkedIn</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://addnet.com/items/${selectedItemForShare.dbId}?type=${selectedItemForShare.type}&ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem',
                    background: '#1877F2',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(24, 119, 242, 0.25)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span>Facebook</span>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Discover ${selectedItemForShare.title} on Vyapar AdNET! https://addnet.com/items/${selectedItemForShare.dbId}?type=${selectedItemForShare.type}&ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.25)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <span>Twitter / X</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedItemForShare(null)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Item Specifications & Scope Details */}
      {selectedItemForDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
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
              maxWidth: '560px',
              padding: '2.25rem',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: selectedItemForDetails.type === 'product' ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {selectedItemForDetails.type === 'product' ? <Package size={22} /> : <Briefcase size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                    {selectedItemForDetails.title}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                    {selectedItemForDetails.category} • by {selectedItemForDetails.vendor}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {selectedItemForDetails.description}
            </p>

            {/* Commercial Summary Banner */}
            <div className="van-commerce-summary-grid">
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Client Price</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem' }}>₹{selectedItemForDetails.price.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Your Bonus</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16A34A', marginTop: '0.15rem' }}>+₹{selectedItemForDetails.referralBonusAmount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#6D28D9', fontWeight: 600, textTransform: 'uppercase' }}>Team Diamonds</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7C3AED', marginTop: '0.15rem' }}>+{selectedItemForDetails.teamPointsBp}</div>
              </div>
            </div>

            {/* Key Inclusions */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.15rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={16} color="#2563EB" />
                <span>Verified Scope & Key Inclusions:</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedItemForDetails.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: '#334155' }}>
                    <CheckCircle2 size={15} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const it = selectedItemForDetails;
                  setSelectedItemForDetails(null);
                  setSelectedItemForShare(it);
                  copyReferralLink(it);
                }}
                style={{
                  flex: 1.6,
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderBottom: '2.5px solid #1E40AF',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.4)',
                }}
              >
                <Share2 size={15} />
                <span>Get Referral Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProductsServicesPage;
