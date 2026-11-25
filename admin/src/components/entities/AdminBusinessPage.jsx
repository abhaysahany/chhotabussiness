import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Megaphone,
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
  FileText,
  Globe,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  RefreshCw,
  FolderTree,
  Paperclip,
  User,
} from 'lucide-react';
import {
  getEntityCategories,
  getBusinessEntities,
  registerBusinessEntity,
  updateBusinessEntity,
  updateBusinessStatus,
  deleteBusinessEntity,
} from '../../api/adminEntityService';
import {
  isRequired,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  FieldError,
  getInputErrorStyle,
  extractBackendErrors,
} from '../../utils/validation';
import StatusBadge from '../common/StatusBadge';

function AdminBusinessPage({ onNavigate }) {
  // View mode: 'history' by default (Businesses Directory first)
  const [viewMode, setViewMode] = useState('history');
  // Listing view: 'table' or 'grid'
  const [listingMode, setListingMode] = useState('table');

  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formErrorBanner, setFormErrorBanner] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Editing state & UI Modals
  const [editingBusiness, setEditingBusiness] = useState(null);
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

  const resetForm = (catList = categories) => {
    setEditingBusiness(null);
    setForm({
      entity_category_id: catList[0]?.id || '',
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
    setShowPassword(false);
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
      const fetchedBusinesses = bizRes.businesses || [];
      const fetchedCategories = catRes.categories || [];
      setBusinesses(fetchedBusinesses);
      setCategories(fetchedCategories);

      // Initialize form category and password if still empty
      setForm((prev) => ({
        ...prev,
        entity_category_id: prev.entity_category_id || (fetchedCategories[0]?.id || ''),
        password: prev.password || generateRandomPassword(),
      }));
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

  // Open Form (new registration or edit)
  const handleOpenForm = (biz = null) => {
    setFormErrors({});
    setFormErrorBanner('');
    if (biz) {
      setEditingBusiness(biz);
      setForm({
        entity_category_id: biz.entity_category_id || (categories[0]?.id || ''),
        name: biz.name || '',
        owner_name: biz.owner_name || '',
        email: biz.email || '',
        phone: biz.phone || '',
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
      setShowPassword(false);
    } else {
      resetForm(categories);
    }
    setViewMode('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormErrorBanner('');

    const errors = {};
    if (!form.entity_category_id) {
      errors.entity_category_id = 'Please select a business category.';
    }
    if (!isRequired(form.name)) {
      errors.name = 'Business name is required.';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Business name must be at least 2 characters.';
    }
    if (!isRequired(form.owner_name)) {
      errors.owner_name = 'Owner/Director name is required.';
    } else if (form.owner_name.trim().length < 2) {
      errors.owner_name = 'Owner name must be at least 2 characters.';
    }
    if (!isRequired(form.email)) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!isRequired(form.phone)) {
      errors.phone = 'Phone number is required.';
    } else if (!isValidPhone(form.phone)) {
      errors.phone = 'Please enter a valid phone number (at least 10 digits).';
    }
    if (!editingBusiness && (!form.password || form.password.length < 6)) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (form.website && form.website.trim() !== '' && !isValidUrl(form.website)) {
      errors.website = 'Please enter a valid website URL (e.g. https://example.com).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormErrorBanner('Please correct the highlighted fields before submitting.');
      return;
    }

    setSaving(true);
    try {
      if (editingBusiness) {
        await updateBusinessEntity(editingBusiness.id, form);
        showSuccess(`Business "${form.name}" updated successfully!`);
      } else {
        await registerBusinessEntity(form);
        showSuccess(`Business "${form.name}" registered successfully with document records!`);
      }
      resetForm(categories);
      fetchData();
      setViewMode('history');
    } catch (err) {
      console.error('Error saving business entity:', err);
      const backendErrors = extractBackendErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setFormErrors(backendErrors);
      }
      setFormErrorBanner(err.response?.data?.message || 'Failed to save business entity. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeatured = async (biz) => {
    try {
      await updateBusinessStatus(biz.id, { featured: !biz.featured });
      showSuccess(`Business "${biz.name}" advertisement status updated.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update advertisement status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete registered business entity "${name}"? All associated portal access will be revoked.`)) return;
    try {
      await deleteBusinessEntity(id);
      showSuccess(`Business "${name}" deleted.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete business entity');
    }
  };

  const handleAddDoc = () => {
    setForm({
      ...form,
      documents: [
        ...form.documents,
        { title: 'Additional Business Document', file_name: '', url: '', status: 'pending' },
      ],
    });
  };

  const handleRemoveDoc = (index) => {
    setForm({
      ...form,
      documents: form.documents.filter((_, i) => i !== index),
    });
  };

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const matchesCat = !selectedCategoryFilter || String(b.entity_category_id) === String(selectedCategoryFilter);
      const matchesStatus = !statusFilter || b.verification_status === statusFilter;
      const matchesSearch = !searchTerm ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.registration_no && b.registration_no.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [businesses, selectedCategoryFilter, statusFilter, searchTerm]);

  // Derived KPI Counts
  const verifiedCount = useMemo(() => {
    return businesses.filter((b) => b.verification_status === 'verified').length;
  }, [businesses]);

  const pendingCount = useMemo(() => {
    return businesses.filter((b) => b.verification_status === 'pending').length;
  }, [businesses]);

  const featuredCount = useMemo(() => {
    return businesses.filter((b) => b.featured).length;
  }, [businesses]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
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

      {/* =========================================================================
          VIEW 1: REGISTRATION / EDIT FORM VIEW
          ========================================================================= */}
      {viewMode === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {/* Executive 3D Form Hero Banner */}
          <div className="adm-hero-banner">
            <div className="adm-hero-top-row">
              <div className="adm-hero-pod-3d">
                <Building2 size={32} strokeWidth={2.3} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                    ● CORPORATE REGISTRY ONBOARDING
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                    ● {editingBusiness ? 'Profile Update' : 'New Enrollment'}
                  </span>
                </div>

                <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                  {editingBusiness ? `Edit Business: ${editingBusiness.name}` : 'Register Business Entity'}
                </h1>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
                  {editingBusiness
                    ? 'Update corporate profile, portal credentials, and compliance verification documents.'
                    : 'Enroll a new merchant company, assign 1:1 taxonomy domain, and provision secure Entity Panel portal access.'}
                </p>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('history')}
                  style={{
                    background: '#ffffff',
                    color: '#3569a7',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '0.75rem 1.35rem',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
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
                  <ArrowUpRight size={16} style={{ transform: 'rotate(-135deg)' }} />
                  <span>Back to Business Directory</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Container Card */}
          <div className="adm-chart-card" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '2rem 2.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.15rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingBusiness ? 'Modify Business Entity Credentials' : 'Corporate Entity Enrollment'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Fields with asterisk (*) are required for registry database persistence.
                </p>
              </div>
              {editingBusiness && (
                <button
                  type="button"
                  onClick={() => handleOpenForm(null)}
                  style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                >
                  Cancel Edit / New Form
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              {formErrorBanner && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1.5px solid #fecaca', padding: '0.85rem 1.15rem', borderRadius: '12px', marginBottom: '1.4rem', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={17} color="#dc2626" />
                  <span>{formErrorBanner}</span>
                </div>
              )}

              {/* Category Assignment Section */}
              <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1.15rem', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  Assign Business Category (1:1 Taxonomy Domain) *
                </label>
                <select
                  required
                  value={form.entity_category_id}
                  onChange={(e) => {
                    setForm({ ...form, entity_category_id: e.target.value });
                    setFormErrors((prev) => ({ ...prev, entity_category_id: undefined }));
                    setFormErrorBanner('');
                  }}
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
                    ...getInputErrorStyle(formErrors.entity_category_id),
                  }}
                >
                  <option value="">-- Select Category Domain --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <FieldError error={formErrors.entity_category_id} />
              </div>

              {/* Company & Owner Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Business Entity Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Financial Solutions Pvt Ltd"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                      setFormErrorBanner('');
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
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Owner / Director Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={form.owner_name}
                    onChange={(e) => {
                      setForm({ ...form, owner_name: e.target.value });
                      setFormErrors((prev) => ({ ...prev, owner_name: undefined }));
                      setFormErrorBanner('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      ...getInputErrorStyle(formErrors.owner_name),
                    }}
                  />
                  <FieldError error={formErrors.owner_name} />
                </div>
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Corporate Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@apexfinance.in"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      setFormErrors((prev) => ({ ...prev, email: undefined }));
                      setFormErrorBanner('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      ...getInputErrorStyle(formErrors.email),
                    }}
                  />
                  <FieldError error={formErrors.email} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value });
                      setFormErrors((prev) => ({ ...prev, phone: undefined }));
                      setFormErrorBanner('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      outline: 'none',
                      ...getInputErrorStyle(formErrors.phone),
                    }}
                  />
                  <FieldError error={formErrors.phone} />
                </div>
              </div>

              {/* Entity Portal Login Credentials */}
              <div style={{ marginBottom: '1.15rem', background: '#f0f9ff', padding: '1rem 1.15rem', borderRadius: '12px', border: '1.5px solid #bae6fd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.04em' }}>
                    Entity Portal Login Password {editingBusiness ? '(Leave blank to retain current)' : '*'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, password: generateRandomPassword() })}
                    style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #7dd3fc', borderRadius: '6px', padding: '0.25rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <RefreshCw size={12} /> Auto Generate
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingBusiness && !form.password}
                    placeholder={editingBusiness ? 'Enter new password to update...' : 'Secure password for business portal login'}
                    value={form.password}
                    onChange={(e) => {
                      setForm({ ...form, password: e.target.value });
                      setFormErrors((prev) => ({ ...prev, password: undefined }));
                      setFormErrorBanner('');
                    }}
                    style={{
                      width: '100%',
                      padding: '0.65rem 4.5rem 0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      background: '#ffffff',
                      outline: 'none',
                      ...getInputErrorStyle(formErrors.password),
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <FieldError error={formErrors.password} />
                <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.72rem', color: '#0369a1', fontWeight: 600 }}>
                  This credential allows the merchant entity to authenticate to the <strong>Entity Portal</strong> using their email.
                </p>
              </div>

              {/* GST No. & Website */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    GST / ROC Registration No. <span style={{ color: '#94a3b8', fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GSTIN07AAACA1234F1Z5"
                    value={form.registration_no}
                    onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Official Website URL <span style={{ color: '#94a3b8', fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://apexfinance.in"
                    value={form.website}
                    onChange={(e) => {
                      setForm({ ...form, website: e.target.value });
                      setFormErrors((prev) => ({ ...prev, website: undefined }));
                      setFormErrorBanner('');
                    }}
                    style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 600, outline: 'none', ...getInputErrorStyle(formErrors.website) }}
                  />
                  <FieldError error={formErrors.website} />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                  Business Specialization &amp; Overview
                </label>
                <textarea
                  rows="2"
                  placeholder="Summary of services, client verticals, and corporate solutions..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', lineHeight: 1.5, outline: 'none' }}
                />
              </div>

              {/* Status and Advertisement Toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Verification Status
                  </label>
                  <select
                    value={form.verification_status}
                    onChange={(e) => setForm({ ...form, verification_status: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  >
                    <option value="verified">Verified (Compliant &amp; Active)</option>
                    <option value="pending">Pending Document Audit</option>
                    <option value="rejected">Rejected / Inactive</option>
                  </select>
                </div>

                <div style={{ paddingTop: '1.2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                    />
                    <span>Publish in User Advertisements (Featured Portal Ad)</span>
                  </label>
                </div>
              </div>

              {/* Document Attachments Manager */}
              <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', margin: 0 }}>
                      Compliance Verification Documents
                    </h4>
                    <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                      GST certificate, incorporation proof, or PAN cards (optional)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        documents: [...form.documents, { title: 'GST Registration Certificate', file_name: '', url: '', status: 'pending' }]
                      })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.73rem', fontWeight: 700, color: '#3569a7', cursor: 'pointer' }}
                    >
                      + GST Certificate
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        documents: [...form.documents, { title: 'Incorporation Document Proof', file_name: '', url: '', status: 'pending' }]
                      })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.73rem', fontWeight: 700, color: '#0d9488', cursor: 'pointer' }}
                    >
                      + Incorporation Doc
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDoc}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.73rem', fontWeight: 700, color: '#4f46e5', cursor: 'pointer' }}
                    >
                      + Custom Doc
                    </button>
                  </div>
                </div>

                {form.documents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.25rem', color: '#94a3b8', fontSize: '0.8rem', background: '#ffffff', borderRadius: '8px', border: '1.5px dashed #cbd5e1' }}>
                    <span>No verification documents attached yet. Click the buttons above to link documents.</span>
                  </div>
                ) : (
                  form.documents.map((doc, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', background: '#ffffff', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        style={{ flex: '2 1 180px', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
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
                        style={{ flex: '2 1 160px', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        placeholder="File Name"
                        value={doc.file_name}
                        onChange={(e) => {
                          const updated = [...form.documents];
                          updated[idx].file_name = e.target.value;
                          setForm({ ...form, documents: updated });
                        }}
                      />
                      <select
                        style={{ flex: '1 1 120px', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
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
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(idx)}
                        title="Remove document"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('history')}
                  disabled={saving}
                  style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 1.35rem', fontWeight: 800, fontSize: '0.84rem', color: '#64748b', cursor: 'pointer' }}
                >
                  Cancel &amp; Return
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="adm-hero-btn-primary"
                  style={{ padding: '0.65rem 1.65rem', fontSize: '0.84rem' }}
                >
                  {saving ? 'Saving...' : editingBusiness ? 'Update Business Entity' : 'Complete Business Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HISTORY DIRECTORY (MAIN VIEW)
          ========================================================================= */}
      {viewMode === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {/* 1. Executive 3D Luxury Hero Banner */}
          <div className="adm-hero-banner">
            <div className="adm-hero-top-row">
              <div className="adm-hero-pod-3d">
                <Building2 size={32} strokeWidth={2.3} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                    ● MASTER CORPORATE SUITE
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                    ● {businesses.length} Businesses Registered
                  </span>
                </div>

                <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                  Registered Business Entities
                </h1>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
                  Manage enterprise registrations, verify GST/ROC certificates, and publish advertisements across the platform.
                </p>
              </div>

              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  className="adm-hero-btn-primary"
                  onClick={() => handleOpenForm(null)}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem' }}
                >
                  <Plus size={18} strokeWidth={2.4} />
                  <span>Register New Business</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
          <div className="adm-kpi-grid-4">
            {/* Card 1: Registered Base */}
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
                    ● REGISTRY BASE
                  </span>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    REGISTERED
                  </div>
                </div>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
                  <Building2 size={19} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
                <div className="adm-kpi-val" style={{ fontSize: '1.6rem' }}>
                  {businesses.length}
                </div>
              </div>
              <div className="adm-kpi-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
                  <Layers size={13} color="#3569a7" />
                  <span>Total business records</span>
                </span>
                <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                  ● Corporate
                </span>
              </div>
            </div>

            {/* Card 2: Verified Compliance */}
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
                    ● COMPLIANCE
                  </span>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    VERIFIED
                  </div>
                </div>
                <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
                  <ShieldCheck size={19} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
                <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#0d9488' }}>
                  {verifiedCount}
                </div>
              </div>
              <div className="adm-kpi-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
                  <CheckCircle2 size={13} color="#0d9488" />
                  <span>Active &amp; compliant</span>
                </span>
                <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                  ● Verified
                </span>
              </div>
            </div>

            {/* Card 3: Pending Document Audit */}
            <div className="adm-kpi-card adm-kpi-card-amber">
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
                    ● AUDIT QUEUE
                  </span>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    PENDING
                  </div>
                </div>
                <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
                  <Clock size={19} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
                <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
                  {pendingCount}
                </div>
              </div>
              <div className="adm-kpi-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
                  <Clock size={13} color="#d97706" />
                  <span>Document review needed</span>
                </span>
                <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                  ● Action
                </span>
              </div>
            </div>

            {/* Card 4: Portal Live Advertisements */}
            <div className="adm-kpi-card adm-kpi-card-purple">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      color: '#9333ea',
                      background: 'rgba(147, 51, 234, 0.1)',
                      padding: '2.5px 8px',
                      borderRadius: '5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'inline-block',
                      marginBottom: '0.35rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ● ADVERTISEMENTS
                  </span>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    LIVE ADS
                  </div>
                </div>
                <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
                  <Megaphone size={19} strokeWidth={2.4} />
                </div>
              </div>
              <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
                <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#9333ea' }}>
                  {featuredCount}
                </div>
              </div>
              <div className="adm-kpi-footer">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
                  <Megaphone size={13} color="#9333ea" />
                  <span>Portal advertisements</span>
                </span>
                <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                  ● Active
                </span>
              </div>
            </div>
          </div>

          {/* 3. Executive Filter & View Switcher Bar */}
          <div className="adm-toolbar-card">
            <div className="adm-toolbar-filters">
              {/* Search Box */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
                <input
                  type="text"
                  className="adm-toolbar-input"
                  placeholder="Search by name, owner, email, GST..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              {/* Category Dropdown */}
              <div style={{ position: 'relative', flexShrink: 0, width: '150px' }}>
                <select
                  className="adm-toolbar-select"
                  style={{ width: '100%' }}
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Dropdown */}
              <div style={{ position: 'relative', flexShrink: 0, width: '130px' }}>
                <select
                  className="adm-toolbar-select"
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {(searchTerm || selectedCategoryFilter || statusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoryFilter('');
                    setStatusFilter('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: '0.35rem 0.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            {/* View Switcher & Action */}
            <div className="adm-toolbar-actions">
              <div style={{ display: 'flex', background: '#f8fafc', padding: '3px', borderRadius: '10px', gap: '3px', border: '1.5px solid #e2e8f0', height: '38px', boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => setListingMode('table')}
                  style={{
                    padding: '0 0.85rem',
                    borderRadius: '7px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: listingMode === 'table' ? '#3569a7' : 'transparent',
                    color: listingMode === 'table' ? '#ffffff' : '#64748b',
                    boxShadow: listingMode === 'table' ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <TableIcon size={14} />
                  <span>Data Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setListingMode('grid')}
                  style={{
                    padding: '0 0.85rem',
                    borderRadius: '7px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: listingMode === 'grid' ? '#3569a7' : 'transparent',
                    color: listingMode === 'grid' ? '#ffffff' : '#64748b',
                    boxShadow: listingMode === 'grid' ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Grid Cards</span>
                </button>
              </div>

              <button
                type="button"
                className="adm-hero-btn-primary"
                onClick={() => handleOpenForm(null)}
                style={{ height: '38px', padding: '0 1.15rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                <Plus size={15} /> <span>Register Business</span>
              </button>
            </div>
          </div>

          {/* 4. Main Body: Data Table or Grid Cards View */}
          {loading ? (
            <div className="adm-chart-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                Loading registered business entities from database...
              </p>
            </div>
          ) : listingMode === 'table' ? (
            /* DATA TABLE VIEW */
            <div className="adm-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#cbd5e1', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '0.9rem 1.15rem' }}>Business Entity</th>
                      <th style={{ padding: '0.9rem 1.15rem' }}>Category Domain</th>
                      <th style={{ padding: '0.9rem 1.15rem' }}>Contact Details</th>
                      <th style={{ padding: '0.9rem 1.15rem' }}>GST / Reg No.</th>
                      <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Documents</th>
                      <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Portal Ad</th>
                      <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8', fontWeight: 600 }}>
                          No businesses found matching criteria. Click "+ Register New Business" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredBusinesses.map((biz) => {
                        const initial = biz.name.charAt(0).toUpperCase();

                        return (
                          <tr key={biz.id} className="adm-table-row">
                            <td style={{ padding: '0.9rem 1.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '11px',
                                    background: 'radial-gradient(135% 135% at 20% 20%, #3569a7dd 0%, #1e3a8a 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '1.05rem',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 10px rgba(53, 105, 167, 0.28)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  }}
                                >
                                  {initial}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                                    {biz.name}
                                  </div>
                                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <User size={12} color="#94a3b8" />
                                    <span>Owner: {biz.owner_name}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.28rem 0.7rem',
                                  borderRadius: '8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  background: '#f0f9ff',
                                  color: '#0369a1',
                                  border: '1px solid #bae6fd',
                                }}
                              >
                                <FolderTree size={12} />
                                <span>{biz.category ? biz.category.name : 'Unassigned'}</span>
                              </span>
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Mail size={12} color="#64748b" />
                                  <span>{biz.email}</span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Phone size={12} color="#94a3b8" />
                                  <span>{biz.phone}</span>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem' }}>
                              <span className="adm-code-chip">
                                {biz.registration_no || 'NOT REGISTERED'}
                              </span>
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setViewingDocs(biz)}
                                style={{
                                  background: '#ffffff',
                                  border: '1.5px solid #cbd5e1',
                                  borderRadius: '8px',
                                  padding: '0.3rem 0.65rem',
                                  color: '#475569',
                                  fontWeight: 800,
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#3569a7';
                                  e.currentTarget.style.color = '#3569a7';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                  e.currentTarget.style.color = '#475569';
                                }}
                              >
                                <Paperclip size={12} />
                                <span>{biz.documents ? biz.documents.length : 0} Docs</span>
                              </button>
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(biz)}
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '9999px',
                                  border: biz.featured ? '1px solid #c084fc' : '1px solid #e2e8f0',
                                  background: biz.featured ? 'rgba(147, 51, 234, 0.1)' : '#f8fafc',
                                  color: biz.featured ? '#9333ea' : '#94a3b8',
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Megaphone size={12} />
                                <span>{biz.featured ? 'Active Ad' : 'Inactive'}</span>
                              </button>
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                              <StatusBadge status={biz.verification_status} fallback="verified" />
                            </td>

                            <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenForm(biz)}
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
                                  onClick={() => handleDelete(biz.id, biz.name)}
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
                  ● Registered corporate entities synchronized with MySQL 8.0 schema
                </span>
                <span style={{ fontWeight: 800, color: '#3569a7' }}>
                  Showing {filteredBusinesses.length} of {businesses.length} Business Entities
                </span>
              </div>
            </div>
          ) : (
            /* GRID CARDS VIEW */
            filteredBusinesses.length === 0 ? (
              <div className="adm-chart-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <Building2 size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>No businesses found</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                  {searchTerm || selectedCategoryFilter || statusFilter ? 'Try adjusting your search criteria.' : 'Register your first enterprise entity to begin.'}
                </p>
                <button
                  type="button"
                  className="adm-hero-btn-primary"
                  onClick={() => handleOpenForm(null)}
                  style={{ display: 'inline-flex', margin: '0 auto' }}
                >
                  <Plus size={16} /> Register Business
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '1.4rem' }}>
                {filteredBusinesses.map((biz) => {
                  const initial = biz.name.charAt(0).toUpperCase();

                  return (
                    <div
                      key={biz.id}
                      className="adm-chart-card adm-chart-card-glow"
                      style={{
                        borderTop: '4px solid #3569a7',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '13px',
                                background: 'radial-gradient(135% 135% at 20% 20%, #3569a7dd 0%, #1e3a8a 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.25rem',
                                flexShrink: 0,
                                boxShadow: '0 8px 18px -3px rgba(53, 105, 167, 0.35)',
                                border: '1px solid rgba(255, 255, 255, 0.35)',
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                                {biz.name}
                              </h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '3px' }}>
                                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                                  Owner: {biz.owner_name}
                                </span>
                              </div>
                            </div>
                          </div>

                          <StatusBadge status={biz.verification_status} fallback="verified" />
                        </div>

                        {/* Category & Registration */}
                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '7px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: '#f0f9ff',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                            }}
                          >
                            <FolderTree size={12} />
                            <span>{biz.category ? biz.category.name : 'Unassigned'}</span>
                          </span>

                          <span className="adm-code-chip">
                            {biz.registration_no || 'NO GST'}
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55, margin: '0.5rem 0 1rem 0', minHeight: '40px' }}>
                          {biz.description || 'No detailed company overview provided.'}
                        </p>

                        {/* Contact info vault */}
                        <div style={{ background: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#334155', fontWeight: 700 }}>
                            <Mail size={13} color="#3569a7" />
                            <span>{biz.email}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: '#64748b' }}>
                            <Phone size={13} color="#0d9488" />
                            <span>{biz.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setViewingDocs(biz)}
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.35rem 0.65rem',
                                color: '#475569',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Paperclip size={12} />
                              <span>{biz.documents ? biz.documents.length : 0} Docs</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleFeatured(biz)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '8px',
                                border: biz.featured ? '1px solid #c084fc' : '1px solid #e2e8f0',
                                background: biz.featured ? 'rgba(147, 51, 234, 0.1)' : '#f8fafc',
                                color: biz.featured ? '#9333ea' : '#94a3b8',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Megaphone size={12} />
                              <span>{biz.featured ? 'Ad On' : 'Ad Off'}</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenForm(biz)}
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '0.35rem 0.75rem',
                                color: '#3569a7',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(biz.id, biz.name)}
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #fecaca',
                                borderRadius: '8px',
                                padding: '0.35rem 0.75rem',
                                color: '#dc2626',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Del</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* =========================================================================
          DOCUMENT PREVIEWER MODAL
          ========================================================================= */}
      {viewingDocs && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.68)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '22px', border: '1.5px solid #cbd5e1', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.35rem 1.6rem', borderBottom: '1px solid #e2e8f0', background: 'radial-gradient(circle at 95% 8%, rgba(53, 105, 167, 0.06) 0%, #ffffff 70%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
                  <FileText size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                    Compliance Documents
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    {viewingDocs.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingDocs(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#64748b', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.4rem 1.6rem', maxHeight: '420px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {viewingDocs.documents && viewingDocs.documents.length > 0 ? (
                  viewingDocs.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1.5px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            {doc.file_name}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                        <span>{doc.status || 'Verified'}</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                    <FileText size={36} color="#cbd5e1" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>No verification documents attached.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.95rem 1.6rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setViewingDocs(null)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.55rem 1.25rem',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBusinessPage;