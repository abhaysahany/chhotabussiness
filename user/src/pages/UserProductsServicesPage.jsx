import React, { useState, useEffect, useMemo } from 'react';
import { getUserProducts, getUserServices, getUserCategories } from '../api/userCatalogService';

function UserProductsServicesPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'product' | 'service'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForShare, setSelectedItemForShare] = useState(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [dbItems, setDbItems] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const userCode = user?.user_code || 'CB100001';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
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
        price: Number(p.price),
        rating: 4.9,
        reviewsCount: 120 + p.id * 7,
        badge: p.stock < 10 ? 'Limited Stock' : 'Verified Product',
        image: p.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        description: p.description || 'Quality verified commercial product with direct distributor warranty.',
        vendor: p.owner_name || 'Skyline Technologies Pvt Ltd',
        referralCommissionPercent: 40,
        referralBonusAmount: Math.round(Number(p.price) * 0.05) || 250,
        teamPointsBp: Math.max(10, Math.round(Number(p.price) / 400)),
        features: ['Immediate delivery', 'GST billing supported', '24/7 Support', 'Vendor warranty included'],
      }));

      const normalizedServices = (srvs || []).map((s) => ({
        id: `srv-${s.id}`,
        dbId: s.id,
        title: s.name,
        type: 'service',
        category: s.category || 'Services',
        price: Number(s.price),
        rating: 4.8,
        reviewsCount: 95 + s.id * 5,
        badge: s.duration || 'Certified Service',
        image: s.image || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        description: s.description || 'Professional end-to-end execution by verified industry experts.',
        vendor: s.owner_name || 'Vyapar Adnet Tax Advisory',
        referralCommissionPercent: 40,
        referralBonusAmount: Math.round(Number(s.price) * 0.06) || 300,
        teamPointsBp: Math.max(15, Math.round(Number(s.price) / 350)),
        features: [`Turnaround: ${s.duration || '3 Days'}`, 'Government portal filing', 'Dedicated account manager', '100% On-time guarantee'],
      }));

      setDbItems([...normalizedProducts, ...normalizedServices]);
      if (cats && cats.length > 0) {
        setCategoriesList(cats.map((c) => c.name));
      }
    } catch (err) {
      console.warn('Could not load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    return dbItems.filter((item) => {
      const matchType = activeTab === 'all' || item.type === activeTab;
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q);

      return matchType && matchCategory && matchSearch;
    });
  }, [dbItems, activeTab, selectedCategory, searchQuery]);

  const copyReferralLink = (item) => {
    const link = `https://vyaparadnet.com/items/${item.dbId}?type=${item.type}&ref=${userCode}`;
    navigator.clipboard.writeText(link);
    showToast(`✓ Copied referral link for "${item.title}"!`);
  };

  return (
    <div className="page-content-wrapper" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 99999,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#93c5fd', marginBottom: '0.75rem' }}>
          <span>🛍️ Commercial Catalog & Marketing Center</span>
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
          Available Products & Services
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '750px', margin: 0 }}>
          Explore our certified range of business software, legal solutions, and retail products. Share with your network to earn direct referral bonuses and team volume Business Points (BP).
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Type Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'all' ? '#ffffff' : 'transparent',
              color: activeTab === 'all' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'all' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'all' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            All Items ({dbItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('product')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'product' ? '#ffffff' : 'transparent',
              color: activeTab === 'product' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'product' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'product' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            📦 Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'service' ? '#ffffff' : 'transparent',
              color: activeTab === 'service' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'service' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'service' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            💼 Services
          </button>
        </div>

        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search products, services, legal solutions, ERP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', fontWeight: 600, color: '#334155' }}
        >
          <option value="all">All Categories</option>
          <option value="Software & IT">Software & IT</option>
          <option value="Legal & Compliance">Legal & Compliance</option>
          <option value="Hardware & Retail">Hardware & Retail</option>
        </select>
      </div>

      {/* Products & Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {/* Image & Badge */}
              <div style={{ position: 'relative', height: '170px', overflow: 'hidden' }}>
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.4rem' }}>
                  <span
                    style={{
                      background: item.type === 'product' ? '#2563eb' : '#7c3aed',
                      color: '#ffffff',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.type}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        background: '#0f172a',
                        color: '#f8fafc',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      ★ {item.badge}
                    </span>
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                  ⭐ {item.rating} ({item.reviewsCount})
                </div>
              </div>

              {/* Content Body */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  {item.category} • by {item.vendor}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                  {item.title}
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, flex: 1 }}>
                  {item.description}
                </p>

                {/* Earning & Price Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Client Price:</span>
                    <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>₹{item.price.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>Your Direct Bonus:</span>
                    <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800 }}>+₹{item.referralBonusAmount} ({item.referralCommissionPercent}%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700 }}>Team Volume Points:</span>
                    <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 800 }}>+{item.teamPointsBp} BP (20 Levels)</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedItemForDetails(item)}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Details
                  </button>
                  {/* <button
                    type="button"
                    onClick={() => {
                      setSelectedItemForShare(item);
                      copyReferralLink(item);
                    }}
                    style={{
                      flex: 1.4,
                      padding: '0.55rem 0.75rem',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>🔗</span> Share & Earn
                  </button> */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Share & Earn Referral Link */}
      {selectedItemForShare && (
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
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  🔗 Personalized Product Share Link
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Earn <strong>₹{selectedItemForShare.referralBonusAmount}</strong> + <strong>{selectedItemForShare.teamPointsBp} BP</strong> on every successful referral purchase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForShare(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Your Unique Tracking Link (Tagged with Member #{userCode}):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={`https://vyaparadnet.com/items/${selectedItemForShare.id}?ref=${userCode}`}
                  style={{ flex: 1, padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc', fontWeight: 600, color: '#2563eb' }}
                />
                <button
                  type="button"
                  onClick={() => copyReferralLink(selectedItemForShare)}
                  style={{ padding: '0.6rem 1rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Quick Social Share Buttons */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Quick Share via Social Media:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${selectedItemForShare.title} on Vyapar Adnet! https://vyaparadnet.com/items/${selectedItemForShare.id}?ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: '#22c55e', color: '#ffffff', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <span>💬</span> WhatsApp
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://vyaparadnet.com/items/${selectedItemForShare.id}?ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: '#0a66c2', color: '#ffffff', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <span>💼</span> LinkedIn
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://vyaparadnet.com/items/${selectedItemForShare.id}?ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: '#1877f2', color: '#ffffff', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <span>🌐</span> Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get ${selectedItemForShare.title} on Vyapar Adnet! https://vyaparadnet.com/items/${selectedItemForShare.id}?ref=${userCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: '#0f172a', color: '#ffffff', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <span>🐦</span> Twitter / X
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedItemForShare(null)}
              style={{ width: '100%', padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Done
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
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedItemForDetails.title}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Category: <strong>{selectedItemForDetails.category}</strong> • Starting Price: <strong>₹{selectedItemForDetails.price.toLocaleString()}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {selectedItemForDetails.description}
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
                Key Inclusions & Specifications:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {selectedItemForDetails.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedItemForDetails(null)}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedItemForDetails(null);
                  setSelectedItemForShare(selectedItemForDetails);
                  copyReferralLink(selectedItemForDetails);
                }}
                style={{ flex: 1.5, padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                🔗 Get Referral Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProductsServicesPage;
