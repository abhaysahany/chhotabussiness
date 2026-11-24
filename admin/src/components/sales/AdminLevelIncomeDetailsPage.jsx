import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  User,
  Users,
  Layers,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Receipt,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { getAdminLevelIncomeOrderDetails } from '../../api/adminIncomeService';
import { formatDate, formatDateTime } from '../../utils/timezone';

function AdminLevelIncomeDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleBack = () => {
    navigate('/income/level-orders');
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!orderId) {
        setError('No Order ID specified in URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await getAdminLevelIncomeOrderDetails(orderId);
        if (!isMounted) return;

        if (res && (res.audit || res.data || res.status === 'success')) {
          setDetails(res?.audit || res?.data || res);
        } else {
          setError(res?.message || `Failed to retrieve order level income details for Order #${orderId}.`);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching admin level income order details:', err);
        setError(
          err?.message ||
          err?.error ||
          'Unable to connect to level income reporting service or order not found.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId, retryCount]);

  const orderIdResolved = details?.order_id || orderId;
  const invoiceNumber = details?.invoice_number || 'N/A';
  const entity = details?.entity || {};
  const buyer = details?.buyer || {};
  const sponsor = details?.sponsor || {};
  const financials = details?.financials || {};
  const levels = details?.levels || [];
  const installments = details?.installments || [];

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isReconciled =
    financials?.reconciliation_status === 'Reconciled' ||
    financials?.reconciliation_status === 'Balanced' ||
    (financials?.reconciliation_difference ?? 0) === 0;

  // Level income settlement status helper
  const getLevelIncomeStatus = () => {
    const expected = Number(financials.total_expected_amount || 0);
    const distributed = Number(financials.total_distributed_amount || 0);
    const pending = Number(financials.total_pending_amount || 0);

    if (expected > 0 && pending <= 0 && distributed >= expected) {
      return {
        label: 'Fully Distributed',
        bg: '#ecfdf5',
        text: '#059669',
        border: '#a7f3d0',
      };
    }

    if (distributed > 0 && pending > 0) {
      return {
        label: 'Partially Distributed',
        bg: '#eff6ff',
        text: '#2563eb',
        border: '#bfdbfe',
      };
    }

    return {
      label: 'Pending Allocation',
      bg: '#fffbeb',
      text: '#d97706',
      border: '#fde68a',
    };
  };

  const levelStatus = getLevelIncomeStatus();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
      {/* 1. TOP BAR / ACTION NAVIGATION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '0.5rem 0.95rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#334155',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
        >
          <ArrowLeft size={16} />
          <span>Back to Level Income</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
            }}
          >
            Read-Only Audit &bull; Order #{orderIdResolved}
          </span>
          <button
            type="button"
            onClick={() => navigate('/orders')}
            style={{
              background: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.2)',
            }}
          >
            <span>View in Orders</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '4rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              width: '36px',
              height: '36px',
              border: '3px solid #cbd5e1',
              borderTopColor: '#7c3aed',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '0.85rem',
            }}
          />
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Loading Multi-Level Order Audit...
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
            Fetching verified upline distributions from total_level_incomes &amp; level_incomes
          </p>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {!loading && error && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fecaca',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#991b1b' }}>
            Unable to Load Level Audit
          </h3>
          <p style={{ margin: '0 auto 1.25rem auto', fontSize: '0.85rem', color: '#b91c1c', maxWidth: '460px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retry Retrieval
            </button>
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Back to Level Income
            </button>
          </div>
        </div>
      )}

      {/* 4. SUCCESS PRESENTATION */}
      {!loading && !error && details && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  Order #{orderIdResolved}
                </h1>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '6px',
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    border: '1px solid #ddd6fe',
                  }}
                >
                  Invoice: {invoiceNumber}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '6px',
                    background: levelStatus.bg,
                    color: levelStatus.text,
                    border: `1px solid ${levelStatus.border}`,
                  }}
                >
                  {levelStatus.label}
                </span>
              </div>

              {/* Reconciliation Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: isReconciled ? '#dcfce7' : '#fef3c7',
                    color: isReconciled ? '#15803d' : '#b45309',
                    border: `1px solid ${isReconciled ? '#bbf7d0' : '#fde68a'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {isReconciled ? <CheckCircle2 size={14} color="#15803d" /> : <AlertTriangle size={14} color="#b45309" />}
                  <span>Reconciliation: {financials.reconciliation_status || 'Reconciled'}</span>
                </span>
              </div>
            </div>

            {/* Compact Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                fontSize: '0.82rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '0.9rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>SELLER ENTITY</span>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{entity.name || 'N/A'}</strong>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', textTransform: 'capitalize' }}>
                  {entity.type || 'Business'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>BUYER MEMBER</span>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                  {buyer.name || 'Member'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, display: 'block' }}>
                  ID: {buyer.user_code || 'N/A'}
                  {buyer.phone && ` • ${buyer.phone}`}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>DIRECT SPONSOR (L1)</span>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                  {sponsor.name || 'Sponsor'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, display: 'block' }}>
                  ID: {sponsor.user_code || 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>ORDER DATE</span>
                <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                  {formatDate(details?.date || details?.created_at)}
                </strong>
              </div>
            </div>
          </div>

          {/* 5-Col Financial Breakdown Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Order Gross Value</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
                {formatCurrency(financials.gross_amount)}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Admin Platform Cut</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
                {formatCurrency(financials.admin_commission_cut)}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Expected Level Total</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.35rem' }}>
                {formatCurrency(financials.total_expected_amount)}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Distributed to Levels</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
                {formatCurrency(financials.total_distributed_amount)}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Pending Balance Due</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: Number(financials.total_pending_amount) > 0 ? '#d97706' : '#64748b', marginTop: '0.35rem' }}>
                {formatCurrency(financials.total_pending_amount)}
              </div>
            </div>
          </div>

          {/* SECTION 1: Multi-Level Allocation Table (from total_level_incomes) */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div
              style={{
                padding: '1.1rem 1.5rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Multi-Level Earnings Allocation (total_level_incomes)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Authoritative multi-tier upline breakdown (Level 2 to Level 5) for this transaction.
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#ede9fe',
                  color: '#6d28d9',
                  border: '1px solid #ddd6fe',
                }}
              >
                {levels.length} Upline Beneficiaries
              </span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: '850px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>LEVEL TIER</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>BENEFICIARY UPLINE</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'right', color: '#2563eb' }}>TOTAL EXPECTED</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'right', color: '#059669' }}>PAID (DISTRIBUTED)</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'right', color: '#d97706' }}>PENDING BALANCE</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'right', color: '#64748b' }}>DUMP</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        No level income records found for this order.
                      </td>
                    </tr>
                  ) : (
                    levels.map((lvl) => (
                      <tr key={lvl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              backgroundColor: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #ddd6fe',
                            }}
                          >
                            {lvl.level_label || `Level ${lvl.level}`}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{lvl.beneficiary_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Member ID: <strong style={{ color: '#7c3aed' }}>{lvl.user_code}</strong>
                            {lvl.beneficiary_phone && ` • ${lvl.beneficiary_phone}`}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(lvl.total_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(lvl.paid_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 800, color: lvl.balance_amount > 0 ? '#d97706' : '#64748b' }}>
                          {formatCurrency(lvl.balance_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', color: '#64748b' }}>
                          {formatCurrency(lvl.dump_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textTransform: 'capitalize',
                              backgroundColor:
                                lvl.status === 'completed'
                                  ? '#dcfce7'
                                  : lvl.status === 'partial'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                lvl.status === 'completed'
                                  ? '#166534'
                                  : lvl.status === 'partial'
                                  ? '#b45309'
                                  : '#991b1b',
                              border: `1px solid ${
                                lvl.status === 'completed'
                                  ? '#bbf7d0'
                                  : lvl.status === 'partial'
                                  ? '#fde68a'
                                  : '#fca5a5'
                              }`,
                            }}
                          >
                            {lvl.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: Installment Distribution History (from level_incomes) */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div
              style={{
                padding: '1.1rem 1.5rem',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Installment Payout Ledger (level_incomes)
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Granular distribution events recorded per milestone payment from buyer.
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                }}
              >
                {installments.length} Distribution Installments
              </span>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: '850px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>PAYOUT ID</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>MILESTONE TYPE</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>LEVEL TIER</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>BENEFICIARY</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800, textAlign: 'right', color: '#059669' }}>AMOUNT PAID</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 800 }}>EXECUTION TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                        No installment payouts recorded yet for this order.
                      </td>
                    </tr>
                  ) : (
                    installments.map((inst) => (
                      <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontWeight: 700 }}>
                          #{inst.id} {inst.payment_id ? `(Receipt #${inst.payment_id})` : ''}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              backgroundColor: inst.payment_type === 'advance' ? '#dbeafe' : '#fef3c7',
                              color: inst.payment_type === 'advance' ? '#1d4ed8' : '#b45309',
                              border: `1px solid ${inst.payment_type === 'advance' ? '#bfdbfe' : '#fde68a'}`,
                            }}
                          >
                            {inst.payment_type}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              backgroundColor: '#ede9fe',
                              color: '#6d28d9',
                              border: '1px solid #ddd6fe',
                            }}
                          >
                            {inst.level_label || `Level ${inst.level}`}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{inst.beneficiary_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>
                            Member ID: {inst.user_code}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          +{formatCurrency(inst.amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {formatDateTime(inst.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLevelIncomeDetailsPage;
