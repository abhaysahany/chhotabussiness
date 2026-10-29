import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api, { API_BASE_URL } from '../../api/axios';

// API_BASE_URL is imported from axios.js

function AdminUserKycPage() {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Inspection Modal State
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectReason, setRejectReason] = useState('Blurred / Unreadable Document');
  const [toastMsg, setToastMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Document Lightbox Modal State
  const [viewingDoc, setViewingDoc] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchKycRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/kyc-requests', {
        params: {
          status: statusFilter,
          search: searchTerm || undefined,
        },
      });

      if (res.data && res.data.status === 'success') {
        setKycRequests(res.data.kyc_requests || []);
      }
    } catch (err) {
      console.error('Error loading KYC requests from database:', err);
      showToast('Could not load KYC submissions from database.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchKycRequests();
  }, [fetchKycRequests]);

  const handleApproveKyc = async (user) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/kyc/${user.id}/approve`);
      if (res.data && res.data.status === 'success') {
        showToast(`✓ KYC approved for ${user.name} (${user.user_code})! Bank/UPI unlocked.`);
        setSelectedKyc(null);
        fetchKycRequests();
      }
    } catch (err) {
      showToast('Failed to approve KYC in database.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectKyc = async (user) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/kyc/${user.id}/reject`, {
        reason: rejectReason,
      });
      if (res.data && res.data.status === 'success') {
        showToast(`⚠️ KYC rejected for ${user.name} (${user.user_code}).`);
        setSelectedKyc(null);
        fetchKycRequests();
      }
    } catch (err) {
      showToast('Failed to reject KYC.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = useMemo(() => {
    return kycRequests.filter((k) => (k.kyc_status || 'unverified').toLowerCase() === 'pending' || (k.kyc_status || '').toLowerCase() === 'under_process').length;
  }, [kycRequests]);

  const verifiedCount = useMemo(() => {
    return kycRequests.filter((k) => (k.kyc_status || '').toLowerCase() === 'verified' || (k.kyc_status || '').toLowerCase() === 'approved').length;
  }, [kycRequests]);

  const rejectedCount = useMemo(() => {
    return kycRequests.filter((k) => (k.kyc_status || '').toLowerCase() === 'rejected').length;
  }, [kycRequests]);

  const formatAadhaar = (val) => {
    const digits = (val || '').replace(/\D/g, '');
    if (!digits) return 'N/A';
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {toastMsg && (
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
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', borderRadius: '16px', padding: '2rem 2.25rem', color: '#ffffff', marginBottom: '1.75rem', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#c7d2fe', marginBottom: '0.75rem' }}>
              <span>🛡️ Statutory Identity & Tax Compliance Audit</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              User KYC Verification & Compliance
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.925rem', maxWidth: '720px', margin: 0 }}>
              Verify identity documents (PAN & Aadhaar Card only). Approving KYC unlocks bank and UPI payout additions for the member.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchKycRequests}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 {loading ? 'Syncing...' : 'Sync Database'}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Under Process / Review</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: pendingCount > 0 ? '#d97706' : '#64748b', marginTop: '0.35rem' }}>
            {pendingCount} Pending
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Awaiting Admin Decision</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Verified & Approved</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803d', marginTop: '0.35rem' }}>
            {verifiedCount} Verified
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>Payouts Unlocked</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem 1.5rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Rejected Submissions</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            {rejectedCount} Rejected
          </div>
          <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>Requires Resubmission</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search by User Code, Name, Email, PAN Number, or Aadhaar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', fontWeight: 600 }}
        >
          <option value="all">All Verification Statuses</option>
          <option value="pending">Under Process / Pending</option>
          <option value="verified">Verified & Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* KYC Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>User Info</th>
                <th style={{ padding: '0.85rem 1rem' }}>PAN Card</th>
                <th style={{ padding: '0.85rem 1rem' }}>Aadhaar Number</th>
                <th style={{ padding: '0.85rem 1rem' }}>Proofs Attached</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>KYC Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Audit Action</th>
              </tr>
            </thead>
            <tbody>
              {kycRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No KYC submissions found matching your filters.
                  </td>
                </tr>
              ) : (
                kycRequests.map((u) => {
                  const s = (u.kyc_status || 'unverified').toLowerCase();
                  const isVerifiedUser = s === 'verified' || s === 'approved';
                  const isPendingUser = s === 'pending' || s === 'under_process';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{u.name}</strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{u.user_code} • {u.email}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{u.pan_number || 'Not Submitted'}</strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', color: '#334155' }}>{formatAadhaar(u.aadhaar_number)}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {u.pan_card_image && (
                            <span
                              onClick={() => setViewingDoc({ title: `PAN Proof: ${u.name}`, src: u.pan_card_image })}
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              📄 PAN
                            </span>
                          )}
                          {u.aadhaar_front_image && (
                            <span
                              onClick={() => setViewingDoc({ title: `Aadhaar Front: ${u.name}`, src: u.aadhaar_front_image })}
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🪪 Aadhaar Front
                            </span>
                          )}
                          {u.aadhaar_back_image && (
                            <span
                              onClick={() => setViewingDoc({ title: `Aadhaar Back: ${u.name}`, src: u.aadhaar_back_image })}
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🪪 Aadhaar Back
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background: isVerifiedUser ? '#dcfce7' : isPendingUser ? '#fef3c7' : '#fee2e2',
                            color: isVerifiedUser ? '#15803d' : isPendingUser ? '#b45309' : '#b91c1c',
                          }}
                        >
                          ● {isVerifiedUser ? 'Verified' : isPendingUser ? 'Under Process' : s}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedKyc(u)}
                          style={{
                            background: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Audit Details 👁️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION / AUDIT MODAL */}
      {selectedKyc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '580px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>KYC Compliance Audit</span>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{selectedKyc.name}</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedKyc.user_code} • {selectedKyc.email}</span>
              </div>
              <button type="button" onClick={() => setSelectedKyc(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>PAN Number:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedKyc.pan_number || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Aadhaar Number:</span>
                <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{formatAadhaar(selectedKyc.aadhaar_number)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Current KYC Status:</span>
                <strong style={{ textTransform: 'uppercase', color: selectedKyc.kyc_status === 'verified' ? '#15803d' : '#d97706' }}>
                  {selectedKyc.kyc_status || 'Under Process'}
                </strong>
              </div>
            </div>

            {/* Document Previews */}
            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>Attached Documents (Click to Inspect):</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {selectedKyc.pan_card_image && (
                  <div
                    onClick={() => setViewingDoc({ title: `PAN Card: ${selectedKyc.name}`, src: selectedKyc.pan_card_image })}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                  >
                    <img src={selectedKyc.pan_card_image} alt="PAN" style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb' }}>📄 PAN Card</span>
                  </div>
                )}

                {selectedKyc.aadhaar_front_image && (
                  <div
                    onClick={() => setViewingDoc({ title: `Aadhaar Front: ${selectedKyc.name}`, src: selectedKyc.aadhaar_front_image })}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                  >
                    <img src={selectedKyc.aadhaar_front_image} alt="Aadhaar Front" style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>🪪 Aadhaar Front</span>
                  </div>
                )}

                {selectedKyc.aadhaar_back_image && (
                  <div
                    onClick={() => setViewingDoc({ title: `Aadhaar Back: ${selectedKyc.name}`, src: selectedKyc.aadhaar_back_image })}
                    style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                  >
                    <img src={selectedKyc.aadhaar_back_image} alt="Aadhaar Back" style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>🪪 Aadhaar Back</span>
                  </div>
                )}
              </div>
            </div>

            {/* Decision Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleRejectKyc(selectedKyc)}
                style={{ flex: 1, padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecdd3', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                ❌ Reject KYC
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleApproveKyc(selectedKyc)}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                ✓ Approve KYC (Unlock Payouts)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX */}
      {viewingDoc && (
        <div
          onClick={() => setViewingDoc(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '1rem',
          }}
        >
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '640px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{viewingDoc.title}</h4>
            <img src={viewingDoc.src} alt="Document Zoom" style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <button
              type="button"
              onClick={() => setViewingDoc(null)}
              style={{ marginTop: '1.25rem', width: '100%', padding: '0.65rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
            >
              Close Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUserKycPage;
