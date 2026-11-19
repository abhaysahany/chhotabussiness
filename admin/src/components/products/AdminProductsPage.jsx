import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  CheckCircle2,
  Building2,
  Zap,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Edit3,
  Trash2,
  Plus,
  ArrowUpRight,
  Check,
  X,
  AlertTriangle,
  Layers,
  Tag,
  DollarSign,
  Percent,
  Boxes,
  User,
  Image as ImageIcon,
  FolderTree,
  Upload,
} from 'lucide-react';
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
import {
  isRequired,
  isValidNumber,
  isValidPercentage,
  validateImageFile,
  FieldError,
  getInputErrorStyle,
  extractBackendErrors,
} from '../../utils/validation';
import StatusBadge from '../common/StatusBadge';

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
  const [formErrors, setFormErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState('');

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
      defaultOwner = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || '') : '';
    } else {
      defaultOwner = freelancersList.length > 0 ? (freelancersList[0].name || freelancersList[0].full_name || '') : '';
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
    setFormErrors({});
    setFormBannerError('');
    const defaultCat = categoriesList[0] || 'Software & IT';
    const defaultBiz = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || '') : '';

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
    setFormErrors({});
    setFormBannerError('');
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
    setFormErrors({});
    setFormBannerError('');

    const errors = {};
    if (!isRequired(formData.name)) {
      errors.name = 'Product title is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Product title must be at least 2 characters.';
    }

    if (!isRequired(formData.category)) {
      errors.category = 'Product category is required.';
    }

    if (!isRequired(formData.owner_name)) {
      errors.owner_name = 'Product owner is required.';
    }

    if (!isRequired(formData.price)) {
      errors.price = 'Price is required.';
    } else if (!isValidNumber(formData.price, { min: 1 })) {
      errors.price = 'Price must be greater than ₹0.';
    }

    if (formData.admin_commission_percent === '' || formData.admin_commission_percent === undefined) {
      errors.admin_commission_percent = 'Admin commission percentage is required.';
    } else if (!isValidPercentage(formData.admin_commission_percent)) {
      errors.admin_commission_percent = 'Admin commission must be between 0% and 100%.';
    }

    if (formData.stock !== '' && formData.stock !== undefined) {
      const stockNum = parseInt(formData.stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        errors.stock = 'Stock inventory must be 0 or greater.';
      }
    }

    if (formData.image_file) {
      const fileErr = validateImageFile(formData.image_file, 5);
      if (fileErr) {
        errors.image_file = fileErr;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFormBannerError('Please resolve the highlighted validation errors.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
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
      console.error('Error saving product in database:', err);
      const backendErrors = extractBackendErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setFormErrors(backendErrors);
      }
      setFormBannerError(err.response?.data?.message || 'Failed to save product in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const owner = p.owner_name || p.ownerName || '';
      const ownerType = p.owner_type || p.ownerType || '';
      const cat = typeof p.category === 'object' && p.category !== null ? (p.category.name || '') : String(p.category || '');
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
  const activeProducts = useMemo(() => products.filter((p) => p.status === 'active').length, [products]);
  const businessProducts = useMemo(() => products.filter((p) => (p.owner_type || p.ownerType) === 'business').length, [products]);
  const freelanceProducts = useMemo(() => products.filter((p) => (p.owner_type || p.ownerType) === 'freelancer').length, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert Notification */}
      {toast && (
        <div
          style={{
            backgroundColor: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
            color: toast.type === 'error' ? '#b91c1c' : '#047857',
            border: `1.5px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            padding: '0.9rem 1.35rem',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {toast.type === 'error' ? <AlertTriangle size={18} color="#dc2626" /> : <CheckCircle2 size={18} color="#059669" />}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d">
            <Package size={32} strokeWidth={2.3} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                ● MASTER CATALOG INVENTORY
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                ● {products.length} Products Cataloged
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Products Catalog Management
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Manage platform products inventory, vendor allocations, pricing models, and automated admin commission settlements.
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={openAddModal}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem' }}
            >
              <Plus size={18} strokeWidth={2.4} />
              <span>Create New Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Total Catalog Items */}
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
                ● TOTAL INVENTORY
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TOTAL CATALOG ITEMS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Package size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem' }}>
              {totalProducts}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Boxes size={13} color="#3569a7" />
              <span>All catalog listings</span>
            </span>
            <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Global Base
            </span>
          </div>
        </div>

        {/* Card 2: Active & Live */}
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
                ● LIVE STATUS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ACTIVE &amp; LIVE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#0d9488' }}>
              {activeProducts}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>Operational products</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Live Active
            </span>
          </div>
        </div>

        {/* Card 3: Business Items */}
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
                ● CORPORATE MERCHANTS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                BUSINESS ITEMS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Building2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {businessProducts}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Building2 size={13} color="#d97706" />
              <span>Corporate partners</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Enterprises
            </span>
          </div>
        </div>

        {/* Card 4: Freelance Items */}
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
                ● TALENT INVENTORY
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                FREELANCE ITEMS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#9333ea' }}>
              {freelanceProducts}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Zap size={13} color="#9333ea" />
              <span>Freelance offerings</span>
            </span>
            <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Contractors
            </span>
          </div>
        </div>
      </div>

      {/* 3. Executive Filter & View Switcher Bar (Single Unified Row) */}
      <div className="adm-toolbar-card">
        <div className="adm-toolbar-filters">
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
            <input
              type="text"
              className="adm-toolbar-input"
              placeholder="Search product, category, vendor, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Category Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '155px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Type Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '155px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="all">All Vendor Types</option>
              <option value="business">Registered Businesses</option>
              <option value="freelancer">Freelancer Experts</option>
            </select>
          </div>

          {(searchQuery || categoryFilter !== 'all' || ownerFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setOwnerFilter('all');
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
              onClick={() => setViewMode('table')}
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
                background: viewMode === 'table' ? '#3569a7' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#64748b',
                boxShadow: viewMode === 'table' ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <TableIcon size={14} />
              <span>Data Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
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
                background: viewMode === 'grid' ? '#3569a7' : 'transparent',
                color: viewMode === 'grid' ? '#ffffff' : '#64748b',
                boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(53, 105, 167, 0.35)' : 'none',
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
            onClick={openAddModal}
            style={{ height: '38px', padding: '0 1.15rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            <Plus size={15} /> <span>New Product</span>
          </button>
        </div>
      </div>

      {/* 4. Main Body: Data Table or Grid Cards View */}
      {loading ? (
        <div className="adm-chart-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
            Loading products catalog from database...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="adm-chart-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Package size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>No Products Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
            {searchQuery || categoryFilter !== 'all' || ownerFilter !== 'all'
              ? 'Try adjusting your search criteria.'
              : 'Create your first catalog product listing to begin.'}
          </p>
          <button
            type="button"
            className="adm-hero-btn-primary"
            onClick={openAddModal}
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            <Plus size={16} /> Add First Product
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* DATA TABLE VIEW */
        <div className="adm-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#cbd5e1', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Product Details</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Category</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Vendor / Partner</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Base Price</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Admin Cut %</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Stock Inventory</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const ownerName = p.owner_name || p.ownerName;
                  const ownerType = p.owner_type || p.ownerType || 'business';
                  const comm = p.admin_commission_percent || p.adminCommissionPercent || 15;
                  const categoryName = typeof p.category === 'object' && p.category !== null ? (p.category.name || 'Product') : String(p.category || 'Product');

                  return (
                    <tr key={p.id} className="adm-table-row">
                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400'}
                            alt={p.name}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: '1.5px solid #e2e8f0',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              flexShrink: 0,
                            }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                              {p.name}
                            </div>
                            <div style={{ marginTop: '2px' }}>
                              <span className="adm-code-chip">{p.sku || `SKU-${p.id}`}</span>
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
                          <span>{categoryName}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                            {ownerName}
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              marginTop: '2px',
                              background: ownerType === 'business' ? '#f0fdf4' : '#faf5ff',
                              color: ownerType === 'business' ? '#15803d' : '#7e22ce',
                              border: `1px solid ${ownerType === 'business' ? '#bbf7d0' : '#e9d5ff'}`,
                            }}
                          >
                            {ownerType === 'business' ? <Building2 size={10} /> : <Zap size={10} />}
                            <span>{ownerType === 'business' ? 'Business Partner' : 'Freelancer'}</span>
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                          }}
                        >
                          {comm}% Cut
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            background: p.stock <= 10 ? '#fef2f2' : '#f8fafc',
                            color: p.stock <= 10 ? '#dc2626' : '#334155',
                            border: `1px solid ${p.stock <= 10 ? '#fecaca' : '#e2e8f0'}`,
                          }}
                        >
                          {p.stock} units
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '9999px',
                            border: p.status === 'active' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            background: p.status === 'active' ? '#ecfdf5' : '#f8fafc',
                            color: p.status === 'active' ? '#059669' : '#94a3b8',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.status === 'active' ? '#059669' : '#94a3b8' }} />
                          <span>{p.status === 'active' ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
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
                            onClick={() => handleDeleteProduct(p.id)}
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
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Bar */}
          <div style={{ padding: '0.85rem 1.4rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ fontWeight: 700, color: '#334155' }}>
              ● Product catalog synchronized with MySQL 8.0 schema
            </span>
            <span style={{ fontWeight: 800, color: '#3569a7' }}>
              Showing {filteredProducts.length} of {products.length} Products
            </span>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.4rem' }}>
          {filteredProducts.map((p) => {
            const ownerName = p.owner_name || p.ownerName;
            const ownerType = p.owner_type || p.ownerType || 'business';
            const comm = p.admin_commission_percent || p.adminCommissionPercent || 15;
            const categoryName = typeof p.category === 'object' && p.category !== null ? (p.category.name || 'Product') : String(p.category || 'Product');

            return (
              <div
                key={p.id}
                className="adm-chart-card adm-chart-card-glow"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Media Header */}
                  <div style={{ position: 'relative', height: '170px', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400'}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400';
                      }}
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.35rem' }}>
                      <span
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}
                      >
                        {categoryName}
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <StatusBadge status={p.status} fallback="active" />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.15rem' }}>
                    <span className="adm-code-chip">{p.sku || `SKU-${p.id}`}</span>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.25rem 0', lineHeight: 1.35 }}>
                      {p.name}
                    </h4>

                    {/* Vendor Vault */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      <span>Vendor:</span>
                      <strong style={{ color: '#0f172a' }}>{ownerName}</strong>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          background: ownerType === 'business' ? '#f0fdf4' : '#faf5ff',
                          color: ownerType === 'business' ? '#15803d' : '#7e22ce',
                        }}
                      >
                        {ownerType}
                      </span>
                    </div>

                    {/* Price & Commission Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: '#f8fafc', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Base Price</div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>₹{Number(p.price).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Admin Cut</div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#059669' }}>{comm}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '0.85rem 1.15rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.stock <= 10 ? '#dc2626' : '#64748b' }}>
                    Stock: {p.stock} units
                  </span>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '7px',
                        padding: '0.32rem 0.75rem',
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
                      onClick={() => handleDeleteProduct(p.id)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #fecaca',
                        borderRadius: '7px',
                        padding: '0.32rem 0.75rem',
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.68)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '640px', background: '#ffffff', borderRadius: '22px', border: '1.5px solid #cbd5e1', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.35rem 1.6rem', borderBottom: '1px solid #e2e8f0', background: 'radial-gradient(circle at 95% 8%, rgba(53, 105, 167, 0.06) 0%, #ffffff 70%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
                  <Package size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingProduct ? 'Edit Catalog Product' : 'Create New Product'}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Configure pricing, vendor association, and admin settlement percentage
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#64748b', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem 1.6rem', maxHeight: '520px', overflowY: 'auto' }}>
              {formBannerError && (
                <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  <span>{formBannerError}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Product Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Cloud ERP Suite"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                      setFormBannerError('');
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

                {/* Category & Vendor Type */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Vendor Partner Type *
                    </label>
                    <div style={{ display: 'flex', gap: '0.45rem', height: '38px' }}>
                      <button
                        type="button"
                        onClick={() => handleOwnerTypeChange('business')}
                        style={{
                          flex: 1,
                          border: formData.owner_type === 'business' ? '1.5px solid #3569a7' : '1.5px solid #cbd5e1',
                          background: formData.owner_type === 'business' ? 'rgba(53, 105, 167, 0.08)' : '#ffffff',
                          color: formData.owner_type === 'business' ? '#3569a7' : '#64748b',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                        }}
                      >
                        🏢 Business
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOwnerTypeChange('freelancer')}
                        style={{
                          flex: 1,
                          border: formData.owner_type === 'freelancer' ? '1.5px solid #7c3aed' : '1.5px solid #cbd5e1',
                          background: formData.owner_type === 'freelancer' ? 'rgba(124, 58, 237, 0.08)' : '#ffffff',
                          color: formData.owner_type === 'freelancer' ? '#7c3aed' : '#64748b',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Freelancer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Partner Entity Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Select Partner Entity (From Database) *
                  </label>
                  <select
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  >
                    {formData.owner_type === 'business' ? (
                      businessesList.length > 0 ? (
                        businessesList.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name} ({b.owner_name || `B${b.id}`})
                          </option>
                        ))
                      ) : (
                        <option value="">No businesses registered in DB</option>
                      )
                    ) : (
                      freelancersList.length > 0 ? (
                        freelancersList.map((f) => (
                          <option key={f.id} value={f.name}>
                            {f.name} ({f.title || `F${f.id}`})
                          </option>
                        ))
                      ) : (
                        <option value="">No freelancers registered in DB</option>
                      )
                    )}
                  </select>
                </div>

                {/* Pricing, Commission & Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="14999"
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        setFormErrors((prev) => ({ ...prev, price: undefined }));
                        setFormBannerError('');
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 700, outline: 'none', ...getInputErrorStyle(formErrors.price) }}
                    />
                    <FieldError error={formErrors.price} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Admin Cut (%) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="15"
                      value={formData.admin_commission_percent}
                      onChange={(e) => {
                        setFormData({ ...formData, admin_commission_percent: e.target.value });
                        setFormErrors((prev) => ({ ...prev, admin_commission_percent: undefined }));
                        setFormBannerError('');
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 700, outline: 'none', ...getInputErrorStyle(formErrors.admin_commission_percent) }}
                    />
                    <FieldError error={formErrors.admin_commission_percent} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Stock Inventory *
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="50"
                      value={formData.stock}
                      onChange={(e) => {
                        setFormData({ ...formData, stock: e.target.value });
                        setFormErrors((prev) => ({ ...prev, stock: undefined }));
                        setFormBannerError('');
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 700, outline: 'none', ...getInputErrorStyle(formErrors.stock) }}
                    />
                    <FieldError error={formErrors.stock} />
                  </div>
                </div>

                {/* SKU Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    SKU Code <span style={{ color: '#94a3b8', fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ERP-CLOUD-2026"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 600, outline: 'none' }}
                  />
                </div>

                {/* Image Upload / URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Product Media Image
                  </label>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        padding: '0.55rem 0.95rem',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Upload size={14} /> Browse Image
                      <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </label>

                    <input
                      type="url"
                      placeholder="Or paste external image URL..."
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      style={{ flex: '1 1 200px', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                  <FieldError error={formErrors.image_file} />

                  {imagePreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.65rem' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid #cbd5e1' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, image: '', image_file: null });
                        }}
                        style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Product Description <span style={{ color: '#94a3b8', fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Details about product specifications, inclusions, and licenses..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.95rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', lineHeight: 1.5, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '0.6rem 1.25rem', fontWeight: 800, fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="adm-hero-btn-primary"
                  style={{ padding: '0.6rem 1.45rem', fontSize: '0.82rem' }}
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;