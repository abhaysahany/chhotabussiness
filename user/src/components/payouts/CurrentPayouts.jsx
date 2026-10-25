import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUserPayouts } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { formatINR } from '../../utils/formatters';
import DataTable from '../common/DataTable';

function CurrentPayouts({ user, onNavigate }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [payoutsData, setPayoutsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Filter States
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Countdown timer to weekly Tuesday settlement cycle
  const [countdown, setCountdown] = useState({ hours: 11, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchPayouts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = {
        user_code: userCode,
        status: statusFilter,
        date_preset: datePreset,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const [res, freshUser] = await Promise.all([
        getUserPayouts(params),
        getUserFreshProfile(),
      ]);

      if (res && res.status === 'success') {
        setPayoutsData(res);
      }
      if (freshUser) {
        setCurrentUser(freshUser);
      }

      if (isRefresh) {
        showToast('✓ Payout records synced from database!');
      }
    } catch (err) {
      console.error('Error fetching database current payouts:', err);
      showToast('Could not load payout records from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userCode, statusFilter, datePreset, startDate, endDate]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const summary = payoutsData?.summary || {
    availableCommissionBalance: Number(currentUser?.commission_balance ?? user?.commission_balance) || 0,
    totalWithdrawnGross: 0,
    totalWithdrawnNet: 0,
    totalTdsDeducted: 0,
    totalPendingAmount: 0,
    expectedPayoutAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalCount: 0,
    isKycVerified: false,
    kycStatus: currentUser?.kyc_status || 'unverified',
  };

  const payoutsList = payoutsData?.payouts || [];

  const availableBalance = Number(summary.availableCommissionBalance || currentUser?.commission_balance || 0);
  const isKycVerified = Boolean(
    summary.isKycVerified ||
    currentUser?.kyc_status === 'verified' ||
    currentUser?.kyc_status === 'approved' ||
    user?.kyc_status === 'verified'
  );

  const copyUtr = (utr) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    showToast(`✓ Copied UTR: ${utr}`);
  };

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Payout Code',
      accessor: 'payout_code',
      render: (val, row) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{val}</strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {row.request_date ? new Date(row.request_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'Payment Mode / Bank',
      accessor: 'payment_method',
      render: (val, row) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem', display: 'block' }}>
            {val || 'Direct Transfer'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#475569' }}>
            {row.bank_name ? `${row.bank_name} (${row.account_number || '••••'})` : (row.upi_id || 'IMPS/NEFT')}
          </span>
        </div>
      ),
    },
    {
      header: 'Gross Amount',
      accessor: 'requested_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: '5% TDS',
      accessor: 'tds_deduction',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.82rem' }}>
          - {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Net Payable',
      accessor: 'net_payable_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.92rem' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (val) => {
        const s = (val || 'pending').toLowerCase();
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '0.22rem 0.65rem',
              borderRadius: '12px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background:
                s === 'completed' ? '#dcfce7' :
                s === 'pending' ? '#fef3c7' :
                s === 'processing' ? '#e0f2fe' : '#fee2e2',
              color:
                s === 'completed' ? '#15803d' :
                s === 'pending' ? '#b45309' :
                s === 'processing' ? '#0369a1' : '#b91c1c',
            }}
          >
            ● {s === 'completed' ? 'Paid / Settled' : s === 'pending' ? 'Pending Action' : s}
          </span>
        );
      },
    },
    {
      header: 'UTR / Ref ID',
      accessor: 'utr_number',
      render: (val) =>
        val ? (
          <button
            type="button"
            onClick={() => copyUtr(val)}
            title="Click to copy UTR"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0284c7',
            }}
          >
            📋 {val}
          </button>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>Awaiting UTR</span>
        ),
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      align: 'center',
      render: (val, row) => (
        <button
          type="button"
          onClick={() => setSelectedReceipt(row)}
          style={{
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            padding: '0.3rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📄 Receipt
        </button>
      ),
    },
  ];

  return (
    <div className="page-content-wrapper" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '1.75rem', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>💰 Live Database Payout Desk</span>
              {isKycVerified ? (
                <span style={{ background: '#22c55e', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.7rem' }}>✓ KYC Verified</span>
              ) : (
                <span style={{ background: '#f59e0b', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.7rem' }}>⚠️ KYC Pending</span>
              )}
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Current Payouts & Commission Settlements
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Real-time ledger of your available commission balance, pending withdrawal requests, expected bank credits, and statutory 5% TDS statements directly from MySQL.
            </p>
          </div>

          {/* Quick Actions & Cutoff */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fetchPayouts(true)}
                disabled={refreshing}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.55rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                }}
              >
                🔄 {refreshing ? 'Syncing...' : 'Sync Database'}
              </button>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('payout-withdraw')}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>⚡</span> Request Withdrawal (Min ₹500)
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Weekly Cutoff: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{String(countdown.hours).padStart(2, '0')}h : {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s</strong>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Warning Banner if Not Verified */}
      {!isKycVerified && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#92400e', display: 'block', fontSize: '0.9rem' }}>
                KYC Verification is Mandatory for Commission Withdrawals
              </strong>
              <span style={{ color: '#b45309', fontSize: '0.82rem' }}>
                Your current KYC status is <strong>{summary.kycStatus || 'Unverified'}</strong>. Please verify PAN and Bank Account to enable ₹500+ withdrawals.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('bank-accounts')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Complete KYC Now →
          </button>
        </div>
      )}

      {/* 5 Core Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* 1. Available Commission Balance */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.4rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Available Wallet Balance
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', margin: '0.35rem 0' }}>
            {formatINR(availableBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: availableBalance >= 500 ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
            {availableBalance >= 500 ? '✓ Ready to withdraw (>= ₹500)' : '⚠️ Min ₹500 required'}
          </div>
        </div>

        {/* 2. Pending Requests */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.4rem', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Pending Requests ({summary.pendingCount})
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', margin: '0.35rem 0' }}>
            {formatINR(summary.totalPendingAmount)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
            Awaiting Admin Processing
          </div>
        </div>

        {/* 3. Expected Payouts (Net Payable) */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.4rem', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Expected Net Payout
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7', margin: '0.35rem 0' }}>
            {formatINR(summary.expectedPayoutAmount || (summary.totalPendingAmount * 0.95))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
            Net Credited after 5% TDS
          </div>
        </div>

        {/* 4. Total Payouts Disbursed */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.4rem', border: '1px solid #e2e8f0', borderTop: '4px solid #7c3aed', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Payouts Settled
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed', margin: '0.35rem 0' }}>
            {formatINR(summary.totalWithdrawnNet)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
            {summary.completedCount} Lifetime Settlements
          </div>
        </div>

        {/* 5. Total TDS Deducted */}
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.4rem', border: '1px solid #e2e8f0', borderTop: '4px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total 5% TDS Deducted
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b91c1c', margin: '0.35rem 0' }}>
            {formatINR(summary.totalTdsDeducted)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            Sec 194H Form 16A Credit
          </div>
        </div>
      </div>

      {/* Date & Status Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Date Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Date Range:</span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
          ].map((dp) => (
            <button
              key={dp.id}
              type="button"
              onClick={() => {
                setDatePreset(dp.id);
                setStartDate('');
                setEndDate('');
              }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: datePreset === dp.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: datePreset === dp.id ? '#eff6ff' : '#ffffff',
                color: datePreset === dp.id ? '#1d4ed8' : '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {dp.label}
            </button>
          ))}
        </div>

        {/* Custom Start / End Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              style={{ padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}
          >
            <option value="all">All Payout Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="completed">Paid / Completed</option>
            <option value="rejected">Rejected / Refunded</option>
          </select>
        </div>
      </div>

      {/* Payout History DataTable */}
      <DataTable
        columns={columns}
        data={payoutsList}
        defaultPageSize={10}
        searchPlaceholder="Search by payout code, UTR reference, bank name, or payment channel..."
        loading={loading}
        emptyMessage="No payout records found matching your selected date and status filters."
      />

      {/* Modal: Payout Receipt View */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                  Commission Payout Voucher
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedReceipt.payout_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Member:</span>
                <strong>{selectedReceipt.member_name} ({selectedReceipt.user_code})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Request Date:</span>
                <span>{selectedReceipt.request_date ? new Date(selectedReceipt.request_date).toLocaleString('en-IN') : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Gross Commission Claimed:</span>
                <strong style={{ color: '#0f172a' }}>{formatINR(selectedReceipt.requested_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
                <span>Statutory 5% TDS (Sec 194H):</span>
                <strong>- {formatINR(selectedReceipt.tds_deduction)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '2px solid #e2e8f0', fontSize: '1.05rem', color: '#16a34a' }}>
                <strong>Net Disbursed to Account:</strong>
                <strong>{formatINR(selectedReceipt.net_payable_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Settlement Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedReceipt.status === 'completed' ? '#15803d' : '#b45309' }}>
                  {selectedReceipt.status}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>UTR / Reference Number:</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{selectedReceipt.utr_number || 'Under Processing'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                <span style={{ color: '#64748b' }}>Beneficiary Account / UPI:</span>
                <span>{selectedReceipt.account_number || selectedReceipt.upi_id || 'Registered Account'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                🖨️ Print Voucher
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrentPayouts;
