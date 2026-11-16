import React, { useState, useEffect, useCallback } from 'react';
import { getUserClaims, getUserFreshProfile } from '../../api/userRewardService';
import { formatDate } from '../../utils/timezone';
import DataTable from '../common/DataTable';

function RewardsClaimed({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      let activeCode = userCode;
      if (!activeCode) {
        const fresh = await getUserFreshProfile();
        if (fresh) {
          setCurrentUser(fresh);
          activeCode = fresh.user_code;
        }
      }
      const data = await getUserClaims(activeCode);
      setClaims(data || []);
    } catch (err) {
      console.error('Error loading database claims:', err);
      showToast('Could not load claims history from database.');
    } finally {
      setLoading(false);
    }
  }, [userCode]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const totalPointsSpent = claims.reduce((acc, curr) => acc + (Number(curr.points_deducted) || 0), 0);
  const inTransitCount = claims.filter((c) => c.status === 'dispatched').length;
  const deliveredCount = claims.filter((c) => c.status === 'delivered').length;

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Claim Reference',
      accessor: 'claim_code',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e3a8a', fontSize: '0.85rem' }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Reward Item',
      accessor: 'reward_title',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={row.reward_image || row.reward?.image || '/logo.png'}
            alt={val}
            style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
          />
          <div>
            <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.875rem', lineHeight: 1.3 }}>{val}</strong>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {row.reward?.category || 'Milestone Award'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row) => row.reward?.category || 'Milestone',
      render: (val) => (
        <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {val}
        </span>
      ),
    },
    {
      header: 'Market Worth',
      accessor: (row) => row.reward?.reward_value_inr || 0,
      align: 'right',
      render: (_val, row) => {
        const worth = row.reward?.reward_value_inr;
        return worth ? (
          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
            ₹{Number(worth).toLocaleString('en-IN')}
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
        );
      },
    },
    {
      header: 'Diamonds Redeemed',
      accessor: 'points_deducted',
      align: 'center',
      render: (val) => (
        <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800 }}>
          💎 {val} Diamonds
        </span>
      ),
    },
    {
      header: 'Delivery Address',
      accessor: 'shipping_address',
      render: (val, row) => (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.35, maxWidth: '200px' }}>
          {val}, {row.shipping_city} {row.shipping_state} - {row.shipping_pincode}
        </p>
      ),
    },
    {
      header: 'Claim Date',
      accessor: 'claim_date',
      render: (val) => (
        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
          {formatDate(val)}
        </span>
      ),
    },
    {
      header: 'Fulfillment Status',
      accessor: 'status',
      align: 'center',
      render: (val, row) => (
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background:
                val === 'delivered' ? '#dcfce7' :
                val === 'dispatched' ? '#e0f2fe' :
                val === 'pending' ? '#fef3c7' : '#fee2e2',
              color:
                val === 'delivered' ? '#15803d' :
                val === 'dispatched' ? '#0369a1' :
                val === 'pending' ? '#b45309' : '#b91c1c',
            }}
          >
            ● {val}
          </span>
          {row.tracking_number && (
            <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.25rem', fontWeight: 600 }}>
              {row.courier_partner}: <strong>{row.tracking_number}</strong>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      align: 'center',
      render: (_val, row) => (
        <button
          type="button"
          onClick={() => setSelectedClaim(row)}
          style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dbeafe';
            e.currentTarget.style.borderColor = '#93c5fd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.borderColor = '#bfdbfe';
          }}
        >
          <span>🔍</span> View Details
        </button>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>📦 Member Orders & Redemptions</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Claimed Rewards & Fulfillment History
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Track all your redeemed physical rewards, courier dispatch Air Waybills (AWB), and milestone delivery statuses with DataTable pagination.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={loadClaims}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              🔄 Refresh Orders
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Claims Placed</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0 0 0' }}>{claims.length}</h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Diamonds Redeemed</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '0.3rem 0 0 0' }}>{totalPointsSpent} Diamonds</h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>In Transit / Dispatched</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', margin: '0.3rem 0 0 0' }}>{inTransitCount}</h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Successfully Delivered</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '0.3rem 0 0 0' }}>{deliveredCount}</h2>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={claims}
        defaultPageSize={10}
        searchPlaceholder="Search by claim code, reward name, or location..."
        loading={loading}
        emptyMessage="You haven't claimed any rewards yet. Visit Available Rewards to redeem your Diamonds!"
      />

      {/* ============================================================== */}
      {/* CLAIM FULFILLMENT DETAILS MODAL                                */}
      {/* ============================================================== */}
      {selectedClaim && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSelectedClaim(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              padding: '2rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  <span>📦 CLAIM RECORD</span> • {selectedClaim.claim_code}
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Claim Fulfillment Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
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

            {/* Selected Reward Item Summary */}
            <div style={{ display: 'flex', gap: '1.25rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', alignItems: 'center' }}>
              <img
                src={selectedClaim.reward_image || selectedClaim.reward?.image || '/logo.png'}
                alt={selectedClaim.reward_title}
                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #cbd5e1', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                  {selectedClaim.reward?.category || 'Milestone Award'}
                </span>
                <h4 style={{ margin: '0.2rem 0 0.35rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                  {selectedClaim.reward_title || selectedClaim.reward?.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                  {selectedClaim.reward?.description || 'Official milestone physical award.'}
                </p>
              </div>
            </div>

            {/* Key Value Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Market Worth</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedClaim.reward?.reward_value_inr ? `₹${Number(selectedClaim.reward.reward_value_inr).toLocaleString('en-IN')}` : '—'}
                </div>
              </div>

              <div style={{ background: '#f3e8ff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: '0.72rem', color: '#7e22ce', textTransform: 'uppercase', fontWeight: 700 }}>Diamonds Spent</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6b21a8', marginTop: '0.2rem' }}>
                  💎 {selectedClaim.points_deducted}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Claim Date</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>
                  {formatDate(selectedClaim.claim_date)}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Order Status</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background:
                        selectedClaim.status === 'delivered' ? '#dcfce7' :
                        selectedClaim.status === 'dispatched' ? '#e0f2fe' :
                        selectedClaim.status === 'pending' ? '#fef3c7' : '#fee2e2',
                      color:
                        selectedClaim.status === 'delivered' ? '#15803d' :
                        selectedClaim.status === 'dispatched' ? '#0369a1' :
                        selectedClaim.status === 'pending' ? '#b45309' : '#b91c1c',
                    }}
                  >
                    ● {selectedClaim.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Courier & Tracking Details */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🚚</span> Courier & Shipment Tracking
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Courier Partner:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {selectedClaim.courier_partner || 'Carrier assignment in progress'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Air Waybill (AWB) / Tracking #:</span>
                  <strong style={{ color: selectedClaim.tracking_number ? '#0284c7' : '#64748b' }}>
                    {selectedClaim.tracking_number || 'Pending shipment dispatch'}
                  </strong>
                </div>
              </div>

              {selectedClaim.status === 'pending' && (
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a', fontSize: '0.78rem', color: '#854d0e' }}>
                  ℹ️ Your claim has been verified and is queued for dispatch from warehouse inventory. Tracking details will automatically appear here once dispatched.
                </div>
              )}
              {selectedClaim.status === 'dispatched' && (
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#1e40af' }}>
                  🚚 Package in transit with {selectedClaim.courier_partner || 'our courier partner'}. Please track with AWB: <strong>{selectedClaim.tracking_number}</strong>.
                </div>
              )}
              {selectedClaim.status === 'delivered' && (
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534' }}>
                  ✓ Successfully delivered to your designated delivery address.
                </div>
              )}
            </div>

            {/* Delivery Destination */}
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📍</span> Delivery Destination & Recipient
              </h5>
              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <div>
                  <strong>Address: </strong>
                  {selectedClaim.shipping_address}, {selectedClaim.shipping_city}, {selectedClaim.shipping_state} - {selectedClaim.shipping_pincode}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>Contact Phone: </strong>
                  {selectedClaim.shipping_phone || currentUser?.phone || 'On file with profile'}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  <strong>Member Code: </strong>
                  {selectedClaim.user_code || userCode}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardsClaimed;
