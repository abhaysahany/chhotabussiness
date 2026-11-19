import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminLevelIncomeOrderDetails } from '../../api/adminIncomeService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminLevelIncomeDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleBack = () => {
    navigate('/income/level-orders');
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
        const res = await getAdminLevelIncomeOrderDetails(orderId);
        if (!isMounted) return;

        if (res && (res.audit || res.data || res.status === 'success')) {
          setDetails(res?.audit || res?.data || res);
        } else {
          setError(res?.message || `Failed to retrieve order level income details for Order #${orderId}.`);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching admin level income order details:', err);
        setError(
          err?.message ||
          err?.error ||
          'Unable to connect to level income reporting service or order not found.'
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

  const orderIdResolved = details?.order_id || orderId;
  const invoiceNumber = details?.invoice_number || 'N/A';
  const entity = details?.entity || {};
  const buyer = details?.buyer || {};
  const sponsor = details?.sponsor || {};
  const financials = details?.financials || {};
  const levels = details?.levels || [];
  const installments = details?.installments || [];

  return (
    <div className="admin-page-container pro-orders-container">
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            padding: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Level Income Records
        </button>

        <div className="page-header pro-orders-header" style={{ margin: 0 }}>
          <div>
            <h1 className="page-title pro-orders-header-title" style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
              Level Income Order Audit
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.92rem' }}>
              Comprehensive multi-tier audit for Order #{orderIdResolved} &bull; Invoice: <strong>{invoiceNumber}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: financials.reconciliation_status === 'Reconciled' ? '#dcfce7' : '#fef3c7',
                color: financials.reconciliation_status === 'Reconciled' ? '#166534' : '#b45309',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {financials.reconciliation_status || 'Audited'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div
            style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid #ede9fe',
              borderTopColor: '#7c3aed',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ marginTop: '1.25rem', color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
            Fetching order multi-level audit ledger...
          </p>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            color: '#991b1b',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 0.75rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Unable to load level audit</h3>
          <p style={{ margin: '0 0 1.25rem 0', color: '#b91c1c' }}>{error}</p>
          <button
            onClick={() => setRetryCount((prev) => prev + 1)}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry Audit Retrieval
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Section: Overview Cards */}
          <div className="pro-income-details-grid">
            {/* Entity & Order Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Business Entity & Order
              </span>
              <div style={{ marginTop: '0.4rem', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                {entity.name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                Type: <strong style={{ textTransform: 'capitalize' }}>{entity.type || 'business'}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                Order Date: <strong>{formatDate(details?.date || details?.created_at)}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                Invoice: <strong>{invoiceNumber}</strong>
              </div>
            </div>

            {/* Buyer Profile */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Buyer / Source Member
              </span>
              <div style={{ marginTop: '0.4rem', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                {buyer.name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                Member ID: <strong>{buyer.user_code || 'N/A'}</strong>
              </div>
              {buyer.phone && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Phone: <strong>{buyer.phone}</strong>
                </div>
              )}
              {buyer.email && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Email: {buyer.email}
                </div>
              )}
            </div>

            {/* Direct Sponsor Profile */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Direct Sponsor (Level 1)
              </span>
              <div style={{ marginTop: '0.4rem', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                {sponsor.name || 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                Sponsor ID: <strong>{sponsor.user_code || 'N/A'}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8b5cf6', marginTop: '0.35rem', fontWeight: 700 }}>
                Eligible for 40% Direct Commission
              </div>
            </div>

            {/* Reconciliation Health */}
            <div
              style={{
                backgroundColor: financials.reconciliation_status === 'Reconciled' ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${financials.reconciliation_status === 'Reconciled' ? '#bbf7d0' : '#fde68a'}`,
                borderRadius: '14px',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: financials.reconciliation_status === 'Reconciled' ? '#166534' : '#b45309', textTransform: 'uppercase' }}>
                Platform Reconciliation
              </span>
              <div style={{ marginTop: '0.4rem', fontWeight: 800, fontSize: '1.15rem', color: financials.reconciliation_status === 'Reconciled' ? '#15803d' : '#d97706', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {financials.reconciliation_status || 'Reconciled'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.35rem' }}>
                Variance: <strong>₹{Number(financials.reconciliation_difference || 0).toFixed(2)}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                Level Summary & Installment Payouts match.
              </div>
            </div>
          </div>

          {/* Financial Breakdown KPI Cards */}
          <div className="pro-income-financials-5col">
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Order Gross Value</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                ₹{Number(financials.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Admin Platform Cut</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.35rem' }}>
                ₹{Number(financials.admin_commission_cut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Expected Level Total</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.35rem' }}>
                ₹{Number(financials.total_expected_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Distributed to Levels</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
                ₹{Number(financials.total_distributed_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Pending Balance Due</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: financials.total_pending_amount > 0 ? '#f59e0b' : '#64748b', marginTop: '0.35rem' }}>
                ₹{Number(financials.total_pending_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Section 1: Multi-Level Allocation Table */}
          <div className="pro-orders-table-wrapper table-responsive" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '1.1rem 1.5rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Multi-Level Earnings Allocation (total_level_incomes)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Breakdown across upline levels (Level 2 to Level 5) for this transaction.
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  backgroundColor: '#ede9fe',
                  color: '#6d28d9',
                }}
              >
                {levels.length} Upline Beneficiaries
              </span>
            </div>

            <div className="table-responsive-inner" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="pro-orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', minWidth: '780px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Level Tier</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Beneficiary Upline</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Total Expected</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Paid (Distributed)</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Pending Balance</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Dump</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        No level income records found for this order.
                      </td>
                    </tr>
                  ) : (
                    levels.map((lvl) => (
                      <tr key={lvl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              backgroundColor: '#ede9fe',
                              color: '#6d28d9',
                            }}
                          >
                            {lvl.level_label || `Level ${lvl.level}`}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{lvl.beneficiary_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Member ID: <strong>{lvl.user_code}</strong>
                            {lvl.beneficiary_phone && ` • ${lvl.beneficiary_phone}`}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(lvl.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                          ₹{Number(lvl.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 700, color: lvl.balance_amount > 0 ? '#f59e0b' : '#64748b' }}>
                          ₹{Number(lvl.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                          ₹{Number(lvl.dump_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
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

          {/* Section 2: Installment Distribution History */}
          <div className="pro-orders-table-wrapper table-responsive" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
            <div
              style={{
                padding: '1.1rem 1.5rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Installment Payout Ledger (level_incomes)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Individual distribution events triggered per advance or balance milestone payment.
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                }}
              >
                {installments.length} Distribution Installments
              </span>
            </div>

            <div className="table-responsive-inner" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="pro-orders-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', minWidth: '780px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Record ID</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Payment Milestone</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Level Tier</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Beneficiary</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}>Execution Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        No installment payouts recorded yet for this order.
                      </td>
                    </tr>
                  ) : (
                    installments.map((inst) => (
                      <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b' }}>
                          #{inst.id} {inst.payment_id ? `(Pay Receipt #${inst.payment_id})` : ''}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: inst.payment_type === 'advance' ? '#dbeafe' : '#fef3c7',
                              color: inst.payment_type === 'advance' ? '#1d4ed8' : '#b45309',
                            }}
                          >
                            {inst.payment_type}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
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
                            {inst.level_label || `Level ${inst.level}`}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{inst.beneficiary_name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Member ID: {inst.user_code}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                          +₹{Number(inst.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontSize: '0.82rem' }}>
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
  );
}

export default AdminLevelIncomeDetailsPage;
