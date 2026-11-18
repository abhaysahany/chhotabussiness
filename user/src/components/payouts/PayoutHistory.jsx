import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  RotateCcw,
  FileSpreadsheet,
  Banknote,
  Receipt,
  Clock,
  CheckCircle2,
  CheckCheck,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  X,
  Printer,
  Sparkles,
  Building2,
  CreditCard,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { getUserPayouts } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { formatINR } from '../../utils/formatters';
import { formatDate, formatDateTime, getTodayIndianDateString } from '../../utils/timezone';
import DataTable from '../common/DataTable';

function PayoutHistory({ user, onNavigate }) {
  const navigate = useNavigate();
  const handleNav = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
  };

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
  const [copiedUtr, setCopiedUtr] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const isKycVerified = Boolean(
    summary?.isKycVerified ||
    currentUser?.is_kyc_verified === 1 ||
    currentUser?.kyc_status === 'verified'
  );

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
    setCopiedUtr(utr);
    showToast(`✓ Copied UTR: ${utr}`);
    setTimeout(() => setCopiedUtr(null), 2500);
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
    link.setAttribute('download', `Payout_History_${userCode || 'member'}_${getTodayIndianDateString()}.csv`);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <strong style={{ color: '#0f172a', fontSize: '0.88rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            {val}
          </strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={12} color="#94a3b8" />
            {formatDate(row.request_date)}
          </span>
        </div>
      ),
    },
    {
      header: 'Payout Channel',
      accessor: 'payment_method',
      render: (val, row) => {
        const isBank = Boolean(row.bank_name || row.account_number);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isBank ? '#EFF6FF' : '#F5F3FF',
                color: isBank ? '#2563EB' : '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isBank ? <Building2 size={16} /> : <CreditCard size={16} />}
            </div>
            <div>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem', display: 'block' }}>
                {val || (isBank ? 'Bank Account' : 'UPI Transfer')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: isBank ? 'sans-serif' : 'monospace' }}>
                {row.bank_name
                  ? `${row.bank_name} (${row.account_number ? '••••' + String(row.account_number).slice(-4) : '••••'})`
                  : (row.upi_id || 'Direct Settlement')}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Gross Claimed',
      accessor: 'requested_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', fontFamily: 'monospace' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: '5% TDS',
      accessor: 'tds_deduction',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.84rem', fontFamily: 'monospace' }}>
          - {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Net Disbursed',
      accessor: 'net_payable_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 900, color: '#16a34a', fontSize: '0.95rem', fontFamily: 'monospace' }}>
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
        const isPaid = s === 'completed' || s === 'paid';
        const isPending = s === 'pending';
        const isProc = s === 'processing';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.28rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              background: isPaid ? '#dcfce7' : isPending ? '#fef3c7' : isProc ? '#e0f2fe' : '#fee2e2',
              color: isPaid ? '#15803d' : isPending ? '#b45309' : isProc ? '#0369a1' : '#b91c1c',
              border: `1px solid ${isPaid ? '#bbf7d0' : isPending ? '#fde68a' : isProc ? '#bae6fd' : '#fecdd3'}`,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isPaid ? '#16a34a' : isPending ? '#d97706' : isProc ? '#0284c7' : '#dc2626',
              }}
            />
            <span>{isPaid ? 'Paid' : isPending ? 'Pending' : isProc ? 'Processing' : s}</span>
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
            title="Click to copy UTR reference"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              padding: '0.28rem 0.65rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 700,
              color: copiedUtr === val ? '#16a34a' : '#0284c7',
              transition: 'all 0.2s ease',
            }}
          >
            {copiedUtr === val ? <Check size={12} color="#16a34a" /> : <Copy size={12} color="#0284c7" />}
            <span>{val}</span>
          </button>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> Under Processing
          </span>
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            padding: '0.38rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.76rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Receipt size={13} />
          <span>Receipt</span>
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
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
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 3D Hero Header Banner */}
      <div
        className="van-catalog-hero"
        style={{
          background: 'linear-gradient(135deg, #0b1329 0%, #172554 40%, #1e3a8a 100%)',
          borderRadius: '24px',
          padding: '2.5rem 2.5rem',
          color: '#ffffff',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Decorative Ambient Background Rings */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          {/* Left: 3D Floating Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', flex: '1 1 500px' }}>
            <div
              className="van-avatar-3d-orb"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 50%, #1D4ED8 100%)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 12px 28px -4px rgba(37, 99, 235, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.7), inset 0 -3px 4px rgba(30, 58, 138, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <History size={38} strokeWidth={2.4} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(255, 255, 255, 0.12)',
                    padding: '0.3rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#93C5FD',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <span className="van-live-pulse-dot" style={{ width: '8px', height: '8px', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8', flexShrink: 0 }} />
                  <span>Audit Trail & Withdrawal Archive</span>
                </div>

                {isKycVerified ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(34, 197, 94, 0.2)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#86efac',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                    }}
                  >
                    <CheckCircle2 size={12} color="#4ade80" />
                    <span>KYC Verified</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNav('kyc-verification')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(245, 158, 11, 0.22)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#fef08a',
                      border: '1px solid rgba(251, 191, 36, 0.55)',
                      cursor: 'pointer',
                    }}
                  >
                    <AlertTriangle size={12} color="#fbbf24" />
                    <span>KYC Pending</span>
                  </button>
                )}
              </div>

              <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '0 0 0.45rem 0', color: '#ffffff', letterSpacing: '-0.025em' }}>
                Payout History & Disbursement Ledger
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', maxWidth: '720px', margin: 0, lineHeight: 1.55 }}>
                Complete chronological ledger of all requested and disbursed commission payments, UTR transaction references, 5% statutory TDS deductions, and downloadable vouchers.
              </p>
            </div>
          </div>

          {/* Right: Glass Quick Metric + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.85rem', flexShrink: 0 }}>
            {/* Quick Metric Pod */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '16px',
                padding: '0.85rem 1.4rem',
                textAlign: 'center',
                minWidth: '220px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#c7d2fe',
                  fontWeight: 800,
                  display: 'block',
                }}
              >
                Total Net Realized
              </span>
              <div
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 900,
                  color: '#34d399',
                  marginTop: '0.15rem',
                  textShadow: '0 2px 10px rgba(52, 211, 153, 0.35)',
                }}
              >
                {formatINR(summary?.totalWithdrawnNet || 0)}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
                {summary?.completedCount || 0} Successful Disbursals
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fetchHistory(true)}
                disabled={refreshing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.52rem 1.05rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
                <span>{refreshing ? 'Syncing...' : 'Sync Ledger'}</span>
              </button>

              <button
                type="button"
                onClick={exportLedgerCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.52rem 1.25rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                  color: '#1e3a8a',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                <FileSpreadsheet size={15} color="#2563EB" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Statistics Cards (Strictly 1 Row on Desktop) */}
      <div className="van-rewards-kpi-row">
        {/* Card 1: Total Net Withdrawn */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #34D399, #059669)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#059669' }}>
                Total Net Withdrawn
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-emerald" title="Total Net Withdrawn">
                <Banknote size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#059669' }}>
              <span>{formatINR(summary?.totalWithdrawnNet || 0)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Realized bank credits
            </span>
            <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
              Disbursed
            </span>
          </div>
        </div>

        {/* Card 2: Total 5% TDS Deducted */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #F87171, #DC2626)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#DC2626' }}>
                Total 5% TDS Deducted
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-red" title="Total 5% TDS Deducted">
                <Receipt size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#DC2626' }}>
              <span>{formatINR(summary?.totalTdsDeducted || 0)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Section 194H statutory tax
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECDD3' }}>
              Statutory 5%
            </span>
          </div>
        </div>

        {/* Card 3: Pending Requests Queue */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #FBBF24, #D97706)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#D97706' }}>
                Pending Requests Queue
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-amber" title="Pending Requests">
                <Clock size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: (summary?.totalPendingAmount || 0) > 0 ? '#B45309' : '#64748B' }}>
              <span>{formatINR(summary?.totalPendingAmount || 0)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Awaiting admin approval
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
              {summary?.pendingCount || 0} Pending
            </span>
          </div>
        </div>

        {/* Card 4: Completed Transactions */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #60A5FA, #2563EB)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#2563EB' }}>
                Completed Transactions
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-blue" title="Completed Transactions">
                <CheckCheck size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#2563EB' }}>
              <span>{summary?.completedCount || 0} Transfers</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Successfully settled
            </span>
            <span className="van-card-badge-pill" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              Settled
            </span>
          </div>
        </div>
      </div>

      {/* Sleek Unified 3D Filter & Command Bar */}
      <div
        className="van-dir-toolbar-3d"
        style={{
          padding: '1.25rem 1.6rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} color="#64748B" />
              <span>Range:</span>
            </span>
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
                  padding: '0.42rem 0.85rem',
                  borderRadius: '10px',
                  border: datePreset === dp.id ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: datePreset === dp.id ? '#eff6ff' : '#ffffff',
                  color: datePreset === dp.id ? '#1d4ed8' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: datePreset === dp.id ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                }}
              >
                {dp.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers + Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Custom From / To */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', padding: '0.3rem 0.65rem', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ padding: '0.25rem 0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', outline: 'none' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ padding: '0.25rem 0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', outline: 'none' }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  background: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">All Payout Statuses</option>
                <option value="pending">⏳ Pending Approval</option>
                <option value="completed">✓ Paid / Completed</option>
                <option value="rejected">✕ Rejected / Refunded</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(datePreset !== 'all' || startDate || endDate || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setDatePreset('all');
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('all');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.42rem 0.75rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}

            {/* Records Count Pill */}
            <span
              style={{
                background: '#f1f5f9',
                color: '#334155',
                fontSize: '0.76rem',
                fontWeight: 800,
                padding: '0.42rem 0.8rem',
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
              }}
            >
              {payoutsList.length} Record{payoutsList.length === 1 ? '' : 's'}
            </span>
          </div>
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
          onClick={() => setSelectedReceipt(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '22px',
              width: '100%',
              maxWidth: '540px',
              padding: '2.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1.5px solid #e2e8f0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Accent Strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2563eb, #7c3aed, #10b981)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="van-3d-kpi-icon van-3d-icon-blue" style={{ width: '44px', height: '44px', borderRadius: '12px' }}>
                  <Receipt size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Official Disbursement Receipt
                  </span>
                  <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedReceipt.payout_code}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Member Code & Name:</span>
                <strong style={{ color: '#0f172a' }}>{selectedReceipt.member_name || currentUser?.name || 'Member'} ({selectedReceipt.user_code || userCode})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Request Date:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedReceipt.request_date ? formatDateTime(selectedReceipt.request_date) : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Payout Channel:</span>
                <strong style={{ color: '#0f172a' }}>
                  {selectedReceipt.bank_name ? `${selectedReceipt.bank_name} (${selectedReceipt.account_number || '••••'})` : (selectedReceipt.upi_id || selectedReceipt.payment_method || 'IMPS/NEFT')}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Gross Requested:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.95rem' }}>{formatINR(selectedReceipt.requested_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
                <span>Statutory 5% TDS (Section 194H):</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>- {formatINR(selectedReceipt.tds_deduction)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '2px solid #e2e8f0', fontSize: '1.08rem', color: '#16a34a' }}>
                <strong style={{ color: '#0f172a' }}>Net Disbursed Amount:</strong>
                <strong style={{ fontFamily: 'monospace' }}>{formatINR(selectedReceipt.net_payable_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Settlement Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedReceipt.status === 'completed' ? '#15803d' : '#b45309' }}>
                  ● {selectedReceipt.status}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Bank UTR / Reference ID:</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{selectedReceipt.utr_number || 'Under Processing'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.75rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Printer size={16} />
                <span>Print Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PayoutHistory;