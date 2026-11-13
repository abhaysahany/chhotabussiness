import React, { useState, useMemo, useEffect } from 'react';
import { formatDateTime } from '../../utils/timezone';
import {
  getAdminDumpRequests,
  approveDumpRequest,
  rejectDumpRequest,
} from '../../api/adminOrdersService';

function AdminDumpRequestsPage({ onNavigate }) {
  const [dumps, setDumps] = useState([]);
  const [summary, setSummary] = useState({
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_approved_dump: 0,
    total_approved_admin_cut: 0,
    total_pending_dump: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Approve Modal State
  const [selectedDumpForApprove, setSelectedDumpForApprove] = useState(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  // Reject Modal State
  const [selectedDumpForReject, setSelectedDumpForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // View Details Modal State
  const [selectedDumpForDetails, setSelectedDumpForDetails] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadDumpRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDumpRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      const records = res?.data || res?.dumps || [];
      setDumps(records);
      if (res?.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error loading dump requests:', err);
      setError(err?.message || 'Failed to load dump payment requests.');
      setDumps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDumpRequests();
  }, [statusFilter]);

  // Client-side search and filtering
  const filteredDumps = useMemo(() => {
    return dumps.filter((d) => {
      // Status filter
      if (statusFilter !== 'all' && (d.status || 'pending').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invoice = (d.invoice_number || '').toLowerCase();
        const customer = (d.customer_name || '').toLowerCase();
        const userCode = (d.customer_user_code || '').toLowerCase();
        const entity = (d.entity_name || '').toLowerCase();
        const reason = (d.dump_reason || '').toLowerCase();
        const idStr = String(d.id || '');
        if (!invoice.includes(q) && !customer.includes(q) && !userCode.includes(q) && !entity.includes(q) && !reason.includes(q) && !idStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [dumps, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredDumps.length / pageSize) || 1;
  const paginatedDumps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDumps.slice(start, start + pageSize);
  }, [filteredDumps, currentPage]);

  // Handle Approve Dump
  const handleConfirmApprove = async () => {
    if (!selectedDumpForApprove) return;
    setApproving(true);
    setApproveError('');
    try {
      await approveDumpRequest(selectedDumpForApprove.id);
      showToast(`Dump payment request #${selectedDumpForApprove.id} approved successfully!`, 'success');
      setSelectedDumpForApprove(null);
      await loadDumpRequests();
    } catch (err) {
      console.error('Approve dump error:', err);
      setApproveError(err?.message || 'Failed to approve dump request.');
    } finally {
      setApproving(false);
    }
  };

  // Handle Reject Dump
  const handleConfirmReject = async () => {
    if (!selectedDumpForReject) return;
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      setRejectError('Please provide a valid rejection reason (minimum 3 characters).');
      return;
    }
    setRejecting(true);
    setRejectError('');
    try {
      await rejectDumpRequest(selectedDumpForReject.id, rejectionReason.trim());
      showToast(`Dump payment request #${selectedDumpForReject.id} has been rejected.`, 'info');
      setSelectedDumpForReject(null);
      setRejectionReason('');
      await loadDumpRequests();
    } catch (err) {
      console.error('Reject dump error:', err);
      setRejectError(err?.message || 'Failed to reject dump request.');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '14px 22px',
          borderRadius: '8px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          color: '#fff',
          fontWeight: '600',
          backgroundColor: toastType === 'error' ? '#EF4444' : toastType === 'info' ? '#3B82F6' : '#10B981',
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
            Dump Payment Requests
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Review, approve, or reject unpaid uncollectible balances reported by entities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onNavigate && onNavigate('orders-management')}
            style={{
              padding: '10px 18px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            ← Order Management
          </button>
          <button
            onClick={loadDumpRequests}
            disabled={loading}
            style={{
              padding: '10px 18px',
              backgroundColor: '#4F46E5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Refreshing...' : '↻ Refresh Queue'}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#92400E', fontWeight: '600', textTransform: 'uppercase' }}>Pending Requests</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#B45309', marginTop: '6px' }}>
            {summary.pending_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>
            Awaiting Admin Review ({formatCurrency(summary.total_pending_dump || 0)})
          </div>
        </div>

        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#065F46', fontWeight: '600', textTransform: 'uppercase' }}>Approved Dumps</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#047857', marginTop: '6px' }}>
            {formatCurrency(summary.total_approved_dump || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#065F46', marginTop: '4px' }}>
            {summary.approved_count || 0} approved write-offs
          </div>
        </div>

        <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#1E40AF', fontWeight: '600', textTransform: 'uppercase' }}>Dump Admin Cut</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#1D4ED8', marginTop: '6px' }}>
            {formatCurrency(summary.total_approved_admin_cut || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#1E40AF', marginTop: '4px' }}>
            40/40/20 allocated in dump ledger
          </div>
        </div>

        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#991B1B', fontWeight: '600', textTransform: 'uppercase' }}>Rejected Requests</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#DC2626', marginTop: '6px' }}>
            {summary.rejected_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#991B1B', marginTop: '4px' }}>
            Rejected with mandatory audit reason
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === tab.id ? '#4F46E5' : '#F3F4F6',
                color: statusFilter === tab.id ? '#fff' : '#4B5563',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '8px', flex: '1', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search invoice, customer, entity, reason..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 14px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {/* Dump Requests Table */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading dump payment requests...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>
            <p style={{ fontWeight: '600' }}>Error: {error}</p>
            <button
              onClick={loadDumpRequests}
              style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : paginatedDumps.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No Dump Payment Requests Found</div>
            <p style={{ fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
              {statusFilter === 'pending'
                ? 'There are currently no pending dump payment requests awaiting approval.'
                : 'No dump payment records match your selected filters.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 16px' }}>ID / Invoice</th>
                  <th style={{ padding: '14px 16px' }}>Entity & Customer</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Project Gross</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Received</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Outstanding</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Requested Dump</th>
                  <th style={{ padding: '14px 16px' }}>Reason</th>
                  <th style={{ padding: '14px 16px' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDumps.map((d) => {
                  const order = d.order || {};
                  const gross = Number(order.gross_amount ?? d.gross_amount ?? 0);
                  const received = Number(order.advance_payment ?? d.advance_payment ?? 0);
                  const balance = Number(order.balance_due ?? d.balance_due ?? 0);
                  const dumpAmt = Number(d.dump_amount || 0);

                  const statusColor =
                    d.status === 'approved'
                      ? { bg: '#DEF7EC', text: '#03543F', border: '#31C48D' }
                      : d.status === 'rejected'
                      ? { bg: '#FDE8E8', text: '#9B1C1C', border: '#F98080' }
                      : { bg: '#FEF08A', text: '#713F12', border: '#FACC15' };

                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#111827' }}>#{d.id}</div>
                        <div style={{ fontSize: '12px', color: '#4F46E5', fontFamily: 'monospace' }}>{d.invoice_number}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#1F2937' }}>{d.entity_name || 'N/A'}</div>
                        <div style={{ fontSize: '12px', color: '#4B5563' }}>
                          {d.customer_name} {d.customer_user_code ? `(${d.customer_user_code})` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500' }}>
                        {formatCurrency(gross)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#059669', fontWeight: '500' }}>
                        {formatCurrency(received)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#D97706', fontWeight: '600' }}>
                        {formatCurrency(balance)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#DC2626', fontWeight: '700' }}>
                        {formatCurrency(dumpAmt)}
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#374151',
                        }} title={d.dump_reason}>
                          {d.dump_reason || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {d.requested_at ? new Date(d.requested_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`,
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {d.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedDumpForApprove(d);
                                  setApproveError('');
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#10B981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDumpForReject(d);
                                  setRejectionReason('');
                                  setRejectError('');
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#EF4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: '600',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          <button
                            onClick={() => setSelectedDumpForDetails(d)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              fontWeight: '500',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredDumps.length > pageSize && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            color: '#6B7280',
          }}>
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredDumps.length)} of {filteredDumps.length} requests
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: currentPage === 1 ? '#F3F4F6' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 10px', fontWeight: '600' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: APPROVE DUMP MODAL */}
      {selectedDumpForApprove && (() => {
        const d = selectedDumpForApprove;
        const order = d.order || {};
        const commissionRate = Number(order.admin_commission_percent ?? d.admin_commission_percent ?? 15);
        const dumpAmt = Number(d.dump_amount || 0);
        const dumpCut = Math.round((dumpAmt * commissionRate / 100) * 100) / 100;
        const totalPaise = Math.round(dumpCut * 100);
        const directPaise = Math.round(totalPaise * 0.40);
        const levelPaise = Math.round(totalPaise * 0.40);
        const rewardPaise = totalPaise - directPaise - levelPaise;

        const directDump = directPaise / 100;
        const levelDump = levelPaise / 100;
        const rewardDump = rewardPaise / 100;

        const gross = Number(order.gross_amount ?? d.gross_amount ?? 0);
        const received = Number(order.advance_payment ?? d.advance_payment ?? 0);
        const currentBalance = Number(order.balance_due ?? d.balance_due ?? 0);
        const balanceAfterDump = Math.max(0, currentBalance - dumpAmt);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}>
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            }}>
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                    Review & Approve Dump Payment
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    Request #{d.id} for Invoice <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{d.invoice_number}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDumpForApprove(null)}
                  disabled={approving}
                  style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9CA3AF', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px' }}>
                {approveError && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', border: '1px solid #F87171', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', marginBottom: '18px' }}>
                    {approveError}
                  </div>
                )}

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Entity</div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{d.entity_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Customer</div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                      {d.customer_name} {d.customer_user_code ? `(${d.customer_user_code})` : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Total Project Gross</div>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{formatCurrency(gross)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Actual Cash Received</div>
                    <div style={{ fontWeight: '600', color: '#059669', fontSize: '14px' }}>{formatCurrency(received)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Current Balance Due</div>
                    <div style={{ fontWeight: '600', color: '#D97706', fontSize: '14px' }}>{formatCurrency(currentBalance)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Approved Commission %</div>
                    <div style={{ fontWeight: '700', color: '#4F46E5', fontSize: '14px' }}>{commissionRate}% (Fixed from Order)</div>
                  </div>
                </div>

                {/* Dump Reason Box */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Entity's Reported Reason:</div>
                  <div style={{ padding: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '13px', color: '#92400E' }}>
                    {d.dump_reason || 'No specific reason provided.'}
                  </div>
                </div>

                {/* Live 40/40/20 Accounting Calculation */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: '#F3F4F6', fontWeight: '700', fontSize: '13px', color: '#374151' }}>
                    Live 40/40/20 Dump Accounting Breakdown
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E5E7EB' }}>
                      <span style={{ color: '#4B5563' }}>Requested Dump Amount:</span>
                      <strong style={{ color: '#DC2626', fontSize: '15px' }}>{formatCurrency(dumpAmt)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #E5E7EB' }}>
                      <span style={{ color: '#4B5563' }}>Dump Admin Cut ({commissionRate}%):</span>
                      <strong style={{ color: '#1E40AF', fontSize: '15px' }}>{formatCurrency(dumpCut)}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Direct Dump (40%)</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{formatCurrency(directDump)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Level Dump (40%)</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{formatCurrency(levelDump)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Reward Dump (20%)</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{formatCurrency(rewardDump)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
                      <span style={{ color: '#4B5563', fontWeight: '600' }}>Remaining Collectible Balance After Dump:</span>
                      <strong style={{ color: '#059669', fontSize: '15px' }}>{formatCurrency(balanceAfterDump)}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong>Safety Notice:</strong> Approving this dump will atomically write off {formatCurrency(dumpAmt)} from collectible balance and preserve 40/40/20 in dump accounting. No cash receipt will be generated and PV/BV will not be credited.
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#F9FAFB', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDumpForApprove(null)}
                  disabled={approving}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#fff',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: approving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={approving}
                  style={{
                    padding: '10px 22px',
                    backgroundColor: approving ? '#9CA3AF' : '#10B981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: approving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {approving ? 'Processing Approval...' : 'Confirm & Approve Dump'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: REJECT DUMP MODAL */}
      {selectedDumpForReject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Reject Dump Payment Request
              </h3>
              <button
                onClick={() => setSelectedDumpForReject(null)}
                disabled={rejecting}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9CA3AF', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {rejectError && (
                <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', border: '1px solid #F87171', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', marginBottom: '16px' }}>
                  {rejectError}
                </div>
              )}
              <p style={{ fontSize: '14px', color: '#4B5563', marginTop: 0, marginBottom: '16px' }}>
                You are rejecting Request <strong>#{selectedDumpForReject.id}</strong> ({formatCurrency(selectedDumpForReject.dump_amount)}) for Invoice <strong>{selectedDumpForReject.invoice_number}</strong>.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this dump request is rejected (e.g. payment received via alternative channel, invalid dispute)..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#F9FAFB', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedDumpForReject(null)}
                disabled={rejecting}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                style={{
                  padding: '10px 22px',
                  backgroundColor: rejecting ? '#9CA3AF' : '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                }}
              >
                {rejecting ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW DETAILS MODAL */}
      {selectedDumpForDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                Dump Request Details #{selectedDumpForDetails.id}
              </h3>
              <button
                onClick={() => setSelectedDumpForDetails(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#9CA3AF', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><strong style={{ color: '#6B7280' }}>Invoice:</strong> <div>{selectedDumpForDetails.invoice_number}</div></div>
                <div><strong style={{ color: '#6B7280' }}>Status:</strong> <div style={{ textTransform: 'uppercase', fontWeight: '700' }}>{selectedDumpForDetails.status}</div></div>
                <div><strong style={{ color: '#6B7280' }}>Entity:</strong> <div>{selectedDumpForDetails.entity_name}</div></div>
                <div><strong style={{ color: '#6B7280' }}>Customer:</strong> <div>{selectedDumpForDetails.customer_name}</div></div>
                <div><strong style={{ color: '#6B7280' }}>Dump Amount:</strong> <div style={{ color: '#DC2626', fontWeight: '700' }}>{formatCurrency(selectedDumpForDetails.dump_amount)}</div></div>
                <div><strong style={{ color: '#6B7280' }}>Commission Rate:</strong> <div>{selectedDumpForDetails.admin_commission_percent}%</div></div>
                <div><strong style={{ color: '#6B7280' }}>Dump Admin Cut:</strong> <div style={{ color: '#1E40AF', fontWeight: '700' }}>{formatCurrency(selectedDumpForDetails.admin_commission_cut)}</div></div>
                <div><strong style={{ color: '#6B7280' }}>Requested At:</strong> <div>{formatDateTime(selectedDumpForDetails.requested_at)}</div></div>
              </div>

              {selectedDumpForDetails.status === 'approved' && (
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '700', color: '#166534', marginBottom: '8px' }}>Approved Dump Accounting (40/40/20)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#15803D' }}>Direct Dump (40%)</div>
                      <div style={{ fontWeight: '700' }}>{formatCurrency(selectedDumpForDetails.direct_income_amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#15803D' }}>Level Dump (40%)</div>
                      <div style={{ fontWeight: '700' }}>{formatCurrency(selectedDumpForDetails.level_income_amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#15803D' }}>Reward Dump (20%)</div>
                      <div style={{ fontWeight: '700' }}>{formatCurrency(selectedDumpForDetails.reward_income_amount)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534', marginTop: '8px' }}>
                    Approved by Admin #{selectedDumpForDetails.approved_by} on {formatDateTime(selectedDumpForDetails.approved_at)}
                  </div>
                </div>
              )}

              {selectedDumpForDetails.status === 'rejected' && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '700', color: '#991B1B', marginBottom: '6px' }}>Admin Rejection Reason</div>
                  <div style={{ color: '#7F1D1D' }}>{selectedDumpForDetails.admin_rejection_reason || '—'}</div>
                  <div style={{ fontSize: '11px', color: '#991B1B', marginTop: '6px' }}>
                    Rejected by Admin #{selectedDumpForDetails.rejected_by} on {formatDateTime(selectedDumpForDetails.rejected_at)}
                  </div>
                </div>
              )}

              <div>
                <strong style={{ color: '#6B7280' }}>Reported Reason:</strong>
                <div style={{ marginTop: '4px', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                  {selectedDumpForDetails.dump_reason || 'None'}
                </div>
              </div>

              {selectedDumpForDetails.notes && (
                <div>
                  <strong style={{ color: '#6B7280' }}>Notes:</strong>
                  <div style={{ marginTop: '4px', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                    {selectedDumpForDetails.notes}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F9FAFB', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedDumpForDetails(null)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#fff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
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

export default AdminDumpRequestsPage;
