import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Layers,
  CheckCircle2,
  Users,
  Building2,
  Zap,
  Search,
  Plus,
  Clock,
  CreditCard,
  Tag,
  FolderTree,
  Edit3,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  Check,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import api from '../../api/axios';
import { getEntityCategories, getBusinessEntities, getFreelancers } from '../../api/adminEntityService';
import { formatDate } from '../../utils/timezone';
import {
  isRequired,
  isValidNumber,
  isValidPercentage,
  FieldError,
  getInputErrorStyle,
  extractBackendErrors,
} from '../../utils/validation';

const getCategoryLabel = (category) => {
  if (typeof category === 'object' && category !== null) {
    return String(category.name || category.title || 'Uncategorized');
  }
  return String(category || 'Uncategorized');
};

const normalizePackage = (pkg) => {
  const safePkg = pkg && typeof pkg === 'object' ? pkg : {};
  const rawCommission = safePkg.commission_percent ?? safePkg.adminCommissionPercent;
  const parsedCommission =
    rawCommission !== undefined && rawCommission !== null && rawCommission !== ''
      ? Number(rawCommission)
      : 0;

  return {
    ...safePkg,
    id: safePkg.id,
    name: String(safePkg.name || 'Untitled Package'),
    category: getCategoryLabel(safePkg.category),
    price: Number(safePkg.price) || 0,
    adminCommissionPercent: Number.isFinite(parsedCommission) ? parsedCommission : 0,
    billingCycle: String(safePkg.billingCycle || safePkg.billing_cycle || 'Monthly Recurring'),
    ownerType: String(safePkg.ownerType || safePkg.owner_type || 'business'),
    ownerName: String(safePkg.ownerName || safePkg.owner_name || 'Platform Managed'),
    subscribersCount: Number(safePkg.subscribersCount ?? safePkg.subscribers_count ?? 0) || 0,
    status: String(safePkg.status || 'active').toLowerCase(),
    description: String(safePkg.description || ''),
    itemsIncluded: Array.isArray(safePkg.items_included) ? safePkg.items_included : [],
    image: safePkg.image ? String(safePkg.image) : '',
    created_at: safePkg.created_at,
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
  const [toastType, setToastType] = useState('success');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalErrors, setModalErrors] = useState({});
  const [modalBannerError, setModalBannerError] = useState('');

  // Database-loaded Categories List
  const [categoriesList, setCategoriesList] = useState([]);

  // Registered Businesses & Freelancers from Database
  const [registeredBusinesses, setRegisteredBusinesses] = useState([]);
  const [registeredFreelancers, setRegisteredFreelancers] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch Packages and Entity Owners from MySQL Database
  const loadPackages = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [pkgRes, bizRes, freeRes, catRes, entCatRes] = await Promise.allSettled([
        api.get('/catalog/packages'),
        getBusinessEntities(),
        getFreelancers(),
        api.get('/catalog/categories'),
        getEntityCategories(),
      ]);

      const categoryNames = new Set();
      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value?.data?.categories)) {
        catRes.value.data.categories.forEach((c) => c?.name && categoryNames.add(c.name));
      } else if (catRes.status === 'fulfilled' && Array.isArray(catRes.value?.data)) {
        catRes.value.data.forEach((c) => c?.name && categoryNames.add(c.name));
      }
      if (entCatRes.status === 'fulfilled' && Array.isArray(entCatRes.value?.categories)) {
        entCatRes.value.categories.forEach((c) => c?.name && categoryNames.add(c.name));
      }
      setCategoriesList(Array.from(categoryNames));

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
    category: '',
    ownerType: 'business',
    ownerName: '',
    price: '',
    adminCommissionPercent: 0,
    billingCycle: 'Monthly Recurring',
    description: '',
    image: '',
  });

  const resetForm = (businessesOverride) => {
    const bizList = businessesOverride || registeredBusinesses;
    setFormData({
      name: '',
      category: categoriesList[0] || '',
      ownerType: 'business',
      ownerName: bizList[0] || '',
      price: '',
      adminCommissionPercent: 0,
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
      category: categoriesList.includes(pkg.category) ? pkg.category : (categoriesList[0] || pkg.category || ''),
      ownerType: pkg.ownerType === 'freelancer' ? 'freelancer' : 'business',
      ownerName: pkg.ownerName || registeredBusinesses[0] || '',
      price: String(pkg.price ?? ''),
      adminCommissionPercent: pkg.adminCommissionPercent ?? 0,
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
      showToast(`Package status updated to ${nextStatus}.`, 'success');
    } catch (e) {
      console.error('Error updating status in database:', e);
      showToast('Error updating package status.', 'error');
    }
  };

  const handleDeletePackage = async (id) => {
    if (window.confirm('Are you sure you want to delete this package listing?')) {
      try {
        await api.delete(`/catalog/packages/${id}`);
        setPackages((prev) => prev.filter((item) => item.id !== id));
        if (selectedPackageDetails?.id === id) {
          setSelectedPackageDetails(null);
        }
        showToast('Package deleted successfully!', 'success');
      } catch (e) {
        console.error('Error deleting package:', e);
        showToast('Error deleting package.', 'error');
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
          image: formData.image || editingPackage.image || '',
        });

        setPackages((prev) =>
          prev.map((item) => (item.id === editingPackage.id ? updatedPkg : item))
        );
        showToast('Package updated successfully!', 'success');
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
            image: formData.image || '',
          });
          setPackages((prev) => [saved, ...prev]);
          showToast('New package bundle created successfully!', 'success');
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
  const activePackages = useMemo(() => packages.filter((p) => p.status === 'active').length, [packages]);
  const totalSubscribers = useMemo(() => packages.reduce((acc, p) => acc + (Number(p.subscribersCount) || 0), 0), [packages]);
  const businessPackages = useMemo(() => packages.filter((p) => p.ownerType === 'business').length, [packages]);

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
            <Package size={32} strokeWidth={2.3} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                ● PRICING &amp; BUNDLE ARCHITECTURE
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                ● {packages.length} Active Bundles
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Pricing Packages Suite
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Configure multi-tier subscription plans, bundled offerings, platform commissions, and recurring billing cycles.
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={openCreateModal}
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.88rem' }}
            >
              <Plus size={18} strokeWidth={2.4} />
              <span>Create New Package</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Error Banner if any */}
      {apiError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#991b1b',
            padding: '0.9rem 1.25rem',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', fontWeight: 700 }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            onClick={loadPackages}
            style={{
              background: '#ffffff',
              border: '1.5px solid #fca5a5',
              borderRadius: '8px',
              padding: '0.35rem 0.85rem',
              color: '#991b1b',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Total Bundled Packages */}
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
                ● BUNDLE SUITE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                TOTAL PACKAGES
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Package size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem' }}>
              {totalPackages}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Layers size={13} color="#3569a7" />
              <span>Bundled offerings</span>
            </span>
            <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Global Base
            </span>
          </div>
        </div>

        {/* Card 2: Active Plans Live */}
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
                ● READY TO BUY
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ACTIVE PLANS LIVE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#0d9488' }}>
              {activePackages}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>Operational tiers</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Live Active
            </span>
          </div>
        </div>

        {/* Card 3: Enrolled Subscriptions */}
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
                ● USER RETENTION
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ENROLLED CLIENTS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Users size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#9333ea' }}>
              {totalSubscribers}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Users size={13} color="#9333ea" />
              <span>Active subscriptions</span>
            </span>
            <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Subscribers
            </span>
          </div>
        </div>

        {/* Card 4: Corporate Bundles */}
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
                ● ENTERPRISE TIERS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                CORPORATE PLANS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Building2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {businessPackages}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Building2 size={13} color="#d97706" />
              <span>Corporate accounts</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Enterprises
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
              placeholder="Search package, category, provider, cycle..."
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

          {/* Owner Type Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '155px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="all">All Owner Types</option>
              <option value="business">Business Owners</option>
              <option value="freelancer">Freelancer Owners</option>
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
                gap: '0.25rem',
              }}
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="adm-toolbar-actions">
          {/* View Mode Switcher */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Layers size={13} />
              <span>Data Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: viewMode === 'grid' ? '#ffffff' : 'transparent',
                color: viewMode === 'grid' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={13} />
              <span>Grid Cards</span>
            </button>
          </div>

          {/* Quick Action Button */}
          <button
            type="button"
            className="adm-hero-btn-primary"
            onClick={openCreateModal}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>New Package</span>
          </button>
        </div>
      </div>

      {/* 4. Content Area: Data Table vs 3D Grid Showcase */}
      {loading ? (
        <div className="adm-table-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
          <div className="adm-3d-pod adm-pod-steel admFloatPodSlow" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}>
            <Package size={24} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>Loading Pricing Packages...</div>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Synchronizing multi-tier packages from database</p>
        </div>
      ) : viewMode === 'table' ? (
        /* DATA TABLE VIEW */
        <div className="adm-table-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Package Details</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Category</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Provider Entity</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Price &amp; Billing</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Admin Cut %</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Subscribers</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Live Status</th>
                  <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                      <Package size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#334155' }}>No Packages Match Search</div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Try adjusting your search criteria or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => {
                    const priceNum = Number(pkg.price) || 0;
                    const commPercent = Number(pkg.adminCommissionPercent) || 0;

                    return (
                      <tr key={pkg.id} className="adm-table-row">
                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            {pkg.image ? (
                              <img
                                src={pkg.image}
                                alt={pkg.name}
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '10px',
                                  objectFit: 'cover',
                                  border: '1.5px solid #e2e8f0',
                                  flexShrink: 0,
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '10px',
                                  background: '#eef2ff',
                                  border: '1.5px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Package size={20} color="#4f46e5" />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                                {pkg.name}
                              </div>
                              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className="adm-code-chip">ID: PKG-{pkg.id}</span>
                                {pkg.created_at && (
                                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                    • {formatDate(pkg.created_at)}
                                  </span>
                                )}
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
                            <span>{getCategoryLabel(pkg.category)}</span>
                          </span>
                        </td>

                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                              {pkg.ownerName}
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
                                background: pkg.ownerType === 'business' ? '#fef3c7' : '#faf5ff',
                                color: pkg.ownerType === 'business' ? '#b45309' : '#7e22ce',
                                border: `1px solid ${pkg.ownerType === 'business' ? '#fde68a' : '#e9d5ff'}`,
                              }}
                            >
                              {pkg.ownerType === 'business' ? <Building2 size={10} /> : <Zap size={10} />}
                              <span>{pkg.ownerType === 'business' ? 'Corporate Partner' : 'Freelancer'}</span>
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '0.9rem 1.15rem' }}>
                          <div>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                              ₹{priceNum.toLocaleString('en-IN')}
                            </span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                              <CreditCard size={11} color="#64748b" />
                              <span>{pkg.billingCycle}</span>
                            </div>
                          </div>
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
                            {commPercent}% Cut
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
                              fontWeight: 800,
                              background: '#faf5ff',
                              color: '#7e22ce',
                              border: '1px solid #e9d5ff',
                            }}
                          >
                            <Users size={12} color="#7e22ce" />
                            <span>{pkg.subscribersCount} Users</span>
                          </span>
                        </td>

                        <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(pkg.id)}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '9999px',
                              border: pkg.status === 'active' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                              background: pkg.status === 'active' ? '#ecfdf5' : '#f8fafc',
                              color: pkg.status === 'active' ? '#059669' : '#94a3b8',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pkg.status === 'active' ? '#059669' : '#94a3b8' }} />
                            <span>{pkg.status === 'active' ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedPackageDetails(pkg)}
                              title="View details"
                              style={{
                                background: '#f8fafc',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '7px',
                                padding: '0.3rem 0.55rem',
                                color: '#475569',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(pkg)}
                              title="Edit package"
                              style={{
                                background: '#f8fafc',
                                border: '1.5px solid #cbd5e1',
                                borderRadius: '7px',
                                padding: '0.3rem 0.55rem',
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
                              onClick={() => handleDeletePackage(pkg.id)}
                              title="Delete package"
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #fecaca',
                                borderRadius: '7px',
                                padding: '0.3rem 0.55rem',
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
              ● Multi-tier pricing packages synchronized with MySQL database
            </span>
            <span style={{ fontWeight: 800, color: '#3569a7' }}>
              Showing {filteredPackages.length} of {packages.length} Packages
            </span>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW - EXECUTIVE 3D LUXURY FINTECH CARDS */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredPackages.map((pkg) => {
            const priceNum = Number(pkg.price) || 0;
            const commPercent = Number(pkg.adminCommissionPercent) || 0;
            const adminCutAmount = (priceNum * commPercent) / 100;

            return (
              <div key={pkg.id} className="adm-service-card-3d">
                {/* 1. Media Header Showcase */}
                <div className="adm-service-media-wrap">
                  {pkg.image ? (
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="adm-service-media-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                      }}
                    >
                      <Package size={42} color="#6366f1" />
                    </div>
                  )}
                  <div className="adm-service-media-overlay" />

                  {/* Category Floating Pill (Glassmorphism) */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
                    <div className="adm-service-badge-glass">
                      <FolderTree size={12} color="#0284c7" />
                      <span>{getCategoryLabel(pkg.category)}</span>
                    </div>
                  </div>

                  {/* Status Live Toggle Pill (Top-Right) */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(pkg.id)}
                      title="Click to toggle active status"
                      style={{
                        background: pkg.status === 'active' ? 'rgba(236, 253, 245, 0.95)' : 'rgba(248, 250, 252, 0.95)',
                        backdropFilter: 'blur(6px)',
                        border: pkg.status === 'active' ? '1.5px solid #a7f3d0' : '1.5px solid #cbd5e1',
                        borderRadius: '9999px',
                        padding: '3px 10px',
                        color: pkg.status === 'active' ? '#047857' : '#64748b',
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
                          background: pkg.status === 'active' ? '#10b981' : '#94a3b8',
                          boxShadow: pkg.status === 'active' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none',
                        }}
                      />
                      <span>{pkg.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Structured & Readable Card Body */}
                <div className="adm-service-body">
                  {/* ID Tag and Billing Cycle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span className="adm-code-chip" style={{ fontSize: '0.72rem', padding: '3px 9px' }}>
                      ID: PKG-{pkg.id}
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
                      <CreditCard size={12} color="#64748b" />
                      <span>{pkg.billingCycle}</span>
                    </span>
                  </div>

                  {/* Clean Package Title */}
                  <h4 className="adm-service-title" title={pkg.name}>
                    {pkg.name}
                  </h4>

                  {/* Dedicated Verified Provider Vault */}
                  <div className="adm-service-provider-vault">
                    <div
                      className={`adm-3d-pod ${pkg.ownerType === 'business' ? 'adm-pod-amber' : 'adm-pod-purple'}`}
                      style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }}
                    >
                      {pkg.ownerType === 'business' ? <Building2 size={16} strokeWidth={2.4} /> : <Zap size={16} strokeWidth={2.4} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                          Package Owner
                        </span>
                        <span
                          style={{
                            padding: '1.5px 7px',
                            borderRadius: '5px',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            background: pkg.ownerType === 'business' ? '#fef3c7' : '#f3e8ff',
                            color: pkg.ownerType === 'business' ? '#b45309' : '#7e22ce',
                            border: `1px solid ${pkg.ownerType === 'business' ? '#fde68a' : '#e9d5ff'}`,
                          }}
                        >
                          {pkg.ownerType === 'business' ? 'Enterprise' : 'Freelancer'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pkg.ownerName || 'Platform Managed'}
                      </div>
                    </div>
                  </div>

                  {/* 3D Revenue & Pricing Split Vault */}
                  <div className="adm-service-split-vault">
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                        Package Price
                      </div>
                      <div style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        ₹{priceNum.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', marginTop: '1px' }}>
                        {pkg.billingCycle}
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
                    <Users size={13} color="#9333ea" />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6b21a8' }}>
                      {pkg.subscribersCount} Active Subscribers
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPackageDetails(pkg)}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.38rem 0.65rem',
                        color: '#475569',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(pkg)}
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.38rem 0.75rem',
                        color: '#3569a7',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.38rem 0.65rem',
                        color: '#dc2626',
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s ease',
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

      {/* Package Details Modal */}
      {selectedPackageDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setSelectedPackageDetails(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1.5px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                  <Package size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Package Details (ID: #{selectedPackageDetails.id})
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                    Complete bundled plan breakdown &amp; deliverables
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPackageDetails(null)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.86rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                  {selectedPackageDetails.name}
                </strong>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: selectedPackageDetails.status === 'active' ? '#ecfdf5' : '#f8fafc',
                    color: selectedPackageDetails.status === 'active' ? '#059669' : '#94a3b8',
                    border: selectedPackageDetails.status === 'active' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                  }}
                >
                  ● {selectedPackageDetails.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Package Price</span>
                  <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                    ₹{(Number(selectedPackageDetails.price) || 0).toLocaleString('en-IN')}
                  </strong>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    {selectedPackageDetails.billingCycle}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: '#059669', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Platform Cut</span>
                  <strong style={{ fontSize: '1.15rem', color: '#059669' }}>
                    {selectedPackageDetails.adminCommissionPercent}%
                  </strong>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>
                    Retained Commission
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Category</span>
                  <strong style={{ color: '#0369a1' }}>{getCategoryLabel(selectedPackageDetails.category)}</strong>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Active Subscribers</span>
                  <strong style={{ color: '#7e22ce' }}>{selectedPackageDetails.subscribersCount} Accounts</strong>
                </div>
              </div>

              {selectedPackageDetails.description && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.35rem', fontWeight: 800, textTransform: 'uppercase' }}>Description</span>
                  <p style={{ margin: 0, lineHeight: 1.5, color: '#475569', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    {selectedPackageDetails.description}
                  </p>
                </div>
              )}

              {Array.isArray(selectedPackageDetails.itemsIncluded) && selectedPackageDetails.itemsIncluded.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.4rem', fontWeight: 800, textTransform: 'uppercase' }}>Included Deliverables</span>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', lineHeight: 1.6 }}>
                    {selectedPackageDetails.itemsIncluded.map((item, idx) => (
                      <li key={idx}>
                        {typeof item === 'object' && item !== null ? (item.name || item.title || JSON.stringify(item)) : String(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedPackageDetails;
                    setSelectedPackageDetails(null);
                    openEditModal(target);
                  }}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#3569a7',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Edit Package
                </button>
                <button
                  type="button"
                  className="adm-hero-btn-primary"
                  style={{ padding: '0.65rem 1.4rem', fontSize: '0.82rem' }}
                  onClick={() => setSelectedPackageDetails(null)}
                >
                  Close Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Package Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1.5px solid #e2e8f0',
              maxHeight: '92vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                  <Package size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {editingPackage ? `Edit Pricing Package (#${editingPackage.id})` : 'Create Pricing Package'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                    Save package specifications &amp; billing rules to database
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form
              onSubmit={handleAddSubmit}
              style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
              noValidate
            >
              {modalBannerError && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    border: '1.5px solid #fecaca',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle size={16} color="#dc2626" />
                  <span>{modalBannerError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Package Title *
                </label>
                <input
                  type="text"
                  className="adm-toolbar-input"
                  style={{ width: '100%', height: '42px', ...getInputErrorStyle(modalErrors.name) }}
                  placeholder="e.g. Enterprise Digital Growth Accelerator"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setModalErrors((prev) => ({ ...prev, name: undefined }));
                    setModalBannerError('');
                  }}
                  required
                />
                <FieldError error={modalErrors.name} />
              </div>

              {/* Category Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Select Category *
                </label>
                <select
                  className="adm-toolbar-select"
                  style={{ width: '100%', height: '42px' }}
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

              {/* Owner Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Package Owner Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => handleOwnerTypeChange('business')}
                    style={{
                      border: formData.ownerType === 'business' ? '2px solid #3569a7' : '1.5px solid #e2e8f0',
                      backgroundColor: formData.ownerType === 'business' ? '#eff6ff' : '#f8fafc',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Building2 size={22} color={formData.ownerType === 'business' ? '#3569a7' : '#64748b'} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.86rem', color: '#0f172a' }}>
                        Registered Business
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Corporate Solutions</span>
                    </div>
                  </div>

                  <div
                    onClick={() => handleOwnerTypeChange('freelancer')}
                    style={{
                      border: formData.ownerType === 'freelancer' ? '2px solid #9333ea' : '1.5px solid #e2e8f0',
                      backgroundColor: formData.ownerType === 'freelancer' ? '#faf5ff' : '#f8fafc',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Zap size={22} color={formData.ownerType === 'freelancer' ? '#9333ea' : '#64748b'} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.86rem', color: '#0f172a' }}>
                        Freelance Provider
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Individual Expert</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider Entity Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Select {formData.ownerType === 'business' ? 'Business Entity' : 'Freelance Provider'}
                </label>
                <select
                  className="adm-toolbar-select"
                  style={{ width: '100%', height: '42px', ...getInputErrorStyle(modalErrors.ownerName) }}
                  value={formData.ownerName}
                  onChange={(e) => {
                    setFormData({ ...formData, ownerName: e.target.value });
                    setModalErrors((prev) => ({ ...prev, ownerName: undefined }));
                    setModalBannerError('');
                  }}
                >
                  {(formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).length === 0 ? (
                    <option value="">Platform Managed (No entities registered)</option>
                  ) : (
                    (formData.ownerType === 'business' ? registeredBusinesses : registeredFreelancers).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
                <FieldError error={modalErrors.ownerName} />
              </div>

              {/* Price, Commission, Billing Cycle Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    className="adm-toolbar-input"
                    style={{ width: '100%', height: '42px', ...getInputErrorStyle(modalErrors.price) }}
                    placeholder="e.g. 7999"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      setModalErrors((prev) => ({ ...prev, price: undefined }));
                      setModalBannerError('');
                    }}
                    required
                  />
                  <FieldError error={modalErrors.price} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Admin Cut (%) *
                  </label>
                  <input
                    type="number"
                    className="adm-toolbar-input"
                    style={{ width: '100%', height: '42px', ...getInputErrorStyle(modalErrors.adminCommissionPercent) }}
                    placeholder="e.g. 18"
                    value={formData.adminCommissionPercent}
                    onChange={(e) => {
                      setFormData({ ...formData, adminCommissionPercent: e.target.value });
                      setModalErrors((prev) => ({ ...prev, adminCommissionPercent: undefined }));
                      setModalBannerError('');
                    }}
                    min="0"
                    max="100"
                    required
                  />
                  <FieldError error={modalErrors.adminCommissionPercent} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Billing Cycle
                  </label>
                  <select
                    className="adm-toolbar-select"
                    style={{ width: '100%', height: '42px' }}
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  >
                    <option value="Monthly Recurring">Monthly Recurring</option>
                    <option value="Annual Subscription">Annual Subscription</option>
                    <option value="One-Time Payment">One-Time Payment</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Package Description
                </label>
                <textarea
                  className="adm-toolbar-input"
                  rows="2"
                  placeholder="Optional summary of bundled deliverables, milestones, or services..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', height: '70px', padding: '0.65rem', resize: 'vertical' }}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    padding: '0.65rem 1.35rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-hero-btn-primary"
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.82rem', opacity: saving ? 0.7 : 1 }}
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
