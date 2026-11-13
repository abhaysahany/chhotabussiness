import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Layers,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { getUserDirectIncomeOrderDetails } from '../../api/userIncomeService';
import { formatINR } from '../../utils/formatters';
import { formatDateTime } from '../../utils/timezone';

function OrderDirectIncomeDetailsModal({ orderId, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleRetry = () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    getUserDirectIncomeOrderDetails(orderId)
      .then((res) => {
        if (res && res.status === 'success') {
          setData(res);
        } else {
          setError(res?.message || `Failed to load details for Order #${orderId}`);
        }
      })
      .catch((err) => {
        setError(err?.message || 'Error communicating with server.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;

    if (isOpen && orderId) {
      const execute = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await getUserDirectIncomeOrderDetails(orderId);
          if (active) {
            if (res && res.status === 'success') {
              setData(res);
            } else {
              setError(res?.message || `Failed to load details for Order #${orderId}`);
            }
            setLoading(false);
          }
        } catch (err) {
          if (active) {
            setError(err?.message || 'Error communicating with server.');
            setLoading(false);
          }
        }
      };

      // Wrap in microtask to avoid synchronous setState warning
      Promise.resolve().then(execute);
    }

    return () => {
      active = false;
    };
  }, [isOpen, orderId]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const order = data?.order || {};
  const distributions = data?.distributions || [];
  const pendingInstallments = data?.pending_installments || [];
  const dumpRecords = data?.dump_records || [];

  const invoiceNumber = order.invoice_number || order.invoiceNumber || `ORD-${orderId}`;
  const itemName = order.item_name || order.itemName || 'Custom Product / Service';
  const category = order.category || 'General';
  const customerName = order.customer_name || order.customerName || 'Customer';
  const customerUserCode = order.customer_user_code || order.customerUserCode || '—';
  const orderDate = order.order_date || order.orderDate;

  // Order Financial Metrics
  const orderGross = Number(order.order_gross_amount ?? order.orderGrossAmount ?? 0);
  const advanceReceived = Number(order.total_advance_received ?? order.totalAdvanceReceived ?? 0);
  const balanceDue = Number(order.balance_due ?? order.balanceDue ?? 0);
  const adminCommissionRate = Number(order.admin_commission_percent ?? order.adminCommissionPercent ?? 0);

  // Direct Income Metrics
  const expectedDirect = Number(order.expected_direct_income ?? order.expectedDirectIncome ?? 0);
  const receivedDirect = Number(order.received_direct_income ?? order.receivedDirectIncome ?? 0);
  const pendingDirect = Number(order.pending_direct_income ?? order.pendingDirectIncome ?? 0);
  const dumpDirect = Number(order.dump_direct_income ?? order.dumpDirectIncome ?? 0);
  const distributionStatus = (order.distribution_status || order.distributionStatus || 'pending').toLowerCase();

  // Status Badge Configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: <CheckCircle2 size={13} />,
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#bbf7d0',
        };
      case 'partial':
        return {
          label: 'Partial Distribution',
          icon: <Clock size={13} />,
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
        };
      case 'pending':
      default:
        return {
          label: 'Pending Distribution',
          icon: <AlertCircle size={13} />,
          bg: '#fefce8',
          color: '#a16207',
          border: '#fef08a',
        };
    }
  };

  const statusBadge = getStatusBadge(distributionStatus);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#fafbfc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                Order #{orderId}
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {invoiceNumber}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  border: `1px solid ${statusBadge.border}`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {statusBadge.icon}
                <span>{statusBadge.label}</span>
              </span>
            </div>
            <h2 style={{ margin: '0.4rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              {itemName}
            </h2>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '0.35rem',
                fontSize: '0.8rem',
                color: '#64748b',
                flexWrap: 'wrap',
              }}
            >
              <span>Category: <strong style={{ color: '#334155' }}>{category}</strong></span>
              <span>•</span>
              <span>Buyer: <strong style={{ color: '#334155' }}>{customerName}</strong> ({customerUserCode})</span>
              {orderDate && (
                <>
                  <span>•</span>
                  <span>Date: <strong style={{ color: '#334155' }}>{formatDateTime(orderDate, { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            title="Close Details Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
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
              <div style={{ marginTop: '0.75rem', fontWeight: 600 }}>Loading installment distribution details...</div>
            </div>
          ) : error ? (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '1.25rem',
                textAlign: 'center',
                color: '#b91c1c',
              }}
            >
              <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Failed to Load Order Details</div>
              <p style={{ margin: '0.35rem 0 0.85rem 0', fontSize: '0.85rem' }}>{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <RotateCcw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>
              {/* Financial Summary Cards: Order Level vs Direct Income Level */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                {/* Panel 1: Order Project Value & Cash Collection */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '1.2rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <Building2 size={15} color="#64748b" />
                    <span>Parent Order Financial Overview</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Project Value</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {formatINR(orderGross)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Admin Cut Rate</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {adminCommissionRate}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#166534' }}>Cash Received</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                        {formatINR(advanceReceived)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: balanceDue > 0 ? '#b45309' : '#64748b' }}>
                        Remaining Balance
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: balanceDue > 0 ? '#a16207' : '#64748b' }}>
                        {formatINR(balanceDue)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #e2e8f0', fontSize: '0.7rem', color: '#94a3b8' }}>
                    ℹ️ Project value is the total customer contract. Direct Income is calculated exclusively from the verified Admin Cut.
                  </div>
                </div>

                {/* Panel 2: Direct Referral Income Entitlement */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #bfdbfe',
                    padding: '1.2rem',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#1d4ed8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    <Layers size={15} color="#2563eb" />
                    <span>Your Direct Referral Entitlements</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Expected Direct Income</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {formatINR(expectedDirect)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Total Received</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                        {formatINR(receivedDirect)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: pendingDirect > 0 ? '#b45309' : '#64748b' }}>
                        Pending Direct
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: pendingDirect > 0 ? '#a16207' : '#64748b' }}>
                        {formatINR(pendingDirect)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: dumpDirect > 0 ? '#7c3aed' : '#64748b' }}>
                        Approved Dump
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: dumpDirect > 0 ? '#7c3aed' : '#64748b' }}>
                        {formatINR(dumpDirect)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #eff6ff', fontSize: '0.7rem', color: '#64748b' }}>
                    ✓ 40% Direct Income formula: Expected ({formatINR(expectedDirect)}) = Received ({formatINR(receivedDirect)}) + Pending ({formatINR(pendingDirect)}) + Dump ({formatINR(dumpDirect)})
                  </div>
                </div>
              </div>

              {/* Installment-wise Distributions Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Installment Distribution History
                    </h3>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Individual payment receipts credited to your Direct Income balance
                    </p>
                  </div>
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {distributions.length} Distribution{distributions.length === 1 ? '' : 's'} Processed
                  </span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    overflowX: 'auto',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 0.9rem', width: '50px' }}>#</th>
                        <th style={{ padding: '0.75rem 0.9rem' }}>Installment</th>
                        <th style={{ padding: '0.75rem 0.9rem' }}>Reference / UTR</th>
                        <th style={{ padding: '0.75rem 0.9rem' }}>Payment Date</th>
                        <th style={{ padding: '0.75rem 0.9rem', textAlign: 'right' }}>Collected Amount</th>
                        <th style={{ padding: '0.75rem 0.9rem', textAlign: 'right' }}>Admin Cut</th>
                        <th style={{ padding: '0.75rem 0.9rem', textAlign: 'right' }}>Direct Income (40%)</th>
                        <th style={{ padding: '0.75rem 0.9rem', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '0.75rem 0.9rem' }}>Distributed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>⏳</div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>No Installment Distributions Yet</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              When an installment is recorded and allocated by Admin, individual distribution entries will appear here.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        distributions.map((d, index) => (
                          <tr
                            key={d.id || d.payment_id || index}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                            }}
                          >
                            <td style={{ padding: '0.75rem 0.9rem', fontWeight: 700, color: '#64748b' }}>
                              #{index + 1}
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                {d.installment_label || d.installmentLabel || `Installment #${index + 1}`}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                Method: {d.payment_method || d.paymentMethod || 'UPI / Bank'}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem' }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.74rem',
                                  background: '#f1f5f9',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  color: '#334155',
                                  fontWeight: 600,
                                }}
                              >
                                {d.reference_no || d.referenceNo || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem', color: '#475569', whiteSpace: 'nowrap' }}>
                              {d.payment_date || d.paymentDate ? formatDateTime(d.payment_date || d.paymentDate, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              {formatINR(d.payment_amount ?? d.paymentAmount ?? 0)}
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                              {formatINR(d.admin_commission_cut ?? d.adminCommissionCut ?? 0)}
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>
                                ({d.admin_commission_percent ?? d.adminCommissionPercent ?? 0}%)
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                              {formatINR(d.direct_income_amount ?? d.directIncomeAmount ?? 0)}
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                ✓ Distributed
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.9rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {d.distributed_at || d.distributedAt ? formatDateTime(d.distributed_at || d.distributedAt) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Installments Section (if any) */}
              {pendingInstallments.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Clock size={16} color="#d97706" />
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#b45309' }}>
                      Payments Received Awaiting Admin Distribution ({pendingInstallments.length})
                    </h4>
                  </div>
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '10px',
                      overflowX: 'auto',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#fef3c7', color: '#92400e', textAlign: 'left' }}>
                          <th style={{ padding: '0.65rem 0.85rem' }}>Receipt ID</th>
                          <th style={{ padding: '0.65rem 0.85rem' }}>Reference / UTR</th>
                          <th style={{ padding: '0.65rem 0.85rem' }}>Payment Date</th>
                          <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Collected Amount</th>
                          <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Admin Cut</th>
                          <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingInstallments.map((p) => (
                          <tr key={p.id || p.payment_id} style={{ borderBottom: '1px solid #fef9c3' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#78350f' }}>
                              #{p.id || p.payment_id}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'monospace' }}>
                              {p.reference_no || 'N/A'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#78350f' }}>
                              {p.payment_date ? formatDateTime(p.payment_date, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#78350f' }}>
                              {formatINR(p.amount || 0)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#78350f' }}>
                              {formatINR(p.admin_commission_cut || 0)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                ⏳ Pending Allocation
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Approved Dump Records Section (if any) */}
              {dumpRecords.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <ShieldAlert size={16} color="#7c3aed" />
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#6b21a8' }}>
                      Approved Dump Records ({dumpRecords.length})
                    </h4>
                  </div>
                  <div
                    style={{
                      background: '#faf5ff',
                      border: '1px solid #e9d5ff',
                      borderRadius: '10px',
                      overflowX: 'auto',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f3e8ff', color: '#6b21a8', textAlign: 'left' }}>
                          <th style={{ padding: '0.65rem 0.85rem' }}>Dump ID</th>
                          <th style={{ padding: '0.65rem 0.85rem' }}>Reason</th>
                          <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Write-off Amount</th>
                          <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Admin Cut Portion</th>
                          <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Direct Income Written-Off</th>
                          <th style={{ padding: '0.65rem 0.85rem' }}>Approval Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dumpRecords.map((d) => (
                          <tr key={d.id || d.dump_id} style={{ borderBottom: '1px solid #f5d0fe' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#581c87' }}>
                              #{d.id || d.dump_id}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#581c87' }}>
                              {d.dump_reason || d.dumpReason || 'Contract adjustment / cancellation'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#581c87' }}>
                              {formatINR(d.dump_amount ?? d.dumpAmount ?? 0)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#581c87' }}>
                              {formatINR(d.admin_commission_cut ?? d.adminCommissionCut ?? 0)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}>
                              {formatINR(d.direct_income_amount ?? d.directIncomeAmount ?? 0)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#6b21a8' }}>
                              {d.approved_at || d.approvedAt ? formatDateTime(d.approved_at || d.approvedAt) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7c3aed', marginTop: '0.4rem', paddingLeft: '0.25rem' }}>
                    * Approved dump amounts represent bad debt or canceled balance write-offs. They reduce pending entitlements and do not generate cash wallet credits.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#fafbfc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Direct Income reflects 40% Admin Cut allocation per approved payment receipt.
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.35rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDirectIncomeDetailsModal;
