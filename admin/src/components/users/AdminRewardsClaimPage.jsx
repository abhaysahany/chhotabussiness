import React, { useState, useEffect } from 'react';
import {
  getAdminRewardClaims,
  updateAdminClaimStatus,
} from '../../api/adminRewardService';

function AdminRewardsClaimPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Fulfillment Action Modal State
  const [selectedClaimForAction, setSelectedClaimForAction] = useState(null);
  const [actionType, setActionType] = useState('dispatch'); // 'dispatch' | 'delivered' | 'reject'
  const [courierPartner, setCourierPartner] = useState('Blue Dart Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await getAdminRewardClaims();
      setClaims(data);
    } catch (err) {
      showToast('Failed to load reward claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleOpenAction = (claim, type) => {
    setSelectedClaimForAction(claim);
    setActionType(type);
    setCourierPartner(claim.courier_partner || 'Blue Dart Express');
    setTrackingNumber(claim.tracking_number || '');
    setAdminNotes(claim.admin_notes || '');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClaimForAction) return;

    setIsProcessing(true);
    try {
      let nextStatus = actionType === 'dispatch' ? 'dispatched' : actionType === 'delivered' ? 'delivered' : 'rejected';
      
      await updateAdminClaimStatus(selectedClaimForAction.id, {
        status: nextStatus,
        courier_partner: courierPartner,
        tracking_number: trackingNumber,
        admin_notes: adminNotes || (actionType === 'reject' ? 'Claim rejected by Admin.' : 'Dispatched via surface express.'),
      });

      showToast(`✓ Claim ${selectedClaimForAction.claim_code} marked as ${nextStatus.toUpperCase()}!`);
      setSelectedClaimForAction(null);
      await loadClaims();
    } catch (err) {
      showToast('Failed to update claim status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      c.claim_code.toLowerCase().includes(q) ||
      c.user_code.toLowerCase().includes(q) ||
      c.member_name.toLowerCase().includes(q) ||
      c.reward_title.toLowerCase().includes(q) ||
      (c.tracking_number && c.tracking_number.toLowerCase().includes(q));

    return matchStatus && matchSearch;
  });

  const pendingCount = claims.filter((c) => c.status === 'pending').length;
  const dispatchedCount = claims.filter((c) => c.status === 'dispatched').length;
  const deliveredCount = claims.filter((c) => c.status === 'delivered').length;
  const totalBpRedeemed = claims.reduce((acc, curr) => acc + (Number(curr.points_deducted) || 0), 0);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            fontWeight: '700',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 99999,
            fontSize: '0.875rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3569a7 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '2rem', boxShadow: '0 10px 30px -5px rgba(49, 46, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>📦 User Management • Rewards Fulfillment Desk</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Member Reward Claims Queue
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '750px', margin: 0 }}>
              Review member Business Points (BP) redemption requests, dispatch reward items with courier tracking, or process delivery confirmations.
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
              🔄 Refresh Queue
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>⏳ Pending Verification</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309', margin: '0.3rem 0 0 0' }}>{pendingCount}</h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>🚚 In Transit / Dispatched</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369a1', margin: '0.3rem 0 0 0' }}>{dispatchedCount}</h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>✓ Successfully Delivered</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', margin: '0.3rem 0 0 0' }}>{deliveredCount}</h2>
        </div>
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>💎 Total BP Redeemed</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6d28d9', margin: '0.3rem 0 0 0' }}>{totalBpRedeemed} BP</h2>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search claim code, member name, reward, AWB tracking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', fontWeight: 600, color: '#334155' }}
          >
            <option value="all">All Claims Status</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Claim Ref / Date</th>
                <th style={{ padding: '1rem 1.25rem' }}>Member Info</th>
                <th style={{ padding: '1rem 1.25rem' }}>Reward Item</th>
                <th style={{ padding: '1rem 1.25rem' }}>Points Deducted</th>
                <th style={{ padding: '1rem 1.25rem' }}>Delivery Address</th>
                <th style={{ padding: '1rem 1.25rem' }}>Status / Tracking</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Loading member reward claims from database...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No reward claims found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.88rem' }}>{claim.claim_code}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {claim.claim_date ? new Date(claim.claim_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{claim.member_name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>{claim.user_code}</span>
                      {claim.member_phone && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>📞 {claim.member_phone}</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <img
                          src={claim.reward_image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600'}
                          alt={claim.reward_title}
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div>
                          <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.82rem' }}>{claim.reward_title}</strong>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800 }}>
                        💎 {claim.points_deducted} BP
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', maxWidth: '240px' }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#334155', lineHeight: 1.35 }}>
                        {claim.shipping_address}, {claim.shipping_city} {claim.shipping_state} - {claim.shipping_pincode}
                      </p>
                    </td>

                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background:
                            claim.status === 'delivered' ? '#dcfce7' :
                            claim.status === 'dispatched' ? '#e0f2fe' :
                            claim.status === 'pending' ? '#fef3c7' : '#fee2e2',
                          color:
                            claim.status === 'delivered' ? '#15803d' :
                            claim.status === 'dispatched' ? '#0369a1' :
                            claim.status === 'pending' ? '#b45309' : '#b91c1c',
                        }}
                      >
                        ● {claim.status}
                      </span>
                      {claim.tracking_number && (
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.25rem', fontWeight: 600 }}>
                          AWB: {claim.tracking_number}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      {claim.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(claim, 'dispatch')}
                            style={{ padding: '0.4rem 0.75rem', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            🚚 Dispatch
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(claim, 'reject')}
                            style={{ padding: '0.4rem 0.65rem', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {claim.status === 'dispatched' && (
                        <button
                          type="button"
                          onClick={() => handleOpenAction(claim, 'delivered')}
                          style={{ padding: '0.4rem 0.75rem', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✓ Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal (Dispatch / Delivered / Reject) */}
      {selectedClaimForAction && (
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
              maxWidth: '480px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                {actionType === 'dispatch' && '🚚 Dispatch Reward Item'}
                {actionType === 'delivered' && '✓ Confirm Delivery'}
                {actionType === 'reject' && '❌ Reject Claim & Refund BP'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedClaimForAction(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
              <div>Claim Ref: <strong>{selectedClaimForAction.claim_code}</strong></div>
              <div>Member: <strong>{selectedClaimForAction.member_name} ({selectedClaimForAction.user_code})</strong></div>
              <div>Reward: <strong>{selectedClaimForAction.reward_title}</strong> (💎 {selectedClaimForAction.points_deducted} BP)</div>
            </div>

            <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {actionType === 'dispatch' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Courier Partner / Logistics Provider
                    </label>
                    <select
                      value={courierPartner}
                      onChange={(e) => setCourierPartner(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                    >
                      <option value="Blue Dart Express">Blue Dart Express</option>
                      <option value="Delhivery">Delhivery Surface/Air</option>
                      <option value="DTDC Express">DTDC Express</option>
                      <option value="India Post / Speed Post">India Post / Speed Post</option>
                      <option value="Hand Delivered">Hand Delivered (Direct Office Pick-up)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Tracking Number / Air Waybill (AWB) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BLUEDART-8930491823"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  {actionType === 'reject' ? 'Rejection Reason (will refund BP to user) *' : 'Admin Fulfillment Notes'}
                </label>
                <textarea
                  rows="3"
                  required={actionType === 'reject'}
                  placeholder={actionType === 'reject' ? 'State reason for rejecting claim...' : 'Enter any notes or remarks...'}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedClaimForAction(null)}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    flex: 1.5,
                    padding: '0.65rem 1rem',
                    background: actionType === 'reject' ? '#dc2626' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRewardsClaimPage;
