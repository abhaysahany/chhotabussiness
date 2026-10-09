import React, { useState, useEffect } from 'react';
import {
  getEntityCategories,
  createEntityCategory,
  updateEntityCategory,
  deleteEntityCategory,
} from '../../api/adminEntityService';

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

  const [form, setForm] = useState({
    name: '',
    description: '',
    icon: 'briefcase',
    badge_color: '#6366f1',
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
    if (cat) {
      setEditingCategory(cat);
      setForm({
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || 'briefcase',
        badge_color: cat.badge_color || '#6366f1',
        status: cat.status || 'active',
      });
    } else {
      setEditingCategory(null);
      setForm({
        name: '',
        description: '',
        icon: 'briefcase',
        badge_color: '#6366f1',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateEntityCategory(editingCategory.id, form);
        showSuccess(`Category "${form.name}" updated successfully!`);
      } else {
        await createEntityCategory(form);
        showSuccess(`Category "${form.name}" created successfully!`);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? All linked entity classifications will be updated.`)) return;
    try {
      await deleteEntityCategory(id);
      showSuccess(`Category "${name}" deleted.`);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const colorPresets = ['#6366f1', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

  const filteredCategories = categories.filter((cat) => {
    const matchesStatus = !statusFilter || cat.status === statusFilter;
    const matchesSearch = !searchTerm ||
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalBusinesses = categories.reduce((sum, c) => sum + (c.businesses_count || 0), 0);
  const totalFreelancers = categories.reduce((sum, c) => sum + (c.freelancers_count || 0), 0);

  return (
    <div className="page-content-wrapper">
      {/* Pro Hero Banner */}
      <div className="pro-entity-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
              <span>📁 Part 1: Category Suite</span>
            </div>
            <h1 className="pro-hero-title">Business Entity Categories</h1>
            <p className="pro-hero-subtitle">
              Classify and manage entity domain categories for registered businesses and freelancers.
            </p>
          </div>

          <button className="pro-btn-primary" onClick={() => handleOpenModal()} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            <span>+ Create New Category</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="alert-success" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.875rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.875rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Pro KPI Analytics Grid */}
      <div className="pro-kpi-grid">
        <div className="pro-kpi-card indigo">
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Categories</span>
            <div className="pro-kpi-icon indigo">📁</div>
          </div>
          <div className="pro-kpi-val">{categories.length}</div>
          <div className="pro-kpi-sub">Active classifications</div>
        </div>

        <div className="pro-kpi-card emerald">
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Active Status</span>
            <div className="pro-kpi-icon emerald">✓</div>
          </div>
          <div className="pro-kpi-val">{categories.filter(c => c.status === 'active').length}</div>
          <div className="pro-kpi-sub">Ready for registration</div>
        </div>

        <div className="pro-kpi-card blue" onClick={() => onNavigate && onNavigate('entities-businesses')} style={{ cursor: 'pointer' }}>
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Businesses</span>
            <div className="pro-kpi-icon blue">🏢</div>
          </div>
          <div className="pro-kpi-val">{totalBusinesses}</div>
          <div className="pro-kpi-sub" style={{ color: '#0284c7', fontWeight: '700' }}>View businesses &rarr;</div>
        </div>

        <div className="pro-kpi-card purple" onClick={() => onNavigate && onNavigate('entities-freelancers')} style={{ cursor: 'pointer' }}>
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Freelancers</span>
            <div className="pro-kpi-icon purple">👤</div>
          </div>
          <div className="pro-kpi-val">{totalFreelancers}</div>
          <div className="pro-kpi-sub" style={{ color: '#7c3aed', fontWeight: '700' }}>View freelancers &rarr;</div>
        </div>
      </div>

      {/* Pro Floating Search & Controls Bar */}
      <div className="pro-search-bar">
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '520px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by category name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', borderRadius: '10px' }}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: '160px', borderRadius: '10px' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.825rem',
              cursor: 'pointer',
              background: viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: viewMode === 'grid' ? '#4f46e5' : '#64748b',
              boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            🎴 Grid Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '0.4rem 0.95rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.825rem',
              cursor: 'pointer',
              background: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? '#4f46e5' : '#64748b',
              boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            📋 Data Table
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Loading entity categories...</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="pro-modal-box"
              style={{
                padding: '1.5rem',
                borderTop: `5px solid ${cat.badge_color || '#6366f1'}`,
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: `${cat.badge_color || '#6366f1'}18`,
                        color: cat.badge_color || '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '1.25rem',
                        border: `1px solid ${cat.badge_color || '#6366f1'}30`,
                      }}
                    >
                      {cat.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: '1.3' }}>{cat.name}</h4>
                      <code style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{cat.slug}</code>
                    </div>
                  </div>

                  <span className={`pro-pill-badge ${cat.status === 'active' ? 'active' : 'rejected'}`}>
                    {cat.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.25rem', minHeight: '42px' }}>
                  {cat.description || 'No detailed category description provided.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <span className="badge-connected" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '20px', fontWeight: '600' }}>
                    🏢 {cat.businesses_count || 0} Businesses
                  </span>
                  <span className="badge-connected" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '20px', fontWeight: '600' }}>
                    👤 {cat.freelancers_count || 0} Freelancers
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                  <button className="pro-btn-edit" onClick={() => handleOpenModal(cat)}>
                    ✏️ Edit
                  </button>
                  <button className="pro-btn-delete" onClick={() => handleDelete(cat.id, cat.name)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DATA TABLE VIEW */
        <div className="pro-table-wrapper">
          <div className="table-responsive">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Info</th>
                  <th>Slug</th>
                  <th>Linked Businesses</th>
                  <th>Linked Freelancers</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No categories found matching criteria. Click "+ Create New Category" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: '700', color: '#94a3b8' }}>#{cat.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              backgroundColor: `${cat.badge_color || '#6366f1'}18`,
                              color: cat.badge_color || '#6366f1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '1.1rem',
                            }}
                          >
                            {cat.name.charAt(0)}
                          </span>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{cat.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cat.description || 'No description'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#475569' }}>
                          {cat.slug}
                        </code>
                      </td>
                      <td>
                        <span className="badge-connected" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.3rem 0.65rem', borderRadius: '14px' }}>
                          🏢 {cat.businesses_count || 0} Businesses
                        </span>
                      </td>
                      <td>
                        <span className="badge-connected" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '0.3rem 0.65rem', borderRadius: '14px' }}>
                          👤 {cat.freelancers_count || 0} Freelancers
                        </span>
                      </td>
                      <td>
                        <span className={`pro-pill-badge ${cat.status === 'active' ? 'active' : 'rejected'}`}>
                          {cat.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="pro-btn-edit" onClick={() => handleOpenModal(cat)} style={{ marginRight: '0.4rem' }}>
                          ✏️ Edit
                        </button>
                        <button className="pro-btn-delete" onClick={() => handleDelete(cat.id, cat.name)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="pro-modal-box" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title">
                {editingCategory ? 'Edit Entity Category' : 'Create Entity Category'}
              </h3>
              <button className="pro-modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="pro-modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Legal & Corporate Advisory"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Details about services covered in this category..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Badge Color Preset</label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, badge_color: color })}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: form.badge_color === color ? '2px solid #0f172a' : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      style={{ width: '32px', height: '32px', padding: '2px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                      value={form.badge_color}
                      onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active (Available for Registration)</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pro-modal-footer">
                <button type="button" className="pro-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pro-btn-primary">
                  {editingCategory ? 'Update Category' : 'Save Category'}
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
