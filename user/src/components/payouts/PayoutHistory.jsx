import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUserPayouts } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { formatINR } from '../../utils/formatters';
import DataTable from '../common/DataTable';

function PayoutHistory({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [payoutsList, setPayoutsList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchHistory = useCallback(async (isRefresh = false) => {
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
        setPayoutsList(res.payouts || []);
        setSummary(res.summary || null);
      }
      if (freshUser) {
        setCurrentUser(freshUser);
      }

      if (isRefresh) {
        showToast('✓ Payout history reloaded from database!');
      }
    } catch (err) {
      console.error('Error fetching database payout history:', err);
      showToast('Could not load payout history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userCode, statusFilter, datePreset, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const copyUtr = (utr) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    showToast(`✓ Copied UTR: ${utr}`);
  };

  const exportLedgerCsv = () => {
    if (payoutsList.length === 0) {
      showToast('No payout data available to export.');
      return;
    }

    const headers = ['Payout Code', 'Request Date', 'Member Code', 'Bank/Channel', 'Gross (INR)', '5% TDS (INR)', 'Net Payable (INR)', 'Status', 'UTR Ref'];
    const rows = payoutsList.map((p) => [
      p.payout_code,
      p.request_date ? p.request_date.slice(0, 10) : 'N/A',
      p.user_code,
      p.bank_name || p.payment_method,
      p.requested_amount,
      p.tds_deduction,
      p.net_payable_amount,
      p.status,
      p.utr_number || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payout_History_${userCode || 'member'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('✓ Payout history CSV downloaded!');
  };

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Payout Code & Date',
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
      header: 'Payout Channel',
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
      header: 'Gross Claimed',
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
      header: 'Net Disbursed',
      accessor: 'net_payable_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.92rem' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Settlement Status',
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
            ● {s === 'completed' ? 'Paid' : s === 'pending' ? 'Pending' : s}
          </span>
        );
      },
    },
    {
      header: 'UTR Reference',
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
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>Processing</span>
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
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '1.75rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>📜 Audit Trail & Withdrawal Archive</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Payout History & Disbursement Ledger
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Complete chronological ledger of all requested and disbursed commission payments, UTR transaction references, 5% TDS deductions, and downloadable vouchers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
              }}
            >
              🔄 {refreshing ? 'Syncing...' : 'Refresh History'}
            </button>

            <button
              type="button"
              onClick={exportLedgerCsv}
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                border: 'none',
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Net Withdrawn</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.3rem' }}>
            {formatINR(summary?.totalWithdrawnNet || 0)}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total 5% TDS Deducted</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '0.3rem' }}>
            {formatINR(summary?.totalTdsDeducted || 0)}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending Requests Queue</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '0.3rem' }}>
            {formatINR(summary?.totalPendingAmount || 0)}
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Completed Transactions</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '0.3rem' }}>
            {summary?.completedCount || 0} Transfers
          </div>
        </div>
      </div>

      {/* Date Range & Status Filter Bar */}
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
        {/* Preset Buttons */}
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

      {/* History DataTable */}
      <DataTable
        columns={columns}
        data={payoutsList}
        defaultPageSize={10}
        searchPlaceholder="Search by payout code, UTR number, bank, or payment channel..."
        loading={loading}
        emptyMessage="No historical payout transactions found for this date range."
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
                  Disbursement Receipt
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
                <span style={{ color: '#64748b' }}>Member Code & Name:</span>
                <strong>{selectedReceipt.member_name} ({selectedReceipt.user_code})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Request Date:</span>
                <span>{selectedReceipt.request_date ? new Date(selectedReceipt.request_date).toLocaleString('en-IN') : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Gross Requested:</span>
                <strong style={{ color: '#0f172a' }}>{formatINR(selectedReceipt.requested_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
                <span>Statutory 5% TDS (Section 194H):</span>
                <strong>- {formatINR(selectedReceipt.tds_deduction)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '2px solid #e2e8f0', fontSize: '1.05rem', color: '#16a34a' }}>
                <strong>Net Disbursed Amount:</strong>
                <strong>{formatINR(selectedReceipt.net_payable_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Settlement Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedReceipt.status === 'completed' ? '#15803d' : '#b45309' }}>
                  {selectedReceipt.status}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Bank UTR / Reference ID:</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{selectedReceipt.utr_number || 'Under Processing'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                🖨️ Print
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

export default PayoutHistory;
