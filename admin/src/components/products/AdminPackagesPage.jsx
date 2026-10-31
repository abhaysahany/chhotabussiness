import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';

function AdminPackagesPage() {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categories list
  const categoriesList = [
    'Marketing & SEO',
    'Software & IT',
    'Legal & Compliance',
    'Business Growth',
  ];

  // Registered Businesses & Freelancers
  const registeredBusinesses = [
    'GrowthX Media Solutions',
    'Skyline Technologies Pvt Ltd',
    'AddNet Tax Advisory',
  ];

  const registeredFreelancers = [
    'Priya Patel (UI/UX Designer)',
    'Rohan Sharma (Full Stack Dev)',
    'Amit Kumar (SEO Specialist)',
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch Packages from MySQL Database
  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalog/packages');
      if (res.data?.packages) {
        setPackages(res.data.packages.map((k) => ({
          ...k,
          price: Number(k.price) || 0,
          adminCommissionPercent: Number(k.commission_percent ?? k.adminCommissionPercent) || 18,
          billingCycle: k.billingCycle || 'Monthly Recurring',
          ownerType: k.ownerType || 'business',
          ownerName: k.ownerName || 'Skyline Technologies Pvt Ltd',
          image: k.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        })));
      }
    } catch (err) {
      console.error('Error fetching packages from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    category: categoriesList[0],
    ownerType: 'business',
    ownerName: registeredBusinesses[0],
    price: '',
    adminCommissionPercent: 18,
    billingCycle: 'Monthly Recurring',
    image: '',
  });

  const handleOwnerTypeChange = (type) => {
    setFormData({
      ...formData,
      ownerType: type,
      ownerName: type === 'business' ? registeredBusinesses[0] : registeredFreelancers[0],
    });
  };

  const handleToggleStatus = async (id) => {
    const target = packages.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';

    try {
      await api.put(`/catalog/packages/${id}`, {
        name: target.name,
        price: target.price,
        commission_percent: target.adminCommissionPercent,
        status: nextStatus,
      });
      setPackages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      );
      showToast(`Package status updated to ${nextStatus} in database.`);
    } catch (e) {
      console.error('Error updating status in database:', e);
      showToast('Error updating status.');
    }
  };

  const handleDeletePackage = async (id) => {
    if (window.confirm('Delete this package listing from database?')) {
      try {
        await api.delete(`/catalog/packages/${id}`);
        setPackages((prev) => prev.filter((item) => item.id !== id));
        showToast('Package deleted from database!');
      } catch (e) {
        console.error('Error deleting package:', e);
        showToast('Error deleting package.');
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.ownerName) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await api.post('/catalog/packages', {
        name: formData.name,
        price: parseFloat(formData.price),
        commission_percent: Number(formData.adminCommissionPercent) || 18,
        description: `${formData.category} bundle package managed by ${formData.ownerName}.`,
        status: 'active',
      });

      if (res.data?.package) {
        const saved = {
          ...res.data.package,
          price: Number(res.data.package.price),
          adminCommissionPercent: Number(res.data.package.commission_percent),
          category: formData.category,
          ownerType: formData.ownerType,
          ownerName: formData.ownerName,
          billingCycle: formData.billingCycle,
          image: formData.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        };
        setPackages([saved, ...packages]);
        showToast('✓ Package saved to MySQL database successfully!');
      }
    } catch (err) {
      console.error('Error creating package in database:', err);
      showToast('Error saving package to database.');
    }

    setShowAddModal(false);
    setFormData({
      name: '',
      category: categoriesList[0],
      ownerType: 'business',
      ownerName: registeredBusinesses[0],
      price: '',
      adminCommissionPercent: 18,
      billingCycle: 'Monthly Recurring',
      image: '',
    });
  };


  const getCategoryBadgeClass = (category) => {
    if (category.includes('Software')) return 'badge-category software';
    if (category.includes('Legal')) return 'badge-category legal';
    if (category.includes('Marketing')) return 'badge-category marketing';
    return 'badge-category default';
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        pkg.name.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q) ||
        pkg.ownerName.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'all' || pkg.category === categoryFilter;
      const matchesOwner = ownerFilter === 'all' || pkg.ownerType === ownerFilter;

      return matchesSearch && matchesCat && matchesOwner;
    });
  }, [packages, searchQuery, categoryFilter, ownerFilter]);

  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.status === 'active').length;
  const totalSubscribers = packages.reduce((acc, p) => acc + p.subscribersCount, 0);

  return (
    <div className="pro-products-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontWeight: '600',
            borderLeft: '4px solid #6366f1',
          }}
        >
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="pro-header-banner">
        <div className="pro-header-title-group">
          <h2>Pricing Packages Suite</h2>
          <div className="pro-header-breadcrumb">
            <span>Enterprise Admin</span>
            <span>›</span>
            <span>Business</span>
            <span>›</span>
            <span className="active">Pricing Packages</span>
          </div>
        </div>
        <button className="pro-btn-create" onClick={() => setShowAddModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Package
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="pro-stats-grid">
        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper indigo">⚡</div>
            <span className="pro-stat-trend">Package Bundles</span>
          </div>
          <div className="pro-stat-value">{totalPackages}</div>
          <div className="pro-stat-label">Total Bundled Packages</div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper emerald">✓</div>
            <span className="pro-stat-trend">Ready to Buy</span>
          </div>
          <div className="pro-stat-value" style={{ color: '#10b981' }}>{activePackages}</div>
          <div className="pro-stat-label">Active Plans Live</div>
        </div>

        <div className="pro-stat-card">
          <div className="pro-stat-header">
            <div className="pro-stat-icon-wrapper purple">👥</div>
            <span className="pro-stat-trend">+18% Subscribers</span>
          </div>
          <div className="pro-stat-value" style={{ color: '#6366f1' }}>{totalSubscribers}</div>
          <div className="pro-stat-label">Enrolled Account Subscriptions</div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="pro-toolbar">
        <div className="pro-search-box">
          <svg className="pro-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search packages by title, billing cycle, or provider name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pro-filter-group">
          <select className="pro-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select className="pro-select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All Owner Types</option>
            <option value="business">Business Owners</option>
            <option value="freelancer">Freelancer Owners</option>
          </select>

          <div className="pro-view-switcher">
            <button
              className={`pro-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              📋 Table
            </button>
            <button
              className={`pro-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              🖼️ Grid
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="pro-card-table">
          <div className="pro-table-header">
            <h3>Pricing Packages Directory ({filteredPackages.length} Bundles)</h3>
          </div>

          <table className="pro-table">
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Category</th>
                <th>Provider Entity (Business / Freelance)</th>
                <th>Price & Billing</th>
                <th>Active Subscribers</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
                    <p style={{ margin: 0, fontWeight: '600' }}>No pricing packages matching your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div className="pro-item-cell">
                        <img className="pro-item-thumb" src={pkg.image} alt={pkg.name} />
                        <div>
                          <div className="pro-item-title">{pkg.name}</div>
                          <div className="pro-item-sub">ID: #{pkg.id} • Added {pkg.created_at}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getCategoryBadgeClass(pkg.category)}>{pkg.category}</span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '0.2rem' }}>
                          {pkg.ownerName}
                        </strong>
                        <span className={`badge-owner ${pkg.ownerType}`}>
                          {pkg.ownerType === 'business' ? '🏢 Business' : '👨‍💻 Freelance'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>₹{pkg.price.toLocaleString()}</strong>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block' }}>
                          🏛️ {pkg.adminCommissionPercent || 18}% Admin Cut
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        💳 {pkg.billingCycle}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                        👥 {pkg.subscribersCount} Users
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${pkg.status}`}>
                        {pkg.status === 'active' ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="pro-action-btns">
                        <button className="btn-action-sm" onClick={() => handleToggleStatus(pkg.id)}>
                          {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn-action-delete" onClick={() => handleDeletePackage(pkg.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="pro-grid-showcase">
          {filteredPackages.map((pkg) => (
            <div className="pro-card-showcase" key={pkg.id}>
              <div className="pro-card-img-wrapper">
                <img src={pkg.image} alt={pkg.name} />
                <div className="pro-card-badge-top">
                  <span className={getCategoryBadgeClass(pkg.category)}>{pkg.category}</span>
                  <span className={`status-pill ${pkg.status}`}>
                    {pkg.status === 'active' ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
              <div className="pro-card-body">
                <div className="pro-card-owner">
                  <span className={`badge-owner ${pkg.ownerType}`}>
                    {pkg.ownerType === 'business' ? '🏢' : '👨‍💻'} {pkg.ownerName}
                  </span>
                </div>
                <h4 className="pro-card-title">{pkg.name}</h4>
                <div className="pro-card-sku">💳 {pkg.billingCycle} • 👥 {pkg.subscribersCount} Users</div>

                <div className="pro-card-footer">
                  <div>
                    <span className="pro-card-price">₹{pkg.price.toLocaleString()}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', marginTop: '0.15rem' }}>
                      🏛️ {pkg.adminCommissionPercent || 18}% Admin Cut
                    </span>
                  </div>
                  <div className="pro-card-stock" style={{ color: '#16a34a', fontWeight: 600 }}>
                    Active Pack
                  </div>
                </div>

                <div className="pro-card-actions">
                  <button
                    className="btn-action-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleToggleStatus(pkg.id)}
                  >
                    {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn-action-delete"
                    onClick={() => handleDeletePackage(pkg.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="pro-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="pro-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title">Create Pricing Package</h3>
              <button className="pro-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="pro-form-group">
                <label className="pro-form-label">Package Title *</label>
                <input
                  type="text"
                  className="pro-input"
                  placeholder="e.g. Digital Growth Accelerator Bundle"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Category Selector */}
              <div className="pro-form-group">
                <label className="pro-form-label">Select Category *</label>
                <select
                  className="pro-select-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Owner Type Selector */}
              <div className="pro-form-group">
                <label className="pro-form-label">Package Owner Type *</label>
                <div className="pro-owner-cards-group">
                  <div
                    className={`pro-owner-radio-card ${formData.ownerType === 'business' ? 'selected-business' : ''}`}
                    onClick={() => handleOwnerTypeChange('business')}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🏢</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem' }}>Registered Business</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Corporate Solutions</span>
                    </div>
                  </div>

                  <div
                    className={`pro-owner-radio-card ${formData.ownerType === 'freelancer' ? 'selected-freelancer' : ''}`}
                    onClick={() => handleOwnerTypeChange('freelancer')}
                  >
                    <span style={{ fontSize: '1.25rem' }}>👨‍💻</span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem' }}>Registered Freelance</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Individual Expert</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity Selector */}
              <div className="pro-form-group">
                <label className="pro-form-label">
                  Select {formData.ownerType === 'business' ? 'Business Entity' : 'Freelance Provider'} *
                </label>
                <select
                  className="pro-select-input"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  required
                >
                  {(formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="pro-form-group">
                  <label className="pro-form-label">Price (₹) *</label>
                  <input
                    type="number"
                    className="pro-input"
                    placeholder="e.g. 7999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="pro-form-group">
                  <label className="pro-form-label">Admin Commission (%) *</label>
                  <input
                    type="number"
                    className="pro-input"
                    placeholder="e.g. 18"
                    value={formData.adminCommissionPercent}
                    onChange={(e) => setFormData({ ...formData, adminCommissionPercent: e.target.value })}
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div className="pro-form-group">
                  <label className="pro-form-label">Billing Cycle</label>
                  <select
                    className="pro-select-input"
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  >
                    <option value="Monthly Recurring">Monthly Recurring</option>
                    <option value="Annual Subscription">Annual Subscription</option>
                    <option value="One-Time Payment">One-Time Payment</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-action-sm"
                  style={{ padding: '0.7rem 1.4rem' }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pro-btn-create"
                  style={{ padding: '0.7rem 1.4rem' }}
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPackagesPage;
