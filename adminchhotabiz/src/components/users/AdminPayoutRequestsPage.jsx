import React, { useState, useEffect, useMemo } from 'react';
import { getAllPayouts, approveAndDisbursePayout, rejectPayout } from '../../api/adminPayoutService';

function AdminPayoutRequestsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Modals State
  const [selectedForDisburse, setSelectedForDisburse] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [disburseMode, setDisburseMode] = useState('IMPS Direct Bank Transfer');
  const [disburseNote, setDisburseNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedForReject, setSelectedForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('KYC details mismatch or bank verification pending');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllPayouts();
      setPayouts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter pending/actionable requests only
  const pendingRequests = useMemo(() => {
    return payouts.filter((p) => p.status === 'pending' || p.status === 'processing');
  }, [payouts]);

  // Filtered by Search, Payment Method, and Dates
  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (p.payoutCode || '').toLowerCase().includes(q) ||
        (p.userCode || '').toLowerCase().includes(q) ||
        (p.memberName || '').toLowerCase().includes(q) ||
        (p.sponsor || '').toLowerCase().includes(q) ||
        (p.bankDetails?.bankName || '').toLowerCase().includes(q) ||
        (p.bankDetails?.accountNumber || '').toLowerCase().includes(q) ||
        (p.bankDetails?.upiId || '').toLowerCase().includes(q);

      const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

      // Date Filtering
      let matchDate = true;
      if (p.requestDate) {
        const reqDate = new Date(p.requestDate);
        const reqDateStr = p.requestDate.slice(0, 10);
        const todayStr = new Date().toISOString().slice(0, 10);

        if (datePreset === 'today') {
          matchDate = reqDateStr === todayStr;
        } else if (datePreset === 'week') {
          const now = new Date();
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          matchDate = reqDate >= firstDay;
        } else if (datePreset === 'month') {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          matchDate = reqDate >= firstDay;
        } else if (datePreset === 'custom') {
          if (startDate && reqDateStr < startDate) matchDate = false;
          if (endDate && reqDateStr > endDate) matchDate = false;
        }
      }

      return matchSearch && matchMethod && matchDate;
    });
  }, [pendingRequests, searchQuery, methodFilter, datePreset, startDate, endDate]);

  // Summary Metrics
  const totalPendingGross = useMemo(() => {
    return pendingRequests.reduce((acc, curr) => acc + (Number(curr.requestedAmount) || 0), 0);
  }, [pendingRequests]);

  const totalPendingTDS = useMemo(() => {
    return pendingRequests.reduce((acc, curr) => acc + (Number(curr.tdsDeduction) || 0), 0);
  }, [pendingRequests]);

  const totalPendingNetPayable = useMemo(() => {
    return pendingRequests.reduce((acc, curr) => acc + (Number(curr.netPayableAmount) || 0), 0);
  }, [pendingRequests]);

  const handleDisburseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedForDisburse) return;

    if (!utrNumber.trim()) {
      showToast('⚠️ Please enter Bank Reference / UTR Number before disbursing.');
      return;
    }

    setIsProcessing(true);
    try {
      await approveAndDisbursePayout(selectedForDisburse.id, {
        utrNumber: utrNumber.trim(),
        paymentMethod: disburseMode,
        adminNotes: disburseNote || 'Direct bank settlement processed by Finance Admin.',
      });
      showToast(`✓ Disbursed ₹${selectedForDisburse.netPayableAmount.toLocaleString()} to ${selectedForDisburse.memberName} (${selectedForDisburse.userCode})!`);
      setSelectedForDisburse(null);
      setUtrNumber('');
      setDisburseNote('');
      await loadData();
    } catch (err) {
      showToast('Failed to process payout disbursement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedForReject) return;

    setIsProcessing(true);
    try {
      await rejectPayout(selectedForReject.id, rejectReason);
      showToast(`⚠️ Payout request ${selectedForReject.payoutCode} rejected. Funds returned to user wallet.`);
      setSelectedForReject(null);
      setRejectReason('KYC details mismatch or bank verification pending');
      await loadData();
    } catch (err) {
      showToast('Failed to reject payout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  const handleGenerateWeeklyBatch = async () => {
    setIsGeneratingBatch(true);
    try {
      const res = await generateWeeklyPayoutBatch();
      showToast(res.message || '✓ Weekly payout generation completed!');
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to run weekly payout generator.');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            zIndex: 99999,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            fontSize: '0.85rem',
            border: '1px solid #334155',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', border: '1px solid #bae6fd' }}>
            <span>⚡</span> Action Queue • User Commission Withdrawals (Weekly Automated Batch)
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            User Payout Requests
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Generated weekly by backend for all KYC-verified members with commission balance &gt; ₹500 and verified bank credentials.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleGenerateWeeklyBatch}
            disabled={isGeneratingBatch}
            style={{
              padding: '0.5rem 1rem',
              background: isGeneratingBatch ? '#94a3b8' : 'linear-gradient(135deg, #3569a7 0%, #254a77 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isGeneratingBatch ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(53, 105, 167, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>⚡</span>
            {isGeneratingBatch ? 'Generating Batch...' : 'Generate Weekly Batch Now'}
          </button>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '0.5rem 0.9rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>PENDING REQUESTS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: pendingRequests.length > 0 ? '#d97706' : '#16a34a', marginTop: '0.35rem' }}>
            {pendingRequests.length} Requests
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Awaiting Admin Authorization
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>GROSS REQUESTED AMOUNT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalPendingGross.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Commission withdrawal demand
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TDS WITHHOLDING (5%)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{totalPendingTDS.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.2rem' }}>
            Section 194H statutory tax
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>NET PAYABLE TO MEMBERS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalPendingNetPayable.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Final bank settlement obligation
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search by Payout Code, Member Code, Name, Bank, Account #, or UPI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
            >
              <option value="all">All Payout Methods</option>
              <option value="IMPS Direct Bank Transfer">IMPS Direct Bank Transfer</option>
              <option value="NEFT Transfer">NEFT Transfer</option>
              <option value="UPI Instant Payout">UPI Instant Payout</option>
            </select>
          </div>
        </div>

        {/* Date Filter Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Date:</span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
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
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: datePreset === dp.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: datePreset === dp.id ? '#eff6ff' : '#ffffff',
                  color: datePreset === dp.id ? '#1d4ed8' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {dp.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
              />
            </div>
            {(datePreset !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setDatePreset('all');
                  setStartDate('');
                  setEndDate('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reset Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payout Requests Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Payout Code / Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Member Info</th>
                <th style={{ padding: '0.85rem 1rem' }}>KYC Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bank / UPI Details</th>
                <th style={{ padding: '0.85rem 1rem' }}>Gross Requested</th>
                <th style={{ padding: '0.85rem 1rem' }}>TDS (5%)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Net Payable</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading payout requests queue...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                    <strong style={{ color: '#0f172a', fontSize: '1rem', display: 'block' }}>All Payout Requests Settled!</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem' }}>
                      There are no pending withdrawal requests awaiting action. View historical settlements in <strong>Payout History</strong>.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((p) => {
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.payoutCode}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.requestDate}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.memberName}</div>
                        <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {p.userCode}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                          Sponsor: <strong>{p.sponsor}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                          ✓ {p.kycStatus}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                          PAN: <strong>{p.bankDetails?.panNumber || 'N/A'}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.bankDetails?.bankName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          A/C: <strong>{p.bankDetails?.accountNumber}</strong> • IFSC: <strong>{p.bankDetails?.ifscCode}</strong>
                        </div>
                        {p.bankDetails?.upiId && (
                          <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600 }}>
                            UPI: {p.bankDetails.upiId}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{Number(p.requestedAmount).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#dc2626' }}>
                        -₹{Number(p.tdsDeduction).toLocaleString()} (5%)
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                        ₹{Number(p.netPayableAmount).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedForDisburse(p);
                              setUtrNumber(`UTR-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
                              setDisburseMode(p.paymentMethod || 'IMPS Direct Bank Transfer');
                            }}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                            }}
                          >
                            ⚡ Disburse
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedForReject(p)}
                            style={{
                              padding: '0.4rem 0.65rem',
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Approve & Disburse Payout */}
      {selectedForDisburse && (
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
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  ⚡ Authorize & Disburse User Payout
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Request: <strong>{selectedForDisburse.payoutCode}</strong> • Member: <strong>{selectedForDisburse.memberName} ({selectedForDisburse.userCode})</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForDisburse(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Financial Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Beneficiary Bank Account:</span>
                <strong>{selectedForDisburse.bankDetails?.bankName} ({selectedForDisburse.bankDetails?.accountNumber})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>IFSC / Branch:</span>
                <strong>{selectedForDisburse.bankDetails?.ifscCode}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem' }}>
                <span style={{ color: '#64748b' }}>Gross Requested:</span>
                <strong>₹{Number(selectedForDisburse.requestedAmount).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#dc2626' }}>Less: TDS Deduction (5% u/s 194H):</span>
                <strong style={{ color: '#dc2626' }}>-₹{Number(selectedForDisburse.tdsDeduction).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '0.4rem', fontSize: '0.95rem' }}>
                <span style={{ color: '#166534', fontWeight: 800 }}>Net Disbursal Amount:</span>
                <strong style={{ color: '#16a34a', fontWeight: 900 }}>₹{Number(selectedForDisburse.netPayableAmount).toLocaleString()}</strong>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDisburseSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Bank Transfer Reference / UTR Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR-892348109283"
                  required
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Disbursement Mode
                </label>
                <select
                  value={disburseMode}
                  onChange={(e) => setDisburseMode(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                >
                  <option value="IMPS Direct Bank Transfer">IMPS Direct Bank Transfer</option>
                  <option value="NEFT Transfer">NEFT Transfer</option>
                  <option value="RTGS Transfer">RTGS Transfer</option>
                  <option value="UPI Instant Payout">UPI Instant Payout</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Internal Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={disburseNote}
                  onChange={(e) => setDisburseNote(e.target.value)}
                  placeholder="e.g. Authorized by Chief Financial Officer"
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedForDisburse(null)}
                  disabled={isProcessing}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{ flex: 2, padding: '0.65rem 1rem', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {isProcessing ? 'Processing Transfer...' : `✓ Disburse ₹${selectedForDisburse.netPayableAmount.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Payout */}
      {selectedForReject && (
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
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>
              ❌ Reject Payout Request
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Are you sure you want to reject request <strong>{selectedForReject.payoutCode}</strong> for <strong>{selectedForReject.memberName}</strong>? Gross amount of <strong>₹{selectedForReject.requestedAmount.toLocaleString()}</strong> will be returned to user's wallet.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Rejection Reason (Visible to Member) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="3"
                  required
                  style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedForReject(null)}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1.5, padding: '0.65rem 1rem', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayoutRequestsPage;
