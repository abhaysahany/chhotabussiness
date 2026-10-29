import React, { useState, useEffect } from 'react';
import {
  getEntityCategories,
  getFreelancers,
  registerFreelancer,
  updateFreelancer,
  updateFreelancerStatus,
  deleteFreelancer,
} from '../../api/adminEntityService';

function AdminFreelancerPage({ onNavigate }) {
  // View mode: 'form' by default as required in Task 3
  const [viewMode, setViewMode] = useState('form');

  const [freelancers, setFreelancers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter (for History Table)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Editing state & UI Modals
  const [editingFreelancer, setEditingFreelancer] = useState(null);
  const [viewingDocs, setViewingDocs] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Form State
  const [form, setForm] = useState({
    entity_category_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    title: '',
    experience_years: 3,
    hourly_rate: '₹850/hr',
    bio: '',
    avatar_url: '',
    portfolio_link: '',
    verification_status: 'verified',
    featured: true,
    documents: [],
  });

  const resetForm = (catList = categories) => {
    setEditingFreelancer(null);
    setForm({
      entity_category_id: catList[0]?.id || '',
      name: '',
      email: '',
      phone: '',
      password: generateRandomPassword(),
      title: '',
      experience_years: 3,
      hourly_rate: '₹850/hr',
      bio: '',
      avatar_url: '',
      portfolio_link: '',
      verification_status: 'verified',
      featured: true,
      documents: [],
    });
    setShowPassword(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [freeRes, catRes] = await Promise.all([
        getFreelancers(),
        getEntityCategories(),
      ]);
      const fetchedFreelancers = freeRes.freelancers || [];
      const fetchedCategories = catRes.categories || [];
      setFreelancers(fetchedFreelancers);
      setCategories(fetchedCategories);

      // Initialize form category and password if still empty
      setForm((prev) => ({
        ...prev,
        entity_category_id: prev.entity_category_id || (fetchedCategories[0]?.id || ''),
        password: prev.password || generateRandomPassword(),
      }));
    } catch (err) {
      console.error('Error fetching freelancers:', err);
      setError('Failed to load registered freelancers from backend.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Open Form (new registration or edit)
  const handleOpenForm = (free = null) => {
    if (free) {
      setEditingFreelancer(free);
      setForm({
        entity_category_id: free.entity_category_id || (categories[0]?.id || ''),
        name: free.name || '',
        email: free.email || '',
        phone: free.phone || '',
        password: '', // Leave blank if keeping existing password
        title: free.title || '',
        experience_years: free.experience_years || 3,
        hourly_rate: free.hourly_rate || '₹850/hr',
        bio: free.bio || '',
        avatar_url: free.avatar_url || '',
        portfolio_link: free.portfolio_link || '',
        verification_status: free.verification_status || 'verified',
        featured: free.featured !== undefined ? free.featured : true,
        documents: free.documents && Array.isArray(free.documents) ? free.documents : [],
      });
      setShowPassword(false);
    } else {
      resetForm(categories);
    }
    setViewMode('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.entity_category_id) {
      alert('Please select a Category for this Freelancer');
      return;
    }

    try {
      if (editingFreelancer) {
        await updateFreelancer(editingFreelancer.id, form);
        showSuccess(`Freelancer "${form.name}" updated successfully!`);
      } else {
        await registerFreelancer(form);
        showSuccess(`Freelancer "${form.name}" registered successfully with verification document records!`);
      }
      resetForm(categories);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save freelancer');
    }
  };

  const handleToggleFeatured = async (free) => {
    try {
      await updateFreelancerStatus(free.id, { featured: !free.featured });
      showSuccess(`Freelancer "${free.name}" advertisement status updated.`);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete registered freelancer "${name}"?`)) return;
    try {
      await deleteFreelancer(id);
      showSuccess(`Freelancer "${name}" deleted.`);
      fetchData();
    } catch (err) {
      alert('Failed to delete freelancer');
    }
  };

  const handleAddDoc = () => {
    setForm({
      ...form,
      documents: [
        ...form.documents,
        { title: 'Additional Verification Document', file_name: 'id_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=Uploaded+Doc', status: 'verified' },
      ],
    });
  };

  const handleRemoveDoc = (index) => {
    setForm({
      ...form,
      documents: form.documents.filter((_, i) => i !== index),
    });
  };

  const filteredFreelancers = freelancers.filter((f) => {
    const matchesCat = !selectedCategoryFilter || String(f.entity_category_id) === String(selectedCategoryFilter);
    const matchesStatus = !statusFilter || f.verification_status === statusFilter;
    const matchesSearch = !searchTerm ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="page-content-wrapper">
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

      {/* =========================================================================
          VIEW 1: REGISTRATION FORM (DEFAULT VIEW)
          ========================================================================= */}
      {viewMode === 'form' && (
        <div>
          {/* Pro Hero Banner with View History Action */}
          <div className="pro-entity-hero" style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #1e1b4b 100%)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c4b5fd', marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
                  <span>Freelancer Registration</span>
                </div>
                <h1 className="pro-hero-title">
                  {editingFreelancer ? `Edit Freelancer: ${editingFreelancer.name}` : 'Register Freelancer Entity'}
                </h1>
                <p className="pro-hero-subtitle">
                  {editingFreelancer
                    ? 'Update professional freelancer profile, skills, and credentials.'
                    : 'Create professional freelancer profile, assign category, and set portal login credentials.'}
                </p>
              </div>

              {/* View History Button (Clearly Visible) */}
              <button
                type="button"
                className="pro-btn-secondary"
                onClick={() => setViewMode('history')}
                style={{
                  background: '#ffffff',
                  color: '#6d28d9',
                  border: '1.5px solid #7c3aed',
                  borderRadius: '10px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>View History</span>
              </button>
            </div>
          </div>

          {/* New Freelancer Entity Form Card */}
          <div className="pro-table-wrapper" style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingFreelancer ? 'Edit Freelancer Profile' : 'New Freelancer Entity Registration'}
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  Fill in the required fields marked with * to register the freelancer.
                </p>
              </div>
              {editingFreelancer && (
                <button
                  type="button"
                  className="pro-btn-secondary"
                  onClick={() => handleOpenForm(null)}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                >
                  Cancel Edit / New Form
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              {/* Category Assignment */}
              <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label className="form-label">
                  Assign Category *
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

              {/* Profile Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Rohan Sen"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Professional Title / Skill *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Senior Full Stack Developer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                    placeholder="rohan.dev@gmail.com"
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
              <div style={{ marginBottom: '0.85rem', background: '#f5f3ff', padding: '0.75rem 0.85rem', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ marginBottom: 0, color: '#6d28d9', fontWeight: '700' }}>
                    Entity Portal Login Password {editingFreelancer ? '(Leave blank to keep unchanged)' : '*'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, password: generateRandomPassword() })}
                    style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Auto Generate
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    required={!editingFreelancer && !form.password}
                    placeholder={editingFreelancer ? 'Enter new password to update...' : 'Set password for Entity Panel login (min 6 chars)'}
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
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.72rem', color: '#6d28d9' }}>
                  This password allows the freelancer to log in to the <strong>Entity Panel</strong> using their registered email.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label className="form-label">Hourly / Project Rate</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹1,200/hr"
                    value={form.hourly_rate}
                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.experience_years}
                    onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label className="form-label">Portfolio / Website Link <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.75rem' }}>(Optional)</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://github.com/username or portfolio link"
                  value={form.portfolio_link}
                  onChange={(e) => setForm({ ...form, portfolio_link: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Bio & Skill Summary</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Summary of experience, key tools, and past client projects..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
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

              {/* Freelancer Verification Documents Manager (Optional) */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.875rem', margin: 0 }}>Freelancer Verification Documents</h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Govt ID proof & Experience Certificates are optional</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="pro-btn-secondary"
                      onClick={() => setForm({
                        ...form,
                        documents: [...form.documents, { title: 'Aadhaar / National ID Proof', file_name: 'govt_id_proof.pdf', url: 'https://via.placeholder.com/400x300?text=Govt+ID+Proof', status: 'verified' }]
                      })}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                    >
                      + Govt ID Proof
                    </button>
                    <button
                      type="button"
                      className="pro-btn-secondary"
                      onClick={() => setForm({
                        ...form,
                        documents: [...form.documents, { title: 'Professional Skill Certificate', file_name: 'skill_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=Skill+Certificate', status: 'verified' }]
                      })}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                    >
                      + Certificate
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
                        placeholder="Document Title (e.g. Aadhaar Card)"
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
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="pro-btn-secondary"
                  onClick={() => setViewMode('history')}
                >
                  View History
                </button>
                <button
                  type="submit"
                  className="pro-btn-primary"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
                >
                  {editingFreelancer ? 'Update Freelancer Profile' : 'Complete Freelancer Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HISTORY TABLE (SHOWN ON CLICKING 'VIEW HISTORY')
          ========================================================================= */}
      {viewMode === 'history' && (
        <div>
          {/* Pro Hero Banner with Back to Form Action */}
          <div className="pro-entity-hero" style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #1e1b4b 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c4b5fd', marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
                  <span>Registered Freelancers</span>
                </div>
                <h1 className="pro-hero-title">Registered Freelancers & Experts</h1>
                <p className="pro-hero-subtitle">
                  Manage professional freelancer profiles, verify ID credentials, and publish advertisements.
                </p>
              </div>

              {/* Back to Form Button */}
              <button
                type="button"
                className="pro-btn-primary"
                onClick={() => handleOpenForm(null)}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <span>&larr; Back to Registration Form</span>
              </button>
            </div>
          </div>

          {/* Pro KPI Metrics Grid */}
          <div className="pro-kpi-grid">
            <div className="pro-kpi-card purple">
              <div className="pro-kpi-header">
                <span className="pro-kpi-label">Registered</span>
                <div className="pro-kpi-icon purple">👥</div>
              </div>
              <div className="pro-kpi-val">{freelancers.length}</div>
              <div className="pro-kpi-sub">Verified expert providers</div>
            </div>

            <div className="pro-kpi-card emerald">
              <div className="pro-kpi-header">
                <span className="pro-kpi-label">Verified</span>
                <div className="pro-kpi-icon emerald">✓</div>
              </div>
              <div className="pro-kpi-val">{freelancers.filter(f => f.verification_status === 'verified').length}</div>
              <div className="pro-kpi-sub">ID & certs approved</div>
            </div>

            <div className="pro-kpi-card amber">
              <div className="pro-kpi-header">
                <span className="pro-kpi-label">Pending</span>
                <div className="pro-kpi-icon amber">⏳</div>
              </div>
              <div className="pro-kpi-val">{freelancers.filter(f => f.verification_status === 'pending').length}</div>
              <div className="pro-kpi-sub">ID verification in progress</div>
            </div>

            <div className="pro-kpi-card indigo">
              <div className="pro-kpi-header">
                <span className="pro-kpi-label">Live Ads</span>
                <div className="pro-kpi-icon indigo">📢</div>
              </div>
              <div className="pro-kpi-val">{freelancers.filter(f => f.featured).length}</div>
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
                  placeholder="Search by Freelancer Name, Skill/Title, or Email..."
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

            <button className="pro-btn-primary" onClick={() => handleOpenForm(null)} style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
              + Register New Freelancer
            </button>
          </div>

          {/* Main Enterprise Data Table */}
          <div className="pro-table-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p style={{ color: '#64748b', fontWeight: '500' }}>Loading freelancers...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>Freelancer Profile</th>
                      <th>Category</th>
                      <th>Rate & Experience</th>
                      <th>Contact Details</th>
                      <th>Documents & ID</th>
                      <th>Advertisement</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFreelancers.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                          No freelancers found matching criteria. Click "+ Register New Freelancer" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredFreelancers.map((free) => (
                        <tr key={free.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <img
                                src={free.avatar_url || 'https://via.placeholder.com/60'}
                                alt={free.name}
                                style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                              />
                              <div>
                                <div style={{ fontWeight: '800', color: '#0f172a' }}>{free.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '700' }}>{free.title}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                background: '#f3e8ff',
                                color: '#7e22ce',
                                border: '1px solid #e9d5ff',
                              }}
                            >
                              {free.category ? free.category.name : 'Professional'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{free.hourly_rate}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{free.experience_years} yrs exp</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '500' }}>{free.email}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{free.phone}</div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="pro-doc-chip"
                              onClick={() => setViewingDocs(free)}
                            >
                              📎 {free.documents ? free.documents.length : 0} Docs / ID
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`pro-ad-toggle ${free.featured ? 'on' : 'off'}`}
                              onClick={() => handleToggleFeatured(free)}
                            >
                              {free.featured ? '📢 Active Ad' : 'Off'}
                            </button>
                          </td>
                          <td>
                            <span className={`pro-pill-badge ${free.verification_status === 'verified' ? 'active' : free.verification_status === 'pending' ? 'pending' : 'rejected'}`}>
                              {free.verification_status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="pro-btn-edit" onClick={() => handleOpenForm(free)} style={{ marginRight: '0.4rem' }}>
                              ✎ Edit
                            </button>
                            <button className="pro-btn-delete" onClick={() => handleDelete(free.id, free.name)}>
                              🗑 Delete
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
              <button className="pro-modal-close-btn" onClick={() => setViewingDocs(null)}>&times;</button>
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
                        {doc.status || 'Verified'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#64748b' }}>No documents uploaded.</p>
                )}
              </div>
            </div>

            <div className="pro-modal-footer">
              <button className="pro-btn-secondary" onClick={() => setViewingDocs(null)}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFreelancerPage;
