import React, { useState, useMemo, useEffect } from 'react';
import { getAdminPaymentLedger } from '../../api/adminSalesService';

function AdminPaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'distributed' | 'pending_admin_distribution'
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // 'all' | 'advance' | 'balance' | 'full'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [viewingDistLog, setViewingDistLog] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await getAdminPaymentLedger();
      setPayments(res?.payments || []);
    } catch (e) {
      console.error('Error reading payment ledger from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Multi-Filter Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (p.invoice_number || p.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.customer_name || p.customerName || '').toLowerCase().includes(q) ||
        (p.entity_name || p.entityName || '').toLowerCase().includes(q) ||
        (p.reference_no || p.referenceNo || '').toLowerCase().includes(q) ||
        (p.customer_user_code || p.customerUserCode || '').toLowerCase().includes(q);

      const distStatus = (p.network_distribution_status || p.networkDistributionStatus || 'pending_admin_distribution').toLowerCase();
      const matchStatus = statusFilter === 'all' || distStatus === statusFilter;

      const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
      const matchType = paymentTypeFilter === 'all' || pType === paymentTypeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [payments, searchQuery, statusFilter, paymentTypeFilter]);

  // Aggregate Metrics
  const totalCollectedSum = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [payments]);

  const totalAdminCommissionSum = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (Number(curr.admin_commission_cut ?? curr.adminCommissionCut) || 0), 0);
  }, [payments]);

  const distributedPayments = useMemo(() => {
    return payments.filter((p) => (p.network_distribution_status || p.networkDistributionStatus) === 'distributed');
  }, [payments]);

  const pendingPayments = useMemo(() => {
    return payments.filter((p) => (p.network_distribution_status || p.networkDistributionStatus) === 'pending_admin_distribution');
  }, [payments]);

  const totalDistributedDirectComm = useMemo(() => {
    return distributedPayments.reduce((acc, curr) => acc + (Number(curr.direct_commission ?? curr.directCommission) || 0), 0);
  }, [distributedPayments]);

  const totalDistributedLevelComm = useMemo(() => {
    return distributedPayments.reduce((acc, curr) => acc + (Number(curr.level_commissions_total ?? curr.levelCommissionsTotal) || 0), 0);
  }, [distributedPayments]);

  return (
    <div className="admin-page-container">
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 99999,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            Payment History & Fully Distributed Ledger
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Complete audit ledger of all payments received across entities (Advance & Balance installments), showing fully distributed network commissions and historical records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadPayments}
            style={{
              padding: '0.45rem 0.85rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh History
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL PAYMENTS COLLECTED</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalCollectedSum.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {payments.length} Total Payment Receipts
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>FULLY DISTRIBUTED TRANCHES</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {distributedPayments.length} Settled
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Commissions fully disbursed
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>NETWORK COMMISSIONS PAID</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.35rem' }}>
            ₹{(totalDistributedDirectComm + totalDistributedLevelComm).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Direct: ₹{totalDistributedDirectComm.toLocaleString()} | Level: ₹{totalDistributedLevelComm.toLocaleString()}
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #0f172a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>ADMIN PLATFORM CUT</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{totalAdminCommissionSum.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Realized Platform Revenue
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, Member ID, Entity, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Distribution Statuses</option>
            <option value="distributed">✓ Fully Distributed ({distributedPayments.length})</option>
            <option value="pending_admin_distribution">⏳ Pending Distribution ({pendingPayments.length})</option>
          </select>

          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Payment Types</option>
            <option value="advance">Advance Initial</option>
            <option value="balance">Balance Collection</option>
            <option value="full">Full Settlement</option>
          </select>
        </div>
      </div>

      {/* Payment History Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Receipt # / Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Seller Entity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer / Member</th>
                <th style={{ padding: '0.85rem 1rem' }}>Installment Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Amount Received</th>
                <th style={{ padding: '0.85rem 1rem' }}>Admin Platform Cut</th>
                <th style={{ padding: '0.85rem 1rem' }}>Network Distribution Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Audit / Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading payment history records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No payment records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const receiptId = `RCPT-${p.id || '00'}`;
                  const invoiceNo = p.invoice_number || p.invoiceNumber;
                  const dateStr = p.payment_date || p.paymentDate || p.created_at || 'Recently';
                  const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
                  const amount = Number(p.amount || 0);
                  const adminCut = Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0);
                  const distStatus = (p.network_distribution_status || p.networkDistributionStatus || 'pending_admin_distribution').toLowerCase();
                  const isDistributed = distStatus === 'distributed';

                  return (
                    <tr key={p.id || receiptId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{receiptId}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{dateStr}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                        {invoiceNo}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {p.entity_name || p.entityName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.customer_name || p.customerName}</div>
                        {p.customer_user_code && (
                          <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            {p.customer_user_code}
                          </span>
                        )}
                        {p.sponsor && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Sponsor: <strong>{p.sponsor}</strong>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {pType === 'balance' ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #fde68a' }}>
                            💳 Balance Installment
                          </span>
                        ) : pType === 'full' ? (
                          <span style={{ background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                            ✓ Full Settlement
                          </span>
                        ) : (
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                            🪙 Advance Initial
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a' }}>
                        +₹{adminCut.toLocaleString()} ({p.admin_commission_percent || p.adminCommissionPercent || 15}%)
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isDistributed ? (
                          <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            ✓ Fully Distributed
                          </span>
                        ) : (
                          <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            ⏳ Pending Admin
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {isDistributed ? (
                          <button
                            type="button"
                            onClick={() => setViewingDistLog(p)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            👁️ View Log
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Unsettled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Distribution Breakdown Log */}
      {viewingDistLog && (
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
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  ✓ Network Distribution Audit Breakdown
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Receipt # <strong>RCPT-{viewingDistLog.id}</strong> • Invoice: <strong>{viewingDistLog.invoice_number || viewingDistLog.invoiceNumber}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDistLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Installment Amount Received:</span>
                <strong style={{ color: '#0f172a' }}>₹{Number(viewingDistLog.amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#166534', fontWeight: 700 }}>Admin Platform Fee (100% Budget Pool):</span>
                <strong style={{ color: '#16a34a' }}>₹{Number(viewingDistLog.admin_commission_cut ?? viewingDistLog.adminCommissionCut ?? 0).toLocaleString()} ({viewingDistLog.admin_commission_percent || 15}%)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>1. Direct Sponsor Referral:</span>
                <strong style={{ color: '#2563eb' }}>
                  ₹{Number(viewingDistLog.direct_commission ?? viewingDistLog.directCommission ?? 0).toLocaleString()} ({viewingDistLog.distribution_details?.referralPercent || 40}% of Admin Fee)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>2. Team Level Commissions (10 Levels):</span>
                <strong style={{ color: '#16a34a' }}>
                  ₹{Number(viewingDistLog.level_commissions_total ?? viewingDistLog.levelCommissionsTotal ?? 0).toLocaleString()} ({viewingDistLog.distribution_details?.teamPercent || 30}% of Admin Fee)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>3. Business Points / BV Credited (20 Levels):</span>
                <strong style={{ color: '#7c3aed' }}>
                  {Number(viewingDistLog.team_volume_bv ?? viewingDistLog.teamVolumeBv ?? 0).toLocaleString()} BP / BV ({viewingDistLog.distribution_details?.bpPercent || 20}% of Admin Fee)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Admin Net Retained Margin:</span>
                <strong style={{ color: '#16a34a' }}>
                  ₹{Number(viewingDistLog.distribution_details?.adminNetRetained ?? (Number(viewingDistLog.admin_commission_cut || 0) - (Number(viewingDistLog.direct_commission || 0) + Number(viewingDistLog.level_commissions_total || 0)))).toLocaleString()} ({viewingDistLog.distribution_details?.adminNetRetainedPercent ?? 10}%)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Disbursed At:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{viewingDistLog.distribution_details?.distributedAt || viewingDistLog.distributionDetails?.distributedAt || viewingDistLog.updated_at || 'Completed'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingDistLog(null)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: '#3569a7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentHistoryPage;
