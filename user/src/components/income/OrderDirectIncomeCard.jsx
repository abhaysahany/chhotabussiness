import {
  Package,
  Calendar,
  User,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { formatDateTime } from '../../utils/timezone';

function OrderDirectIncomeCard({ order, onViewDetails }) {
  if (!order) return null;

  const orderId = order.order_id || order.id || order.orderId;
  const invoiceNumber = order.invoice_number || order.invoiceNumber || `ORD-${orderId}`;
  const itemName = order.item_name || order.itemName || 'Custom Product / Service';
  const itemType = order.item_type || order.itemType || 'package';
  const category = order.category || 'General';
  const sourceUserCode = order.source_user_code || order.sourceUserCode || '—';
  const sourceUserName = order.source_user_name || order.sourceUserName || 'Purchasing Member';
  const orderDate = order.order_date || order.orderDate || order.created_at;

  const orderGross = Number(order.order_gross_amount ?? order.orderGrossAmount ?? 0);
  const expectedDirect = Number(order.total_expected_amount ?? order.totalExpectedAmount ?? 0);
  const receivedDirect = Number(order.total_distributed_amount ?? order.totalDistributedAmount ?? 0);
  const pendingDirect = Number(order.total_pending_amount ?? order.totalPendingAmount ?? 0);
  const dumpDirect = Number(order.total_dump_amount ?? order.totalDumpAmount ?? 0);
  const distributionCount = Number(order.distribution_count ?? order.distributionCount ?? 0);
  const distributionStatus = (order.distribution_status || order.distributionStatus || 'pending').toLowerCase();
  const lastDistributionAt = order.last_distribution_at || order.lastDistributionAt;

  // Calculate percentage of expected direct income collected
  const progressPercent = expectedDirect > 0
    ? Math.min(100, Math.max(0, Math.round((receivedDirect / expectedDirect) * 100)))
    : 0;

  // Status Badge Configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: <CheckCircle2 size={13} />,
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#bbf7d0',
        };
      case 'partial':
        return {
          label: 'Partial Distribution',
          icon: <Clock size={13} />,
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
        };
      case 'pending':
      default:
        return {
          label: 'Pending Distribution',
          icon: <AlertCircle size={13} />,
          bg: '#fefce8',
          color: '#a16207',
          border: '#fef08a',
        };
    }
  };

  const statusBadge = getStatusBadge(distributionStatus);

  return (
    <div
      onClick={() => onViewDetails && onViewDetails(orderId)}
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
            <Package size={22} />
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
                Order #{orderId}
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
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                }}
              >
                {category}
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
                {itemType}
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
              {itemName}
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
                <span>Buyer: <strong style={{ color: '#1e293b' }}>{sourceUserName}</strong> ({sourceUserCode})</span>
              </span>
              {orderDate && (
                <>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="#94a3b8" />
                    <span>{formatDateTime(orderDate, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
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
            {distributionCount} distribution{distributionCount === 1 ? '' : 's'} recorded
          </span>
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div style={{ background: '#f8fafc', padding: '0.65rem 1.35rem', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.74rem' }}>
          <span style={{ color: '#475569', fontWeight: 600 }}>
            Direct Income Distribution Progress:
          </span>
          <span style={{ fontWeight: 800, color: progressPercent >= 100 ? '#15803d' : '#1d4ed8' }}>
            {progressPercent}% Received ({formatINR(receivedDirect)} / {formatINR(expectedDirect)})
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
              width: `${progressPercent}%`,
              background: progressPercent >= 100
                ? '#10b981'
                : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
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
        {/* Metric 1: Expected Direct Income */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Expected Direct
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {formatINR(expectedDirect)}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>
            Max eligible direct
          </div>
        </div>

        {/* Metric 2: Received Direct Income */}
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Received Direct
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
            {formatINR(receivedDirect)}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#16a34a', marginTop: '0.15rem', fontWeight: 600 }}>
            ● Credited to wallet
          </div>
        </div>

        {/* Metric 3: Pending Direct Income */}
        <div
          style={{
            background: pendingDirect > 0 ? '#fefce8' : '#f8fafc',
            border: pendingDirect > 0 ? '1px solid #fef08a' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: pendingDirect > 0 ? '#854d0e' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Pending Direct
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: pendingDirect > 0 ? '#a16207' : '#64748b', marginTop: '0.25rem' }}>
            {formatINR(pendingDirect)}
          </div>
          <div style={{ fontSize: '0.68rem', color: pendingDirect > 0 ? '#b45309' : '#94a3b8', marginTop: '0.15rem' }}>
            {pendingDirect > 0 ? 'Awaiting next payments' : 'No balance due'}
          </div>
        </div>

        {/* Metric 4: Approved Dump Direct Income */}
        <div
          style={{
            background: dumpDirect > 0 ? '#faf5ff' : '#f8fafc',
            border: dumpDirect > 0 ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: dumpDirect > 0 ? '#6b21a8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Approved Dump
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: dumpDirect > 0 ? '#7c3aed' : '#64748b', marginTop: '0.25rem' }}>
            {formatINR(dumpDirect)}
          </div>
          <div style={{ fontSize: '0.68rem', color: dumpDirect > 0 ? '#7c3aed' : '#94a3b8', marginTop: '0.15rem' }}>
            {dumpDirect > 0 ? 'Write-off (No wallet credit)' : 'Zero dump'}
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
          <span>Order Gross Value: <strong style={{ color: '#0f172a' }}>{formatINR(orderGross)}</strong></span>
          <span style={{ margin: '0 0.4rem', color: '#cbd5e1' }}>•</span>
          <span style={{ color: '#64748b' }}>
            {lastDistributionAt ? `Last active: ${formatDateTime(lastDistributionAt, { day: '2-digit', month: 'short', year: 'numeric' })}` : 'No distribution timestamp'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails && onViewDetails(orderId);
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

export default OrderDirectIncomeCard;
