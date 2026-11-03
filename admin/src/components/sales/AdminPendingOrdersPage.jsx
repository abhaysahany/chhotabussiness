import React, { useState, useMemo, useEffect } from 'react';
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

  // Fetch pending orders from Phase 2 API (GET /api/admin/orders?approval_status=pending)
  const loadPendingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingOrders();
      const records = res?.orders || res?.sales || [];
      // Strictly ensure only pending orders are stored
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

      const matchSearch = !query ||
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
    const initialPercent = order.admin_commission_percent ?? order.adminCommissionPercent ?? 15.00;
    setApprovedCommissionPercent(String(Number(initialPercent).toFixed(2)));
    setReviewError('');
    setConfirmingOrder(false);
  };

  const closeReviewModal = () => {
    if (confirmingOrder) return; // Prevent closing while processing
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

    const totalAdminCommission = Math.round((gross * validPercent / 100) * 100) / 100;
    const initialPaymentAdminCut = Math.round((advance * validPercent / 100) * 100) / 100;
    const remainingBalance = Math.round((gross - advance) * 100) / 100;
    const netEntityInitialAmount = Math.round((advance - initialPaymentAdminCut) * 100) / 100;
    const remainingAdminCommission = Math.max(0, Math.round((totalAdminCommission - initialPaymentAdminCut) * 100) / 100);

    return {
      gross,
      advance,
      percent: validPercent,
      totalAdminCommission,
      initialPaymentAdminCut,
      netEntityInitialAmount,
      remainingBalance,
      remainingAdminCommission,
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

        // Remove from pending list
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
    if (cancellingOrder) return; // Prevent closing while processing
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

        // If backend returned warning about advance payment, surface it
        if (res.warning) {
          setTimeout(() => {
            showToast(`⚠️ ${res.warning}`, 'info');
          }, 4500);
        }

        // Remove from pending list
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
    <div className="admin-page-container" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: toastType === 'error' ? '#991b1b' : toastType === 'info' ? '#1e293b' : '#065f46',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 999999,
            boxShadow: '0 10px 20px -3px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.15)',
            maxWidth: '420px',
            lineHeight: 1.4,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div
        className="page-header"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              Pending Orders
            </h1>
            <span
              style={{
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                border: '1px solid #fde68a',
              }}
            >
              {totalPendingCount} Awaiting Review
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: '0.35rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Review newly submitted Entity Orders and approve or cancel them.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadPendingOrders}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'background 0.15s ease',
            }}
          >
            <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh Orders'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Dynamic from Pending Orders) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="stat-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            PENDING ORDERS COUNT
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {totalPendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.2rem', fontWeight: 600 }}>
            {totalPendingCount === 1 ? '1 order awaits action' : `${totalPendingCount} orders await action`}
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            TOTAL PENDING PROJECT VALUE
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e40af', marginTop: '0.35rem' }}>
            {formatCurrency(totalPendingGross)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            Gross contract value
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            TOTAL ADVANCE PAYMENTS RECEIVED
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {formatCurrency(totalAdvanceReceived)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Funds already recorded
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            TOTAL REMAINING PROJECT BALANCE
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', marginTop: '0.35rem' }}>
            {formatCurrency(totalRemainingBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            To be collected on delivery
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.85rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, Member ID, Entity, or Offering..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              color: '#0f172a',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={itemTypeFilter}
            onChange={(e) => {
              setItemTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              color: '#334155',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Offering Types</option>
            <option value="service">Services Only</option>
            <option value="product">Products Only</option>
            <option value="package">Packages Only</option>
          </select>

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Error loading pending orders:</strong> {error}
          </div>
          <button
            type="button"
            onClick={loadPendingOrders}
            style={{
              padding: '0.4rem 0.75rem',
              background: '#991b1b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Pending Orders Table Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>ORDER / INVOICE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>DATE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>ENTITY</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>CUSTOMER</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>MEMBER ID</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>OFFERING</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>PROJECT AMOUNT</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>AMOUNT RECEIVED</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>REMAINING BALANCE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>PAYMENT TYPE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 0.75rem', borderColor: '#3b82f6 transparent transparent transparent' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading pending orders...</div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {searchQuery ? 'No Matching Pending Orders Found' : 'No Pending Orders Awaiting Approval'}
                    </div>
                    <p style={{ margin: '0.35rem auto 0', color: '#64748b', fontSize: '0.85rem', maxWidth: '440px' }}>
                      {searchQuery
                        ? 'Try adjusting your search terms or filters.'
                        : 'All submitted entity orders have been processed. Newly submitted orders will appear here automatically.'}
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
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div>{order.invoice_number || `ORD-${order.id}`}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>ID: #{order.id}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A')}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.entity_name || 'Direct / Platform'}</div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#475569',
                            background: '#f1f5f9',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '0.15rem',
                          }}
                        >
                          {order.entity_type || 'business'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {order.customer_name || 'N/A'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#2563eb', fontWeight: 600, fontFamily: 'monospace' }}>
                        {order.customer_user_code || order.sponsor || 'N/A'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.item || 'N/A'}</div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#6b7280',
                            textTransform: 'capitalize',
                          }}
                        >
                          {order.item_type || 'service'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(gross)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {formatCurrency(advance)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: balance > 0 ? '#d97706' : '#64748b' }}>
                        {formatCurrency(balance)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            background: paymentType === 'full' ? '#dcfce7' : '#e0e7ff',
                            color: paymentType === 'full' ? '#15803d' : '#4338ca',
                            textTransform: 'uppercase',
                          }}
                        >
                          {paymentType}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            border: '1px solid #fde68a',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Pending Approval
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openReviewModal(order)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                            }}
                          >
                            Review & Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => openCancelModal(order)}
                            style={{
                              padding: '0.4rem 0.65rem',
                              background: '#ffffff',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Cancel
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
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ color: '#64748b' }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} pending orders
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Previous
              </button>
              <span style={{ padding: '0.35rem 0.75rem', color: '#475569', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REVIEW & CONFIRM MODAL (Section A, B, C, D)                       */}
      {/* ========================================================================= */}
      {selectedOrderForReview && liveFinancials && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '1rem',
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Review & Confirm Order #{selectedOrderForReview.invoice_number}
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  Review order specifications, set the approved Admin Commission, and authorize order activation.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={confirmingOrder}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: confirmingOrder ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Error Message inside Modal */}
            {reviewError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <strong>Error:</strong> {reviewError}
              </div>
            )}

            {/* SECTION A — ORDER INFORMATION */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Section A — Order & Customer Details
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  background: '#f8fafc',
                  padding: '1.15rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.825rem',
                }}
              >
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>INVOICE NUMBER</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{selectedOrderForReview.invoice_number}</div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>ORDER DATE</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                    {selectedOrderForReview.date || (selectedOrderForReview.created_at ? new Date(selectedOrderForReview.created_at).toLocaleDateString('en-IN') : 'N/A')}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>SELLING ENTITY</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                    {selectedOrderForReview.entity_name || 'Direct'} ({selectedOrderForReview.entity_type || 'business'})
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>CUSTOMER NAME</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{selectedOrderForReview.customer_name}</div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>CUSTOMER MEMBER ID</div>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                    {selectedOrderForReview.customer_user_code || selectedOrderForReview.sponsor || 'N/A'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>UPLINE SPONSOR</div>
                  <div style={{ fontWeight: 600, color: '#475569', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                    {selectedOrderForReview.sponsor || 'Direct Registration'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>CUSTOMER CONTACT</div>
                  <div style={{ color: '#334155', marginTop: '0.2rem' }}>
                    {selectedOrderForReview.customer_email || 'No Email'}
                    {selectedOrderForReview.customer_phone ? ` • ${selectedOrderForReview.customer_phone}` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>OFFERING / ITEM</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                    {selectedOrderForReview.item} <span style={{ textTransform: 'capitalize', color: '#64748b', fontWeight: 500 }}>({selectedOrderForReview.item_type || 'service'})</span>
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>QUANTITY & UNIT PRICE</div>
                  <div style={{ color: '#334155', marginTop: '0.2rem' }}>
                    Qty: {selectedOrderForReview.quantity || 1} @ {formatCurrency(selectedOrderForReview.unit_price)}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>PAYMENT METHOD & REF</div>
                  <div style={{ color: '#334155', marginTop: '0.2rem' }}>
                    {selectedOrderForReview.payment_method || 'Online'} {selectedOrderForReview.reference_no ? `(Ref: ${selectedOrderForReview.reference_no})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>INITIAL AMOUNT RECEIVED</div>
                  <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '0.2rem' }}>
                    {formatCurrency(selectedOrderForReview.advance_payment)}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>REMAINING PROJECT BALANCE</div>
                  <div style={{ fontWeight: 700, color: '#b45309', marginTop: '0.2rem' }}>
                    {formatCurrency(selectedOrderForReview.balance_due)}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B — ADMIN COMMISSION INPUT */}
            <div style={{ marginBottom: '1.5rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1.15rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Section B — Set Authoritative Admin Commission Percentage
              </div>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: '#1e40af' }}>
                Specify the final Admin Commission percentage approved for this project. The provisional catalog rate was <strong>{selectedOrderForReview.admin_commission_percent ?? 15}%</strong>.
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
                    style={{
                      width: '100%',
                      padding: '0.65rem 2.2rem 0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '2px solid #3b82f6',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      background: '#ffffff',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#64748b',
                    }}
                  >
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
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        background: parseFloat(approvedCommissionPercent) === rate ? '#2563eb' : '#ffffff',
                        color: parseFloat(approvedCommissionPercent) === rate ? '#ffffff' : '#1e40af',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION C — LIVE FINANCIAL CALCULATION */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Section C — Live Financial & Commission Calculation
              </div>

              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Calculation Metric</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#475569', fontWeight: 700 }}>Amount / Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>Total Project Value (Gross Amount)</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(liveFinancials.gross)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#334155', fontWeight: 600 }}>Approved Admin Commission Percentage</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                        {liveFinancials.percent.toFixed(2)}%
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                        Expected Total Admin Commission <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({liveFinancials.gross} × {liveFinancials.percent}%)</span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: '#4338ca' }}>
                        {formatCurrency(liveFinancials.totalAdminCommission)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#166534', fontWeight: 600 }}>Initial Amount Received (Advance)</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                        {formatCurrency(liveFinancials.advance)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#166534' }}>
                        Admin Cut on Initial Payment <span style={{ fontSize: '0.75rem', color: '#15803d' }}>({liveFinancials.advance} × {liveFinancials.percent}%)</span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                        {formatCurrency(liveFinancials.initialPaymentAdminCut)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#166534' }}>
                        Net Entity Amount on Initial Payment <span style={{ fontSize: '0.75rem', color: '#15803d' }}>(Advance - Admin Cut)</span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                        {formatCurrency(liveFinancials.netEntityInitialAmount)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>Remaining Project Balance</td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: liveFinancials.remainingBalance > 0 ? '#b45309' : '#16a34a' }}>
                        {formatCurrency(liveFinancials.remainingBalance)}
                      </td>
                    </tr>
                    <tr style={{ background: '#fefce8' }}>
                      <td style={{ padding: '0.65rem 1rem', color: '#854d0e', fontWeight: 600 }}>
                        Remaining Expected Admin Commission <span style={{ fontSize: '0.75rem', color: '#a16207' }}>(On Future Balance Receipts)</span>
                      </td>
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>
                        {formatCurrency(liveFinancials.remainingExpectedAdminCommission)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION D — CONFIRMATION ACTIONS */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                  Confirm this order with approved Admin Commission of {liveFinancials.percent}%?
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  This will activate the order, update the initial payment receipt snapshot, credit network PV, and move it to Order Management.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={confirmingOrder}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: confirmingOrder ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel / Close
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={confirmingOrder}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: confirmingOrder ? '#93c5fd' : '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: confirmingOrder ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {confirmingOrder ? 'Confirming...' : '✓ Confirm Order'}
                </button>
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '1rem',
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
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fee2e2', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                  Cancel Order #{selectedOrderForCancel.invoice_number}
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  This will cancel the pending order and record your official cancellation reason.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancellingOrder}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: cancellingOrder ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Error Message inside Modal */}
            {cancelError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <strong>Error:</strong> {cancelError}
              </div>
            )}

            {/* Order Summary Overview */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.65rem',
                fontSize: '0.825rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>CUSTOMER</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedOrderForCancel.customer_name}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>ENTITY</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrderForCancel.entity_name}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>TOTAL PROJECT AMOUNT</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(selectedOrderForCancel.gross_amount)}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>AMOUNT RECEIVED</span>
                <div style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(selectedOrderForCancel.advance_payment)}</div>
              </div>
            </div>

            {/* Advance Payment Warning (Prompt Section 7 requirement) */}
            {Number(selectedOrderForCancel.advance_payment ?? 0) > 0 && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>⚠️</div>
                <div style={{ fontSize: '0.825rem', color: '#92400e', lineHeight: 1.45 }}>
                  <strong>Advance Payment Notice:</strong> This order already has an advance payment of{' '}
                  <strong>{formatCurrency(selectedOrderForCancel.advance_payment)}</strong> recorded.
                  The existing payment receipt will be strictly preserved in the database for accounting audit.
                  Manual offline settlement/refund between the Entity and Customer is required as applicable.
                </div>
              </div>
            )}

            {/* Mandatory Cancellation Reason Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
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
                placeholder="Provide a specific audit reason for cancelling this order (e.g., Customer withdrew requirement, Duplicate order, Pricing dispute, Non-fulfillment)..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.72rem', color: '#64748b' }}>
                <span>Mandatory for audit trail</span>
                <span>{cancellationReason.length} / 1000 characters</span>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1.25rem',
              }}
            >
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancellingOrder}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
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
                  borderRadius: '8px',
                  border: 'none',
                  background: cancellingOrder ? '#fca5a5' : '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: cancellingOrder ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(220,38,38,0.25)',
                }}
              >
                {cancellingOrder ? 'Cancelling...' : 'Confirm Order Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPendingOrdersPage;
