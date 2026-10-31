import React, { useState, useEffect, useMemo } from 'react';
import { getUserBusinessReports } from '../../api/userBusinessReportsService';
import { formatINR, formatNumberIN } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';

function SalesReportPage({ user }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      console.error('Error fetching database sales reports:', err);
      setError('Unable to load database sales records.');
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

  const rawSalesList = reportData?.salesList || [];

  const availableCategories = useMemo(() => {
    const cats = new Set(rawSalesList.map((item) => item.category).filter(Boolean));
    return Array.from(cats);
  }, [rawSalesList]);

  const filteredSales = useMemo(() => {
    return rawSalesList.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesStatus && matchesCategory;
    });
  }, [rawSalesList, statusFilter, categoryFilter]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Invoice & Date',
      accessor: 'id',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '800', color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{row.date}</div>
        </div>
      ),
    },
    {
      header: 'Entity & Domain',
      accessor: 'entityName',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#334155' }}>{val}</div>
          <span
            style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '0.2rem',
            }}
          >
            {row.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Service / Package',
      accessor: 'service',
      render: (val) => <span style={{ fontWeight: '600', color: '#0f172a' }}>{val}</span>,
    },
    {
      header: 'Client / Buyer',
      accessor: 'customer',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: '700', color: '#0f172a' }}>{val}</div>
          {row.customerUserCode && (
            <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '700' }}>
              ID: {row.customerUserCode}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Gross Value',
      accessor: 'amount',
      align: 'right',
      render: (val) => <span style={{ fontWeight: '800', color: '#0f172a' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Received Advance',
      accessor: 'advancePayment',
      align: 'right',
      render: (val) => <span style={{ fontWeight: '800', color: '#15803d' }}>{formatINR(val)}</span>,
    },
    {
      header: 'Balance Due',
      accessor: 'balanceDue',
      align: 'right',
      render: (val) => (
        <span style={{ fontWeight: '800', color: val > 0 ? '#b45309' : '#64748b' }}>
          {formatINR(val)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (val) => (
        <span
          style={{
            background: val.toLowerCase() === 'completed' ? '#dcfce7' : '#fef3c7',
            color: val.toLowerCase() === 'completed' ? '#15803d' : '#b45309',
            padding: '0.2rem 0.6rem',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '0.74rem',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      sortable: false,
      align: 'right',
      render: (val, row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          style={{
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px -5px rgba(2, 132, 199, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '0.25rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                color: '#e0f2fe',
                display: 'inline-block',
                marginBottom: '0.75rem',
              }}
            >
              📊 Live Entity Sales & Project Dossier
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.4rem 0', color: '#ffffff' }}>
              Sales Performance Reports
            </h1>
            <p style={{ color: '#bae6fd', fontSize: '0.925rem', margin: 0 }}>
              Live audit of all sales done by entities with received advances, outstanding balance receivables, and dump values.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={fetchReports}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #0284c7' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Gross Sales Done</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0.3rem 0' }}>{formatINR(summary.totalGrossSales)}</div>
          <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700' }}>{summary.totalSalesCount} Project Orders</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Received Advance (Self BV)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#15803d', margin: '0.3rem 0' }}>{formatINR(summary.totalReceivedPayment)}</div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: '700' }}>Realized Advance Volume</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Balance Receivables</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#b45309', margin: '0.3rem 0' }}>{formatINR(summary.totalBalancePayment)}</div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: '700' }}>Active Pending Dues</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Dump Payments</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626', margin: '0.3rem 0' }}>{formatINR(summary.totalDumpPayment)}</div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: '700' }}>Unrealized / Default</div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer', background: '#fff' }}
          >
            <option value="all">All Service Categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', cursor: 'pointer', background: '#fff' }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed (Full)</option>
            <option value="partial">Partial Payment</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredSales}
        defaultPageSize={10}
        searchPlaceholder="Search invoice, client, or service..."
        loading={loading}
      />

      {/* Sale Record Dossier Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', padding: '1.25rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Invoice #{selectedOrder.id}</h3>
                <div style={{ fontSize: '0.8rem', color: '#bae6fd', marginTop: '0.2rem' }}>Entity Sales Record</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700' }}>CREATING ENTITY</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>{selectedOrder.entityName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700' }}>BUYER USER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>{selectedOrder.customer}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700' }}>CATEGORY DOMAIN</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2563eb', marginTop: '0.15rem' }}>{selectedOrder.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700' }}>PAYMENT METHOD</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', marginTop: '0.15rem' }}>{selectedOrder.payMode}</div>
                </div>
              </div>

              {/* Payment Summary */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#64748b' }}>Total Project Value:</span>
                  <strong style={{ color: '#0f172a' }}>{formatINR(selectedOrder.amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#15803d', fontWeight: '700' }}>Received Advance (Self BV):</span>
                  <strong style={{ color: '#15803d' }}>{formatINR(selectedOrder.advancePayment)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                  <span style={{ color: '#b45309', fontWeight: '700' }}>Remaining Balance Due:</span>
                  <strong style={{ color: '#b45309' }}>{formatINR(selectedOrder.balanceDue)}</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReportPage;
