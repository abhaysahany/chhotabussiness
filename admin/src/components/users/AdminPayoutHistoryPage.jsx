import React, { useState, useEffect, useMemo } from 'react';
import { getAllPayouts } from '../../api/adminPayoutService';

function AdminPayoutHistoryPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'rejected' | 'pending'
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewingVoucher, setViewingVoucher] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllPayouts();
      setPayouts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (p.payoutCode || '').toLowerCase().includes(q) ||
        (p.userCode || '').toLowerCase().includes(q) ||
        (p.memberName || '').toLowerCase().includes(q) ||
        (p.utrNumber || '').toLowerCase().includes(q) ||
        (p.sponsor || '').toLowerCase().includes(q) ||
        (p.bankDetails?.bankName || '').toLowerCase().includes(q) ||
        (p.bankDetails?.accountNumber || '').toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [payouts, searchQuery, statusFilter, methodFilter]);

  // Aggregate Metrics
  const totalSettledGross = useMemo(() => {
    return payouts
      .filter((p) => p.status === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.requestedAmount) || 0), 0);
  }, [payouts]);

  const totalSettledNet = useMemo(() => {
    return payouts
      .filter((p) => p.status === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.netPayableAmount) || 0), 0);
  }, [payouts]);

  const totalTdsCollected = useMemo(() => {
    return payouts
      .filter((p) => p.status === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.tdsDeduction) || 0), 0);
  }, [payouts]);

  const completedCount = useMemo(() => {
    return payouts.filter((p) => p.status === 'completed').length;
  }, [payouts]);

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f0fdf4', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #bbf7d0' }}>
            <span>📜</span> Historical Audit Ledger • User Settlements
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            User Payout History
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Complete audit trail of all disbursed member payouts, statutory TDS certificates, bank advice UTRs, and settlement records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '0.5rem 0.9rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL DISBURSED (NET)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalSettledNet.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Credited to Member Bank Accounts
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>GROSS SETTLEMENT VALUE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalSettledGross.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {completedCount} Payout Transactions
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TDS WITHHELD (SEC 194H)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.35rem' }}>
            ₹{totalTdsCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            5% Statutory Tax Reserve
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL LEDGER RECORDS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0891b2', marginTop: '0.35rem' }}>
            {payouts.length} Entries
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Completed, Pending, & Rejected
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search history by Payout Code, Member Code, Name, Bank, UTR, or Account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">✓ Completed & Settled</option>
            <option value="pending">⏳ Pending Review</option>
            <option value="rejected">✕ Rejected</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Payment Methods</option>
            <option value="IMPS Direct Bank Transfer">IMPS Direct Bank Transfer</option>
            <option value="NEFT Transfer">NEFT Transfer</option>
            <option value="UPI Instant Payout">UPI Instant Payout</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Payout Code / Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Member Info</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bank / Account Details</th>
                <th style={{ padding: '0.85rem 1rem' }}>Gross Requested</th>
                <th style={{ padding: '0.85rem 1rem' }}>TDS (5%)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Net Disbursed</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status / UTR</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Audit Voucher</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading payout settlement history...
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No payout records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => {
                  const isCompleted = p.status === 'completed';
                  const isRejected = p.status === 'rejected';

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.payoutCode}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.requestDate}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.memberName}</div>
                        <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {p.userCode}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          PAN: <strong>{p.bankDetails?.panNumber || 'N/A'}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.bankDetails?.bankName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          A/C: {p.bankDetails?.accountNumber} • IFSC: {p.bankDetails?.ifscCode}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {p.paymentMethod}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(p.requestedAmount).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#dc2626' }}>
                        -₹{Number(p.tdsDeduction).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: isCompleted ? '#16a34a' : isRejected ? '#94a3b8' : '#2563eb', fontSize: '0.95rem' }}>
                        ₹{Number(p.netPayableAmount).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isCompleted ? (
                          <div>
                            <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }}>
                              ✓ Settled
                            </span>
                            {p.utrNumber && (
                              <div style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 700, marginTop: '0.2rem' }}>
                                {p.utrNumber}
                              </div>
                            )}
                          </div>
                        ) : isRejected ? (
                          <div>
                            <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                              ✕ Rejected
                            </span>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {p.adminNotes || 'Funds returned'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setViewingVoucher(p)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          👁️ Voucher
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Payout Voucher */}
      {viewingVoucher && (
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
              maxWidth: '560px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  📜 Member Payout Advice Voucher
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Advice #{' '}
                  <strong>{viewingVoucher.payoutCode}</strong> • UTR: <strong>{viewingVoucher.utrNumber || 'N/A'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingVoucher(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Beneficiary Member:</span>
                <strong>{viewingVoucher.memberName} ({viewingVoucher.userCode})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>PAN Number:</span>
                <strong>{viewingVoucher.bankDetails?.panNumber || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Bank & A/C Number:</span>
                <strong>{viewingVoucher.bankDetails?.bankName} ({viewingVoucher.bankDetails?.accountNumber})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>IFSC Code:</span>
                <strong>{viewingVoucher.bankDetails?.ifscCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Gross Commission Withdrawal:</span>
                <strong style={{ color: '#0f172a' }}>₹{Number(viewingVoucher.requestedAmount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#dc2626' }}>TDS Withholding (5% Section 194H):</span>
                <strong style={{ color: '#dc2626' }}>-₹{Number(viewingVoucher.tdsDeduction).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', fontSize: '1rem' }}>
                <span style={{ color: '#166534', fontWeight: 800 }}>Net Disbursed to Bank:</span>
                <strong style={{ color: '#16a34a', fontWeight: 900 }}>₹{Number(viewingVoucher.netPayableAmount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Settlement Date:</span>
                <span>{viewingVoucher.processedDate || viewingVoucher.requestDate}</span>
              </div>
              {viewingVoucher.adminNotes && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Audit Remarks:</span>
                  <span style={{ color: '#475569', fontStyle: 'italic' }}>{viewingVoucher.adminNotes}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingVoucher(null)}
              style={{ width: '100%', padding: '0.65rem 1rem', background: '#3569a7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Close Voucher
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayoutHistoryPage;
