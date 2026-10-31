import React, { useState, useEffect, useMemo } from 'react';
import './products.css';
import {
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  getAdminCategories,
} from '../../api/adminCatalogService';
import {
  getEntityCategories,
  getBusinessEntities,
  getFreelancers,
} from '../../api/adminEntityService';

function AdminServicesPage() {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [services, setServices] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [businessesList, setBusinessesList] = useState([]);
  const [freelancersList, setFreelancersList] = useState([]);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    owner_type: 'business',
    owner_name: '',
    price: '',
    admin_commission_percent: 20,
    duration: '3 Business Days',
    image: '',
    image_file: null,
    description: '',
  });
  const [imagePreview, setImagePreview] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvData, catData, entCatData, bizData, freeData] = await Promise.allSettled([
        getAdminServices(),
        getAdminCategories(),
        getEntityCategories(),
        getBusinessEntities(),
        getFreelancers(),
      ]);

      if (srvData.status === 'fulfilled') {
        setServices(srvData.value || []);
      }

      // Merge and deduplicate categories from MySQL database
      const categoryNames = new Set();
      if (catData.status === 'fulfilled' && Array.isArray(catData.value)) {
        catData.value.forEach((c) => c.name && categoryNames.add(c.name));
      }
      if (entCatData.status === 'fulfilled' && entCatData.value?.categories) {
        entCatData.value.categories.forEach((c) => c.name && categoryNames.add(c.name));
      }

      if (categoryNames.size === 0) {
        categoryNames.add('Software & IT');
        categoryNames.add('Design & Creative');
        categoryNames.add('Legal & Compliance');
        categoryNames.add('Marketing & SEO');
        categoryNames.add('Finance & Accounting');
      }
      setCategoriesList(Array.from(categoryNames));

      if (bizData.status === 'fulfilled' && bizData.value?.businesses) {
        setBusinessesList(bizData.value.businesses);
      }

      if (freeData.status === 'fulfilled' && freeData.value?.freelancers) {
        setFreelancersList(freeData.value.freelancers);
      }
    } catch (err) {
      console.error('Error loading services data:', err);
      showToast('Error loading services from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOwnerTypeChange = (type) => {
    let defaultOwner = '';
    if (type === 'business') {
      defaultOwner = businessesList.length > 0 ? businessesList[0].business_name : 'Skyline Technologies Pvt Ltd';
    } else {
      defaultOwner = freelancersList.length > 0 ? freelancersList[0].full_name : 'Priya Patel (UI/UX Designer)';
    }

    setFormData((prev) => ({
      ...prev,
      owner_type: type,
      owner_name: defaultOwner,
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image_file: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    const defaultCat = categoriesList[0] || 'Legal & Compliance';
    const defaultBiz = businessesList.length > 0 ? businessesList[0].business_name : 'AddNet Tax Advisory';

    setFormData({
      name: '',
      category: defaultCat,
      owner_type: 'business',
      owner_name: defaultBiz,
      price: '',
      admin_commission_percent: 20,
      duration: '3 Business Days',
      image: '',
      image_file: null,
      description: '',
    });
    setImagePreview('');
    setShowAddModal(true);
  };

  const openEditModal = (s) => {
    setEditingService(s);
    setFormData({
      name: s.name,
      category: s.category,
      owner_type: s.owner_type || s.ownerType || 'business',
      owner_name: s.owner_name || s.ownerName || (businessesList[0]?.business_name || ''),
      price: s.price,
      admin_commission_percent: s.admin_commission_percent || s.adminCommissionPercent || 20,
      duration: s.duration || '3 Business Days',
      image: s.image || '',
      image_file: null,
      description: s.description || '',
    });
    setImagePreview(s.image || '');
    setShowAddModal(true);
  };

  const handleToggleStatus = async (s) => {
    const newStatus = s.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminService(s.id, {
        name: s.name,
        price: s.price,
        category: s.category,
        owner_type: s.owner_type || s.ownerType || 'business',
        owner_name: s.owner_name || s.ownerName,
        admin_commission_percent: s.admin_commission_percent || s.adminCommissionPercent || 20,
        duration: s.duration,
        status: newStatus,
        image: s.image,
      });
      setServices((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, status: newStatus } : item))
      );
      showToast(`Service status set to ${newStatus}!`);
    } catch (err) {
      showToast('Failed to update service status.');
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this service from MySQL database?')) {
      try {
        await deleteAdminService(id);
        setServices((prev) => prev.filter((item) => item.id !== id));
        showToast('Service successfully deleted from database!');
      } catch (err) {
        showToast('Failed to delete service.');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Please fill in service name and base price');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('category', formData.category);
      payload.append('owner_type', formData.owner_type);
      payload.append('owner_name', formData.owner_name);
      payload.append('price', formData.price);
      payload.append('admin_commission_percent', formData.admin_commission_percent);
      payload.append('duration', formData.duration || '3 Business Days');
      payload.append('description', formData.description || '');
      if (formData.image_file) {
        payload.append('image_file', formData.image_file);
      } else if (formData.image) {
        payload.append('image', formData.image);
      }

      if (editingService) {
        const res = await updateAdminService(editingService.id, payload);
        showToast(res.message || 'Service updated successfully!');
      } else {
        const res = await createAdminService(payload);
        showToast(res.message || 'New service saved to database!');
      }

      setShowAddModal(false);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save service in database.';
      showToast(`❌ ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadgeClass = (category) => {
    if (!category) return 'badge-category default';
    if (category.includes('Software')) return 'badge-category software';
    if (category.includes('Design')) return 'badge-category design';
    if (category.includes('Legal')) return 'badge-category legal';
    if (category.includes('Marketing')) return 'badge-category marketing';
    if (category.includes('Finance')) return 'badge-category finance';
    return 'badge-category default';
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchQuery.toLowerCase();
      const owner = s.owner_name || s.ownerName || '';
      const ownerType = s.owner_type || s.ownerType || '';
      const cat = s.category || '';

      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'all' || cat === categoryFilter;
      const matchesOwner = ownerFilter === 'all' || ownerType === ownerFilter;

      return matchesSearch && matchesCat && matchesOwner;
    });
  }, [services, searchQuery, categoryFilter, ownerFilter]);

  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === 'active').length;
  const businessServices = services.filter((s) => (s.owner_type || s.ownerType) === 'business').length;
  const freelanceServices = services.filter((s) => (s.owner_type || s.ownerType) === 'freelancer').length;

  return (
    <div className="pro-products-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: '#059669', color: '#ffffff', padding: '0.85rem 1.35rem', borderRadius: '10px', fontWeight: '700', boxShadow: '0 10px 25px -5px rgba(5,150,105,0.4)', zIndex: 99999, fontSize: '0.875rem' }}>
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="pro-header-banner">
        <div className="pro-header-title-group">
          <h2>Services Catalog Management</h2>
          <div className="pro-header-breadcrumb">
            <span>Catalog</span>
            <span>»</span>
            <span className="current">Services</span>
          </div>
        </div>
        <div className="pro-header-actions">
          <button className="btn-add-primary" onClick={openAddModal}>
            + Create New Service
          </button>
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <div className="pro-metrics-grid">
        <div className="metric-card metric-primary">
          <div className="metric-icon-box">💼</div>
          <div className="metric-info">
            <span className="metric-label">Total Services</span>
            <div className="metric-value">{totalServices}</div>
          </div>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-icon-box">🟢</div>
          <div className="metric-info">
            <span className="metric-label">Active & Live</span>
            <div className="metric-value">{activeServices}</div>
          </div>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-icon-box">🏢</div>
          <div className="metric-info">
            <span className="metric-label">Corporate Services</span>
            <div className="metric-value">{businessServices}</div>
          </div>
        </div>

        <div className="metric-card metric-purple">
          <div className="metric-icon-box">⚡</div>
          <div className="metric-info">
            <span className="metric-label">Freelance Gigs</span>
            <div className="metric-value">{freelanceServices}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="pro-filter-card">
        <div className="filter-search-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by service name, category, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All Vendor Types</option>
            <option value="business">Registered Businesses</option>
            <option value="freelancer">Freelancer Professionals</option>
          </select>

          <div className="view-toggle-btns">
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              ☰
            </button>
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ☷
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table / Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          Loading services from database...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="empty-state-box">
          <span className="empty-icon">📭</span>
          <h3>No Services Found</h3>
          <p>Try adjusting your search criteria or click below to create a new service.</p>
          <button className="btn-add-primary" onClick={openAddModal}>
            + Add First Service
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="pro-table-wrapper">
          <table className="pro-data-table">
            <thead>
              <tr>
                <th>Service Details</th>
                <th>Category</th>
                <th>Vendor / Provider</th>
                <th>Base Price</th>
                <th>Admin Cut %</th>
                <th>Turnaround</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s) => {
                const ownerName = s.owner_name || s.ownerName;
                const ownerType = s.owner_type || s.ownerType;
                const comm = s.admin_commission_percent || s.adminCommissionPercent || 20;

                return (
                  <tr key={s.id}>
                    <td>
                      <div className="product-identity-cell">
                        <img
                          src={s.image || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400'}
                          alt={s.name}
                          className="product-thumb"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400';
                          }}
                        />
                        <div className="product-identity-text">
                          <span className="product-name">{s.name}</span>
                          <span className="product-sku">ID: SRV-{s.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getCategoryBadgeClass(s.category)}>{s.category}</span>
                    </td>
                    <td>
                      <div className="owner-cell">
                        <span className="owner-name">{ownerName}</span>
                        <span className={`owner-badge ${ownerType}`}>
                          {ownerType === 'business' ? 'Business' : 'Freelance'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="price-tag-value">₹{Number(s.price).toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span className="commission-badge">{comm}%</span>
                    </td>
                    <td>
                      <span className="duration-tag">⏱️ {s.duration || '3 Days'}</span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${s.status === 'active' ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(s)}
                        title="Click to toggle status"
                      >
                        {s.status === 'active' ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-group">
                        <button className="btn-action-icon edit" onClick={() => openEditModal(s)} title="Edit Details">
                          ✏️
                        </button>
                        <button className="btn-action-icon delete" onClick={() => handleDeleteService(s.id)} title="Delete Listing">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="products-grid-view">
          {filteredServices.map((s) => {
            const ownerName = s.owner_name || s.ownerName;
            const ownerType = s.owner_type || s.ownerType;
            const comm = s.admin_commission_percent || s.adminCommissionPercent || 20;

            return (
              <div key={s.id} className="product-grid-card">
                <div className="grid-card-media">
                  <img src={s.image} alt={s.name} />
                  <span className={`grid-status-pill ${s.status}`}>{s.status}</span>
                  <span className="grid-category-pill">{s.category}</span>
                </div>
                <div className="grid-card-body">
                  <span className="grid-sku">SRV-{s.id}</span>
                  <h4 className="grid-title">{s.name}</h4>
                  <div className="grid-vendor">
                    <span className="vendor-lbl">Provider:</span>
                    <span className="vendor-val">{ownerName}</span>
                    <span className={`owner-badge ${ownerType}`}>{ownerType}</span>
                  </div>
                  <div className="grid-meta-row">
                    <div className="grid-price">Base: ₹{Number(s.price).toLocaleString('en-IN')}</div>
                    <div className="grid-commission">Admin: {comm}%</div>
                  </div>
                  <div className="grid-footer-row">
                    <span className="duration-tag">⏱️ {s.duration || '3 Days'}</span>
                    <div className="grid-actions">
                      <button className="btn-grid-edit" onClick={() => openEditModal(s)}>Edit</button>
                      <button className="btn-grid-del" onClick={() => handleDeleteService(s.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {showAddModal && (
        <div className="pro-modal-backdrop">
          <div className="pro-modal-dialog">
            <div className="pro-modal-header">
              <h3>{editingService ? '✏️ Edit Service Listing' : '💼 Create New Service Item'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit} className="pro-modal-form">
              <div className="form-group-grid">
                <div className="form-col-full">
                  <label>Service Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GST Audit & Annual Compliance Filing"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-col-half">
                  <label>Category (From Database) *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-col-half">
                  <label>Provider Entity Type *</label>
                  <div className="radio-pill-group">
                    <button
                      type="button"
                      className={`pill-btn ${formData.owner_type === 'business' ? 'active' : ''}`}
                      onClick={() => handleOwnerTypeChange('business')}
                    >
                      🏢 Business
                    </button>
                    <button
                      type="button"
                      className={`pill-btn ${formData.owner_type === 'freelancer' ? 'active' : ''}`}
                      onClick={() => handleOwnerTypeChange('freelancer')}
                    >
                      ⚡ Freelancer
                    </button>
                  </div>
                </div>

                <div className="form-col-full">
                  <label>Select Vendor / Provider (From Database) *</label>
                  <select
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    required
                  >
                    {formData.owner_type === 'business' ? (
                      businessesList.length > 0 ? (
                        businessesList.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name} ( {b.owner_name || `B${b.id}`} )
                          </option>
                        ))
                      ) : (
                        <option value="Lifeleads Technology Pvt Ltd">Lifeleads Technology Pvt Ltd</option>
                      )
                    ) : (
                      freelancersList.length > 0 ? (
                        freelancersList.map((f) => (
                          <option key={f.id} value={f.name}>
                            {f.name} ( {f.title || `F${f.id}`} )
                          </option>
                        ))
                      ) : (
                        <option value="Priya Patel">Priya Patel</option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-col-third">
                  <label>Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="4999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-col-third">
                  <label>Admin Cut (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    value={formData.admin_commission_percent}
                    onChange={(e) => setFormData({ ...formData, admin_commission_percent: e.target.value })}
                  />
                </div>

                <div className="form-col-third">
                  <label>Turnaround Duration *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3 Business Days"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>

                <div className="form-col-full">
                  <label>Service Image (Browse File or Paste URL)</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label
                      style={{
                        padding: '0.55rem 1rem',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      📁 Browse & Upload Image
                      <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </label>

                    <input
                      type="url"
                      placeholder="Or paste image URL https://..."
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  {imagePreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, image: '', image_file: null });
                        }}
                        style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-col-full">
                  <label>Description & Scope of Work</label>
                  <textarea
                    rows="3"
                    placeholder="List inclusions, deliverables, and requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="pro-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving to Database...' : editingService ? 'Save Changes' : 'Publish Service to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminServicesPage;
