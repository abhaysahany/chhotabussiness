import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Search,
  X,
  ShieldCheck,
  ArrowUpRight,
  FileText,
  Building2,
  Printer,
  Copy,
  ChevronRight,
  Filter,
  Zap,
  Calendar,
} from 'lucide-react';
import { getUserPayouts } from '../../api/userPayoutService';
import { getUserFreshProfile } from '../../api/userRewardService';
import { formatINR } from '../../utils/formatters';
import { formatDate, formatDateTime } from '../../utils/timezone';
import DataTable from '../common/DataTable';

function CurrentPayouts({ user, onNavigate }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';

  const [payoutsData, setPayoutsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleNav = (target) => {
    if (typeof onNavigate === 'function') {
      onNavigate(target);
    } else {
      navigate(target.startsWith('/') ? target : `/${target}`);
    }
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

  // Filtered payouts by client search query
  const filteredPayouts = useMemo(() => {
    return payoutsList.filter((row) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = String(row.payout_code || '').toLowerCase().includes(q);
        const utrMatch = String(row.utr_number || '').toLowerCase().includes(q);
        const bankMatch = String(row.bank_name || '').toLowerCase().includes(q);
        const accMatch = String(row.account_number || '').toLowerCase().includes(q);
        const methodMatch = String(row.payment_method || '').toLowerCase().includes(q);
        const dateMatch = String(row.request_date || '').toLowerCase().includes(q);
        if (!codeMatch && !utrMatch && !bankMatch && !accMatch && !methodMatch && !dateMatch) {
          return false;
        }
      }
      return true;
    });
  }, [payoutsList, searchQuery]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Payout Reference & Date',
      accessor: 'payout_code',
      render: (val, row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                color: '#1e40af',
                fontSize: '0.85rem',
                background: '#eff6ff',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #bfdbfe',
              }}
            >
              {val}
            </span>
            <button
              type="button"
              onClick={() => copyUtr(val)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.1rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Copy Payout Code"
            >
              <Copy size={13} />
            </button>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} color="#94a3b8" />
            <span>{formatDate(row.request_date)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Payment Channel / Bank',
      accessor: 'payment_method',
      render: (val, row) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.85rem' }}>
            {val || 'Direct Bank Transfer'}
          </strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
            <Building2 size={13} color="#6366f1" />
            <span>{row.bank_name ? `${row.bank_name} (${row.account_number || '••••'})` : (row.upi_id || 'IMPS/NEFT')}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Gross Amount',
      accessor: 'requested_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: '5% TDS',
      accessor: 'tds_deduction',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.825rem' }}>
          - {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Net Payable',
      accessor: 'net_payable_amount',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
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
        const isCompleted = s === 'completed' || s === 'paid' || s === 'settled';
        const isPending = s === 'pending';
        const isProcessing = s === 'processing';

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.24rem 0.7rem',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              background: isCompleted ? '#ecfdf5' : isProcessing ? '#eff6ff' : isPending ? '#fffbeb' : '#fef2f2',
              color: isCompleted ? '#059669' : isProcessing ? '#0284c7' : isPending ? '#b45309' : '#dc2626',
              border: `1px solid ${
                isCompleted ? '#a7f3d0' : isProcessing ? '#bfdbfe' : isPending ? '#fde68a' : '#fecaca'
              }`,
            }}
          >
            {isCompleted && <CheckCircle2 size={12} strokeWidth={2.5} />}
            {isPending && <Clock size={12} strokeWidth={2.5} />}
            <span>{isCompleted ? 'Paid / Settled' : isPending ? 'Pending Approval' : s}</span>
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
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '0.22rem 0.55rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#0284c7',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Copy size={12} />
            <span>{val}</span>
          </button>
        ) : (
          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>Awaiting UTR</span>
        ),
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      align: 'right',
      render: (_val, row) => (
        <button
          type="button"
          onClick={() => setSelectedReceipt(row)}
          style={{
            background: '#ffffff',
            color: '#1e40af',
            border: '1.5px solid #bfdbfe',
            padding: '0.4rem 0.9rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(30, 64, 175, 0.08)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.borderColor = '#93c5fd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#bfdbfe';
          }}
        >
          <FileText size={14} />
          <span>Voucher</span>
        </button>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1.25rem 3.5rem 1.25rem' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            padding: '0.9rem 1.5rem',
            borderRadius: '12px',
            zIndex: 99999,
            boxShadow: '0 12px 30px -5px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            fontWeight: 700,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} color="#38BDF8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Signature 2-Color Gradient Hero Header Banner with 3D Depth */}
      <div className="van-catalog-hero-3d">
        <div className="van-catalog-hero-content">
          <div className="van-catalog-hero-icon-orb">
            <Coins size={32} strokeWidth={2.2} />
          </div>
          <div>
            <div className="van-catalog-hero-badge">
              <span
                className="van-live-pulse-dot"
                style={{ width: '7px', height: '7px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }}
              />
              <Sparkles size={13} />
              <span>Finance • Commission Settlements & Payouts</span>
              {isKycVerified ? (
                <span style={{ background: '#22c55e', color: '#ffffff', padding: '0.12rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                  ✓ KYC Verified
                </span>
              ) : (
                <span style={{ background: '#f59e0b', color: '#ffffff', padding: '0.12rem 0.55rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>
                  ⚠️ KYC Pending
                </span>
              )}
            </div>
            <h1 className="van-catalog-hero-title">
              Current Payouts & Settlements
            </h1>
            <p className="van-catalog-hero-desc">
              Real-time ledger of your available commission balance, withdrawal requests, expected bank disbursements, and statutory 5% TDS records.
            </p>
          </div>
        </div>

        {/* Right Balance Pod & Action Controls */}
        <div
          className="van-directs-hero-action-col"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.85rem',
            flexShrink: 0,
          }}
        >
          {/* Available Wallet Glass Pod */}
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
              Available Wallet Balance
            </span>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 900,
                color: '#34d399',
                marginTop: '0.15rem',
                textShadow: '0 2px 10px rgba(52, 211, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <span>{formatINR(availableBalance)}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#93c5fd', marginTop: '0.15rem', display: 'block' }}>
              Cycle: Weekly Tuesday Clearance
            </span>
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fetchPayouts(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Database'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('payout-withdraw')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.48rem 1.15rem',
                borderRadius: '9999px',
                border: '1px solid rgba(52, 211, 153, 0.5)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <Zap size={14} />
              <span>Request Withdrawal (Min ₹500)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KYC Alert Banner if Not Verified */}
      {!isKycVerified && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1.5px solid #FDE68A',
            borderRadius: '16px',
            padding: '1.15rem 1.45rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <strong style={{ color: '#92400e', display: 'block', fontSize: '0.925rem' }}>
                KYC Verification is Mandatory for Commission Withdrawals
              </strong>
              <span style={{ color: '#b45309', fontSize: '0.825rem' }}>
                Your current KYC status is <strong>{summary.kycStatus || 'Unverified'}</strong>. Please verify PAN and Bank Account to enable ₹500+ withdrawals.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNav('bank-accounts')}
            style={{
              background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              fontSize: '0.825rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
            }}
          >
            <span>Complete KYC Now</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* 5 Core Statistics Cards (Strictly 1 Row on Desktop) */}
      <div className="van-payouts-kpi-row">
        {/* Card 1: Available Wallet Balance */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #34D399, #059669)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#059669' }}>
                Available Wallet
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-emerald" title="Available Balance">
                <Wallet size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#059669' }}>
              <span>{formatINR(availableBalance)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: availableBalance >= 500 ? '#059669' : '#64748B', fontWeight: 600 }}>
              {availableBalance >= 500 ? 'Ready to withdraw' : 'Min ₹500 required'}
            </span>
            <span className="van-card-badge-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
              Wallet
            </span>
          </div>
        </div>

        {/* Card 2: Pending Requests */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #FBBF24, #D97706)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#D97706' }}>
                Pending Requests
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-amber" title="Pending Requests">
                <Clock size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: summary.totalPendingAmount > 0 ? '#b45309' : '#64748b' }}>
              <span>{formatINR(summary.totalPendingAmount)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Awaiting admin approval
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
              {summary.pendingCount} Pending
            </span>
          </div>
        </div>

        {/* Card 3: Expected Net Payout */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #38BDF8, #0284C7)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#0284C7' }}>
                Expected Payout
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-cyan" title="Expected Payout">
                <ArrowUpRight size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#0284C7' }}>
              <span>{formatINR(summary.expectedPayoutAmount || (summary.totalPendingAmount * 0.95))}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Net credited after 5% TDS
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
              Credit
            </span>
          </div>
        </div>

        {/* Card 4: Total Payouts Settled */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #A855F7, #7C3AED)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#7C3AED' }}>
                Total Settled
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-purple" title="Total Settled">
                <CheckCircle2 size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#7C3AED' }}>
              <span>{formatINR(summary.totalWithdrawnNet)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Lifetime disbursements
            </span>
            <span className="van-card-badge-pill" style={{ background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
              {summary.completedCount} Paid
            </span>
          </div>
        </div>

        {/* Card 5: Total 5% TDS Deducted */}
        <div className="van-stat-card-premium" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px', background: 'linear-gradient(90deg, #F87171, #DC2626)' }} />
          <div>
            <div className="van-stat-card-top">
              <span className="van-stat-card-title" style={{ color: '#DC2626' }}>
                5% TDS Deducted
              </span>
              <div className="van-3d-kpi-icon van-3d-icon-red" title="5% TDS">
                <ShieldCheck size={20} strokeWidth={2.4} />
              </div>
            </div>
            <div className="van-stat-card-value" style={{ color: '#b91c1c' }}>
              <span>{formatINR(summary.totalTdsDeducted)}</span>
            </div>
          </div>
          <div className="van-stat-card-bottom">
            <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              Sec 194H Form 16A credit
            </span>
            <span className="van-card-badge-pill" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
              Tax Credit
            </span>
          </div>
        </div>
      </div>

      {/* Executive 2-Tier 3D Filter Command Toolbar */}
      <div className="van-dir-toolbar-3d" style={{ marginBottom: '1.75rem' }}>
        {/* Tier 1: Search Bar & Record Count */}
        <div className="van-dir-toolbar-top">
          <div className="van-dir-search-wrap" style={{ flex: '1 1 380px' }}>
            <div className="van-dir-search-icon-pod">
              <Search size={16} color="#2563EB" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by payout code, UTR reference, bank name, or payment channel..."
              className="van-dir-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="van-dir-search-clear"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="van-dir-count-pill">
              {filteredPayouts.length} Payout{filteredPayouts.length === 1 ? '' : 's'} Found
            </span>

            <button
              type="button"
              onClick={() => fetchPayouts(true)}
              disabled={refreshing}
              title="Sync payouts with database"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.52rem 0.95rem',
                borderRadius: '9999px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={14} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Payouts'}</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="van-dir-toolbar-divider" />

        {/* Tier 2: Date Presets & Custom Pickers + Status Filter */}
        <div className="van-dir-toolbar-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Left: Date Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={14} />
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
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: datePreset === dp.id ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: datePreset === dp.id ? '#eff6ff' : '#ffffff',
                  color: datePreset === dp.id ? '#1d4ed8' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {dp.label}
              </button>
            ))}
          </div>

          {/* Right: Custom Date Pickers & Status Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ border: 'none', background: 'transparent', fontSize: '0.78rem', color: '#334155', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ border: 'none', background: 'transparent', fontSize: '0.78rem', color: '#334155', outline: 'none' }}
              />
            </div>

            {/* Status Dropdown Capsule */}
            <div className="van-dir-filter-capsule">
              <ShieldCheck size={15} color="#10b981" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Payout Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="completed">Paid / Completed</option>
                <option value="rejected">Rejected / Refunded</option>
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || statusFilter !== 'all' || datePreset !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDatePreset('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="van-dir-reset-btn"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payout History DataTable Container */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.04)',
        }}
      >
        <DataTable
          columns={columns}
          data={filteredPayouts}
          defaultPageSize={10}
          searchable={false}
          showPageSize={false}
          loading={loading}
          emptyMessage="No payout records found matching your selected date and status filters."
        />
      </div>

      {/* ============================================================== */}
      {/* MODAL: COMMISSION PAYOUT VOUCHER VIEW                          */}
      {/* ============================================================== */}
      {selectedReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.45)',
              border: '1.5px solid #e2e8f0',
              padding: '2.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    marginBottom: '0.4rem',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <FileText size={14} />
                  <span>PAYOUT SETTLEMENT VOUCHER</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {selectedReceipt.payout_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
              >
                ✕
              </button>
            </div>

            {/* Voucher Details Table */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px solid #e2e8f0',
                padding: '1.25rem 1.4rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Beneficiary Member:</span>
                <strong style={{ color: '#0f172a' }}>{selectedReceipt.member_name || user?.name} ({selectedReceipt.user_code || userCode})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Request Timestamp:</span>
                <span>{selectedReceipt.request_date ? formatDateTime(selectedReceipt.request_date) : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Gross Commission Claimed:</span>
                <strong style={{ color: '#0f172a' }}>{formatINR(selectedReceipt.requested_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>
                <span>Statutory 5% TDS (Sec 194H):</span>
                <strong>- {formatINR(selectedReceipt.tds_deduction)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '2px solid #e2e8f0', fontSize: '1.05rem', color: '#059669' }}>
                <strong>Net Disbursed to Account:</strong>
                <strong>{formatINR(selectedReceipt.net_payable_amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Settlement Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedReceipt.status === 'completed' ? '#059669' : '#b45309' }}>
                  ● {selectedReceipt.status}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>UTR / Reference Number:</span>
                <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{selectedReceipt.utr_number || 'Under Bank Processing'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Account / UPI Destination:</span>
                <span style={{ fontWeight: 600 }}>{selectedReceipt.account_number || selectedReceipt.upi_id || 'Registered Bank Account'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <Printer size={15} />
                <span>Print Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                }}
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