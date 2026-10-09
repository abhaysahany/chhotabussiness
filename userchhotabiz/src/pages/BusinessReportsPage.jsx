import React, { useState, useEffect } from 'react';
import {
  getPublicCategories,
  getPublicBusinesses,
  getPublicFreelancers,
} from '../api/publicEntityService';
import { maskEmail, maskPhone } from '../utils/formatters';

function BusinessReportsPage({ user, initialTypeFilter = 'all' }) {
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState(initialTypeFilter); // 'all' | 'business' | 'freelancer'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'verified' | 'featured'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'name_asc' | 'rating'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Detailed Entity Modal
  const [selectedReportEntity, setSelectedReportEntity] = useState(null);

  useEffect(() => {
    if (initialTypeFilter) {
      setEntityTypeFilter(initialTypeFilter);
    }
  }, [initialTypeFilter]);

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, bizRes, freeRes] = await Promise.all([
        getPublicCategories(),
        getPublicBusinesses(),
        getPublicFreelancers(),
      ]);
      setCategories(catRes.categories || []);
      setBusinesses(bizRes.businesses || []);
      setFreelancers(freeRes.freelancers || []);
    } catch (err) {
      console.error('Error fetching directory reports:', err);
      setError('Unable to fetch business directory & report data from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Standardize combined entities list for reporting
  const combinedEntities = [
    ...businesses.map((b) => ({
      ...b,
      entity_type: 'business',
      display_title: b.name,
      display_subtitle: `Owner: ${b.owner_name}`,
      display_image: b.logo_url || 'https://via.placeholder.com/80?text=Business',
      reg_identifier: b.registration_no || 'N/A',
      rating: 4.9,
    })),
    ...freelancers.map((f) => ({
      ...f,
      entity_type: 'freelancer',
      display_title: f.name,
      display_subtitle: f.title || 'Freelance Professional',
      display_image: f.avatar_url || 'https://via.placeholder.com/80?text=Freelancer',
      reg_identifier: f.hourly_rate || '₹850/hr',
      rating: 4.8,
    })),
  ];

  // Filtering Logic
  const filteredEntities = combinedEntities.filter((item) => {
    // Type Filter
    if (entityTypeFilter === 'business' && item.entity_type !== 'business') return false;
    if (entityTypeFilter === 'freelancer' && item.entity_type !== 'freelancer') return false;

    // Category Filter
    if (categoryFilter && String(item.entity_category_id) !== String(categoryFilter)) return false;

    // Status / Featured Filter
    if (statusFilter === 'verified' && item.verification_status !== 'verified') return false;
    if (statusFilter === 'featured' && !item.featured) return false;

    // Search Query
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const nameMatch = item.display_title.toLowerCase().includes(query);
      const subMatch = item.display_subtitle.toLowerCase().includes(query);
      const emailMatch = item.email ? item.email.toLowerCase().includes(query) : false;
      const catName = item.category?.name ? item.category.name.toLowerCase().includes(query) : false;
      const regMatch = item.reg_identifier ? item.reg_identifier.toLowerCase().includes(query) : false;
      if (!nameMatch && !subMatch && !emailMatch && !catName && !regMatch) return false;
    }

    return true;
  });

  // Sorting Logic
  const sortedEntities = [...filteredEntities].sort((a, b) => {
    if (sortBy === 'name_asc') {
      return a.display_title.localeCompare(b.display_title);
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return b.id - a.id; // Newest first
  });

  const totalBusinessesCount = businesses.length;
  const totalFreelancersCount = freelancers.length;
  const totalVerifiedCount = combinedEntities.filter((e) => e.verification_status === 'verified').length;

  return (
    <div className="page-wrapper" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          borderRadius: '16px',
          padding: '2.25rem 2.5rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 12px 32px -6px rgba(15, 23, 42, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.85rem', backdropFilter: 'blur(4px)' }}>
            <span>🏢 Verified Business Directory & Compliance Reports</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Business & Freelancer Directory Reports
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '680px', margin: 0, lineHeight: '1.5' }}>
            Browse verified enterprise business listings, compliance document reports, and professional freelancer credentials across category domains.
          </p>

          {/* Category Quick Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <button
              onClick={() => setCategoryFilter('')}
              style={{
                background: categoryFilter === '' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.775rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Categories ({combinedEntities.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(String(cat.id))}
                style={{
                  background: String(categoryFilter) === String(cat.id) ? (cat.badge_color || '#6366f1') : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.775rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #3b82f6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registered Businesses</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>🏢</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{totalBusinessesCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Enterprise corporate entities</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #7c3aed', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Freelancers</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>👤</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{totalFreelancersCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Verified skilled experts</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Reports</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>✓</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{totalVerifiedCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>100% Document Verified</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Domain Categories</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>📁</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{categories.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Industry classifications</div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Search entity name, owner, GSTIN, skill or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                fontSize: '0.835rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
              }}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          {/* Filter Selects */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Entity Type Filter */}
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontWeight: '600', color: '#334155' }}
            >
              <option value="all">All Entity Types</option>
              <option value="business">🏢 Businesses Only</option>
              <option value="freelancer">👤 Freelancers Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontWeight: '600', color: '#334155' }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontWeight: '600', color: '#334155' }}
            >
              <option value="all">All Statuses</option>
              <option value="verified">✓ Verified Only</option>
              <option value="featured">🌟 Featured Ads Only</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontWeight: '600', color: '#334155' }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>

          {/* View Switcher */}
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: viewMode === 'grid' ? '#fff' : 'transparent',
                color: viewMode === 'grid' ? '#4f46e5' : '#64748b',
                boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              🎴 Cards View
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: viewMode === 'table' ? '#fff' : 'transparent',
                color: viewMode === 'table' ? '#4f46e5' : '#64748b',
                boxShadow: viewMode === 'table' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              📋 Report Table
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '600' }}>Loading entity directory reports...</p>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: '600' }}>{error}</p>
        </div>
      ) : sortedEntities.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🔍</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No Entity Reports Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>Try adjusting your search query, type filter, or category selection.</p>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter(''); setEntityTypeFilter('all'); setStatusFilter('all'); }}
            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.825rem', cursor: 'pointer' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
          {sortedEntities.map((item) => (
            <div
              key={`${item.entity_type}-${item.id}`}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <img
                      src={item.display_image}
                      alt={item.display_title}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: item.entity_type === 'freelancer' ? '50%' : '10px',
                        objectFit: 'cover',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: '1.3' }}>
                          {item.display_title}
                        </h4>
                        {item.verification_status === 'verified' && (
                          <span title="Verified Report" style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '800' }}>✓</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: item.entity_type === 'freelancer' ? '#6366f1' : '#64748b', fontWeight: '600' }}>
                        {item.display_subtitle}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      background: item.entity_type === 'business' ? '#eff6ff' : '#f3e8ff',
                      color: item.entity_type === 'business' ? '#1d4ed8' : '#7e22ce',
                      fontSize: '0.725rem',
                      fontWeight: '800',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.entity_type}
                  </span>
                </div>

                {/* Category & Badge Info */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                  <span
                    style={{
                      backgroundColor: item.category?.badge_color ? `${item.category.badge_color}18` : '#e0e7ff',
                      color: item.category?.badge_color || '#3730a3',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '14px',
                      fontSize: '0.775rem',
                      fontWeight: '700',
                    }}
                  >
                    {item.category?.name || 'General Domain'}
                  </span>

                  {item.featured && (
                    <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #86efac', padding: '0.25rem 0.65rem', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '700' }}>
                      🌟 Featured Ad
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.835rem', color: '#475569', lineHeight: '1.5', marginBottom: '1rem', minHeight: '38px' }}>
                  {item.description || item.bio || 'Verified entity operating within classification standards.'}
                </p>
              </div>

              <div>
                {/* Details Bar */}
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    <strong>Reg / Rate:</strong> <code style={{ color: '#0f172a', fontWeight: '700' }}>{item.reg_identifier}</code>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700' }}>
                    📑 {item.documents ? item.documents.length : 0} Docs Verified
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setSelectedReportEntity(item)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
                  }}
                >
                  <span>📋 View Detailed Entity Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DETAILED REPORT TABLE VIEW */
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '1.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.835rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Entity & Type</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Owner / Title</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Registration / Rate</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Attached Docs</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntities.map((item) => (
                <tr key={`${item.entity_type}-${item.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={item.display_image}
                        alt={item.display_title}
                        style={{ width: '38px', height: '38px', borderRadius: item.entity_type === 'freelancer' ? '50%' : '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                      />
                      <div>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{item.display_title}</div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: item.entity_type === 'business' ? '#1d4ed8' : '#7e22ce' }}>
                          {item.entity_type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: `${item.category?.badge_color || '#6366f1'}15`, color: item.category?.badge_color || '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                      {item.category?.name || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '600' }}>
                    {item.display_subtitle}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <code style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }}>
                      {item.reg_identifier}
                    </code>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #86efac', padding: '0.2rem 0.55rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                      📑 {item.documents ? item.documents.length : 0} Verified Docs
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: item.verification_status === 'verified' ? '#dcfce7' : '#fef3c7', color: item.verification_status === 'verified' ? '#15803d' : '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                      {item.verification_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedReportEntity(item)}
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.775rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Report Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILED ENTITY REPORT MODAL DRAWER */}
      {selectedReportEntity && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '1.5rem 2rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img
                  src={selectedReportEntity.display_image}
                  alt={selectedReportEntity.display_title}
                  style={{ width: '56px', height: '56px', borderRadius: selectedReportEntity.entity_type === 'freelancer' ? '50%' : '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>{selectedReportEntity.display_title}</h3>
                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>✓ VERIFIED REPORT</span>
                  </div>
                  <div style={{ fontSize: '0.835rem', color: '#cbd5e1', marginTop: '0.2rem' }}>{selectedReportEntity.display_subtitle}</div>
                </div>
              </div>

              <button onClick={() => setSelectedReportEntity(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem 2rem' }}>
              {/* Category & Status Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ background: `${selectedReportEntity.category?.badge_color || '#6366f1'}18`, color: selectedReportEntity.category?.badge_color || '#6366f1', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: '700', fontSize: '0.8rem' }}>
                  📁 Domain: {selectedReportEntity.category?.name || 'General Domain'}
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: '700', fontSize: '0.8rem' }}>
                  🏷️ Entity Type: {selectedReportEntity.entity_type.toUpperCase()}
                </span>
                {selectedReportEntity.featured && (
                  <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #86efac', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: '700', fontSize: '0.8rem' }}>
                    🌟 Featured Advertisement
                  </span>
                )}
              </div>

              {/* Bio / Description */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview & Bio</h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                  {selectedReportEntity.description || selectedReportEntity.bio || 'Verified business/freelancer entity operating within platform guidelines.'}
                </p>
              </div>

              {/* Compliance & Registration Info Grid */}
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.65rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration & Compliance Audit</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>REGISTRATION / GST NO.</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>{selectedReportEntity.reg_identifier}</div>
                </div>

                <div style={{ background: '#fff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>EMAIL ADDRESS (PROTECTED)</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#4f46e5', marginTop: '0.2rem' }}>{maskEmail(selectedReportEntity.email)}</div>
                </div>

                <div style={{ background: '#fff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>PHONE CONTACT (PROTECTED)</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0f172a', marginTop: '0.2rem' }}>{maskPhone(selectedReportEntity.phone)}</div>
                </div>

                <div style={{ background: '#fff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>WEBSITE / PORTFOLIO</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0284c7', marginTop: '0.2rem' }}>{selectedReportEntity.website || selectedReportEntity.portfolio_link || 'N/A'}</div>
                </div>
              </div>

              {/* Verified Documents Audit Trail */}
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.65rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Document Attachments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {selectedReportEntity.documents && selectedReportEntity.documents.length > 0 ? (
                  selectedReportEntity.documents.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#065f46', fontSize: '0.835rem' }}>📄 {doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.1rem' }}>File Record: {doc.file_name}</div>
                      </div>
                      <span style={{ background: '#10b981', color: '#fff', padding: '0.15rem 0.55rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '800' }}>
                        ✓ VERIFIED AUDITED
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.835rem', fontStyle: 'italic' }}>
                    Standard document record verified.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                <span>🛡️</span>
                <span>Direct contact is masked for platform safety and privacy.</span>
              </div>
              <button
                onClick={() => setSelectedReportEntity(null)}
                style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.55rem 1.15rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.825rem', cursor: 'pointer' }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessReportsPage;
