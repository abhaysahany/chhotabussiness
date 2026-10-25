import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityPayoutReports } from '../api/entityService';

function EntityPayoutReportsPage() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';

  // State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodPreset, setPeriodPreset] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedStatement, setSelectedStatement] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await getEntityPayoutReports({
        entity: entityName,
        period: periodPreset,
        start_date: startDate,
        end_date: endDate,
      });

      if (res?.status === 'success') {
        setReportData(res);
      }
    } catch (err) {
      console.error('Error fetching payout reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [entityName, periodPreset]);

  // Summary Metrics
  const summary = reportData?.summary || {
    total_paid: 385450.00,
    balance: 48500.00,
    dump_amount: 12450.00,
    total_tds: 19272.50,
    total_gross: 417172.50,
    total_transactions: 35,
    settlement_success_rate: 98.6,
  };

  const monthlyTrend = reportData?.monthly_trend || [
    { month: 'Mar 2026', paid: 45000, dump: 3200, balance: 8500, count: 4 },
    { month: 'Apr 2026', paid: 58200, dump: 4100, balance: 12400, count: 6 },
    { month: 'May 2026', paid: 74500, dump: 2800, balance: 15600, count: 7 },
    { month: 'Jun 2026', paid: 69000, dump: 5000, balance: 19800, count: 5 },
    { month: 'Jul 2026', paid: 88400, dump: 3600, balance: 24500, count: 8 },
    { month: 'Aug 2026', paid: 96350, dump: 6200, balance: 48500, count: 9 },
  ];

  const methodDistribution = reportData?.method_distribution || [
    { method: 'Bank Transfer (NEFT/RTGS)', amount: 245000, percentage: 56.8, count: 18, color: '#10b981' },
    { method: 'IMPS Instant Settlement', amount: 128500, percentage: 29.8, count: 12, color: '#3b82f6' },
    { method: 'UPI Direct Transfer', amount: 57950, percentage: 13.4, count: 9, color: '#8b5cf6' },
  ];

  const statusDistribution = reportData?.status_distribution || [
    { status: 'Paid / Settled', amount: summary.total_paid || 385450, percentage: 88.5, color: '#10b981' },
    { status: 'Pending / Processing', amount: 28500, percentage: 6.5, color: '#f59e0b' },
    { status: 'Dump / In Escrow', amount: summary.dump_amount || 12450, percentage: 5.0, color: '#6366f1' },
  ];

  const statementRows = useMemo(() => {
    let rows = reportData?.statement_rows || [
      {
        period: '01 Aug 2026 - 21 Aug 2026',
        grossVolume: 104200.00,
        totalPaid: 96350.00,
        balance: 48500.00,
        dumpAmount: 6200.00,
        tdsDeducted: 5210.00,
        payoutCount: 9,
        status: 'Active Cycle',
      },
      {
        period: '01 Jul 2026 - 31 Jul 2026',
        grossVolume: 95800.00,
        totalPaid: 88400.00,
        balance: 0.00,
        dumpAmount: 3600.00,
        tdsDeducted: 4790.00,
        payoutCount: 8,
        status: 'Fully Reconciled',
      },
      {
        period: '01 Jun 2026 - 30 Jun 2026',
        grossVolume: 75200.00,
        totalPaid: 69000.00,
        balance: 0.00,
        dumpAmount: 5000.00,
        tdsDeducted: 3760.00,
        payoutCount: 5,
        status: 'Fully Reconciled',
      },
      {
        period: '01 May 2026 - 31 May 2026',
        grossVolume: 81000.00,
        totalPaid: 74500.00,
        balance: 0.00,
        dumpAmount: 2800.00,
        tdsDeducted: 4050.00,
        payoutCount: 7,
        status: 'Fully Reconciled',
      },
      {
        period: '01 Apr 2026 - 30 Apr 2026',
        grossVolume: 63500.00,
        totalPaid: 58200.00,
        balance: 0.00,
        dumpAmount: 4100.00,
        tdsDeducted: 3175.00,
        payoutCount: 6,
        status: 'Fully Reconciled',
      },
    ];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter((r) => r.period.toLowerCase().includes(q) || r.status.toLowerCase().includes(q));
    }

    return rows;
  }, [reportData, searchQuery]);

  // Max value for bar chart normalization
  const maxMonthlyPaid = useMemo(() => {
    return Math.max(...monthlyTrend.map((m) => m.paid), 100000);
  }, [monthlyTrend]);

  // Export Master Statement
  const handleExportStatement = () => {
    const headers = [
      'Statement Period',
      'Gross Settlement Volume (INR)',
      'Total Paid (INR)',
      'Balance Remaining (INR)',
      'Dump Amount (INR)',
      'TDS Deducted (5%)',
      'Transactions Count',
      'Reconciliation Status',
    ];

    const rows = statementRows.map((r) => [
      `"${r.period}"`,
      r.grossVolume.toFixed(2),
      r.totalPaid.toFixed(2),
      r.balance.toFixed(2),
      r.dumpAmount.toFixed(2),
      r.tdsDeducted.toFixed(2),
      r.payoutCount,
      `"${r.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Entity_Payout_Report_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Master Statement Report exported!');
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

      {/* Header & Subtitle */}
      <div className="page-subheader" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f4f6e8', color: '#505726', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.4rem', border: '1px solid #dbe2b5' }}>
            <span>📊</span> PAYOUT DESK • RECONCILIATION & STATEMENTS
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Payout Reports & Analytics
          </h1>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Comprehensive settlement statements, tax deductions (TDS u/s 194H), monthly trend analytics, and dump reserves.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/entity/payouts/transactions')}
            style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#505726', borderColor: '#505726' }}
          >
            <span>💳</span> Payout Transactions →
          </button>
          <button
            type="button"
            onClick={handleExportStatement}
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
            <span>📥</span> Export Report Statement
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
          <span>💳</span> Payout Transactions
        </button>
        <button
          type="button"
          onClick={() => navigate('/entity/payouts/reports')}
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
          <span>📈</span> Payout Reports & Analytics
        </button>
      </div>

      {/* Summary KPI Cards Grid: TOTAL PAID | BALANCE | DUMP AMOUNT | TDS DEDUCTIONS | SUCCESS RATE */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* 1. TOTAL PAID */}
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
              Total Paid (Disbursed)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              💰
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#14532d', letterSpacing: '-0.02em' }}>
            ₹{summary.total_paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#15803d', fontWeight: 600 }}>
            <span>✓</span> Net settled to bank accounts
          </div>
        </div>

        {/* 2. AVAILABLE BALANCE */}
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
              Current Balance
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              ⚖️
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
            ₹{summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#2563eb', fontWeight: 600 }}>
            <span>●</span> Ready for next payout cycle
          </div>
        </div>

        {/* 3. DUMP AMOUNT */}
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
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              📦
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#581c87', letterSpacing: '-0.02em' }}>
            ₹{summary.dump_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#7e22ce', fontWeight: 600 }}>
            <span>🔒</span> Retained escrow hold & dump buffer
          </div>
        </div>

        {/* 4. TOTAL TDS DEDUCTIONS */}
        <div
          className="stat-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)',
            border: '1px solid #fecdd3',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TDS Withheld (194H)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              📄
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#881337', letterSpacing: '-0.02em' }}>
            ₹{summary.total_tds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#be123c', fontWeight: 600 }}>
            <span>🏛️</span> 5% Statutory Tax Deducted
          </div>
        </div>

        {/* 5. SETTLEMENT SUCCESS RATE */}
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
              Success Rate
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e5eac3', color: '#505726', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              ⚡
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#323717', letterSpacing: '-0.02em' }}>
            {summary.settlement_success_rate || 98.6}%
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#505726', fontWeight: 600 }}>
            <span>📈</span> Instant clearance & zero failure
          </div>
        </div>
      </div>

      {/* Analytics Visual Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Monthly Payout Trend Visual Bars */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Monthly Settlement Trend (2026)
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Paid volume vs balance vs dump amount
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, border: '1px solid #bbf7d0' }}>
              ↑ Growing Trend
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
            {monthlyTrend.map((item, idx) => {
              const paidPercent = Math.min((item.paid / maxMonthlyPaid) * 100, 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{item.month}</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>
                      ₹{item.paid.toLocaleString('en-IN')} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({item.count} payouts)</span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div
                      style={{
                        width: `${paidPercent}%`,
                        background: 'linear-gradient(90deg, #505726 0%, #16a34a 100%)',
                        borderRadius: '5px',
                        transition: 'width 0.5s ease',
                      }}
                      title={`Paid: ₹${item.paid}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Mode & Status Distribution Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Payment Method Distribution */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
              Disbursal Method Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {methodDistribution.map((m, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{m.method}</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>
                      ₹{m.amount.toLocaleString('en-IN')} ({m.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${m.percentage}%`, background: m.color, height: '100%', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
              Settlement Health & Status
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {statusDistribution.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: '1 1 120px',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.status}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, marginTop: '0.2rem' }}>
                    {s.percentage}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.1rem' }}>
                    ₹{s.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Master Settlement Statement Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        {/* Table Header & Controls */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Reconciled Period Statements & Tax Ledger
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Periodic breakdown of gross earnings, total paid, pending balance, dump reserves, and TDS deductions.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search statement period..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.4rem 0.65rem 0.4rem 1.8rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  width: '200px',
                }}
              />
              <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#94a3b8' }}>
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Statement Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '0.75rem 1rem' }}>Statement Period</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Gross Volume</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Paid</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Balance Settled</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Dump Amount</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>TDS Withheld (5%)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Payouts</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    Loading settlement statement reports...
                  </td>
                </tr>
              ) : statementRows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No statement periods found matching query.
                  </td>
                </tr>
              ) : (
                statementRows.map((r, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfdfa')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    {/* Period */}
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      📅 {r.period}
                    </td>

                    {/* Gross */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                      ₹{r.grossVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Total Paid */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#15803d', fontSize: '0.88rem' }}>
                      ₹{r.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Balance */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#1e40af' }}>
                      ₹{r.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Dump Amount */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #e9d5ff' }}>
                        ₹{r.dumpAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* TDS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                      -₹{r.tdsDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Count */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
                        {r.payoutCount}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: r.status === 'Active Cycle' ? '#eff6ff' : '#dcfce7',
                          color: r.status === 'Active Cycle' ? '#1d4ed8' : '#15803d',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          border: r.status === 'Active Cycle' ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                        }}
                      >
                        ● {r.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedStatement(r)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        📄 Statement
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statement Detail Modal */}
      {selectedStatement && (
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
          onClick={() => setSelectedStatement(null)}
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
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#a3e635', fontWeight: 800, textTransform: 'uppercase' }}>
                  🏛️ Periodic Tax & Reconciliation Statement
                </div>
                <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  {selectedStatement.period}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStatement(null)}
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

            <div style={{ padding: '1.5rem' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>Gross Settlement Volume</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700 }}>
                        ₹{selectedStatement.grossVolume.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#15803d', fontWeight: 700 }}>Total Paid Volume (Disbursed)</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#15803d' }}>
                        ₹{selectedStatement.totalPaid.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#eff6ff' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#1d4ed8' }}>Current Period Balance</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                        ₹{selectedStatement.balance.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#7e22ce' }}>Dump / Escrow Amount</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#7e22ce' }}>
                        ₹{selectedStatement.dumpAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff1f2' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#be123c' }}>TDS Deductions (5% u/s 194H)</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#e11d48' }}>
                        -₹{selectedStatement.tdsDeducted.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>Disbursed Payout Transactions Count</td>
                      <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 800 }}>
                        {selectedStatement.payoutCount} transactions
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🖨️ Print Statement
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatement(null)}
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

export default EntityPayoutReportsPage;
