import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Briefcase,
  Layers,
  Search,
  RefreshCw,
  FileText,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  Zap,
  User,
  Tag,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import {
  getPendingOrders,
  confirmPendingOrder,
  cancelPendingOrder,
} from '../../api/adminOrdersService';

function AdminPendingOrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info'); // 'success' | 'error' | 'info'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Review & Confirm Modal State
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [approvedCommissionPercent, setApprovedCommissionPercent] = useState('15.00');
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Cancel Order Modal State
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Fetch pending orders from API
  const loadPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingOrders();
      const records = res?.orders || res?.sales || [];
      const pendingOnly = records.filter(
        (o) => (o.approval_status ?? o.approvalStatus ?? 'pending') === 'pending'
      );
      setOrders(pendingOnly);
    } catch (err) {
      console.error('Error loading pending orders:', err);
      setError(err?.message || 'Failed to load pending orders from API.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingOrders();
  }, []);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const query = searchQuery.trim().toLowerCase();
      const invoice = (o.invoice_number || o.invoiceNumber || o.id || '').toString().toLowerCase();
      const customer = (o.customer_name || o.customer || '').toString().toLowerCase();
      const memberId = (o.customer_user_code || o.customerUserCode || o.sponsor || '').toString().toLowerCase();
      const entity = (o.entity_name || o.entityName || '').toString().toLowerCase();
      const item = (o.item || '').toString().toLowerCase();

      const matchSearch =
        !query ||
        invoice.includes(query) ||
        customer.includes(query) ||
        memberId.includes(query) ||
        entity.includes(query) ||
        item.includes(query);

      const type = (o.item_type || o.itemType || '').toLowerCase();
      const matchType = itemTypeFilter === 'all' || type === itemTypeFilter.toLowerCase();

      return matchSearch && matchType;
    });
  }, [orders, searchQuery, itemTypeFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Aggregate Metrics for Summary Cards
  const totalPendingCount = orders.length;
  const totalPendingGross = useMemo(() => {
    return orders.reduce((acc, curr) => acc + (Number(curr.gross_amount ?? curr.grossAmount) || 0), 0);
  }, [orders]);

  const totalAdvanceReceived = useMemo(() => {
    return orders.reduce((acc, curr) => acc + (Number(curr.advance_payment ?? curr.advancePayment) || 0), 0);
  }, [orders]);

  const totalRemainingBalance = useMemo(() => {
    return orders.reduce((acc, curr) => acc + (Number(curr.balance_due ?? curr.balanceDue) || 0), 0);
  }, [orders]);

  // Open Review & Confirm Modal
  const openReviewModal = (order) => {
    setSelectedOrderForReview(order);
    const initialPercent = order.admin_commission_percent ?? order.adminCommissionPercent ?? 15.0;
    setApprovedCommissionPercent(String(Number(initialPercent).toFixed(2)));
    setReviewError('');
    setConfirmingOrder(false);
  };

  const closeReviewModal = () => {
    if (confirmingOrder) return;
    setSelectedOrderForReview(null);
    setReviewError('');
  };

  // Live Commission Preview Math
  const liveFinancials = useMemo(() => {
    if (!selectedOrderForReview) return null;

    const gross = Number(selectedOrderForReview.gross_amount ?? selectedOrderForReview.grossAmount) || 0;
    const advance = Number(selectedOrderForReview.advance_payment ?? selectedOrderForReview.advancePayment) || 0;

    const rawPercent = parseFloat(approvedCommissionPercent);
    const validPercent = isNaN(rawPercent) ? 0 : Math.min(100, Math.max(0, rawPercent));

    const totalAdminCommission = Math.round(((gross * validPercent) / 100) * 100) / 100;
    const initialPaymentAdminCut = Math.round(((advance * validPercent) / 100) * 100) / 100;
    const remainingBalance = Math.round((gross - advance) * 100) / 100;
    const netEntityInitialAmount = Math.round((advance - initialPaymentAdminCut) * 100) / 100;
    const remainingExpectedAdminCommission = Math.max(
      0,
      Math.round((totalAdminCommission - initialPaymentAdminCut) * 100) / 100
    );

    return {
      gross,
      advance,
      percent: validPercent,
      totalAdminCommission,
      initialPaymentAdminCut,
      netEntityInitialAmount,
      remainingBalance,
      remainingExpectedAdminCommission,
    };
  }, [selectedOrderForReview, approvedCommissionPercent]);

  // Submit Order Confirmation
  const handleConfirmOrder = async () => {
    if (!selectedOrderForReview || confirmingOrder) return;

    const percentNum = parseFloat(approvedCommissionPercent);
    if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      setReviewError('Admin Commission percentage must be a valid number between 0% and 100%.');
      return;
    }

    setConfirmingOrder(true);
    setReviewError('');

    try {
      const res = await confirmPendingOrder(selectedOrderForReview.id, percentNum);
      if (res?.status === 'success') {
        const msg = res.message || `Order #${selectedOrderForReview.invoice_number} successfully confirmed.`;
        showToast(msg, 'success');
        setOrders((prev) => prev.filter((o) => o.id !== selectedOrderForReview.id));
        setSelectedOrderForReview(null);
      } else {
        setReviewError(res?.message || 'Failed to confirm order. Please try again.');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
      const errMsg = err?.message || err?.error || 'Failed to confirm order on server.';
      setReviewError(errMsg);
    } finally {
      setConfirmingOrder(false);
    }
  };

  // Open Cancel Order Modal
  const openCancelModal = (order) => {
    setSelectedOrderForCancel(order);
    setCancellationReason('');
    setCancelError('');
    setCancellingOrder(false);
  };

  const closeCancelModal = () => {
    if (cancellingOrder) return;
    setSelectedOrderForCancel(null);
    setCancelError('');
  };

  // Submit Order Cancellation
  const handleCancelOrder = async () => {
    if (!selectedOrderForCancel || cancellingOrder) return;

    const trimmed = cancellationReason.trim();
    if (trimmed.length < 5) {
      setCancelError('Please enter a cancellation reason of at least 5 characters.');
      return;
    }
    if (trimmed.length > 1000) {
      setCancelError('Cancellation reason cannot exceed 1000 characters.');
      return;
    }

    setCancellingOrder(true);
    setCancelError('');

    try {
      const res = await cancelPendingOrder(selectedOrderForCancel.id, trimmed);
      if (res?.status === 'success') {
        const msg = res.message || `Order #${selectedOrderForCancel.invoice_number} has been cancelled.`;
        showToast(msg, 'info');

        if (res.warning) {
          setTimeout(() => {
            showToast(`⚠️ ${res.warning}`, 'info');
          }, 4500);
        }

        setOrders((prev) => prev.filter((o) => o.id !== selectedOrderForCancel.id));
        setSelectedOrderForCancel(null);
      } else {
        setCancelError(res?.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      const errMsg = err?.message || err?.error || 'Failed to cancel order on server.';
      setCancelError(errMsg);
    } finally {
      setCancellingOrder(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: toastType === 'error' ? '#fef2f2' : toastType === 'info' ? '#f8fafc' : '#ecfdf5',
            color: toastType === 'error' ? '#b91c1c' : toastType === 'info' ? '#1e293b' : '#047857',
            border: `1.5px solid ${toastType === 'error' ? '#fecaca' : toastType === 'info' ? '#cbd5e1' : '#a7f3d0'}`,
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
            {toastType === 'error' ? (
              <AlertTriangle size={18} color="#dc2626" />
            ) : (
              <CheckCircle2 size={18} color="#059669" />
            )}
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d adm-pod-amber">
            <Clock size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b45309', background: 'rgba(217, 119, 6, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                ● CLEARANCE &amp; AUDIT GATEWAY
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: totalPendingCount > 0 ? '#dc2626' : '#059669', background: totalPendingCount > 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(5, 150, 105, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: `1px solid ${totalPendingCount > 0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)'}` }}>
                ● {totalPendingCount} Orders Awaiting Approval
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Pending Orders Clearance
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Review newly submitted entity orders, authorize project commission rates, and trigger automated ledger distribution.
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={loadPendingOrders}
              disabled={loading}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.86rem' }}
            >
              <RefreshCw size={16} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Pending Orders Count */}
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
                ● REVIEW QUEUE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                PENDING ORDERS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Clock size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {totalPendingCount}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Clock size={13} color="#d97706" />
              <span>{totalPendingCount === 1 ? '1 order needs action' : `${totalPendingCount} orders await review`}</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Awaiting
            </span>
          </div>
        </div>

        {/* Card 2: Total Pending Gross Value */}
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
                ● GROSS VALUE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                CONTRACT VALUE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Briefcase size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#1e40af' }}>
              {formatCurrency(totalPendingGross)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Briefcase size={13} color="#3569a7" />
              <span>Gross contract value</span>
            </span>
            <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Total GMV
            </span>
          </div>
        </div>

        {/* Card 3: Total Advance Payments Received */}
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
                ● RECORDED ADVANCE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ADVANCE RECEIVED
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#0d9488' }}>
              {formatCurrency(totalAdvanceReceived)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>Funds already collected</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● In Account
            </span>
          </div>
        </div>

        {/* Card 4: Total Remaining Project Balance */}
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
                ● PENDING RECEIVABLES
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                REMAINING BALANCE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CreditCard size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#9333ea' }}>
              {formatCurrency(totalRemainingBalance)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CreditCard size={13} color="#9333ea" />
              <span>Due upon milestones</span>
            </span>
            <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Due On Delivery
            </span>
          </div>
        </div>
      </div>

      {/* 3. Executive Filter Toolbar (Single Unified Row) */}
      <div className="adm-toolbar-card">
        <div className="adm-toolbar-filters">
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '180px' }}>
            <input
              type="text"
              className="adm-toolbar-input"
              placeholder="Search Invoice #, Customer, Member ID, Entity, Offering..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Offering Type Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '175px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={itemTypeFilter}
              onChange={(e) => {
                setItemTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Offering Types</option>
              <option value="service">Services Only</option>
              <option value="product">Products Only</option>
              <option value="package">Packages Only</option>
            </select>
          </div>

          {(searchQuery || itemTypeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setItemTypeFilter('all');
                setCurrentPage(1);
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
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
            Showing {filteredOrders.length} Orders
          </span>
        </div>
      </div>

      {/* Error Alert Banner if any */}
      {error && (
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
            <span>Error loading pending orders: {error}</span>
          </div>
          <button
            type="button"
            onClick={loadPendingOrders}
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
            Retry
          </button>
        </div>
      )}

      {/* 4. Luxury Data Table View */}
      <div className="adm-table-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Order / Invoice</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Date</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Selling Entity</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Customer</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Member ID</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Offering Item</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Project Gross</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Advance Rcvd</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Balance Due</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Type</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="adm-3d-pod adm-pod-amber admFloatPodSlow" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}>
                      <Clock size={24} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>Loading Pending Orders...</div>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Checking newly submitted entity contracts from database</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="adm-3d-pod adm-pod-emerald" style={{ width: '56px', height: '56px', margin: '0 auto 1rem auto' }}>
                      <CheckCircle2 size={28} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      {searchQuery ? 'No Matching Pending Orders Found' : 'No Pending Orders Awaiting Approval'}
                    </div>
                    <p style={{ margin: '0.35rem auto 0', color: '#64748b', fontSize: '0.84rem', maxWidth: '460px', lineHeight: 1.5 }}>
                      {searchQuery
                        ? 'Try adjusting your search terms or clearing filters.'
                        : 'All submitted entity orders have been approved or processed. Newly submitted client orders will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const gross = Number(order.gross_amount ?? order.grossAmount) || 0;
                  const advance = Number(order.advance_payment ?? order.advancePayment) || 0;
                  const balance = Number(order.balance_due ?? order.balanceDue) || 0;
                  const paymentType = order.payment_type || (advance >= gross ? 'full' : advance > 0 ? 'advance' : 'unpaid');

                  return (
                    <tr key={order.id} className="adm-table-row">
                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          {order.invoice_number || `ORD-${order.id}`}
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          <span className="adm-code-chip">ID: #{order.id}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A')}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                          {order.entity_name || 'Direct / Platform'}
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
                            background: order.entity_type === 'freelancer' ? '#faf5ff' : '#fef3c7',
                            color: order.entity_type === 'freelancer' ? '#7e22ce' : '#b45309',
                            border: `1px solid ${order.entity_type === 'freelancer' ? '#e9d5ff' : '#fde68a'}`,
                          }}
                        >
                          {order.entity_type === 'freelancer' ? <Zap size={10} /> : <Building2 size={10} />}
                          <span>{order.entity_type || 'business'}</span>
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
                        {order.customer_name || 'N/A'}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          {order.customer_user_code || order.sponsor || 'N/A'}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                          {order.item || 'N/A'}
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {order.item_type || 'service'}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                        {formatCurrency(gross)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.92rem' }}>
                        {formatCurrency(advance)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: balance > 0 ? '#d97706' : '#64748b', fontSize: '0.92rem' }}>
                        {formatCurrency(balance)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            background: paymentType === 'full' ? '#ecfdf5' : '#eff6ff',
                            color: paymentType === 'full' ? '#047857' : '#1d4ed8',
                            border: `1px solid ${paymentType === 'full' ? '#a7f3d0' : '#bfdbfe'}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {paymentType}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openReviewModal(order)}
                            className="adm-hero-btn-primary"
                            style={{
                              padding: '0.38rem 0.85rem',
                              fontSize: '0.76rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Check size={13} strokeWidth={2.4} />
                            <span>Review &amp; Confirm</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openCancelModal(order)}
                            style={{
                              background: '#ffffff',
                              color: '#dc2626',
                              border: '1.5px solid #fecaca',
                              borderRadius: '8px',
                              padding: '0.38rem 0.75rem',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dc2626';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ffffff';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                          >
                            <X size={13} />
                            <span>Cancel</span>
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

        {/* Pagination Bar */}
        {filteredOrders.length > pageSize && (
          <div
            style={{
              padding: '0.85rem 1.4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ color: '#64748b', fontWeight: 600 }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} pending orders
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span style={{ padding: '0.4rem 0.75rem', color: '#0f172a', fontWeight: 800 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REVIEW & CONFIRM MODAL                                           */}
      {/* ========================================================================= */}
      {selectedOrderForReview && liveFinancials && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !confirmingOrder) {
              closeReviewModal();
            }
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.6rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                  <FileText size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 800, color: '#0f172a' }}>
                    Review &amp; Confirm Order #{selectedOrderForReview.invoice_number}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Review order specifications, authorize approved Admin Commission %, and trigger execution.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={confirmingOrder}
                style={{
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: confirmingOrder ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {reviewError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: '12px',
                    padding: '0.85rem 1.15rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle size={18} color="#dc2626" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Section A — Order & Customer Details */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Section A — Order &amp; Customer Details
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.85rem',
                    background: '#f8fafc',
                    padding: '1.15rem',
                    borderRadius: '14px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.825rem',
                  }}
                >
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Invoice Number</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>{selectedOrderForReview.invoice_number}</div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Order Date</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                      {selectedOrderForReview.date || (selectedOrderForReview.created_at ? new Date(selectedOrderForReview.created_at).toLocaleDateString('en-IN') : 'N/A')}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Selling Entity</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                      {selectedOrderForReview.entity_name || 'Direct'} ({selectedOrderForReview.entity_type || 'business'})
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Customer Name</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>{selectedOrderForReview.customer_name}</div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Customer Member ID</div>
                    <div style={{ fontWeight: 800, color: '#2563eb', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                      {selectedOrderForReview.customer_user_code || selectedOrderForReview.sponsor || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Upline Sponsor</div>
                    <div style={{ fontWeight: 700, color: '#475569', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                      {selectedOrderForReview.sponsor || 'Direct Registration'}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Offering / Item</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      {selectedOrderForReview.item} <span style={{ textTransform: 'capitalize', color: '#64748b', fontWeight: 600 }}>({selectedOrderForReview.item_type || 'service'})</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Advance Received</div>
                    <div style={{ fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                      {formatCurrency(selectedOrderForReview.advance_payment)}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Balance Due</div>
                    <div style={{ fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>
                      {formatCurrency(selectedOrderForReview.balance_due)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section B — Authoritative Admin Commission Input */}
              <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Section B — Approved Admin Commission Percentage
                </div>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: '#1e40af' }}>
                  Specify the authoritative Admin Commission percentage approved for this contract. Provisional catalog rate was <strong>{selectedOrderForReview.admin_commission_percent ?? 15}%</strong>.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={confirmingOrder}
                      value={approvedCommissionPercent}
                      onChange={(e) => {
                        setApprovedCommissionPercent(e.target.value);
                        setReviewError('');
                      }}
                      className="adm-toolbar-input"
                      style={{
                        width: '100%',
                        height: '46px',
                        paddingRight: '35px',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        border: '2px solid #3b82f6',
                        background: '#ffffff',
                      }}
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b', fontSize: '1rem' }}>
                      %
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[10, 15, 20, 25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        disabled={confirmingOrder}
                        onClick={() => setApprovedCommissionPercent(rate.toFixed(2))}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #93c5fd',
                          background: parseFloat(approvedCommissionPercent) === rate ? '#2563eb' : '#ffffff',
                          color: parseFloat(approvedCommissionPercent) === rate ? '#ffffff' : '#1e40af',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section C — Live Financial & Commission Calculation Table */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Section C — Live Financial &amp; Commission Calculation
                </div>

                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: 800 }}>Calculation Metric</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#475569', fontWeight: 800 }}>Amount / Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#334155' }}>Total Project Value (Gross Amount)</td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(liveFinancials.gross)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#334155', fontWeight: 700 }}>Approved Admin Commission Percentage</td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                          {liveFinancials.percent.toFixed(2)}%
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#334155' }}>
                          Expected Total Admin Commission ({liveFinancials.percent}%)
                        </td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#4338ca' }}>
                          {formatCurrency(liveFinancials.totalAdminCommission)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#166534', fontWeight: 700 }}>Initial Amount Received (Advance)</td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#166534' }}>
                          {formatCurrency(liveFinancials.advance)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#166534' }}>
                          Admin Cut on Initial Payment ({liveFinancials.percent}%)
                        </td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                          {formatCurrency(liveFinancials.initialPaymentAdminCut)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#166534' }}>
                          Net Entity Amount on Initial Payment (Advance - Admin Cut)
                        </td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#166534' }}>
                          {formatCurrency(liveFinancials.netEntityInitialAmount)}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#334155' }}>Remaining Project Balance</td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: liveFinancials.remainingBalance > 0 ? '#b45309' : '#16a34a' }}>
                          {formatCurrency(liveFinancials.remainingBalance)}
                        </td>
                      </tr>
                      <tr style={{ background: '#fefce8' }}>
                        <td style={{ padding: '0.7rem 1rem', color: '#854d0e', fontWeight: 700 }}>
                          Remaining Expected Admin Commission (On Future Receipts)
                        </td>
                        <td style={{ padding: '0.7rem 1rem', textAlign: 'right', fontWeight: 800, color: '#854d0e' }}>
                          {formatCurrency(liveFinancials.remainingExpectedAdminCommission)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section D — Confirmation Actions */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    Confirm this order with approved Admin Commission of {liveFinancials.percent}%?
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Activates the contract, updates the financial ledger, credits network volume, and moves order to Active Management.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    disabled={confirmingOrder}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: confirmingOrder ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmOrder}
                    disabled={confirmingOrder}
                    className="adm-hero-btn-primary"
                    style={{
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.84rem',
                      opacity: confirmingOrder ? 0.7 : 1,
                    }}
                  >
                    <Check size={16} strokeWidth={2.4} />
                    <span>{confirmingOrder ? 'Confirming...' : 'Authorize & Confirm Order'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CANCEL ORDER MODAL                                               */}
      {/* ========================================================================= */}
      {selectedOrderForCancel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancellingOrder) {
              closeCancelModal();
            }
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #fecaca',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.6rem',
                borderBottom: '1px solid #fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-crimson" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                  <ShieldAlert size={20} strokeWidth={2.4} color="#dc2626" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
                    Cancel Order #{selectedOrderForCancel.invoice_number}
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#b91c1c' }}>
                    Cancels this pending order and logs the mandatory audit reason.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancellingOrder}
                style={{
                  border: '1.5px solid #fca5a5',
                  background: '#ffffff',
                  color: '#991b1b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: cancellingOrder ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {cancelError && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    color: '#991b1b',
                    borderRadius: '12px',
                    padding: '0.85rem 1.15rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  <strong>Error:</strong> {cancelError}
                </div>
              )}

              {/* Order Summary Overview */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  fontSize: '0.825rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Customer</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedOrderForCancel.customer_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Entity</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedOrderForCancel.entity_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Amount</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(selectedOrderForCancel.gross_amount)}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>Amount Received</span>
                  <div style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(selectedOrderForCancel.advance_payment)}</div>
                </div>
              </div>

              {/* Advance Payment Notice if advance was already received */}
              {Number(selectedOrderForCancel.advance_payment ?? 0) > 0 && (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1.5px solid #fde68a',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.45 }}>
                    <strong>Advance Payment Notice:</strong> This order has an advance receipt of{' '}
                    <strong>{formatCurrency(selectedOrderForCancel.advance_payment)}</strong> recorded.
                    The payment record is preserved in the database for accounting audits. Manual refund/settlement is required if applicable.
                  </div>
                </div>
              )}

              {/* Mandatory Cancellation Reason Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.4rem',
                  }}
                >
                  Cancellation Reason <span style={{ color: '#dc2626' }}>* (Minimum 5 characters)</span>
                </label>
                <textarea
                  rows="4"
                  disabled={cancellingOrder}
                  value={cancellationReason}
                  onChange={(e) => {
                    setCancellationReason(e.target.value);
                    setCancelError('');
                  }}
                  placeholder="Provide a detailed reason for cancellation (e.g. Customer withdrew order, Duplicate record, Pricing dispute)..."
                  className="adm-toolbar-input"
                  style={{
                    width: '100%',
                    height: '95px',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.85rem',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>Required for compliance audit trail</span>
                  <span>{cancellationReason.length} / 1000 characters</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '1.25rem',
                }}
              >
                <button
                  type="button"
                  onClick={closeCancelModal}
                  disabled={cancellingOrder}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: cancellingOrder ? 'not-allowed' : 'pointer',
                  }}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancellingOrder}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: cancellingOrder ? '#fca5a5' : '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: cancellingOrder ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <X size={15} strokeWidth={2.4} />
                  <span>{cancellingOrder ? 'Cancelling...' : 'Confirm Order Cancellation'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPendingOrdersPage;
