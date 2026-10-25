import React, { useState } from 'react';

function BusinessSalesReportPage({ user, initialTab = 'reports-sales' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [dateRange, setDateRange] = useState('month'); // 'today' | 'week' | 'month' | 'quarter' | 'year'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sample Sales Report Data
  const salesTransactions = [
    { id: 'ORD-9821', customer: 'Apex Advisory Pvt Ltd', service: 'GST Registration & Filing', category: 'Tax & Compliance', amount: 15400, commission: 2310, status: 'Completed', date: '2026-08-16' },
    { id: 'ORD-9822', customer: 'Rohan Sen (Freelancer)', service: 'Trademark Registration', category: 'Legal Services', amount: 8500, commission: 1275, status: 'Completed', date: '2026-08-15' },
    { id: 'ORD-9823', customer: 'BlueShift Technologies', service: 'Private Limited Incorporation', category: 'Corporate Setup', amount: 24000, commission: 3600, status: 'Completed', date: '2026-08-14' },
    { id: 'ORD-9824', customer: 'Priya Sharma (CA)', service: 'Annual ROC Compliance', category: 'Tax & Compliance', amount: 12500, commission: 1875, status: 'Processing', date: '2026-08-14' },
    { id: 'ORD-9825', customer: 'GreenTech Innovations', service: 'ISO 9001 Certification', category: 'Quality & Audit', amount: 18000, commission: 2700, status: 'Completed', date: '2026-08-12' },
    { id: 'ORD-9826', customer: 'DesignCraft Studio', service: 'MSME Udyam Registration', category: 'Government Schemes', amount: 4500, commission: 675, status: 'Completed', date: '2026-08-10' },
  ];

  const categoryPerformance = [
    { category: 'Tax & Compliance', salesCount: 54, totalRevenue: 245000, growth: '+22.4%', color: '#6366f1' },
    { category: 'Corporate Setup', salesCount: 38, totalRevenue: 182000, growth: '+15.8%', color: '#0284c7' },
    { category: 'Legal Services', salesCount: 29, totalRevenue: 98500, growth: '+12.1%', color: '#7c3aed' },
    { category: 'Quality & Audit', salesCount: 16, totalRevenue: 64000, growth: '+8.5%', color: '#10b981' },
    { category: 'Government Schemes', salesCount: 42, totalRevenue: 52000, growth: '+31.0%', color: '#f59e0b' },
  ];

  const teamPerformance = [
    { rank: 1, name: 'Sanjay Kumar', level: 'Diamond Executive', directSales: 18, teamSales: 64, volume: 184000, commissionEarned: 27600 },
    { rank: 2, name: 'Neha Gupta', level: 'Platinum Director', directSales: 14, teamSales: 48, volume: 142000, commissionEarned: 21300 },
    { rank: 3, name: 'Vikram Mehta', level: 'Gold Leader', directSales: 11, teamSales: 32, volume: 96000, commissionEarned: 14400 },
    { rank: 4, name: 'Ananya Roy', level: 'Silver Specialist', directSales: 9, teamSales: 22, volume: 68000, commissionEarned: 10200 },
  ];

  const handleExport = (format) => {
    setExportSuccessMsg(`Report exported successfully as ${format.toUpperCase()}! Download starting...`);
    setTimeout(() => {
      setExportSuccessMsg('');
      setShowExportModal(false);
    }, 3000);
  };

  const filteredTransactions = salesTransactions.filter((item) => {
    const matchesSearch = !searchTerm ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCat = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCat;
  });

  const totalRevenueSum = salesTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCommissionSum = salesTransactions.reduce((acc, curr) => acc + curr.commission, 0);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 50%, #1e1b4b 100%)',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', padding: '0.25rem 0.85rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', color: '#bae6fd', marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
              <span>📊 Sales Performance & Revenue Analytics Reports</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Business Sales Performance Reports
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', maxWidth: '650px', margin: 0, lineHeight: '1.5' }}>
              Analyze business order conversions, commission payouts, category revenue streams, and team sales volume.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
              }}
            >
              <option value="today" style={{ background: '#0f172a' }}>📅 Today</option>
              <option value="week" style={{ background: '#0f172a' }}>📅 Last 7 Days</option>
              <option value="month" style={{ background: '#0f172a' }}>📅 This Month</option>
              <option value="quarter" style={{ background: '#0f172a' }}>📅 This Quarter</option>
              <option value="year" style={{ background: '#0f172a' }}>📅 Year to Date</option>
            </select>

            <button
              onClick={() => setShowExportModal(true)}
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>📥 Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales Revenue</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>💰</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>₹{totalRevenueSum.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700', marginTop: '0.2rem' }}>▲ +18.4% vs last period</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #6366f1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders Completed</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>📦</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>{salesTransactions.length} Orders</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>Avg Order: ₹{Math.round(totalRevenueSum / salesTransactions.length).toLocaleString()}</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commission Earned</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>🤝</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>₹{totalCommissionSum.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700', marginTop: '0.2rem' }}>15% Commission Rate</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #7c3aed', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Category</span>
            <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>🏆</span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>Tax & Compliance</div>
          <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: '700', marginTop: '0.2rem' }}>₹2,45,000 Volume</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('reports-sales')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeTab === 'reports-sales' || activeTab === 'sales-performance' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'reports-sales' || activeTab === 'sales-performance' ? '3px solid #0284c7' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          📊 Sales Performance
        </button>
        <button
          onClick={() => setActiveTab('reports-revenue')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeTab === 'reports-revenue' || activeTab === 'revenue-analytics' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'reports-revenue' || activeTab === 'revenue-analytics' ? '3px solid #0284c7' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          📈 Revenue Analytics
        </button>
        <button
          onClick={() => setActiveTab('reports-mlm')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeTab === 'reports-mlm' || activeTab === 'team-performance' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'reports-mlm' || activeTab === 'team-performance' ? '3px solid #0284c7' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          🤝 Network Earnings & Comm

        </button>
        <button
          onClick={() => setActiveTab('reports-tax')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: '800',
            cursor: 'pointer',
            color: activeTab === 'reports-tax' || activeTab === 'tax-audit' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'reports-tax' || activeTab === 'tax-audit' ? '3px solid #0284c7' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          📜 Tax & Audit Ledger
        </button>
      </div>

      {/* TAB 1: SALES TRANSACTIONS & ORDERS */}
      {activeTab === 'sales-performance' && (
        <div>
          {/* Controls Bar */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search order ID, customer name or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.85rem 0.55rem 2.4rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontWeight: '600', color: '#334155' }}
              >
                <option value="all">All Order Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.835rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontWeight: '600', color: '#334155' }}
              >
                <option value="all">All Service Categories</option>
                <option value="tax & compliance">Tax & Compliance</option>
                <option value="legal services">Legal Services</option>
                <option value="corporate setup">Corporate Setup</option>
                <option value="quality & audit">Quality & Audit</option>
                <option value="government schemes">Government Schemes</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '1.25rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.835rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Customer Entity</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Business Service</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Sales Revenue</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Commission</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <code style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#0284c7' }}>
                        {tx.id}
                      </code>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0f172a' }}>{tx.customer}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155', fontWeight: '600' }}>{tx.service}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                        {tx.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0f172a' }}>₹{tx.amount.toLocaleString()}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#059669' }}>+₹{tx.commission.toLocaleString()}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ background: tx.status === 'Completed' ? '#dcfce7' : '#fef3c7', color: tx.status === 'Completed' ? '#15803d' : '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                        {tx.status === 'Completed' ? '✓ Completed' : '⌛ Processing'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: '500' }}>{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY REVENUE BREAKDOWN */}
      {activeTab === 'revenue-analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {categoryPerformance.map((cat, idx) => (
            <div key={idx} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem', borderTop: `4px solid ${cat.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.2rem 0' }}>{cat.category}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cat.salesCount} Orders Completed</div>
                </div>
                <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
                  {cat.growth}
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
                ₹{cat.totalRevenue.toLocaleString()}
              </div>

              {/* Progress bar */}
              <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (cat.totalRevenue / 250000) * 100)}%`, height: '100%', background: cat.color, borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TEAM & AFFILIATE VOLUME */}
      {activeTab === 'team-performance' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '1.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.835rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Team Leader</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Achievement Level</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Direct Sales</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Team Sales</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Total Volume</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((member) => (
                <tr key={member.rank} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0284c7' }}>#{member.rank}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0f172a' }}>{member.name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                      {member.level}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#334155' }}>{member.directSales} Orders</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#334155' }}>{member.teamSales} Orders</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0f172a' }}>₹{member.volume.toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '800', color: '#059669' }}>₹{member.commissionEarned.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: TAX & AUDIT LEDGER */}
      {(activeTab === 'reports-tax' || activeTab === 'tax-audit') && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '1.25rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Tax Deduction & Compliance Voucher Ledger (Form 26AS)</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>TDS deductions calculated @ 5% u/s 194H for commission income</p>
            </div>
            <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700', border: '1px solid #86efac' }}>
              ✓ Compliance Status: Verified Compliant
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.835rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Voucher Ref</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Tax Quarter</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Gross Payout</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>TDS Deducted (5%)</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Net Credit</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Certificate Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ref: 'TDS-2026-Q1-001', quarter: 'Q1 FY 2026-27', gross: 42500, tds: 2125, net: 40375, status: 'Form 16A Issued' },
                { ref: 'TDS-2026-Q1-002', quarter: 'Q1 FY 2026-27', gross: 31000, tds: 1550, net: 29450, status: 'Form 16A Issued' },
                { ref: 'TDS-2026-Q2-001', quarter: 'Q2 FY 2026-27', gross: 58000, tds: 2900, net: 55100, status: 'Audited & Filed' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <code style={{ background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#6366f1' }}>
                      {row.ref}
                    </code>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0f172a' }}>{row.quarter}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#334155' }}>₹{row.gross.toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#dc2626' }}>-₹{row.tds.toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#059669' }}>₹{row.net.toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.75rem' }}>
                      ✓ {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EXPORT REPORT MODAL */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>Export Business Sales Report</h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {exportSuccessMsg ? (
                <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #86efac', padding: '1rem', borderRadius: '10px', fontWeight: '700', textAlign: 'center' }}>
                  ✓ {exportSuccessMsg}
                </div>
              ) : (
                <div>
                  <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: 0, marginBottom: '1.25rem' }}>
                    Select your preferred format to export the sales performance and revenue audit summary.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <button
                      onClick={() => handleExport('pdf')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: '700', color: '#0f172a' }}
                    >
                      <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.35rem' }}>📄</span>
                      PDF Report Document
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: '700', color: '#0f172a' }}
                    >
                      <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.35rem' }}>📊</span>
                      Excel / CSV Spreadsheet
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button onClick={() => setShowExportModal(false)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessSalesReportPage;
