import React, { useState, useMemo, useEffect } from 'react';
import { getAdminPaymentLedger, distributePaymentCommission } from '../../api/adminSalesService';

function AdminPaymentReportsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // 'all' | 'advance' | 'balance' | 'full'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Distribution Settings
  const [mlmSettings, setMlmSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('vyapar_admin_mlm_settings') || localStorage.getItem('chhota_admin_mlm_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { bpValueInRupees: 10, defaultReferralPercent: 40, defaultTeamPercent: 20, defaultBpPercent: 20 };
  });

  // Modal States - Percentages are of the TOTAL ADMIN PLATFORM FEE RECEIVED (100%)
  const [selectedPaymentForDist, setSelectedPaymentForDist] = useState(null);
  const [referralCommissionPercent, setReferralCommissionPercent] = useState(40); // 40% of Admin Fee
  const [teamCommissionPercent, setTeamCommissionPercent] = useState(20); // 20% of Admin Fee across 10 levels = 2% each
  const [bpPercent, setBpPercent] = useState(20); // 20% of Admin Fee converted to BP
  const [isDistributing, setIsDistributing] = useState(false);

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
    try {
      const stored = localStorage.getItem('vyapar_admin_mlm_settings') || localStorage.getItem('chhota_admin_mlm_settings');
      if (stored) {
        const s = JSON.parse(stored);
        setMlmSettings(s);
        setReferralCommissionPercent(s.defaultReferralPercent || 40);
        setTeamCommissionPercent(s.defaultTeamPercent || 20);
        setBpPercent(s.defaultBpPercent || 20);
      }
    } catch (e) {}
  }, []);

  // Filter ONLY LEFT / PENDING DISTRIBUTION DATA
  const pendingPayments = useMemo(() => {
    return payments.filter((p) => {
      const distStatus = (p.network_distribution_status || p.networkDistributionStatus || 'pending_admin_distribution').toLowerCase();
      return distStatus === 'pending_admin_distribution';
    });
  }, [payments]);

  // Filtered by Search & Type
  const filteredPendingPayments = useMemo(() => {
    return pendingPayments.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (p.invoice_number || p.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.customer_name || p.customerName || '').toLowerCase().includes(q) ||
        (p.entity_name || p.entityName || '').toLowerCase().includes(q) ||
        (p.reference_no || p.referenceNo || '').toLowerCase().includes(q) ||
        (p.customer_user_code || p.customerUserCode || '').toLowerCase().includes(q);

      const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
      const matchType = paymentTypeFilter === 'all' || pType === paymentTypeFilter;

      return matchSearch && matchType;
    });
  }, [pendingPayments, searchQuery, paymentTypeFilter]);

  // Aggregate Metrics for Pending Queue
  const totalPendingAmount = useMemo(() => {
    return pendingPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [pendingPayments]);

  const totalAdminCutOnPending = useMemo(() => {
    return pendingPayments.reduce((acc, curr) => acc + (Number(curr.admin_commission_cut ?? curr.adminCommissionCut) || 0), 0);
  }, [pendingPayments]);

  // Execute Network Distribution on a specific Payment Receipt
  const handleConfirmDistribution = async () => {
    if (!selectedPaymentForDist) return;

    const paymentId = selectedPaymentForDist.id;
    const adminFeeReceived = Number(selectedPaymentForDist.admin_commission_cut ?? selectedPaymentForDist.adminCommissionCut ?? 0);
    const bpRate = mlmSettings.bpValueInRupees || 10;

    const referralAmount = Math.round((adminFeeReceived * referralCommissionPercent) / 100);
    const teamTotalAmount = Math.round((adminFeeReceived * teamCommissionPercent) / 100);
    const bpMonetaryValue = Math.round((adminFeeReceived * bpPercent) / 100);
    const totalBp = bpRate > 0 ? Math.round(bpMonetaryValue / bpRate) : 0;
    const teamAmountPerLevel = +(teamTotalAmount / 10).toFixed(2);
    const bpPerLevel = +(totalBp / 20).toFixed(2);

    setIsDistributing(true);
    try {
      await distributePaymentCommission(paymentId, {
        referral_percent: referralCommissionPercent,
        team_percent: teamCommissionPercent,
        bp_percent: bpPercent,
        total_bp: totalBp,
        bp_value_rate: bpRate,
      });

      showToast(`✓ Disbursed: Referral Commission (₹${referralAmount}), Team Commission (10 Levels @ ₹${teamAmountPerLevel}), & ${totalBp} BP (20 Levels @ ${bpPerLevel} BP) for Receipt #RCPT-${paymentId}!`);
      setSelectedPaymentForDist(null);
      await loadPayments();
    } catch (err) {
      console.error('Error distributing payment commission:', err);
      showToast(err.response?.data?.message || 'Failed to disburse network distribution.');
    } finally {
      setIsDistributing(false);
    }
  };

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #fde68a' }}>
            <span>⏳</span> Action Queue • Pending Commission Distribution
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            Commission Distribution (Pending Tranches)
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Disburse network referral commissions, team volume, and business points directly from the Admin Platform Fee received.
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
            🔄 Refresh Queue
          </button>
          <span style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1e40af', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
            💎 1 BP = ₹{mlmSettings.bpValueInRupees || 10}
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>PENDING DISTRIBUTION COUNT</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: pendingPayments.length > 0 ? '#d97706' : '#16a34a', marginTop: '0.35rem' }}>
            {pendingPayments.length} Tranches Left
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Awaiting Admin Network Disbursal
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL FUNDS IN PENDING QUEUE</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalPendingAmount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Advance & Balance installment collections
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>ADMIN PLATFORM FEE BUDGET POOL</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalAdminCutOnPending.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            100% Budget Pool for Network Commissions
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search pending queue by Invoice #, Customer, Member ID, Entity, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

      {/* Pending Distribution Table */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Admin Fee (100% Pool)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading pending commission distribution queue...
                  </td>
                </tr>
              ) : filteredPendingPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                    <strong style={{ color: '#0f172a', fontSize: '1rem', display: 'block' }}>All Network Commissions Distributed!</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem' }}>
                      There are currently no pending payments left to distribute. View fully distributed records in the <strong>Payment History</strong> tab.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPendingPayments.map((p) => {
                  const receiptId = `RCPT-${p.id || '00'}`;
                  const invoiceNo = p.invoice_number || p.invoiceNumber;
                  const dateStr = p.payment_date || p.paymentDate || p.created_at || 'Recently';
                  const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
                  const amount = Number(p.amount || 0);
                  const adminCut = Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0);

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
                        ₹{adminCut.toLocaleString()} ({p.admin_commission_percent || p.adminCommissionPercent || 15}%)
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          ⏳ Left to Distribute
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentForDist(p);
                            setReferralCommissionPercent(mlmSettings.defaultReferralPercent || 40);
                            setTeamCommissionPercent(mlmSettings.defaultTeamPercent || 20);
                            setBpPercent(mlmSettings.defaultBpPercent || 20);
                          }}
                          style={{
                            padding: '0.45rem 0.9rem',
                            background: 'linear-gradient(135deg, #3569a7 0%, #254a77 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(53, 105, 167, 0.25)',
                          }}
                        >
                          ⚡ Distribute Commission
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

      {/* Modal: Distribute Network Commission on Specific Payment Receipt */}
      {selectedPaymentForDist && (() => {
        const paymentAmount = Number(selectedPaymentForDist.amount || 0);
        const adminFeeReceived = Number(selectedPaymentForDist.admin_commission_cut ?? selectedPaymentForDist.adminCommissionCut ?? 0);
        
        // Percentages calculated directly from the ADMIN PLATFORM FEE RECEIVED (100% = adminFeeReceived)
        const referralAmount = Math.round((adminFeeReceived * referralCommissionPercent) / 100);
        const teamTotalAmount = Math.round((adminFeeReceived * teamCommissionPercent) / 100);
        const bpMonetaryValue = Math.round((adminFeeReceived * bpPercent) / 100);
        const bpRate = mlmSettings.bpValueInRupees || 10;
        const totalBp = bpRate > 0 ? Math.round(bpMonetaryValue / bpRate) : 0;
        
        const totalDistributionPercent = referralCommissionPercent + teamCommissionPercent + bpPercent;
        const totalDistributionAmount = referralAmount + teamTotalAmount + bpMonetaryValue;
        const isExceedingBudget = totalDistributionPercent > 100 || (adminFeeReceived > 0 && totalDistributionAmount > adminFeeReceived);
        const adminNetRetained = adminFeeReceived - totalDistributionAmount;
        const adminNetRetainedPercent = Math.max(0, 100 - totalDistributionPercent);

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
              zIndex: 99999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    ⚡ Distribute Commission & Business Points
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Receipt # <strong>RCPT-{selectedPaymentForDist.id}</strong> • Invoice: <strong>{selectedPaymentForDist.invoice_number || selectedPaymentForDist.invoiceNumber}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForDist(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              {/* Tranche Summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Seller Entity:</span>
                  <strong>{selectedPaymentForDist.entity_name || selectedPaymentForDist.entityName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer / Member:</span>
                  <strong>{selectedPaymentForDist.customer_name || selectedPaymentForDist.customerName} ({selectedPaymentForDist.customer_user_code || 'Member'})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Installment Amount Received:</span>
                  <strong style={{ color: '#2563eb', fontSize: '0.95rem' }}>₹{paymentAmount.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem' }}>
                  <span style={{ color: '#166534', fontWeight: 700 }}>Total Admin Platform Fee (100% Distribution Pool):</span>
                  <strong style={{ color: '#16a34a', fontSize: '1.1rem' }}>₹{adminFeeReceived.toLocaleString()} ({selectedPaymentForDist.admin_commission_percent || selectedPaymentForDist.adminCommissionPercent}%)</strong>
                </div>
              </div>

              {/* Real-time Budget & Guardrail Meter Card */}
              <div
                style={{
                  background: isExceedingBudget ? '#fef2f2' : '#f0fdf4',
                  border: `1.5px solid ${isExceedingBudget ? '#fca5a5' : '#86efac'}`,
                  borderRadius: '10px',
                  padding: '0.9rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isExceedingBudget ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>
                    🛡️ Admin Fee Distribution Pool (Max 100%)
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isExceedingBudget ? '#dc2626' : '#16a34a' }}>
                    {totalDistributionPercent}% of ₹{adminFeeReceived.toLocaleString()} Allocated
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, totalDistributionPercent)}%`,
                      background: isExceedingBudget ? '#dc2626' : totalDistributionPercent === 100 ? '#2563eb' : '#16a34a',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>100% Budget Pool:</span>
                    <strong style={{ color: '#0f172a' }}>₹{adminFeeReceived.toLocaleString()}</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Network Payout ({totalDistributionPercent}%):</span>
                    <strong style={{ color: isExceedingBudget ? '#dc2626' : '#2563eb' }}>₹{totalDistributionAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Admin Retained ({adminNetRetainedPercent}%):</span>
                    <strong style={{ color: adminNetRetained < 0 ? '#dc2626' : '#16a34a' }}>
                      {adminNetRetained >= 0 ? `+₹${adminNetRetained.toLocaleString()}` : `-₹${Math.abs(adminNetRetained).toLocaleString()}`}
                    </strong>
                  </div>
                </div>

                {isExceedingBudget && (
                  <div style={{ color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.6rem', background: '#fee2e2', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #f87171' }}>
                    ⚠️ Exceeds 100%: Total distribution ({totalDistributionPercent}%) cannot be more than 100% of the Admin Platform Fee received (₹{adminFeeReceived.toLocaleString()}). Please decrease percentages.
                  </div>
                )}
              </div>

              {/* Distribution Inputs (Calculated as % of Admin Fee) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* 1. Direct Sponsor Referral Commission */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      1. Direct Sponsor Referral Commission
                    </label>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#2563eb' }}>
                      {referralCommissionPercent}% of ₹{adminFeeReceived} = ₹{referralAmount.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={referralCommissionPercent}
                    onChange={(e) => setReferralCommissionPercent(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Directly credited to sponsor <strong>{selectedPaymentForDist.sponsor || 'CB100001'}</strong> from the received admin fee.
                  </div>
                </div>

                {/* 2. Team Commission (10 Levels Equally) */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      2. Team Level Commission (10 Levels Equally)
                    </label>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#16a34a' }}>
                      {teamCommissionPercent}% of ₹{adminFeeReceived} = ₹{teamTotalAmount.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={teamCommissionPercent}
                    onChange={(e) => setTeamCommissionPercent(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                    Each of the 10 upline levels receives <strong>₹{(teamTotalAmount / 10).toFixed(2)}</strong> ({(teamCommissionPercent / 10).toFixed(1)}% of Admin Fee each).
                  </div>
                </div>

                {/* 3. Business Points (20 Levels Equally) */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                      3. Team Volume Business Points (20 Levels Equally)
                    </label>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7c3aed' }}>
                      {bpPercent}% of ₹{adminFeeReceived} = ₹{bpMonetaryValue.toLocaleString()} ({totalBp} BP)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={bpPercent}
                    onChange={(e) => setBpPercent(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed' }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, marginTop: '0.2rem' }}>
                    Each of the 20 upline levels receives <strong>{(totalBp / 20).toFixed(2)} BP</strong> (Value: ₹{((totalBp / 20) * bpRate).toFixed(2)}).
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForDist(null)}
                  disabled={isDistributing}
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDistribution}
                  disabled={isDistributing || isExceedingBudget}
                  style={{
                    flex: 2,
                    padding: '0.65rem 1rem',
                    background: isExceedingBudget
                      ? '#ef4444'
                      : isDistributing
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #3569a7 0%, #254a77 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: isDistributing || isExceedingBudget ? 'not-allowed' : 'pointer',
                    boxShadow: isExceedingBudget ? 'none' : '0 4px 12px rgba(53, 105, 167, 0.3)',
                    opacity: isExceedingBudget ? 0.7 : 1,
                  }}
                >
                  {isDistributing
                    ? 'Disbursing to Network...'
                    : isExceedingBudget
                    ? '🚫 Exceeds 100% of Admin Fee'
                    : '✓ Confirm & Disburse to Network'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdminPaymentReportsPage;
