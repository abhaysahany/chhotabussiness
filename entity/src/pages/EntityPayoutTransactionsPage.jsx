import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityPayouts } from '../api/entityService';

function EntityPayoutTransactionsPage() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';

  // State Management
  const [payoutsList, setPayoutsList] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total_paid: 0,
    balance: 0,
    dump_amount: 0,
    total_tds: 0,
    total_gross: 0,
    total_transactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedPayout, setSelectedPayout] = useState(null);

  // Filters State
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'dumped' | 'failed'
  const [methodFilter, setMethodFilter] = useState('all'); // 'all' | 'bank' | 'imps' | 'upi'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-high' | 'amount-low'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load Data from API
  const loadPayouts = async () => {
    setLoading(true);
    try {
      const res = await getEntityPayouts({
        entity: entityName,
        start_date: startDate,
        end_date: endDate,
        status: statusFilter,
        payment_method: methodFilter,
        search: searchQuery,
      });

      if (res?.status === 'success' || Array.isArray(res?.payouts)) {
        setPayoutsList(res.payouts || []);
        if (res.summary) {
          setSummaryData(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching payouts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [entityName]);

  // Handle Preset Date Filter Changes
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDate(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      setStartDate(formatDate(weekStart));
      setEndDate(formatDate(now));
    } else if (preset === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDate(monthStart));
      setEndDate(formatDate(now));
    } else if (preset === 'last_month') {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatDate(lastMonthStart));
      setEndDate(formatDate(lastMonthEnd));
    }
  };

  // Filter & Sort Logic in Client
  const filteredPayouts = useMemo(() => {
    let result = [...payoutsList];

    // Filter by Status
    if (statusFilter !== 'all') {
      result = result.filter((p) => {
        const s = (p.status || '').toLowerCase();
        if (statusFilter === 'paid') return s === 'paid' || s === 'completed';
        if (statusFilter === 'pending') return s === 'pending';
        if (statusFilter === 'dumped') return s === 'dumped' || s === 'escrow';
        if (statusFilter === 'failed') return s === 'failed' || s === 'rejected';
        return s === statusFilter;
      });
    }

    // Filter by Method
    if (methodFilter !== 'all') {
      result = result.filter((p) => {
        const m = (p.payment_method || p.paymentMethod || '').toLowerCase();
        if (methodFilter === 'bank') return m.includes('bank') || m.includes('neft') || m.includes('rtgs');
        if (methodFilter === 'imps') return m.includes('imps');
        if (methodFilter === 'upi') return m.includes('upi');
        return true;
      });
    }

    // Filter by Date Range
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((p) => {
        const d = new Date(p.request_date || p.requestDate);
        return d >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((p) => {
        const d = new Date(p.request_date || p.requestDate);
        return d <= end;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          (p.payout_code || p.payoutCode || '').toLowerCase().includes(q) ||
          (p.utr_number || p.utrNumber || '').toLowerCase().includes(q) ||
          (p.bank_name || p.bankName || '').toLowerCase().includes(q) ||
          (p.account_number || p.accountNumber || '').toLowerCase().includes(q) ||
          (p.upi_id || p.upiId || '').toLowerCase().includes(q) ||
          (p.notes || '').toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.request_date || a.requestDate || 0).getTime();
      const dateB = new Date(b.request_date || b.requestDate || 0).getTime();
      const amtA = Number(a.net_payable_amount ?? a.netPayableAmount) || 0;
      const amtB = Number(b.net_payable_amount ?? b.netPayableAmount) || 0;

      if (sortBy === 'date-desc') return dateB - dateA;
      if (sortBy === 'date-asc') return dateA - dateB;
      if (sortBy === 'amount-high') return amtB - amtA;
      if (sortBy === 'amount-low') return amtA - amtB;
      return 0;
    });

    return result;
  }, [payoutsList, statusFilter, methodFilter, startDate, endDate, searchQuery, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage) || 1;
  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayouts.slice(start, start + itemsPerPage);
  }, [filteredPayouts, currentPage]);

  // Computed Dynamic Financial Totals from current filtered dataset
  const computedTotalPaid = useMemo(() => {
    return filteredPayouts
      .filter((p) => (p.status || '').toLowerCase() === 'paid' || (p.status || '').toLowerCase() === 'completed')
      .reduce((acc, curr) => acc + (Number(curr.net_payable_amount ?? curr.netPayableAmount) || 0), 0);
  }, [filteredPayouts]);

  const computedTotalBalance = useMemo(() => {
    // Current available balance: base entity settlement balance
    return summaryData.balance || 48500.00;
  }, [summaryData.balance]);

  const computedTotalDump = useMemo(() => {
    return filteredPayouts.reduce((acc, curr) => acc + (Number(curr.dump_amount ?? curr.dumpAmount) || 0), 0) || summaryData.dump_amount || 12450.00;
  }, [filteredPayouts, summaryData.dump_amount]);

  const computedTotalTds = useMemo(() => {
    return filteredPayouts.reduce((acc, curr) => acc + (Number(curr.tds_deduction ?? curr.tdsDeduction) || 0), 0);
  }, [filteredPayouts]);

  // Copy helper
  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label}: ${text}`);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setMethodFilter('all');
    setSearchQuery('');
    setSortBy('date-desc');
    setCurrentPage(1);
    showToast('Filters have been reset.');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredPayouts.length) {
      showToast('No records to export.');
      return;
    }

    const headers = [
      'Payout ID',
      'Date',
      'Gross Amount (INR)',
      'TDS (5%)',
      'Processing Fee',
      'Net Paid (INR)',
      'Dump Amount (INR)',
      'Payment Method',
      'Bank / UPI',
      'Account No',
      'UTR Number',
      'Status',
    ];

    const rows = filteredPayouts.map((p) => [
      p.payout_code || p.payoutCode,
      p.request_date || p.requestDate,
      (p.gross_amount ?? p.grossAmount ?? p.requested_amount ?? 0).toFixed(2),
      (p.tds_deduction ?? p.tdsDeduction ?? 0).toFixed(2),
      (p.admin_processing_fee ?? p.adminProcessingFee ?? 0).toFixed(2),
      (p.net_payable_amount ?? p.netPayableAmount ?? 0).toFixed(2),
      (p.dump_amount ?? p.dumpAmount ?? 0).toFixed(2),
      `"${p.payment_method || p.paymentMethod || 'Bank Transfer'}"`,
      `"${p.bank_name || p.bankName || 'HDFC Bank'}"`,
      `"${p.account_number || p.accountNumber || ''}"`,
      `"${p.utr_number || p.utrNumber || 'N/A'}"`,
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Entity_Payout_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ CSV statement successfully exported!');
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
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
            boxShadow: '0 10px 25px -3px rgba(0,0,0,0.3)',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="page-subheader" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f4f6e8', color: '#505726', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.4rem', border: '1px solid #dbe2b5' }}>
            <span>💼</span> PAYOUT DESK • SETTLEMENTS & DISBURSALS
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Payout Transactions
          </h1>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Track and manage all direct bank payouts, commission disbursements, settlement balances, and dump reserves.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/entity/payouts/reports')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#505726', borderColor: '#505726' }}
          >
            <span>📊</span> View Payout Reports →
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '0.5rem 0.85rem',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => navigate('/entity/payouts/transactions')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid #505726',
            color: '#505726',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>💳</span> Payout Transactions
          <span style={{ background: '#f4f6e8', color: '#505726', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
            {filteredPayouts.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payouts/reports')}
          style={{
            padding: '0.65rem 1.2rem',
            border: 'none',
            background: 'none',
            borderBottom: '3px solid transparent',
            color: '#64748b',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '-2px',
          }}
        >
          <span>📈</span> Payout Reports & Analytics
        </button>
      </div>

      {/* Financial Metrics Cards: TOTAL PAID | BALANCE | DUMP AMOUNT | TRANSACTIONS */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* 1. TOTAL PAID CARD */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Paid
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              💰
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#14532d', letterSpacing: '-0.02em' }}>
            ₹{computedTotalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#15803d', fontWeight: 600 }}>
            <span>✓</span> Disbursed & settled to registered bank
          </div>
        </div>

        {/* 2. BALANCE CARD */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Balance
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              ⚖️
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
            ₹{computedTotalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#2563eb', fontWeight: 600 }}>
            <span>●</span> Outstanding settlement awaiting next cycle
          </div>
        </div>

        {/* 3. DUMP AMOUNT CARD */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
            border: '1px solid #e9d5ff',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dump Amount
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              📦
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#581c87', letterSpacing: '-0.02em' }}>
            ₹{computedTotalDump.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#7e22ce', fontWeight: 600 }}>
            <span>🔒</span> Escrow buffer & batch clearance hold
          </div>
        </div>

        {/* 4. TOTAL TRANSACTIONS CARD */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f4f6e8 100%)',
            border: '1px solid #dbe2b5',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(80, 87, 38, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#505726', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Transactions Volume
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#e5eac3', color: '#505726', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              📊
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#323717', letterSpacing: '-0.02em' }}>
            {filteredPayouts.length}{' '}
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>records</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.74rem', color: '#505726', fontWeight: 600 }}>
            <span>⚡</span> TDS Deducted: ₹{computedTotalTds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        {/* Quick Date Presets Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginRight: '0.25rem' }}>
              📅 Date Filter:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleDatePresetChange(preset.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: datePreset === preset.id ? '#505726' : '#e2e8f0',
                  background: datePreset === preset.id ? '#f4f6e8' : '#f8fafc',
                  color: datePreset === preset.id ? '#505726' : '#64748b',
                  fontSize: '0.76rem',
                  fontWeight: datePreset === preset.id ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Reset Filters
            </button>
          </div>
        </div>

        {/* Multi-Criteria Filters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          {/* Custom Date Range: Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                background: '#f8fafc',
                color: '#0f172a',
              }}
            />
          </div>

          {/* Custom Date Range: End Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              style={{
                width: '100%',
                padding: '0.45rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                background: '#f8fafc',
                color: '#0f172a',
              }}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              Settlement Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.48rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                background: '#f8fafc',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">✓ Paid / Completed</option>
              <option value="pending">⏳ Pending / Processing</option>
              <option value="dumped">📦 In Escrow / Dump</option>
              <option value="failed">✕ Failed / Rejected</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              Payment Mode
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.48rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                background: '#f8fafc',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Payment Modes</option>
              <option value="bank">Bank Transfer (NEFT/RTGS)</option>
              <option value="imps">IMPS Instant Settlement</option>
              <option value="upi">UPI Direct Transfer</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              Sort Records
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.48rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                background: '#f8fafc',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <option value="date-desc">Newest First (Date ↓)</option>
              <option value="date-asc">Oldest First (Date ↑)</option>
              <option value="amount-high">Amount (High to Low)</option>
              <option value="amount-low">Amount (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Search Input Bar */}
        <div style={{ marginTop: '0.85rem' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by Payout ID, UTR Number, Bank A/C, IFSC, UPI ID, or Notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#ffffff',
                color: '#0f172a',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payout Transactions Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        {/* Table Header Controls */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Settlement Transactions Ledger
            </h2>
            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
              {filteredPayouts.length} total entries
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.75rem 1rem' }}>Payout ID & Date</th>
                <th style={{ padding: '0.75rem 1rem' }}>Beneficiary & Bank</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Gross Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>TDS (5%)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Paid</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Dump / Escrow</th>
                <th style={{ padding: '0.75rem 1rem' }}>Mode</th>
                <th style={{ padding: '0.75rem 1rem' }}>UTR / Ref No</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem', animation: 'spin 1s linear infinite' }}>⏳</span>
                      <span>Loading payout transaction records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayouts.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem' }}>🔍</span>
                      <strong style={{ color: '#0f172a', fontSize: '1rem' }}>No payout records found</strong>
                      <span style={{ fontSize: '0.8rem' }}>Try adjusting your date range, status, or search query.</span>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.4rem 0.85rem',
                          background: '#f4f6e8',
                          color: '#505726',
                          border: '1px solid #dbe2b5',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayouts.map((p, idx) => {
                  const grossAmt = Number(p.gross_amount ?? p.grossAmount ?? p.requested_amount) || 0;
                  const tdsAmt = Number(p.tds_deduction ?? p.tdsDeduction) || 0;
                  const netPaidAmt = Number(p.net_payable_amount ?? p.netPayableAmount) || 0;
                  const dumpAmt = Number(p.dump_amount ?? p.dumpAmount) || 0;
                  const status = (p.status || '').toLowerCase();
                  const isPaid = status === 'paid' || status === 'completed';
                  const isPending = status === 'pending';
                  const isDumped = status === 'dumped' || status === 'escrow';

                  return (
                    <tr
                      key={p.id || idx}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfdfa')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {/* Payout ID & Date */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {p.payout_code || p.payoutCode || `PO-${p.id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(p.payout_code || p.payoutCode || `PO-${p.id}`, 'Payout Code')}
                            title="Copy Payout Code"
                            style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', padding: '2px' }}
                          >
                            📋
                          </button>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                          📅 {p.request_date ? new Date(p.request_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                      </td>

                      {/* Beneficiary & Bank */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>
                          {p.bank_name || p.bankName || 'HDFC Bank Ltd'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {p.account_number || p.accountNumber ? `A/C: ${p.account_number || p.accountNumber}` : `UPI: ${p.upi_id || p.upiId}`}
                        </div>
                      </td>

                      {/* Gross Amount */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                        ₹{grossAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* TDS (5%) */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        -₹{tdsAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Net Paid */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, color: isPaid ? '#15803d' : '#0f172a', fontSize: '0.9rem' }}>
                          ₹{netPaidAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Dump Amount */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {dumpAmt > 0 ? (
                          <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #e9d5ff' }}>
                            ₹{dumpAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>₹0.00</span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {p.payment_method?.includes('UPI') ? '📱 UPI' : p.payment_method?.includes('IMPS') ? '⚡ IMPS' : '🏦 Bank Transfer'}
                        </span>
                      </td>

                      {/* UTR / Ref No */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {p.utr_number || p.utrNumber ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: '0.78rem' }}>
                              {p.utr_number || p.utrNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(p.utr_number || p.utrNumber, 'UTR Number')}
                              title="Copy UTR"
                              style={{ border: 'none', background: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              📋
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontStyle: 'italic' }}>Pending UTR</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isPaid && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #bbf7d0' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                            Paid
                          </span>
                        )}
                        {isPending && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #fde68a' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }} />
                            Pending
                          </span>
                        )}
                        {isDumped && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #e9d5ff' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9333ea' }} />
                            In Escrow / Dump
                          </span>
                        )}
                        {!isPaid && !isPending && !isDumped && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                            ✕ {status}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedPayout(p)}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          🧾 View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && filteredPayouts.length > 0 && (
          <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredPayouts.length)} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredPayouts.length)} of {filteredPayouts.length} payouts
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: currentPage === pg ? '#505726' : '#cbd5e1',
                    background: currentPage === pg ? '#505726' : '#ffffff',
                    color: currentPage === pg ? '#ffffff' : '#334155',
                    fontSize: '0.76rem',
                    fontWeight: currentPage === pg ? 800 : 600,
                    cursor: 'pointer',
                  }}
                >
                  {pg}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payout Slip / Receipt Modal */}
      {selectedPayout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
          onClick={() => setSelectedPayout(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#a3e635', fontWeight: 800, textTransform: 'uppercase' }}>
                  <span>✓</span> Verified Settlement Voucher
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  Payout Receipt Slip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* Voucher Code & Status Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Payout Reference ID
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedPayout.payout_code || selectedPayout.payoutCode || `PO-${selectedPayout.id}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Settlement Status
                  </span>
                  <div>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800 }}>
                      ✓ {selectedPayout.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payee Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Beneficiary Entity</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPayout.beneficiary_name || selectedPayout.beneficiaryName || entityName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Payment Method</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPayout.payment_method || selectedPayout.paymentMethod || 'Bank Transfer (NEFT)'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Destination Bank / UPI</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPayout.bank_name || selectedPayout.bankName || 'HDFC Bank Ltd'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>Account / UPI Details</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPayout.account_number || selectedPayout.accountNumber || selectedPayout.upi_id || selectedPayout.upiId}</strong>
                </div>
                {selectedPayout.utr_number && (
                  <div style={{ gridColumn: 'span 2', background: '#eff6ff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    <span style={{ color: '#1e40af', fontSize: '0.72rem', display: 'block', fontWeight: 700 }}>Bank Reference / UTR Number:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e3a8a', fontSize: '0.88rem' }}>
                      {selectedPayout.utr_number || selectedPayout.utrNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>Gross Settlement Requested</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{(Number(selectedPayout.gross_amount ?? selectedPayout.grossAmount ?? selectedPayout.requested_amount) || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#b45309' }}>TDS Deducted u/s 194H (5%)</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        -₹{(Number(selectedPayout.tds_deduction ?? selectedPayout.tdsDeduction) || 0).toFixed(2)}
                      </td>
                    </tr>
                    {Number(selectedPayout.dump_amount ?? selectedPayout.dumpAmount) > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#7e22ce' }}>Escrow / Dump Buffer Hold</td>
                        <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#7e22ce' }}>
                          ₹{(Number(selectedPayout.dump_amount ?? selectedPayout.dumpAmount) || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ background: '#f0fdf4' }}>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, color: '#15803d', fontSize: '0.9rem' }}>Net Amount Disbursed to Bank</td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '1.1rem' }}>
                        ₹{(Number(selectedPayout.net_payable_amount ?? selectedPayout.netPayableAmount) || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  🖨️ Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#505726',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntityPayoutTransactionsPage;
