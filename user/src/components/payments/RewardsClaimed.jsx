import React, { useState, useEffect, useCallback } from 'react';
import { getUserClaims, getUserFreshProfile } from '../../api/userRewardService';
import DataTable from '../common/DataTable';

function RewardsClaimed({ user }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const userCode = currentUser?.user_code || user?.user_code || user?.sponsor_id || '';
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

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
      render: (val) => <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{val}</strong>,
    },
    {
      header: 'Reward Item',
      accessor: 'reward_title',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={row.reward_image || '/logo.png'}
            alt={val}
            style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div>
            <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.85rem' }}>{val}</strong>
          </div>
        </div>
      ),
    },
    {
      header: 'Points Redeemed',
      accessor: 'points_deducted',
      align: 'center',
      render: (val) => (
        <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800 }}>
          💎 {val} BP
        </span>
      ),
    },
    {
      header: 'Delivery Address',
      accessor: 'shipping_address',
      render: (val, row) => (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.35, maxWidth: '220px' }}>
          {val}, {row.shipping_city} {row.shipping_state} - {row.shipping_pincode}
        </p>
      ),
    },
    {
      header: 'Claim Date',
      accessor: 'claim_date',
      render: (val) => (
        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
          {val ? new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
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
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total BP Points Redeemed</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', margin: '0.3rem 0 0 0' }}>{totalPointsSpent} BP</h2>
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
        emptyMessage="You haven't claimed any rewards yet. Visit Reward Details to redeem your BP points!"
      />
    </div>
  );
}

export default RewardsClaimed;
