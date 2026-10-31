import React, { useState, useEffect, useMemo } from 'react';
import { getUserBusinessReports } from '../../api/userBusinessReportsService';
import { formatINR } from '../../utils/formatters';
import DataTable from '../common/DataTable';

function PaymentTransactions({ user }) {
  const [salesList, setSalesList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const userCode = user?.user_code || 'CB100001';

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await getUserBusinessReports({ user_code: userCode });
      if (res && res.status === 'success') {
        setSalesList(res.salesList || []);
        setSummary(res.summary || null);
      }
    } catch (err) {
      console.error('Error fetching database payment transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const downloadInvoice = (item) => {
    setToastMessage(`Downloading Tax Invoice ${item.id} PDF...`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const totalPurchasesSum = useMemo(() => {
    return salesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [salesList]);

  // DataTable Column Definitions
  const columns = [
    {
      header: 'Invoice & Date',
      accessor: 'id',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.date}</div>
        </div>
      ),
    },
    {
      header: 'Service / Product',
      accessor: 'service',
      render: (val) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{val}</span>,
    },
    {
      header: 'Creating Entity',
      accessor: 'entityName',
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      header: 'Payment Method',
      accessor: 'payMode',
      render: (val) => <span style={{ color: '#64748b' }}>{val}</span>,
    },
    {
      header: 'Total Amount',
      accessor: 'amount',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(val)}</span>,
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
            padding: '0.2rem 0.55rem',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 800,
          }}
        >
          ✓ {val}
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
          onClick={() => downloadInvoice(row)}
          style={{
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📄 Invoice
        </button>
      ),
    },
  ];

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#0f172a', color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '8px', zIndex: 99999 }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.3rem 0' }}>
          Payment Transactions & Invoices
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Official record of package purchases, entity project sales, invoices, and verified payment receipts with DataTable search and pagination.
        </p>
      </div>

      {/* Transactions Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL TRANSACTIONS VALUE</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0' }}>{formatINR(totalPurchasesSum)}</div>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>{salesList.length} Total Database Records</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>RECEIVED PAYMENTS</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803d', margin: '0.3rem 0' }}>{formatINR(summary?.totalReceivedPayment || 0)}</div>
          <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Realized Advances</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PENDING BALANCE DUE</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', margin: '0.3rem 0' }}>{formatINR(summary?.totalBalancePayment || 0)}</div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Active Balance Receivables</div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={salesList}
        defaultPageSize={10}
        searchPlaceholder="Search transactions by invoice, service, or customer..."
        loading={loading}
      />
    </div>
  );
}

export default PaymentTransactions;
