import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminDirectIncomeOrderDetails } from '../../api/adminIncomeService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminDirectIncomeDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Progressive disclosure states
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);
  const [expandedReceipts, setExpandedReceipts] = useState({});

  const handleBack = () => {
    navigate('/income/direct-orders');
  };

  const toggleReceiptDetails = (paymentId) => {
    setExpandedReceipts((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!orderId) {
        setError('No Order ID specified in URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await getAdminDirectIncomeOrderDetails(orderId);
        if (!isMounted) return;

        if (res && (res.order || res.status === 'success')) {
          setDetails(res);
        } else {
          setError(res?.message || `Failed to retrieve order direct income details for Order #${orderId}.`);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching admin direct income order details:', err);
        setError(
          err?.message ||
          err?.error ||
          'Unable to connect to direct income reporting service or order not found.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId, retryCount]);

  const order = details?.order || {};
  const parentFinancials = details?.parent_order_financials || {};
  const summary = details?.direct_income_summary || details?.financial_summary || {};
  const distributions = details?.distributions || [];
  const pendingInstallments = details?.pending_installments || [];
  const ledgerEntries = details?.ledger_entries || [];
  const approvedDumps = details?.approved_dump_records || details?.dump_records || [];
  const reconciliation = details?.reconciliation || {};

  // Status helper for Direct Income (Card B)
  const getDirectIncomeStatus = () => {
    const diff = Number(reconciliation?.difference ?? reconciliation?.reconciliation_difference ?? 0);
    const recStatus = String(reconciliation?.status || reconciliation?.reconciliation_status || '').toLowerCase();

    if (recStatus === 'mismatch' || diff > 0) {
      return {
        label: 'Reconciliation Required',
        bg: '#fef2f2',
        text: '#dc2626',
        border: '#fecaca',
      };
    }

    const expected = Number(summary?.expected_direct_income ?? summary?.total_expected_amount ?? 0);
    const distributed = Number(summary?.total_distributed_direct_income ?? summary?.total_distributed_amount ?? 0);
    const pending = Number(summary?.pending_direct_income ?? summary?.total_pending_amount ?? 0);

    if (expected > 0 && distributed >= expected && pending <= 0) {
      return {
        label: 'Fully Distributed',
        bg: '#ecfdf5',
        text: '#059669',
        border: '#a7f3d0',
      };
    }

    if (distributed > 0 && pending > 0) {
      return {
        label: 'Partially Distributed',
        bg: '#eff6ff',
        text: '#2563eb',
        border: '#bfdbfe',
      };
    }

    return {
      label: 'Pending',
      bg: '#fffbeb',
      text: '#d97706',
      border: '#fde68a',
    };
  };

  // Reconciliation summary helper for collapsed bar & audit section
  const getReconciliationStatus = () => {
    const isReconciled =
      reconciliation?.reconciliation_status === 'Balanced' ||
      reconciliation?.reconciliation_status === 'Reconciled' ||
      reconciliation?.status === 'Reconciled' ||
      reconciliation?.is_reconciled === true ||
      (reconciliation?.difference ?? reconciliation?.reconciliation_difference) === 0;

    const diff = Number(reconciliation?.difference ?? reconciliation?.reconciliation_difference ?? 0);
    const statusStr = String(reconciliation?.status || reconciliation?.reconciliation_status || '').toLowerCase();

    if (isReconciled && diff === 0 && statusStr !== 'mismatch') {
      return {
        statusText: 'Balanced',
        badgeBg: '#ecfdf5',
        badgeText: '#059669',
        badgeBorder: '#a7f3d0',
        icon: '✓',
      };
    }

    if (statusStr === 'incomplete wallet trace' || statusStr === 'missing ledger reference') {
      return {
        statusText: 'Unresolved',
        badgeBg: '#fffbeb',
        badgeText: '#d97706',
        badgeBorder: '#fde68a',
        icon: '⏳',
      };
    }

    return {
      statusText: 'Variance',
      badgeBg: '#fef2f2',
      badgeText: '#dc2626',
      badgeBorder: '#fecaca',
      icon: '⚠️',
    };
  };

  const directIncomeStatus = getDirectIncomeStatus();
  const recSummary = getReconciliationStatus();

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'inherit', color: '#1e293b' }}>
      {/* 1. TOP BAR / ACTION NAVIGATION */}
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
          <span>←</span> Back to Direct Income
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
            }}
          >
            Read-Only Audit
          </span>
          <button
            type="button"
            onClick={() => navigate('/orders')}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Go to Orders Management"
          >
            View in Orders →
          </button>
        </div>
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
            className="spinner"
            style={{
              width: '32px',
              height: '32px',
              borderColor: '#2563eb transparent transparent transparent',
              margin: '0 auto',
            }}
          />
          <h3 style={{ margin: '0.85rem 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Loading Order Direct Income Details...
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Fetching verified financial records for Order #{orderId}
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
          <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚠️</div>
          <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#991b1b' }}>
            Unable to Load Order Details
          </h3>
          <p style={{ margin: '0 auto 1.25rem auto', fontSize: '0.82rem', color: '#b91c1c', maxWidth: '460px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              style={{
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
              Retry
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

      {/* 4. SUCCESS / CLEAN SIMPLIFIED DETAILS PRESENTATION */}
      {!loading && !error && details && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. SIMPLE ORDER HEADER */}
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
                  Invoice: {order.invoice_number || 'N/A'}
                </span>
              </div>

              {/* Order Status Badge */}
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  background: order.order_status === 'completed' ? '#ecfdf5' : '#eff6ff',
                  color: order.order_status === 'completed' ? '#059669' : '#2563eb',
                  border: `1px solid ${order.order_status === 'completed' ? '#a7f3d0' : '#bfdbfe'}`,
                }}
              >
                {order.order_status || 'Completed'}
              </span>
            </div>

            {/* Compact Details Grid */}
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
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Entity Name</span>
                <strong style={{ color: '#0f172a' }}>{order.entity_name || 'N/A'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Buyer Name / Member ID</span>
                <strong style={{ color: '#0f172a' }}>
                  {order.buyer?.name || 'Customer'}{' '}
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>({order.buyer?.user_code || 'N/A'})</span>
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Beneficiary Sponsor</span>
                <strong style={{ color: '#0f172a' }}>
                  {order.sponsor?.name || 'Sponsor'}{' '}
                  <span style={{ color: '#059669', fontWeight: 600 }}>({order.sponsor?.user_code || 'N/A'})</span>
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Order Date</span>
                <strong style={{ color: '#0f172a' }}>{formatDate(order.order_date)}</strong>
              </div>
            </div>
          </div>

          {/* 2. FINANCIAL SUMMARY — ONLY TWO COMPACT CARDS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Card A — Order Financial Overview */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem 1.25rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1e40af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Order Financial Overview</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #dbeafe',
                  }}
                >
                  {parentFinancials.admin_commission_percent || 15}% Cut
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Total Order Value</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                    ₹{Number(parentFinancials.order_gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Admin Cut Rate</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e40af', marginTop: '0.15rem' }}>
                    ₹{Number(parentFinancials.expected_admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Payment Received</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '0.15rem' }}>
                    ₹{Number(parentFinancials.cash_received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Remaining Balance</div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: Number(parentFinancials.remaining_order_balance || 0) > 0 ? '#d97706' : '#64748b',
                      marginTop: '0.15rem',
                    }}
                  >
                    ₹{Number(parentFinancials.remaining_order_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Card B — Direct Income Overview */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.15rem 1.25rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Direct Income Overview</span>

                {/* Status Indicator */}
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: directIncomeStatus.bg,
                    color: directIncomeStatus.text,
                    border: `1px solid ${directIncomeStatus.border}`,
                  }}
                >
                  {directIncomeStatus.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Expected Direct Income</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                    ₹{Number(summary.expected_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Distributed Direct Income</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '0.15rem' }}>
                    ₹{Number(summary.total_distributed_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Pending Direct Income</div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: Number(summary.pending_direct_income || 0) > 0 ? '#d97706' : '#64748b',
                      marginTop: '0.15rem',
                    }}
                  >
                    ₹{Number(summary.pending_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Approved Dump Amount</div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: Number(summary.approved_dump_direct_income || 0) > 0 ? '#475569' : '#94a3b8',
                      marginTop: '0.15rem',
                    }}
                  >
                    ₹{Number(summary.approved_dump_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. INSTALLMENT HISTORY — SIMPLIFIED TABLE */}
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
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  Installment Distribution History
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Primary collection and direct income installments for this order
                </div>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Receipt #</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>Payment Date</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right' }}>Received Amount</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'right' }}>Direct Income</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.65rem 1rem', fontWeight: 600, textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                        No distributed payment installments recorded for this order yet.
                      </td>
                    </tr>
                  ) : (
                    distributions.map((p, idx) => {
                      const isExpanded = !!expandedReceipts[p.payment_id];
                      return (
                        <tr key={p.payment_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td colSpan={6} style={{ padding: 0 }}>
                            {/* Primary Row */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.5fr 1.2fr 1fr',
                                alignItems: 'center',
                                padding: '0.65rem 1rem',
                                background: isExpanded ? '#f8fafc' : 'transparent',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                #{p.payment_id}
                              </div>
                              <div style={{ color: '#475569' }}>
                                {formatDate(p.payment_date)}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                ₹{Number(p.payment_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                                ₹{Number(p.direct_income_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                  }}
                                >
                                  Distributed
                                </span>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => toggleReceiptDetails(p.payment_id)}
                                  style={{
                                    background: isExpanded ? '#2563eb' : '#f1f5f9',
                                    color: isExpanded ? '#ffffff' : '#334155',
                                    border: '1px solid',
                                    borderColor: isExpanded ? '#2563eb' : '#cbd5e1',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '5px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {isExpanded ? 'Hide ▲' : 'Details ▼'}
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
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '0.75rem',
                                  }}
                                >
                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Installment Type</span>
                                    <strong style={{ color: '#0f172a' }}>{p.installment_label || p.installment_type || 'Advance'}</strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Reference / UTR</span>
                                    <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: 600 }}>{p.reference_no || '—'}</span>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Admin Cut</span>
                                    <strong style={{ color: '#1e40af' }}>
                                      ₹{Number(p.admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                                      <span style={{ color: '#64748b', fontWeight: 500 }}>({p.admin_commission_percent || 15}%)</span>
                                    </strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Beneficiary</span>
                                    <strong style={{ color: '#059669' }}>
                                      {p.beneficiary_sponsor || order.sponsor?.user_code || '—'}
                                    </strong>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Distribution Date</span>
                                    <span style={{ color: '#334155' }}>
                                      {p.distributed_at ? formatDateTime(p.distributed_at) : '—'}
                                    </span>
                                  </div>

                                  <div>
                                    <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>Payment ID</span>
                                    <span style={{ fontFamily: 'monospace', color: '#475569' }}>#{p.payment_id}</span>
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

            {/* Pending Installments Alert (Compact ribbon if pending exist) */}
            {pendingInstallments.length > 0 && (
              <div
                style={{
                  padding: '0.65rem 1.25rem',
                  background: '#fffbeb',
                  borderTop: '1px solid #fde68a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ color: '#92400e', fontWeight: 600 }}>
                  ⏳ {pendingInstallments.length} installment{pendingInstallments.length === 1 ? '' : 's'} awaiting admin allocation in Order Management
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '5px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Allocate in Orders →
                </button>
              </div>
            )}
          </div>

          {/* 4. ADVANCED FINANCIAL AUDIT DETAILS — COLLAPSED BY DEFAULT */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            {/* Collapsible Trigger Bar */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                cursor: 'pointer',
              }}
              onClick={() => setIsAuditExpanded((prev) => !prev)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>🛡️</span>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    Advanced Financial Audit Details
                  </h3>
                </div>
                <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Direct income ledger, wallet trace, 4-way cross-reconciliation, and dump write-offs
                </div>
              </div>

              {/* Compact Reconciliation Summary & Expand Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Reconciliation Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <span style={{ color: '#64748b' }}>Reconciliation:</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '4px',
                      background: recSummary.badgeBg,
                      color: recSummary.badgeText,
                      border: `1px solid ${recSummary.badgeBorder}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>{recSummary.icon}</span> {recSummary.statusText}
                  </span>
                </div>

                {/* Total Verified Amount */}
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Verified:{' '}
                  <strong style={{ color: '#059669' }}>
                    ₹{Number(reconciliation.wallet_distributed || reconciliation.ledger_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAuditExpanded((prev) => !prev);
                  }}
                  style={{
                    background: isAuditExpanded ? '#2563eb' : '#ffffff',
                    color: isAuditExpanded ? '#ffffff' : '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  {isAuditExpanded ? 'Hide Breakdown ▲' : 'View Breakdown ▼'}
                </button>
              </div>
            </div>

            {/* Expanded Detailed Audit Content */}
            {isAuditExpanded && (
              <div style={{ borderTop: '1px solid #e2e8f0', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 4.1 Four-Way Financial Reconciliation Comparison */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                    1. Four-Way Financial Reconciliation Comparison
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '0.65rem',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>1. Summary Total</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                        ₹{Number(reconciliation.summary_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>2. Payments Direct</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                        ₹{Number(reconciliation.payments_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>3. Ledger Direct</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                        ₹{Number(reconciliation.ledger_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>4. Wallet Verified</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                        ₹{Number(reconciliation.wallet_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Difference / Variance</div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: Number(reconciliation.difference || 0) === 0 ? '#059669' : '#dc2626',
                          marginTop: '0.15rem',
                        }}
                      >
                        ₹{Number(reconciliation.difference || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '6px',
                      background: recSummary.badgeBg,
                      color: recSummary.badgeText,
                      border: `1px solid ${recSummary.badgeBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <span>{recSummary.icon}</span>
                    <span>
                      {reconciliation.message || (recSummary.statusText === 'Balanced' ? 'All four financial layers are verified and consistent.' : 'Reconciliation check requires attention.')}
                    </span>
                  </div>
                </div>

                {/* 4.2 Direct Income Ledger & Wallet Credit Trace */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>2. Direct Income Ledger & Wallet Credit Trace</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                      {ledgerEntries.length} Ledger Record{ledgerEntries.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left', minWidth: '850px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Ledger ID</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Payment ID</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Beneficiary</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Source</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Credited</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Wallet Reference</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Trace</th>
                          <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerEntries.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: '#94a3b8' }}>
                              No direct income ledger entries posted for this order.
                            </td>
                          </tr>
                        ) : (
                          ledgerEntries.map((l, idx) => (
                            <tr key={l.ledger_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                                #{l.ledger_id}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#64748b' }}>
                                {l.sale_payment_id ? `#${l.sale_payment_id}` : 'Direct'}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#059669', fontWeight: 600 }}>
                                {l.beneficiary_user_code}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#2563eb' }}>
                                {l.source_user_code || '—'}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                                ₹{Number(l.credited_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontSize: '0.72rem', color: '#475569' }}>
                                {l.wallet_transfer_ref || 'Payment Record #' + (l.sale_payment_id || l.ledger_id)}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center' }}>
                                <span
                                  style={{
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    background: l.trace_status === 'verified' ? '#ecfdf5' : '#fffbeb',
                                    color: l.trace_status === 'verified' ? '#059669' : '#d97706',
                                    border: `1px solid ${l.trace_status === 'verified' ? '#a7f3d0' : '#fde68a'}`,
                                  }}
                                >
                                  {l.trace_status === 'verified' ? 'Verified' : 'Unresolved'}
                                </span>
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#64748b', fontSize: '0.72rem' }}>
                                {formatDateTime(l.timestamp)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4.3 Approved Dump Write-Offs (Section 5: Show only when required) */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    3. Approved Dump Write-Off Details
                  </div>

                  {approvedDumps.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      No approved dump write-offs for this order.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Dump ID</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Reason</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Dump Amount</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Admin Cut</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Direct Written Off</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Approved By</th>
                            <th style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>Approval Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedDumps.map((d, idx) => (
                            <tr key={d.dump_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700 }}>#{d.dump_id}</td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#475569' }}>{d.dump_reason || 'Administrative Write-off'}</td>
                              <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                ₹{Number(d.dump_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#64748b' }}>
                                ₹{Number(d.admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                                ₹{Number(d.direct_income_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#64748b' }}>{d.approved_by || 'Admin'}</td>
                              <td style={{ padding: '0.55rem 0.75rem', color: '#64748b' }}>{formatDate(d.approved_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDirectIncomeDetailsPage;
