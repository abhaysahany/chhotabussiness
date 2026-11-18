import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Briefcase,
  Gift,
  Layers,
  UserCheck,
  Users,
  CreditCard,
  Receipt,
  Landmark,
  Wallet,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Calculator,
  Percent,
  Check,
  ChevronDown,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { createEntityOrder, verifyMemberId, getCatalogOfferings } from '../api/entityService';

function EntityCreateOrder() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';
  const entityType =
    currentEntity?.entity_details?.entity_type === 'freelancer' ? 'freelance' : 'business';
  const entityId =
    currentEntity?.entity_details?.entity_id ||
    currentEntity?.id ||
    null;

  const [toastMessage, setToastMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSaleData, setCreatedSaleData] = useState(null);

  // Offering Types
  const [offeringType, setOfferingType] = useState('service'); // 'service' | 'product' | 'package'
  const [dbOfferings, setDbOfferings] = useState([]);

  // Dynamic Catalog from MySQL Database API
  useEffect(() => {
    const loadCatalog = async () => {
      const items = await getCatalogOfferings();
      if (items && items.length > 0) {
        setDbOfferings(items);
      }
    };
    loadCatalog();
  }, []);

  const catalogOfferings = useMemo(() => {
    return dbOfferings || [];
  }, [dbOfferings]);


  const availableOfferings = useMemo(() => {
    return catalogOfferings.filter((item) => item.type === offeringType);
  }, [catalogOfferings, offeringType]);

  // Form Fields
  const [selectedItemId, setSelectedItemId] = useState(availableOfferings[0]?.id || '');
  const [customItemName, setCustomItemName] = useState(availableOfferings[0]?.name || '');
  const [customPrice, setCustomPrice] = useState(availableOfferings[0]?.basePrice || 0);
  const [adminCommissionPercent, setAdminCommissionPercent] = useState(availableOfferings[0]?.adminCommissionPercent || 20);
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Customer / Member Form State
  const [customerUserCode, setCustomerUserCode] = useState(''); // e.g. CB100001 (Member ID)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSponsor, setCustomerSponsor] = useState('');
  const [isVerifyingMember, setIsVerifyingMember] = useState(false);
  const [memberVerified, setMemberVerified] = useState(false);
  const [memberLookupError, setMemberLookupError] = useState('');

  // Auto-verify Member ID from Database and Auto-fill Member Details
  useEffect(() => {
    const trimmed = customerUserCode.trim();
    if (!trimmed) {
      setMemberVerified(false);
      setMemberLookupError('');
      setIsVerifyingMember(false);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerSponsor('');
      return;
    }

    setIsVerifyingMember(true);
    setMemberLookupError('');

    const timer = setTimeout(async () => {
      try {
        const res = await verifyMemberId(trimmed);
        if (res && res.verified && res.member) {
          setCustomerName(res.member.name || '');
          setCustomerEmail(res.member.email || '');
          setCustomerPhone(res.member.phone || '');
          setCustomerSponsor(res.member.sponsor_id || '');
          setMemberVerified(true);
          setMemberLookupError('');
        } else {
          setMemberVerified(false);
          setCustomerName('');
          setCustomerEmail('');
          setCustomerPhone('');
          setCustomerSponsor('');
          setMemberLookupError(res?.message || `Member ID '${trimmed}' not found in database.`);
        }
      } catch (err) {
        setMemberVerified(false);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerPhone('');
        setCustomerSponsor('');
        setMemberLookupError(
          err.response?.data?.message || `Member ID '${trimmed}' not found in database. Please enter a valid registered Member ID.`
        );
      } finally {
        setIsVerifyingMember(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customerUserCode]);


  // Payment Details
  const [paymentTypeOption, setPaymentTypeOption] = useState('full'); // 'full' | 'partial'
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR Code');
  const [advancePayment, setAdvancePayment] = useState(2999);
  const [referenceNo, setReferenceNo] = useState(`UTR-${Math.floor(100000 + Math.random() * 900000)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Financial Calculations (GST Hidden / Deferred)
  const grossSubtotal = customPrice * quantity;
  const discountAmount = (grossSubtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, grossSubtotal - discountAmount); // Total Project Value

  // Effective Received Amount
  const receivedAmount = paymentTypeOption === 'full' 
    ? grandTotal 
    : Math.min(grandTotal, Math.max(0, Number(advancePayment) || 0));

  const remainingBalanceDue = Math.max(0, grandTotal - receivedAmount);

  // Commission to Admin (Strictly calculated on the RECEIVED amount)
  const adminCommissionAmount = Math.round((receivedAmount * adminCommissionPercent) / 100);
  const netEntityEarnings = Math.max(0, receivedAmount - adminCommissionAmount);

  const handleOfferingChange = (type) => {
    setOfferingType(type);
    const items = catalogOfferings.filter((i) => i.type === type);
    if (items.length > 0) {
      setSelectedItemId(items[0].id);
      setCustomItemName(items[0].name);
      setCustomPrice(items[0].basePrice);
      setAdminCommissionPercent(items[0].adminCommissionPercent || (type === 'service' ? 20 : type === 'product' ? 15 : 18));
      setAdvancePayment(items[0].basePrice);
    } else {
      setSelectedItemId('');
      setCustomItemName('');
      setCustomPrice(0);
      setAdminCommissionPercent(type === 'service' ? 20 : type === 'product' ? 15 : 18);
      setAdvancePayment(0);
    }
  };

  const handleItemSelect = (id) => {
    setSelectedItemId(Number(id));
    const found = catalogOfferings.find((i) => i.id === Number(id));
    if (found) {
      setCustomItemName(found.name);
      setCustomPrice(found.basePrice);
      setAdminCommissionPercent(found.adminCommissionPercent || 15);
      setAdvancePayment(found.basePrice);
    }
  };

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors = {};

    if (!customerUserCode.trim()) {
      newErrors.customerUserCode = 'Member ID is required (e.g. CB100001).';
    } else if (!memberVerified) {
      newErrors.customerUserCode = memberLookupError || 'Please enter a valid, database-verified Member ID.';
    }

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer Name is required.';
    }

    if (customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        newErrors.customerEmail = 'Please enter a valid email address.';
      }
    }

    if (customerPhone.trim()) {
      const cleanPhone = customerPhone.replace(/[\s-+]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.customerPhone = 'Phone number must be a valid 10-digit mobile number.';
      }
    }

    if (!customItemName.trim()) {
      newErrors.customItemName = 'Item description / title is required.';
    }

    if (!customPrice || Number(customPrice) <= 0 || isNaN(Number(customPrice))) {
      newErrors.customPrice = 'Price must be greater than ₹0.';
    }

    if (!quantity || Number(quantity) < 1 || isNaN(Number(quantity))) {
      newErrors.quantity = 'Quantity must be at least 1.';
    }

    if (Number(discountPercent) < 0 || Number(discountPercent) > 100) {
      newErrors.discountPercent = 'Discount must be between 0% and 100%.';
    }

    if (Number(advancePayment) < 0 || isNaN(Number(advancePayment))) {
      newErrors.advancePayment = 'Advance payment must be a valid positive amount.';
    } else if (Number(advancePayment) > grandTotal) {
      newErrors.advancePayment = `Advance payment cannot exceed Grand Total (₹${grandTotal.toLocaleString()}).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setToastMessage('❌ Please resolve the highlighted form validation errors.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const cleanUserCode = customerUserCode.trim().toUpperCase();

    const saleRecord = {
      entity_id: entityId,
      entityId,
      entity_name: entityName,
      entityName,
      entity_type: entityType,
      entityType,
      customer_name: customerName,
      customerName,
      customer_email: customerEmail,
      customerEmail,
      customer_phone: customerPhone,
      customerPhone,
      customer: `${customerName} (${cleanUserCode})`,
      customer_user_code: cleanUserCode,
      customerUserCode: cleanUserCode,
      sponsor: customerSponsor || 'CB100001',
      customerSponsor,
      item: customItemName,
      item_type: offeringType,
      itemType: offeringType,
      category: offeringType === 'service' ? 'Services & Consulting' : offeringType === 'product' ? 'Commercial Products' : 'Bundled Packages',
      unit_price: customPrice,
      unitPrice: customPrice,
      quantity,
      gross_amount: grandTotal,
      grossAmount: grandTotal,
      taxable_amount: grandTotal,
      taxableAmount: grandTotal,
      gst_tax: 0,
      gstTax: 0,
      admin_commission_cut: adminCommissionAmount,
      adminCommissionCut: adminCommissionAmount,
      admin_commission_percent: adminCommissionPercent,
      adminCommissionPercent,
      net_entity_payout: netEntityEarnings,
      netEntityPayout: netEntityEarnings,
      advance_payment: receivedAmount,
      advancePayment: receivedAmount,
      balance_due: remainingBalanceDue,
      balanceDue: remainingBalanceDue,
      payment_method: paymentMethod,
      paymentMethod,
      reference_no: referenceNo,
      referenceNo,
      status: remainingBalanceDue === 0 ? 'completed' : 'partial',
      network_distribution_status: 'pending_admin_distribution',
      networkDistributionStatus: 'pending_admin_distribution',
      created_at: new Date().toISOString(),
    };



    try {
      const saved = await createEntityOrder(saleRecord);
      setCreatedSaleData(saved || saleRecord);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error saving order to backend:', err);
      setToastMessage(err.response?.data?.message || 'Failed to record order. Please try again.');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '12px',
            zIndex: 9999,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid #334155',
          }}
        >
          <Sparkles size={16} color="#eab308" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern 3D Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="ent-3d-pod ent-3d-pod-md ent-pod-olive">
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="ent-kpi-category-tag" style={{ background: '#f4f6ec', color: '#636B2F' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#636B2F' }} /> MERCHANT SALES DESK
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #7c8838 0%, #636B2F 100%)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 6px rgba(99, 107, 47, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                {entityName}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Create New Order
            </h1>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Record customer order transactions with dynamic Admin commission rates and automatic invoice generation.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => navigate('/entity/orders')}
            className="ent-slip-btn"
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <form onSubmit={handleSubmitSale}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Sale & Customer Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            {/* 1. Offering Type & Item Selection */}
            <div className="ent-3d-form-card ent-3d-form-card-olive">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="ent-3d-pod ent-3d-pod-sm ent-pod-olive">
                    <Package size={20} />
                  </div>
                  <div>
                    <span className="ent-step-pill" style={{ background: '#f4f6ec', color: '#636B2F' }}>
                      STEP 01
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                      Select Offering & Pricing
                    </h3>
                  </div>
                </div>
                <span className="ent-3d-target-pill" style={{ background: '#f8faf0', color: '#636B2F', border: '1px solid #d4dcbe' }}>
                  <Layers size={13} /> Offering Type
                </span>
              </div>

              {/* Type Switcher Buttons */}
              <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {[
                  { id: 'service', label: 'Services', icon: Briefcase },
                  { id: 'product', label: 'Products', icon: Package },
                  { id: 'package', label: 'Packages', icon: Gift },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleOfferingChange(id)}
                    className={`ent-offering-type-btn ${offeringType === id ? 'active' : ''}`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Preset Dropdown or Custom Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="ent-form-label">
                    <Layers size={14} color="#636B2F" />
                    <span>Catalog Item (With Admin Commission Rate)</span>
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="ent-form-input"
                    style={{ fontWeight: 600, cursor: 'pointer' }}
                  >
                    {availableOfferings.length === 0 ? (
                      <option value="">(No catalog presets in DB - enter custom item below)</option>
                    ) : (
                      availableOfferings.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — ₹{item.basePrice.toLocaleString()} (🏛️ {item.adminCommissionPercent}% Admin Cut)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="ent-form-label">
                    <FileText size={14} color="#636B2F" />
                    <span>Item Description / Title on Invoice <span style={{ color: '#ef4444' }}>*</span></span>
                  </label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => { setCustomItemName(e.target.value); setFormErrors(prev => ({ ...prev, customItemName: null })); }}
                    className="ent-form-input"
                    style={{
                      borderColor: formErrors.customItemName ? '#ef4444' : undefined,
                      fontWeight: 600,
                    }}
                    placeholder="Enter item description or deliverables..."
                    required
                  />
                  {formErrors.customItemName && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <AlertCircle size={12} /> {formErrors.customItemName}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label className="ent-form-label">
                      <span>Price (₹) <span style={{ color: '#ef4444' }}>*</span></span>
                    </label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => { setCustomPrice(Number(e.target.value)); setFormErrors(prev => ({ ...prev, customPrice: null })); }}
                      className="ent-form-input"
                      style={{
                        borderColor: formErrors.customPrice ? '#ef4444' : undefined,
                        fontWeight: 700,
                        fontSize: '0.92rem',
                      }}
                      min="1"
                      required
                    />
                    {formErrors.customPrice && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block', fontWeight: 600 }}>
                        ⚠️ {formErrors.customPrice}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="ent-form-label">
                      <span>Quantity</span>
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="ent-form-input"
                      style={{ fontWeight: 700 }}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="ent-form-label">
                      <span>Discount (%)</span>
                    </label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="ent-form-input"
                      style={{ fontWeight: 700 }}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Customer / Member Information */}
            <div className="ent-3d-form-card ent-3d-form-card-emerald">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="ent-3d-pod ent-3d-pod-sm ent-pod-emerald">
                    <Users size={20} />
                  </div>
                  <div>
                    <span className="ent-step-pill" style={{ background: '#ecfdf5', color: '#059669' }}>
                      STEP 02
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                      Customer / Member Information
                    </h3>
                  </div>
                </div>
                <span className="ent-glass-badge ent-badge-emerald" style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 800 }}>
                  <Sparkles size={12} /> Live Database Auto-Fill
                </span>
              </div>

              {/* Member ID Primary Input */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label className="ent-form-label" style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                  <UserCheck size={15} color="#059669" />
                  <span>Enter Member ID <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={customerUserCode}
                    onChange={(e) => setCustomerUserCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CB100001, CB100002"
                    required
                    className="ent-form-input"
                    style={{
                      paddingRight: '100px',
                      borderColor: memberLookupError ? '#ef4444' : memberVerified ? '#10b981' : undefined,
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      background: memberVerified ? '#f0fdf4' : '#ffffff',
                    }}
                  />
                  {isVerifyingMember && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <span className="spinner" style={{ width: '13px', height: '13px', border: '2px solid #cbd5e1', borderTopColor: '#059669', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }}></span>
                      Checking...
                    </div>
                  )}
                  {memberVerified && !isVerifyingMember && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 800, fontSize: '0.76rem' }}>
                      <CheckCircle2 size={16} /> Verified
                    </div>
                  )}
                </div>

                {formErrors.customerUserCode && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <AlertCircle size={15} />
                    <span>{formErrors.customerUserCode}</span>
                  </div>
                )}
                {!formErrors.customerUserCode && memberLookupError && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <AlertCircle size={15} />
                    <span>{memberLookupError}</span>
                  </div>
                )}

                {/* Success Banner when Member is Found */}
                {memberVerified && (
                  <div style={{ marginTop: '0.65rem', padding: '0.75rem 1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', borderRadius: '12px', color: '#15803d', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}>
                      <BadgeCheck size={16} color="#16a34a" />
                      <span>Member Found: {customerName}</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Sparkles size={12} /> Auto-filled from DB
                    </span>
                  </div>
                )}
              </div>

              {/* Auto-filled details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="ent-form-label">
                    <span>Customer Full Name <span style={{ color: '#ef4444' }}>*</span></span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setFormErrors(prev => ({ ...prev, customerName: null })); }}
                    placeholder="Auto-filled on valid Member ID"
                    className="ent-form-input"
                    style={{
                      borderColor: formErrors.customerName ? '#ef4444' : undefined,
                      background: memberVerified ? '#f8fafc' : '#ffffff',
                      fontWeight: 700,
                    }}
                    required
                  />
                  {formErrors.customerName && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                      ⚠️ {formErrors.customerName}
                    </span>
                  )}
                </div>

                <div>
                  <label className="ent-form-label">
                    <span>Customer Email <span style={{ color: '#ef4444' }}>*</span></span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => { setCustomerEmail(e.target.value); setFormErrors(prev => ({ ...prev, customerEmail: null })); }}
                    placeholder="Auto-filled on valid Member ID"
                    className="ent-form-input"
                    style={{
                      borderColor: formErrors.customerEmail ? '#ef4444' : undefined,
                      background: memberVerified ? '#f8fafc' : '#ffffff',
                      fontWeight: 600,
                    }}
                    required
                  />
                  {formErrors.customerEmail && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                      ⚠️ {formErrors.customerEmail}
                    </span>
                  )}
                </div>

                <div>
                  <label className="ent-form-label">
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => { setCustomerPhone(e.target.value); setFormErrors(prev => ({ ...prev, customerPhone: null })); }}
                    placeholder="+91 98765 43210"
                    className="ent-form-input"
                    style={{
                      borderColor: formErrors.customerPhone ? '#ef4444' : undefined,
                      fontWeight: 600,
                    }}
                  />
                  {formErrors.customerPhone && (
                    <span style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                      ⚠️ {formErrors.customerPhone}
                    </span>
                  )}
                </div>

                <div>
                  <label className="ent-form-label">
                    <span>Direct Sponsor</span>
                  </label>
                  <input
                    type="text"
                    value={customerSponsor}
                    placeholder="Auto-filled on valid Member ID"
                    disabled
                    className="ent-form-input"
                    style={{
                      background: '#f8fafc',
                      color: customerSponsor ? '#0f172a' : '#94a3b8',
                      fontWeight: customerSponsor ? '800' : '500',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Mode & Settlement */}
            <div className="ent-3d-form-card ent-3d-form-card-amber">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="ent-3d-pod ent-3d-pod-sm ent-pod-amber">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <span className="ent-step-pill" style={{ background: '#fffbeb', color: '#d97706' }}>
                      STEP 03
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                      Payment Settlement
                    </h3>
                  </div>
                </div>

                {/* Tactile Full vs Partial Switcher */}
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3.5px', borderRadius: '10px', gap: '3px', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeOption('full');
                      setAdvancePayment(grandTotal);
                    }}
                    style={{
                      border: 'none',
                      background: paymentTypeOption === 'full' ? 'linear-gradient(135deg, #7c8838 0%, #636B2F 100%)' : 'transparent',
                      color: paymentTypeOption === 'full' ? '#ffffff' : '#64748b',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '7px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: paymentTypeOption === 'full' ? '0 2px 6px rgba(99, 107, 47, 0.4)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeOption('partial');
                      if (advancePayment >= grandTotal || advancePayment <= 0) {
                        setAdvancePayment(Math.round(grandTotal * 0.5));
                      }
                    }}
                    style={{
                      border: 'none',
                      background: paymentTypeOption === 'partial' ? 'linear-gradient(135deg, #7c8838 0%, #636B2F 100%)' : 'transparent',
                      color: paymentTypeOption === 'partial' ? '#ffffff' : '#64748b',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '7px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: paymentTypeOption === 'partial' ? '0 2px 6px rgba(99, 107, 47, 0.4)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    Partial / Advance
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="ent-form-label">
                    <span>Payment Mode</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="ent-form-input"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="Bank NEFT / RTGS">Bank NEFT / RTGS</option>
                    <option value="Debit / Credit Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash / POS Receipt">Cash / POS Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="ent-form-label">
                    <span>{paymentTypeOption === 'full' ? 'Amount Paid (₹)' : 'Advance / Received (₹)'}</span>
                  </label>
                  <input
                    type="number"
                    value={paymentTypeOption === 'full' ? grandTotal : advancePayment}
                    onChange={(e) => {
                      if (paymentTypeOption === 'partial') {
                        setAdvancePayment(Math.min(grandTotal, Math.max(0, Number(e.target.value))));
                      }
                    }}
                    disabled={paymentTypeOption === 'full'}
                    className="ent-form-input"
                    style={{
                      background: paymentTypeOption === 'full' ? '#f8fafc' : '#ffffff',
                      color: paymentTypeOption === 'full' ? '#64748b' : '#0f172a',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                    }}
                    min="0"
                    max={grandTotal}
                  />
                </div>

                <div>
                  <label className="ent-form-label">
                    <span>Ref / UTR Number</span>
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="ent-form-input"
                    style={{ fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {paymentTypeOption === 'partial' && (
                <div style={{ marginTop: '1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.85rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', boxShadow: '0 2px 6px rgba(217, 119, 6, 0.1)' }}>
                  <span style={{ color: '#92400e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={15} /> Remaining Balance to Collect Later:
                  </span>
                  <strong style={{ color: '#b45309', fontSize: '1.05rem', fontWeight: 800 }}>
                    ₹{remainingBalanceDue.toLocaleString()}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Invoice Breakdown & Dynamic Commission to Admin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Invoice & Admin Commission Card */}
            <div className="ent-3d-summary-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="ent-3d-pod ent-3d-pod-sm ent-pod-olive">
                    <Receipt size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Invoice & Summary
                  </h3>
                </div>
                <span className="ent-3d-target-pill" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '3px 8px', fontSize: '0.72rem' }}>
                  <Calculator size={11} /> Live Calculation
                </span>
              </div>

              {/* Price Calculation Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 600 }}>
                  <span>Project Value ({quantity}x)</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{grossSubtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  <span>Total Project Value</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 800 }}>
                  <span>Amount Received Now</span>
                  <span>₹{receivedAmount.toLocaleString()}</span>
                </div>

                {remainingBalanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: 800 }}>
                    <span>Remaining Balance Due</span>
                    <span>₹{remainingBalanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Commission To Admin on Collected Amount */}
              <div style={{ marginTop: '1.35rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Landmark size={14} color="#636B2F" /> Admin Cut
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#dc2626' }}>
                    {adminCommissionPercent}% (₹{adminCommissionAmount.toLocaleString()})
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Calculated strictly on received amount (<strong>₹{receivedAmount.toLocaleString()}</strong>)
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <span style={{ color: '#059669', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Wallet size={15} color="#059669" /> Net Entity Realized
                  </span>
                  <span style={{ color: '#059669', fontWeight: 800, fontSize: '1.1rem' }}>
                    ₹{netEntityEarnings.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notice that Admin Distributes Network MLM Incomes */}
              <div style={{ marginTop: '1.15rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '0.85rem', fontSize: '0.76rem', color: '#1e40af', lineHeight: '1.45', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Admin Commission Release:</strong> Admin commission of ₹{adminCommissionAmount.toLocaleString()} is recorded in database. Additional cuts will be released upon balance receipt.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="ent-submit-sale-btn"
                style={{ marginTop: '1.35rem' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#ffffff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }}></span>
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Record Sale & Generate Invoice</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && createdSaleData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              border: '1px solid rgba(226, 232, 240, 0.9)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.15rem auto',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)',
              }}
            >
              <Clock size={28} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
              Order Submitted Successfully!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.35rem 0' }}>
              Your order has been recorded in database and is <strong>awaiting Admin approval</strong>.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.15rem', textAlign: 'left', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Invoice Number:</span>
                <span className="ent-code-chip">{createdSaleData.invoiceNumber || createdSaleData.invoice_number}</span>
              </div>
              {createdSaleData.id && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Order ID:</span>
                  <strong>#{createdSaleData.id}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <strong>{createdSaleData.customerName || createdSaleData.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Item / Offering:</span>
                <strong>{createdSaleData.item}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Project Value:</span>
                <strong style={{ color: '#0f172a' }}>₹{Number(createdSaleData.grossAmount || createdSaleData.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Received:</span>
                <strong style={{ color: '#059669' }}>₹{Number(createdSaleData.advancePayment || createdSaleData.advance_payment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Remaining Balance Due:</span>
                <strong style={{ color: Number(createdSaleData.balanceDue || createdSaleData.balance_due || 0) > 0 ? '#d97706' : '#059669' }}>
                  ₹{Number(createdSaleData.balanceDue || createdSaleData.balance_due || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.35rem', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Approval Status:</span>
                <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.74rem', fontWeight: 800, padding: '3px 9px', borderRadius: '9999px', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} /> Pending Admin Approval
                </span>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#166534', marginBottom: '1.35rem', textAlign: 'left', lineHeight: 1.45, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Workflow Notice:</strong> Administrator will review this order and approve the final Admin Commission. Balance collection and further payment actions will become available after confirmation.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/entity/orders');
                }}
                className="ent-submit-sale-btn"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                <span>View My Orders</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCustomerName('');
                  setCustomerEmail('');
                  setCustomerPhone('');
                  setCustomerUserCode('');
                  setPaymentTypeOption('full');
                }}
                className="ent-slip-btn"
                style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
              >
                <span>Record Another Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntityCreateOrder;
