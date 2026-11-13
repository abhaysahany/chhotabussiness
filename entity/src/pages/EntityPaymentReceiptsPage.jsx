import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalePaymentHistory } from '../api/entityService';

function EntityPaymentReceiptsPage() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'advance' | 'balance' | 'full'
  const [toastMessage, setToastMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getSalePaymentHistory({ entity: entityName });
      setPaymentHistory(res?.payments || []);
    } catch (err) {
      console.error('Error fetching payment receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [entityName]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return paymentHistory.filter((p) => {
      const matchSearch =
        (p.invoice_number || p.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.customer_name || p.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference_no || p.referenceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.payment_method || p.paymentMethod || '').toLowerCase().includes(searchQuery.toLowerCase());

      const pType = (p.payment_type || p.paymentType || '').toLowerCase();
      const matchType = typeFilter === 'all' || pType === typeFilter;

      return matchSearch && matchType;
    });
  }, [paymentHistory, searchQuery, typeFilter]);

  // Financial Totals
  const totalCollectedSum = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredPayments]);

  const totalAdminCommissionSum = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.admin_commission_cut ?? curr.adminCommissionCut) || 0), 0);
  }, [filteredPayments]);

  const totalNetEntitySum = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.net_entity_amount ?? curr.netEntityAmount) || 0), 0);
  }, [filteredPayments]);

  return (
    <div className="page-container">
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
      <div className="page-subheader" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #bfdbfe' }}>
            <span>🧾</span> Payment Section • Transaction Receipts & Commission Ledger
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Payment Receipts & Commission Ledger
          </h1>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Real-time audit log of all advance installments, balance payments, released Admin facilitation commissions, and net earnings realized in MySQL.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/entity/payments/receive-balance')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>💳</span> Receive Balance Payment
          </button>
          <button
            type="button"
            onClick={() => navigate('/entity/payments/bank-settlements')}
            style={{ padding: '0.5rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
          >
            🏦 Bank Settlements →
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/receive-balance')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid transparent',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>💳</span> Receive Balance Payments
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/receipts-ledger')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid #636B2F',
            color: '#636B2F',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>🧾</span> Payment Receipts & Commission Ledger ({paymentHistory.length})
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/bank-settlements')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid transparent',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>🏦</span> Bank Settlements & Payouts
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL RECEIPTS LOGGED</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            {filteredPayments.length} Transactions
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Advance & balance installments
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #0f172a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL COLLECTED AMOUNT</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{totalCollectedSum.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Gross client payments
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ADMIN COMMISSION RELEASED</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{totalAdminCommissionSum.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Platform fee on received tranches
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>NET ENTITY CREDITED</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalNetEntitySum.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Retained entity revenue
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, UTR Ref, or Payment Method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Payment Types</option>
            <option value="advance">Advance Payment (Initial)</option>
            <option value="balance">Balance Installment</option>
            <option value="full">Full Settlement</option>
          </select>

          <button
            type="button"
            onClick={loadHistory}
            style={{ padding: '0.6rem 0.95rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Receipts Ledger Table */}
      <div className="content-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#fafaf9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Payment Receipts & Facilitation Commission Ledger
          </h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
            Live Database Ledger
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Receipt # / Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer / Client</th>
                <th style={{ padding: '0.85rem 1rem' }}>Payment Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Method & UTR</th>
                <th style={{ padding: '0.85rem 1rem' }}>Collected Amount</th>
                <th style={{ padding: '0.85rem 1rem' }}>Admin Commission Cut</th>
                <th style={{ padding: '0.85rem 1rem' }}>Net Entity Payout</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading payment receipts history from database...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No payment receipts found matching your search.
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
                  const netEntity = Number(p.net_entity_amount ?? p.netEntityAmount ?? Math.max(0, amount - adminCut));
                  const method = p.payment_method || p.paymentMethod || 'UPI';
                  const refNo = p.reference_no || p.referenceNo || 'N/A';

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
                        {p.customer_name || p.customerName || 'Customer'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {pType === 'balance' ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid #fde68a' }}>
                            💳 Balance Payment
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
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{method}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{refNo}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#dc2626' }}>
                        -₹{adminCut.toLocaleString()} ({p.admin_commission_percent || p.adminCommissionPercent || 15}%)
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a' }}>
                        +₹{netEntity.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          style={{ padding: '0.35rem 0.65rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                        >
                          👁️ View Receipt
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

      {/* Modal: View Receipt Details */}
      {selectedReceipt && (
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
              maxWidth: '520px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  🧾 Payment Receipt Voucher
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Receipt # <strong>RCPT-{selectedReceipt.id}</strong> • Invoice: <strong>{selectedReceipt.invoice_number || selectedReceipt.invoiceNumber}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Entity:</span>
                <strong>{selectedReceipt.entity_name || selectedReceipt.entityName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer:</span>
                <strong>{selectedReceipt.customer_name || selectedReceipt.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Date:</span>
                <span>{selectedReceipt.payment_date || selectedReceipt.paymentDate || selectedReceipt.created_at}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <strong>{selectedReceipt.payment_method || selectedReceipt.paymentMethod}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Reference / UTR:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedReceipt.reference_no || selectedReceipt.referenceNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Gross Installment Received:</span>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>₹{Number(selectedReceipt.amount || 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Admin Facilitation Cut ({selectedReceipt.admin_commission_percent || selectedReceipt.adminCommissionPercent}%):</span>
                <strong style={{ color: '#dc2626' }}>-₹{Number(selectedReceipt.admin_commission_cut ?? selectedReceipt.adminCommissionCut ?? 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                <span style={{ color: '#15803d', fontWeight: 700 }}>Net Entity Credited Share:</span>
                <strong style={{ color: '#16a34a', fontSize: '1.05rem' }}>₹{Number(selectedReceipt.net_entity_amount ?? selectedReceipt.netEntityAmount ?? 0).toLocaleString()}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              style={{ width: '100%', padding: '0.65rem 1rem', background: '#636B2F', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntityPaymentReceiptsPage;
