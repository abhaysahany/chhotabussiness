import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEntitySale, verifyMemberId, getCatalogOfferings } from '../api/entityService';

function EntityCreateSale() {
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

    if (!customerUserCode.trim()) {
      setToastMessage('Please enter a Member ID (e.g. CB100001).');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (!memberVerified) {
      setToastMessage(memberLookupError || 'Please enter a valid registered Member ID from the database.');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (!customerName) {
      setToastMessage('Customer Name is required.');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

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
      const saved = await createEntitySale(saleRecord);
      setCreatedSaleData(saved || saleRecord);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error saving sale to backend:', err);
      setToastMessage(err.response?.data?.message || 'Failed to record sale. Please try again.');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="page-container" style={{ width: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#1e293b',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 9999,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="page-subheader" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Record Sale & Generate Invoice
            </h1>
            <span
              style={{
                background: '#636B2F',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                textTransform: 'uppercase',
              }}
            >
              {entityName}
            </span>
          </div>
          <p className="page-description" style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Record customer transactions with dynamic Admin commission rates. Network commissions are managed centrally by Admin.

          </p>
        </div>
        <div className="page-breadcrumb">
          <span>Entity Panel</span>
          <span className="separator">/</span>
          <span>Sales & Orders</span>
          <span className="separator">/</span>
          <span className="active">Create Sale</span>
        </div>
      </div>

      {/* Main 2-Column Grid Layout */}
      <form onSubmit={handleSubmitSale}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Sale & Customer Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Offering Type & Item Selection */}
            <div className="content-card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📦</span> 1. Select Offering & Pricing
              </h3>

              {/* Type Switcher Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {['service', 'product', 'package'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleOfferingChange(type)}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: '8px',
                      border: offeringType === type ? '2px solid #636B2F' : '1px solid #e2e8f0',
                      background: offeringType === type ? '#f4f6ec' : '#ffffff',
                      color: offeringType === type ? '#505726' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {type === 'service' ? '💼 Services' : type === 'product' ? '📦 Products' : '🎁 Packages'}
                  </button>
                ))}
              </div>

              {/* Preset Dropdown or Custom Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Catalog Item (With Admin Commission Rate)
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', background: '#ffffff' }}
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Item Description / Title on Invoice
                  </label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Qty
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Customer / Member Information */}
            <div className="content-card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>👤</span> 2. Customer / Member Information
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  Live Database Auto-Fill
                </span>
              </div>

              {/* Member ID Primary Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                  Enter Member ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={customerUserCode}
                    onChange={(e) => setCustomerUserCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CB100001, CB100002"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: memberLookupError ? '2px solid #ef4444' : memberVerified ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      background: memberVerified ? '#f0fdf4' : '#ffffff',
                    }}
                  />
                  {isVerifyingMember && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6' }}></span>
                      Checking...
                    </div>
                  )}
                </div>

                {/* Error Message when Member ID not found in database */}
                {memberLookupError && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>❌</span>
                    <span>{memberLookupError}</span>
                  </div>
                )}

                {/* Success Banner when Member is Found & Auto-filled */}
                {memberVerified && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <span>✓</span>
                      <span>Member Found: {customerName}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                      Auto-filled from database
                    </span>
                  </div>
                )}
              </div>

              {/* Auto-filled details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Customer Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Auto-filled on valid Member ID"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: memberVerified ? '#f8fafc' : '#ffffff' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Customer Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Auto-filled on valid Member ID"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: memberVerified ? '#f8fafc' : '#ffffff' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Direct Sponsor
                  </label>
                  <input
                    type="text"
                    value={customerSponsor}
                    placeholder="Auto-filled on valid Member ID"
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      background: '#f8fafc',
                      color: customerSponsor ? '#0f172a' : '#94a3b8',
                      fontWeight: customerSponsor ? '600' : '400',
                    }}
                  />
                </div>

              </div>
            </div>


            {/* 3. Payment Mode & Settlement */}
            <div className="content-card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💳</span> 3. Payment Settlement
                </h3>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', gap: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeOption('full');
                      setAdvancePayment(grandTotal);
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: paymentTypeOption === 'full' ? '#636B2F' : 'transparent',
                      color: paymentTypeOption === 'full' ? '#ffffff' : '#64748b',
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
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: paymentTypeOption === 'partial' ? '#636B2F' : 'transparent',
                      color: paymentTypeOption === 'partial' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Partial / Advance Payment
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="UPI / QR Code">UPI / QR Code</option>
                    <option value="Bank NEFT / RTGS">Bank NEFT / RTGS</option>
                    <option value="Debit / Credit Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash / POS Receipt">Cash / POS Receipt</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    {paymentTypeOption === 'full' ? 'Amount Paid (₹)' : 'Advance / Received (₹)'}
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
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      background: paymentTypeOption === 'full' ? '#f8fafc' : '#ffffff',
                      color: paymentTypeOption === 'full' ? '#64748b' : '#0f172a',
                      fontWeight: 700,
                    }}
                    min="0"
                    max={grandTotal}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Ref / UTR Number
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {paymentTypeOption === 'partial' && (
                <div style={{ marginTop: '1rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#92400e', fontWeight: 600 }}>
                    ⏳ Remaining Balance to Collect Later:
                  </span>
                  <strong style={{ color: '#b45309', fontSize: '0.95rem' }}>
                    ₹{remainingBalanceDue.toLocaleString()}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Invoice Breakdown & Dynamic Commission to Admin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Invoice & Admin Commission Card */}
            <div className="content-card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  🧾 Invoice & Commission Summary
                </h3>
                <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                  Live Calculation
                </span>
              </div>

              {/* Price Calculation Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Project Value ({quantity}x)</span>
                  <span>₹{grossSubtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  <span>Total Project Value</span>
                  <span style={{ color: '#0f172a' }}>₹{grandTotal.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', fontWeight: 700 }}>
                  <span>Amount Received Now</span>
                  <span>₹{receivedAmount.toLocaleString()}</span>
                </div>

                {remainingBalanceDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', fontWeight: 700 }}>
                    <span>Remaining Balance Due</span>
                    <span>₹{remainingBalanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Commission To Admin on Collected Amount */}
              <div style={{ marginTop: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                    🏛️ Admin Facilitation Commission
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626' }}>
                    {adminCommissionPercent}% (₹{adminCommissionAmount.toLocaleString()})
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.65rem' }}>
                  Calculated strictly on the <strong>received amount (₹{receivedAmount.toLocaleString()})</strong>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#15803d', fontWeight: 700 }}>
                    💰 Net Entity Realized Now
                  </span>
                  <span style={{ color: '#15803d', fontWeight: 800, fontSize: '0.95rem' }}>
                    ₹{netEntityEarnings.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notice that Admin Distributes Network MLM Incomes */}
              <div style={{ marginTop: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#1e40af', lineHeight: '1.45' }}>
                ℹ️ <strong>Admin Commission Release:</strong> Admin commission of ₹{adminCommissionAmount.toLocaleString()} is recorded in the database. When balance payments are collected in the Payments section, additional admin commission will be automatically released.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '0.85rem',
                  background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #636B2F 0%, #505726 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 107, 47, 0.3)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {isSubmitting ? 'Saving to Database...' : '🚀 Record Sale & Generate Invoice'}
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
              Sale Successfully Saved to Database!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Invoice <strong>{createdSaleData.invoiceNumber || createdSaleData.invoice_number}</strong> has been generated and recorded.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'left', fontSize: '0.82rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <strong>{createdSaleData.customerName || createdSaleData.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Item / Service:</span>
                <strong>{createdSaleData.item}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Project Value:</span>
                <strong>₹{(createdSaleData.grossAmount || createdSaleData.gross_amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Amount Received:</span>
                <strong style={{ color: '#2563eb' }}>₹{(createdSaleData.advancePayment || createdSaleData.advance_payment || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Remaining Balance Due:</span>
                <strong style={{ color: (createdSaleData.balanceDue || createdSaleData.balance_due) > 0 ? '#d97706' : '#16a34a' }}>
                  ₹{(createdSaleData.balanceDue || createdSaleData.balance_due || 0).toLocaleString()}
                </strong>
              </div>
              <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.25rem', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Admin Commission Released:</span>
                <strong style={{ color: '#dc2626' }}>₹{(createdSaleData.adminCommissionCut || createdSaleData.admin_commission_cut || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Net Entity Realized:</span>
                <strong style={{ color: '#16a34a' }}>₹{(createdSaleData.netEntityPayout || createdSaleData.net_entity_payout || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/entity/sales');
                }}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#636B2F', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                View Sales Reports →
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
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Record Another Sale
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EntityCreateSale;
