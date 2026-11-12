import React, { useState, useMemo, useEffect } from 'react';
import { getTodayIndianDateString, formatDate, formatDateTime } from '../utils/timezone';
import { useNavigate } from 'react-router-dom';
import { getEntityOrders, reportOrderDump } from '../api/entityService';
import { useBranding } from '../utils/branding';
import { computeInvoiceFinancials } from '../utils/invoiceCalculations';
import EntityInvoicePrintView from '../components/EntityInvoicePrintView';

function EntityOrders() {
  const navigate = useNavigate();
  const { appName, logoUrl } = useBranding();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Partner Account';
  const entityId =
    currentEntity?.entity_details?.entity_id ||
    currentEntity?.id ||
    null;

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'partial' | 'completed'
  const [approvalFilter, setApprovalFilter] = useState('all'); // 'all' | 'pending' | 'confirmed'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceiptPaymentId, setSelectedReceiptPaymentId] = useState(null);

  useEffect(() => {
    if (selectedInvoice) {
      document.body.classList.add('has-entity-invoice-open');
    } else {
      document.body.classList.remove('has-entity-invoice-open');
      setSelectedReceiptPaymentId(null);
    }
    return () => {
      document.body.classList.remove('has-entity-invoice-open');
    };
  }, [selectedInvoice]);

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    requestAnimationFrame(() => {
      const printImages = Array.from(document.querySelectorAll('.entity-invoice-print-sheet img'));
      const pendingImages = printImages.filter((img) => !img.complete);
      if (pendingImages.length === 0) {
        window.print();
        return;
      }
      Promise.all(
        pendingImages.map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
              setTimeout(resolve, 1200);
            })
        )
      ).then(() => window.print());
    });
  };

  // Dump Payment Request State
  const [selectedOrderForDump, setSelectedOrderForDump] = useState(null);
  const [dumpAmount, setDumpAmount] = useState('');
  const [dumpReason, setDumpReason] = useState('');
  const [dumpNotes, setDumpNotes] = useState('');
  const [submittingDump, setSubmittingDump] = useState(false);
  const [dumpError, setDumpError] = useState('');
  const [dumpSuccessToast, setDumpSuccessToast] = useState('');

  const handleOpenDumpModal = (order) => {
    setSelectedOrderForDump(order);
    const balance = Number(order.balanceDue ?? order.balance_due ?? 0);
    setDumpAmount(balance > 0 ? String(balance) : '');
    setDumpReason('');
    setDumpNotes('');
    setDumpError('');
  };

  const handleReportDumpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderForDump) return;
    const amount = Number(dumpAmount);
    if (!amount || amount <= 0) {
      setDumpError('Please enter a valid dump amount greater than zero.');
      return;
    }
    const balance = Number(selectedOrderForDump.balanceDue ?? selectedOrderForDump.balance_due ?? 0);
    if (amount > balance) {
      setDumpError(`Dump amount cannot exceed remaining collectible balance of ₹${balance.toLocaleString('en-IN')}.`);
      return;
    }
    if (!dumpReason.trim() || dumpReason.trim().length < 5) {
      setDumpError('Please provide a detailed reason (minimum 5 characters) explaining why this payment has become dump.');
      return;
    }

    setSubmittingDump(true);
    setDumpError('');
    try {
      await reportOrderDump(selectedOrderForDump.id, {
        dump_amount: amount,
        dump_reason: dumpReason.trim(),
        notes: dumpNotes.trim() || undefined,
        entity_id: entityId,
        entity_name: entityName,
      });
      setDumpSuccessToast('Dump Payment request submitted successfully. It is awaiting Admin approval.');
      setTimeout(() => setDumpSuccessToast(''), 5000);
      setSelectedOrderForDump(null);
      await loadSales();
    } catch (err) {
      console.error('Error submitting dump payment request:', err);
      setDumpError(err?.message || 'Failed to submit dump request.');
    } finally {
      setSubmittingDump(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const records = await getEntityOrders({
        entity: entityName,
        entity_id: entityId,
      });
      setSalesList(records || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [entityName, entityId]);

  // Filter Sales: Active orders (pending & confirmed) shown by default; cancelled orders separated
  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      const approval = (s.approval_status ?? s.approvalStatus ?? 'confirmed').toLowerCase();
      
      // If approvalFilter is 'all', show pending and confirmed orders (exclude cancelled from active list)
      if (approvalFilter === 'all' && approval === 'cancelled') {
        return false;
      }
      if (approvalFilter !== 'all' && approval !== approvalFilter) {
        return false;
      }

      const matchSearch =
        (s.invoiceNumber || s.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer || s.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer_user_code || s.customerUserCode || s.sponsor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.item || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      if (dateFilter === 'today') {
        const todayStr = getTodayIndianDateString();
        return matchSearch && matchStatus && (s.date === todayStr || (s.created_at && s.created_at.startsWith(todayStr)));
      }
      return matchSearch && matchStatus;
    });
  }, [salesList, searchQuery, statusFilter, approvalFilter, dateFilter]);

  // Financial Totals (excluding cancelled)
  const activeOrders = useMemo(() => {
    return salesList.filter((s) => (s.approval_status ?? s.approvalStatus ?? 'confirmed').toLowerCase() !== 'cancelled');
  }, [salesList]);

  const totalGross = useMemo(() => {
    return activeOrders.reduce((acc, curr) => acc + (Number(curr.grossAmount ?? curr.gross_amount) || 0), 0);
  }, [activeOrders]);

  const totalCollected = useMemo(() => {
    return activeOrders.reduce((acc, curr) => acc + (Number(curr.advancePayment ?? curr.advance_payment) || 0), 0);
  }, [activeOrders]);

  const totalBalanceDue = useMemo(() => {
    return activeOrders.reduce((acc, curr) => acc + (Number(curr.balanceDue ?? curr.balance_due) || 0), 0);
  }, [activeOrders]);

  const totalAdminCommission = useMemo(() => {
    return activeOrders.reduce((acc, curr) => {
      const fin = computeInvoiceFinancials(curr);
      return acc + (fin ? fin.adminCommissionCut : 0);
    }, 0);
  }, [activeOrders]);

  const totalNetEarnings = useMemo(() => {
    return activeOrders.reduce((acc, curr) => {
      const fin = computeInvoiceFinancials(curr);
      return acc + (fin ? fin.netEntityRealized : 0);
    }, 0);
  }, [activeOrders]);

  const pendingCount = useMemo(() => {
    return salesList.filter((s) => (s.approval_status ?? s.approvalStatus ?? 'confirmed').toLowerCase() === 'pending').length;
  }, [salesList]);

  const cancelledCount = useMemo(() => {
    return salesList.filter((s) => (s.approval_status ?? s.approvalStatus ?? 'confirmed').toLowerCase() === 'cancelled').length;
  }, [salesList]);

  return (
    <div className="page-container" style={{ width: '100%', padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="page-subheader" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              My Orders & Fulfilment
            </h1>
            {pendingCount > 0 && (
              <span
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  border: '1px solid #fde68a',
                }}
              >
                {pendingCount} Pending Approval
              </span>
            )}
          </div>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Track orders, view approval milestones, and collect balance installments for <strong>{entityName}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/entity/orders/cancelled')}
              style={{
                padding: '0.55rem 0.95rem',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancelled Orders ({cancelledCount}) →
            </button>
          )}
          <button
            type="button"
            onClick={loadSales}
            style={{
              padding: '0.55rem 0.95rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/entity/orders/create')}
            style={{
              padding: '0.55rem 1.15rem',
              background: 'linear-gradient(135deg, #636B2F 0%, #505726 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(99, 107, 47, 0.25)',
            }}
          >
            + Create New Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL ACTIVE CONTRACTS</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {formatCurrency(totalGross)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {activeOrders.length} Active Orders
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>AMOUNT COLLECTED</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            {formatCurrency(totalCollected)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Advance & Balance Payments
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>OUTSTANDING BALANCE</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: totalBalanceDue > 0 ? '#b45309' : '#16a34a', marginTop: '0.35rem' }}>
            {formatCurrency(totalBalanceDue)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            To be collected on delivery
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>ADMIN COMMISSION</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            {formatCurrency(totalAdminCommission)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Cut on Collected Funds
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>NET REALIZED EARNINGS</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#636B2F', marginTop: '0.35rem' }}>
            {formatCurrency(totalNetEarnings)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Net Entity Retained
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="content-card" style={{ padding: '1.15rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, Member ID, or Offering..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a' }}
          />
        </div>

        {/* Approval Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setApprovalFilter('all')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: approvalFilter === 'all' ? '1px solid #636B2F' : '1px solid #cbd5e1',
              background: approvalFilter === 'all' ? '#636B2F' : '#ffffff',
              color: approvalFilter === 'all' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All Active ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('pending')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: approvalFilter === 'pending' ? '1px solid #d97706' : '1px solid #cbd5e1',
              background: approvalFilter === 'pending' ? '#d97706' : '#ffffff',
              color: approvalFilter === 'pending' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⏳ Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('confirmed')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: approvalFilter === 'confirmed' ? '1px solid #16a34a' : '1px solid #cbd5e1',
              background: approvalFilter === 'confirmed' ? '#16a34a' : '#ffffff',
              color: approvalFilter === 'confirmed' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✓ Confirmed
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '6px',
              border: statusFilter === 'all' ? '1px solid #475569' : '1px solid #cbd5e1',
              background: statusFilter === 'all' ? '#475569' : '#ffffff',
              color: statusFilter === 'all' ? '#ffffff' : '#475569',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Payments
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('partial')}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '6px',
              border: statusFilter === 'partial' ? '1px solid #b45309' : '1px solid #cbd5e1',
              background: statusFilter === 'partial' ? '#fffbeb' : '#ffffff',
              color: '#b45309',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Partial Due
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '0.4rem 0.65rem',
              borderRadius: '6px',
              border: statusFilter === 'completed' ? '1px solid #16a34a' : '1px solid #cbd5e1',
              background: statusFilter === 'completed' ? '#f0fdf4' : '#ffffff',
              color: '#166534',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fully Paid
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="content-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>INVOICE / ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>DATE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>CUSTOMER</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>MEMBER ID</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700 }}>OFFERING</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>PROJECT VALUE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>COLLECTED</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' }}>BALANCE DUE</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>APPROVAL</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>PAYMENT STATUS</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '28px', height: '28px', borderColor: '#636B2F transparent transparent transparent' }} />
                    Loading your orders...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      {searchQuery ? 'No Matching Orders Found' : 'No Orders Found'}
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                      {searchQuery ? 'Try adjusting your search query or filters.' : 'Click "+ Create New Order" above to record your first order.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const invoiceNo = sale.invoiceNumber || sale.invoice_number || `ORD-${sale.id}`;
                  const gross = Number(sale.grossAmount ?? sale.gross_amount ?? 0);
                  const collected = Number(sale.advancePayment ?? sale.advance_payment ?? 0);
                  const balance = Number(sale.balanceDue ?? sale.balance_due ?? Math.max(0, gross - collected));
                  const isPartial = balance > 0;
                  const approvalStatus = (sale.approval_status ?? sale.approvalStatus ?? 'confirmed').toLowerCase();
                  const isPending = approvalStatus === 'pending';
                  const isConfirmed = approvalStatus === 'confirmed';
                  const isCancelled = approvalStatus === 'cancelled';

                  return (
                    <tr
                      key={sale.id || invoiceNo}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div>{invoiceNo}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>ID: #{sale.id}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formatDate(sale.date || sale.created_at)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{sale.customerName || sale.customer_name || sale.customer}</div>
                        {(sale.customerEmail || sale.customer_email) && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sale.customerEmail || sale.customer_email}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2563eb', fontWeight: 600, fontFamily: 'monospace' }}>
                        {sale.customer_user_code || sale.customerUserCode || sale.sponsor || 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{sale.item}</div>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'capitalize' }}>
                          {sale.item_type || sale.itemType || 'service'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(gross)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        {formatCurrency(collected)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: isPartial ? '#b45309' : '#16a34a' }}>
                        {formatCurrency(balance)}
                      </td>
                      {/* Approval Status Badge (Prompt Section 5.A) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {isPending ? (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #fde68a',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ⏳ Pending Approval
                          </span>
                        ) : isConfirmed ? (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #bbf7d0',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ✓ Confirmed
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              border: '1px solid #fecaca',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ✕ Cancelled
                          </span>
                        )}
                      </td>
                      {/* Payment Settlement Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: isPartial ? '#fffbeb' : '#f0fdf4',
                            color: isPartial ? '#b45309' : '#166534',
                            border: isPartial ? '1px solid #fef3c7' : '1px solid #dcfce7',
                          }}
                        >
                          {isPartial ? 'Partial Due' : 'Fully Paid'}
                        </span>
                      </td>
                      {/* Actions Column (Prompt Section 5.C & 5.D) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceiptPaymentId(null);
                              setSelectedInvoice(sale);
                            }}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            📄 Details
                          </button>
                          {/* Receive Balance strictly disabled/hidden for pending or cancelled orders */}
                          {isConfirmed && isPartial && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate('/entity/payments')}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: 'linear-gradient(135deg, #636B2F 0%, #505726 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                💵 Collect
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDumpModal(sale)}
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Report uncollectible balance as Dump Payment to Admin"
                              >
                                ⚠️ Report Dump
                              </button>
                            </>
                          )}
                          {isPending && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#92400e',
                                background: '#fef3c7',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                              title="Balance collection will become available after Admin confirms this order."
                            >
                              Locked
                            </span>
                          )}
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

      {/* Dump Payment Toast */}
      {dumpSuccessToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '14px 22px',
          borderRadius: '8px',
          backgroundColor: '#10B981',
          color: '#ffffff',
          fontWeight: '600',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        }}>
          {dumpSuccessToast}
        </div>
      )}

      {/* Report Dump Payment Modal */}
      {selectedOrderForDump && (() => {
        const o = selectedOrderForDump;
        const gross = Number(o.grossAmount ?? o.gross_amount ?? 0);
        const collected = Number(o.advancePayment ?? o.advance_payment ?? 0);
        const balance = Number(o.balanceDue ?? o.balance_due ?? 0);
        return (
          <div style={{
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
            zIndex: 9999,
            padding: '16px',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F9FAFB',
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                    Report Dump Payment
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                    Invoice #{o.invoiceNumber || o.invoice_number || o.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDump(null)}
                  disabled={submittingDump}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#9CA3AF', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleReportDumpSubmit} style={{ padding: '24px' }}>
                {dumpError && (
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #F87171',
                    borderRadius: '8px',
                    color: '#B91C1C',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}>
                    {dumpError}
                  </div>
                )}

                {/* Financial Overview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '10px',
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '18px',
                  textAlign: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Project Gross</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{formatCurrency(gross)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Collected</div>
                    <div style={{ fontWeight: 700, color: '#059669', marginTop: '2px' }}>{formatCurrency(collected)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding</div>
                    <div style={{ fontWeight: 700, color: '#D97706', marginTop: '2px' }}>{formatCurrency(balance)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Dump Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    value={dumpAmount}
                    onChange={(e) => setDumpAmount(e.target.value)}
                    placeholder="Enter amount to write off"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                    Maximum collectible balance available for dump: {formatCurrency(balance)}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Reason for Uncollectible Payment *
                  </label>
                  <textarea
                    rows={3}
                    value={dumpReason}
                    onChange={(e) => setDumpReason(e.target.value)}
                    placeholder="Describe why this balance could not be collected (e.g. customer business shut down, legal settlement, project cancellation)..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={dumpNotes}
                    onChange={(e) => setDumpNotes(e.target.value)}
                    placeholder="Internal reference notes or customer conversation summary..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: '#6B7280',
                  backgroundColor: '#F3F4F6',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}>
                  <strong>Note:</strong> Dump Payment is NOT an actual cash receipt. Once submitted, it will be placed in Admin pending queue. The order balance will only be updated upon Admin approval.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForDump(null)}
                    disabled={submittingDump}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#F3F4F6',
                      color: '#4B5563',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: submittingDump ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDump}
                    style={{
                      padding: '10px 22px',
                      backgroundColor: submittingDump ? '#9CA3AF' : '#DC2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: submittingDump ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submittingDump ? 'Submitting...' : 'Submit Dump Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (() => {
        const invoiceFin = computeInvoiceFinancials(selectedInvoice, selectedReceiptPaymentId);
        const isReceiptMode = invoiceFin?.mode === 'payment_receipt' && invoiceFin?.selectedPayment;
        const activeReceipt = invoiceFin?.selectedPayment;
        const sortedPayments = [...(invoiceFin?.eligiblePayments || [])].sort((a, b) => Number(a.id) - Number(b.id));
        const approvalStatusVal = (selectedInvoice.approval_status ?? selectedInvoice.approvalStatus ?? 'confirmed').toLowerCase();

        return (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1rem',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedInvoice(null);
                }
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '720px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '1.75rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={logoUrl || '/logo.png'}
                      alt={appName}
                      style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e2e8f0', background: '#ffffff' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#636B2F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {appName}
                      </div>
                      <h3 style={{ margin: '0.1rem 0 0.2rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        {isReceiptMode ? `PAYMENT RECEIPT #RCPT-${activeReceipt.id}` : 'ORDER DETAILS & TAX INVOICE'}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Invoice: <strong>{selectedInvoice.invoiceNumber || selectedInvoice.invoice_number || `ORD-${selectedInvoice.id}`}</strong> | Order ID: <strong>#{selectedInvoice.id}</strong> | Date: <strong>{formatDate(selectedInvoice.date || selectedInvoice.created_at)}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}
                    aria-label="Close invoice"
                  >
                    ✕
                  </button>
                </div>

                {/* Approval Status Banner inside Modal */}
                {approvalStatusVal === 'pending' ? (
                  <div
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1.25rem',
                      color: '#92400e',
                      fontSize: '0.825rem',
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⏳</span>
                    <div>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>PENDING ADMIN APPROVAL</div>
                      <div style={{ marginTop: '0.2rem', lineHeight: 1.45 }}>
                        Your order is awaiting Admin review. Balance collection and further payment actions will become available after confirmation.
                      </div>
                    </div>
                  </div>
                ) : approvalStatusVal === 'cancelled' ? (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      marginBottom: '1.25rem',
                      color: '#991b1b',
                      fontSize: '0.825rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>✕ ORDER CANCELLED BY ADMIN</div>
                    <div style={{ marginTop: '0.25rem', fontWeight: 600 }}>
                      Reason: &quot;{selectedInvoice.cancellation_reason || selectedInvoice.cancellationReason || 'No reason specified'}&quot;
                    </div>
                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', opacity: 0.9 }}>
                      Balance collection is voided. To view full audit details, visit{' '}
                      <span
                        onClick={() => {
                          setSelectedInvoice(null);
                          navigate('/entity/orders/cancelled');
                        }}
                        style={{ textDecoration: 'underline', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancelled Orders
                      </span>.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      padding: '0.65rem 1rem',
                      marginBottom: '1.25rem',
                      color: '#166534',
                      fontSize: '0.825rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 800 }}>✓ ORDER CONFIRMED</span>
                      <span style={{ fontSize: '0.78rem', marginLeft: '0.5rem', color: '#15803d' }}>
                        (Approved Admin Commission: {invoiceFin.commissionPercent}%)
                      </span>
                    </div>
                    {selectedInvoice.admin_confirmed_at && (
                      <span style={{ fontSize: '0.72rem', color: '#166534' }}>
                        Confirmed {formatDate(selectedInvoice.admin_confirmed_at)}
                      </span>
                    )}
                  </div>
                )}

                {/* Order Summary vs Individual Payment Receipt Selector */}
                {sortedPayments.length > 0 && (
                  <div style={{ marginBottom: '1.15rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Invoice View Mode ({sortedPayments.length} Verified {sortedPayments.length === 1 ? 'Payment' : 'Payments'})
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptPaymentId(null)}
                        style={{
                          padding: '0.38rem 0.75rem',
                          borderRadius: '8px',
                          border: selectedReceiptPaymentId === null ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                          background: selectedReceiptPaymentId === null ? '#0f172a' : '#f8fafc',
                          color: selectedReceiptPaymentId === null ? '#ffffff' : '#334155',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Order Summary (Collected: {formatCurrency(invoiceFin.orderCollectedToDate)})
                      </button>
                      {sortedPayments.map((p) => {
                        const isActive = String(selectedReceiptPaymentId) === String(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedReceiptPaymentId(p.id)}
                            style={{
                              padding: '0.38rem 0.75rem',
                              borderRadius: '8px',
                              border: isActive ? '1.5px solid #636B2F' : '1px solid #cbd5e1',
                              background: isActive ? '#636B2F' : '#f8fafc',
                              color: isActive ? '#ffffff' : '#334155',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                            }}
                          >
                            RCPT-{p.id} ({p.payment_type || p.paymentType || 'Payment'}: {formatCurrency(p.amount)})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Seller & Customer Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                  <div>
                    <strong style={{ color: '#475569', display: 'block', marginBottom: '0.2rem' }}>SELLER / ENTITY:</strong>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.entityName || selectedInvoice.entity_name || entityName}</div>
                    <div style={{ color: '#64748b' }}>Authorized Partner Portal</div>
                  </div>
                  <div>
                    <strong style={{ color: '#475569', display: 'block', marginBottom: '0.2rem' }}>BILLED TO:</strong>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.customerName || selectedInvoice.customer_name || selectedInvoice.customer}</div>
                    <div style={{ color: '#2563eb', fontFamily: 'monospace' }}>
                      Member ID: {selectedInvoice.customer_user_code || selectedInvoice.customerUserCode || selectedInvoice.sponsor || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Payment-Specific Metadata (Receipt Mode) */}
                {isReceiptMode && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', color: '#166534' }}>
                    <span><strong>Receipt:</strong> RCPT-{activeReceipt.id} ({activeReceipt.payment_type || activeReceipt.paymentType || 'Payment'})</span>
                    <span><strong>Mode:</strong> {activeReceipt.payment_method || activeReceipt.paymentMethod || 'N/A'}</span>
                    <span><strong>Ref/UTR:</strong> {activeReceipt.reference_no || activeReceipt.referenceNo || 'N/A'}</span>
                    <span><strong>Date:</strong> {formatDateTime(activeReceipt.payment_date || activeReceipt.paymentDate || activeReceipt.created_at)}</span>
                  </div>
                )}

                {/* Authoritative Payment-Based Financial Breakdown */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.75rem' }}>
                    <span><strong>Total Order Cost ({selectedInvoice.item}):</strong></span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(invoiceFin.totalOrderCost)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '0.5rem', fontWeight: 700 }}>
                    <span>
                      {isReceiptMode
                        ? `Actual Payment Received (Receipt #RCPT-${activeReceipt.id}):`
                        : `Amount Collected to Date (${invoiceFin.paymentCount} ${invoiceFin.paymentCount === 1 ? 'payment' : 'payments'}):`}
                    </span>
                    <span>{formatCurrency(invoiceFin.actualPaymentAmount)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <span>
                      Admin Commission Cut ({invoiceFin.commissionPercent}% on {isReceiptMode ? 'This Payment' : 'Collected'} {formatCurrency(invoiceFin.actualPaymentAmount)}):
                    </span>
                    <span>-{formatCurrency(invoiceFin.adminCommissionCut)}</span>
                  </div>

                  <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginBottom: !isReceiptMode ? '0.5rem' : 0, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9rem', color: '#166534' }}>
                    <span>{isReceiptMode ? 'Net Entity Realized (This Payment):' : 'Net Entity Realized (From Collected Payments):'}</span>
                    <span>{formatCurrency(invoiceFin.netEntityRealized)}</span>
                  </div>

                  {!isReceiptMode && invoiceFin.approvedDumpAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9a3412', marginBottom: '0.45rem', fontWeight: 600 }}>
                      <span>Approved Dump Write-Off:</span>
                      <span>-{formatCurrency(invoiceFin.approvedDumpAmount)}</span>
                    </div>
                  )}

                  {!isReceiptMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: invoiceFin.remainingOrderBalance > 0 ? '#b45309' : '#16a34a', fontWeight: 700 }}>
                      <span>Remaining Order Balance Due:</span>
                      <span>{formatCurrency(invoiceFin.remainingOrderBalance)}</span>
                    </div>
                  )}

                  {isReceiptMode && (
                    <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px dashed #cbd5e1', fontSize: '0.75rem', color: '#475569', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>Order Cumulative Collected: <strong>{formatCurrency(invoiceFin.orderCollectedToDate)}</strong></span>
                      <span>Remaining Order Balance: <strong>{formatCurrency(invoiceFin.remainingOrderBalance)}</strong></span>
                    </div>
                  )}
                </div>

                {/* Payment Installments Table (Order Summary Mode) */}
                {!isReceiptMode && sortedPayments.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Payment Receipts Breakdown ({sortedPayments.length})
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'left' }}>Receipt</th>
                            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'left' }}>Type &amp; Ref</th>
                            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Received</th>
                            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Admin Cut</th>
                            <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Net Realized</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedPayments.map((p) => {
                            const amt = Number(p.amount) || 0;
                            const pct = Number(p.adminCommissionPercent ?? p.admin_commission_percent ?? invoiceFin.commissionPercent);
                            const cut = Number(p.adminCommissionCut ?? p.admin_commission_cut ?? (amt * pct) / 100);
                            const net = Number(p.netEntityAmount ?? p.net_entity_amount ?? Math.max(0, amt - cut));
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700 }}>
                                  RCPT-{p.id}
                                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                                    {formatDate(p.payment_date || p.paymentDate || p.created_at)}
                                  </div>
                                </td>
                                <td style={{ padding: '0.45rem 0.65rem', textTransform: 'capitalize' }}>
                                  {p.payment_type || p.paymentType || 'payment'} • {p.payment_method || p.paymentMethod || 'N/A'}
                                  {(p.reference_no || p.referenceNo) && (
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      {p.reference_no || p.referenceNo}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(amt)}</td>
                                <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', color: '#dc2626' }}>-{formatCurrency(cut)} ({pct}%)</td>
                                <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(net)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    style={{ padding: '0.55rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    🖨️ Print Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    style={{ padding: '0.55rem 1rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Dedicated Full-Page A4 Portrait Print Sheet (Mounted on document.body via Portal) */}
            <EntityInvoicePrintView
              order={selectedInvoice}
              selectedPaymentId={selectedReceiptPaymentId}
              entityProfile={currentEntity}
              fallbackEntityName={entityName}
            />
          </>
        );
      })()}
    </div>
  );
}

export default EntityOrders;
