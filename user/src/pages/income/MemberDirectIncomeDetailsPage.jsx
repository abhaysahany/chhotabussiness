import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  Receipt,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { getUserDirectIncomeOrderDetails } from '../../api/userIncomeService';
import { formatINR } from '../../utils/formatters';
import { formatDate, formatDateTime } from '../../utils/timezone';

function MemberDirectIncomeDetailsPage({ onNavigate }) {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Expanded rows state for installment details
  const [expandedReceipts, setExpandedReceipts] = useState({});

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (typeof onNavigate === 'function') {
      onNavigate('direct-income');
    } else {
      navigate('/direct-income');
    }
  };

  const toggleReceiptDetails = (paymentId) => {
    setExpandedReceipts((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No Order ID specified in URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await getUserDirectIncomeOrderDetails(orderId);
        if (!isMounted) return;

        if (res && res.status === 'success' && res.order) {
          setData(res);
        } else {
          setError(res?.message || `Order #${orderId} was not found or is not associated with your account.`);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching member direct income order details:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Unable to load order details. You may not be authorized to view this order.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId, retryCount]);

  const order = data?.order || {};
  const distributions = data?.distributions || [];
  const pendingInstallments = data?.pending_installments || [];
  const dumpRecords = data?.dump_records || [];

  const invoiceNumber = order.invoice_number || order.invoiceNumber || `ORD-${orderId}`;
  const itemName = order.item_name || order.itemName || 'Custom Product / Package';
  const itemType = order.item_type || order.itemType || 'Package';
  const category = order.category || 'General';
  const customerName = order.customer_name || order.customerName || 'Customer';
  const customerUserCode = order.customer_user_code || order.customerUserCode || '—';
  const orderDate = order.order_date || order.orderDate;

  // 1. Order Payment Metrics
  const orderGross = Number(order.order_gross_amount ?? order.orderGrossAmount ?? 0);
  const paymentReceived = Number(order.total_advance_received ?? order.totalAdvanceReceived ?? 0);
  const remainingBalance = Number(order.balance_due ?? order.balanceDue ?? 0);
  const adminCommissionRate = Number(order.admin_commission_percent ?? order.adminCommissionPercent ?? 15);

  // 2. Direct Income Entitlement Metrics
  const expectedDirect = Number(order.expected_direct_income ?? order.expectedDirectIncome ?? 0);
  const receivedDirect = Number(order.received_direct_income ?? order.receivedDirectIncome ?? 0);
  const pendingDirect = Number(order.pending_direct_income ?? order.pendingDirectIncome ?? 0);
  const approvedAdjustments = Number(order.dump_direct_income ?? order.dumpDirectIncome ?? 0);
  const distributionStatus = (order.distribution_status || order.distributionStatus || 'pending').toLowerCase();

  // Dynamic Direct Income rate from actual API distributions or fallback default
  const directRate = distributions.length > 0 && distributions[0].direct_income_percent
    ? distributions[0].direct_income_percent
    : 40;

  // Progress Calculation grounded strictly on actual API values
  const progressPercent = expectedDirect > 0
    ? Math.min(100, Math.max(0, Math.round((receivedDirect / expectedDirect) * 100)))
    : 0;

  // Clean Order Status Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Fully Distributed',
          icon: <CheckCircle2 size={13} />,
          bg: '#ecfdf5',
          color: '#059669',
          border: '#a7f3d0',
        };
      case 'partial':
        return {
          label: 'Partially Distributed',
          icon: <Clock size={13} />,
          bg: '#eff6ff',
          color: '#2563eb',
          border: '#bfdbfe',
        };
      case 'pending':
      default:
        return {
          label: 'Pending Collection',
          icon: <AlertCircle size={13} />,
          bg: '#fffbeb',
          color: '#d97706',
          border: '#fde68a',
        };
    }
  };

  const statusBadge = getStatusBadge(distributionStatus);

  return (
    <div className="user-page-container" style={{ padding: '1.25rem', maxWidth: '1280px', margin: '0 auto', fontFamily: 'inherit', color: '#1e293b' }}>
      {/* 1. NAVIGATION BAR */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
        >
          <ArrowLeft size={15} />
          <span>Back to Direct Income</span>
        </button>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#64748b',
            background: '#f1f5f9',
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        >
          Member Direct Income
        </span>
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid #cbd5e1',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <h3 style={{ margin: '0.85rem 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Loading Order Details...
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Fetching verified Direct Income payout details for Order #{orderId}
          </p>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!loading && error && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#991b1b' }}>
            Unable to View Order Details
          </h3>
          <p style={{ margin: '0 auto 1.25rem auto', fontSize: '0.82rem', color: '#b91c1c', maxWidth: '440px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 1rem',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: '0.45rem 1rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Direct Income
            </button>
          </div>
        </div>
      )}

      {/* 4. SUCCESS PRESENTATION */}
      {!loading && !error && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* SECTION 1 — SIMPLE ORDER HEADER */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1rem 1.25rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Order #{order.order_id || orderId}
                </h1>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '5px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  Invoice: {invoiceNumber}
                </span>
              </div>

              {/* Order Status Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  border: `1px solid ${statusBadge.border}`,
                }}
              >
                {statusBadge.icon}
                <span>{statusBadge.label}</span>
              </span>
            </div>

            {/* Compact Header Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.8rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '0.75rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Product / Package</span>
                <strong style={{ color: '#0f172a' }}>{itemName}</strong>
                <span style={{ color: '#0284c7', fontSize: '0.7rem', display: 'block', marginTop: '0.1rem' }}>
                  {category} • {itemType}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Buyer Name / Member ID</span>
                <strong style={{ color: '#0f172a' }}>
                  {customerName}{' '}
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>({customerUserCode})</span>
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Order Date</span>
                <strong style={{ color: '#0f172a' }}>{formatDate(orderDate)}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Order Status</span>
                <strong style={{ color: '#059669', textTransform: 'capitalize' }}>
                  {order.order_status || order.status || 'Confirmed'}
                </strong>
              </div>
            </div>
          </div>

          {/* SECTION 2 — ORDER PAYMENT SUMMARY */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>
              Order Payment Summary
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {/* 1. Total Order Value */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Order Value</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {formatINR(orderGross)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Total project / package amount
                </div>
              </div>

              {/* 2. Payment Received */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Payment Received</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {formatINR(paymentReceived)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 500, marginTop: '0.15rem' }}>
                  Collected across installments
                </div>
              </div>

              {/* 3. Remaining Balance */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Remaining Balance</div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: remainingBalance > 0 ? '#d97706' : '#64748b',
                    marginTop: '0.2rem',
                  }}
                >
                  {formatINR(remainingBalance)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Amount yet to be collected
                </div>
              </div>

              {/* 4. Admin Commission Rate */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Admin Commission Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>
                  {adminCommissionRate}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Platform commission percentage
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 — YOUR DIRECT INCOME SUMMARY */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>
              Your Direct Income Summary
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {/* 1. Expected Direct Income */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Expected Direct Income</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {formatINR(expectedDirect)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Total Direct Income entitlement
                </div>
              </div>

              {/* 2. Received Direct Income */}
              <div
                style={{
                  background: '#ecfdf5',
                  borderRadius: '10px',
                  border: '1px solid #a7f3d0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>Received Direct Income</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '0.2rem' }}>
                  {formatINR(receivedDirect)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '0.15rem' }}>
                  ● Credited directly to your wallet
                </div>
              </div>

              {/* 3. Pending Direct Income */}
              <div
                style={{
                  background: '#fffbeb',
                  borderRadius: '10px',
                  border: '1px solid #fde68a',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>Pending Direct Income</div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: pendingDirect > 0 ? '#d97706' : '#64748b',
                    marginTop: '0.2rem',
                  }}
                >
                  {formatINR(pendingDirect)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.15rem' }}>
                  Awaiting balance installment collection
                </div>
              </div>

              {/* 4. Approved Adjustments */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.9rem 1.1rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Approved Adjustments</div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: approvedAdjustments > 0 ? '#475569' : '#94a3b8',
                    marginTop: '0.2rem',
                  }}
                >
                  {formatINR(approvedAdjustments)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Non-cash project write-offs
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4 — SIMPLE DIRECT INCOME EXPLANATION */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '0.85rem 1.1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
              <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                Your Direct Income is calculated on the Admin Commission collected from each approved installment. Your Direct Income rate for this order is{' '}
                <strong style={{ color: '#2563eb' }}>{directRate}%</strong>.
              </div>
            </div>

            {/* Collection / Distribution Progress Bar */}
            {expectedDirect > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  Payout Progress: {progressPercent}%
                </span>
                <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: progressPercent >= 100 ? '#10b981' : '#2563eb',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5 — INSTALLMENT HISTORY (MEMBER-FRIENDLY TABLE) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div
              style={{
                padding: '0.85rem 1.25rem',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Receipt size={16} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  Installment Payout History
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '5px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {distributions.length} Record{distributions.length === 1 ? '' : 's'}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Receipt #</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Installment</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Payment Date</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right', color: '#059669' }}>Your Direct Income</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                        No installment payouts recorded for this order yet.
                      </td>
                    </tr>
                  ) : (
                    distributions.map((item, idx) => {
                      const isExpanded = !!expandedReceipts[item.payment_id];
                      return (
                        <tr key={item.payment_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            {/* Primary Row */}
                            <div
                              onClick={() => toggleReceiptDetails(item.payment_id)}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1.5fr 1.3fr 1.3fr 1.5fr 1.2fr 0.9fr',
                                alignItems: 'center',
                                padding: '0.65rem 1rem',
                                background: isExpanded ? '#f8fafc' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = '#fafbfc'; }}
                              onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                #{item.payment_id || item.installment_number || idx + 1}
                              </div>
                              <div style={{ textTransform: 'capitalize', fontWeight: 600, color: '#334155' }}>
                                {item.installment_label || item.installment_type || 'Advance'}
                              </div>
                              <div style={{ color: '#64748b' }}>
                                {formatDate(item.payment_date)}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                {formatINR(item.payment_amount)}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                                {formatINR(item.direct_income_amount)}
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                  }}
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Distributed</span>
                                </span>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleReceiptDetails(item.payment_id);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    background: isExpanded ? '#2563eb' : '#f1f5f9',
                                    color: isExpanded ? '#ffffff' : '#334155',
                                    border: '1px solid',
                                    borderColor: isExpanded ? '#2563eb' : '#cbd5e1',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '5px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Sub-Row (Inline Details Panel) */}
                            {isExpanded && (
                              <div
                                style={{
                                  background: '#f8fafc',
                                  borderTop: '1px dashed #e2e8f0',
                                  borderBottom: '1px solid #e2e8f0',
                                  padding: '0.75rem 1.25rem',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                                    gap: '0.75rem',
                                  }}
                                >
                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Payment Reference / UTR</span>
                                    <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: 600 }}>
                                      {item.reference_no || item.payment_reference || '—'}
                                    </span>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Admin Commission Cut</span>
                                    <strong style={{ color: '#1e40af' }}>
                                      {formatINR(item.admin_commission_cut)}{' '}
                                      <span style={{ color: '#64748b', fontWeight: 500 }}>({item.admin_commission_percent || adminCommissionRate}%)</span>
                                    </strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Direct Income Rate</span>
                                    <strong style={{ color: '#2563eb' }}>
                                      {item.direct_income_percent || directRate}%
                                    </strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Direct Income Credited</span>
                                    <strong style={{ color: '#059669' }}>
                                      {formatINR(item.direct_income_amount)}
                                    </strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Credited Date & Time</span>
                                    <span style={{ color: '#334155' }}>
                                      {item.distributed_at ? formatDateTime(item.distributed_at) : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pending Installments Alert Ribbon (Shown cleanly if pending installments exist) */}
            {pendingInstallments.length > 0 && (
              <div
                style={{
                  padding: '0.65rem 1.25rem',
                  background: '#fffbeb',
                  borderTop: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.78rem',
                  color: '#92400e',
                }}
              >
                <Clock size={14} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  <strong>{pendingInstallments.length} pending installment(s)</strong> awaiting payment collection. Your direct income will be distributed once payments are cleared.
                </span>
              </div>
            )}
          </div>

          {/* SECTION 6 — APPROVED ADJUSTMENTS (SHOW ONLY WHEN RELEVANT) */}
          {dumpRecords.length > 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  Approved Adjustments
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '5px' }}>
                  {dumpRecords.length} Record{dumpRecords.length === 1 ? '' : 's'}
                </span>
              </div>

              <div style={{ padding: '0.65rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                Approved adjustments are non-cash changes to the order. They do not create wallet credits.
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Adjustment Date</th>
                      <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Reason</th>
                      <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right' }}>Order Amount Adjusted</th>
                      <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right', color: '#475569' }}>Direct Income Adjustment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dumpRecords.map((dump, idx) => (
                      <tr key={dump.dump_id || dump.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 1rem', color: '#475569' }}>
                          {formatDate(dump.approved_at)}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', color: '#334155' }}>
                          {dump.dump_reason || dump.reason || 'Uncollectible installment adjustment'}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          {formatINR(dump.dump_amount)}
                        </td>
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                          {formatINR(dump.direct_income_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                background: '#f8fafc',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              No approved adjustments for this order.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MemberDirectIncomeDetailsPage;
