import React, { useState, useEffect } from 'react';
import {
  getEntityCategories,
  createEntityCategory,
  updateEntityCategory,
  deleteEntityCategory,
  getBusinessEntities,
  registerBusinessEntity,
  updateBusinessEntity,
  updateBusinessStatus,
  deleteBusinessEntity,
  getFreelancers,
  registerFreelancer,
  updateFreelancer,
  updateFreelancerStatus,
  deleteFreelancer,
} from '../../api/adminEntityService';

function AdminBusinessEntityPage() {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'businesses' | 'freelancers'
  
  // Data States
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Search
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [viewingBusinessDocs, setViewingBusinessDocs] = useState(null);

  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [editingFreelancer, setEditingFreelancer] = useState(null);
  const [viewingFreelancerDocs, setViewingFreelancerDocs] = useState(null);

  // Form States - Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'briefcase',
    badge_color: '#6366f1',
    status: 'active',
  });

  // Form States - Business
  const [businessForm, setBusinessForm] = useState({
    entity_category_id: '',
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    registration_no: '',
    description: '',
    logo_url: '',
    website: '',
    verification_status: 'verified',
    featured: true,
    documents: [
      { title: 'GST Registration Certificate', file_name: 'gst_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=GST+Certificate', status: 'verified' },
      { title: 'Incorporation Document', file_name: 'incorporation_proof.pdf', url: 'https://via.placeholder.com/400x300?text=Incorporation+Proof', status: 'verified' },
    ],
  });

  // Form States - Freelancer
  const [freelancerForm, setFreelancerForm] = useState({
    entity_category_id: '',
    name: '',
    email: '',
    phone: '',
    title: '',
    experience_years: 3,
    hourly_rate: '₹850/hr',
    bio: '',
    avatar_url: '',
    portfolio_link: '',
    verification_status: 'verified',
    featured: true,
    documents: [
      { title: 'Government ID Proof', file_name: 'id_proof.pdf', url: 'https://via.placeholder.com/400x300?text=ID+Proof', status: 'verified' },
      { title: 'Skill Certification / Resume', file_name: 'certificate.pdf', url: 'https://via.placeholder.com/400x300?text=Certification', status: 'verified' },
    ],
  });

  // Load all initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, bizRes, freeRes] = await Promise.all([
        getEntityCategories(),
        getBusinessEntities(),
        getFreelancers(),
      ]);
      setCategories(catRes.categories || []);
      setBusinesses(bizRes.businesses || []);
      setFreelancers(freeRes.freelancers || []);
    } catch (err) {
      console.error('Failed to load entity data:', err);
      setError('Could not connect to backend server. Make sure Laravel API is running.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // ------------------------------------------------------------------
  // PART 1: CATEGORY HANDLERS
  // ------------------------------------------------------------------
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || 'briefcase',
        badge_color: cat.badge_color || '#6366f1',
        status: cat.status || 'active',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        icon: 'briefcase',
        badge_color: '#6366f1',
        status: 'active',
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateEntityCategory(editingCategory.id, categoryForm);
        showSuccess(`Category "${categoryForm.name}" updated successfully!`);
      } else {
        await createEntityCategory(categoryForm);
        showSuccess(`Category "${categoryForm.name}" created successfully!`);
      }
      setShowCategoryModal(false);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? Registered businesses under this category will also be removed.`)) return;
    try {
      await deleteEntityCategory(id);
      showSuccess(`Category "${name}" deleted.`);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // ------------------------------------------------------------------
  // PART 2: BUSINESS HANDLERS
  // ------------------------------------------------------------------
  const handleOpenBusinessModal = (biz = null) => {
    if (biz) {
      setEditingBusiness(biz);
      setBusinessForm({
        entity_category_id: biz.entity_category_id || (categories[0]?.id || ''),
        name: biz.name,
        owner_name: biz.owner_name,
        email: biz.email,
        phone: biz.phone,
        address: biz.address || '',
        registration_no: biz.registration_no || '',
        description: biz.description || '',
        logo_url: biz.logo_url || '',
        website: biz.website || '',
        verification_status: biz.verification_status || 'verified',
        featured: biz.featured !== undefined ? biz.featured : true,
        documents: biz.documents && biz.documents.length > 0 ? biz.documents : [
          { title: 'GST Registration Certificate', file_name: 'gst_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=GST+Cert', status: 'verified' },
        ],
      });
    } else {
      setEditingBusiness(null);
      setBusinessForm({
        entity_category_id: categories[0]?.id || '',
        name: '',
        owner_name: '',
        email: '',
        phone: '',
        address: '',
        registration_no: '',
        description: '',
        logo_url: '',
        website: '',
        verification_status: 'verified',
        featured: true,
        documents: [
          { title: 'GST Registration Certificate', file_name: 'gst_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=GST+Cert', status: 'verified' },
          { title: 'Incorporation Document', file_name: 'incorporation_proof.pdf', url: 'https://via.placeholder.com/400x300?text=Incorporation+Proof', status: 'verified' },
        ],
      });
    }
    setShowBusinessModal(true);
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!businessForm.entity_category_id) {
      alert('Please select a Business Category');
      return;
    }

    try {
      if (editingBusiness) {
        await updateBusinessEntity(editingBusiness.id, businessForm);
        showSuccess(`Business "${businessForm.name}" updated successfully!`);
      } else {
        await registerBusinessEntity(businessForm);
        showSuccess(`Business "${businessForm.name}" registered successfully with documents!`);
      }
      setShowBusinessModal(false);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register business');
    }
  };

  const handleToggleBusinessFeatured = async (biz) => {
    try {
      await updateBusinessStatus(biz.id, { featured: !biz.featured });
      showSuccess(`Business "${biz.name}" advertisement status toggled.`);
      fetchAllData();
    } catch (err) {
      alert('Failed to update advertisement status');
    }
  };

  const handleDeleteBusiness = async (id, name) => {
    if (!window.confirm(`Delete registered business "${name}"?`)) return;
    try {
      await deleteBusinessEntity(id);
      showSuccess(`Business "${name}" deleted.`);
      fetchAllData();
    } catch (err) {
      alert('Failed to delete business entity');
    }
  };

  const handleAddBusinessDoc = () => {
    setBusinessForm({
      ...businessForm,
      documents: [
        ...businessForm.documents,
        { title: 'New Registration Document', file_name: 'doc_file.pdf', url: 'https://via.placeholder.com/400x300?text=Uploaded+Document', status: 'verified' },
      ],
    });
  };

  const handleRemoveBusinessDoc = (index) => {
    const updated = businessForm.documents.filter((_, i) => i !== index);
    setBusinessForm({ ...businessForm, documents: updated });
  };

  // ------------------------------------------------------------------
  // PART 3: FREELANCER HANDLERS
  // ------------------------------------------------------------------
  const handleOpenFreelancerModal = (free = null) => {
    if (free) {
      setEditingFreelancer(free);
      setFreelancerForm({
        entity_category_id: free.entity_category_id || (categories[0]?.id || ''),
        name: free.name,
        email: free.email,
        phone: free.phone,
        title: free.title,
        experience_years: free.experience_years || 3,
        hourly_rate: free.hourly_rate || '₹850/hr',
        bio: free.bio || '',
        avatar_url: free.avatar_url || '',
        portfolio_link: free.portfolio_link || '',
        verification_status: free.verification_status || 'verified',
        featured: free.featured !== undefined ? free.featured : true,
        documents: free.documents && free.documents.length > 0 ? free.documents : [
          { title: 'Government ID Proof', file_name: 'id_proof.pdf', url: 'https://via.placeholder.com/400x300?text=ID+Proof', status: 'verified' },
        ],
      });
    } else {
      setEditingFreelancer(null);
      setFreelancerForm({
        entity_category_id: categories[0]?.id || '',
        name: '',
        email: '',
        phone: '',
        title: '',
        experience_years: 3,
        hourly_rate: '₹850/hr',
        bio: '',
        avatar_url: '',
        portfolio_link: '',
        verification_status: 'verified',
        featured: true,
        documents: [
          { title: 'Government ID Proof', file_name: 'id_proof.pdf', url: 'https://via.placeholder.com/400x300?text=ID+Proof', status: 'verified' },
          { title: 'Skill Certification / Resume', file_name: 'certificate.pdf', url: 'https://via.placeholder.com/400x300?text=Certification', status: 'verified' },
        ],
      });
    }
    setShowFreelancerModal(true);
  };

  const handleSaveFreelancer = async (e) => {
    e.preventDefault();
    if (!freelancerForm.entity_category_id) {
      alert('Please select a Business Category for this Freelancer');
      return;
    }

    try {
      if (editingFreelancer) {
        await updateFreelancer(editingFreelancer.id, freelancerForm);
        showSuccess(`Freelancer "${freelancerForm.name}" updated successfully!`);
      } else {
        await registerFreelancer(freelancerForm);
        showSuccess(`Freelancer "${freelancerForm.name}" registered successfully with documents!`);
      }
      setShowFreelancerModal(false);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register freelancer');
    }
  };

  const handleToggleFreelancerFeatured = async (free) => {
    try {
      await updateFreelancerStatus(free.id, { featured: !free.featured });
      showSuccess(`Freelancer "${free.name}" advertisement status updated.`);
      fetchAllData();
    } catch (err) {
      alert('Failed to update advertisement status');
    }
  };

  const handleDeleteFreelancer = async (id, name) => {
    if (!window.confirm(`Delete registered freelancer "${name}"?`)) return;
    try {
      await deleteFreelancer(id);
      showSuccess(`Freelancer "${name}" deleted.`);
      fetchAllData();
    } catch (err) {
      alert('Failed to delete freelancer entity');
    }
  };

  const handleAddFreelancerDoc = () => {
    setFreelancerForm({
      ...freelancerForm,
      documents: [
        ...freelancerForm.documents,
        { title: 'Additional Verification Document', file_name: 'id_certificate.pdf', url: 'https://via.placeholder.com/400x300?text=Uploaded+Doc', status: 'verified' },
      ],
    });
  };

  const handleRemoveFreelancerDoc = (index) => {
    const updated = freelancerForm.documents.filter((_, i) => i !== index);
    setFreelancerForm({ ...freelancerForm, documents: updated });
  };

  // ------------------------------------------------------------------
  // FILTERING LOGIC FOR TABLES
  // ------------------------------------------------------------------
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
      {/* Subheader */}
      <div className="page-subheader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-title">Business Entity Management</h2>
          <div className="page-breadcrumb">
            <span>Admin</span>
            <span className="separator">›</span>
            <span className="active">Business Entities & Freelancers</span>
          </div>
        </div>
        
        {/* Main Header Action Buttons depending on Active Tab */}
        <div>
          {activeTab === 'categories' && (
            <button className="primary-btn" onClick={() => handleOpenCategoryModal()}>
              + Create Category
            </button>
          )}
          {activeTab === 'businesses' && (
            <button className="primary-btn" onClick={() => handleOpenBusinessModal()}>
              + Register Business Entity
            </button>
          )}
          {activeTab === 'freelancers' && (
            <button className="primary-btn" onClick={() => handleOpenFreelancerModal()}>
              + Register Freelancer
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="alert-success" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.875rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.875rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="status-grid" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: '#c7d2fe' }}>Total Categories</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value" style={{ color: '#fff' }}>{categories.length}</div>
          <p className="metric-desc" style={{ color: '#a5b4fc' }}>Active Entity Classifications</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: '#bae6fd' }}>Registered Businesses</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value" style={{ color: '#fff' }}>{businesses.length}</div>
          <p className="metric-desc" style={{ color: '#7dd3fc' }}>With verified document records</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: '#ddd6fe' }}>Registered Freelancers</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value" style={{ color: '#fff' }}>{freelancers.length}</div>
          <p className="metric-desc" style={{ color: '#c4b5fd' }}>Verified expert service providers</p>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: '#a7f3d0' }}>Live Advertisements</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value" style={{ color: '#fff' }}>
            {businesses.filter(b => b.featured).length + freelancers.filter(f => f.featured).length}
          </div>
          <p className="metric-desc" style={{ color: '#6ee7b7' }}>Displayed to users on portal</p>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="entity-tab-header" style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', gap: '1rem' }}>
        <button
          className={`tab-item-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '0.875rem 1.5rem',
            fontWeight: '600',
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'categories' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'categories' ? '#4f46e5' : '#64748b',
          }}
        >
          📁 Part 1: Category Creation ({categories.length})
        </button>

        <button
          className={`tab-item-btn ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
          style={{
            padding: '0.875rem 1.5rem',
            fontWeight: '600',
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'businesses' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'businesses' ? '#4f46e5' : '#64748b',
          }}
        >
          🏢 Part 2: Business Registration & Documents ({businesses.length})
        </button>

        <button
          className={`tab-item-btn ${activeTab === 'freelancers' ? 'active' : ''}`}
          onClick={() => setActiveTab('freelancers')}
          style={{
            padding: '0.875rem 1.5rem',
            fontWeight: '600',
            fontSize: '0.95rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'freelancers' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'freelancers' ? '#4f46e5' : '#64748b',
          }}
        >
          👤 Part 3: Freelancer Registration & Documents ({freelancers.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          <p style={{ color: '#64748b' }}>Fetching Business Entity database...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: CATEGORY CREATION & MANAGEMENT                                    */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>
                  Business Entity Categories
                </h3>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Every registered business and freelancer is classified under one category.
                </span>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category Details</th>
                      <th>Slug</th>
                      <th>Registered Businesses</th>
                      <th>Registered Freelancers</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No categories created yet. Click "+ Create Category" above to add one.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => (
                        <tr key={cat.id}>
                          <td>#{cat.id}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  backgroundColor: `${cat.badge_color || '#6366f1'}20`,
                                  color: cat.badge_color || '#6366f1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                  fontSize: '1rem',
                                }}
                              >
                                {cat.name.charAt(0)}
                              </span>
                              <div>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{cat.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cat.description || 'No description'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#475569' }}>
                              {cat.slug}
                            </code>
                          </td>
                          <td>
                            <span className="badge-connected" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                              🏢 {cat.businesses_count || 0} Businesses
                            </span>
                          </td>
                          <td>
                            <span className="badge-connected" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
                              👤 {cat.freelancers_count || 0} Freelancers
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${cat.status === 'active' ? 'active' : 'inactive'}`}>
                              {cat.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleOpenCategoryModal(cat)}
                              style={{ marginRight: '0.5rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            >
                              Delete
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

          {/* ========================================================================= */}
          {/* TAB 2: BUSINESS REGISTRATION & DOCUMENTS                                  */}
          {/* ========================================================================= */}
          {activeTab === 'businesses' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              {/* Filter & Search Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by Business Name, Owner, Email or GST..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '320px' }}
                  />

                  <select
                    className="form-input"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{ maxWidth: '220px' }}
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
                    style={{ maxWidth: '180px' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <button className="primary-btn" onClick={() => handleOpenBusinessModal()}>
                  + Register New Business
                </button>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Business Entity</th>
                      <th>Category</th>
                      <th>Contact Details</th>
                      <th>Reg / GST No.</th>
                      <th>Attached Documents</th>
                      <th>Advertisement</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                          No businesses registered matching criteria. Click "+ Register New Business" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredBusinesses.map((biz) => (
                        <tr key={biz.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img
                                src={biz.logo_url || 'https://via.placeholder.com/60'}
                                alt={biz.name}
                                style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                              />
                              <div>
                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{biz.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Owner: {biz.owner_name}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor: biz.category?.badge_color ? `${biz.category.badge_color}20` : '#e0e7ff',
                                color: biz.category?.badge_color || '#3730a3',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-block',
                              }}
                            >
                              {biz.category?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>{biz.email}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{biz.phone}</div>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155' }}>
                              {biz.registration_no || 'N/A'}
                            </code>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setViewingBusinessDocs(biz)}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              📄 {biz.documents ? biz.documents.length : 0} Documents
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleBusinessFeatured(biz)}
                              style={{
                                background: biz.featured ? '#ecfdf5' : '#f1f5f9',
                                color: biz.featured ? '#047857' : '#64748b',
                                border: `1px solid ${biz.featured ? '#a7f3d0' : '#cbd5e1'}`,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              {biz.featured ? '🌟 Active Ad' : 'Off'}
                            </button>
                          </td>
                          <td>
                            <span className={`status-pill ${biz.verification_status === 'verified' ? 'active' : 'inactive'}`}>
                              {biz.verification_status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleOpenBusinessModal(biz)}
                              style={{ marginRight: '0.4rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteBusiness(biz.id, biz.name)}
                            >
                              Delete
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

          {/* ========================================================================= */}
          {/* TAB 3: FREELANCER REGISTRATION & DOCUMENTS                                */}
          {/* ========================================================================= */}
          {activeTab === 'freelancers' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              {/* Filter & Search Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by Freelancer Name, Title, Email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '320px' }}
                  />

                  <select
                    className="form-input"
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    style={{ maxWidth: '220px' }}
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
                    style={{ maxWidth: '180px' }}
                  >
                    <option value="">All Statuses</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <button className="primary-btn" onClick={() => handleOpenFreelancerModal()}>
                  + Register New Freelancer
                </button>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="data-table">
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
                        <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                          No freelancers registered matching criteria. Click "+ Register New Freelancer" to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredFreelancers.map((free) => (
                        <tr key={free.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <img
                                src={free.avatar_url || 'https://via.placeholder.com/60'}
                                alt={free.name}
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                              />
                              <div>
                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{free.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '500' }}>{free.title}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor: free.category?.badge_color ? `${free.category.badge_color}20` : '#f3e8ff',
                                color: free.category?.badge_color || '#6b21a8',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-block',
                              }}
                            >
                              {free.category?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '700', color: '#059669', fontSize: '0.9rem' }}>{free.hourly_rate}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{free.experience_years} Years Exp</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>{free.email}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{free.phone}</div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setViewingFreelancerDocs(free)}
                              style={{
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              📑 {free.documents ? free.documents.length : 0} Docs / ID
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleFreelancerFeatured(free)}
                              style={{
                                background: free.featured ? '#ecfdf5' : '#f1f5f9',
                                color: free.featured ? '#047857' : '#64748b',
                                border: `1px solid ${free.featured ? '#a7f3d0' : '#cbd5e1'}`,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              {free.featured ? '🌟 Active Ad' : 'Off'}
                            </button>
                          </td>
                          <td>
                            <span className={`status-pill ${free.verification_status === 'verified' ? 'active' : 'inactive'}`}>
                              {free.verification_status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleOpenFreelancerModal(free)}
                              style={{ marginRight: '0.4rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteFreelancer(free.id, free.name)}
                            >
                              Delete
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
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT CATEGORY                                          */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                {editingCategory ? 'Edit Entity Category' : 'Create New Entity Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', display: 'block' }}>Category Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Legal & Tax Consulting"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', display: 'block' }}>Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Describe the services and business types included..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', display: 'block' }}>Badge Color</label>
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: '42px', padding: '4px', cursor: 'pointer' }}
                    value={categoryForm.badge_color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, badge_color: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.4rem', display: 'block' }}>Status</label>
                  <select
                    className="form-input"
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER / EDIT BUSINESS WITH DOCUMENTS                          */}
      {/* ========================================================================= */}
      {showBusinessModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                {editingBusiness ? 'Edit Business Entity Details' : 'Register Business Entity with Documents'}
              </h3>
              <button onClick={() => setShowBusinessModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <form onSubmit={handleSaveBusiness}>
              {/* Category selection */}
              <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  Assign Business Category (One Business &rarr; One Category) *
                </label>
                <select
                  className="form-input"
                  required
                  value={businessForm.entity_category_id}
                  onChange={(e) => setBusinessForm({ ...businessForm, entity_category_id: e.target.value })}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Basic Business Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Apex Tech Pvt Ltd"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Owner / Director Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={businessForm.owner_name}
                    onChange={(e) => setBusinessForm({ ...businessForm, owner_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="contact@business.com"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="+91 98765 43210"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">GST / Registration No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="GSTIN07AAACA1234F1Z5"
                    value={businessForm.registration_no}
                    onChange={(e) => setBusinessForm({ ...businessForm, registration_no: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Website URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://mybusiness.com"
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Business Description</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Overview of business products and services offered..."
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                ></textarea>
              </div>

              {/* Status and Featured toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Verification Status</label>
                  <select
                    className="form-input"
                    value={businessForm.verification_status}
                    onChange={(e) => setBusinessForm({ ...businessForm, verification_status: e.target.value })}
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={businessForm.featured}
                      onChange={(e) => setBusinessForm({ ...businessForm, featured: e.target.checked })}
                    />
                    <span>Show in User Advertisements (Featured)</span>
                  </label>
                </div>
              </div>

              {/* Document Attachments Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Business Documents (GST, Reg Certificate, etc.)</h4>
                  <button type="button" className="secondary-btn" onClick={handleAddBusinessDoc} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                    + Add Document Record
                  </button>
                </div>

                {businessForm.documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 2, fontSize: '0.85rem' }}
                      placeholder="Document Title (e.g. GST Certificate)"
                      value={doc.title}
                      onChange={(e) => {
                        const updated = [...businessForm.documents];
                        updated[idx].title = e.target.value;
                        setBusinessForm({ ...businessForm, documents: updated });
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 2, fontSize: '0.85rem' }}
                      placeholder="File Name"
                      value={doc.file_name}
                      onChange={(e) => {
                        const updated = [...businessForm.documents];
                        updated[idx].file_name = e.target.value;
                        setBusinessForm({ ...businessForm, documents: updated });
                      }}
                    />
                    <select
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.85rem' }}
                      value={doc.status}
                      onChange={(e) => {
                        const updated = [...businessForm.documents];
                        updated[idx].status = e.target.value;
                        setBusinessForm({ ...businessForm, documents: updated });
                      }}
                    >
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                    </select>
                    {businessForm.documents.length > 1 && (
                      <button type="button" onClick={() => handleRemoveBusinessDoc(idx)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' }}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowBusinessModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingBusiness ? 'Update Business Entity' : 'Complete Business Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTER / EDIT FREELANCER WITH DOCUMENTS                        */}
      {/* ========================================================================= */}
      {showFreelancerModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                {editingFreelancer ? 'Edit Freelancer Profile' : 'Register Freelancer with Documents'}
              </h3>
              <button onClick={() => setShowFreelancerModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <form onSubmit={handleSaveFreelancer}>
              {/* Category selection */}
              <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  Assign Freelancer Category *
                </label>
                <select
                  className="form-input"
                  required
                  value={freelancerForm.entity_category_id}
                  onChange={(e) => setFreelancerForm({ ...freelancerForm, entity_category_id: e.target.value })}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Freelancer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Rohan Sen"
                    value={freelancerForm.name}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Professional Title / Skill *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Full Stack Developer"
                    value={freelancerForm.title}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, title: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="freelancer@gmail.com"
                    value={freelancerForm.email}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="+91 98765 43210"
                    value={freelancerForm.phone}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Hourly / Project Rate</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹850/hr or ₹25,000/proj"
                    value={freelancerForm.hourly_rate}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, hourly_rate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className="form-input"
                    value={freelancerForm.experience_years}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, experience_years: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Bio & Expertise Description</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Summary of experience, key skills, and past client projects..."
                  value={freelancerForm.bio}
                  onChange={(e) => setFreelancerForm({ ...freelancerForm, bio: e.target.value })}
                ></textarea>
              </div>

              {/* Status and Featured toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Verification Status</label>
                  <select
                    className="form-input"
                    value={freelancerForm.verification_status}
                    onChange={(e) => setFreelancerForm({ ...freelancerForm, verification_status: e.target.value })}
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={freelancerForm.featured}
                      onChange={(e) => setFreelancerForm({ ...freelancerForm, featured: e.target.checked })}
                    />
                    <span>Show in User Advertisements (Featured)</span>
                  </label>
                </div>
              </div>

              {/* Document Attachments Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>Freelancer Verification Documents (ID Proof, Certs)</h4>
                  <button type="button" className="secondary-btn" onClick={handleAddFreelancerDoc} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                    + Add Document Record
                  </button>
                </div>

                {freelancerForm.documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 2, fontSize: '0.85rem' }}
                      placeholder="Document Title (e.g. Aadhaar ID Proof)"
                      value={doc.title}
                      onChange={(e) => {
                        const updated = [...freelancerForm.documents];
                        updated[idx].title = e.target.value;
                        setFreelancerForm({ ...freelancerForm, documents: updated });
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 2, fontSize: '0.85rem' }}
                      placeholder="File Name"
                      value={doc.file_name}
                      onChange={(e) => {
                        const updated = [...freelancerForm.documents];
                        updated[idx].file_name = e.target.value;
                        setFreelancerForm({ ...freelancerForm, documents: updated });
                      }}
                    />
                    <select
                      className="form-input"
                      style={{ flex: 1, fontSize: '0.85rem' }}
                      value={doc.status}
                      onChange={(e) => {
                        const updated = [...freelancerForm.documents];
                        updated[idx].status = e.target.value;
                        setFreelancerForm({ ...freelancerForm, documents: updated });
                      }}
                    >
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                    </select>
                    {freelancerForm.documents.length > 1 && (
                      <button type="button" onClick={() => handleRemoveFreelancerDoc(idx)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', width: '28px', height: '28px', borderRadius: '4px', cursor: 'pointer' }}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowFreelancerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {editingFreelancer ? 'Update Freelancer' : 'Complete Freelancer Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT VIEWER MODAL FOR BUSINESS                                        */}
      {/* ========================================================================= */}
      {viewingBusinessDocs && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                Attached Documents: {viewingBusinessDocs.name}
              </h3>
              <button onClick={() => setViewingBusinessDocs(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {viewingBusinessDocs.documents && viewingBusinessDocs.documents.length > 0 ? (
                viewingBusinessDocs.documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>📄 {doc.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>File: {doc.file_name}</div>
                    </div>
                    <span className="badge-connected" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem' }}>
                      ✓ {doc.status || 'Verified'}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No documents attached.</p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="primary-btn" onClick={() => setViewingBusinessDocs(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT VIEWER MODAL FOR FREELANCER                                      */}
      {/* ========================================================================= */}
      {viewingFreelancerDocs && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
                Verification Documents: {viewingFreelancerDocs.name}
              </h3>
              <button onClick={() => setViewingFreelancerDocs(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {viewingFreelancerDocs.documents && viewingFreelancerDocs.documents.length > 0 ? (
                viewingFreelancerDocs.documents.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>📑 {doc.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>File: {doc.file_name}</div>
                    </div>
                    <span className="badge-connected" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem' }}>
                      ✓ {doc.status || 'Verified'}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No documents attached.</p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="primary-btn" onClick={() => setViewingFreelancerDocs(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBusinessEntityPage;
