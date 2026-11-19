import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Search,
  RefreshCw,
  ArrowLeft,
  FileText,
  Building2,
  User,
  DollarSign,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: toastType === 'error' ? '#fef2f2' : toastType === 'info' ? '#f8fafc' : '#ecfdf5',
            color: toastType === 'error' ? '#b91c1c' : toastType === 'info' ? '#1e293b' : '#047857',
            border: `1.5px solid ${toastType === 'error' ? '#fecaca' : toastType === 'info' ? '#cbd5e1' : '#a7f3d0'}`,
            padding: '0.9rem 1.35rem',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 999999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {toastType === 'error' ? <AlertTriangle size={18} color="#dc2626" /> : <CheckCircle2 size={18} color="#059669" />}
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.2rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d adm-pod-amber">
            <ShieldAlert size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b45309', background: 'rgba(217, 119, 6, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                ● UNCOLLECTIBLE DEBT &amp; WRITE-OFF AUDIT
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: summary.pending_count > 0 ? '#dc2626' : '#059669', background: summary.pending_count > 0 ? 'rgba(220, 38, 38, 0.08)' : 'rgba(5, 150, 105, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: `1px solid ${summary.pending_count > 0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(5, 150, 105, 0.2)'}` }}>
                ● {summary.pending_count || 0} Pending Approvals
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Dump Payment Requests
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Review, audit, and authorize unpaid uncollectible balances reported by registered business entities.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders-management')}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <ArrowLeft size={15} />
              <span>Orders Management</span>
            </button>

            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={loadDumpRequests}
              disabled={loading}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.84rem' }}
            >
              <RefreshCw size={15} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Pending Requests */}
        <div className="adm-kpi-card adm-kpi-card-amber">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● REVIEW QUEUE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                PENDING REQUESTS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Clock size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#d97706' }}>
              {summary.pending_count || 0}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Clock size={13} color="#d97706" />
              <span>Awaiting review</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● {formatCurrency(summary.total_pending_dump || 0)}
            </span>
          </div>
        </div>

        {/* Card 2: Approved Dumps */}
        <div className="adm-kpi-card adm-kpi-card-emerald">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  background: 'rgba(13, 148, 136, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● APPROVED LOSS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                APPROVED DUMPS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#0d9488' }}>
              {formatCurrency(summary.total_approved_dump || 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>{summary.approved_count || 0} approved write-offs</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Authorized
            </span>
          </div>
        </div>

        {/* Card 3: Dump Admin Cut */}
        <div className="adm-kpi-card adm-kpi-card-purple">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#9333ea',
                  background: 'rgba(147, 51, 234, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● 40/40/20 ALLOCATION
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                DUMP ADMIN CUT
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.5rem', color: '#9333ea' }}>
              {formatCurrency(summary.total_approved_admin_cut || 0)}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Zap size={13} color="#9333ea" />
              <span>Dump ledger allocated</span>
            </span>
            <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Distributed
            </span>
          </div>
        </div>

        {/* Card 4: Rejected Requests */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#dc2626',
                  background: 'rgba(220, 38, 38, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● REJECTED CLAIMS
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                REJECTED REQUESTS
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <ShieldAlert size={19} strokeWidth={2.4} color="#dc2626" />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.6rem', color: '#dc2626' }}>
              {summary.rejected_count || 0}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <ShieldAlert size={13} color="#dc2626" />
              <span>With audit reasoning</span>
            </span>
            <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Rejected
            </span>
          </div>
        </div>
      </div>

      {/* 3. Executive Filter Toolbar (Single Unified Row) */}
      <div className="adm-toolbar-card">
        <div className="adm-toolbar-filters">
          {/* Status Filter Tabs */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0', flexShrink: 0 }}>
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'pending', label: 'Pending Approval' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.38rem 0.85rem',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? '#ffffff' : 'transparent',
                  color: statusFilter === tab.id ? '#0f172a' : '#64748b',
                  boxShadow: statusFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '180px' }}>
            <input
              type="text"
              className="adm-toolbar-input"
              placeholder="Search invoice, customer, entity, reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '0.35rem 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="adm-toolbar-actions">
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
            Showing {filteredDumps.length} of {dumps.length} Requests
          </span>
        </div>
      </div>

      {/* Error Alert Banner if any */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#991b1b',
            padding: '0.9rem 1.25rem',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', fontWeight: 700 }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span>Error loading dump requests: {error}</span>
          </div>
          <button
            type="button"
            onClick={loadDumpRequests}
            style={{
              background: '#ffffff',
              border: '1.5px solid #fca5a5',
              borderRadius: '8px',
              padding: '0.35rem 0.85rem',
              color: '#991b1b',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Luxury Data Table View */}
      <div className="adm-table-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>ID / Invoice</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Entity &amp; Customer</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Project Gross</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Received</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Outstanding</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'right' }}>Requested Dump</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Reported Reason</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800 }}>Date</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem 1.15rem', fontWeight: 800, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="adm-3d-pod adm-pod-amber admFloatPodSlow" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}>
                      <ShieldAlert size={24} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>Loading Dump Payment Requests...</div>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Synchronizing write-off queue from database</p>
                  </td>
                </tr>
              ) : filteredDumps.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="adm-3d-pod adm-pod-emerald" style={{ width: '56px', height: '56px', margin: '0 auto 1rem auto' }}>
                      <CheckCircle2 size={28} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                      No Dump Payment Requests Found
                    </div>
                    <p style={{ margin: '0.35rem auto 0', color: '#64748b', fontSize: '0.84rem', maxWidth: '440px', lineHeight: 1.5 }}>
                      {statusFilter === 'pending'
                        ? 'There are currently no pending dump payment requests awaiting approval.'
                        : 'No dump payment records match your selected filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedDumps.map((d) => {
                  const order = d.order || {};
                  const gross = Number(order.gross_amount ?? d.gross_amount ?? 0);
                  const received = Number(order.advance_payment ?? d.advance_payment ?? 0);
                  const balance = Number(order.balance_due ?? d.balance_due ?? 0);
                  const dumpAmt = Number(d.dump_amount || 0);

                  const statusColor =
                    d.status === 'approved'
                      ? { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
                      : d.status === 'rejected'
                      ? { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' }
                      : { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };

                  return (
                    <tr key={d.id} className="adm-table-row">
                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          #{d.id}
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          <span className="adm-code-chip">{d.invoice_number}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                          {d.entity_name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          {d.customer_name} {d.customer_user_code ? `(${d.customer_user_code})` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                        {formatCurrency(gross)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                        {formatCurrency(received)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: '#d97706', fontSize: '0.9rem' }}>
                        {formatCurrency(balance)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'right', fontWeight: 800, color: '#dc2626', fontSize: '0.94rem' }}>
                        {formatCurrency(dumpAmt)}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', maxWidth: '200px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#334155',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                          title={d.dump_reason}
                        >
                          {d.dump_reason || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {d.requested_at ? new Date(d.requested_at).toLocaleDateString('en-IN') : '—'}
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                          }}
                        >
                          ● {d.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1.15rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                          {d.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDumpForApprove(d);
                                  setApproveError('');
                                }}
                                className="adm-hero-btn-primary"
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.74rem',
                                }}
                              >
                                <Check size={12} strokeWidth={2.4} />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDumpForReject(d);
                                  setRejectionReason('');
                                  setRejectError('');
                                }}
                                style={{
                                  background: '#ffffff',
                                  color: '#dc2626',
                                  border: '1.5px solid #fecaca',
                                  borderRadius: '8px',
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#dc2626';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#ffffff';
                                  e.currentTarget.style.color = '#dc2626';
                                }}
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setSelectedDumpForDetails(d)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#f8fafc',
                              color: '#334155',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Eye size={12} />
                            <span>Details</span>
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

        {/* Pagination Footer */}
        {filteredDumps.length > pageSize && (
          <div
            style={{
              padding: '0.85rem 1.4rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
              color: '#64748b',
              background: '#f8fafc',
            }}
          >
            <div style={{ fontWeight: 600 }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredDumps.length)} of {filteredDumps.length} requests
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: currentPage === 1 ? '#f1f5f9' : '#fff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span style={{ padding: '0.4rem 0.75rem', fontWeight: 800, color: '#0f172a' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#fff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: APPROVE DUMP MODAL                                               */}
      {/* ========================================================================= */}
      {selectedDumpForApprove && (() => {
        const d = selectedDumpForApprove;
        const order = d.order || {};
        const commissionRate = Number(order.admin_commission_percent ?? d.admin_commission_percent ?? 15);
        const dumpAmt = Number(d.dump_amount || 0);
        const dumpCut = Math.round(((dumpAmt * commissionRate) / 100) * 100) / 100;
        const totalPaise = Math.round(dumpCut * 100);
        const directPaise = Math.round(totalPaise * 0.4);
        const levelPaise = Math.round(totalPaise * 0.4);
        const rewardPaise = totalPaise - directPaise - levelPaise;

        const directDump = directPaise / 100;
        const levelDump = levelPaise / 100;
        const rewardDump = rewardPaise / 100;

        const gross = Number(order.gross_amount ?? d.gross_amount ?? 0);
        const received = Number(order.advance_payment ?? d.advance_payment ?? 0);
        const currentBalance = Number(order.balance_due ?? d.balance_due ?? 0);
        const balanceAfterDump = Math.max(0, currentBalance - dumpAmt);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99990,
              padding: '1.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !approving) {
                setSelectedDumpForApprove(null);
              }
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1.5px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '1.25rem 1.6rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="adm-3d-pod adm-pod-emerald" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                    <CheckCircle2 size={20} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Review &amp; Approve Dump Payment
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      Request #{d.id} for Invoice <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>{d.invoice_number}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDumpForApprove(null)}
                  disabled={approving}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: approving ? 'not-allowed' : 'pointer',
                    color: '#64748b',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {approveError && (
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '12px',
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {approveError}
                  </div>
                )}

                {/* Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.85rem',
                    backgroundColor: '#f8fafc',
                    padding: '1.15rem',
                    borderRadius: '14px',
                    border: '1.5px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Entity</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginTop: '2px' }}>{d.entity_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Customer</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginTop: '2px' }}>
                      {d.customer_name} {d.customer_user_code ? `(${d.customer_user_code})` : ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Total Project Gross</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginTop: '2px' }}>{formatCurrency(gross)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Actual Cash Received</div>
                    <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.9rem', marginTop: '2px' }}>{formatCurrency(received)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Current Balance Due</div>
                    <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.9rem', marginTop: '2px' }}>{formatCurrency(currentBalance)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Approved Commission Rate</div>
                    <div style={{ fontWeight: 800, color: '#3569a7', fontSize: '0.9rem', marginTop: '2px' }}>{commissionRate}% (Fixed from Order)</div>
                  </div>
                </div>

                {/* Dump Reason Box */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#374151', marginBottom: '0.35rem' }}>
                    Entity's Reported Reason:
                  </div>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', fontSize: '0.84rem', color: '#92400e', fontWeight: 600 }}>
                    {d.dump_reason || 'No specific reason provided.'}
                  </div>
                </div>

                {/* Live 40/40/20 Accounting Calculation */}
                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f8fafc', fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                    Live 40/40/20 Dump Accounting Breakdown
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                      <span style={{ color: '#475569' }}>Requested Dump Amount:</span>
                      <strong style={{ color: '#dc2626', fontSize: '0.95rem' }}>{formatCurrency(dumpAmt)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px dashed #e2e8f0' }}>
                      <span style={{ color: '#475569' }}>Dump Admin Cut ({commissionRate}%):</span>
                      <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>{formatCurrency(dumpCut)}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: '10px', textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800 }}>Direct Dump (40%)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(directDump)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800 }}>Level Dump (40%)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(levelDump)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800 }}>Reward Dump (20%)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(rewardDump)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem' }}>
                      <span style={{ color: '#334155', fontWeight: 700 }}>Remaining Collectible Balance After Dump:</span>
                      <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{formatCurrency(balanceAfterDump)}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <strong>Safety Notice:</strong> Approving this dump will atomically write off {formatCurrency(dumpAmt)} from the collectible balance and record 40/40/20 in dump accounting. No cash receipt will be generated.
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1.15rem 1.6rem',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  backgroundColor: '#f8fafc',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedDumpForApprove(null)}
                  disabled={approving}
                  style={{
                    padding: '0.65rem 1.25rem',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: approving ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={approving}
                  className="adm-hero-btn-primary"
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.84rem',
                    opacity: approving ? 0.7 : 1,
                  }}
                >
                  <Check size={16} strokeWidth={2.4} />
                  <span>{approving ? 'Processing...' : 'Confirm & Approve Dump'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT DUMP MODAL                                                */}
      {/* ========================================================================= */}
      {selectedDumpForReject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !rejecting) {
              setSelectedDumpForReject(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #fecaca',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.6rem',
                borderBottom: '1px solid #fee2e2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-crimson" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                  <ShieldAlert size={20} strokeWidth={2.4} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                    Reject Dump Payment Request
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#b91c1c' }}>
                    Request #{selectedDumpForReject.id} • Invoice {selectedDumpForReject.invoice_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDumpForReject(null)}
                disabled={rejecting}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                  color: '#991b1b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {rejectError && (
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    backgroundColor: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    color: '#b91c1c',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {rejectError}
                </div>
              )}

              <p style={{ fontSize: '0.86rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                You are rejecting Request <strong>#{selectedDumpForReject.id}</strong> ({formatCurrency(selectedDumpForReject.dump_amount)}) for Invoice <strong>{selectedDumpForReject.invoice_number}</strong>.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this dump request is rejected (e.g. payment received offline, invalid dispute)..."
                  className="adm-toolbar-input"
                  style={{
                    width: '100%',
                    height: '95px',
                    padding: '0.75rem',
                    resize: 'vertical',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '1.15rem 1.6rem',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedDumpForReject(null)}
                disabled={rejecting}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
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
                  padding: '0.65rem 1.5rem',
                  backgroundColor: rejecting ? '#fca5a5' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <X size={15} strokeWidth={2.4} />
                <span>{rejecting ? 'Rejecting...' : 'Reject Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW DETAILS MODAL                                               */}
      {/* ========================================================================= */}
      {selectedDumpForDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99990,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedDumpForDetails(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1.25rem 1.6rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="adm-3d-pod adm-pod-steel" style={{ width: '40px', height: '40px', borderRadius: '12px' }}>
                  <FileText size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Dump Request Details #{selectedDumpForDetails.id}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Invoice {selectedDumpForDetails.invoice_number}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDumpForDetails(null)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '0.85rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.85rem',
                  background: '#f8fafc',
                  padding: '1.15rem',
                  borderRadius: '14px',
                  border: '1.5px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Invoice</span>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedDumpForDetails.invoice_number}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Status</span>
                  <div style={{ textTransform: 'uppercase', fontWeight: 800, color: selectedDumpForDetails.status === 'approved' ? '#047857' : selectedDumpForDetails.status === 'rejected' ? '#b91c1c' : '#b45309', marginTop: '2px' }}>
                    ● {selectedDumpForDetails.status}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Entity</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedDumpForDetails.entity_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Customer</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedDumpForDetails.customer_name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Dump Amount</span>
                  <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.94rem', marginTop: '2px' }}>
                    {formatCurrency(selectedDumpForDetails.dump_amount)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Commission Cut</span>
                  <div style={{ color: '#1e40af', fontWeight: 800, fontSize: '0.94rem', marginTop: '2px' }}>
                    {formatCurrency(selectedDumpForDetails.admin_commission_cut)} ({selectedDumpForDetails.admin_commission_percent}%)
                  </div>
                </div>
              </div>

              {selectedDumpForDetails.status === 'approved' && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#047857', marginBottom: '0.65rem' }}>
                    Approved Dump Accounting (40/40/20)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 800 }}>Direct (40%)</div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(selectedDumpForDetails.direct_income_amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 800 }}>Level (40%)</div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(selectedDumpForDetails.level_income_amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 800 }}>Reward (20%)</div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(selectedDumpForDetails.reward_income_amount)}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedDumpForDetails.status === 'rejected' && (
                <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '0.35rem' }}>Admin Rejection Reason</div>
                  <div style={{ color: '#7f1d1d', fontWeight: 600 }}>{selectedDumpForDetails.admin_rejection_reason || '—'}</div>
                </div>
              )}

              <div>
                <strong style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  Reported Reason:
                </strong>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#334155' }}>
                  {selectedDumpForDetails.dump_reason || 'None provided'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '1.15rem 1.6rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                type="button"
                className="adm-hero-btn-primary"
                onClick={() => setSelectedDumpForDetails(null)}
                style={{ padding: '0.6rem 1.4rem', fontSize: '0.82rem' }}
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
