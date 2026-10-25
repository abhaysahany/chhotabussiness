import React, { useState, useMemo, useEffect } from 'react';
import { getAdminSales } from '../../api/adminSalesService';

function AdminSalesReportsPage() {
  const [salesRecords, setSalesRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'today'
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'partial' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load centralized sales records from MySQL database
  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await getAdminSales();
      setSalesRecords(res?.sales || []);
    } catch (e) {
      console.error('Error reading sales records from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

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
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.advancePayment ?? curr.advance_payment) || 0), 0);
  }, [filteredSales]);

  const totalBalanceDue = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.balanceDue ?? curr.balance_due) || 0), 0);
  }, [filteredSales]);

  const totalAdminCommission = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.adminCommissionCut ?? curr.admin_commission_cut) || 0), 0);
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
            zIndex: 99999,
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
            Commercial Sales & Tax Invoices Reports
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Live database records of all customer projects, products, and services recorded by verified entities across the platform.
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
            🔄 Refresh Sales
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL PROJECT VALUE</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{totalGross.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {filteredSales.length} Total Sales Invoices
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL FUNDS COLLECTED</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Advance & Balance Receipts
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>PENDING CLIENT BALANCES</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: totalBalanceDue > 0 ? '#d97706' : '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalBalanceDue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            To be collected by entities
          </div>
        </div>

        <div className="stat-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL ADMIN FACILITATION CUT</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalAdminCommission.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Realized Platform Revenue
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

      {/* Centralized Sales Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Seller Entity</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer / Buyer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Offering Item</th>
                <th style={{ padding: '0.85rem 1rem' }}>Project Value</th>
                <th style={{ padding: '0.85rem 1rem' }}>Collected</th>
                <th style={{ padding: '0.85rem 1rem' }}>Balance Due</th>
                <th style={{ padding: '0.85rem 1rem' }}>Admin Cut</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading centralized database sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No sales records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const invoiceNo = sale.invoiceNumber || sale.invoice_number || sale.id;
                  const gross = Number(sale.grossAmount ?? sale.gross_amount ?? 0);
                  const collected = Number(sale.advancePayment ?? sale.advance_payment ?? 0);
                  const balance = Number(sale.balanceDue ?? sale.balance_due ?? Math.max(0, gross - collected));
                  const adminCut = Number(sale.adminCommissionCut ?? sale.admin_commission_cut ?? 0);
                  const entityType = sale.entityType || sale.entity_type;
                  const isCompleted = balance <= 0;

                  return (
                    <tr key={sale.id || invoiceNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div>{invoiceNo}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>{sale.date}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{sale.entityName || sale.entity_name}</div>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: entityType === 'freelance' ? '#fdf4ff' : '#f0fdf4',
                            color: entityType === 'freelance' ? '#a21caf' : '#15803d',
                            border: entityType === 'freelance' ? '1px solid #f0abfc' : '1px solid #bbf7d0',
                            marginTop: '0.2rem',
                          }}
                        >
                          {entityType === 'freelance' ? 'Freelancer' : 'Commercial Business'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{sale.customerName || sale.customer_name || sale.customer}</div>
                        {sale.customer_user_code && (
                          <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                            {sale.customer_user_code}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{sale.item}</div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                          {sale.itemType || sale.item_type} ({sale.category || 'General'})
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{gross.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                        ₹{collected.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: balance > 0 ? '#d97706' : '#16a34a' }}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a' }}>
                        +₹{adminCut.toLocaleString()} ({sale.adminCommissionPercent || sale.admin_commission_percent || 15}%)
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isCompleted ? (
                          <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            ✓ Fully Settled
                          </span>
                        ) : (
                          <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            ⏳ Partial (Balance Due)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForView(sale)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          👁️ View Invoice
                        </button>
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
    </div>
  );
}

export default AdminSalesReportsPage;
