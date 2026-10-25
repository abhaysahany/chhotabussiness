import React, { useState, useEffect } from 'react';
import {
  getEntityCategories,
  getBusinessEntities,
  registerBusinessEntity,
  updateBusinessEntity,
  updateBusinessStatus,
  deleteBusinessEntity,
} from '../../api/adminEntityService';

function AdminBusinessPage({ onNavigate }) {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & UI States
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [viewingDocs, setViewingDocs] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    entity_category_id: '',
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    registration_no: '',
    description: '',
    logo_url: '',
    website: '',
    verification_status: 'verified',
    featured: true,
    documents: [],
  });

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bizRes, catRes] = await Promise.all([
        getBusinessEntities(),
        getEntityCategories(),
      ]);
      setBusinesses(bizRes.businesses || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load registered business entities from backend.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleOpenModal = (biz = null) => {
    if (biz) {
      setEditingBusiness(biz);
      setForm({
        entity_category_id: biz.entity_category_id || (categories[0]?.id || ''),
        name: biz.name,
        owner_name: biz.owner_name,
        email: biz.email,
        phone: biz.phone,
        password: '', // Leave blank if not updating password
        address: biz.address || '',
        registration_no: biz.registration_no || '',
        description: biz.description || '',
        logo_url: biz.logo_url || '',
        website: biz.website || '',
        verification_status: biz.verification_status || 'verified',
        featured: biz.featured !== undefined ? biz.featured : true,
        documents: biz.documents && Array.isArray(biz.documents) ? biz.documents : [],
      });
    } else {
      setEditingBusiness(null);
      setForm({
        entity_category_id: categories[0]?.id || '',
        name: '',
        owner_name: '',
        email: '',
        phone: '',
        password: generateRandomPassword(),
        address: '',
        registration_no: '',
        description: '',
        logo_url: '',
        website: '',
        verification_status: 'verified',
        featured: true,
        documents: [],
      });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.entity_category_id) {
      alert('Please select a Business Category');
      return;
    }

    try {
      if (editingBusiness) {
        await updateBusinessEntity(editingBusiness.id, form);
        showSuccess(`Business "${form.name}" updated successfully!`);
      } else {
        await registerBusinessEntity(form);
        showSuccess(`Business "${form.name}" registered successfully with document records!`);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save business entity');
    }
  };

  const handleToggleFeatured = async (biz) => {
    try {
      await updateBusinessStatus(biz.id, { featured: !biz.featured });
      showSuccess(`Business "${biz.name}" advertisement status updated.`);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete registered business entity "${name}"?`)) return;
    try {
      await deleteBusinessEntity(id);
      showSuccess(`Business "${name}" deleted.`);
      fetchData();
    } catch (err) {
      alert('Failed to delete business entity');
    }
  };

  const handleAddDoc = () => {
    setForm({
      ...form,
      documents: [
        ...form.documents,
        { title: 'Additional Business Document', file_name: 'doc_file.pdf', url: 'https://via.placeholder.com/400x300?text=Uploaded+Doc', status: 'verified' },
      ],
    });
  };

  const handleRemoveDoc = (index) => {
    setForm({
      ...form,
      documents: form.documents.filter((_, i) => i !== index),
    });
  };

  const filteredBusinesses = businesses.filter((b) => {
    const matchesCat = !selectedCategoryFilter || String(b.entity_category_id) === String(selectedCategoryFilter);
    const matchesStatus = !statusFilter || b.verification_status === statusFilter;
    const matchesSearch = !searchTerm ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.registration_no && b.registration_no.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="page-content-wrapper">
      {/* Pro Hero Banner */}
      <div className="pro-entity-hero" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0f172a 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#bae6fd', marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
              <span>🏢 Part 2: Business Registration</span>
            </div>
            <h1 className="pro-hero-title">Registered Business Entities</h1>
            <p className="pro-hero-subtitle">
              Manage enterprise registrations, verify GST/ROC certificates, and publish advertisements.
            </p>
          </div>

          <button className="pro-btn-primary" onClick={() => handleOpenModal()} style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)', padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            <span>+ Register New Business</span>
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

      {/* Pro KPI Metrics Grid */}
      <div className="pro-kpi-grid">
        <div className="pro-kpi-card blue">
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Registered</span>
            <div className="pro-kpi-icon blue">🏢</div>
          </div>
          <div className="pro-kpi-val">{businesses.length}</div>
          <div className="pro-kpi-sub">Total business records</div>
        </div>

        <div className="pro-kpi-card emerald">
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Verified</span>
            <div className="pro-kpi-icon emerald">✓</div>
          </div>
          <div className="pro-kpi-val">{businesses.filter(b => b.verification_status === 'verified').length}</div>
          <div className="pro-kpi-sub">Active & compliant</div>
        </div>

        <div className="pro-kpi-card amber">
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Pending</span>
            <div className="pro-kpi-icon amber">⌛</div>
          </div>
          <div className="pro-kpi-val">{businesses.filter(b => b.verification_status === 'pending').length}</div>
          <div className="pro-kpi-sub">Document review needed</div>
        </div>

        <div className="pro-kpi-card purple">
          <div className="pro-kpi-header">
            <span className="pro-kpi-label">Live Ads</span>
            <div className="pro-kpi-icon purple">🌟</div>
          </div>
          <div className="pro-kpi-val">{businesses.filter(b => b.featured).length}</div>
          <div className="pro-kpi-sub">Portal advertisements</div>
        </div>
      </div>

      {/* Floating Filter Bar */}
      <div className="pro-search-bar">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by Business Name, Owner, Email or GST..."
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
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{ maxWidth: '220px', borderRadius: '10px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: '160px', borderRadius: '10px' }}
          >
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button className="pro-btn-primary" onClick={() => handleOpenModal()} style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
          + Register New Business
        </button>
      </div>

      {/* Main Enterprise Data Table */}
      <div className="pro-table-wrapper">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748b', fontWeight: '500' }}>Loading business entities...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>Business Entity</th>
                  <th>Category (1:1)</th>
                  <th>Contact Details</th>
                  <th>GST / Reg No.</th>
                  <th>Attached Documents</th>
                  <th>Advertisement</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No businesses found matching criteria. Click "+ Register New Business" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((biz) => (
                    <tr key={biz.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img
                            src={biz.logo_url || 'https://via.placeholder.com/60'}
                            alt={biz.name}
                            style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                          />
                          <div>
                            <div style={{ fontWeight: '800', color: '#0f172a' }}>{biz.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Owner: {biz.owner_name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: biz.category?.badge_color ? `${biz.category.badge_color}18` : '#e0e7ff',
                            color: biz.category?.badge_color || '#3730a3',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            display: 'inline-block',
                          }}
                        >
                          {biz.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>{biz.email}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{biz.phone}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.25rem 0.55rem', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }}>
                          {biz.registration_no || 'N/A'}
                        </code>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="pro-doc-chip"
                          onClick={() => setViewingDocs(biz)}
                        >
                          📄 {biz.documents ? biz.documents.length : 0} Documents
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`pro-ad-toggle ${biz.featured ? 'on' : 'off'}`}
                          onClick={() => handleToggleFeatured(biz)}
                        >
                          {biz.featured ? '🌟 Active Ad' : 'Off'}
                        </button>
                      </td>
                      <td>
                        <span className={`pro-pill-badge ${biz.verification_status === 'verified' ? 'active' : biz.verification_status === 'pending' ? 'pending' : 'rejected'}`}>
                          {biz.verification_status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="pro-btn-edit" onClick={() => handleOpenModal(biz)} style={{ marginRight: '0.4rem' }}>
                          ✏️ Edit
                        </button>
                        <button className="pro-btn-delete" onClick={() => handleDelete(biz.id, biz.name)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTER / EDIT BUSINESS MODAL */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="pro-modal-box" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title">
                {editingBusiness ? 'Edit Business Entity Details' : 'Register Business Entity with Documents'}
              </h3>
              <button className="pro-modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="pro-modal-body">
                {/* Category Assignment */}
                <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label">
                    Assign Business Category (One Business &rarr; One Category) *
                  </label>
                  <select
                    className="form-input"
                    required
                    value={form.entity_category_id}
                    onChange={(e) => setForm({ ...form, entity_category_id: e.target.value })}
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">Business Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Apex Financial Advisory Pvt Ltd"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Owner / Director Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={form.owner_name}
                      onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="contact@apexfinance.in"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Entity Portal Login Password Field */}
                <div style={{ marginBottom: '0.85rem', background: '#f0f9ff', padding: '0.75rem 0.85rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0, color: '#0369a1', fontWeight: '700' }}>
                      🔑 Entity Portal Login Password {editingBusiness ? '(Leave blank to keep unchanged)' : '*'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, password: generateRandomPassword() })}
                      style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      ⚡ Auto Generate
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      required={!editingBusiness && !form.password}
                      placeholder={editingBusiness ? 'Enter new password to update...' : 'Set password for Entity Panel login (min 6 chars)'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      style={{ paddingRight: '4.5rem', background: '#ffffff' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.72rem', color: '#0284c7' }}>
                    This password allows the business owner to log in to the <strong>Entity Panel</strong> using their registered email.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label className="form-label">GST / Registration No. <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.75rem' }}>(Optional)</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="GSTIN07AAACA1234F1Z5 (Optional)"
                      value={form.registration_no}
                      onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Website URL <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.75rem' }}>(Optional)</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://apexfinance.com (Optional)"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Business Overview</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Describe company products, services, and specializations..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>

                {/* Status and Advertisement Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Verification Status</label>
                    <select
                      className="form-input"
                      value={form.verification_status}
                      onChange={(e) => setForm({ ...form, verification_status: e.target.value })}
                    >
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '700', color: '#0f172a', fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      />
                      <span>Show in User Advertisements (Featured)</span>
                    </label>
                  </div>
                </div>

                {/* Document Attachments Manager (Optional) */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.875rem', margin: 0 }}>Business Verification Documents</h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>GST Certificate & Incorporation Proof are completely optional</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="pro-btn-secondary"
                        onClick={() => setForm({
                          ...form,
                          documents: [...form.documents, { title: 'GST Registration Certificate', file_name: 'gst_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=GST+Certificate', status: 'verified' }]
                        })}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                      >
                        + GST Certificate
                      </button>
                      <button
                        type="button"
                        className="pro-btn-secondary"
                        onClick={() => setForm({
                          ...form,
                          documents: [...form.documents, { title: 'Incorporation Document Proof', file_name: 'incorporation_doc.pdf', url: 'https://via.placeholder.com/400x300?text=Incorporation+Doc', status: 'verified' }]
                        })}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                      >
                        + Incorporation Doc
                      </button>
                      <button
                        type="button"
                        className="pro-btn-secondary"
                        onClick={handleAddDoc}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                      >
                        + Custom Doc
                      </button>
                    </div>
                  </div>

                  {form.documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8rem', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                      <span>No documents attached. Documents are optional. Click buttons above to add if needed.</span>
                    </div>
                  ) : (
                    form.documents.map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem', background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 2, fontSize: '0.8rem' }}
                          placeholder="Document Title (e.g. GST Certificate)"
                          value={doc.title}
                          onChange={(e) => {
                            const updated = [...form.documents];
                            updated[idx].title = e.target.value;
                            setForm({ ...form, documents: updated });
                          }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 2, fontSize: '0.8rem' }}
                          placeholder="File Name"
                          value={doc.file_name}
                          onChange={(e) => {
                            const updated = [...form.documents];
                            updated[idx].file_name = e.target.value;
                            setForm({ ...form, documents: updated });
                          }}
                        />
                        <select
                          className="form-input"
                          style={{ flex: 1, fontSize: '0.8rem' }}
                          value={doc.status}
                          onChange={(e) => {
                            const updated = [...form.documents];
                            updated[idx].status = e.target.value;
                            setForm({ ...form, documents: updated });
                          }}
                        >
                          <option value="verified">Verified</option>
                          <option value="pending">Pending</option>
                        </select>
                        <button type="button" onClick={() => handleRemoveDoc(idx)} title="Remove document" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pro-modal-footer">
                <button type="button" className="pro-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pro-btn-primary" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                  {editingBusiness ? 'Update Business Entity' : 'Complete Business Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEWER MODAL */}
      {viewingDocs && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="pro-modal-box" style={{ width: '100%', maxWidth: '520px' }}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title">
                Attached Documents: {viewingDocs.name}
              </h3>
              <button className="pro-modal-close-btn" onClick={() => setViewingDocs(null)}>×</button>
            </div>

            <div className="pro-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {viewingDocs.documents && viewingDocs.documents.length > 0 ? (
                  viewingDocs.documents.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.875rem' }}>📄 {doc.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>File: {doc.file_name}</div>
                      </div>
                      <span className="pro-pill-badge active" style={{ fontSize: '0.725rem' }}>
                        ✓ {doc.status || 'Verified'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>No documents attached.</p>
                )}
              </div>
            </div>

            <div className="pro-modal-footer">
              <button className="pro-btn-primary" onClick={() => setViewingDocs(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBusinessPage;
