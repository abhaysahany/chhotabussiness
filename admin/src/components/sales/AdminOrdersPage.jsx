import React, { useState, useMemo, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  CreditCard,
  Zap,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Building2,
  Layers,
  X,
  Clock,
  ShieldCheck,
  Percent,
  Check,
  TrendingUp,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { getTodayIndianDateString, formatDate, formatDateTime } from '../../utils/timezone';
import {
  getAdminOrders,
  getOrderIncomeAllocation,
  confirmOrderIncomeAllocation,
  getPaymentIncomeAllocation,
  confirmPaymentIncomeAllocation,
  getOrderDetails,
  approveDumpRequest,
  rejectDumpRequest,
  getAdminDumpRequestDetails,
} from '../../api/adminOrdersService';

function AdminOrdersPage() {
  const [salesRecords, setSalesRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'today'
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'partial' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  // Order Details & Payments History Modal State (Section A & Section B)
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [refreshingOrderDetails, setRefreshingOrderDetails] = useState(false);

  // Dump Action Modals inside Order Details Section B
  const [selectedDumpForReview, setSelectedDumpForReview] = useState(null);
  const [selectedDumpForReject, setSelectedDumpForReject] = useState(null);
  const [dumpRejectionReason, setDumpRejectionReason] = useState('');
  const [isProcessingDump, setIsProcessingDump] = useState(false);
  const [dumpActionError, setDumpActionError] = useState('');
  const [selectedDumpDetails, setSelectedDumpDetails] = useState(null);

  // Payment-Specific Allocation Modal State
  const [selectedPaymentForAllocation, setSelectedPaymentForAllocation] = useState(null);
  const [paymentAllocationData, setPaymentAllocationData] = useState(null);
  const [loadingPaymentAllocation, setLoadingPaymentAllocation] = useState(false);
  const [confirmingPaymentAllocation, setConfirmingPaymentAllocation] = useState(false);
  const [paymentAllocationError, setPaymentAllocationError] = useState('');
  const [paymentAllocationSuccessMsg, setPaymentAllocationSuccessMsg] = useState('');

  // Legacy Order-Level Allocation Modal State
  const [selectedOrderForAllocation, setSelectedOrderForAllocation] = useState(null);
  const [allocationData, setAllocationData] = useState(null);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [confirmingAllocation, setConfirmingAllocation] = useState(false);
  const [allocationError, setAllocationError] = useState('');
  const [allocationSuccessMsg, setAllocationSuccessMsg] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load centralized sales records from MySQL database
  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders();
      const records = res?.orders || res?.sales || [];
      setSalesRecords(records);

      // If an order details modal is open, keep its record refreshed
      if (selectedOrderForDetails) {
        const refreshed = records.find((r) => r.id === selectedOrderForDetails.id);
        if (refreshed) {
          setSelectedOrderForDetails(refreshed);
        }
      }
    } catch (e) {
      console.error('Error reading sales records from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Open Order Details & Payment History Modal
  const openOrderDetails = async (order) => {
    setSelectedOrderForDetails(order);
    setDumpActionError('');
    try {
      const fresh = await getOrderDetails(order.id);
      if (fresh) {
        setSelectedOrderForDetails(fresh);
      }
    } catch (e) {
      console.warn('Using initial order data for modal:', e);
    }
  };

  // Helper to re-fetch and update current order modal
  const refreshCurrentOrderDetails = async (orderId) => {
    setRefreshingOrderDetails(true);
    try {
      const fresh = await getOrderDetails(orderId);
      if (fresh) {
        setSelectedOrderForDetails(fresh);
      }
      await loadSales();
    } catch (e) {
      console.error('Error refreshing order details:', e);
      await loadSales();
    } finally {
      setRefreshingOrderDetails(false);
    }
  };

  // Approve Dump Request Action
  const handleApproveDump = async (dumpId) => {
    setIsProcessingDump(true);
    setDumpActionError('');
    try {
      const res = await approveDumpRequest(dumpId);
      showToast(res.message || 'Dump Payment approved successfully. Balance updated.');
      setSelectedDumpForReview(null);
      if (selectedOrderForDetails) {
        await refreshCurrentOrderDetails(selectedOrderForDetails.id);
      } else {
        await loadSales();
      }
    } catch (err) {
      console.error('Error approving dump request:', err);
      setDumpActionError(err?.message || 'Failed to approve dump request.');
    } finally {
      setIsProcessingDump(false);
    }
  };

  // Reject Dump Request Action
  const handleRejectDump = async (e) => {
    e.preventDefault();
    if (!selectedDumpForReject) return;
    if (!dumpRejectionReason.trim() || dumpRejectionReason.trim().length < 3) {
      setDumpActionError('Please provide a valid rejection reason (minimum 3 characters).');
      return;
    }
    setIsProcessingDump(true);
    setDumpActionError('');
    try {
      const res = await rejectDumpRequest(selectedDumpForReject.id, dumpRejectionReason.trim());
      showToast(res.message || 'Dump request rejected.');
      setSelectedDumpForReject(null);
      setDumpRejectionReason('');
      if (selectedOrderForDetails) {
        await refreshCurrentOrderDetails(selectedOrderForDetails.id);
      } else {
        await loadSales();
      }
    } catch (err) {
      console.error('Error rejecting dump request:', err);
      setDumpActionError(err?.message || 'Failed to reject dump request.');
    } finally {
      setIsProcessingDump(false);
    }
  };

  // Open Payment-Specific Allocation Modal
  const openPaymentAllocationModal = async (payment, parentOrder = null) => {
    const parent = parentOrder || selectedOrderForDetails;
    setSelectedPaymentForAllocation({ ...payment, parentOrder: parent });
    setPaymentAllocationData(null);
    setPaymentAllocationError('');
    setPaymentAllocationSuccessMsg('');
    setLoadingPaymentAllocation(true);
    try {
      const res = await getPaymentIncomeAllocation(payment.id);
      if (res?.status === 'success' && res?.allocation) {
        setPaymentAllocationData(res.allocation);
      } else {
        setPaymentAllocationError(res?.message || 'Failed to load payment income allocation details.');
      }
    } catch (err) {
      setPaymentAllocationError(err?.message || 'Error communicating with server.');
    } finally {
      setLoadingPaymentAllocation(false);
    }
  };

  // Confirm Payment Allocation Action
  const handleConfirmPaymentAllocation = async () => {
    if (!selectedPaymentForAllocation) return;
    setConfirmingPaymentAllocation(true);
    setPaymentAllocationError('');
    setPaymentAllocationSuccessMsg('');
    try {
      const res = await confirmPaymentIncomeAllocation(selectedPaymentForAllocation.id);
      if (res?.status === 'success') {
        const msg = res.message || 'Payment income allocation confirmed successfully!';
        setPaymentAllocationSuccessMsg(msg);
        showToast(msg);

        // Refresh orders from backend
        await loadSales();

        // Re-fetch payment allocation data to update the modal display
        const updatedRes = await getPaymentIncomeAllocation(selectedPaymentForAllocation.id);
        if (updatedRes?.status === 'success') {
          setPaymentAllocationData(updatedRes.allocation);
        }

        // If order details modal is open, update its order state
        if (selectedOrderForDetails && res.order) {
          setSelectedOrderForDetails(res.order);
        }
      } else {
        setPaymentAllocationError(res?.message || 'Failed to confirm payment allocation.');
      }
    } catch (err) {
      setPaymentAllocationError(err?.message || 'Failed to confirm payment allocation.');
    } finally {
      setConfirmingPaymentAllocation(false);
    }
  };

  // Open Legacy Order Income Allocation Modal
  const openIncomeAllocationModal = async (order) => {
    setSelectedOrderForAllocation(order);
    setAllocationData(null);
    setAllocationError('');
    setAllocationSuccessMsg('');
    setLoadingAllocation(true);
    try {
      const res = await getOrderIncomeAllocation(order.id);
      if (res?.status === 'success' && res?.allocation) {
        setAllocationData(res.allocation);
      } else {
        setAllocationError(res?.message || 'Failed to load income allocation details.');
      }
    } catch (err) {
      setAllocationError(err?.message || 'Error communicating with server.');
    } finally {
      setLoadingAllocation(false);
    }
  };

  // Confirm Order Allocation Action
  const handleConfirmAllocation = async () => {
    if (!selectedOrderForAllocation) return;
    setConfirmingAllocation(true);
    setAllocationError('');
    setAllocationSuccessMsg('');
    try {
      const res = await confirmOrderIncomeAllocation(selectedOrderForAllocation.id);
      if (res?.status === 'success') {
        const msg = res.message || 'Income allocation confirmed successfully!';
        setAllocationSuccessMsg(msg);
        showToast(msg);
        await loadSales();
        const updatedRes = await getOrderIncomeAllocation(selectedOrderForAllocation.id);
        if (updatedRes?.status === 'success') {
          setAllocationData(updatedRes.allocation);
        }
      } else {
        setAllocationError(res?.message || 'Failed to confirm income allocation.');
      }
    } catch (err) {
      setAllocationError(err?.message || 'Failed to confirm income allocation.');
    } finally {
      setConfirmingAllocation(false);
    }
  };

  // Filter Sales Records
  const filteredSales = useMemo(() => {
    return salesRecords.filter((s) => {
      const matchSearch =
        (s.invoiceNumber || s.invoice_number || s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer || s.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.entityName || s.entity_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.item || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchItemType = itemTypeFilter === 'all' || (s.itemType || s.item_type) === itemTypeFilter;
      const matchEntityType = entityTypeFilter === 'all' || (s.entityType || s.entity_type) === entityTypeFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      if (dateRange === 'today') {
        const todayStr = getTodayIndianDateString();
        return matchSearch && matchItemType && matchEntityType && matchStatus && s.date === todayStr;
      }
      return matchSearch && matchItemType && matchEntityType && matchStatus;
    });
  }, [salesRecords, searchQuery, itemTypeFilter, entityTypeFilter, statusFilter, dateRange]);

  // Aggregate Metrics
  const totalGross = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.grossAmount ?? curr.gross_amount) || 0), 0);
  }, [filteredSales]);

  const totalCollected = useMemo(() => {
    return filteredSales.reduce((acc, curr) => {
      const payments = curr.payments || [];
      const paymentSum = payments.reduce((pAcc, p) => pAcc + (Number(p.amount) || 0), 0);
      return acc + (paymentSum > 0 ? paymentSum : (Number(curr.advancePayment ?? curr.advance_payment ?? curr.totalPaymentReceived ?? curr.total_payment_received) || 0));
    }, 0);
  }, [filteredSales]);

  const totalBalanceDue = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.balanceDue ?? curr.balance_due) || 0), 0);
  }, [filteredSales]);

  // Expected Admin Commission across orders (15%)
  const totalExpectedAdminCommission = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.adminCommissionCut ?? curr.admin_commission_cut ?? curr.expectedAdminCut ?? curr.expected_admin_cut) || 0), 0);
  }, [filteredSales]);

  // Admin Commission Collected across received payment receipts
  const totalAdminCommissionCollected = useMemo(() => {
    return filteredSales.reduce((acc, curr) => {
      const payments = curr.payments || [];
      const collectedFromPayments = payments.reduce((pAcc, p) => pAcc + (Number(p.adminCommissionCut ?? p.admin_commission_cut) || 0), 0);
      return acc + (collectedFromPayments || Number(curr.adminCommissionCollected ?? curr.admin_commission_collected ?? 0));
    }, 0);
  }, [filteredSales]);

  // Remaining Admin Commission yet to be collected
  const totalRemainingAdminCommission = useMemo(() => {
    return Math.max(0, totalExpectedAdminCommission - totalAdminCommissionCollected);
  }, [totalExpectedAdminCommission, totalAdminCommissionCollected]);

  // Total Distributed Admin Cut (40/40/20)
  const totalDistributedAdminCut = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.distributed_admin_cut_amount ?? curr.distributedAdminCutAmount) || 0), 0);
  }, [filteredSales]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', width: '100%', boxSizing: 'border-box' }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '0.9rem 1.35rem',
            borderRadius: '14px',
            fontWeight: 700,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            border: '1.5px solid #334155',
            zIndex: 999999,
            position: 'fixed',
            top: '20px',
            right: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. Executive 3D Luxury Hero Banner */}
      <div className="adm-hero-banner">
        <div className="adm-hero-top-row">
          <div className="adm-hero-pod-3d adm-pod-steel">
            <Briefcase size={32} strokeWidth={2.4} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3569a7', background: 'rgba(53, 105, 167, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(53, 105, 167, 0.2)' }}>
                ● MASTER TRANSACTION LEDGER
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0d9488', background: 'rgba(13, 148, 136, 0.08)', padding: '3px 10px', borderRadius: '9999px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                ● {filteredSales.length} Orders Audited
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
              Order Management &amp; Settlements
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '680px', lineHeight: 1.5 }}>
              Live database records of all customer orders, receipts, dump payments, and incremental income distribution across the network.
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="adm-hero-btn-primary"
              onClick={loadSales}
              disabled={loading}
              style={{ padding: '0.75rem 1.4rem', fontSize: '0.86rem' }}
            >
              <RefreshCw size={16} strokeWidth={2.4} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Executive 3D KPI Vault Cards (Single Horizontal Row: 4 Cards) */}
      <div className="adm-kpi-grid-4">
        {/* Card 1: Total Project GMV */}
        <div className="adm-kpi-card adm-kpi-card-steel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#3569a7',
                  background: 'rgba(53, 105, 167, 0.1)',
                  padding: '2.5px 8px',
                  borderRadius: '5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                  marginBottom: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                ● TOTAL GMV
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                PROJECT VALUE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-steel" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Briefcase size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.55rem', color: '#0f172a' }}>
              ₹{totalGross.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Briefcase size={13} color="#3569a7" />
              <span>{filteredSales.length} Total orders</span>
            </span>
            <span style={{ color: '#3569a7', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Base GMV
            </span>
          </div>
        </div>

        {/* Card 2: Total Funds Received */}
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
                ● RECORDED CASH
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                FUNDS RECEIVED
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-emerald" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CheckCircle2 size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.55rem', color: '#0d9488' }}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CheckCircle2 size={13} color="#0d9488" />
              <span>Advance &amp; receipts</span>
            </span>
            <span style={{ color: '#0d9488', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Collected
            </span>
          </div>
        </div>

        {/* Card 3: Admin Cut Collected */}
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
                ● ADMIN REVENUE
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                RETAINED CUT
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-purple" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <Zap size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.55rem', color: '#9333ea' }}>
              ₹{totalAdminCommissionCollected.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <Zap size={13} color="#9333ea" />
              <span>Exp: ₹{totalExpectedAdminCommission.toLocaleString('en-IN')}</span>
            </span>
            <span style={{ color: '#9333ea', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Retained
            </span>
          </div>
        </div>

        {/* Card 4: Remaining Client Balance */}
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
                ● DUE RECEIVABLES
              </span>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                CLIENT BALANCE
              </div>
            </div>
            <div className="adm-3d-pod adm-pod-amber" style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0 }}>
              <CreditCard size={19} strokeWidth={2.4} />
            </div>
          </div>
          <div style={{ margin: '0.65rem 0 0.35rem 0' }}>
            <div className="adm-kpi-val" style={{ fontSize: '1.55rem', color: '#d97706' }}>
              ₹{totalBalanceDue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.73rem', color: '#64748b' }}>
              <CreditCard size={13} color="#d97706" />
              <span>Due Cut: ₹{totalRemainingAdminCommission.toLocaleString('en-IN')}</span>
            </span>
            <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              ● Due Receivables
            </span>
          </div>
        </div>
      </div>

      {/* 2b. Secondary Live Ledger Audit Ticker Strip */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '0.65rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.76rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#334155' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Accounting Ledger:</span>
            <strong style={{ color: '#0f172a' }}>100% Reconciled</strong>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#64748b' }}>
            <span>Distributed MLM Share:</span>
            <strong style={{ color: '#7c3aed' }}>₹{totalDistributedAdminCut.toLocaleString('en-IN')}</strong>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>(40/40/20 Rule Active)</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#64748b' }}>
            <span>Uncollected Commission:</span>
            <strong style={{ color: '#d97706' }}>₹{totalRemainingAdminCommission.toLocaleString('en-IN')}</strong>
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3569a7' }}>
          ● MySQL 8.0 Realtime Accounting Database
        </div>
      </div>

      {/* 3. Executive Filter Toolbar (Single Unified Row) */}
      <div className="adm-toolbar-card">
        <div className="adm-toolbar-filters">
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
            <input
              type="text"
              className="adm-toolbar-input"
              placeholder="Search Entity Name, Invoice #, Customer, Item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Entity Type Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '155px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
            >
              <option value="all">All Entity Types</option>
              <option value="business">Commercial Businesses</option>
              <option value="freelance">Freelance Partners</option>
            </select>
          </div>

          {/* Offering Type Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '150px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
            >
              <option value="all">All Offering Types</option>
              <option value="service">Services Only</option>
              <option value="product">Products Only</option>
              <option value="package">Packages Only</option>
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0, width: '155px' }}>
            <select
              className="adm-toolbar-select"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="partial">Partial (Balance Due)</option>
              <option value="completed">Fully Completed</option>
            </select>
          </div>

          {/* Date Range Toggle Pill */}
          <button
            type="button"
            onClick={() => setDateRange(dateRange === 'all' ? 'today' : 'all')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '9px',
              border: dateRange === 'today' ? '1.5px solid #3569a7' : '1.5px solid #cbd5e1',
              background: dateRange === 'today' ? '#3569a7' : '#ffffff',
              color: dateRange === 'today' ? '#ffffff' : '#334155',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {dateRange === 'today' ? 'Showing Today' : 'Filter: Today'}
          </button>

          {(searchQuery || entityTypeFilter !== 'all' || itemTypeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setEntityTypeFilter('all');
                setItemTypeFilter('all');
                setStatusFilter('all');
                setDateRange('all');
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
            Showing {filteredSales.length} of {salesRecords.length} Orders
          </span>
        </div>
      </div>

      {/* 4. Luxury Data Table View */}
      <div className="adm-table-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1080px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '1rem 1rem', fontWeight: 800 }}>Invoice # &amp; Entity</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800 }}>Customer / Buyer</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'right' }}>Project Amount</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'right' }}>Expected Cut</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'right' }}>Payment Received</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'right' }}>Remaining Balance</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'right' }}>Cut Collected</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem 1rem', fontWeight: 800, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="adm-3d-pod adm-pod-steel admFloatPodSlow" style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }}>
                      <Briefcase size={24} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>Loading Centralized Orders...</div>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Synchronizing accounting ledger from database</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="adm-3d-pod adm-pod-steel" style={{ width: '56px', height: '56px', margin: '0 auto 1rem auto' }}>
                      <Briefcase size={28} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>No Orders Found</div>
                    <p style={{ margin: '0.35rem auto 0', color: '#64748b', fontSize: '0.84rem', maxWidth: '440px', lineHeight: 1.5 }}>
                      No order records match your selected search and filter criteria. Try resetting filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const invoiceNo = sale.invoiceNumber || sale.invoice_number || sale.id;
                  const gross = Number(sale.grossAmount ?? sale.gross_amount ?? 0);
                  const rate = Number(sale.adminCommissionPercent || sale.admin_commission_percent || 15);
                  const expectedAdminCut = Number(sale.adminCommissionCut ?? sale.admin_commission_cut ?? sale.expectedAdminCut ?? sale.expected_admin_cut ?? Math.round((gross * rate) / 100));
                  const payments = sale.payments || [];
                  const paymentSum = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
                  const totalPaymentReceived = paymentSum > 0 ? paymentSum : Number(sale.advancePayment ?? sale.advance_payment ?? sale.totalPaymentReceived ?? sale.total_payment_received ?? 0);
                  const balanceDue = Number(sale.balanceDue ?? sale.balance_due ?? Math.max(0, gross - totalPaymentReceived));
                  const adminCutCollected = payments.length > 0
                    ? payments.reduce((acc, p) => acc + (Number(p.adminCommissionCut ?? p.admin_commission_cut) || 0), 0)
                    : Number(sale.adminCommissionCollected ?? sale.admin_commission_collected ?? 0);
                  const remainingAdminCut = Math.max(0, Math.round((expectedAdminCut - adminCutCollected) * 100) / 100);
                  const distributedCut = Number(sale.distributed_admin_cut_amount ?? sale.distributedAdminCutAmount ?? 0);
                  const dumpAmount = Number(sale.dump_amount ?? sale.dumpAmount ?? 0);
                  const isCompleted = balanceDue <= 0;
                  const distributionStatus = sale.income_distribution_status || sale.incomeDistributionStatus || 'pending';
                  const hasPendingPayments = payments.some((p) => (p.income_distribution_status || p.incomeDistributionStatus) === 'pending' && Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0) > 0);

                  return (
                    <tr key={sale.id || invoiceNo} className="adm-table-row">
                      {/* 1. Invoice Number & Entity */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          {invoiceNo}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                          {sale.entityName || sale.entity_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px' }}>
                          <span className="adm-code-chip" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                            {sale.date}
                          </span>
                          {payments.length > 0 && (
                            <span style={{ fontSize: '0.66rem', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              {payments.length} Receipt{payments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Customer / Buyer */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>
                          {sale.customerName || sale.customer_name || sale.customer}
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                          {sale.customer_user_code && (
                            <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, fontFamily: 'monospace' }}>
                              {sale.customer_user_code}
                            </span>
                          )}
                          {sale.sponsor && (
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                              Ref: {sale.sponsor}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', textTransform: 'capitalize', fontWeight: 600 }}>
                          {sale.item} ({sale.itemType || sale.item_type || 'service'})
                        </div>
                      </td>

                      {/* 3. Project Amount */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                        ₹{gross.toLocaleString('en-IN')}
                      </td>

                      {/* 4. Expected Admin Commission */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.88rem' }}>
                          ₹{expectedAdminCut.toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#3569a7', fontWeight: 800, background: 'rgba(53, 105, 167, 0.08)', padding: '1px 5px', borderRadius: '4px' }}>
                          {rate}% Cut
                        </span>
                      </td>

                      {/* 5. Payment Received */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '0.94rem' }}>
                        ₹{totalPaymentReceived.toLocaleString('en-IN')}
                      </td>

                      {/* 6. Remaining Balance */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: balanceDue > 0 ? '#d97706' : '#16a34a', fontSize: '0.94rem' }}>
                        ₹{balanceDue.toLocaleString('en-IN')}
                      </td>

                      {/* 7. Admin Cut Collected */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.88rem' }}>
                          ₹{adminCutCollected.toLocaleString('en-IN')}
                        </div>
                        {remainingAdminCut > 0 && (
                          <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700 }}>
                            Due: ₹{remainingAdminCut.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* 8. Status & Allocation */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                          {isCompleted ? (
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                              ● Settled
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                              ⏳ Partial Due
                            </span>
                          )}

                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: '6px',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              background: distributionStatus === 'completed' ? '#ecfdf5' : (distributionStatus === 'partial' ? '#eff6ff' : '#fffbeb'),
                              color: distributionStatus === 'completed' ? '#047857' : (distributionStatus === 'partial' ? '#1d4ed8' : '#b45309'),
                              border: distributionStatus === 'completed' ? '1px solid #a7f3d0' : (distributionStatus === 'partial' ? '1px solid #bfdbfe' : '1px solid #fde68a'),
                            }}
                          >
                            {distributionStatus === 'completed' ? '✓ Allocated' : (distributionStatus === 'partial' ? '⚡ Partial MLM' : '⏳ Pending MLM')}
                          </span>

                          {distributedCut > 0 && (
                            <div style={{ fontSize: '0.66rem', color: '#16a34a', fontWeight: 800 }}>
                              Split: ₹{distributedCut.toLocaleString('en-IN')}
                            </div>
                          )}

                          {dumpAmount > 0 && (
                            <div style={{ fontSize: '0.66rem', color: '#7c3aed', fontWeight: 800 }}>
                              Dump: ₹{dumpAmount.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 9. Actions */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(sale)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              background: '#ffffff',
                              color: '#334155',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: '7px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Eye size={12} />
                            <span>Invoice</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openOrderDetails(sale)}
                            className="adm-hero-btn-primary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.74rem',
                              whiteSpace: 'nowrap',
                            }}
                            title="View Order Details, Accounting Summary, and Payment Receipts"
                          >
                            <Receipt size={12} />
                            <span>Payments</span>
                            {payments.length > 0 && (
                              <span style={{ background: 'rgba(255,255,255,0.25)', color: '#ffffff', padding: '0.5px 5px', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 800 }}>
                                {payments.length}
                              </span>
                            )}
                          </button>

                          {hasPendingPayments && (
                            <button
                              type="button"
                              onClick={() => openOrderDetails(sale)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '7px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                              }}
                              title="Distribute Income for Pending Payment Receipts"
                            >
                              <DollarSign size={12} />
                              <span>Distribute</span>
                            </button>
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

        {/* Table Footer */}
        <div style={{ padding: '0.85rem 1.4rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
          <span style={{ fontWeight: 700, color: '#334155' }}>
            ● Centralized order database synchronized with MySQL 8.0 schema
          </span>
          <span style={{ fontWeight: 800, color: '#3569a7' }}>
            Showing {filteredSales.length} of {salesRecords.length} Orders
          </span>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoiceForView && (
        <div
          className="pro-orders-modal-backdrop"
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
            className="pro-orders-modal-dialog pro-orders-modal-dialog-sm"
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
                  🧾 Commercial Sales Invoice
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedInvoiceForView.invoiceNumber || selectedInvoiceForView.invoice_number}</strong> • Date: <strong>{selectedInvoiceForView.date}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForView(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Seller Entity:</span>
                <strong>{selectedInvoiceForView.entityName || selectedInvoiceForView.entity_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer / Member:</span>
                <strong>{selectedInvoiceForView.customerName || selectedInvoiceForView.customer_name || selectedInvoiceForView.customer}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Offering Item:</span>
                <strong>{selectedInvoiceForView.item}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Total Project Value:</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>₹{Number(selectedInvoiceForView.grossAmount ?? selectedInvoiceForView.gross_amount ?? 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Collected Funds:</span>
                <strong style={{ color: '#2563eb' }}>₹{Number(selectedInvoiceForView.advancePayment ?? selectedInvoiceForView.advance_payment ?? 0).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Remaining Balance Due:</span>
                <strong style={{ color: (selectedInvoiceForView.balanceDue ?? selectedInvoiceForView.balance_due) > 0 ? '#d97706' : '#16a34a' }}>
                  ₹{Number(selectedInvoiceForView.balanceDue ?? selectedInvoiceForView.balance_due ?? 0).toLocaleString()}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>Admin Platform Commission Cut:</span>
                <strong style={{ color: '#16a34a', fontSize: '1rem' }}>₹{Number(selectedInvoiceForView.adminCommissionCut ?? selectedInvoiceForView.admin_commission_cut ?? 0).toLocaleString()} ({selectedInvoiceForView.adminCommissionPercent || 15}%)</strong>
              </div>
              {(Number(selectedInvoiceForView.dump_amount ?? selectedInvoiceForView.dumpAmount ?? 0) > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <span style={{ color: '#7c3aed', fontWeight: 700 }}>Order Dump Amount:</span>
                  <strong style={{ color: '#7c3aed', fontSize: '1rem' }}>₹{Number(selectedInvoiceForView.dump_amount ?? selectedInvoiceForView.dumpAmount ?? 0).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedInvoiceForView(null)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                background: '#3569a7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close Invoice
            </button>
          </div>
        </div>
      )}

      {/* Order Details & Payment History Modal (Section A & Section B) */}
      {selectedOrderForDetails && (
        <div
          className="pro-orders-modal-backdrop"
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
            zIndex: 99990,
            padding: '1rem',
          }}
        >
          <div
            className="pro-orders-modal-dialog"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '860px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📋</span> Order Details & Payment History
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedOrderForDetails.invoiceNumber || selectedOrderForDetails.invoice_number}</strong> • Order ID: <strong>#{selectedOrderForDetails.id}</strong> • Date: <strong>{selectedOrderForDetails.date}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Quick Order Info Row */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
              <div><span style={{ color: '#64748b' }}>Seller Entity:</span> <strong>{selectedOrderForDetails.entityName || selectedOrderForDetails.entity_name}</strong></div>
              <div><span style={{ color: '#64748b' }}>Customer:</span> <strong>{selectedOrderForDetails.customerName || selectedOrderForDetails.customer_name || selectedOrderForDetails.customer}</strong></div>
              <div><span style={{ color: '#64748b' }}>Offering Item:</span> <strong>{selectedOrderForDetails.item}</strong></div>
              <div><span style={{ color: '#64748b' }}>Project Value:</span> <strong style={{ color: '#0f172a' }}>₹{Number(selectedOrderForDetails.grossAmount ?? selectedOrderForDetails.gross_amount ?? 0).toLocaleString()}</strong></div>
              <div><span style={{ color: '#64748b' }}>Collected:</span> <strong style={{ color: '#2563eb' }}>₹{Number(selectedOrderForDetails.advancePayment ?? selectedOrderForDetails.advance_payment ?? 0).toLocaleString()}</strong></div>
              <div><span style={{ color: '#64748b' }}>Balance Due:</span> <strong style={{ color: Number(selectedOrderForDetails.balanceDue ?? selectedOrderForDetails.balance_due ?? 0) > 0 ? '#d97706' : '#16a34a' }}>₹{Number(selectedOrderForDetails.balanceDue ?? selectedOrderForDetails.balance_due ?? 0).toLocaleString()}</strong></div>
            </div>

            {/* SECTION A: Order Accounting & Cumulative Allocation */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', marginBottom: '1.5rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📊</span> SECTION A: ORDER ACCOUNTING & CUMULATIVE ALLOCATION (40 / 40 / 20)
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    background: (selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'completed' ? '#f0fdf4' : ((selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'partial' ? '#eff6ff' : '#fffbeb'),
                    color: (selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'completed' ? '#15803d' : ((selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'partial' ? '#1d4ed8' : '#b45309'),
                    border: (selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'completed' ? '1px solid #bbf7d0' : ((selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'partial' ? '1px solid #bfdbfe' : '1px solid #fde68a'),
                  }}
                >
                  Order Status: {(selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'completed' ? 'Fully Allocated' : ((selectedOrderForDetails.income_distribution_status || selectedOrderForDetails.incomeDistributionStatus) === 'partial' ? 'Partially Allocated' : 'Pending Allocation')}
                </span>
              </div>

              {/* Order Level Accounting Breakdown Grid */}
              {(() => {
                const orderGross = Number(selectedOrderForDetails.grossAmount ?? selectedOrderForDetails.gross_amount ?? 0);
                const orderRate = Number(selectedOrderForDetails.adminCommissionPercent ?? selectedOrderForDetails.admin_commission_percent ?? 15);
                const orderExpectedCut = Number(selectedOrderForDetails.adminCommissionCut ?? selectedOrderForDetails.admin_commission_cut ?? selectedOrderForDetails.expectedAdminCut ?? selectedOrderForDetails.expected_admin_cut ?? Math.round((orderGross * orderRate) / 100));
                const orderPayments = selectedOrderForDetails.payments || [];
                const orderPaymentsSum = orderPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
                const orderReceived = orderPaymentsSum > 0 ? orderPaymentsSum : Number(selectedOrderForDetails.advancePayment ?? selectedOrderForDetails.advance_payment ?? 0);

                // Approved Dump Calculations
                const dumpList = selectedOrderForDetails.dumpRequests || selectedOrderForDetails.dump_requests || [];
                const approvedDumps = dumpList.filter((d) => d.status === 'approved');
                const orderApprovedDump = approvedDumps.length > 0
                  ? approvedDumps.reduce((acc, d) => acc + (Number(d.dump_amount) || 0), 0)
                  : Number(selectedOrderForDetails.approvedDumpAmount ?? selectedOrderForDetails.dump_amount ?? 0);

                const orderDumpAdminCut = approvedDumps.length > 0
                  ? approvedDumps.reduce((acc, d) => acc + (Number(d.admin_commission_cut) || 0), 0)
                  : (orderApprovedDump > 0 ? Math.round((orderApprovedDump * orderRate) / 100) : 0);

                // Remaining Collectible Balance (Max 0, Gross - Received - Approved Dump)
                const orderBalance = Math.max(0, Math.round((orderGross - orderReceived - orderApprovedDump) * 100) / 100);

                const orderCollectedCut = orderPayments.length > 0
                  ? orderPayments.reduce((acc, p) => acc + (Number(p.adminCommissionCut ?? p.admin_commission_cut) || 0), 0)
                  : Number(selectedOrderForDetails.adminCommissionCollected ?? selectedOrderForDetails.admin_commission_collected ?? 0);

                // Remaining Expected Admin Cut (Expected - Collected Cash Cut - Approved Dump Cut)
                const orderRemainingCut = Math.max(0, Math.round((orderExpectedCut - orderCollectedCut - orderDumpAdminCut) * 100) / 100);

                const orderDistributedCut = Number(selectedOrderForDetails.distributed_admin_cut_amount ?? selectedOrderForDetails.distributedAdminCutAmount ?? 0);
                const directCut = Number(selectedOrderForDetails.direct_income_amount ?? selectedOrderForDetails.directIncomeAmount ?? 0);
                const levelCut = Number(selectedOrderForDetails.level_income_amount ?? selectedOrderForDetails.levelIncomeAmount ?? 0);
                const rewardCut = Number(selectedOrderForDetails.reward_income_amount ?? selectedOrderForDetails.rewardIncomeAmount ?? 0);

                // Derived Payment Settlement Status
                let paymentSettlementStatus = 'Unpaid';
                if (orderReceived >= orderGross && orderGross > 0) {
                  paymentSettlementStatus = 'Fully Paid (Cash)';
                } else if (orderBalance <= 0 && orderApprovedDump > 0) {
                  paymentSettlementStatus = 'Closed via Dump';
                } else if (orderReceived > 0 && orderBalance > 0) {
                  paymentSettlementStatus = 'Partially Paid';
                } else if (orderReceived <= 0 && orderApprovedDump > 0 && orderBalance > 0) {
                  paymentSettlementStatus = 'Partial Dump Write-Off';
                }

                // Construct Chronologically Unified Ledger Entries (Cash Receipts + Dump Entries)
                const unifiedLedgerEntries = (() => {
                  const entries = [];

                  // 1. Cash Receipts from sale_payments
                  orderPayments.forEach((p) => {
                    entries.push({
                      entryKey: `cash-${p.id}`,
                      id: p.id,
                      displayId: `RCPT-${p.id}`,
                      category: 'cash_payment',
                      paymentType: p.payment_type || p.paymentType || 'advance',
                      date: p.payment_date || p.paymentDate || p.created_at || p.createdAt,
                      amount: Number(p.amount || 0),
                      adminRate: Number(p.admin_commission_percent ?? p.adminCommissionPercent ?? orderRate),
                      adminCut: Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0),
                      directIncome: Number(p.direct_income_amount ?? p.directIncomeAmount ?? 0),
                      levelIncome: Number(p.level_income_amount ?? p.levelIncomeAmount ?? 0),
                      rewardIncome: Number(p.reward_income_amount ?? p.rewardIncomeAmount ?? 0),
                      status: p.income_distribution_status || p.incomeDistributionStatus || 'pending',
                      referenceNo: p.reference_no || p.referenceNo || 'N/A',
                      rawPayment: p,
                    });
                  });

                  // 2. Dump Entries from order_payment_dumps
                  dumpList.forEach((d) => {
                    const isApproved = d.status === 'approved';
                    const isPending = d.status === 'pending';
                    const dRate = Number(d.admin_commission_percent ?? orderRate);
                    const dAmount = Number(d.dump_amount ?? 0);
                    const dCut = Number(d.admin_commission_cut ?? Math.round((dAmount * dRate) / 100));
                    const dDirect = Number(d.direct_income_amount ?? Math.round(dCut * 0.4));
                    const dLevel = Number(d.level_income_amount ?? Math.round(dCut * 0.4));
                    const dReward = Number(d.reward_income_amount ?? Math.round(dCut * 0.2));

                    entries.push({
                      entryKey: `dump-${d.id}`,
                      id: d.id,
                      displayId: `DUMP-${d.id}`,
                      category: 'dump_entry',
                      dumpStatus: d.status,
                      paymentType: isApproved
                        ? 'Approved Dump Write-Off'
                        : (isPending ? 'Pending Dump Request' : 'Rejected Dump Request'),
                      date: isApproved ? (d.approved_at || d.updated_at || d.created_at) : (d.requested_at || d.created_at),
                      amount: dAmount,
                      adminRate: dRate,
                      adminCut: dCut,
                      directIncome: dDirect,
                      levelIncome: dLevel,
                      rewardIncome: dReward,
                      status: d.status,
                      dumpReason: d.dump_reason,
                      rejectionReason: d.admin_rejection_reason,
                      approvedAt: d.approved_at,
                      rejectedAt: d.rejected_at,
                      notes: d.notes,
                      rawDump: d,
                    });
                  });

                  return entries.sort((a, b) => {
                    const timeA = a.date ? new Date(a.date).getTime() : 0;
                    const timeB = b.date ? new Date(b.date).getTime() : 0;
                    return timeB - timeA;
                  });
                })();

                return (
                  <>
                    {/* Primary Order Accounting Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>PROJECT VALUE</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                          ₹{orderGross.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Total Order Value</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>EXPECTED ADMIN CUT</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#475569', marginTop: '0.15rem' }}>
                          ₹{orderExpectedCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#475569' }}>Rate: {orderRate}%</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>CASH RECEIVED</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb', marginTop: '0.15rem' }}>
                          ₹{orderReceived.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#2563eb' }}>{orderPayments.length} Cash Receipt{orderPayments.length > 1 ? 's' : ''}</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600 }}>REMAINING BALANCE</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: orderBalance > 0 ? '#d97706' : '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderBalance.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Collectible from client</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>CASH CUT COLLECTED</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderCollectedCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#16a34a' }}>From receipts</div>
                      </div>

                      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 600 }}>DUMP ADMIN CUT</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.15rem' }}>
                          ₹{orderDumpAdminCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#7c3aed' }}>Approved write-off cut</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>REMAINING ADMIN CUT</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: orderRemainingCut > 0 ? '#d97706' : '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderRemainingCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Expected - Cash - Dump</div>
                      </div>
                    </div>

                    {/* Cumulative 40/40/20 Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>ALLOCATED ADMIN CUT</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderDistributedCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#16a34a' }}>From cash receipts</div>
                      </div>

                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 700 }}>DIRECT INCOME (40%)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.15rem' }}>
                          ₹{directCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#2563eb' }}>Order cumulative</div>
                      </div>

                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 700 }}>LEVEL INCOME (40%)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.15rem' }}>
                          ₹{levelCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#2563eb' }}>Order cumulative</div>
                      </div>

                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 700 }}>REWARD INCOME (20%)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.15rem' }}>
                          ₹{rewardCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#2563eb' }}>Order cumulative</div>
                      </div>
                    </div>

                    {/* Read-Only Summary Banner: Approved Dump Write-Off & Settlement Status */}
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '0.85rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>📦</span> APPROVED DUMP WRITE-OFF: ₹{orderApprovedDump.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#7e22ce', marginTop: '0.2rem' }}>
                          Uncollectible project balance formally approved by Admin. Formally written off from customer collectible balance.
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#6b21a8', fontWeight: 700 }}>DUMP ADMIN CUT ({orderRate}%)</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#6b21a8', marginTop: '0.1rem' }}>
                            ₹{orderDumpAdminCut.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#6b21a8', fontWeight: 700 }}>SETTLEMENT STATUS</div>
                          <div
                            style={{
                              marginTop: '0.15rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              background: paymentSettlementStatus === 'Closed via Dump' ? '#f3e8ff' : (paymentSettlementStatus === 'Fully Paid (Cash)' ? '#dcfce7' : '#eff6ff'),
                              color: paymentSettlementStatus === 'Closed via Dump' ? '#7e22ce' : (paymentSettlementStatus === 'Fully Paid (Cash)' ? '#15803d' : '#1d4ed8'),
                              border: paymentSettlementStatus === 'Closed via Dump' ? '1px solid #c084fc' : (paymentSettlementStatus === 'Fully Paid (Cash)' ? '1px solid #86efac' : '1px solid #bfdbfe'),
                              display: 'inline-block',
                            }}
                          >
                            {paymentSettlementStatus}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* SECTION B: Unified Order Payment & Dump Write-Off Ledger */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>💳</span> SECTION B: UNIFIED PAYMENT & DUMP WRITE-OFF LEDGER
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    Single auditable ledger showing both genuine customer cash receipts and formal Dump balance write-offs.
                  </p>
                </div>
                {refreshingOrderDetails && (
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div className="spinner" style={{ width: '12px', height: '12px' }}></div> Updating ledger...
                  </span>
                )}
              </div>

              {(() => {
                const orderRate = Number(selectedOrderForDetails.adminCommissionPercent ?? selectedOrderForDetails.admin_commission_percent ?? 15);
                const orderPayments = selectedOrderForDetails.payments || [];
                const dumpList = selectedOrderForDetails.dumpRequests || selectedOrderForDetails.dump_requests || [];

                const unifiedLedgerEntries = (() => {
                  const entries = [];

                  // 1. Cash Receipts
                  orderPayments.forEach((p) => {
                    entries.push({
                      entryKey: `cash-${p.id}`,
                      id: p.id,
                      displayId: `RCPT-${p.id}`,
                      category: 'cash_payment',
                      paymentType: p.payment_type || p.paymentType || 'advance',
                      date: p.payment_date || p.paymentDate || p.created_at || p.createdAt,
                      amount: Number(p.amount || 0),
                      adminRate: Number(p.admin_commission_percent ?? p.adminCommissionPercent ?? orderRate),
                      adminCut: Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0),
                      directIncome: Number(p.direct_income_amount ?? p.directIncomeAmount ?? 0),
                      levelIncome: Number(p.level_income_amount ?? p.levelIncomeAmount ?? 0),
                      rewardIncome: Number(p.reward_income_amount ?? p.rewardIncomeAmount ?? 0),
                      status: p.income_distribution_status || p.incomeDistributionStatus || 'pending',
                      referenceNo: p.reference_no || p.referenceNo || 'N/A',
                      rawPayment: p,
                    });
                  });

                  // 2. Dump Entries
                  dumpList.forEach((d) => {
                    const isApproved = d.status === 'approved';
                    const isPending = d.status === 'pending';
                    const dRate = Number(d.admin_commission_percent ?? orderRate);
                    const dAmount = Number(d.dump_amount ?? 0);
                    const dCut = Number(d.admin_commission_cut ?? Math.round((dAmount * dRate) / 100));
                    const dDirect = Number(d.direct_income_amount ?? Math.round(dCut * 0.4));
                    const dLevel = Number(d.level_income_amount ?? Math.round(dCut * 0.4));
                    const dReward = Number(d.reward_income_amount ?? Math.round(dCut * 0.2));

                    entries.push({
                      entryKey: `dump-${d.id}`,
                      id: d.id,
                      displayId: `DUMP-${d.id}`,
                      category: 'dump_entry',
                      dumpStatus: d.status,
                      paymentType: isApproved
                        ? 'Approved Dump Write-Off'
                        : (isPending ? 'Pending Dump Request' : 'Rejected Dump Request'),
                      date: isApproved ? (d.approved_at || d.updated_at || d.created_at) : (d.requested_at || d.created_at),
                      amount: dAmount,
                      adminRate: dRate,
                      adminCut: dCut,
                      directIncome: dDirect,
                      levelIncome: dLevel,
                      rewardIncome: dReward,
                      status: d.status,
                      dumpReason: d.dump_reason,
                      rejectionReason: d.admin_rejection_reason,
                      approvedAt: d.approved_at,
                      rejectedAt: d.rejected_at,
                      notes: d.notes,
                      rawDump: d,
                    });
                  });

                  return entries.sort((a, b) => {
                    const timeA = a.date ? new Date(a.date).getTime() : 0;
                    const timeB = b.date ? new Date(b.date).getTime() : 0;
                    return timeB - timeA;
                  });
                })();

                if (unifiedLedgerEntries.length === 0) {
                  return (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem', background: '#f8fafc', borderRadius: '8px' }}>
                      No payment receipts or dump requests recorded yet for this order.
                    </div>
                  );
                }

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Entry ID</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Type & Mode</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Date</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Amount</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Admin Cut</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Direct (40%)</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Level (40%)</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Reward (20%)</th>
                          <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                          <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unifiedLedgerEntries.map((entry) => {
                          const isCash = entry.category === 'cash_payment';
                          const isDump = entry.category === 'dump_entry';

                          if (isCash) {
                            const p = entry.rawPayment;
                            const isPending = entry.status === 'pending';
                            const isLegacy = entry.status === 'legacy_completed';

                            return (
                              <tr key={entry.entryKey} style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                                  <div>{entry.displayId}</div>
                                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>
                                    UTR: {entry.referenceNo}
                                  </div>
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      textTransform: 'capitalize',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '0.12rem 0.45rem',
                                      borderRadius: '4px',
                                      background: entry.paymentType === 'advance' ? '#eff6ff' : '#f0fdf4',
                                      color: entry.paymentType === 'advance' ? '#1d4ed8' : '#15803d',
                                      border: entry.paymentType === 'advance' ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                                    }}
                                  >
                                    <span>💳</span> Cash ({entry.paymentType})
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                  {entry.date ? formatDate(entry.date) : 'N/A'}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#2563eb' }}>
                                  ₹{entry.amount.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#16a34a' }}>
                                  ₹{entry.adminCut.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                                  ₹{entry.directIncome.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                                  ₹{entry.levelIncome.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                                  ₹{entry.rewardIncome.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '0.12rem 0.45rem',
                                      borderRadius: '4px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                      background: isPending ? '#fffbeb' : (isLegacy ? '#f1f5f9' : '#f0fdf4'),
                                      color: isPending ? '#b45309' : (isLegacy ? '#475569' : '#15803d'),
                                      border: isPending ? '1px solid #fde68a' : (isLegacy ? '1px solid #cbd5e1' : '1px solid #bbf7d0'),
                                    }}
                                  >
                                    {isPending ? 'Pending Allocation' : (isLegacy ? 'Legacy Settled' : 'Allocated')}
                                  </span>
                                </td>
                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {isPending ? (
                                    <button
                                      type="button"
                                      onClick={() => openPaymentAllocationModal(p, selectedOrderForDetails)}
                                      style={{
                                        padding: '0.3rem 0.65rem',
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      💰 Distribute
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openPaymentAllocationModal(p, selectedOrderForDetails)}
                                      style={{
                                        padding: '0.3rem 0.65rem',
                                        background: '#f1f5f9',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      View Allocation
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          }

                          // Dump Entry Row
                          const d = entry.rawDump;
                          const isApproved = entry.dumpStatus === 'approved';
                          const isPending = entry.dumpStatus === 'pending';
                          const isRejected = entry.dumpStatus === 'rejected';

                          return (
                            <tr
                              key={entry.entryKey}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: isApproved ? '#faf5ff' : (isPending ? '#fffbeb' : '#fff1f2'),
                              }}
                            >
                              <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                                <div style={{ color: isApproved ? '#7c3aed' : (isPending ? '#b45309' : '#be123c') }}>
                                  {entry.displayId}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>
                                  Write-Off Record
                                </div>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '4px',
                                    background: isApproved ? '#f3e8ff' : (isPending ? '#fef3c7' : '#fee2e2'),
                                    color: isApproved ? '#6b21a8' : (isPending ? '#92400e' : '#991b1b'),
                                    border: isApproved ? '1px solid #d8b4fe' : (isPending ? '1px solid #fde68a' : '1px solid #fecaca'),
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span>{isApproved ? '🛡️' : (isPending ? '⏳' : '❌')}</span>
                                  {entry.paymentType}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {entry.date ? new Date(entry.date).toLocaleDateString('en-IN') : 'N/A'}
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>
                                <div style={{ color: isApproved ? '#7c3aed' : (isPending ? '#b45309' : '#64748b'), textDecoration: isRejected ? 'line-through' : 'none' }}>
                                  ₹{entry.amount.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                                  {isApproved ? '(Written Off)' : (isPending ? '(Requested)' : '(Rejected)')}
                                </div>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: isApproved ? '#7c3aed' : (isPending ? '#b45309' : '#64748b') }}>
                                ₹{entry.adminCut.toLocaleString()}
                                {isPending && <span style={{ fontSize: '0.65rem', fontWeight: 400 }}> (Est.)</span>}
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', color: isApproved ? '#7c3aed' : '#64748b', fontWeight: 600 }}>
                                ₹{entry.directIncome.toLocaleString()}
                                {isPending && <span style={{ fontSize: '0.65rem', fontWeight: 400 }}> (Est.)</span>}
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', color: isApproved ? '#7c3aed' : '#64748b', fontWeight: 600 }}>
                                ₹{entry.levelIncome.toLocaleString()}
                                {isPending && <span style={{ fontSize: '0.65rem', fontWeight: 400 }}> (Est.)</span>}
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', color: isApproved ? '#7c3aed' : '#64748b', fontWeight: 600 }}>
                                ₹{entry.rewardIncome.toLocaleString()}
                                {isPending && <span style={{ fontSize: '0.65rem', fontWeight: 400 }}> (Est.)</span>}
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    background: isApproved ? '#f3e8ff' : (isPending ? '#fef3c7' : '#fee2e2'),
                                    color: isApproved ? '#7c3aed' : (isPending ? '#b45309' : '#b91c1c'),
                                    border: isApproved ? '1px solid #d8b4fe' : (isPending ? '1px solid #fde68a' : '1px solid #f87171'),
                                  }}
                                >
                                  {isApproved ? 'Approved Write-Off' : (isPending ? 'Pending Review' : 'Rejected')}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {isPending ? (
                                  <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDumpForReview(d);
                                        setDumpActionError('');
                                      }}
                                      style={{
                                        padding: '0.28rem 0.55rem',
                                        background: '#7c3aed',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      ✓ Review / Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDumpForReject(d);
                                        setDumpRejectionReason('');
                                        setDumpActionError('');
                                      }}
                                      style={{
                                        padding: '0.28rem 0.55rem',
                                        background: '#fee2e2',
                                        color: '#b91c1c',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      ✕ Reject
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDumpDetails(d)}
                                    style={{
                                      padding: '0.28rem 0.6rem',
                                      background: '#f1f5f9',
                                      color: '#334155',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    View Audit Info
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Close Order Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Approve Dump Request Modal */}
      {selectedDumpForReview && (
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
            zIndex: 99995,
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
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>🛡️</span> Review & Approve Dump Payment
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Dump Request #{selectedDumpForReview.id} • Order: <strong>{selectedDumpForReview.invoice_number}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDumpForReview(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {dumpActionError && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {dumpActionError}
              </div>
            )}

            {/* Calculations Breakdown */}
            {(() => {
              const dumpAmt = Number(selectedDumpForReview.dump_amount || 0);
              const orderRate = Number(selectedDumpForReview.admin_commission_percent ?? selectedOrderForDetails?.admin_commission_percent ?? 15);
              const dumpCut = Number(selectedDumpForReview.admin_commission_cut ?? Math.round((dumpAmt * orderRate) / 100));
              const directDump = Math.round(dumpCut * 0.4);
              const levelDump = Math.round(dumpCut * 0.4);
              const rewardDump = Math.round(dumpCut * 0.2);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: '#6b21a8', fontWeight: 600 }}>Requested Dump Amount:</span>
                      <strong style={{ color: '#6b21a8', fontSize: '1.05rem' }}>₹{dumpAmt.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: '#64748b' }}>Approved Commission Rate:</span>
                      <strong>{orderRate}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e9d5ff', paddingTop: '0.35rem', color: '#15803d', fontWeight: 700 }}>
                      <span>Calculated Dump Admin Cut:</span>
                      <span>₹{dumpCut.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      40 / 40 / 20 Dump Accounting Breakdown
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.45rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#1d4ed8', fontWeight: 700 }}>DIRECT (40%)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.1rem' }}>₹{directDump.toLocaleString()}</div>
                      </div>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.45rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#1d4ed8', fontWeight: 700 }}>LEVEL (40%)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.1rem' }}>₹{levelDump.toLocaleString()}</div>
                      </div>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '0.45rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#1d4ed8', fontWeight: 700 }}>REWARD (20%)</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.1rem' }}>₹{rewardDump.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Entity's Uncollectibility Reason:
                    </div>
                    <div style={{ color: '#0f172a', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{selectedDumpForReview.dump_reason}"
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedDumpForReview(null)}
                disabled={isProcessingDump}
                style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveDump(selectedDumpForReview.id)}
                disabled={isProcessingDump}
                style={{
                  flex: 2,
                  padding: '0.65rem 1rem',
                  background: isProcessingDump ? '#94a3b8' : '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: isProcessingDump ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                {isProcessingDump ? 'Approving Dump...' : `Confirm & Approve Dump of ₹${Number(selectedDumpForReview.dump_amount || 0).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dump Request Modal */}
      {selectedDumpForReject && (
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
            zIndex: 99995,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>❌</span> Reject Dump Payment Request
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Request #{selectedDumpForReject.id} • Amount: ₹{Number(selectedDumpForReject.dump_amount || 0).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDumpForReject(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {dumpActionError && (
              <div style={{ background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {dumpActionError}
              </div>
            )}

            <form onSubmit={handleRejectDump}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Mandatory Rejection Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={dumpRejectionReason}
                  onChange={(e) => setDumpRejectionReason(e.target.value)}
                  placeholder="Explain why this dump request is rejected (e.g., client payment verified, insufficient evidence of uncollectibility)..."
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDumpForReject(null)}
                  disabled={isProcessingDump}
                  style={{ flex: 1, padding: '0.65rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingDump}
                  style={{
                    flex: 2,
                    padding: '0.65rem 1rem',
                    background: isProcessingDump ? '#94a3b8' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: isProcessingDump ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessingDump ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Dump Audit Details Modal */}
      {selectedDumpDetails && (
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
            zIndex: 99995,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: selectedDumpDetails.status === 'approved' ? '#6b21a8' : '#be123c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{selectedDumpDetails.status === 'approved' ? '🛡️' : '❌'}</span> Dump Audit Details
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Record #{selectedDumpDetails.id} • Status: <strong>{selectedDumpDetails.status.toUpperCase()}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDumpDetails(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Dump Amount:</span>
                  <strong>₹{Number(selectedDumpDetails.dump_amount || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Admin Cut ({selectedDumpDetails.admin_commission_percent}%):</span>
                  <strong style={{ color: '#16a34a' }}>₹{Number(selectedDumpDetails.admin_commission_cut || 0).toLocaleString()}</strong>
                </div>
                {selectedDumpDetails.status === 'approved' && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div>Direct (40%): <strong>₹{Number(selectedDumpDetails.direct_income_amount || 0).toLocaleString()}</strong></div>
                    <div>Level (40%): <strong>₹{Number(selectedDumpDetails.level_income_amount || 0).toLocaleString()}</strong></div>
                    <div>Reward (20%): <strong>₹{Number(selectedDumpDetails.reward_income_amount || 0).toLocaleString()}</strong></div>
                  </div>
                )}
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>Entity's Stated Reason:</div>
                <div style={{ color: '#0f172a', fontStyle: 'italic' }}>"{selectedDumpDetails.dump_reason}"</div>
              </div>

              {selectedDumpDetails.admin_rejection_reason && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#9f1239', marginBottom: '0.2rem' }}>Admin Rejection Reason:</div>
                  <div style={{ color: '#be123c' }}>"{selectedDumpDetails.admin_rejection_reason}"</div>
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {selectedDumpDetails.requested_at && <div>Requested at: {new Date(selectedDumpDetails.requested_at).toLocaleString('en-IN')}</div>}
                {selectedDumpDetails.approved_at && <div>Approved at: {new Date(selectedDumpDetails.approved_at).toLocaleString('en-IN')}</div>}
                {selectedDumpDetails.rejected_at && <div>Rejected at: {new Date(selectedDumpDetails.rejected_at).toLocaleString('en-IN')}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedDumpDetails(null)}
                style={{ padding: '0.55rem 1.25rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment-Specific Allocation Modal */}
      {selectedPaymentForAllocation && (
        <div
          className="pro-orders-modal-backdrop"
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
            className="pro-orders-modal-dialog pro-orders-modal-dialog-sm"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💰</span> Distribute Income — Payment Receipt #{selectedPaymentForAllocation.id}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedPaymentForAllocation.invoice_number || selectedPaymentForAllocation.invoiceNumber}</strong> • Reference: <strong>{selectedPaymentForAllocation.reference_no || selectedPaymentForAllocation.referenceNo || 'N/A'}</strong> • Type: <strong style={{ textTransform: 'capitalize' }}>{selectedPaymentForAllocation.payment_type || selectedPaymentForAllocation.paymentType || 'Receipt'}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaymentForAllocation(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {loadingPaymentAllocation ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <div className="spinner" style={{ margin: '0 auto 0.75rem auto', width: '28px', height: '28px' }}></div>
                Calculating live payment income allocation preview from backend...
              </div>
            ) : paymentAllocationError ? (
              <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {paymentAllocationError}
              </div>
            ) : paymentAllocationData ? (
              <div>
                {paymentAllocationSuccessMsg && (
                  <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                    ✓ {paymentAllocationSuccessMsg}
                  </div>
                )}

                {/* Receipt Summary Grid */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.83rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                  <div><span style={{ color: '#64748b' }}>Payment ID:</span> <strong>#{paymentAllocationData.payment_id}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Invoice Number:</span> <strong>{paymentAllocationData.invoice_number}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Payment Type:</span> <strong style={{ textTransform: 'capitalize' }}>{paymentAllocationData.payment_type}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Payment Received:</span> <strong style={{ color: '#2563eb' }}>₹{Number(paymentAllocationData.payment_amount).toLocaleString()}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Commission Rate:</span> <strong>{paymentAllocationData.admin_commission_percent}%</strong></div>
                  <div>
                    <span style={{ color: '#64748b' }}>Payment Status:</span>{' '}
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: paymentAllocationData.income_distribution_status === 'completed' ? '#f0fdf4' : (paymentAllocationData.income_distribution_status === 'legacy_completed' ? '#f1f5f9' : '#fffbeb'),
                        color: paymentAllocationData.income_distribution_status === 'completed' ? '#15803d' : (paymentAllocationData.income_distribution_status === 'legacy_completed' ? '#475569' : '#b45309'),
                        border: paymentAllocationData.income_distribution_status === 'completed' ? '1px solid #bbf7d0' : (paymentAllocationData.income_distribution_status === 'legacy_completed' ? '1px solid #cbd5e1' : '1px solid #fde68a'),
                      }}
                    >
                      {paymentAllocationData.income_distribution_status === 'completed' ? 'Fully Allocated' : (paymentAllocationData.income_distribution_status === 'legacy_completed' ? 'Legacy Settled' : 'Pending Allocation')}
                    </span>
                  </div>
                </div>

                {/* Admin Cut Allocation Metrics for THIS payment */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>THIS PAYMENT ADMIN CUT</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      ₹{Number(paymentAllocationData.payment_admin_cut).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>Authoritative snapshot</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PREVIOUSLY ALLOCATED</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#64748b', marginTop: '0.2rem' }}>
                      ₹{Number(paymentAllocationData.previously_allocated).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>For this payment</div>
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700 }}>ELIGIBLE ADMIN CUT</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
                      ₹{Number(paymentAllocationData.eligible_admin_cut).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#2563eb', marginTop: '0.1rem' }}>Eligible to allocate now</div>
                  </div>
                </div>

                {/* 40/40/20 Read-Only Income Allocation Fields */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                    CALCULATED INCOME ALLOCATION (READ-ONLY)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Direct Income Amount ({paymentAllocationData.rates?.direct_percent ?? 40}%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${Number(paymentAllocationData.direct_income_amount).toLocaleString()}`}
                        style={{ width: '100%', padding: '0.55rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Level Income Amount ({paymentAllocationData.rates?.level_total_percent ?? 40}%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${Number(paymentAllocationData.level_income_amount).toLocaleString()}`}
                        style={{ width: '100%', padding: '0.55rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Reward Income Amount ({paymentAllocationData.rates?.reward_percent ?? 20}%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${Number(paymentAllocationData.reward_income_amount).toLocaleString()}`}
                        style={{ width: '100%', padding: '0.55rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Total Allocated (100%):</span>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>₹{Number(paymentAllocationData.total_allocation).toLocaleString()}</strong>
                  </div>
                </div>

                {/* System Note & Idempotency Indicator */}
                <div style={{ fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  ℹ️ <strong>System Note:</strong> Confirming this distribution allocates ₹{Number(paymentAllocationData.eligible_admin_cut).toLocaleString()} for Payment Receipt #{paymentAllocationData.payment_id} and accumulates onto Order #{paymentAllocationData.sales_record_id}. No individual user accounts, sponsor wallets, or buyer payout balances are credited in this phase.
                </div>

                {!paymentAllocationData.can_allocate && (
                  <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    ⚠️ This payment receipt has already been allocated (Status: {paymentAllocationData.income_distribution_status}). Distributed at: {paymentAllocationData.income_distributed_at ? formatDateTime(paymentAllocationData.income_distributed_at) : 'N/A'}.
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedPaymentForAllocation(null)}
                style={{
                  padding: '0.55rem 1rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <button
                type="button"
                disabled={!paymentAllocationData?.can_allocate || confirmingPaymentAllocation || loadingPaymentAllocation}
                onClick={handleConfirmPaymentAllocation}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: (!paymentAllocationData?.can_allocate || confirmingPaymentAllocation || loadingPaymentAllocation) ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: (!paymentAllocationData?.can_allocate || confirmingPaymentAllocation || loadingPaymentAllocation) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {confirmingPaymentAllocation && <div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#ffffff' }}></div>}
                <span>Confirm Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Order-Level Income Allocation Modal */}
      {selectedOrderForAllocation && (
        <div
          className="pro-orders-modal-backdrop"
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
            className="pro-orders-modal-dialog pro-orders-modal-dialog-sm"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💰</span> Distribute Income
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedOrderForAllocation.invoiceNumber || selectedOrderForAllocation.invoice_number}</strong> • Order ID: <strong>#{selectedOrderForAllocation.id}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForAllocation(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {loadingAllocation ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <div className="spinner" style={{ margin: '0 auto 0.75rem auto', width: '28px', height: '28px' }}></div>
                Calculating live income allocation preview from backend...
              </div>
            ) : allocationError ? (
              <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {allocationError}
              </div>
            ) : allocationData ? (
              <div>
                {allocationSuccessMsg && (
                  <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                    ✓ {allocationSuccessMsg}
                  </div>
                )}

                {/* Order Summary Grid */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.83rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                  <div><span style={{ color: '#64748b' }}>Order ID:</span> <strong>#{allocationData.order_id}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Invoice Number:</span> <strong>{allocationData.invoice_number}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Entity Name:</span> <strong>{allocationData.entity_name}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Buyer / Customer:</span> <strong>{allocationData.customer_name || allocationData.customer} {allocationData.customer_user_code ? `(${allocationData.customer_user_code})` : ''}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Project Value:</span> <strong style={{ color: '#0f172a' }}>₹{Number(allocationData.project_value).toLocaleString()}</strong></div>
                  <div>
                    <span style={{ color: '#64748b' }}>Distribution Status:</span>{' '}
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: allocationData.distribution_status === 'completed' ? '#f0fdf4' : (allocationData.distribution_status === 'partial' ? '#eff6ff' : '#fffbeb'),
                        color: allocationData.distribution_status === 'completed' ? '#15803d' : (allocationData.distribution_status === 'partial' ? '#1d4ed8' : '#b45309'),
                        border: allocationData.distribution_status === 'completed' ? '1px solid #bbf7d0' : (allocationData.distribution_status === 'partial' ? '1px solid #bfdbfe' : '1px solid #fde68a'),
                      }}
                    >
                      {allocationData.distribution_status === 'completed' ? 'Fully Allocated' : (allocationData.distribution_status === 'partial' ? 'Partially Allocated' : 'Pending')}
                    </span>
                  </div>
                </div>

                {/* Admin Cut Allocation Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TOTAL ADMIN CUT</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                      ₹{Number(allocationData.total_admin_cut).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>Accrued so far</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PREVIOUSLY ALLOCATED</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#64748b', marginTop: '0.2rem' }}>
                      ₹{Number(allocationData.previously_allocated).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.1rem' }}>Allocated Admin Cut</div>
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700 }}>ELIGIBLE ADMIN CUT</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
                      ₹{Number(allocationData.eligible_admin_cut).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#2563eb', marginTop: '0.1rem' }}>Eligible to allocate now</div>
                  </div>
                </div>

                {/* 40/40/20 Read-Only Income Allocation Fields */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                    CALCULATED INCOME ALLOCATION (READ-ONLY)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Direct Income Amount ({allocationData.rates?.direct_percent ?? 40}%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${Number(allocationData.direct_income_amount).toLocaleString()}`}
                        style={{ width: '100%', padding: '0.55rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Level Income Amount ({allocationData.rates?.level_total_percent ?? 40}%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${Number(allocationData.level_income_amount).toLocaleString()}`}
                        style={{ width: '100%', padding: '0.55rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Reward Income Amount ({allocationData.rates?.reward_percent ?? 20}%)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`₹${Number(allocationData.reward_income_amount).toLocaleString()}`}
                        style={{ width: '100%', padding: '0.55rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Total Allocated (100%):</span>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>₹{Number(allocationData.total_allocation).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Cumulative Stored Totals Info */}
                <div style={{ fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  ℹ️ <strong>System Note:</strong> Cumulative amounts currently persisted on this order: Direct: ₹{Number(allocationData.cumulative_totals?.direct_income_amount || 0).toLocaleString()} • Level: ₹{Number(allocationData.cumulative_totals?.level_income_amount || 0).toLocaleString()} • Reward: ₹{Number(allocationData.cumulative_totals?.reward_income_amount || 0).toLocaleString()}. Confirming will safely persist newly eligible amounts onto the order record without crediting individual user accounts.
                </div>

                {!allocationData.can_allocate && (
                  <div style={{ padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem' }}>
                    ⚠️ Nothing eligible to allocate. All accrued Admin Cut has already been allocated for this order.
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setSelectedOrderForAllocation(null)}
                style={{
                  padding: '0.55rem 1rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

              <button
                type="button"
                disabled={!allocationData?.can_allocate || confirmingAllocation || loadingAllocation}
                onClick={handleConfirmAllocation}
                style={{
                  padding: '0.55rem 1.25rem',
                  background: (!allocationData?.can_allocate || confirmingAllocation || loadingAllocation) ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: (!allocationData?.can_allocate || confirmingAllocation || loadingAllocation) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {confirmingAllocation && <div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#ffffff' }}></div>}
                <span>Confirm Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersPage;
