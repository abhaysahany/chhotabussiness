import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntitySales, receiveBalancePayment } from '../api/entityService';

function EntityReceiveBalancePage() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Balance Payment Modal State
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI / PhonePe');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const salesRes = await getEntitySales(entityName);
      setSalesList(salesRes || []);
    } catch (err) {
      console.error('Error fetching receivables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [entityName]);

  // Sales with outstanding balance
  const pendingBalanceSales = useMemo(() => {
    return salesList.filter((s) => {
      const balance = Number(s.balanceDue ?? s.balance_due ?? 0);
      return balance > 0;
    });
  }, [salesList]);

  // Filtered sales
  const filteredPendingSales = useMemo(() => {
    return pendingBalanceSales.filter((s) => {
      const invoiceNo = (s.invoiceNumber || s.invoice_number || s.id || '').toLowerCase();
      const customer = (s.customerName || s.customer_name || s.customer || '').toLowerCase();
      const item = (s.item || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return invoiceNo.includes(query) || customer.includes(query) || item.includes(query);
    });
  }, [pendingBalanceSales, searchQuery]);

  // Financial Summary Metrics
  const totalOutstandingBalance = useMemo(() => {
    return pendingBalanceSales.reduce((acc, curr) => acc + (Number(curr.balanceDue ?? curr.balance_due) || 0), 0);
  }, [pendingBalanceSales]);

  const totalCollectedToDate = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.advancePayment ?? curr.advance_payment) || 0), 0);
  }, [salesList]);

  const totalAdminCommissionReleased = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.adminCommissionCut ?? curr.admin_commission_cut) || 0), 0);
  }, [salesList]);

  const totalNetEarningsRealized = useMemo(() => {
    return salesList.reduce((acc, curr) => acc + (Number(curr.netEntityPayout ?? curr.net_entity_payout) || 0), 0);
  }, [salesList]);

  // Open Receive Balance Modal
  const handleOpenReceiveModal = (sale) => {
    setSelectedSaleForPayment(sale);
    const balance = Number(sale.balanceDue ?? sale.balance_due ?? 0);
    setPaymentAmount(balance);
    setReferenceNo(`UTR-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentMethod('UPI / PhonePe');
    setPaymentNotes('Balance payment installment received from customer');
  };

  // Modal Dynamic Admin Cut Calculation
  const modalAdminCut = useMemo(() => {
    if (!selectedSaleForPayment) return 0;
    const rate = Number(selectedSaleForPayment.adminCommissionPercent ?? selectedSaleForPayment.admin_commission_percent ?? 15);
    return Math.round(((Number(paymentAmount) || 0) * rate) / 100);
  }, [selectedSaleForPayment, paymentAmount]);

  const modalNetEntity = useMemo(() => {
    return Math.max(0, (Number(paymentAmount) || 0) - modalAdminCut);
  }, [paymentAmount, modalAdminCut]);

  // Submit Balance Payment Installment
  const handleSubmitBalancePayment = async (e) => {
    e.preventDefault();
    if (!selectedSaleForPayment) return;

    const saleId = selectedSaleForPayment.id || selectedSaleForPayment.invoiceNumber || selectedSaleForPayment.invoice_number;
    const balance = Number(selectedSaleForPayment.balanceDue ?? selectedSaleForPayment.balance_due ?? 0);
    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      showToast('Please enter a valid payment installment amount.');
      return;
    }

    if (amount > balance) {
      showToast(`Payment amount cannot exceed outstanding balance (₹${balance.toLocaleString()}).`);
      return;
    }

    setIsProcessing(true);
    try {
      await receiveBalancePayment(saleId, {
        amount,
        payment_method: paymentMethod,
        reference_no: referenceNo,
        notes: paymentNotes,
      });

      showToast(`✓ Successfully collected ₹${amount.toLocaleString()}! Admin commission of ₹${modalAdminCut.toLocaleString()} released.`);
      setSelectedSaleForPayment(null);
      await loadData();
    } catch (err) {
      console.error('Error submitting balance payment:', err);
      showToast(err.response?.data?.message || 'Failed to record balance payment.');
    } finally {
      setIsProcessing(false);
    }
  };

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #fde68a' }}>
            <span>💳</span> Payment Section • Direct Client Collections
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Receive Balance Payments
          </h1>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Collect outstanding client installments. Every balance collection automatically releases the corresponding Admin platform commission and updates the project status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/entity/sales/create')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>+</span> Record New Sale
          </button>
          <button
            type="button"
            onClick={() => navigate('/entity/payments/receipts-ledger')}
            style={{ padding: '0.5rem 0.85rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
          >
            🧾 View Receipts Ledger →
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
          <span>💳</span> Receive Balance Payments ({pendingBalanceSales.length})
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payments/receipts-ledger')}
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
          <span>🧾</span> Payment Receipts & Commission Ledger
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
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PENDING CLIENT BALANCES</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: totalOutstandingBalance > 0 ? '#d97706' : '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalOutstandingBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Across {pendingBalanceSales.length} active partial sales
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>FUNDS COLLECTED TO DATE</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalCollectedToDate.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Realized cash flow
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ADMIN COMMISSION RELEASED</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{totalAdminCommissionReleased.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Paid dynamically on received funds
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>NET REALIZED EARNINGS</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalNetEarningsRealized.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Net funds retained after platform fee
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer Name, Member ID, or Offering..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadData}
            style={{ padding: '0.6rem 0.95rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            🔄 Refresh List
          </button>
        </div>
      </div>

      {/* Pending Balances Table */}
      <div className="content-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#fafaf9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Active Projects with Pending Balance Due
          </h3>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            {filteredPendingSales.length} Invoices Pending Collection
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer / Member</th>
                <th style={{ padding: '0.85rem 1rem' }}>Offering Item</th>
                <th style={{ padding: '0.85rem 1rem' }}>Project Value</th>
                <th style={{ padding: '0.85rem 1rem' }}>Collected So Far</th>
                <th style={{ padding: '0.85rem 1rem' }}>Remaining Balance Due</th>
                <th style={{ padding: '0.85rem 1rem' }}>Admin Rate</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading active receivables from database...
                  </td>
                </tr>
              ) : filteredPendingSales.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>All Client Balances Cleared!</div>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      There are currently no active sales with pending balances due.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPendingSales.map((sale) => {
                  const invoiceNo = sale.invoiceNumber || sale.invoice_number || sale.id;
                  const gross = Number(sale.grossAmount ?? sale.gross_amount ?? 0);
                  const collected = Number(sale.advancePayment ?? sale.advance_payment ?? 0);
                  const balance = Number(sale.balanceDue ?? sale.balance_due ?? 0);
                  const rate = Number(sale.adminCommissionPercent ?? sale.admin_commission_percent ?? 15);

                  return (
                    <tr key={sale.id || invoiceNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div>{invoiceNo}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>{sale.date}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{sale.customerName || sale.customer_name || sale.customer}</div>
                        {sale.customer_user_code && (
                          <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            {sale.customer_user_code}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{sale.item}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                          {sale.itemType || sale.item_type} ({sale.category || 'General'})
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{gross.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                        ₹{collected.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#d97706' }}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600 }}>
                        {rate}%
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenReceiveModal(sale)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            background: '#636B2F',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(99, 107, 47, 0.25)',
                          }}
                        >
                          💳 Collect Payment
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

      {/* Modal: Receive Balance Payment */}
      {selectedSaleForPayment && (
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
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  💳 Receive Balance Payment
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedSaleForPayment.invoiceNumber || selectedSaleForPayment.invoice_number || selectedSaleForPayment.id}</strong> • Client: <strong>{selectedSaleForPayment.customerName || selectedSaleForPayment.customer_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleForPayment(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Sale Status Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Total Project Value:</span>
                <strong>₹{Number(selectedSaleForPayment.grossAmount ?? selectedSaleForPayment.gross_amount ?? 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>Already Collected:</span>
                <strong style={{ color: '#2563eb' }}>₹{Number(selectedSaleForPayment.advancePayment ?? selectedSaleForPayment.advance_payment ?? 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                <span style={{ color: '#b45309', fontWeight: 700 }}>Total Balance Remaining:</span>
                <strong style={{ color: '#d97706', fontSize: '0.95rem' }}>₹{Number(selectedSaleForPayment.balanceDue ?? selectedSaleForPayment.balance_due ?? 0).toLocaleString()}</strong>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmitBalancePayment}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Payment Installment Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value)))}
                    max={Number(selectedSaleForPayment.balanceDue ?? selectedSaleForPayment.balance_due ?? 0)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700 }}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Number(selectedSaleForPayment.balanceDue ?? selectedSaleForPayment.balance_due ?? 0))}
                      style={{ fontSize: '0.72rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Pay Full Remaining Balance (₹{Number(selectedSaleForPayment.balanceDue ?? selectedSaleForPayment.balance_due ?? 0).toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Math.round(Number(selectedSaleForPayment.balanceDue ?? selectedSaleForPayment.balance_due ?? 0) * 0.5))}
                      style={{ fontSize: '0.72rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      50% Installment
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
                    >
                      <option value="UPI / PhonePe">UPI / PhonePe / GPay</option>
                      <option value="Net Banking / IMPS">Net Banking / IMPS</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="Cash / Cheque">Cash / Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                      UTR / Reference Number
                    </label>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Commission Release Preview */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ color: '#166534' }}>Admin Platform Fee Released ({selectedSaleForPayment.adminCommissionPercent || 15}%):</span>
                  <strong style={{ color: '#dc2626' }}>₹{modalAdminCut.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#166534', fontWeight: 700 }}>Net Entity Credited on this Installment:</span>
                  <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>₹{modalNetEntity.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSaleForPayment(null)}
                  disabled={isProcessing}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    flex: 2,
                    padding: '0.65rem 1rem',
                    background: isProcessing ? '#94a3b8' : '#636B2F',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? 'Processing Receipt...' : `Confirm & Record ₹${(Number(paymentAmount) || 0).toLocaleString()} Payment`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntityReceiveBalancePage;
