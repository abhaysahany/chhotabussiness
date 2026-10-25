import React, { useState, useEffect, useMemo } from 'react';
import { getUserBusinessReports } from '../../api/userBusinessReportsService';
import { formatINR, formatNumberIN } from '../../utils/formatters';

function RevenueAnalyticsPage({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('all');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserBusinessReports({
        user_code: user?.user_code,
      });
      if (res && res.status === 'success') {
        setReportData(res);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching database revenue analytics:', err);
      setError('Unable to load database revenue records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const summary = reportData?.summary || {
    totalGrossSales: 0,
    totalReceivedPayment: 0,
    totalBalancePayment: 0,
    totalDumpPayment: 0,
    totalSalesCount: 0,
    completedSalesCount: 0,
    partialSalesCount: 0,
    averageDealSize: 0,
  };

  const categoryBreakdown = reportData?.categoryBreakdown || [];

  const filteredRevenues = useMemo(() => {
    return categoryBreakdown.filter(
      (d) =>
        selectedDomain === 'all' ||
        d.category.toLowerCase().includes(selectedDomain.toLowerCase())
    );
  }, [categoryBreakdown, selectedDomain]);

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 50%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          color: '#fff',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px -5px rgba(79, 70, 229, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span
              style={{
                background: 'rgba(255,255,255,0.12)',
                padding: '0.25rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#c7d2fe',
                display: 'inline-block',
                marginBottom: '0.75rem',
              }}
            >
              📈 Database Revenue Streams & Category Growth Report
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#fff' }}>
              Revenue Analytics Report
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.925rem', margin: 0 }}>
              Category-wise gross revenue distribution, realized received payments, pending balance due, and dump payments.
            </p>
          </div>
          <button
            onClick={fetchReports}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '0.65rem 1.15rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>🔄</span> Refresh Database Data
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Gross Revenue */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #4f46e5' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Gross Revenue
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>
            {formatINR(summary.totalGrossSales)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: '700' }}>
            Across {categoryBreakdown.length} Categories
          </div>
        </div>

        {/* Received Payment */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Received Payment
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d', margin: '0.3rem 0' }}>
            {formatINR(summary.totalReceivedPayment)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>
            {summary.totalGrossSales > 0 ? `${Math.round((summary.totalReceivedPayment / summary.totalGrossSales) * 100)}% Realization Rate` : '0% Realization'}
          </div>
        </div>

        {/* Balance Payment */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Balance Payment (Receivables)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b45309', margin: '0.3rem 0' }}>
            {formatINR(summary.totalBalancePayment)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: '700' }}>
            Pending from active deals
          </div>
        </div>

        {/* Dump / Settled Payment */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
            Dump / Completed Value
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#7c3aed', margin: '0.3rem 0' }}>
            {formatINR(summary.totalDumpPayment)}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: '700' }}>
            {summary.completedSalesCount} Completed Clearances
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#fff',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Category-Wise Revenue Streams
        </h3>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          style={{ padding: '0.6rem 0.95rem', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
        >
          <option value="all">All Categories</option>
          {categoryBreakdown.map((cat) => (
            <option key={cat.id} value={cat.category.toLowerCase()}>
              {cat.category}
            </option>
          ))}
        </select>
      </div>

      {/* Revenue Grid Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b', fontWeight: '700' }}>
          Loading category revenue data from database...
        </div>
      ) : filteredRevenues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
            No Category Revenue Records
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Category metrics will be generated dynamically as entities make sales.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {filteredRevenues.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: '#fff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                borderTop: `4px solid ${cat.color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                    {cat.category}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {cat.ordersCount} Orders / Deals Completed
                  </div>
                </div>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                  }}
                >
                  {cat.share}% Share
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                {formatINR(cat.grossRevenue)}
              </div>

              {/* Received vs Balance Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>RECEIVED PAYMENT</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#15803d', marginTop: '0.1rem' }}>{formatINR(cat.receivedPayment)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>BALANCE DUE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: cat.balancePayment > 0 ? '#b45309' : '#64748b', marginTop: '0.1rem' }}>{formatINR(cat.balancePayment)}</div>
                </div>
              </div>

              {/* Progress track */}
              <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, cat.share || 100)}%`,
                    height: '100%',
                    background: cat.color,
                    borderRadius: '4px',
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RevenueAnalyticsPage;
