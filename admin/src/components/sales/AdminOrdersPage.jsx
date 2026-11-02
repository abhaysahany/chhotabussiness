import React, { useState, useMemo, useEffect } from 'react';
import {
  getAdminOrders,
  getOrderIncomeAllocation,
  confirmOrderIncomeAllocation,
  getPaymentIncomeAllocation,
  confirmPaymentIncomeAllocation,
  updateOrderDumpAmount,
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
  const [editingDumpAmount, setEditingDumpAmount] = useState('0.00');
  const [savingDumpAmount, setSavingDumpAmount] = useState(false);

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
  const openOrderDetails = (order) => {
    setSelectedOrderForDetails(order);
    const dumpVal = order.dump_amount ?? order.dumpAmount ?? 0;
    setEditingDumpAmount(String(dumpVal));
  };

  // Save Dump Amount on Order
  const handleSaveDumpAmount = async () => {
    if (!selectedOrderForDetails) return;
    const num = parseFloat(editingDumpAmount);
    if (isNaN(num) || num < 0) {
      showToast('Dump amount must be a non-negative number (>= 0)');
      return;
    }
    setSavingDumpAmount(true);
    try {
      const res = await updateOrderDumpAmount(selectedOrderForDetails.id, num);
      if (res?.status === 'success') {
        showToast(res.message || `Dump amount updated to ₹${num.toFixed(2)}`);
        const updatedOrder = {
          ...selectedOrderForDetails,
          dump_amount: num,
          dumpAmount: num,
        };
        setSelectedOrderForDetails(updatedOrder);
        await loadSales();
      } else {
        showToast(res?.message || 'Failed to update dump amount');
      }
    } catch (e) {
      showToast(e?.message || 'Error updating dump amount');
    } finally {
      setSavingDumpAmount(false);
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
        const todayStr = new Date().toISOString().split('T')[0];
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
    <div className="admin-page-container">
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
            zIndex: 999999,
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
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            Order Management
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Live database records of all customer orders, receipts, and incremental payment income allocations across the platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadSales}
            style={{
              padding: '0.45rem 0.85rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Orders
          </button>
        </div>
      </div>

      {/* KPI Stats Cards — Order & Payment Accounting Reconciliation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TOTAL PROJECT VALUE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            ₹{totalGross.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>
            {filteredSales.length} Total Orders
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>EXPECTED ADMIN CUT (15%)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#475569', marginTop: '0.25rem' }}>
            ₹{totalExpectedAdminCommission.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.15rem' }}>
            Expected on Full Orders
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TOTAL FUNDS RECEIVED</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#2563eb', marginTop: '0.15rem' }}>
            All Advance & Balance Receipts
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>REMAINING PROJECT BALANCE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: totalBalanceDue > 0 ? '#d97706' : '#16a34a', marginTop: '0.25rem' }}>
            ₹{totalBalanceDue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>
            Pending Client Balances
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ADMIN CUT COLLECTED</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            ₹{totalAdminCommissionCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#16a34a', marginTop: '0.15rem' }}>
            From Received Payments
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>REMAINING ADMIN CUT</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: totalRemainingAdminCommission > 0 ? '#d97706' : '#64748b', marginTop: '0.25rem' }}>
            ₹{totalRemainingAdminCommission.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>
            Expected Minus Collected
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DISTRIBUTED ADMIN CUT</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
            ₹{totalDistributedAdminCut.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#7c3aed', marginTop: '0.15rem' }}>
            40/40/20 Allocated
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by Entity Name, Invoice #, Customer, or Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Entity Types</option>
            <option value="business">Commercial Businesses</option>
            <option value="freelance">Freelance Partners</option>
          </select>

          <select
            value={itemTypeFilter}
            onChange={(e) => setItemTypeFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Offering Types</option>
            <option value="service">Services</option>
            <option value="product">Products</option>
            <option value="package">Packages</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="partial">Partial (Balance Due)</option>
            <option value="completed">Fully Completed</option>
          </select>

          <button
            type="button"
            onClick={() => setDateRange(dateRange === 'all' ? 'today' : 'all')}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #3569a7',
              background: dateRange === 'today' ? '#3569a7' : '#ffffff',
              color: dateRange === 'today' ? '#ffffff' : '#3569a7',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {dateRange === 'today' ? 'Showing Today' : 'Filter: Today'}
          </button>
        </div>
      </div>

      {/* Centralized Orders Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 0.9rem' }}>Invoice # & Entity</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Customer / Buyer</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Project Amount</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Expected Admin Cut</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Payment Received</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Remaining Balance</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Admin Cut Collected</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Remaining Admin Cut</th>
                <th style={{ padding: '0.85rem 0.9rem' }}>Status</th>
                <th style={{ padding: '0.85rem 0.9rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading centralized database orders...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No order records found matching your filter criteria.
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
                  const entityType = sale.entityType || sale.entity_type;
                  const isCompleted = balanceDue <= 0;
                  const distributionStatus = sale.income_distribution_status || sale.incomeDistributionStatus || 'pending';
                  const hasPendingPayments = payments.some((p) => (p.income_distribution_status || p.incomeDistributionStatus) === 'pending' && Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0) > 0);

                  return (
                    <tr key={sale.id || invoiceNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* 1. Invoice Number & Entity */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 700, color: '#0f172a' }}>
                        <div>{invoiceNo}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '0.1rem' }}>
                          {sale.entityName || sale.entity_name}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400 }}>
                          {sale.date}
                        </div>
                        {payments.length > 0 && (
                          <div style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginTop: '0.15rem' }}>
                            {payments.length} Receipt{payments.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>

                      {/* 2. Customer / Buyer */}
                      <td style={{ padding: '0.85rem 0.9rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {sale.customerName || sale.customer_name || sale.customer}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                          {sale.customer_user_code && (
                            <span style={{ fontSize: '0.68rem', background: '#eff6ff', color: '#2563eb', padding: '0.08rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                              {sale.customer_user_code}
                            </span>
                          )}
                          {sale.sponsor && (
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              Ref: {sale.sponsor}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem', textTransform: 'capitalize' }}>
                          {sale.item} ({sale.itemType || sale.item_type || 'service'})
                        </div>
                      </td>

                      {/* 3. Project Amount */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{gross.toLocaleString()}
                      </td>

                      {/* 4. Expected Admin Commission (15%) */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 700, color: '#475569' }}>
                        <div>₹{expectedAdminCut.toLocaleString()}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>({rate}%)</div>
                      </td>

                      {/* 5. Total Payment Received */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 800, color: '#2563eb' }}>
                        ₹{totalPaymentReceived.toLocaleString()}
                      </td>

                      {/* 6. Remaining Project Balance */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 800, color: balanceDue > 0 ? '#d97706' : '#16a34a' }}>
                        ₹{balanceDue.toLocaleString()}
                      </td>

                      {/* 7. Admin Commission Collected */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 800, color: '#16a34a' }}>
                        ₹{adminCutCollected.toLocaleString()}
                      </td>

                      {/* 8. Remaining Admin Commission */}
                      <td style={{ padding: '0.85rem 0.9rem', fontWeight: 800, color: remainingAdminCut > 0 ? '#d97706' : '#64748b' }}>
                        ₹{remainingAdminCut.toLocaleString()}
                      </td>

                      {/* 9. Income Distribution Status */}
                      <td style={{ padding: '0.85rem 0.9rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {isCompleted ? (
                            <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.12rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              ✓ Settled
                            </span>
                          ) : (
                            <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.12rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              ⏳ Partial
                            </span>
                          )}

                          {/* Order Income Distribution Status */}
                          <span
                            style={{
                              padding: '0.12rem 0.4rem',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              background: distributionStatus === 'completed' ? '#f0fdf4' : (distributionStatus === 'partial' ? '#eff6ff' : '#fffbeb'),
                              color: distributionStatus === 'completed' ? '#15803d' : (distributionStatus === 'partial' ? '#1d4ed8' : '#b45309'),
                              border: distributionStatus === 'completed' ? '1px solid #bbf7d0' : (distributionStatus === 'partial' ? '1px solid #bfdbfe' : '1px solid #fde68a'),
                            }}
                          >
                            {distributionStatus === 'completed' ? '✓ Income Allocated' : (distributionStatus === 'partial' ? '⚡ Partial Income' : '⏳ Income Pending')}
                          </span>

                          {distributedCut > 0 && (
                            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>
                              Allocated: ₹{distributedCut.toLocaleString()}
                            </div>
                          )}

                          {dumpAmount > 0 && (
                            <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 600 }}>
                              Dump: ₹{dumpAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 10. Actions */}
                      <td style={{ padding: '0.85rem 0.9rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceForView(sale)}
                            style={{
                              padding: '0.32rem 0.55rem',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            👁️ Invoice
                          </button>

                          <button
                            type="button"
                            onClick={() => openOrderDetails(sale)}
                            style={{
                              padding: '0.32rem 0.6rem',
                              background: '#0f172a',
                              color: '#ffffff',
                              border: '1px solid #0f172a',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                            title="View Order Details, Accounting Summary, and Payment Receipts"
                          >
                            <span>💳 Payments</span>
                            {payments.length > 0 && (
                              <span style={{ background: '#334155', color: '#ffffff', padding: '0.05rem 0.35rem', borderRadius: '4px', fontSize: '0.68rem' }}>
                                {payments.length}
                              </span>
                            )}
                          </button>

                          {hasPendingPayments && (
                            <button
                              type="button"
                              onClick={() => openOrderDetails(sale)}
                              style={{
                                padding: '0.32rem 0.6rem',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: '1px solid #1d4ed8',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Distribute Income for Pending Payment Receipts"
                            >
                              <span>💰 Distribute</span>
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
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoiceForView && (
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
                const orderBalance = Number(selectedOrderForDetails.balanceDue ?? selectedOrderForDetails.balance_due ?? Math.max(0, orderGross - orderReceived));
                const orderCollectedCut = orderPayments.length > 0
                  ? orderPayments.reduce((acc, p) => acc + (Number(p.adminCommissionCut ?? p.admin_commission_cut) || 0), 0)
                  : Number(selectedOrderForDetails.adminCommissionCollected ?? selectedOrderForDetails.admin_commission_collected ?? 0);
                const orderRemainingCut = Math.max(0, Math.round((orderExpectedCut - orderCollectedCut) * 100) / 100);
                const orderDistributedCut = Number(selectedOrderForDetails.distributed_admin_cut_amount ?? selectedOrderForDetails.distributedAdminCutAmount ?? 0);
                const directCut = Number(selectedOrderForDetails.direct_income_amount ?? selectedOrderForDetails.directIncomeAmount ?? 0);
                const levelCut = Number(selectedOrderForDetails.level_income_amount ?? selectedOrderForDetails.levelIncomeAmount ?? 0);
                const rewardCut = Number(selectedOrderForDetails.reward_income_amount ?? selectedOrderForDetails.rewardIncomeAmount ?? 0);

                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>PROJECT AMOUNT</div>
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
                        <div style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>PAYMENT RECEIVED</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb', marginTop: '0.15rem' }}>
                          ₹{orderReceived.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#2563eb' }}>{orderPayments.length} Receipt{orderPayments.length > 1 ? 's' : ''}</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600 }}>REMAINING BALANCE</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: orderBalance > 0 ? '#d97706' : '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderBalance.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Due from customer</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>ADMIN CUT COLLECTED</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderCollectedCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#16a34a' }}>From receipts</div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>REMAINING ADMIN CUT</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: orderRemainingCut > 0 ? '#d97706' : '#64748b', marginTop: '0.15rem' }}>
                          ₹{orderRemainingCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Expected - Collected</div>
                      </div>
                    </div>

                    {/* Cumulative 40/40/20 Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>ALLOCATED ADMIN CUT</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
                          ₹{orderDistributedCut.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#16a34a' }}>Persisted on order</div>
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
                  </>
                );
              })()}

              {/* Dump Amount Box */}
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>📦</span> Order Dump Amount
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#7e22ce', marginTop: '0.15rem' }}>
                    Isolated Admin-managed field. Excluded from commission & income distribution math.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b21a8', fontWeight: 700, fontSize: '0.85rem' }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingDumpAmount}
                      onChange={(e) => setEditingDumpAmount(e.target.value)}
                      style={{
                        padding: '0.4rem 0.6rem 0.4rem 1.6rem',
                        borderRadius: '6px',
                        border: '1px solid #c084fc',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        width: '120px',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingDumpAmount}
                    onClick={handleSaveDumpAmount}
                    style={{
                      padding: '0.42rem 0.85rem',
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: savingDumpAmount ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingDumpAmount ? 'Saving...' : 'Save Dump'}
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION B: Payment Receipts Ledger & Incremental Allocation */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.15rem', background: '#ffffff' }}>
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>💳</span> SECTION B: PAYMENT RECEIPTS LEDGER & INCREMENTAL ALLOCATION
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Each payment receipt row is the independent unit of allocation. Admin Cut is calculated from received payment amount and allocated 40/40/20 exactly once.
                </p>
              </div>

              {(!selectedOrderForDetails.payments || selectedOrderForDetails.payments.length === 0) ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem', background: '#f8fafc', borderRadius: '8px' }}>
                  No individual payment receipts recorded yet for this order.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Receipt #</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Type</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Date</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Received</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Admin Cut</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Direct (40%)</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Level (40%)</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Reward (20%)</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderForDetails.payments.map((p) => {
                        const pAmount = Number(p.amount || 0);
                        const pCut = Number(p.admin_commission_cut ?? p.adminCommissionCut ?? 0);
                        const pDirect = Number(p.direct_income_amount ?? p.directIncomeAmount ?? 0);
                        const pLevel = Number(p.level_income_amount ?? p.levelIncomeAmount ?? 0);
                        const pReward = Number(p.reward_income_amount ?? p.rewardIncomeAmount ?? 0);
                        const pStatus = p.income_distribution_status || p.incomeDistributionStatus || 'pending';
                        const isPending = pStatus === 'pending';
                        const isLegacy = pStatus === 'legacy_completed';

                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                              <div>#{p.id}</div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 400 }}>
                                {p.reference_no || p.referenceNo || 'N/A'}
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <span
                                style={{
                                  textTransform: 'capitalize',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  background: (p.payment_type || p.paymentType) === 'advance' ? '#eff6ff' : '#f0fdf4',
                                  color: (p.payment_type || p.paymentType) === 'advance' ? '#1d4ed8' : '#15803d',
                                }}
                              >
                                {p.payment_type || p.paymentType || 'advance'}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A')}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#2563eb' }}>
                              ₹{pAmount.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: '#16a34a' }}>
                              ₹{pCut.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                              ₹{pDirect.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                              ₹{pLevel.toLocaleString()}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: '#0f172a', fontWeight: 600 }}>
                              ₹{pReward.toLocaleString()}
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
                                {isPending ? 'Pending' : (isLegacy ? 'Legacy Settled' : 'Allocated')}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
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
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Distribute Income
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
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  View Allocation
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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

      {/* Payment-Specific Allocation Modal */}
      {selectedPaymentForAllocation && (
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
                        Direct Income Amount (40%)
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
                        Level Income Amount (40%)
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
                        Reward Income Amount (20%)
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
                    ⚠️ This payment receipt has already been allocated (Status: {paymentAllocationData.income_distribution_status}). Distributed at: {paymentAllocationData.income_distributed_at ? new Date(paymentAllocationData.income_distributed_at).toLocaleString() : 'N/A'}.
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
                        Direct Income Amount (40%)
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
                        Level Income Amount (40%)
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
                        Reward Income Amount (20%)
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
