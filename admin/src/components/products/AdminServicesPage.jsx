import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
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
  Clock,
  User,
  Image as ImageIcon,
  FolderTree,
  Upload,
} from 'lucide-react';
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

function AdminServicesPage() {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState('');

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

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
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

      setCategoriesList(Array.from(categoryNames));

      if (bizData.status === 'fulfilled' && bizData.value?.businesses) {
        setBusinessesList(bizData.value.businesses);
      }

      if (freeData.status === 'fulfilled' && freeData.value?.freelancers) {
        setFreelancersList(freeData.value.freelancers);
      }
    } catch (err) {
      console.error('Error loading services data:', err);
      showToast('Error loading services from database.', 'error');
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
    setEditingService(null);
    setFormErrors({});
    setFormBannerError('');
    const defaultCat = categoriesList[0] || '';
    const defaultBiz = businessesList.length > 0 ? (businessesList[0].name || businessesList[0].business_name || '') : '';

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
    setFormErrors({});
    setFormBannerError('');
    setFormData({
      name: s.name,
      category: s.category,
      owner_type: s.owner_type || s.ownerType || 'business',
      owner_name: s.owner_name || s.ownerName || (businessesList[0]?.name || businessesList[0]?.business_name || ''),
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
      showToast(`Service status set to ${newStatus}!`, 'success');
    } catch (err) {
      showToast('Failed to update service status.', 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this service from MySQL database?')) {
      try {
        await deleteAdminService(id);
        setServices((prev) => prev.filter((item) => item.id !== id));
        showToast('Service successfully deleted from database!', 'success');
      } catch (err) {
        showToast('Failed to delete service.', 'error');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormBannerError('');

    const errors = {};
    if (!isRequired(formData.name)) {
      errors.name = 'Service title is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Service title must be at least 2 characters.';
    }

    if (!isRequired(formData.category)) {
      errors.category = 'Service category is required.';
    }

    if (!isRequired(formData.owner_name)) {
      errors.owner_name = 'Service provider is required.';
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

    if (!isRequired(formData.duration)) {
      errors.duration = 'Delivery turnaround duration is required.';
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
      payload.append('duration', formData.duration || '3 Business Days');
      payload.append('description', formData.description || '');
      if (formData.image_file) {
        payload.append('image_file', formData.image_file);
      } else if (formData.image) {
        payload.append('image', formData.image);
      }

      if (editingService) {
        const res = await updateAdminService(editingService.id, payload);
        showToast(res.message || 'Service updated successfully!', 'success');
      } else {
        const res = await createAdminService(payload);
        showToast(res.message || 'New service saved to database!', 'success');
      }

      setShowAddModal(false);
      await loadData();
    } catch (err) {
      console.error('Error saving service in database:', err);
      const backendErrors = extractBackendErrors(err);
      if (Object.keys(backendErrors).length > 0) {
        setFormErrors(backendErrors);
      }
      const msg = err.response?.data?.message || 'Failed to save service in database.';
      setFormBannerError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchQuery.toLowerCase();
      const owner = s.owner_name || s.ownerName || '';
      const ownerType = s.owner_type || s.ownerType || '';
      const cat = typeof s.category === 'object' && s.category !== null ? (s.category.name || '') : String(s.category || '');

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
  const activeServices = useMemo(() => services.filter((s) => s.status === 'active').length, [services]);
  const businessServices = useMemo(() => services.filter((s) => (s.owner_type || s.ownerType) === 'business').length, [services]);
  const freelanceServices = useMemo(() => services.filter((s) => (s.owner_type || s.ownerType) === 'freelancer').length, [services]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: toastType === 'error' ? '#fef2f2' : '#ecfdf5',
            color: toastType === 'error' ? '#b91c1c' : '#047857',
            border: `1.5px solid ${toastType === 'error' ? '#fecaca' : '#a7f3d0'}`,
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
            {toastType === 'error' ? <AlertTriangle size={18} color="#dc2626" /> : <CheckCircle2 size={18} color="#059669" />}
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
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
            <Briefcase size={32} strokeWidth={2.3} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                ● MASTER SERVICES PORTFOLIO
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                ● {services.length} Services Listed
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Services Catalog Management
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Manage professional client service offerings, turnarounds, provider allocations, and commission splits across the platform.
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
              <span>Create New Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Total Services */}
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
                ● SERVICE SUITE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TOTAL SERVICES
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Briefcase size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem' }}>
              {totalServices}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Layers size={13} color="#3569a7" />
              <span>Professional catalog</span>
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
              {activeServices}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>Operational offerings</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Live Active
            </span>
          </div>
        </div>

        {/* Card 3: Corporate Services */}
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
                ● ENTERPRISE OFFERS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                CORPORATE SERVICES
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Building2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {businessServices}
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

        {/* Card 4: Freelance Gigs */}
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
                ● FREELANCE GIGS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                FREELANCE GIGS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#9333ea' }}>
              {freelanceServices}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Zap size={13} color="#9333ea" />
              <span>Freelance gigs</span>
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
              placeholder="Search service, category, provider..."
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
            <Plus size={15} /> <span>New Service</span>
          </button>
        </div>
      </div>

      {/* 4. Main Body: Data Table or Grid Cards View */}
      {loading ? (
        <div className="adm-chart-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
            Loading services catalog from database...
          </p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="adm-chart-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Briefcase size={44} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ margin: '0 0 0.35rem 0', color: '#0f172a', fontWeight: 800 }}>No Services Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
            {searchQuery || categoryFilter !== 'all' || ownerFilter !== 'all'
              ? 'Try adjusting your search criteria.'
              : 'Create your first catalog service offering to begin.'}
          </p>
          <button
            type="button"
            className="adm-hero-btn-primary"
            onClick={openAddModal}
            style={{ display: 'inline-flex', margin: '0 auto' }}
          >
            <Plus size={16} /> Add First Service
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* DATA TABLE VIEW */
        <div className="adm-chart-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#cbd5e1', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Service Details</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Category</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Vendor / Provider</th>
                  <th style={{ padding: '0.9rem 1.15rem' }}>Base Price</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Admin Cut %</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Turnaround</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s) => {
                  const ownerName = s.owner_name || s.ownerName;
                  const ownerType = s.owner_type || s.ownerType || 'business';
                  const comm = s.admin_commission_percent || s.adminCommissionPercent || 20;
                  const categoryName = typeof s.category === 'object' && s.category !== null ? (s.category.name || 'Service') : String(s.category || 'Service');

                  return (
                    <tr key={s.id} className="adm-table-row">
                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {s.image ? (
                            <img
                              src={s.image}
                              alt={s.name}
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
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                background: '#f1f5f9',
                                border: '1.5px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Briefcase size={18} color="#64748b" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                              {s.name}
                            </div>
                            <div style={{ marginTop: '2px' }}>
                              <span className="adm-code-chip">ID: SRV-{s.id}</span>
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
                          ₹{Number(s.price).toLocaleString('en-IN')}
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
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: '#f8fafc',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <Clock size={12} color="#64748b" />
                          <span>{s.duration || '3 Days'}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '9999px',
                            border: s.status === 'active' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            background: s.status === 'active' ? '#ecfdf5' : '#f8fafc',
                            color: s.status === 'active' ? '#059669' : '#94a3b8',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.status === 'active' ? '#059669' : '#94a3b8' }} />
                          <span>{s.status === 'active' ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
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
                            onClick={() => handleDeleteService(s.id)}
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
              ● Services catalog synchronized with MySQL 8.0 schema
            </span>
            <span style={{ fontWeight: 800, color: '#3569a7' }}>
              Showing {filteredServices.length} of {services.length} Services
            </span>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW - EXECUTIVE 3D LUXURY FINTECH CARDS */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredServices.map((s) => {
            const ownerName = s.owner_name || s.ownerName;
            const ownerType = s.owner_type || s.ownerType || 'business';
            const comm = s.admin_commission_percent || s.adminCommissionPercent || 20;
            const categoryName = typeof s.category === 'object' && s.category !== null ? (s.category.name || 'Service') : String(s.category || 'Service');
            const priceNum = Number(s.price) || 0;
            const commPercent = Number(comm) || 0;
            const adminCutAmount = (priceNum * commPercent) / 100;

            return (
              <div key={s.id} className="adm-service-card-3d">
                {/* 1. Media Header Showcase */}
                <div className="adm-service-media-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.name}
                      className="adm-service-media-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Briefcase size={42} color="#64748b" />
                  )}
                  <div className="adm-service-media-overlay" />

                  {/* Category Floating Pill (Glassmorphism) */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                    <div className="adm-service-badge-glass">
                      <FolderTree size={12} color="#0284c7" />
                      <span>{categoryName}</span>
                    </div>
                  </div>

                  {/* Status Live Toggle Pill (Top-Right) */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(s)}
                      title="Click to toggle active status"
                      style={{
                        background: s.status === 'active' ? 'rgba(236, 253, 245, 0.95)' : 'rgba(248, 250, 252, 0.95)',
                        backdropFilter: 'blur(6px)',
                        border: s.status === 'active' ? '1.5px solid #a7f3d0' : '1.5px solid #cbd5e1',
                        borderRadius: '9999px',
                        padding: '3px 10px',
                        color: s.status === 'active' ? '#047857' : '#64748b',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: s.status === 'active' ? '#10b981' : '#94a3b8',
                          boxShadow: s.status === 'active' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                        }}
                      />
                      <span>{s.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Structured & Readable Card Body */}
                <div className="adm-service-body">
                  {/* ID Tag and Delivery Turnaround */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span className="adm-code-chip" style={{ fontSize: '0.72rem', padding: '3px 9px' }}>
                      ID: SRV-{s.id}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#475569',
                        background: '#f1f5f9',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Clock size={12} color="#64748b" />
                      <span>{s.duration || '3 Business Days'}</span>
                    </span>
                  </div>

                  {/* Clean Service Title */}
                  <h4 className="adm-service-title" title={s.name}>
                    {s.name}
                  </h4>

                  {/* Dedicated Verified Provider Vault */}
                  <div className="adm-service-provider-vault">
                    <div
                      className={`adm-3d-pod ${ownerType === 'business' ? 'adm-pod-amber' : 'adm-pod-purple'}`}
                      style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }}
                    >
                      {ownerType === 'business' ? <Building2 size={16} strokeWidth={2.4} /> : <Zap size={16} strokeWidth={2.4} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                          Service Provider
                        </span>
                        <span
                          style={{
                            padding: '1.5px 7px',
                            borderRadius: '5px',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            background: ownerType === 'business' ? '#fef3c7' : '#f3e8ff',
                            color: ownerType === 'business' ? '#b45309' : '#7e22ce',
                            border: `1px solid ${ownerType === 'business' ? '#fde68a' : '#e9d5ff'}`,
                          }}
                        >
                          {ownerType === 'business' ? 'Enterprise' : 'Freelancer'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ownerName || 'Verified Vendor'}
                      </div>
                    </div>
                  </div>

                  {/* 3D Revenue & Pricing Split Vault */}
                  <div className="adm-service-split-vault">
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                        Customer Base Price
                      </div>
                      <div style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        ₹{priceNum.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', marginTop: '1px' }}>
                        Standard Billing
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.04em' }}>
                        Platform Cut ({commPercent}%)
                      </div>
                      <div style={{ fontSize: '1.22rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                        ₹{adminCutAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', marginTop: '1px' }}>
                        Retained Commission
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Luxury Card Action Footer */}
                <div className="adm-service-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                      Turnaround:
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                      {s.duration || '3 Days'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.38rem 0.85rem',
                        color: '#3569a7',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3569a7';
                        e.currentTarget.style.borderColor = '#3569a7';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#3569a7';
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.38rem 0.85rem',
                        color: '#dc2626',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.borderColor = '#dc2626';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#fecaca';
                        e.currentTarget.style.color = '#dc2626';
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD / EDIT SERVICE MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.68)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '640px', background: '#ffffff', borderRadius: '22px', border: '1.5px solid #cbd5e1', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.35rem 1.6rem', borderBottom: '1px solid #e2e8f0', background: 'radial-gradient(circle at 95% 8%, rgba(53, 105, 167, 0.06) 0%, #ffffff 70%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px' }}>
                  <Briefcase size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingService ? 'Edit Catalog Service' : 'Create New Service'}
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Configure pricing, turnaround duration, provider association, and admin settlement percentage
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
                {/* Service Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GST Audit & Annual Compliance Filing"
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

                {/* Category & Provider Type */}
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
                      Provider Partner Type *
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
                    Select Vendor / Provider (From Database) *
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

                {/* Pricing, Commission & Turnaround */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="4999"
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
                      placeholder="20"
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
                      Turnaround Duration *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3 Business Days"
                      value={formData.duration}
                      onChange={(e) => {
                        setFormData({ ...formData, duration: e.target.value });
                        setFormErrors((prev) => ({ ...prev, duration: undefined }));
                        setFormBannerError('');
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 700, outline: 'none', ...getInputErrorStyle(formErrors.duration) }}
                    />
                    <FieldError error={formErrors.duration} />
                  </div>
                </div>

                {/* Image Upload / URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    Service Media Image
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
                    Description &amp; Deliverables <span style={{ color: '#94a3b8', fontWeight: 600 }}>(Optional)</span>
                  </label>
                  <textarea
                    rows="2"
                    placeholder="List deliverables, milestones, and scope of work..."
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
                  {isSubmitting ? 'Saving...' : editingService ? 'Save Changes' : 'Publish Service'}
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