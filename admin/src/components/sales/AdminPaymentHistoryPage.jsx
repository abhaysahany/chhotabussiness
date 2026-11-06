import React, { useState, useMemo, useEffect } from 'react';
import { getAdminPaymentLedger } from '../../api/adminSalesService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminPaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all'); // 'all' | 'advance' | 'balance'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [viewingPayment, setViewingPayment] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Show ONLY successfully distributed payments where income_distribution_status = 'completed'
      const res = await getAdminPaymentLedger({ status: 'completed' });
      // Filter out any unallocated or pending payment on client side as well for 100% defense in depth
      const completedOnly = (res?.payments || []).filter(
        (p) => (p.income_distribution_status || p.incomeDistributionStatus) === 'completed'
      );
      setPayments(completedOnly);
      setSummaryData({
        total_collected: res?.total_collected ?? 0,
        total_admin_commission: res?.total_admin_commission ?? 0,
        total_direct_income: res?.total_direct_income ?? 0,
        total_level_income: res?.total_level_income ?? 0,
        total_reward_income: res?.total_reward_income ?? 0,
        total_distributed_admin_cut: res?.total_distributed_admin_cut ?? 0,
      });
    } catch (e) {
      console.error('Error reading distributed payment ledger from API:', e);
      showToast('Failed to load distributed payment receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Filter distributed payments by search query and payment type
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Must be completed (defense in depth)
      const distStatus = (p.income_distribution_status || p.incomeDistributionStatus || '').toLowerCase();
      if (distStatus !== 'completed') {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.invoice_number || p.invoiceNumber || '').toLowerCase().includes(q) ||
        (p.customer_name || p.customerName || '').toLowerCase().includes(q) ||
        (p.entity_name || p.entityName || '').toLowerCase().includes(q) ||
        (p.reference_no || p.referenceNo || '').toLowerCase().includes(q) ||
        (p.customer_user_code || p.customerUserCode || '').toLowerCase().includes(q) ||
        (p.sponsor || '').toLowerCase().includes(q) ||
        `rcpt-${p.id}`.toLowerCase().includes(q);

      const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
      const matchType = paymentTypeFilter === 'all' || pType === paymentTypeFilter;

      return matchSearch && matchType;
    });
  }, [payments, searchQuery, paymentTypeFilter]);

  // Aggregate Metrics derived strictly from filtered completed payments
  const totalDistributedPayments = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredPayments]);

  const totalAdminCommissionCut = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.admin_commission_cut ?? curr.adminCommissionCut) || 0), 0);
  }, [filteredPayments]);

  const totalDistributedAdminCut = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.distributed_admin_cut_amount ?? curr.distributedAdminCutAmount ?? curr.admin_commission_cut) || 0), 0);
  }, [filteredPayments]);

  const totalDirectIncome = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.direct_income_amount ?? curr.directIncomeAmount) || 0), 0);
  }, [filteredPayments]);

  const totalLevelIncome = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.level_income_amount ?? curr.levelIncomeAmount) || 0), 0);
  }, [filteredPayments]);

  const totalRewardIncome = useMemo(() => {
    return filteredPayments.reduce((acc, curr) => acc + (Number(curr.reward_income_amount ?? curr.rewardIncomeAmount) || 0), 0);
  }, [filteredPayments]);

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
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

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
              Payment Receipts & History
            </h1>
            <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
              READ-ONLY LEDGER
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Permanent historical audit trail of individual payment receipts whose Admin Income Allocation (40% Direct / 40% Level / 20% Reward) has been successfully completed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            style={{
              padding: '0.5rem 0.95rem',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh History'}
          </button>
        </div>
      </div>

      {/* Read-Only Guidance Alert Banner */}
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.82rem',
          color: '#0369a1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
          <span>
            <strong>Read-Only Notice:</strong> This audit page displays <strong>only successfully distributed payments</strong>. To inspect pending payments or distribute Admin Commission, please use <strong>Sidebar → Orders & Payments → Order Management</strong>.
          </span>
        </div>
        <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
          Distribution Status: completed only
        </span>
      </div>

      {/* KPI Stats Cards — Strictly from successfully distributed receipts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Distributed Payments
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            ₹{totalDistributedPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {filteredPayments.length} Distributed Receipts
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Admin Cut Distributed
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.3rem' }}>
            ₹{totalDistributedAdminCut.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '0.2rem' }}>
            100% Commission Allocated
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Direct Income (40%)
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.3rem' }}>
            ₹{totalDirectIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Sponsor Direct Pool
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Level Income (40%)
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '0.3rem' }}>
            ₹{totalLevelIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Levels 2–5 Team Pool
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Reward Income (20%)
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0891b2', marginTop: '0.3rem' }}>
            ₹{totalRewardIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Company Reward Fund
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #475569' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Receipt Count
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.3rem' }}>
            {filteredPayments.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Settled Receipts
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, Member ID, Sponsor, Seller Entity, or UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', fontWeight: 600, color: '#334155' }}
          >
            <option value="all">All Payment Types</option>
            <option value="advance">Advance Initial Only</option>
            <option value="balance">Balance Installment Only</option>
          </select>

          <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#f1f5f9', padding: '0.45rem 0.75rem', borderRadius: '6px', fontWeight: 600 }}>
            Showing: {filteredPayments.length} of {payments.length} distributed
          </span>
        </div>
      </div>

      {/* Payment Receipts & History Table — 21 Columns */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '1650px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '0.75rem 0.85rem' }}>Receipt # / ID</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Invoice #</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Payment Date</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Seller Entity</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Customer / Buyer</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Member ID</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Sponsor ID</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Installment Type</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Payment Amount</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#1e293b' }}>Total Project Cost</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Rate (%)</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Admin Cut</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#0f172a' }}>Total Admin Amount</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#b45309' }}>Remaining Admin Amount</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#2563eb' }}>Direct (40%)</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#d97706' }}>Level (40%)</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#0891b2' }}>Reward (20%)</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#059669' }}>Total Distributed</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Distribution Date</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="21" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #cbd5e1', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }}></div>
                    <div style={{ fontWeight: 600 }}>Loading distributed payment receipts...</div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="21" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>No Distributed Payment Records Found</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      Payment receipts only appear here after their Admin Commission has been distributed via <strong>Order Management</strong>.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const receiptId = `RCPT-${p.id}`;
                  const invoiceNo = p.invoice_number || p.invoiceNumber || (p.order ? p.order.invoice_number : '—');
                  const paymentDate = p.payment_date || p.paymentDate || p.created_at;
                  const formattedDate = formatDate(paymentDate);
                  const entityName = p.entity_name || p.entityName || (p.order ? p.order.entity_name : '—');
                  const customerName = p.customer_name || p.customerName || (p.order ? p.order.customer_name : '—');
                  const customerUserCode = p.customer_user_code || p.customerUserCode || (p.order ? p.order.customer_user_code : '—');
                  const sponsorCode = p.sponsor || (p.order ? p.order.sponsor : '—');
                  const pType = (p.payment_type || p.paymentType || 'advance').toLowerCase();
                  const amount = Number(p.amount || 0);
                  const totalProjectCost = Number(p.total_project_cost ?? p.totalProjectCost ?? p.order?.gross_amount ?? amount);
                  const commissionPercent = Number(p.admin_commission_percent ?? p.adminCommissionPercent ?? 15);
                  const adminCut = Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0);
                  const totalAdminAmount = Number(p.total_admin_amount ?? p.totalAdminAmount ?? p.order?.expected_admin_cut ?? p.order?.expectedAdminCut ?? adminCut);
                  const remainingAdminAmount = Number(p.remaining_admin_amount ?? p.remainingAdminAmount ?? p.order?.remaining_admin_commission ?? p.order?.remainingAdminCommission ?? 0);
                  const directIncome = Number(p.direct_income_amount ?? p.directIncomeAmount ?? 0);
                  const levelIncome = Number(p.level_income_amount ?? p.levelIncomeAmount ?? 0);
                  const rewardIncome = Number(p.reward_income_amount ?? p.rewardIncomeAmount ?? 0);
                  const distributedCut = Number(p.distributed_admin_cut_amount ?? p.distributedAdminCutAmount ?? adminCut);
                  const distributedAt = p.income_distributed_at || p.incomeDistributedAt;
                  const formattedDistributedAt = distributedAt ? formatDateTime(distributedAt) : 'Completed';

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                      {/* 1. Receipt / Payment ID */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                          {receiptId}
                        </span>
                      </td>

                      {/* 2. Invoice Number */}
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#2563eb' }}>
                        {invoiceNo}
                      </td>

                      {/* 3. Payment Date */}
                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748b' }}>
                        {formattedDate}
                      </td>

                      {/* 4. Seller Entity */}
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#0f172a' }}>
                        {entityName}
                      </td>

                      {/* 5. Customer / Buyer Name */}
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#0f172a' }}>
                        {customerName}
                      </td>

                      {/* 6. Customer Member ID */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>
                          {customerUserCode}
                        </span>
                      </td>

                      {/* 7. Sponsor ID */}
                      <td style={{ padding: '0.75rem 0.85rem', color: '#475569', fontWeight: 600 }}>
                        {sponsorCode}
                      </td>

                      {/* 8. Installment Type */}
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        {pType === 'balance' ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            💳 Balance
                          </span>
                        ) : (
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            🪙 Advance
                          </span>
                        )}
                      </td>

                      {/* 9. Individual Payment Amount */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 10. Total Project Cost (Order Level) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                        ₹{totalProjectCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 11. Commission Rate (%) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {commissionPercent}%
                      </td>

                      {/* 12. Admin Cut for This Payment */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        ₹{adminCut.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 13. Total Admin Amount (Order Level) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{totalAdminAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 14. Remaining Admin Amount (Order Level) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: remainingAdminAmount > 0 ? '#b45309' : '#059669' }}>
                        ₹{remainingAdminAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 15. Direct Income Amount (40%) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                        ₹{directIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 16. Level Income Amount (40%) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                        ₹{levelIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 17. Reward Income Amount (20%) */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0891b2' }}>
                        ₹{rewardIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 18. Total Distributed Admin Cut */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        ₹{distributedCut.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 19. Distribution Date */}
                      <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', fontSize: '0.75rem' }}>
                        {formattedDistributedAt}
                      </td>

                      {/* 20. Distribution Status */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                        <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          ✓ Completed
                        </span>
                      </td>

                      {/* 21. Read-Only Action: View Breakdown Modal */}
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setViewingPayment(p)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            background: '#f8fafc',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          👁️ View Breakdown
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

      {/* Read-Only Modal: View Distribution Breakdown Log */}
      {viewingPayment && (
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
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Payment Distribution Audit
                  </h3>
                  <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    COMPLETED
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Receipt: <strong>RCPT-{viewingPayment.id}</strong> • Invoice: <strong>{viewingPayment.invoice_number || viewingPayment.invoiceNumber}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
              >
                ×
              </button>
            </div>

            {/* Receipt Summary Cards */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingPayment.customer_name || viewingPayment.customerName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Member ID:</span>
                  <div style={{ fontWeight: 700, color: '#2563eb' }}>{viewingPayment.customer_user_code || viewingPayment.customerUserCode || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Sponsor:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingPayment.sponsor || viewingPayment.order?.sponsor || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Seller Entity:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingPayment.entity_name || viewingPayment.entityName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Installment Type:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{(viewingPayment.payment_type || viewingPayment.paymentType || 'advance').toUpperCase()}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingPayment.payment_method || viewingPayment.paymentMethod || 'Direct'}</div>
                </div>
              </div>
            </div>

            {/* 40/40/20 Distribution Breakdown Box */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1.15rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Payment Amount Received:</span>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                  ₹{Number(viewingPayment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                <span style={{ color: '#166534', fontWeight: 700 }}>Admin Platform Cut ({viewingPayment.admin_commission_percent || 15}%):</span>
                <strong style={{ color: '#16a34a', fontSize: '0.95rem' }}>
                  ₹{Number(viewingPayment.admin_commission_cut ?? viewingPayment.adminCommissionCut ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>1. Direct Sponsor Income (40%):</span>
                  <strong style={{ color: '#2563eb' }}>
                    ₹{Number(viewingPayment.direct_income_amount ?? viewingPayment.directIncomeAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>2. Team Level Income (40%):</span>
                  <strong style={{ color: '#d97706' }}>
                    ₹{Number(viewingPayment.level_income_amount ?? viewingPayment.levelIncomeAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0891b2', fontWeight: 600 }}>3. Company Reward Income (20%):</span>
                  <strong style={{ color: '#0891b2' }}>
                    ₹{Number(viewingPayment.reward_income_amount ?? viewingPayment.rewardIncomeAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>Total Distributed Admin Cut:</span>
                <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                  ₹{Number(viewingPayment.distributed_admin_cut_amount ?? viewingPayment.distributedAdminCutAmount ?? viewingPayment.admin_commission_cut ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              {/* Order-Level Accounting Summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Parent Order Accounting
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Total Project Cost:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{Number(viewingPayment.total_project_cost ?? viewingPayment.totalProjectCost ?? viewingPayment.order?.gross_amount ?? viewingPayment.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Total Expected Admin Cut:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{Number(viewingPayment.total_admin_amount ?? viewingPayment.totalAdminAmount ?? viewingPayment.order?.expected_admin_cut ?? viewingPayment.order?.expectedAdminCut ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Remaining Admin Cut to Collect:</span>
                  <span style={{ fontWeight: 700, color: Number(viewingPayment.remaining_admin_amount ?? viewingPayment.remainingAdminAmount ?? viewingPayment.order?.remaining_admin_commission ?? 0) > 0 ? '#b45309' : '#059669' }}>
                    ₹{Number(viewingPayment.remaining_admin_amount ?? viewingPayment.remainingAdminAmount ?? viewingPayment.order?.remaining_admin_commission ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '0.45rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span>Distributed Timestamp:</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {viewingPayment.income_distributed_at || viewingPayment.incomeDistributedAt ? new Date(viewingPayment.income_distributed_at || viewingPayment.incomeDistributedAt).toLocaleString('en-IN') : 'Completed'}
                </span>
              </div>
            </div>

            {/* Read-Only Close Action — Zero modification or distribution triggers */}
            <button
              type="button"
              onClick={() => setViewingPayment(null)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close Audit Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPaymentHistoryPage;