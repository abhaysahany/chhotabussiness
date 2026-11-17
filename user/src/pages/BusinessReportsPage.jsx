import React, { useState, useEffect } from 'react';
import {
  Building2,
  UserCheck,
  FileCheck2,
  FolderKanban,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Star,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Grid,
  List,
  X,
  FileText,
  Briefcase,
  Layers,
  ChevronRight,
  Eye,
  Check,
  RotateCcw,
  Cpu,
  Scale,
  Calculator
} from 'lucide-react';
import {
  getPublicCategories,
  getPublicBusinesses,
  getPublicFreelancers,
} from '../api/publicEntityService';
import { maskEmail, maskPhone, formatNumberIN } from '../utils/formatters';

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

  // Prevent background scrolling while modal is open & restore on close
  useEffect(() => {
    if (selectedReportEntity) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedReportEntity]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedReportEntity) {
        setSelectedReportEntity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReportEntity]);

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
      display_image: b.logo_url || '',
      reg_identifier: b.registration_no || 'N/A',
      verified_status: 'Active',
    })),
    ...freelancers.map((f) => ({
      ...f,
      entity_type: 'freelancer',
      display_title: f.name,
      display_subtitle: f.title || 'Freelance Professional',
      display_image: f.avatar_url || '',
      reg_identifier: f.hourly_rate || '₹850/hr',
      verified_status: 'Active',
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
      const nameMatch = item.display_title?.toLowerCase().includes(query);
      const subMatch = item.display_subtitle?.toLowerCase().includes(query);
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
      return (b.rating || 0) - (a.rating || 0);
    }
    return (b.id || 0) - (a.id || 0); // Newest first
  });

  const totalBusinessesCount = businesses.length;
  const totalFreelancersCount = freelancers.length;
  const totalVerifiedCount = combinedEntities.filter((e) => e.verification_status === 'verified').length;

  const getCategoryIconMeta = (catName = '') => {
    const lower = catName.toLowerCase();
    if (lower.includes('financial') || lower.includes('consulting')) {
      return {
        icon: <Briefcase size={18} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        shadow: '0 6px 14px -2px rgba(16, 185, 129, 0.45)',
      };
    }
    if (lower.includes('marketing') || lower.includes('ad')) {
      return {
        icon: <Sparkles size={18} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        shadow: '0 6px 14px -2px rgba(139, 92, 246, 0.45)',
      };
    }
    if (lower.includes('it') || lower.includes('software') || lower.includes('dev')) {
      return {
        icon: <Cpu size={18} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
        shadow: '0 6px 14px -2px rgba(6, 182, 212, 0.45)',
      };
    }
    if (lower.includes('legal') || lower.includes('corporate')) {
      return {
        icon: <Scale size={18} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        shadow: '0 6px 14px -2px rgba(245, 158, 11, 0.45)',
      };
    }
    if (lower.includes('tax') || lower.includes('accounting')) {
      return {
        icon: <Calculator size={18} strokeWidth={2.4} />,
        bg: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
        shadow: '0 6px 14px -2px rgba(244, 63, 94, 0.45)',
      };
    }
    return {
      icon: <FolderKanban size={18} strokeWidth={2.4} />,
      bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      shadow: '0 6px 14px -2px rgba(37, 99, 235, 0.45)',
    };
  };

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Building2 size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Verified Enterprise Directory • Platform Audited</span>
            </div>
            <h1 className="van-catalog-hero-title">
              Business & Freelancer Directory Reports
            </h1>
            <p className="van-catalog-hero-desc">
              Browse verified corporate enterprises, compliance audit reports, and certified freelancer credentials across category domains.
            </p>
          </div>
        </div>

        {/* Right Stats Chips & Action Button Area */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.25rem',
            flexShrink: 0,
          }}
        >
          {/* Top Row: Stats Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val">{formatNumberIN(totalBusinessesCount)}</div>
              <div className="van-catalog-stat-chip-lbl">Businesses</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#C084FC' }}>
                {formatNumberIN(totalFreelancersCount)}
              </div>
              <div className="van-catalog-stat-chip-lbl">Freelancers</div>
            </div>
            <div className="van-catalog-stat-chip">
              <div className="van-catalog-stat-chip-val" style={{ color: '#34D399' }}>
                {formatNumberIN(totalVerifiedCount)}
              </div>
              <div className="van-catalog-stat-chip-lbl">100% Audited</div>
            </div>
          </div>

          {/* Bottom Row: 3D Refresh Action Button */}
          <button
            type="button"
            onClick={fetchDirectoryData}
            className="van-btn-share-3d"
            style={{
              padding: '0.72rem 1.6rem',
              height: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderBottom: '3px solid #1E40AF',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px -3px rgba(37, 99, 235, 0.45)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title="Refresh live directory reports from database"
          >
            <RotateCcw size={16} strokeWidth={2.4} />
            <span>Refresh Directory</span>
          </button>
        </div>
      </div>

      {/* Industry Domains & Specialized Sectors (3D Exploration Grid) */}
      <div style={{ marginBottom: '2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={17} strokeWidth={2.4} />
            </div>
            <strong style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Industry Domains & Specialized Sectors
            </strong>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
            Select any industry sector to filter enterprise business listings and freelance experts
          </span>
        </div>

        <div className="van-sector-cards-grid">
          {/* Card: All Categories */}
          <div
            onClick={() => setCategoryFilter('')}
            className={`van-sector-card-3d ${categoryFilter === '' ? 'active' : ''}`}
            title="Show all domains & sectors"
          >
            {categoryFilter === '' && <div className="van-sector-card-top-shimmer" />}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div
                className="van-sector-icon-pod"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  boxShadow: '0 6px 14px -2px rgba(37, 99, 235, 0.45)',
                  animationDelay: '0s',
                }}
              >
                <Layers size={18} strokeWidth={2.4} />
              </div>
              <span className="van-sector-count-badge">
                {combinedEntities.length}
              </span>
            </div>
            <div>
              <strong style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', display: 'block', lineHeight: 1.25 }}>
                All Categories
              </strong>
              <span style={{ fontSize: '0.72rem', color: categoryFilter === '' ? '#2563EB' : '#94A3B8', fontWeight: 750, marginTop: '0.2rem', display: 'block' }}>
                {categoryFilter === '' ? '● Active Filter' : 'All Listings'}
              </span>
            </div>
          </div>

          {/* Dynamic Category Cards */}
          {categories.map((cat, idx) => {
            const isSelected = String(categoryFilter) === String(cat.id);
            const catCount = combinedEntities.filter((e) => String(e.entity_category_id) === String(cat.id)).length;
            const meta = getCategoryIconMeta(cat.name);

            return (
              <div
                key={cat.id}
                onClick={() => setCategoryFilter(String(cat.id))}
                className={`van-sector-card-3d ${isSelected ? 'active' : ''}`}
                title={`Filter by ${cat.name}`}
              >
                {isSelected && <div className="van-sector-card-top-shimmer" />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div
                    className="van-sector-icon-pod"
                    style={{
                      background: meta.bg,
                      boxShadow: meta.shadow,
                      animationDelay: `${(idx + 1) * 0.25}s`,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <span className="van-sector-count-badge">
                    {catCount}
                  </span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', display: 'block', lineHeight: 1.25 }}>
                    {cat.name}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: isSelected ? '#2563EB' : '#94A3B8', fontWeight: 750, marginTop: '0.2rem', display: 'block' }}>
                    {isSelected ? '● Active Filter' : 'Filter Sector'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Signature 3D KPI Cards Grid (4 in a row Desktop, 2x2 Tablet, 1 col Mobile) */}
      <div className="van-business-kpi-grid">
        {/* Card 1: Registered Businesses */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#2563EB',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Registered Businesses
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-blue"
              style={{ animationDelay: '0s' }}
              title="Corporate Entities"
            >
              <Building2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value">
            {formatNumberIN(totalBusinessesCount)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Enterprise corporate entities</span>
            <span className="van-card-badge-pill blue">
              Corporate L1
            </span>
          </div>
        </div>

        {/* Card 2: Verified Freelancers */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #8B5CF6, #6D28D9)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#7C3AED',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Verified Freelancers
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-purple"
              style={{ animationDelay: '0.4s' }}
              title="Skilled Professional Experts"
            >
              <UserCheck size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#6D28D9' }}>
            {formatNumberIN(totalFreelancersCount)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Verified skilled experts</span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              Talent Pool
            </span>
          </div>
        </div>

        {/* Card 3: Verified Reports */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#059669',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Verified Reports
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-emerald"
              style={{ animationDelay: '0.8s' }}
              title="100% Platform Document Verified"
            >
              <FileCheck2 size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#047857' }}>
            {formatNumberIN(totalVerifiedCount)}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>100% Document Verified</span>
            <span className="van-card-badge-pill emerald">
              Audited
            </span>
          </div>
        </div>

        {/* Card 4: Domain Categories */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #F59E0B, #D97706)' }} />
          <div className="van-stat-card-top" style={{ alignItems: 'flex-start' }}>
            <span
              className="van-stat-card-title"
              style={{
                color: '#D97706',
                whiteSpace: 'normal',
                lineHeight: 1.3,
                fontSize: '0.78rem',
              }}
            >
              Domain Categories
            </span>
            <div
              className="van-3d-kpi-icon van-3d-icon-amber"
              style={{ animationDelay: '1.2s' }}
              title="Industry Classifications"
            >
              <FolderKanban size={22} strokeWidth={2.4} />
            </div>
          </div>
          <div className="van-stat-card-value" style={{ color: '#B45309' }}>
            {categories.length}
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>Industry classifications</span>
            <span className="van-card-badge-pill amber" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              Sectors
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar (3D Design) */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          padding: '1.15rem 1.45rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
          marginBottom: '1.75rem',
        }}
      >
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
                padding: '0.62rem 0.85rem 0.62rem 2.45rem',
                fontSize: '0.84rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                background: '#F8FAFC',
                color: '#0F172A',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.background = '#FFFFFF'; }}
              onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.background = '#F8FAFC'; }}
            />
            <Search
              size={16}
              color="#94A3B8"
              strokeWidth={2.4}
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          {/* Filter Selects Row */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Entity Type Filter */}
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              style={{
                padding: '0.6rem 0.95rem',
                fontSize: '0.84rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Entity Types</option>
              <option value="business">🏢 Businesses Only</option>
              <option value="freelancer">👤 Freelancers Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.6rem 0.95rem',
                fontSize: '0.84rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
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
              style={{
                padding: '0.6rem 0.95rem',
                fontSize: '0.84rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="verified">✓ Verified Only</option>
              <option value="featured">🌟 Featured Only</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.6rem 0.95rem',
                fontSize: '0.84rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                outline: 'none',
                background: '#FFFFFF',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="rating">Sort: Highest Rated</option>
            </select>
          </div>

          {/* View Switcher: 3D Toggle Pills */}
          <div
            style={{
              display: 'inline-flex',
              gap: '0.3rem',
              background: '#F1F5F9',
              padding: '0.28rem',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.42rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? '#2563EB' : '#64748B',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Grid size={14} />
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.42rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'table' ? '#2563EB' : '#64748B',
                boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <List size={14} />
              <span>Report Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Directory Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748B', fontWeight: '700' }}>Loading entity directory reports...</p>
        </div>
      ) : error ? (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '1.25rem', borderRadius: '14px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: '700' }}>{error}</p>
        </div>
      ) : sortedEntities.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '4.5rem 2rem',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
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
            <Search size={30} strokeWidth={2.2} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: '0 0 0.5rem 0' }}>
            No Entity Reports Found
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            We could not find any matching business listings or freelancer records. Try adjusting your search query, type filter, or category selection.
          </p>
          <button
            type="button"
            onClick={() => { setSearchTerm(''); setCategoryFilter(''); setEntityTypeFilter('all'); setStatusFilter('all'); }}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.45rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            }}
          >
            <RotateCcw size={15} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {sortedEntities.map((item) => (
            <div
              key={`${item.entity_type}-${item.id}`}
              className="van-directory-card-3d"
            >
              {/* Top Accent Shimmer Line */}
              <div
                className="van-directory-card-shimmer"
                style={{
                  background: item.entity_type === 'business'
                    ? 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'
                    : 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
                }}
              />

              <div>
                {/* Header Row: Avatar, Title, Entity Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', minWidth: 0 }}>
                    {item.display_image ? (
                      <img
                        src={item.display_image}
                        alt={item.display_title}
                        className={`van-directory-card-avatar ${item.entity_type}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`van-directory-card-avatar ${item.entity_type}`}
                      style={{
                        display: item.display_image ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: item.entity_type === 'business'
                          ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                          : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      {item.display_title ? item.display_title.charAt(0).toUpperCase() : 'E'}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <h4
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            color: '#0F172A',
                            margin: 0,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={item.display_title}
                        >
                          {item.display_title}
                        </h4>
                        {item.verification_status === 'verified' && (
                          <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: item.entity_type === 'freelancer' ? '#6D28D9' : '#64748B',
                          fontWeight: 650,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '0.15rem',
                        }}
                      >
                        {item.display_subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Entity Type Badge */}
                  <span
                    className={`van-card-badge-pill ${item.entity_type === 'business' ? 'blue' : 'purple'}`}
                    style={{
                      background: item.entity_type === 'business' ? '#EFF6FF' : '#F5F3FF',
                      color: item.entity_type === 'business' ? '#1D4ED8' : '#6D28D9',
                      border: item.entity_type === 'business' ? '1px solid #BFDBFE' : '1px solid #DDD6FE',
                      flexShrink: 0,
                    }}
                  >
                    {item.entity_type}
                  </span>
                </div>

                {/* Category & Featured Pills */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                  <span
                    style={{
                      backgroundColor: item.category?.badge_color ? `${item.category.badge_color}16` : '#EFF6FF',
                      color: item.category?.badge_color || '#1E40AF',
                      border: `1px solid ${item.category?.badge_color ? `${item.category.badge_color}35` : '#BFDBFE'}`,
                      padding: '0.22rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.74rem',
                      fontWeight: 750,
                    }}
                  >
                    {item.category?.name || 'General Domain'}
                  </span>

                  {item.featured && (
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.74rem',
                        fontWeight: 750,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />
                      <span>Featured</span>
                    </span>
                  )}
                </div>

                {/* Description Bio */}
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#475569',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    minHeight: '38px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.description || item.bio || 'Verified entity operating within classification standards.'}
                </p>
              </div>

              <div>
                {/* Details Bar */}
                <div
                  style={{
                    background: '#F8FAFC',
                    padding: '0.7rem 0.95rem',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 600 }}>ID/Rate:</span>{' '}
                    <code style={{ color: '#0F172A', fontWeight: 800, fontFamily: 'monospace' }}>
                      {item.reg_identifier}
                    </code>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 750, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={13} />
                    <span>{item.documents ? item.documents.length : 0} Docs Audited</span>
                  </div>
                </div>

                {/* 3D Action Button */}
                <button
                  type="button"
                  onClick={() => setSelectedReportEntity(item)}
                  className="van-btn-view-report-3d"
                >
                  <Eye size={15} />
                  <span>View Detailed Entity Report</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DETAILED REPORT TABLE VIEW */
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
            padding: '1.25rem',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', textTransform: 'uppercase', fontSize: '0.74rem', fontWeight: 800, color: '#475569', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Entity & Type</th>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>Owner / Title</th>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>Registration / Rate</th>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>Audited Docs</th>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntities.map((item) => (
                <tr key={`${item.entity_type}-${item.id}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.95rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.display_image ? (
                        <img
                          src={item.display_image}
                          alt={item.display_title}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: item.entity_type === 'freelancer' ? '50%' : '10px',
                            objectFit: 'cover',
                            border: '1.5px solid #E2E8F0',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: item.entity_type === 'freelancer' ? '50%' : '10px',
                            background: item.entity_type === 'business' ? '#2563EB' : '#7C3AED',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.display_title?.charAt(0) || 'E'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{item.display_title}</span>
                          {item.verification_status === 'verified' && (
                            <CheckCircle2 size={14} color="#10B981" />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            fontWeight: 750,
                            color: item.entity_type === 'business' ? '#1D4ED8' : '#7C3AED',
                          }}
                        >
                          {item.entity_type}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.95rem 1rem' }}>
                    <span
                      style={{
                        background: `${item.category?.badge_color || '#2563EB'}15`,
                        color: item.category?.badge_color || '#2563EB',
                        border: `1px solid ${item.category?.badge_color || '#2563EB'}30`,
                        padding: '0.22rem 0.65rem',
                        borderRadius: '12px',
                        fontWeight: 750,
                        fontSize: '0.75rem',
                      }}
                    >
                      {item.category?.name || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '0.95rem 1rem', color: '#334155', fontWeight: 600 }}>
                    {item.display_subtitle}
                  </td>
                  <td style={{ padding: '0.95rem 1rem' }}>
                    <code style={{ background: '#F8FAFC', padding: '0.25rem 0.55rem', borderRadius: '6px', border: '1px solid #E2E8F0', color: '#0F172A', fontWeight: 700, fontFamily: 'monospace' }}>
                      {item.reg_identifier}
                    </code>
                  </td>
                  <td style={{ padding: '0.95rem 1rem' }}>
                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.22rem 0.65rem', borderRadius: '12px', fontWeight: 750, fontSize: '0.74rem' }}>
                      📄 {item.documents ? item.documents.length : 0} Verified Docs
                    </span>
                  </td>
                  <td style={{ padding: '0.95rem 1rem' }}>
                    <span
                      className="van-card-badge-pill"
                      style={{
                        background: item.verification_status === 'verified' ? '#DCFCE7' : '#FEF3C7',
                        color: item.verification_status === 'verified' ? '#15803D' : '#B45309',
                        border: item.verification_status === 'verified' ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                      }}
                    >
                      {item.verification_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.95rem 1rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReportEntity(item)}
                      style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.45rem 0.95rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      }}
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
          className="business-details-overlay"
          onClick={() => setSelectedReportEntity(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="business-details-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
            overflow: 'hidden',
          }}
        >
          <div
            className="business-details-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#FFFFFF',
              borderRadius: '22px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              border: '1px solid #E2E8F0',
              width: 'min(900px, 100%)',
              maxHeight: 'calc(100dvh - 48px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header — Fixed / Sticky with Signature Dark Gradient */}
            <div
              className="business-details-header"
              style={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
                padding: '1.35rem 1.85rem',
                color: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 0 }}>
                {selectedReportEntity.display_image ? (
                  <img
                    src={selectedReportEntity.display_image}
                    alt={selectedReportEntity.display_title}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: selectedReportEntity.entity_type === 'freelancer' ? '50%' : '14px',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.25)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: selectedReportEntity.entity_type === 'freelancer' ? '50%' : '14px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0,
                    }}
                  >
                    🏢
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3
                      id="business-details-title"
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        margin: 0,
                        wordBreak: 'break-word',
                      }}
                    >
                      {selectedReportEntity.display_title}
                    </h3>
                    <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                      ✓ VERIFIED REPORT
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem', wordBreak: 'break-word' }}>
                    {selectedReportEntity.display_subtitle}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="business-details-close-btn"
                onClick={() => setSelectedReportEntity(null)}
                aria-label="Close Business Details Modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 0.15s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body — Independently Scrollable */}
            <div
              className="business-details-body"
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '1.65rem 1.85rem',
              }}
            >
              {/* Category & Status Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <span style={{ background: `${selectedReportEntity.category?.badge_color || '#2563EB'}18`, color: selectedReportEntity.category?.badge_color || '#2563EB', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: 750, fontSize: '0.8rem' }}>
                  📁 Domain: {selectedReportEntity.category?.name || 'General Domain'}
                </span>
                <span style={{ background: '#F1F5F9', color: '#475569', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: 750, fontSize: '0.8rem' }}>
                  🏷️ Entity Type: {selectedReportEntity.entity_type.toUpperCase()}
                </span>
                {selectedReportEntity.featured && (
                  <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.3rem 0.75rem', borderRadius: '16px', fontWeight: 750, fontSize: '0.8rem' }}>
                    🌟 Featured Advertisement
                  </span>
                )}
              </div>

              {/* Bio / Description */}
              <div style={{ background: '#F8FAFC', padding: '1.15rem 1.35rem', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.45rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview & Bio</h4>
                <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                  {selectedReportEntity.description || selectedReportEntity.bio || 'Verified business/freelancer entity operating within platform guidelines.'}
                </p>
              </div>

              {/* Compliance & Registration Info Grid */}
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration & Compliance Audit</h4>
              <div className="business-details-compliance-grid" style={{ marginBottom: '1.5rem' }}>
                <div style={{ background: '#FFFFFF', padding: '0.95rem', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 750 }}>REGISTRATION / GST NO.</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>{selectedReportEntity.reg_identifier}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '0.95rem', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 750 }}>EMAIL ADDRESS (PROTECTED)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#2563EB', marginTop: '0.25rem', wordBreak: 'break-all' }}>{maskEmail(selectedReportEntity.email)}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '0.95rem', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 750 }}>PHONE CONTACT (PROTECTED)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#0F172A', marginTop: '0.25rem', wordBreak: 'break-all' }}>{maskPhone(selectedReportEntity.phone)}</div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '0.95rem', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 750 }}>WEBSITE / PORTFOLIO</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#0284C7', marginTop: '0.25rem', wordBreak: 'break-all' }}>{selectedReportEntity.website || selectedReportEntity.portfolio_link || 'N/A'}</div>
                </div>
              </div>

              {/* Verified Documents Audit Trail */}
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Document Attachments</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {selectedReportEntity.documents && selectedReportEntity.documents.length > 0 ? (
                  selectedReportEntity.documents.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', background: '#ECFDF5', borderRadius: '12px', border: '1px solid #A7F3D0', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 750, color: '#065F46', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <FileText size={16} />
                          <span>{doc.title}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '0.15rem' }}>File Record: {doc.file_name}</div>
                      </div>
                      <span style={{ background: '#10B981', color: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.74rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        ✓ VERIFIED AUDITED
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Standard document record verified.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions — Pinned / Fixed */}
            <div
              className="business-details-footer"
              style={{
                flexShrink: 0,
                padding: '1.15rem 1.85rem',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 650 }}>
                <ShieldCheck size={16} color="#2563EB" />
                <span>Direct contact is masked for platform safety and privacy compliance.</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportEntity(null)}
                style={{
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1.5px solid #CBD5E1',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 750,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
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
