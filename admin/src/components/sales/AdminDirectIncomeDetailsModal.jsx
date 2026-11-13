import { useState, useEffect } from 'react';
import { getAdminDirectIncomeOrderDetails } from '../../api/adminIncomeService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminDirectIncomeDetailsModal({ orderId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!orderId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminDirectIncomeOrderDetails(orderId);
        if (!isMounted) return;
        if (res && (res.order || res.status === 'success')) {
          setDetails(res);
        } else {
          setError(res?.message || 'Failed to retrieve order direct income details.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching order direct income details:', err);
        setError(err?.message || err?.error || 'Unable to connect to direct income reporting service.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId, retryCount]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!orderId) return null;

  const order = details?.order || {};
  const parentFinancials = details?.parent_order_financials || {};
  const summary = details?.direct_income_summary || details?.financial_summary || {};
  const distributions = details?.distributions || [];
  const pendingInstallments = details?.pending_installments || [];
  const ledgerEntries = details?.ledger_entries || [];
  const approvedDumps = details?.approved_dump_records || details?.dump_records || [];
  const reconciliation = details?.reconciliation || {};

  const isReconciled =
    reconciliation.reconciliation_status === 'Balanced' ||
    reconciliation.reconciliation_status === 'Reconciled' ||
    reconciliation.status === 'Reconciled' ||
    reconciliation.is_reconciled === true ||
    (reconciliation.difference ?? reconciliation.reconciliation_difference) === 0;

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'reconciled' || s === 'balanced' || s === 'verified') {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Completed' };
    }
    if (s === 'partial' || s === 'incomplete wallet trace') {
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Partial' };
    }
    if (s === 'mismatch' || s === 'discrepancy' || s === 'rejected') {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Discrepancy' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: s || 'Pending' };
  };

  return (
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Order #{order.order_id || orderId} – Direct Income Audit Details
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  border: '1px solid #c7d2fe',
                }}
              >
                READ-ONLY AUDIT
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Invoice: <strong>{order.invoice_number || 'N/A'}</strong> • Date:{' '}
              <strong>{formatDate(order.order_date)}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#ffffff' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div
                className="spinner"
                style={{
                  width: '36px',
                  height: '36px',
                  borderColor: '#2563eb transparent transparent transparent',
                  margin: '0 auto',
                }}
              />
              <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                Fetching comprehensive order financial audit and wallet trace...
              </p>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h4 style={{ margin: 0, color: '#991b1b', fontSize: '1rem', fontWeight: 700 }}>
                Failed to Load Audit Details
              </h4>
              <p style={{ margin: '0.5rem 0 1rem 0', color: '#b91c1c', fontSize: '0.85rem' }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && details && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* SECTION A – ORDER & PARTY INFORMATION */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#475569',
                    letterSpacing: '0.04em',
                    marginBottom: '0.85rem',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '0.4rem',
                  }}
                >
                  Section A: Order & Party Context
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.85rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Offering Purchased:</span>
                    <strong style={{ color: '#0f172a' }}>{order.item_name || 'N/A'}</strong>{' '}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: '#e2e8f0',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {order.item_type || 'Package'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Category:</span>
                    <strong style={{ color: '#0f172a' }}>{order.category || 'General'}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Offering Entity:</span>
                    <strong style={{ color: '#0f172a' }}>{order.entity_name || 'N/A'}</strong>{' '}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {order.entity_type || 'Business'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Buyer (Customer):</span>
                    <strong style={{ color: '#0f172a' }}>{order.buyer?.name || 'Customer'}</strong>
                    <div style={{ color: '#2563eb', fontSize: '0.75rem', fontWeight: 600 }}>
                      ID: {order.buyer?.user_code || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Beneficiary Direct Sponsor:</span>
                    <strong style={{ color: '#0f172a' }}>{order.sponsor?.name || 'Sponsor'}</strong>
                    <div style={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>
                      ID: {order.sponsor?.user_code || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Order Status:</span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        ...getStatusBadge(order.order_status),
                      }}
                    >
                      {order.order_status || 'Completed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B – TWO-PANEL FINANCIAL SUMMARY */}
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#475569',
                    letterSpacing: '0.04em',
                    marginBottom: '0.65rem',
                  }}
                >
                  Section B: Financial Summary Comparison
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Panel 1: Parent Order Context */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '1.1rem',
                      borderTop: '4px solid #3b82f6',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#1e3a8a',
                        textTransform: 'uppercase',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Parent Order Financials
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Gross Order Value:</span>
                        <strong style={{ color: '#0f172a' }}>
                          ₹{Number(parentFinancials.order_gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Admin Commission Rate:</span>
                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                          {parentFinancials.admin_commission_percent || 15}%
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Total Expected Admin Cut:</span>
                        <strong style={{ color: '#1e40af' }}>
                          ₹{Number(parentFinancials.expected_admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '0.4rem' }}>
                        <span style={{ color: '#64748b' }}>Cash Payment Received:</span>
                        <strong style={{ color: '#059669' }}>
                          ₹{Number(parentFinancials.cash_received || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Remaining Order Balance:</span>
                        <strong style={{ color: Number(parentFinancials.remaining_order_balance || 0) > 0 ? '#d97706' : '#64748b' }}>
                          ₹{Number(parentFinancials.remaining_order_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Approved Dump Amount:</span>
                        <strong style={{ color: Number(parentFinancials.approved_dump_amount || 0) > 0 ? '#64748b' : '#94a3b8' }}>
                          ₹{Number(parentFinancials.approved_dump_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Direct Referral Entitlements */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '1.1rem',
                      borderTop: '4px solid #7c3aed',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#5b21b6',
                        textTransform: 'uppercase',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Direct Referral Entitlements (40%)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Expected Direct Income:</span>
                        <strong style={{ color: '#0f172a' }}>
                          ₹{Number(summary.expected_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Received Direct Income:</span>
                        <strong style={{ color: '#059669' }}>
                          ₹{Number(summary.total_distributed_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Pending Direct Income:</span>
                        <strong style={{ color: Number(summary.pending_direct_income || 0) > 0 ? '#d97706' : '#64748b' }}>
                          ₹{Number(summary.pending_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Approved Dump Written Off:</span>
                        <strong style={{ color: Number(summary.approved_dump_direct_income || 0) > 0 ? '#64748b' : '#94a3b8' }}>
                          ₹{Number(summary.approved_dump_direct_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e2e8f0', paddingTop: '0.4rem' }}>
                        <span style={{ color: '#64748b' }}>Installment Distribution Count:</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {summary.distribution_count || 0} Distributions
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Distribution Progress:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '80px',
                              height: '8px',
                              background: '#e2e8f0',
                              borderRadius: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, summary.completion_percentage || 0)}%`,
                                height: '100%',
                                background: summary.completion_percentage >= 100 ? '#059669' : '#3b82f6',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                            {summary.completion_percentage || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C – INSTALLMENT-WISE DISTRIBUTION HISTORY */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#475569',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Section C: Installment Distribution History (sale_payments)
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: '#f1f5f9',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    {distributions.length} Settled Payments
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Receipt #</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Type</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Reference / UTR</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Date</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Payment Amt</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Admin Cut</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#7c3aed' }}>Direct (40%)</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Beneficiary</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            No distributed payments recorded for this order yet.
                          </td>
                        </tr>
                      ) : (
                        distributions.map((p, idx) => (
                          <tr key={p.payment_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: '#0f172a' }}>
                              #{p.payment_id}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textTransform: 'capitalize' }}>
                              {p.installment_label || p.installment_type}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'monospace', color: '#475569' }}>
                              {p.reference_no || '—'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>
                              {formatDate(p.payment_date)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>
                              ₹{Number(p.payment_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#0284c7' }}>
                              ₹{Number(p.admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>
                              ₹{Number(p.direct_income_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#334155' }}>
                              {p.beneficiary_sponsor || order.sponsor?.user_code || '—'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                }}
                              >
                                Distributed
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sub-table: Pending Installments */}
                {pendingInstallments.length > 0 && (
                  <div style={{ padding: '0.85rem 1.1rem', background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: '0.4rem' }}>
                      ⏳ Pending Installments Awaiting Admin Distribution ({pendingInstallments.length})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                      These payments have been received by the platform but commission distribution has not yet been triggered in Order Management.
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION D – DIRECT INCOME LEDGER & WALLET TRACE */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#475569',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Section D: Direct Income Ledger & Wallet Credit Trace
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: '#f1f5f9',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    {ledgerEntries.length} Ledger Records
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Ledger ID</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Payment ID</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Beneficiary Code</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Source Code</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Applied %</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#059669' }}>Credited Amount</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Wallet Reference</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Trace Status</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            No direct income ledger entries posted for this order.
                          </td>
                        </tr>
                      ) : (
                        ledgerEntries.map((l, idx) => (
                          <tr key={l.ledger_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                              #{l.ledger_id}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>
                              {l.sale_payment_id ? `#${l.sale_payment_id}` : 'Direct'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#059669', fontWeight: 600 }}>
                              {l.beneficiary_user_code}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#2563eb' }}>
                              {l.source_user_code || '—'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                              {l.percentage || 40}%
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                              ₹{Number(l.credited_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', fontFamily: 'monospace', fontSize: '0.72rem', color: '#475569' }}>
                              {l.wallet_transfer_ref || 'Payment Record #' + (l.sale_payment_id || l.ledger_id)}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: l.trace_status === 'verified' ? '#ecfdf5' : '#fffbeb',
                                  color: l.trace_status === 'verified' ? '#059669' : '#d97706',
                                  border: `1px solid ${l.trace_status === 'verified' ? '#a7f3d0' : '#fde68a'}`,
                                }}
                              >
                                {l.trace_status === 'verified' ? 'Verified Trace' : 'Unresolved'}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#64748b', fontSize: '0.72rem' }}>
                              {formatDateTime(l.timestamp)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION E – APPROVED DUMP DETAILS */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#475569',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Section E: Approved Dump Write-Offs
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: '#f1f5f9',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      color: '#475569',
                      fontWeight: 600,
                    }}
                  >
                    {approvedDumps.length} Approved Dumps
                  </span>
                </div>

                <div style={{ padding: '0.75rem 1.1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                  ℹ️ <strong>Notice:</strong> Approved Dump represents a non-cash write-off of uncollectible installments and does not generate wallet credit.
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Dump ID</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Reason</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Dump Amount</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Admin Cut</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#dc2626' }}>Direct Portion Written Off</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Approved By</th>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Approval Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedDumps.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '1.25rem', textAlign: 'center', color: '#94a3b8' }}>
                            Zero dump write-offs for this order. All project value remains active or settled.
                          </td>
                        </tr>
                      ) : (
                        approvedDumps.map((d, idx) => (
                          <tr key={d.dump_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>#{d.dump_id}</td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#475569' }}>{d.dump_reason || 'Administrative Write-off'}</td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                              ₹{Number(d.dump_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                              ₹{Number(d.admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                              ₹{Number(d.direct_income_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>{d.approved_by || 'Admin'}</td>
                            <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>{formatDate(d.approved_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION F – FOUR-WAY FINANCIAL RECONCILIATION */}
              <div
                style={{
                  background: isReconciled ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${isReconciled ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '12px',
                  padding: '1.1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isReconciled ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
                    Section F: Four-Way Financial Cross-Reconciliation Check
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: isReconciled ? '#16a34a' : '#dc2626',
                      color: '#ffffff',
                    }}
                  >
                    {isReconciled ? 'BALANCED' : 'DISCREPANCY DETECTED'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>1. Summary Table Total</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(reconciliation.summary_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>2. Payments Direct Total</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(reconciliation.payments_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>3. Ledger Direct Total</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(reconciliation.ledger_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>4. Wallet Verified Credits</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(reconciliation.wallet_distributed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: isReconciled ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{isReconciled ? '✓' : '⚠️'}</span>
                  <span>{reconciliation.message || (isReconciled ? 'All four financial layers are perfectly balanced with ₹0.00 variance.' : `Variance of ₹${reconciliation.difference} detected.`)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            🔒 Strictly read-only audit panel. Commission allocations & distributions are managed in{' '}
            <strong style={{ color: '#0f172a' }}>Order Management</strong>.
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDirectIncomeDetailsModal;
