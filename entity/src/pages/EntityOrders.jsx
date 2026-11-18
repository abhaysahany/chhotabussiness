import React, { useState, useMemo, useEffect } from 'react';
import { getTodayIndianDateString, formatDate, formatDateTime } from '../utils/timezone';
import { useNavigate } from 'react-router-dom';
import { getEntityOrders, reportOrderDump } from '../api/entityService';
import { useBranding } from '../utils/branding';
import { computeInvoiceFinancials } from '../utils/invoiceCalculations';
import EntityInvoicePrintView from '../components/EntityInvoicePrintView';
import {
  ShoppingBag,
  PlusCircle,
  RefreshCw,
  Search,
  X,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  Printer,
  ShieldAlert,
  Wallet,
  Receipt,
  User,
  Calendar,
  Layers,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

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
  const [copiedInvoiceId, setCopiedInvoiceId] = useState(null);

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

  const handleCopyCode = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedInvoiceId(id);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
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
        (s.customer || s.customer_name || s.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const confirmedCount = useMemo(() => {
    return salesList.filter((s) => (s.approval_status ?? s.approvalStatus ?? 'confirmed').toLowerCase() === 'confirmed').length;
  }, [salesList]);

  const cancelledCount = useMemo(() => {
    return salesList.filter((s) => (s.approval_status ?? s.approvalStatus ?? 'confirmed').toLowerCase() === 'cancelled').length;
  }, [salesList]);

  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="page-container" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* Top Header / Subheader */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Floating 3D Icon Pod */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'radial-gradient(135% 135% at 20% 20%, #838e3e 0%, #636B2F 55%, #3d431c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(99, 107, 47, 0.3), inset 0 2px 2px rgba(255, 255, 255, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={26} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#636B2F',
                  background: 'rgba(99, 107, 47, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(99, 107, 47, 0.2)',
                }}
              >
                ● ORDER FULFILMENT
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {entityName}
              </span>
              {pendingCount > 0 && (
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #fde68a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }}></span>
                  {pendingCount} Pending Approval
                </span>
              )}
            </div>
            <h1
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              My Orders &amp; Fulfilment
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Track contracts, monitor approval milestones, and collect customer balances for <strong>{entityName}</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/entity/orders/cancelled')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <XCircle size={15} />
              Cancelled Orders ({cancelledCount})
            </button>
          )}

          <button
            type="button"
            onClick={loadSales}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.55rem 0.95rem',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Sync DB'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/entity/orders/create')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.58rem 1.25rem',
              background: 'linear-gradient(135deg, #788434 0%, #505726 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 107, 47, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <PlusCircle size={16} />
            Create New Order
          </button>
        </div>
      </div>

      {/* 2 by 3 Financial Vault KPI Cards */}
      <div className="ent-orders-kpi-grid">
        {/* Card 1: Contracts GMV */}
        <div className="ent-kpi-card ent-kpi-card-olive">
          <div className="ent-kpi-top-row">
            <div>
              <span className="ent-kpi-category-tag" style={{ color: '#636B2F', background: 'rgba(99, 107, 47, 0.1)', whiteSpace: 'nowrap' }}>
                ● CONTRACTS GMV
              </span>
              <div className="ent-kpi-title">TOTAL ACTIVE CONTRACTS</div>
            </div>
            <div className="ent-3d-pod ent-3d-pod-sm ent-pod-olive">
              <Receipt size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="ent-kpi-value-row">
            <div className="ent-kpi-value">{formatCurrency(totalGross)}</div>
          </div>
          <div className="ent-kpi-vault-footer">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Layers size={13} color="#636B2F" />
              <span>{activeOrders.length} Invoices Processed</span>
            </span>
            <span style={{ fontWeight: 700, color: '#636B2F' }}>Lifetime Contract GMV</span>
          </div>
        </div>

        {/* Card 2: Cash Collected */}
        <div className="ent-kpi-card ent-kpi-card-emerald">
          <div className="ent-kpi-top-row">
            <div>
              <span className="ent-kpi-category-tag" style={{ color: '#059669', background: 'rgba(5, 150, 105, 0.1)', whiteSpace: 'nowrap' }}>
                ● REVENUE REALIZED
              </span>
              <div className="ent-kpi-title">AMOUNT COLLECTED</div>
            </div>
            <div className="ent-3d-pod ent-3d-pod-sm ent-pod-emerald">
              <CheckCircle2 size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="ent-kpi-value-row">
            <div className="ent-kpi-value" style={{ color: '#059669' }}>{formatCurrency(totalCollected)}</div>
          </div>
          <div className="ent-kpi-vault-footer">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
              <CreditCard size={13} />
              <span>Direct IMPS &amp; Advance</span>
            </span>
            <span style={{ fontWeight: 700, color: '#059669' }}>Realized Revenue</span>
          </div>
        </div>

        {/* Card 3: Outstanding Balance Due */}
        <div className="ent-kpi-card ent-kpi-card-amber">
          <div className="ent-kpi-top-row">
            <div>
              <span className="ent-kpi-category-tag" style={{ color: '#d97706', background: 'rgba(217, 119, 6, 0.1)', whiteSpace: 'nowrap' }}>
                ● RECEIVABLES DUE
              </span>
              <div className="ent-kpi-title">OUTSTANDING BALANCE</div>
            </div>
            <div className="ent-3d-pod ent-3d-pod-sm ent-pod-amber">
              <Clock size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="ent-kpi-value-row">
            <div className="ent-kpi-value" style={{ color: totalBalanceDue > 0 ? '#b45309' : '#059669' }}>
              {formatCurrency(totalBalanceDue)}
            </div>
          </div>
          <div className="ent-kpi-vault-footer">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#b45309', fontWeight: 600 }}>
              <AlertCircle size={13} />
              <span>Uncollected Receivables</span>
            </span>
            <span style={{ fontWeight: 700, color: '#d97706' }}>Due on Delivery</span>
          </div>
        </div>

        {/* Card 4: Net Realized Earnings */}
        <div className="ent-kpi-card ent-kpi-card-olive">
          <div className="ent-kpi-top-row">
            <div>
              <span className="ent-kpi-category-tag" style={{ color: '#636B2F', background: 'rgba(99, 107, 47, 0.1)', whiteSpace: 'nowrap' }}>
                ● ENTITY EARNINGS
              </span>
              <div className="ent-kpi-title">NET REALIZED EARNINGS</div>
            </div>
            <div className="ent-3d-pod ent-3d-pod-sm ent-pod-olive">
              <Wallet size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="ent-kpi-value-row">
            <div className="ent-kpi-value" style={{ color: '#636B2F' }}>{formatCurrency(totalNetEarnings)}</div>
          </div>
          <div className="ent-kpi-vault-footer">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={13} />
              <span>Net from Receipts</span>
            </span>
            <span style={{ fontWeight: 700, color: '#636B2F' }}>Bank Settlement Active</span>
          </div>
        </div>

        {/* Card 5: Admin Commission */}
        <div className="ent-kpi-card ent-kpi-card-rose">
          <div className="ent-kpi-top-row">
            <div>
              <span className="ent-kpi-category-tag" style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', whiteSpace: 'nowrap' }}>
                ● ADMIN COMMISSION
              </span>
              <div className="ent-kpi-title">ADMIN COMMISSION</div>
            </div>
            <div className="ent-3d-pod ent-3d-pod-sm ent-pod-rose">
              <ShieldAlert size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="ent-kpi-value-row">
            <div className="ent-kpi-value" style={{ color: '#dc2626' }}>{formatCurrency(totalAdminCommission)}</div>
          </div>
          <div className="ent-kpi-vault-footer">
            <span style={{ color: '#64748b', fontWeight: 600 }}>Platform Facilitation Cut</span>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>Cut on Receipts</span>
          </div>
        </div>

        {/* Card 6: Collection Recovery Ratio */}
        <div className="ent-kpi-card ent-kpi-card-blue">
          <div className="ent-kpi-top-row">
            <div>
              <span className="ent-kpi-category-tag" style={{ color: '#2563eb', background: 'rgba(37, 99, 235, 0.1)', whiteSpace: 'nowrap' }}>
                ● RECOVERY EFFICIENCY
              </span>
              <div className="ent-kpi-title">COLLECTION RATIO</div>
            </div>
            <div className="ent-3d-pod ent-3d-pod-sm ent-pod-blue">
              <TrendingUp size={20} strokeWidth={2.4} />
            </div>
          </div>
          <div className="ent-kpi-value-row">
            <div className="ent-kpi-value" style={{ color: '#2563eb' }}>
              {totalGross > 0 ? ((totalCollected / totalGross) * 100).toFixed(1) + '%' : '0.0%'}
            </div>
          </div>
          <div className="ent-kpi-vault-footer">
            <span style={{ color: '#64748b', fontWeight: 600 }}>
              Avg Ticket: {formatCurrency(activeOrders.length ? totalGross / activeOrders.length : 0)}
            </span>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>Recovery Progress</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ent-orders-filter-vault">
        {/* Search Box */}
        <div className="ent-orders-search-box">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            className="ent-orders-search-input"
            placeholder="Search by Invoice #, Customer, Member ID, or Offering..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Approval Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '0.2rem' }}>
            Approval:
          </span>
          <button
            type="button"
            onClick={() => setApprovalFilter('all')}
            className="ent-filter-pill-btn"
            style={{
              background: approvalFilter === 'all' ? '#636B2F' : '#f8fafc',
              borderColor: approvalFilter === 'all' ? '#636B2F' : '#e2e8f0',
              color: approvalFilter === 'all' ? '#ffffff' : '#475569',
              boxShadow: approvalFilter === 'all' ? '0 2px 8px rgba(99, 107, 47, 0.28)' : 'none',
            }}
          >
            All Active ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('pending')}
            className="ent-filter-pill-btn"
            style={{
              background: approvalFilter === 'pending' ? '#d97706' : '#f8fafc',
              borderColor: approvalFilter === 'pending' ? '#d97706' : '#e2e8f0',
              color: approvalFilter === 'pending' ? '#ffffff' : '#475569',
              boxShadow: approvalFilter === 'pending' ? '0 2px 8px rgba(217, 119, 6, 0.28)' : 'none',
            }}
          >
            ⏳ Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter('confirmed')}
            className="ent-filter-pill-btn"
            style={{
              background: approvalFilter === 'confirmed' ? '#059669' : '#f8fafc',
              borderColor: approvalFilter === 'confirmed' ? '#059669' : '#e2e8f0',
              color: approvalFilter === 'confirmed' ? '#ffffff' : '#475569',
              boxShadow: approvalFilter === 'confirmed' ? '0 2px 8px rgba(5, 150, 105, 0.28)' : 'none',
            }}
          >
            ✓ Confirmed ({confirmedCount})
          </button>
        </div>

        {/* Payment Status Filter */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '0.2rem' }}>
            Payment:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="ent-filter-pill-btn"
            style={{
              background: statusFilter === 'all' ? '#1e293b' : '#f8fafc',
              borderColor: statusFilter === 'all' ? '#1e293b' : '#e2e8f0',
              color: statusFilter === 'all' ? '#ffffff' : '#475569',
            }}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('partial')}
            className="ent-filter-pill-btn"
            style={{
              background: statusFilter === 'partial' ? '#fffbeb' : '#f8fafc',
              borderColor: statusFilter === 'partial' ? '#f59e0b' : '#e2e8f0',
              color: statusFilter === 'partial' ? '#b45309' : '#475569',
            }}
          >
            Partial Due
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className="ent-filter-pill-btn"
            style={{
              background: statusFilter === 'completed' ? '#ecfdf5' : '#f8fafc',
              borderColor: statusFilter === 'completed' ? '#10b981' : '#e2e8f0',
              color: statusFilter === 'completed' ? '#047857' : '#475569',
            }}
          >
            Fully Paid
          </button>

          {/* Date Filter Toggle */}
          <button
            type="button"
            onClick={() => setDateFilter((prev) => (prev === 'all' ? 'today' : 'all'))}
            className="ent-filter-pill-btn"
            style={{
              background: dateFilter === 'today' ? '#eff6ff' : '#f8fafc',
              borderColor: dateFilter === 'today' ? '#3b82f6' : '#e2e8f0',
              color: dateFilter === 'today' ? '#1d4ed8' : '#64748b',
              marginLeft: '0.25rem',
            }}
          >
            <Calendar size={13} />
            {dateFilter === 'today' ? "Today's Only" : 'All Dates'}
          </button>
        </div>
      </div>

      {/* Modern 3D Orders Data Table Card */}
      <div className="ent-orders-table-card">
        <div className="ent-table-responsive-box">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead className="ent-lux-thead">
              <tr>
                <th style={{ textAlign: 'left' }}>INVOICE / ID</th>
                <th style={{ textAlign: 'left' }}>DATE</th>
                <th style={{ textAlign: 'left' }}>CUSTOMER / CLIENT</th>
                <th style={{ textAlign: 'left' }}>MEMBER ID</th>
                <th style={{ textAlign: 'left' }}>OFFERING</th>
                <th style={{ textAlign: 'right' }}>PROJECT VALUE</th>
                <th style={{ textAlign: 'right' }}>COLLECTED</th>
                <th style={{ textAlign: 'right' }}>BALANCE DUE</th>
                <th style={{ textAlign: 'center' }}>APPROVAL STATUS</th>
                <th style={{ textAlign: 'center' }}>PAYMENT STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#636B2F',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 0.75rem auto',
                      }}
                    />
                    <div style={{ fontWeight: 700, color: '#334155' }}>Loading orders database...</div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: '#f1f5f9',
                        color: '#636B2F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.85rem auto',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                      }}
                    >
                      <ShoppingBag size={28} />
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {searchQuery ? 'No Matching Orders Found' : 'No Active Orders Recorded'}
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                      {searchQuery
                        ? 'Try adjusting your search keywords or clear active filters.'
                        : 'Click "+ Create New Order" above to record and bill your first customer contract.'}
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
                  const custName = sale.customerName || sale.customer_name || sale.customer || 'Unnamed Client';
                  const custEmail = sale.customerEmail || sale.customer_email || '';
                  const memberCode = sale.customer_user_code || sale.customerUserCode || sale.sponsor || 'N/A';
                  const isCopied = copiedInvoiceId === (sale.id || invoiceNo);

                  return (
                    <tr
                      key={sale.id || invoiceNo}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(248, 250, 252, 0.85)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Invoice / ID */}
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="ent-code-chip">{invoiceNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(invoiceNo, sale.id || invoiceNo)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isCopied ? '#059669' : '#94a3b8',
                              cursor: 'pointer',
                              padding: 2,
                            }}
                            title="Copy invoice number"
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                          Contract ID: #{sale.id}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="#94a3b8" />
                          <span>{formatDate(sale.date || sale.created_at)}</span>
                        </div>
                      </td>

                      {/* Customer / Client */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div className="ent-cust-avatar-pod">
                            {getInitials(custName)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                              {custName}
                            </div>
                            {custEmail && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                                {custEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Member ID */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {memberCode}
                        </span>
                      </td>

                      {/* Offering */}
                      <td style={{ padding: '1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{sale.item}</div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: '#636B2F',
                            background: 'rgba(99, 107, 47, 0.08)',
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {sale.item_type || sale.itemType || 'service'}
                        </span>
                      </td>

                      {/* Project Value */}
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                        {formatCurrency(gross)}
                      </td>

                      {/* Collected */}
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.88rem' }}>
                        {formatCurrency(collected)}
                      </td>

                      {/* Balance Due */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: isPartial ? '#b45309' : '#059669',
                          }}
                        >
                          {formatCurrency(balance)}
                        </div>
                        {isPartial && (
                          <div style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>
                            Receivable
                          </div>
                        )}
                      </td>

                      {/* Approval Status Badge */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {isPending ? (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              border: '1px solid #fde68a',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 1px 3px rgba(217, 119, 6, 0.12)',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }}></span>
                            Pending Review
                          </span>
                        ) : isConfirmed ? (
                          <span
                            style={{
                              background: '#ecfdf5',
                              color: '#065f46',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              border: '1px solid #a7f3d0',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 1px 3px rgba(5, 150, 105, 0.12)',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                            Confirmed
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#fef2f2',
                              color: '#991b1b',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              border: '1px solid #fecaca',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            ✕ Cancelled
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            background: isPartial ? '#fffbeb' : '#f0fdf4',
                            color: isPartial ? '#b45309' : '#15803d',
                            border: isPartial ? '1px solid #fde68a' : '1px solid #bbf7d0',
                          }}
                        >
                          {isPartial ? 'Partial Due' : 'Fully Settled'}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceiptPaymentId(null);
                              setSelectedInvoice(sale);
                            }}
                            className="ent-action-pill"
                            style={{
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            <FileText size={13} />
                            Details
                          </button>

                          {/* Collect Balance strictly when confirmed and balance > 0 */}
                          {isConfirmed && isPartial && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate('/entity/payments')}
                                className="ent-action-pill"
                                style={{
                                  background: 'linear-gradient(135deg, #788434 0%, #505726 100%)',
                                  color: '#ffffff',
                                  boxShadow: '0 2px 6px rgba(99, 107, 47, 0.3)',
                                }}
                              >
                                <CreditCard size={13} />
                                Collect
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDumpModal(sale)}
                                className="ent-action-pill"
                                style={{
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                }}
                                title="Report uncollectible balance as Dump Payment to Admin"
                              >
                                <AlertTriangle size={13} />
                                Dump
                              </button>
                            </>
                          )}

                          {isPending && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#92400e',
                                background: '#fef3c7',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                border: '1px solid #fde68a',
                              }}
                              title="Balance collection will unlock as soon as Admin confirms this order."
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

      {/* Dump Payment Toast Notification */}
      {dumpSuccessToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '12px',
            backgroundColor: '#059669',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: '0 10px 25px rgba(5, 150, 105, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <CheckCircle2 size={18} />
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
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                maxWidth: '540px',
                width: '100%',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'radial-gradient(135% 135% at 20% 20%, #ef4444 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                      Report Dump Payment
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Invoice #{o.invoiceNumber || o.invoice_number || o.id} • Order ID #{o.id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDump(null)}
                  disabled={submittingDump}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94a3b8', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleReportDumpSubmit} style={{ padding: '24px' }}>
                {dumpError && (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #f87171',
                      borderRadius: '10px',
                      color: '#b91c1c',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '16px',
                    }}
                  >
                    {dumpError}
                  </div>
                )}

                {/* Financial Overview mini pods */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '10px',
                    backgroundColor: '#f8fafc',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '18px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Project Value</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '2px', fontSize: '0.95rem' }}>{formatCurrency(gross)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Collected</div>
                    <div style={{ fontWeight: 800, color: '#059669', marginTop: '2px', fontSize: '0.95rem' }}>{formatCurrency(collected)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Outstanding</div>
                    <div style={{ fontWeight: 800, color: '#d97706', marginTop: '2px', fontSize: '0.95rem' }}>{formatCurrency(balance)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
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
                      padding: '10px 14px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                      color: '#0f172a',
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Maximum collectible balance available for dump: <strong>{formatCurrency(balance)}</strong>
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Reason for Uncollectible Payment *
                  </label>
                  <textarea
                    rows={3}
                    value={dumpReason}
                    onChange={(e) => setDumpReason(e.target.value)}
                    placeholder="Explain why this balance could not be collected..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      color: '#0f172a',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={dumpNotes}
                    onChange={(e) => setDumpNotes(e.target.value)}
                    placeholder="Internal reference notes..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      color: '#0f172a',
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>Important:</strong> Dump Payment is NOT a cash receipt. It will be submitted to the Admin review queue. The balance will only be updated upon Admin verification.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForDump(null)}
                    disabled={submittingDump}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontWeight: 700,
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
                      backgroundColor: submittingDump ? '#94a3b8' : '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 800,
                      cursor: submittingDump ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
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
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
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
                  borderRadius: '20px',
                  width: '100%',
                  maxWidth: '740px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '2rem',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #e2e8f0',
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '2px solid #f1f5f9',
                    paddingBottom: '1.25rem',
                    marginBottom: '1.25rem',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem' }}>
                    <img
                      src={logoUrl || '/logo.png'}
                      alt={appName}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        objectFit: 'contain',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        padding: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#636B2F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {appName} • AUTHORIZED PARTNER SLIP
                      </div>
                      <h3 style={{ margin: '0.15rem 0 0.2rem 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                        {isReceiptMode ? `PAYMENT RECEIPT #RCPT-${activeReceipt.id}` : 'TAX INVOICE & ORDER SLIP'}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Invoice: <strong>{selectedInvoice.invoiceNumber || selectedInvoice.invoice_number || `ORD-${selectedInvoice.id}`}</strong> | Contract ID: <strong>#{selectedInvoice.id}</strong> | Date: <strong>{formatDate(selectedInvoice.date || selectedInvoice.created_at)}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      color: '#64748b',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
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
                      borderRadius: '12px',
                      padding: '0.95rem 1.15rem',
                      marginBottom: '1.25rem',
                      color: '#92400e',
                      fontSize: '0.84rem',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>⏳</span>
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
                      borderRadius: '12px',
                      padding: '0.95rem 1.15rem',
                      marginBottom: '1.25rem',
                      color: '#991b1b',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>✕ ORDER CANCELLED BY ADMIN</div>
                    <div style={{ marginTop: '0.25rem', fontWeight: 600 }}>
                      Reason: &quot;{selectedInvoice.cancellation_reason || selectedInvoice.cancellationReason || 'No reason specified'}&quot;
                    </div>
                    <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', opacity: 0.9 }}>
                      Balance collection is voided. To view full audit details, visit{' '}
                      <span
                        onClick={() => {
                          setSelectedInvoice(null);
                          navigate('/entity/orders/cancelled');
                        }}
                        style={{ textDecoration: 'underline', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Cancelled Orders
                      </span>.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '12px',
                      padding: '0.75rem 1.15rem',
                      marginBottom: '1.25rem',
                      color: '#065f46',
                      fontSize: '0.84rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span style={{ fontWeight: 800 }}>ORDER CONFIRMED BY ADMIN</span>
                      <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                        (Admin Commission: {invoiceFin.commissionPercent}%)
                      </span>
                    </div>
                    {selectedInvoice.admin_confirmed_at && (
                      <span style={{ fontSize: '0.74rem', color: '#047857' }}>
                        Confirmed {formatDate(selectedInvoice.admin_confirmed_at)}
                      </span>
                    )}
                  </div>
                )}

                {/* View Mode Selector */}
                {sortedPayments.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Invoice View Mode ({sortedPayments.length} Verified {sortedPayments.length === 1 ? 'Payment' : 'Payments'})
                    </div>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptPaymentId(null)}
                        style={{
                          padding: '0.42rem 0.85rem',
                          borderRadius: '8px',
                          border: selectedReceiptPaymentId === null ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                          background: selectedReceiptPaymentId === null ? '#0f172a' : '#f8fafc',
                          color: selectedReceiptPaymentId === null ? '#ffffff' : '#334155',
                          fontSize: '0.78rem',
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
                              padding: '0.42rem 0.85rem',
                              borderRadius: '8px',
                              border: isActive ? '1.5px solid #636B2F' : '1px solid #cbd5e1',
                              background: isActive ? '#636B2F' : '#f8fafc',
                              color: isActive ? '#ffffff' : '#334155',
                              fontSize: '0.78rem',
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    fontSize: '0.84rem',
                    marginBottom: '1.25rem',
                    background: '#f8fafc',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <strong style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                      SELLER / ENTITY:
                    </strong>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedInvoice.entityName || selectedInvoice.entity_name || entityName}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Authorized Partner Portal</div>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                      BILLED TO:
                    </strong>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedInvoice.customerName || selectedInvoice.customer_name || selectedInvoice.customer}</div>
                    <div style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700 }}>
                      Member ID: {selectedInvoice.customer_user_code || selectedInvoice.customerUserCode || selectedInvoice.sponsor || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Receipt Mode Badge */}
                {isReceiptMode && (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      color: '#065f46',
                      fontWeight: 600,
                    }}
                  >
                    <span><strong>Receipt:</strong> RCPT-{activeReceipt.id} ({activeReceipt.payment_type || activeReceipt.paymentType || 'Payment'})</span>
                    <span><strong>Mode:</strong> {activeReceipt.payment_method || activeReceipt.paymentMethod || 'N/A'}</span>
                    <span><strong>Ref/UTR:</strong> {activeReceipt.reference_no || activeReceipt.referenceNo || 'N/A'}</span>
                    <span><strong>Date:</strong> {formatDateTime(activeReceipt.payment_date || activeReceipt.paymentDate || activeReceipt.created_at)}</span>
                  </div>
                )}

                {/* Authoritative Financial Breakdown Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.15rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', gap: '0.75rem' }}>
                    <span style={{ color: '#475569' }}><strong>Total Order Cost ({selectedInvoice.item}):</strong></span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatCurrency(invoiceFin.totalOrderCost)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: '0.6rem', fontWeight: 700 }}>
                    <span>
                      {isReceiptMode
                        ? `Actual Payment Received (Receipt #RCPT-${activeReceipt.id}):`
                        : `Amount Collected to Date (${invoiceFin.paymentCount} ${invoiceFin.paymentCount === 1 ? 'payment' : 'payments'}):`}
                    </span>
                    <span>{formatCurrency(invoiceFin.actualPaymentAmount)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '0.6rem', fontWeight: 600 }}>
                    <span>
                      Admin Commission Cut ({invoiceFin.commissionPercent}% on {isReceiptMode ? 'This Payment' : 'Collected'} {formatCurrency(invoiceFin.actualPaymentAmount)}):
                    </span>
                    <span>-{formatCurrency(invoiceFin.adminCommissionCut)}</span>
                  </div>

                  <div
                    style={{
                      borderTop: '1.5px solid #e2e8f0',
                      paddingTop: '0.65rem',
                      marginBottom: !isReceiptMode ? '0.6rem' : 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      color: '#636B2F',
                    }}
                  >
                    <span>{isReceiptMode ? 'Net Entity Realized (This Payment):' : 'Net Entity Realized (From Collected Payments):'}</span>
                    <span>{formatCurrency(invoiceFin.netEntityRealized)}</span>
                  </div>

                  {!isReceiptMode && invoiceFin.approvedDumpAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9a3412', marginBottom: '0.5rem', fontWeight: 600 }}>
                      <span>Approved Dump Write-Off:</span>
                      <span>-{formatCurrency(invoiceFin.approvedDumpAmount)}</span>
                    </div>
                  )}

                  {!isReceiptMode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: invoiceFin.remainingOrderBalance > 0 ? '#b45309' : '#059669', fontWeight: 800 }}>
                      <span>Remaining Order Balance Due:</span>
                      <span>{formatCurrency(invoiceFin.remainingOrderBalance)}</span>
                    </div>
                  )}

                  {isReceiptMode && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        paddingTop: '0.65rem',
                        borderTop: '1px dashed #cbd5e1',
                        fontSize: '0.76rem',
                        color: '#64748b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <span>Order Cumulative Collected: <strong>{formatCurrency(invoiceFin.orderCollectedToDate)}</strong></span>
                      <span>Remaining Order Balance: <strong>{formatCurrency(invoiceFin.remainingOrderBalance)}</strong></span>
                    </div>
                  )}
                </div>

                {/* Payment Installments Table (Order Summary Mode) */}
                {!isReceiptMode && sortedPayments.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Payment Receipts Breakdown ({sortedPayments.length})
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1.5px solid #e2e8f0' }}>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 800 }}>Receipt</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 800 }}>Type &amp; Ref</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Received</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Admin Cut</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Net Realized</th>
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
                                <td style={{ padding: '0.55rem 0.75rem', fontWeight: 800, color: '#0f172a' }}>
                                  RCPT-{p.id}
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                                    {formatDate(p.payment_date || p.paymentDate || p.created_at)}
                                  </div>
                                </td>
                                <td style={{ padding: '0.55rem 0.75rem', textTransform: 'capitalize', color: '#334155' }}>
                                  {p.payment_type || p.paymentType || 'payment'} • {p.payment_method || p.paymentMethod || 'N/A'}
                                  {(p.reference_no || p.referenceNo) && (
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      {p.reference_no || p.referenceNo}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(amt)}</td>
                                <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>-{formatCurrency(cut)} ({pct}%)</td>
                                <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{formatCurrency(net)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1.15rem',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Printer size={15} />
                    Print Slip
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
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
