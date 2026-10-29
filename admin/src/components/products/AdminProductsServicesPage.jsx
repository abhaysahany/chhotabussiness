import React, { useState, useMemo } from 'react';

function AdminProductsServicesPage({ initialTab = 'products-catalog', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'products-catalog' | 'services-listings' | 'products-packages'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Sample Product & Service Items Data
  const [items, setItems] = useState([
    {
      id: 1,
      name: 'GST Registration & Tax Filing Package',
      type: 'service',
      category: 'Legal & Compliance',
      price: 2999,
      entityType: 'business',
      entityName: 'AddNet Tax Advisory',
      stockOrDuration: '1 Year Subscription',
      status: 'active',
      salesCount: 142,
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200&auto=format&fit=crop&q=80',
      created_at: '2026-07-10',
    },
    {
      id: 2,
      name: 'Enterprise Cloud ERP Software Suite',
      type: 'product',
      category: 'Software & IT',
      price: 14999,
      entityType: 'business',
      entityName: 'Skyline Technologies Pvt Ltd',
      stockOrDuration: '50 Licenses Available',
      status: 'active',
      salesCount: 88,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=80',
      created_at: '2026-07-15',
    },
    {
      id: 3,
      name: 'UI/UX Mobile App Design Consultation',
      type: 'service',
      category: 'Design & Creative',
      price: 4999,
      entityType: 'freelancer',
      entityName: 'Priya Patel (UI/UX Freelancer)',
      stockOrDuration: 'Per Project Basis',
      status: 'active',
      salesCount: 65,
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&auto=format&fit=crop&q=80',
      created_at: '2026-07-20',
    },
    {
      id: 4,
      name: 'Professional Digital Marketing Starter Kit',
      type: 'package',
      category: 'Marketing & SEO',
      price: 7999,
      entityType: 'business',
      entityName: 'GrowthX Media Solutions',
      stockOrDuration: 'Monthly Recurring',
      status: 'active',
      salesCount: 110,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=80',
      created_at: '2026-08-01',
    },
    {
      id: 5,
      name: 'Custom E-Commerce Store Setup',
      type: 'service',
      category: 'Software & IT',
      price: 12499,
      entityType: 'freelancer',
      entityName: 'Rohan Sharma (Full Stack Dev)',
      stockOrDuration: 'Deliver in 7 Days',
      status: 'inactive',
      salesCount: 24,
      image: 'https://images.unsplash.com/photo-1556742049-0a67daf4095a?w=200&auto=format&fit=crop&q=80',
      created_at: '2026-08-05',
    },
    {
      id: 6,
      name: 'Corporate Brand Identity & Logo Suite',
      type: 'product',
      category: 'Design & Creative',
      price: 3499,
      entityType: 'business',
      entityName: 'PixelCraft Studio',
      stockOrDuration: 'Unlimited Downloads',
      status: 'active',
      salesCount: 205,
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&auto=format&fit=crop&q=80',
      created_at: '2026-08-10',
    },
  ]);

  // Form State for Adding New Item
  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
    category: 'Software & IT',
    price: '',
    entityType: 'business',
    entityName: '',
    stockOrDuration: '',
    image: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleToggleStatus = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
          : item
      )
    );
    showToast('Product / Service status updated successfully!');
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this listing from catalog?')) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast('Item deleted from catalog!');
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.entityName) {
      alert('Please fill out all required fields');
      return;
    }

    const newItem = {
      id: Date.now(),
      name: formData.name,
      type: formData.type,
      category: formData.category,
      price: parseFloat(formData.price),
      entityType: formData.entityType,
      entityName: formData.entityName,
      stockOrDuration: formData.stockOrDuration || 'Standard Offering',
      status: 'active',
      salesCount: 0,
      image: formData.image || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200',
      created_at: new Date().toISOString().split('T')[0],
    };

    setItems([newItem, ...items]);
    setShowAddModal(false);
    setFormData({
      name: '',
      type: 'product',
      category: 'Software & IT',
      price: '',
      entityType: 'business',
      entityName: '',
      stockOrDuration: '',
      image: '',
    });
    showToast('New Product / Service added to catalog!');
  };

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by Active Tab
      let matchesTab = true;
      if (activeTab === 'products-catalog') matchesTab = item.type === 'product';
      else if (activeTab === 'services-listings') matchesTab = item.type === 'service';
      else if (activeTab === 'products-packages') matchesTab = item.type === 'package';

      // Filter by Search Query
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.entityName.toLowerCase().includes(query);

      // Filter by Category
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;

      // Filter by Status
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesTab && matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, activeTab, searchQuery, categoryFilter, statusFilter]);

  // Compute Overview Stats
  const totalProducts = items.filter((i) => i.type === 'product').length;
  const totalServices = items.filter((i) => i.type === 'service').length;
  const totalPackages = items.filter((i) => i.type === 'package').length;
  const totalRevenueGenerated = items.reduce((acc, i) => acc + i.price * i.salesCount, 0);

  return (
    <div className="page-content-wrapper">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontWeight: '600',
            borderLeft: '4px solid #6366f1',
          }}
        >
          <span>✨ {toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="page-subheader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Products & Services Catalog</h2>
          <div className="page-breadcrumb">
            <span>Admin Suite</span>
            <span className="separator">›</span>
            <span>Business</span>
            <span className="separator">›</span>
            <span className="active">Products & Services</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onClick={() => setShowAddModal(true)}
        >
          <span>+</span> Add New Product / Service
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="status-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Listed Products</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value">{totalProducts} Items</div>
          <p className="metric-desc">Physical & Digital Catalog</p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Listed Services</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value">{totalServices} Services</div>
          <p className="metric-desc">Freelance & Agency Offerings</p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Special Packages</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value">{totalPackages} Bundles</div>
          <p className="metric-desc">Recurring Subscriptions</p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Catalog Sales Value</span>
            <span className="status-dot active"></span>
          </div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            ₹{(totalRevenueGenerated / 100000).toFixed(2)} Lakh
          </div>
          <p className="metric-desc">Total Cumulative Orders</p>
        </div>
      </div>

      {/* Sub-Tab Navigation Switcher */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '0.5rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        <button
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'products-catalog' ? '#6366f1' : 'transparent',
            color: activeTab === 'products-catalog' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setActiveTab('products-catalog')}
        >
          📦 Products Catalog ({totalProducts})
        </button>

        <button
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'services-listings' ? '#6366f1' : 'transparent',
            color: activeTab === 'services-listings' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setActiveTab('services-listings')}
        >
          🛠️ Services Listings ({totalServices})
        </button>

        <button
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'products-packages' ? '#6366f1' : 'transparent',
            color: activeTab === 'products-packages' ? '#ffffff' : '#64748b',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setActiveTab('products-packages')}
        >
          ⚡ Pricing Packages ({totalPackages})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search by Title, Category, or Provider Entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              color: '#334155',
              background: '#fff',
              outline: 'none',
            }}
          >
            <option value="all">All Categories</option>
            <option value="Software & IT">Software & IT</option>
            <option value="Design & Creative">Design & Creative</option>
            <option value="Legal & Compliance">Legal & Compliance</option>
            <option value="Marketing & SEO">Marketing & SEO</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              color: '#334155',
              background: '#fff',
              outline: 'none',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
            Catalog Inventory Directory ({filteredItems.length} Listings)
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Item Details</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Category</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Entity Provider</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Price (₹)</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Availability / Duration</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛍️</div>
                    <p style={{ margin: 0, fontWeight: '600' }}>No listings found matching filters</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                        />
                        <div>
                          <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #{item.id} • Created {item.created_at}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#334155', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: '#334155' }}>{item.entityName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#6366f1', textTransform: 'capitalize' }}>{item.entityType} Owner</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>₹{item.price.toLocaleString()}</strong>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                      {item.stockOrDuration}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: item.status === 'active' ? '#dcfce7' : '#fef2f2',
                          color: item.status === 'active' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {item.status === 'active' ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          {item.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #fca5a5',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
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
      </div>

      {/* Add New Listing Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              maxWidth: '540px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>Add Product / Service Listing</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Title / Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Cloud ERP Package"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Listing Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="product">Physical / Digital Product</option>
                    <option value="service">Professional Service</option>
                    <option value="package">Bundled Pricing Package</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
                  >
                    <option value="Software & IT">Software & IT</option>
                    <option value="Design & Creative">Design & Creative</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Marketing & SEO">Marketing & SEO</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 4999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Provider Entity Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Skyline Technologies"
                    value={formData.entityName}
                    onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Stock / Availability Info</label>
                <input
                  type="text"
                  placeholder="e.g. Deliver in 3 Days or 50 Units Available"
                  value={formData.stockOrDuration}
                  onChange={(e) => setFormData({ ...formData, stockOrDuration: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: '700' }}
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductsServicesPage;
