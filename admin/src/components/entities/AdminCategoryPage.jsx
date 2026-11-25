import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
  Building2,
  Users,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Edit3,
  Trash2,
  Sparkles,
  ArrowUpRight,
  Check,
  X,
  AlertTriangle,
  Briefcase,
  Layers,
  ShieldCheck,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import {
  getEntityCategories,
  createEntityCategory,
  updateEntityCategory,
  deleteEntityCategory,
} from '../../api/adminEntityService';
import {
  isRequired,
  FieldError,
  getInputErrorStyle,
  extractBackendErrors,
} from '../../utils/validation';
import StatusBadge from '../common/StatusBadge';

function AdminCategoryPage({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // Default to modern Grid view

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: 'briefcase',
    badge_color: '#3569a7',
    status: 'active',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEntityCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories from backend.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleOpenModal = (cat = null) => {
    setFormErrors({});
    setModalError('');
    if (cat) {
      setEditingCategory(cat);
      setForm({
        name: cat.name || '',
        description: cat.description || '',
        icon: cat.icon || 'briefcase',
        badge_color: cat.badge_color || '#3569a7',
        status: cat.status || 'active',
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: '',
        description: '',
        icon: 'briefcase',
        badge_color: '#3569a7',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setModalError('');

    const errors = {};
    if (!isRequired(form.name)) {
      errors.name = 'Category name is required.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters.';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Category name cannot exceed 100 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateEntityCategory(editingCategory.id, { ...form, name: form.name.trim() });
        showSuccess(`Category "${form.name.trim()}" updated successfully!`);
      } else {
        await createEntityCategory({ ...form, name: form.name.trim() });
        showSuccess(`Category "${form.name.trim()}" created successfully!`);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      const backendErrors = extractBackendErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setFormErrors(backendErrors);
      }
      setModalError(err.response?.data?.message || 'Failed to save category. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? All linked entity classifications will be updated.`)) return;
    try {
      await deleteEntityCategory(id);
      showSuccess(`Category "${name}" deleted.`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const colorPresets = ['#3569a7', '#0d9488', '#d97706', '#4f46e5', '#dc2626', '#0891b2', '#7c3aed'];

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesStatus = !statusFilter || cat.status === statusFilter;
      const matchesSearch = !searchTerm ||
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [categories, statusFilter, searchTerm]);

  const totalBusinesses = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.businesses_count || 0), 0);
  }, [categories]);

  const totalFreelancers = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.freelancers_count || 0), 0);
  }, [categories]);

  const activeCategoriesCount = useMemo(() => {
    return categories.filter(c => c.status === 'active').length;
  }, [categories]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d">
            <FolderTree size={32} strokeWidth={2.3} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                ● MASTER CLASSIFICATION SUITE
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                ● {categories.length} Categories Registered
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Business Entity Categories
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Classify and manage entity domain categories for registered businesses and freelancers across the enterprise platform.
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={() => handleOpenModal()}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem' }}
            >
              <Plus size={18} strokeWidth={2.4} />
              <span>Create New Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0', padding: '0.9rem 1.35rem', borderRadius: '14px', fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.65rem', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.08)' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1.5px solid #fecaca', padding: '0.9rem 1.35rem', borderRadius: '14px', fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.65rem', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Categories */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#3569a7',
                  background: 'rgba(53, 105, 167, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● TAXONOMY
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TOTAL CATEGORIES
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <FolderTree size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem' }}>
              {categories.length}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Layers size={13} color="#3569a7" />
              <span>Classifications</span>
            </span>
            <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Directory
            </span>
          </div>
        </div>

        {/* Card 2: Active Status */}
        <div className="adm-kpi-card adm-kpi-card-emerald">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  background: 'rgba(13, 148, 136, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● ONBOARDING
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ACTIVE STATUS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#0d9488' }}>
              {activeCategoriesCount}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>Ready to register</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Operational
            </span>
          </div>
        </div>

        {/* Card 3: Businesses */}
        <div
          className="adm-kpi-card adm-kpi-card-indigo"
          onClick={() => onNavigate && onNavigate('entities-businesses')}
          style={{ cursor: 'pointer' }}
          title="Click to manage linked registered businesses"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#4f46e5',
                  background: 'rgba(79, 70, 229, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● ENTERPRISES
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                BUSINESS ENTITIES
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-indigo" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Building2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#4f46e5' }}>
              {totalBusinesses}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Building2 size={13} color="#4f46e5" />
              <span>Businesses</span>
            </span>
            <span style={{ color: '#4f46e5', fontWeight: 800, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
              <span>View</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </div>

        {/* Card 4: Freelancers */}
        <div
          className="adm-kpi-card adm-kpi-card-amber"
          onClick={() => onNavigate && onNavigate('entities-freelancers')}
          style={{ cursor: 'pointer' }}
          title="Click to manage linked freelancer accounts"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● FREELANCERS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                FREELANCE ACCOUNTS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Users size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {totalFreelancers}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Users size={13} color="#d97706" />
              <span>Contractors</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}>
              <span>View</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Executive Filter & View Switcher Bar */}
      <div className="adm-chart-card" style={{ padding: '0.95rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '560px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="Search category name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#3569a7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.55rem 1.25rem 0.55rem 0.85rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {(searchTerm || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <X size={14} /> Clear Filter
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: '3px', borderRadius: '10px', gap: '3px', border: '1.5px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.42rem 0.95rem',
              borderRadius: '7px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: viewMode === 'grid' ? '#3569a7' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : '#64748b',
              boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <LayoutGrid size={15} />
            <span>Grid Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              padding: '0.42rem 0.95rem',
              borderRadius: '7px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: viewMode === 'table' ? '#3569a7' : 'transparent',
              color: viewMode === 'table' ? '#ffffff' : '#64748b',
              boxShadow: viewMode === 'table' ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <TableIcon size={15} />
            <span>Data Table</span>
          </button>
        </div>
      </div>

      {/* 4. Main Body: Grid Cards or Data Table View */}
      {loading ? (
        <div className="adm-chart-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>Loading entity categories from database...</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        filteredCategories.length === 0 ? (
          <div className="adm-chart-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <FolderPlus size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>No categories found</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
              {searchTerm || statusFilter ? 'Try adjusting your search criteria.' : 'Create your first business entity category to begin.'}
            </p>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={() => handleOpenModal()}
              style={{ display: 'inline-flex', margin: '0 auto' }}
            >
              <Plus size={16} /> Create Category
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.4rem' }}>
            {filteredCategories.map((cat) => {
              const badgeColor = cat.badge_color || '#3569a7';

              return (
                <div
                  key={cat.id}
                  className="adm-chart-card adm-chart-card-glow"
                  style={{
                    borderTop: `4px solid ${badgeColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Top Row: 3D Pod & Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '13px',
                            background: `radial-gradient(135% 135% at 20% 20%, ${badgeColor}ee 0%, ${badgeColor} 65%, #0f172a 100%)`,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1.25rem',
                            flexShrink: 0,
                            boxShadow: `0 8px 18px -3px ${badgeColor}55, inset 0 2px 3px rgba(255,255,255,0.45)`,
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                          }}
                        >
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                            {cat.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '3px' }}>
                            <span className="adm-code-chip">{cat.slug}</span>
                          </div>
                        </div>
                      </div>

                      <StatusBadge status={cat.status} fallback="active" />
                    </div>

                    <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: '0.85rem 0 1.2rem 0', minHeight: '44px' }}>
                      {cat.description || 'No detailed category description provided.'}
                    </p>
                  </div>

                  <div>
                    {/* Linked Metrics Twin Vault */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '1.15rem' }}>
                      <div style={{ background: '#f8fafc', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Building2 size={16} color="#3569a7" />
                        <div>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Businesses</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>{cat.businesses_count || 0}</div>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.55rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Users size={16} color="#7c3aed" />
                        <div>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Freelancers</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>{cat.freelancers_count || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(cat)}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.4rem 0.85rem',
                          color: '#3569a7',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3569a7';
                          e.currentTarget.style.background = '#f0f6ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.background = '#ffffff';
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        style={{
                          background: '#fff',
                          border: '1.5px solid #fecaca',
                          borderRadius: '8px',
                          padding: '0.4rem 0.85rem',
                          color: '#dc2626',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#fecaca';
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* DATA TABLE VIEW */
        <div className="adm-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#cbd5e1', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.9rem 1.15rem' }}>ID</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Category Info</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Slug</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Linked Businesses</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Linked Freelancers</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontWeight: 600 }}>
                      No categories found matching criteria. Click "+ Create New Category" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => {
                    const badgeColor = cat.badge_color || '#3569a7';

                    return (
                      <tr key={cat.id} className="adm-table-row">
                        <td style={{ padding: '0.9rem 1.15rem', fontWeight: 800, color: '#94a3b8' }}>
                          #{cat.id}
                        </td>
                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: `radial-gradient(135% 135% at 20% 20%, ${badgeColor}dd 0%, ${badgeColor} 100%)`,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1rem',
                                flexShrink: 0,
                                boxShadow: `0 4px 10px ${badgeColor}40`,
                              }}
                            >
                              {cat.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                                {cat.name}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cat.description || 'No description provided'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <span className="adm-code-chip">{cat.slug}</span>
                        </td>
                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f0f6ff', border: '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '8px', color: '#1e40af', fontWeight: 800, fontSize: '0.76rem' }}>
                            <Building2 size={13} />
                            <span>{cat.businesses_count || 0} Businesses</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#faf5ff', border: '1px solid #e9d5ff', padding: '0.25rem 0.65rem', borderRadius: '8px', color: '#6b21a8', fontWeight: 800, fontSize: '0.76rem' }}>
                            <Users size={13} />
                            <span>{cat.freelancers_count || 0} Freelancers</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                          <StatusBadge status={cat.status} fallback="active" />
                        </td>
                        <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenModal(cat)}
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '7px',
                                padding: '0.3rem 0.65rem',
                                color: '#3569a7',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id, cat.name)}
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #fecaca',
                                borderRadius: '7px',
                                padding: '0.3rem 0.65rem',
                                color: '#dc2626',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Trash2 size={12} />
                              <span>Del</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Bar */}
          <div style={{ padding: '0.85rem 1.4rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ fontWeight: 700, color: '#334155' }}>
              ● Directory synchronized with MySQL 8.0 schema
            </span>
            <span style={{ fontWeight: 800, color: '#3569a7' }}>
              Showing {filteredCategories.length} of {categories.length} Categories
            </span>
          </div>
        </div>
      )}

      {/* 5. CREATE / EDIT CATEGORY MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.68)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '22px', border: '1.5px solid #cbd5e1', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.4rem 1.6rem', borderBottom: '1px solid #e2e8f0', background: 'radial-gradient(circle at 95% 8%, rgba(53, 105, 167, 0.06) 0%, #ffffff 70%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
                  <FolderTree size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingCategory ? 'Edit Entity Category' : 'Create Entity Category'}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                    Configure domain classifications for businesses &amp; freelancers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#64748b', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ padding: '1.5rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {modalError && (
                  <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Legal & Corporate Advisory"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                      setModalError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      ...getInputErrorStyle(formErrors.name),
                    }}
                  />
                  <FieldError error={formErrors.name} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Description
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Details about services & offerings covered in this category..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                    Badge Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {colorPresets.map((color) => {
                      const isSelected = form.badge_color === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setForm({ ...form, badge_color: color })}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: isSelected ? '3px solid #0f172a' : '2px solid rgba(255,255,255,0.8)',
                            boxShadow: isSelected ? '0 0 0 2px #3569a7' : '0 2px 5px rgba(0,0,0,0.12)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </button>
                      );
                    })}
                    <input
                      type="color"
                      title="Choose custom color"
                      style={{ width: '34px', height: '34px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '50%' }}
                      value={form.badge_color}
                      onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="active">Active (Available for Registration)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1rem 1.6rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.6rem 1.25rem',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="adm-hero-btn-primary"
                  style={{ padding: '0.6rem 1.45rem', fontSize: '0.82rem' }}
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategoryPage;
