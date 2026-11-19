import { useState, useEffect } from 'react';
import { getAdminLevelIncomeOrderDetails } from '../../api/adminIncomeService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminLevelIncomeDetailsModal({ orderId, onClose }) {
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
        const res = await getAdminLevelIncomeOrderDetails(orderId);
        if (!isMounted) return;
        if (res && (res.audit || res.data || res.status === 'success')) {
          setDetails(res?.audit || res?.data || res);
        } else {
          setError(res?.message || 'Failed to retrieve order level income details.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching order level income details:', err);
        setError(err?.message || err?.error || 'Unable to connect to level income reporting service.');
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

  const orderIdResolved = details?.order_id || orderId;
  const invoiceNumber = details?.invoice_number || 'N/A';
  const entity = details?.entity || {};
  const buyer = details?.buyer || {};
  const sponsor = details?.sponsor || {};
  const financials = details?.financials || {};
  const levels = details?.levels || [];
  const installments = details?.installments || [];

  return (
    <div
      className="pro-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="pro-modal-container"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                Level Income Multi-Tier Audit
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Order #{orderIdResolved} &bull; Invoice: <strong>{invoiceNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            title="Close (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '36px',
                  height: '36px',
                  border: '3px solid #ede9fe',
                  borderTopColor: '#7c3aed',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                Loading multi-level audit ledger...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '1.25rem',
                color: '#991b1b',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600 }}>{error}</p>
              <button
                onClick={() => setRetryCount((prev) => prev + 1)}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Section 1: Top Overview Cards */}
              <div
                className="pro-income-details-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Order & Entity Card */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Entity & Order
                  </span>
                  <div style={{ marginTop: '0.4rem', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {entity.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Type: <span style={{ textTransform: 'capitalize' }}>{entity.type || 'business'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Order Date: {formatDate(details?.date || details?.created_at)}
                  </div>
                </div>

                {/* Buyer Card */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Buyer (Source Member)
                  </span>
                  <div style={{ marginTop: '0.4rem', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {buyer.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Code: <strong>{buyer.user_code || 'N/A'}</strong>
                  </div>
                  {buyer.phone && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Phone: {buyer.phone}
                    </div>
                  )}
                </div>

                {/* Direct Sponsor Card */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Direct Sponsor (L1)
                  </span>
                  <div style={{ marginTop: '0.4rem', fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {sponsor.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Code: <strong>{sponsor.user_code || 'N/A'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.2rem', fontWeight: 600 }}>
                    Earns Direct Commission
                  </div>
                </div>

                {/* Financial Health / Reconciliation */}
                <div
                  style={{
                    backgroundColor: financials.reconciliation_status === 'Reconciled' ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${financials.reconciliation_status === 'Reconciled' ? '#bbf7d0' : '#fde68a'}`,
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: financials.reconciliation_status === 'Reconciled' ? '#166534' : '#b45309', textTransform: 'uppercase' }}>
                    Reconciliation Status
                  </span>
                  <div style={{ marginTop: '0.4rem', fontWeight: 700, fontSize: '1rem', color: financials.reconciliation_status === 'Reconciled' ? '#15803d' : '#d97706', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {financials.reconciliation_status || 'Reconciled'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Variance: ₹{Number(financials.reconciliation_difference || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Section 2: Financial KPI Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Order Gross</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                    ₹{Number(financials.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Admin Cut</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
                    ₹{Number(financials.admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Expected Level Total</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
                    ₹{Number(financials.total_expected_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Paid / Distributed</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                    ₹{Number(financials.total_distributed_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Pending Balance</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                    ₹{Number(financials.total_pending_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Section 3: Multi-Level Breakdown Table */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7c3aed' }} />
                    Multi-Level Allocation Breakdown (total_level_incomes)
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    {levels.length} Level Beneficiaries
                  </span>
                </div>

                <div className="table-responsive-inner" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Level Tier</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Beneficiary Member</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700, textAlign: 'right' }}>Total Expected</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700, textAlign: 'right' }}>Paid (Distributed)</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700, textAlign: 'right' }}>Balance Due</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700, textAlign: 'right' }}>Dump</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700, textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levels.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                            No level income records found for this order.
                          </td>
                        </tr>
                      ) : (
                        levels.map((lvl) => (
                          <tr key={lvl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  backgroundColor: '#ede9fe',
                                  color: '#6d28d9',
                                }}
                              >
                                {lvl.level_label || `Level ${lvl.level}`}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{lvl.beneficiary_name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Code: <strong>{lvl.user_code}</strong>
                                {lvl.beneficiary_phone && ` • ${lvl.beneficiary_phone}`}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              ₹{Number(lvl.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                              ₹{Number(lvl.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: lvl.balance_amount > 0 ? '#f59e0b' : '#64748b' }}>
                              ₹{Number(lvl.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                              ₹{Number(lvl.dump_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textTransform: 'capitalize',
                                  backgroundColor:
                                    lvl.status === 'completed'
                                      ? '#dcfce7'
                                      : lvl.status === 'partial'
                                      ? '#fef3c7'
                                      : '#fee2e2',
                                  color:
                                    lvl.status === 'completed'
                                      ? '#166534'
                                      : lvl.status === 'partial'
                                      ? '#b45309'
                                      : '#991b1b',
                                }}
                              >
                                {lvl.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Installment Distribution History */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '0.9rem 1.25rem',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Installment Distribution History (level_incomes)
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    {installments.length} Distribution Records
                  </span>
                </div>

                <div className="table-responsive-inner" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Record #</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Payment Type</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Level Tier</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Beneficiary</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700, textAlign: 'right' }}>Amount Payout</th>
                        <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
                            No installment payouts recorded yet for this order.
                          </td>
                        </tr>
                      ) : (
                        installments.map((inst) => (
                          <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                              #{inst.id} {inst.payment_id ? `(Pay #${inst.payment_id})` : ''}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  backgroundColor: inst.payment_type === 'advance' ? '#dbeafe' : '#fef3c7',
                                  color: inst.payment_type === 'advance' ? '#1d4ed8' : '#b45309',
                                }}
                              >
                                {inst.payment_type}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: '#ede9fe',
                                  color: '#6d28d9',
                                }}
                              >
                                {inst.level_label || `Level ${inst.level}`}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{inst.beneficiary_name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {inst.user_code}</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                              +₹{Number(inst.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                              {formatDateTime(inst.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              color: '#475569',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLevelIncomeDetailsModal;
