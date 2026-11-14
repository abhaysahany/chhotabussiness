import React from 'react';
import {
  Layers,
  Calendar,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { formatDateTime } from '../../utils/timezone';

function OrderLevelIncomeCard({ record, onViewDetails }) {
  if (!record) return null;

  const recordId = record.id;
  const orderId = record.order_id || record.orderId || null;
  const invoiceNumber = record.invoice_number || record.invoiceNumber || (orderId ? `INV-${orderId}` : `LI-${recordId}`);
  const levelNum = Number(record.level || record.level_number || record.levelNumber || 2);
  const sourceMember = record.source_member || record.level_id || record.sourceMember || 'Team Member';
  const paymentType = (record.payment_type || record.paymentType || 'advance').toLowerCase();
  const createdDate = record.created_at || record.createdAt;

  const totalAmount = Number(record.amount ?? record.total_amount ?? record.totalAmount ?? 0);
  const paidAmount = Number(record.paid_amount ?? record.paidAmount ?? totalAmount);
  const balanceAmount = Number(record.balance_amount ?? record.balanceAmount ?? 0);

  // Level Badge configuration (40/30/20/10 pool shares)
  const getLevelConfig = (lvl) => {
    switch (lvl) {
      case 2:
        return { label: 'Level 2', share: '40% Pool Share', bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' };
      case 3:
        return { label: 'Level 3', share: '30% Pool Share', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 4:
        return { label: 'Level 4', share: '20% Pool Share', bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 5:
        return { label: 'Level 5', share: '10% Pool Share', bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
      default:
        return { label: `Level ${lvl}`, share: 'Team Tier', bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
    }
  };

  const levelCfg = getLevelConfig(levelNum);

  // Distribution status badge
  const isPaid = paidAmount >= totalAmount && totalAmount > 0;
  const statusBadge = isPaid
    ? { label: 'Credited to Wallet', icon: <CheckCircle2 size={13} />, bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
    : balanceAmount > 0
    ? { label: 'Partial Balance', icon: <Clock size={13} />, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    : { label: 'Active', icon: <AlertCircle size={13} />, bg: '#fefce8', color: '#a16207', border: '#fef08a' };

  return (
    <div
      onClick={() => onViewDetails && onViewDetails(orderId || recordId)}
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = '#93c5fd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '1.15rem 1.35rem',
          borderBottom: '1px solid #f1f5f9',
          background: '#fafbfc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '0.1rem',
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '0.02em',
                }}
              >
                {orderId ? `Order #${orderId}` : `Record #${recordId}`}
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span
                style={{
                  fontSize: '0.76rem',
                  fontFamily: 'monospace',
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '5px',
                  fontWeight: 700,
                }}
              >
                {invoiceNumber}
              </span>
              <span
                style={{
                  background: levelCfg.bg,
                  border: `1px solid ${levelCfg.border}`,
                  color: levelCfg.text,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                }}
              >
                {levelCfg.label}
              </span>
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.12rem 0.45rem',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                }}
              >
                {paymentType} Payment
              </span>
            </div>

            <h3
              style={{
                margin: '0.35rem 0 0 0',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {levelCfg.label} Team Commission Allocation
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                marginTop: '0.35rem',
                fontSize: '0.78rem',
                color: '#64748b',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} color="#94a3b8" />
                <span>Source Member: <strong style={{ color: '#1e293b' }}>{sourceMember}</strong></span>
              </span>
              {createdDate && (
                <>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="#94a3b8" />
                    <span>{formatDateTime(createdDate)}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: statusBadge.bg,
              color: statusBadge.color,
              border: `1px solid ${statusBadge.border}`,
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            {levelCfg.share}
          </span>
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div style={{ background: '#f8fafc', padding: '0.65rem 1.35rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.74rem' }}>
          <span style={{ color: '#475569', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <TrendingUp size={13} color="#2563eb" />
            <span>Level Allocation Fulfillment:</span>
          </span>
          <span style={{ fontWeight: 800, color: isPaid ? '#15803d' : '#1d4ed8' }}>
            {isPaid ? '100% Settled' : 'In Progress'} ({formatINR(paidAmount)} / {formatINR(totalAmount)})
          </span>
        </div>
        <div
          style={{
            height: '6px',
            background: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: totalAmount > 0 ? `${Math.min(100, Math.round((paidAmount / totalAmount) * 100))}%` : '100%',
              background: isPaid ? '#10b981' : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div
        style={{
          padding: '1.25rem 1.35rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Metric 1: Total Level Income */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            borderLeft: '3px solid #2563eb',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Total Level Income
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {formatINR(totalAmount)}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>
            {levelCfg.label} ({levelCfg.share})
          </div>
        </div>

        {/* Metric 2: Paid Amount */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            borderLeft: '3px solid #16a34a',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Credited to Wallet
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
            {formatINR(paidAmount)}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#16a34a', marginTop: '0.15rem', fontWeight: 600 }}>
            ● Successfully disbursed
          </div>
        </div>

        {/* Metric 3: Remaining Balance */}
        <div
          style={{
            background: balanceAmount > 0 ? '#fefce8' : '#f8fafc',
            border: balanceAmount > 0 ? '1px solid #fef08a' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            borderLeft: balanceAmount > 0 ? '3px solid #f59e0b' : '3px solid #cbd5e1',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: balanceAmount > 0 ? '#854d0e' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Remaining Balance
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: balanceAmount > 0 ? '#a16207' : '#64748b', marginTop: '0.25rem' }}>
            {formatINR(balanceAmount)}
          </div>
          <div style={{ fontSize: '0.68rem', color: balanceAmount > 0 ? '#b45309' : '#94a3b8', marginTop: '0.15rem' }}>
            {balanceAmount > 0 ? 'Awaiting next payments' : 'Zero balance due'}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div
        style={{
          padding: '0.9rem 1.35rem',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <span>Allocation Tier: <strong style={{ color: '#0f172a' }}>{levelCfg.label}</strong></span>
          <span style={{ margin: '0 0.4rem', color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#64748b' }}>
            {createdDate ? `Recorded: ${formatDateTime(createdDate)}` : 'Verified Ledger Entry'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails(orderId || recordId);
          }}
          style={{
            padding: '0.55rem 1.15rem',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
        >
          <span>View Full Details</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default OrderLevelIncomeCard;
