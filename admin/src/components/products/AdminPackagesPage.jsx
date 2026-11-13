import React, { useState, useEffect, useMemo } from 'react';
import './products.css';
import api from '../../api/axios';
import { getBusinessEntities, getFreelancers } from '../../api/adminEntityService';
import { formatDate } from '../../utils/timezone';
import {
  isRequired,
  isValidNumber,
  isValidPercentage,
  FieldError,
  getInputErrorStyle,
  extractBackendErrors,
} from '../../utils/validation';

const DEFAULT_PACKAGE_IMAGE = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400';

const getCategoryLabel = (category) => {
  if (typeof category === 'object' && category !== null) {
    return String(category.name || category.title || 'Package Bundle');
  }
  return String(category || 'Package Bundle');
};

const normalizePackage = (pkg) => {
  const safePkg = pkg && typeof pkg === 'object' ? pkg : {};
  const rawCommission = safePkg.commission_percent ?? safePkg.adminCommissionPercent;
  const parsedCommission =
    rawCommission !== undefined && rawCommission !== null && rawCommission !== ''
      ? Number(rawCommission)
      : 18;

  return {
    ...safePkg,
    name: String(safePkg.name || 'Untitled Package'),
    category: getCategoryLabel(safePkg.category),
    price: Number(safePkg.price) || 0,
    adminCommissionPercent: Number.isFinite(parsedCommission) ? parsedCommission : 18,
    billingCycle: String(safePkg.billingCycle || safePkg.billing_cycle || 'Monthly Recurring'),
    ownerType: String(safePkg.ownerType || safePkg.owner_type || 'business'),
    ownerName: String(safePkg.ownerName || safePkg.owner_name || 'Platform Managed'),
    subscribersCount: Number(safePkg.subscribersCount ?? safePkg.subscribers_count ?? 0) || 0,
    status: String(safePkg.status || 'active').toLowerCase(),
    description: String(safePkg.description || ''),
    itemsIncluded: Array.isArray(safePkg.items_included) ? safePkg.items_included : [],
    image: String(safePkg.image || DEFAULT_PACKAGE_IMAGE),
  };
};

function AdminPackagesPage() {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState({});
  const [modalBannerError, setModalBannerError] = useState('');

  // Categories list
  const categoriesList = [
    'Marketing & SEO',
    'Software & IT',
    'Legal & Compliance',
    'Business Growth',
    'Package Bundle',
  ];

  // Registered Businesses & Freelancers from Database
  const [registeredBusinesses, setRegisteredBusinesses] = useState([]);
  const [registeredFreelancers, setRegisteredFreelancers] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch Packages and Entity Owners from MySQL Database
  const loadPackages = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [pkgRes, bizRes, freeRes] = await Promise.allSettled([
        api.get('/catalog/packages'),
        getBusinessEntities(),
        getFreelancers(),
      ]);

      if (bizRes.status === 'fulfilled' && Array.isArray(bizRes.value?.businesses)) {
        setRegisteredBusinesses(
          bizRes.value.businesses.map((b) => b.name || b.business_name).filter(Boolean)
        );
      }
      if (freeRes.status === 'fulfilled' && Array.isArray(freeRes.value?.freelancers)) {
        setRegisteredFreelancers(
          freeRes.value.freelancers.map((f) => f.name || f.full_name).filter(Boolean)
        );
      }
      if (pkgRes.status === 'fulfilled') {
        const rawPackages = pkgRes.value?.data?.packages;
        if (Array.isArray(rawPackages)) {
          setPackages(rawPackages.map(normalizePackage));
        } else {
          setPackages([]);
        }
      } else {
        const reasonMsg =
          pkgRes.reason?.response?.data?.message ||
          pkgRes.reason?.message ||
          'Unable to load packages from server.';
        setApiError(reasonMsg);
        setPackages([]);
      }
    } catch (err) {
      console.error('Error fetching packages from database:', err);
      setApiError(err?.message || 'Unable to load packages from database.');
      setPackages([]);
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
    ownerName: '',
    price: '',
    adminCommissionPercent: 18,
    billingCycle: 'Monthly Recurring',
    description: '',
    image: '',
  });

  const resetForm = (businessesOverride) => {
    const bizList = businessesOverride || registeredBusinesses;
    setFormData({
      name: '',
      category: categoriesList[0],
      ownerType: 'business',
      ownerName: bizList[0] || '',
      price: '',
      adminCommissionPercent: 18,
      billingCycle: 'Monthly Recurring',
      description: '',
      image: '',
    });
    setModalErrors({});
    setModalBannerError('');
    setEditingPackage(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      category: categoriesList.includes(pkg.category) ? pkg.category : categoriesList[0],
      ownerType: pkg.ownerType === 'freelancer' ? 'freelancer' : 'business',
      ownerName: pkg.ownerName || registeredBusinesses[0] || '',
      price: String(pkg.price ?? ''),
      adminCommissionPercent: pkg.adminCommissionPercent ?? 18,
      billingCycle: pkg.billingCycle || 'Monthly Recurring',
      description: pkg.description || '',
      image: pkg.image || '',
    });
    setModalErrors({});
    setModalBannerError('');
    setShowAddModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowAddModal(false);
    resetForm();
  };

  const handleOwnerTypeChange = (type) => {
    setFormData({
      ...formData,
      ownerType: type,
      ownerName:
        type === 'business'
          ? registeredBusinesses[0] || ''
          : registeredFreelancers[0] || '',
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
        if (selectedPackageDetails?.id === id) {
          setSelectedPackageDetails(null);
        }
        showToast('Package deleted from database!');
      } catch (e) {
        console.error('Error deleting package:', e);
        showToast('Error deleting package.');
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setModalErrors({});
    setModalBannerError('');

    const errors = {};
    if (!isRequired(formData.name)) {
      errors.name = 'Package title is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Package title must be at least 2 characters.';
    }

    const availableOwners =
      formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers;
    if (availableOwners.length > 0 && !isRequired(formData.ownerName) && !editingPackage) {
      errors.ownerName = 'Please select a package owner.';
    }

    if (!isRequired(formData.price)) {
      errors.price = 'Price is required.';
    } else if (!isValidNumber(formData.price, { min: 1 })) {
      errors.price = 'Price must be greater than ₹0.';
    }

    if (formData.adminCommissionPercent === '' || formData.adminCommissionPercent === undefined) {
      errors.adminCommissionPercent = 'Admin commission percentage is required.';
    } else if (!isValidPercentage(formData.adminCommissionPercent)) {
      errors.adminCommissionPercent = 'Admin commission must be between 0% and 100%.';
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      setModalBannerError('Please resolve the highlighted validation errors.');
      return;
    }

    setSaving(true);
    try {
      const parsedCommission = Number(formData.adminCommissionPercent);
      const commissionPercent = Number.isFinite(parsedCommission) ? parsedCommission : 18;
      const descriptionPayload =
        formData.description?.trim() ||
        `${formData.category} bundle package managed by ${formData.ownerName || 'Platform Managed'}.`;

      if (editingPackage) {
        const res = await api.put(`/catalog/packages/${editingPackage.id}`, {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          commission_percent: commissionPercent,
          description: descriptionPayload,
          status: editingPackage.status || 'active',
        });

        const updatedPkg = normalizePackage({
          ...(res.data?.package || editingPackage),
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          commission_percent: commissionPercent,
          category: formData.category,
          ownerType: formData.ownerType,
          ownerName: formData.ownerName || editingPackage.ownerName,
          billingCycle: formData.billingCycle,
          description: descriptionPayload,
          image: formData.image || editingPackage.image || DEFAULT_PACKAGE_IMAGE,
        });

        setPackages((prev) =>
          prev.map((item) => (item.id === editingPackage.id ? updatedPkg : item))
        );
        showToast('✓ Package updated in MySQL database successfully!');
      } else {
        const res = await api.post('/catalog/packages', {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          commission_percent: commissionPercent,
          description: descriptionPayload,
          status: 'active',
        });

        if (res.data?.package) {
          const saved = normalizePackage({
            ...res.data.package,
            category: formData.category,
            ownerType: formData.ownerType,
            ownerName: formData.ownerName || 'Platform Managed',
            billingCycle: formData.billingCycle,
            image: formData.image || DEFAULT_PACKAGE_IMAGE,
          });
          setPackages((prev) => [saved, ...prev]);
          showToast('✓ Package saved to MySQL database successfully!');
        }
      }

      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving package in database:', err);
      const { message, errors: backendErrors } = extractBackendErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setModalErrors(backendErrors);
      }
      setModalBannerError(message || 'Error saving package to database.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryBadgeClass = (category) => {
    const label = getCategoryLabel(category).toLowerCase();
    if (label.includes('software')) return 'badge-category software';
    if (label.includes('legal')) return 'badge-category legal';
    if (label.includes('marketing')) return 'badge-category marketing';
    return 'badge-category default';
  };

  const filteredPackages = useMemo(() => {
    const q = String(searchQuery || '').toLowerCase();
    return packages.filter((pkg) => {
      const nameStr = String(pkg?.name || '').toLowerCase();
      const catStr = getCategoryLabel(pkg?.category).toLowerCase();
      const ownerStr = String(pkg?.ownerName || '').toLowerCase();
      const cycleStr = String(pkg?.billingCycle || '').toLowerCase();

      const matchesSearch =
        nameStr.includes(q) ||
        catStr.includes(q) ||
        ownerStr.includes(q) ||
        cycleStr.includes(q);

      const matchesCat =
        categoryFilter === 'all' || getCategoryLabel(pkg?.category) === categoryFilter;
      const matchesOwner = ownerFilter === 'all' || pkg?.ownerType === ownerFilter;

      return matchesSearch && matchesCat && matchesOwner;
    });
  }, [packages, searchQuery, categoryFilter, ownerFilter]);

  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.status === 'active').length;
  const totalSubscribers = packages.reduce((acc, p) => acc + (Number(p.subscribersCount) || 0), 0);

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
        <button className="pro-btn-create" onClick={openCreateModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Package
        </button>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.9rem 1.2rem',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>⚠️ {apiError}</span>
          <button
            type="button"
            className="btn-action-sm"
            onClick={loadPackages}
            style={{ background: '#ffffff', borderColor: '#fca5a5', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
      )}

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
            <span className="pro-stat-trend">Subscribers</span>
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

      {/* Loading State */}
      {loading ? (
        <div className="pro-card-table" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ margin: 0, fontWeight: '600' }}>Loading pricing packages from database...</p>
        </div>
      ) : viewMode === 'table' ? (
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
                <th>Price &amp; Commission</th>
                <th>Billing Cycle</th>
                <th>Active Subscribers</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
                    <p style={{ margin: 0, fontWeight: '600' }}>No pricing packages matching your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div className="pro-item-cell">
                        <img
                          className="pro-item-thumb"
                          src={pkg.image || DEFAULT_PACKAGE_IMAGE}
                          alt={pkg.name}
                          onError={(e) => { e.currentTarget.src = DEFAULT_PACKAGE_IMAGE; }}
                        />
                        <div>
                          <div className="pro-item-title">{pkg.name}</div>
                          <div className="pro-item-sub">
                            ID: #{pkg.id} {pkg.created_at ? `• Added ${formatDate(pkg.created_at)}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getCategoryBadgeClass(pkg.category)}>
                        {getCategoryLabel(pkg.category)}
                      </span>
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
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          ₹{(Number(pkg.price) || 0).toLocaleString('en-IN')}
                        </strong>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                          🏛️ {pkg.adminCommissionPercent}% Admin Cut
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
                        <button
                          type="button"
                          className="btn-action-sm"
                          onClick={() => setSelectedPackageDetails(pkg)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn-action-sm"
                          onClick={() => openEditModal(pkg)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action-sm"
                          onClick={() => handleToggleStatus(pkg.id)}
                        >
                          {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => handleDeletePackage(pkg.id)}
                        >
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
      ) : filteredPackages.length === 0 ? (
        <div className="pro-card-table" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚡</div>
          <p style={{ margin: 0, fontWeight: '600' }}>No pricing packages matching your search criteria</p>
        </div>
      ) : (
        /* Grid View */
        <div className="pro-grid-showcase">
          {filteredPackages.map((pkg) => (
            <div className="pro-card-showcase" key={pkg.id}>
              <div className="pro-card-img-wrapper">
                <img
                  src={pkg.image || DEFAULT_PACKAGE_IMAGE}
                  alt={pkg.name}
                  onError={(e) => { e.currentTarget.src = DEFAULT_PACKAGE_IMAGE; }}
                />
                <div className="pro-card-badge-top">
                  <span className={getCategoryBadgeClass(pkg.category)}>
                    {getCategoryLabel(pkg.category)}
                  </span>
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
                    <span className="pro-card-price">₹{(Number(pkg.price) || 0).toLocaleString('en-IN')}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', marginTop: '0.15rem' }}>
                      🏛️ {pkg.adminCommissionPercent}% Admin Cut
                    </span>
                  </div>
                  <div
                    className="pro-card-stock"
                    style={{ color: pkg.status === 'active' ? '#16a34a' : '#64748b', fontWeight: 600 }}
                  >
                    {pkg.status === 'active' ? 'Active Pack' : 'Inactive'}
                  </div>
                </div>

                <div className="pro-card-actions">
                  <button
                    type="button"
                    className="btn-action-sm"
                    onClick={() => setSelectedPackageDetails(pkg)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="btn-action-sm"
                    onClick={() => openEditModal(pkg)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-action-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleToggleStatus(pkg.id)}
                  >
                    {pkg.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
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

      {/* Package Details Modal */}
      {selectedPackageDetails && (
        <div className="pro-modal-overlay" onClick={() => setSelectedPackageDetails(null)}>
          <div className="pro-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title">Package Details (#{selectedPackageDetails.id})</h3>
              <button
                type="button"
                className="pro-modal-close"
                onClick={() => setSelectedPackageDetails(null)}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{selectedPackageDetails.name}</strong>
                <span className={`status-pill ${selectedPackageDetails.status}`}>
                  {selectedPackageDetails.status === 'active' ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Base Price</span>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                    ₹{(Number(selectedPackageDetails.price) || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Admin Commission</span>
                  <strong style={{ fontSize: '1rem', color: '#1e40af' }}>
                    {selectedPackageDetails.adminCommissionPercent}%
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Category</span>
                  <strong>{getCategoryLabel(selectedPackageDetails.category)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Created</span>
                  <strong>{selectedPackageDetails.created_at ? formatDate(selectedPackageDetails.created_at) : '—'}</strong>
                </div>
              </div>
              {selectedPackageDetails.description && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Description</span>
                  <p style={{ margin: 0, lineHeight: 1.5, color: '#475569' }}>{selectedPackageDetails.description}</p>
                </div>
              )}
              {Array.isArray(selectedPackageDetails.itemsIncluded) && selectedPackageDetails.itemsIncluded.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>Included Deliverables</span>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', lineHeight: 1.6 }}>
                    {selectedPackageDetails.itemsIncluded.map((item, idx) => (
                      <li key={idx}>{typeof item === 'object' && item !== null ? (item.name || item.title || JSON.stringify(item)) : String(item)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-action-sm"
                  onClick={() => {
                    const target = selectedPackageDetails;
                    setSelectedPackageDetails(null);
                    openEditModal(target);
                  }}
                >
                  Edit Package
                </button>
                <button
                  type="button"
                  className="pro-btn-create"
                  style={{ padding: '0.55rem 1.2rem' }}
                  onClick={() => setSelectedPackageDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {showAddModal && (
        <div className="pro-modal-overlay" onClick={closeModal}>
          <div className="pro-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pro-modal-header">
              <h3 className="pro-modal-title">
                {editingPackage ? `Edit Pricing Package (#${editingPackage.id})` : 'Create Pricing Package'}
              </h3>
              <button type="button" className="pro-modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }} noValidate>
              {modalBannerError && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                  ⚠️ {modalBannerError}
                </div>
              )}

              <div className="pro-form-group">
                <label className="pro-form-label">Package Title *</label>
                <input
                  type="text"
                  className="pro-input"
                  placeholder="e.g. Digital Growth Accelerator Bundle"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setModalErrors((prev) => ({ ...prev, name: undefined }));
                    setModalBannerError('');
                  }}
                  style={getInputErrorStyle(modalErrors.name)}
                  required
                />
                <FieldError error={modalErrors.name} />
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
                  Select {formData.ownerType === 'business' ? 'Business Entity' : 'Freelance Provider'}
                </label>
                <select
                  className="pro-select-input"
                  value={formData.ownerName}
                  onChange={(e) => {
                    setFormData({ ...formData, ownerName: e.target.value });
                    setModalErrors((prev) => ({ ...prev, ownerName: undefined }));
                    setModalBannerError('');
                  }}
                  style={getInputErrorStyle(modalErrors.ownerName)}
                >
                  {(formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).length === 0 ? (
                    <option value="">Platform Managed (No entities registered)</option>
                  ) : (
                    (formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </select>
                <FieldError error={modalErrors.ownerName} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="pro-form-group">
                  <label className="pro-form-label">Price (₹) *</label>
                  <input
                    type="number"
                    className="pro-input"
                    placeholder="e.g. 7999"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      setModalErrors((prev) => ({ ...prev, price: undefined }));
                      setModalBannerError('');
                    }}
                    style={getInputErrorStyle(modalErrors.price)}
                    required
                  />
                  <FieldError error={modalErrors.price} />
                </div>

                <div className="pro-form-group">
                  <label className="pro-form-label">Admin Commission (%) *</label>
                  <input
                    type="number"
                    className="pro-input"
                    placeholder="e.g. 18"
                    value={formData.adminCommissionPercent}
                    onChange={(e) => {
                      setFormData({ ...formData, adminCommissionPercent: e.target.value });
                      setModalErrors((prev) => ({ ...prev, adminCommissionPercent: undefined }));
                      setModalBannerError('');
                    }}
                    min="0"
                    max="100"
                    style={getInputErrorStyle(modalErrors.adminCommissionPercent)}
                    required
                  />
                  <FieldError error={modalErrors.adminCommissionPercent} />
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

              <div className="pro-form-group">
                <label className="pro-form-label">Package Description</label>
                <textarea
                  className="pro-input"
                  rows="2"
                  placeholder="Optional summary of included services or benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: 'vertical', minHeight: '64px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-action-sm"
                  style={{ padding: '0.7rem 1.4rem' }}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pro-btn-create"
                  style={{ padding: '0.7rem 1.4rem', opacity: saving ? 0.7 : 1 }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingPackage ? 'Update Package' : 'Save Package'}
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
