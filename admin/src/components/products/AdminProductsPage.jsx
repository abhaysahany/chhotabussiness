import React, { useState, useEffect, useMemo } from 'react';
import './products.css';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
} from '../../api/adminCatalogService';
import {
  getEntityCategories,
  getBusinessEntities,
  getFreelancers,
} from '../../api/adminEntityService';

function AdminProductsPage() {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState([]);
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
    admin_commission_percent: 15,
    stock: 50,
    sku: '',
    image: '',
    image_file: null,
    description: '',
  });
  const [imagePreview, setImagePreview] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Products, Categories, and Vendor Partners (Businesses & Freelancers) from Database
      const [prodData, catData, entCatData, bizData, freeData] = await Promise.allSettled([
        getAdminProducts(),
        getAdminCategories(),
        getEntityCategories(),
        getBusinessEntities(),
        getFreelancers(),
      ]);

      if (prodData.status === 'fulfilled') {
        setProducts(prodData.value || []);
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
        categoryNames.add('Electronics & Hardware');
      }
      setCategoriesList(Array.from(categoryNames));

      // Registered Businesses from Database
      if (bizData.status === 'fulfilled' && bizData.value?.businesses) {
        setBusinessesList(bizData.value.businesses);
      }

      // Registered Freelancers from Database
      if (freeData.status === 'fulfilled' && freeData.value?.freelancers) {
        setFreelancersList(freeData.value.freelancers);
      }
    } catch (err) {
      console.error('Error loading product catalog data:', err);
      showToast('Error loading products from database.', 'error');
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
      defaultOwner = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || 'Skyline Technologies Pvt Ltd') : 'Skyline Technologies Pvt Ltd';
    } else {
      defaultOwner = freelancersList.length > 0 ? (freelancersList[0].name || freelancersList[0].full_name || 'Priya Patel (UI/UX Designer)') : 'Priya Patel (UI/UX Designer)';
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
    setEditingProduct(null);
    const defaultCat = categoriesList[0] || 'Software & IT';
    const defaultBiz = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || 'Skyline Technologies Pvt Ltd') : 'Skyline Technologies Pvt Ltd';

    setFormData({
      name: '',
      category: defaultCat,
      owner_type: 'business',
      owner_name: defaultBiz,
      price: '',
      admin_commission_percent: 15,
      stock: 50,
      sku: '',
      image: '',
      image_file: null,
      description: '',
    });
    setImagePreview('');
    setShowAddModal(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      owner_type: p.owner_type || p.ownerType || 'business',
      owner_name: p.owner_name || p.ownerName || (businessesList[0]?.name || businessesList[0]?.business_name || ''),
      price: p.price,
      admin_commission_percent: p.admin_commission_percent || p.adminCommissionPercent || 15,
      stock: p.stock,
      sku: p.sku,
      image: p.image || '',
      image_file: null,
      description: p.description || '',
    });
    setImagePreview(p.image || '');
    setShowAddModal(true);
  };

  const handleToggleStatus = async (p) => {
    const newStatus = p.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminProduct(p.id, {
        name: p.name,
        price: p.price,
        category: p.category,
        owner_type: p.owner_type || p.ownerType || 'business',
        owner_name: p.owner_name || p.ownerName,
        admin_commission_percent: p.admin_commission_percent || p.adminCommissionPercent || 15,
        stock: p.stock,
        sku: p.sku,
        status: newStatus,
        image: p.image,
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: newStatus } : item))
      );
      showToast(`Product status set to ${newStatus}!`, 'success');
    } catch (err) {
      showToast('Failed to update product status.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this product from MySQL database?')) {
      try {
        await deleteAdminProduct(id);
        setProducts((prev) => prev.filter((item) => item.id !== id));
        showToast('Product successfully deleted from database!', 'success');
      } catch (err) {
        showToast('Failed to delete product.', 'error');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      showToast('Please fill in product name and base price', 'error');
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
      payload.append('stock', formData.stock || 0);
      payload.append('sku', formData.sku || '');
      payload.append('description', formData.description || '');
      if (formData.image_file) {
        payload.append('image_file', formData.image_file);
      } else if (formData.image) {
        payload.append('image', formData.image);
      }

      if (editingProduct) {
        const res = await updateAdminProduct(editingProduct.id, payload);
        showToast(res.message || 'Product updated successfully!', 'success');
      } else {
        const res = await createAdminProduct(payload);
        showToast(res.message || 'New product saved to database!', 'success');
      }

      setShowAddModal(false);
      await loadData();
    } catch (err) {
      const msg =
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message) ||
        err.message ||
        'Failed to save product in database.';
      showToast(msg, 'error');
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
    if (category.includes('Electronics')) return 'badge-category electronics';
    return 'badge-category default';
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const owner = p.owner_name || p.ownerName || '';
      const ownerType = p.owner_type || p.ownerType || '';
      const cat = p.category || '';
      const sku = p.sku || '';

      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'all' || cat === categoryFilter;
      const matchesOwner = ownerFilter === 'all' || ownerType === ownerFilter;

      return matchesSearch && matchesCat && matchesOwner;
    });
  }, [products, searchQuery, categoryFilter, ownerFilter]);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const businessProducts = products.filter((p) => (p.owner_type || p.ownerType) === 'business').length;
  const freelanceProducts = products.filter((p) => (p.owner_type || p.ownerType) === 'freelancer').length;

  return (
    <div className="pro-products-container">
      {/* Header Banner */}
      <div className="pro-header-banner">
        <div className="pro-header-title-group">
          <h2>Products Catalog Management</h2>
          <div className="pro-header-breadcrumb">
            <span>Catalog</span>
            <span>»</span>
            <span className="current">Products</span>
          </div>
        </div>
        <div className="pro-header-actions">
          <button className="btn-add-primary" onClick={openAddModal}>
            + Create New Product
          </button>
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <div className="pro-metrics-grid">
        <div className="metric-card metric-primary">
          <div className="metric-icon-box">📦</div>
          <div className="metric-info">
            <span className="metric-label">Total Catalog Items</span>
            <div className="metric-value">{totalProducts}</div>
          </div>
        </div>

        <div className="metric-card metric-success">
          <div className="metric-icon-box">🟢</div>
          <div className="metric-info">
            <span className="metric-label">Active & Live</span>
            <div className="metric-value">{activeProducts}</div>
          </div>
        </div>

        <div className="metric-card metric-warning">
          <div className="metric-icon-box">🏢</div>
          <div className="metric-info">
            <span className="metric-label">Business Items</span>
            <div className="metric-value">{businessProducts}</div>
          </div>
        </div>

        <div className="metric-card metric-purple">
          <div className="metric-icon-box">⚡</div>
          <div className="metric-info">
            <span className="metric-label">Freelance Items</span>
            <div className="metric-value">{freelanceProducts}</div>
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
            placeholder="Search by product name, category, vendor, SKU..."
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
          Loading products from database...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state-box">
          <span className="empty-icon">📭</span>
          <h3>No Products Found</h3>
          <p>Try adjusting your search criteria or click below to create a new product.</p>
          <button className="btn-add-primary" onClick={openAddModal}>
            + Add First Product
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="pro-table-wrapper">
          <table className="pro-data-table">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Vendor / Owner</th>
                <th>Base Price</th>
                <th>Admin Cut %</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const ownerName = p.owner_name || p.ownerName;
                const ownerType = p.owner_type || p.ownerType;
                const comm = p.admin_commission_percent || p.adminCommissionPercent || 15;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="product-identity-cell">
                        <img
                          src={p.image || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400'}
                          alt={p.name}
                          className="product-thumb"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400';
                          }}
                        />
                        <div className="product-identity-text">
                          <span className="product-name">{p.name}</span>
                          <span className="product-sku">{p.sku || `SKU-${p.id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getCategoryBadgeClass(p.category)}>{p.category}</span>
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
                      <span className="price-tag-value">₹{Number(p.price).toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span className="commission-badge">{comm}%</span>
                    </td>
                    <td>
                      <span className={`stock-count ${p.stock <= 10 ? 'low-stock' : ''}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${p.status === 'active' ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(p)}
                        title="Click to toggle status"
                      >
                        {p.status === 'active' ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-group">
                        <button className="btn-action-icon edit" onClick={() => openEditModal(p)} title="Edit Details">
                          ✏️
                        </button>
                        <button className="btn-action-icon delete" onClick={() => handleDeleteProduct(p.id)} title="Delete Listing">
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
          {filteredProducts.map((p) => {
            const ownerName = p.owner_name || p.ownerName;
            const ownerType = p.owner_type || p.ownerType;
            const comm = p.admin_commission_percent || p.adminCommissionPercent || 15;

            return (
              <div key={p.id} className="product-grid-card">
                <div className="grid-card-media">
                  <img src={p.image} alt={p.name} />
                  <span className={`grid-status-pill ${p.status}`}>{p.status}</span>
                  <span className="grid-category-pill">{p.category}</span>
                </div>
                <div className="grid-card-body">
                  <span className="grid-sku">{p.sku || `SKU-${p.id}`}</span>
                  <h4 className="grid-title">{p.name}</h4>
                  <div className="grid-vendor">
                    <span className="vendor-lbl">Vendor:</span>
                    <span className="vendor-val">{ownerName}</span>
                    <span className={`owner-badge ${ownerType}`}>{ownerType}</span>
                  </div>
                  <div className="grid-meta-row">
                    <div className="grid-price">Base: ₹{Number(p.price).toLocaleString('en-IN')}</div>
                    <div className="grid-commission">Admin: {comm}%</div>
                  </div>
                  <div className="grid-footer-row">
                    <span className="grid-stock">Stock: {p.stock} units</span>
                    <div className="grid-actions">
                      <button className="btn-grid-edit" onClick={() => openEditModal(p)}>Edit</button>
                      <button className="btn-grid-del" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="pro-modal-backdrop">
          <div className="pro-modal-dialog">
            <div className="pro-modal-header">
              <h3>{editingProduct ? '✏️ Edit Product Listing' : '📦 Create New Product Item'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit} className="pro-modal-form">
              <div className="form-group-grid">
                <div className="form-col-full">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cloud ERP Suite"
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
                  <label>Vendor Entity Type *</label>
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
                  <label>Select Vendor Partner (From Database) *</label>
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
                        <option value="Skyline Technologies Pvt Ltd">Skyline Technologies Pvt Ltd</option>
                      )
                    ) : (
                      freelancersList.length > 0 ? (
                        freelancersList.map((f) => (
                          <option key={f.id} value={f.name}>
                            {f.name} ( {f.title || `F${f.id}`} )
                          </option>
                        ))
                      ) : (
                        <option value="Priya Patel (UI/UX Designer)">Priya Patel (UI/UX Designer)</option>
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
                    placeholder="14999"
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
                    placeholder="15"
                    value={formData.admin_commission_percent}
                    onChange={(e) => setFormData({ ...formData, admin_commission_percent: e.target.value })}
                  />
                </div>

                <div className="form-col-third">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>

                <div className="form-col-full">
                  <label>Product Image (Browse File or Paste URL)</label>
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
                  <label>Description (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Provide features and technical specifications..."
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
                  {isSubmitting ? 'Saving to Database...' : editingProduct ? 'Save Changes' : 'Publish Product to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert Notification (Positioned Visibly Above Modal Backdrop & Dialog) */}
      {toast && (
        <div className={`pro-toast-notification ${toast.type}`}>
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>
            {toast.type === 'error' ? '❌' : '✓'}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
            title="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
