import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntitySales } from '../api/entityService';

function EntitySales() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Skyline Technologies Pvt Ltd';
  const entityId =
    currentEntity?.entity_details?.entity_id ||
    currentEntity?.id ||
    null;

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'partial' | 'completed'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today'
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    try {
      const records = await getEntitySales({
        entity: entityName,
        entity_id: entityId,
      });
      setSalesList(records || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [entityName, entityId]);

  // Filter Sales
  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      const matchSearch =
        (s.invoiceNumber || s.invoice_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customer || s.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.item || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return matchSearch && matchStatus && s.date === todayStr;
      }
      return matchSearch && matchStatus;
    });
  }, [salesList, searchQuery, statusFilter, dateFilter]);

  // Financial Totals
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

  const totalNetEarnings = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (Number(curr.netEntityPayout ?? curr.net_entity_payout) || 0), 0);
  }, [filteredSales]);

  return (
    <div className="page-container" style={{ width: '100%' }}>
      {/* Header Banner */}
      <div className="page-subheader" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            Sales Reports & Invoices
          </h1>
          <p className="page-description" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            View database-backed transactions, admin commission cuts on collected amounts, and customer tax invoices for <strong>{entityName}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={loadSales}
            style={{
              padding: '0.65rem 1rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/entity/sales/create')}
            style={{
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, #636B2F 0%, #505726 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(99, 107, 47, 0.25)',
            }}
          >
            <span>+</span> Record New Sale
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>TOTAL PROJECT VALUE</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ₹{totalGross.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            {filteredSales.length} Total Projects
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>AMOUNT COLLECTED</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb', marginTop: '0.35rem' }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Advance & Balance Payments
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>OUTSTANDING BALANCE</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: totalBalanceDue > 0 ? '#d97706' : '#16a34a', marginTop: '0.35rem' }}>
            ₹{totalBalanceDue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            To be received in Payments tab
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>ADMIN COMMISSION RELEASED</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            ₹{totalAdminCommission.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Cut on Collected Funds
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>NET REALIZED EARNINGS</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#636B2F', marginTop: '0.35rem' }}>
            ₹{totalNetEarnings.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Net Entity Retained
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="content-card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by Invoice #, Customer, or Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: statusFilter === 'all' ? '1px solid #636B2F' : '1px solid #cbd5e1',
              background: statusFilter === 'all' ? '#636B2F' : '#ffffff',
              color: statusFilter === 'all' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All Status
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('partial')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: statusFilter === 'partial' ? '1px solid #d97706' : '1px solid #cbd5e1',
              background: statusFilter === 'partial' ? '#d97706' : '#ffffff',
              color: statusFilter === 'partial' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⏳ Partial / Balance Due
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: statusFilter === 'completed' ? '1px solid #16a34a' : '1px solid #cbd5e1',
              background: statusFilter === 'completed' ? '#16a34a' : '#ffffff',
              color: statusFilter === 'completed' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✓ Fully Paid
          </button>
          <button
            type="button"
            onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: dateFilter === 'today' ? '1px solid #636B2F' : '1px solid #cbd5e1',
              background: dateFilter === 'today' ? '#636B2F' : '#ffffff',
              color: dateFilter === 'today' ? '#ffffff' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {dateFilter === 'today' ? '✓ Today Only' : 'Today'}
          </button>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="content-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Invoice #</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Offering</th>
                <th style={{ padding: '0.85rem 1rem' }}>Project Value</th>
                <th style={{ padding: '0.85rem 1rem' }}>Collected</th>
                <th style={{ padding: '0.85rem 1rem' }}>Balance Due</th>
                <th style={{ padding: '0.85rem 1rem' }}>Admin Cut</th>
                <th style={{ padding: '0.85rem 1rem' }}>Net Realized</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto', width: '24px', height: '24px' }}></div>
                    Loading database sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No sales records found. Click "+ Record New Sale" to create your first invoice.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const invoiceNo = sale.invoiceNumber || sale.invoice_number || sale.id;
                  const gross = Number(sale.grossAmount ?? sale.gross_amount ?? 0);
                  const collected = Number(sale.advancePayment ?? sale.advance_payment ?? 0);
                  const balance = Number(sale.balanceDue ?? sale.balance_due ?? Math.max(0, gross - collected));
                  const adminCut = Number(sale.adminCommissionCut ?? sale.admin_commission_cut ?? 0);
                  const netRealized = Number(sale.netEntityPayout ?? sale.net_entity_payout ?? 0);
                  const isPartial = balance > 0;

                  return (
                    <tr key={sale.id || invoiceNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        {invoiceNo}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {sale.date}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{sale.customerName || sale.customer_name || sale.customer}</div>
                        {(sale.customerEmail || sale.customer_email) && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sale.customerEmail || sale.customer_email}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                        {sale.item}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        ₹{gross.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#2563eb' }}>
                        ₹{collected.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: isPartial ? '#d97706' : '#16a34a' }}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#dc2626' }}>
                        -₹{adminCut.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#16a34a' }}>
                        ₹{netRealized.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: isPartial ? '#fef3c7' : '#dcfce7',
                            color: isPartial ? '#92400e' : '#15803d',
                            border: isPartial ? '1px solid #fde68a' : '1px solid #bbf7d0',
                          }}
                        >
                          {isPartial ? '⏳ Partial' : '✓ Completed'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(sale)}
                            style={{
                              padding: '0.35rem 0.6rem',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            📄 Invoice
                          </button>
                          {isPartial && (
                            <button
                              type="button"
                              onClick={() => navigate('/entity/payments')}
                              style={{
                                padding: '0.35rem 0.6rem',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              💵 Collect
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

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
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
              maxWidth: '600px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  CUSTOMER TAX INVOICE
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: <strong>{selectedInvoice.invoiceNumber || selectedInvoice.invoice_number || selectedInvoice.id}</strong> | Date: <strong>{selectedInvoice.date}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Seller & Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <div>
                <strong style={{ color: '#475569', display: 'block', marginBottom: '0.2rem' }}>SELLER / ENTITY:</strong>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.entityName || selectedInvoice.entity_name || entityName}</div>
                <div style={{ color: '#64748b' }}>Authorized Partner Portal</div>
              </div>
              <div>
                <strong style={{ color: '#475569', display: 'block', marginBottom: '0.2rem' }}>BILLED TO:</strong>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedInvoice.customerName || selectedInvoice.customer_name || selectedInvoice.customer}</div>
                <div style={{ color: '#64748b' }}>{selectedInvoice.customerEmail || selectedInvoice.customer_email || 'Verified Customer'}</div>
              </div>
            </div>

            {/* Item Breakdown */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span><strong>Item:</strong> {selectedInvoice.item}</span>
                <span>₹{Number(selectedInvoice.grossAmount ?? selectedInvoice.gross_amount ?? 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb', marginBottom: '0.4rem', fontWeight: 600 }}>
                <span>Amount Collected:</span>
                <span>₹{Number(selectedInvoice.advancePayment ?? selectedInvoice.advance_payment ?? 0).toLocaleString()}</span>
              </div>
              {Number(selectedInvoice.balanceDue ?? selectedInvoice.balance_due ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706', marginBottom: '0.4rem', fontWeight: 700 }}>
                  <span>Remaining Balance Due:</span>
                  <span>₹{Number(selectedInvoice.balanceDue ?? selectedInvoice.balance_due ?? 0).toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '0.4rem' }}>
                <span>Admin Facilitation Cut ({selectedInvoice.adminCommissionPercent || selectedInvoice.admin_commission_percent || 15}% on collected):</span>
                <span>-₹{Number(selectedInvoice.adminCommissionCut ?? selectedInvoice.admin_commission_cut ?? 0).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#16a34a' }}>
                <span>Net Entity Realized:</span>
                <span>₹{Number(selectedInvoice.netEntityPayout ?? selectedInvoice.net_entity_payout ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '0.55rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                🖨️ Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ padding: '0.55rem 1rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EntitySales;

