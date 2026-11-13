import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntityCancelledOrders } from '../api/entityService';

function EntityCancelledOrders() {
  const navigate = useNavigate();
  const currentEntity = JSON.parse(localStorage.getItem('entity_user') || 'null');
  const entityName =
    currentEntity?.entity_details?.business_name ||
    currentEntity?.name ||
    'Partner Account';
  const entityId =
    currentEntity?.entity_details?.entity_id ||
    currentEntity?.id ||
    null;

  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const loadCancelledOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getEntityCancelledOrders({
        entity: entityName,
        entity_id: entityId,
      });

      // Filter to guarantee only cancelled orders are stored
      const onlyCancelled = (records || []).filter(
        (o) => (o.approval_status ?? o.approvalStatus ?? '').toLowerCase() === 'cancelled'
      );
      setCancelledOrders(onlyCancelled);
    } catch (err) {
      console.error('Error fetching cancelled orders:', err);
      setError(err?.message || 'Failed to load cancelled orders.');
      setCancelledOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCancelledOrders();
  }, [entityName, entityId]);

  // Filtered List
  const filteredOrders = useMemo(() => {
    return cancelledOrders.filter((o) => {
      const query = searchQuery.trim().toLowerCase();
      const invoice = (o.invoice_number || o.invoiceNumber || o.id || '').toString().toLowerCase();
      const customer = (o.customer_name || o.customerName || o.customer || '').toString().toLowerCase();
      const memberId = (o.customer_user_code || o.customerUserCode || o.sponsor || '').toString().toLowerCase();
      const item = (o.item || '').toString().toLowerCase();

      return !query ||
        invoice.includes(query) ||
        customer.includes(query) ||
        memberId.includes(query) ||
        item.includes(query);
    });
  }, [cancelledOrders, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Summary Metrics
  const totalCount = cancelledOrders.length;
  const totalGross = useMemo(() => {
    return cancelledOrders.reduce((acc, curr) => acc + (Number(curr.gross_amount ?? curr.grossAmount) || 0), 0);
  }, [cancelledOrders]);

  const totalAdvance = useMemo(() => {
    return cancelledOrders.reduce((acc, curr) => acc + (Number(curr.advance_payment ?? curr.advancePayment) || 0), 0);
  }, [cancelledOrders]);

  const totalBalance = useMemo(() => {
    return cancelledOrders.reduce((acc, curr) => acc + (Number(curr.balance_due ?? curr.balanceDue) || 0), 0);
  }, [cancelledOrders]);

  return (
    <div className="page-container" style={{ width: '100%', padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        className="page-subheader"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              Cancelled Orders
            </h1>
            <span
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                border: '1px solid #fecaca',
              }}
            >
              {totalCount} Cancelled
            </span>
          </div>
          <p className="page-description" style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            View orders cancelled by Admin and review the official reason for cancellation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={loadCancelledOrders}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.825rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/entity/orders')}
            style={{
              padding: '0.5rem 1.15rem',
              background: 'linear-gradient(135deg, #636B2F 0%, #505726 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(99, 107, 47, 0.25)',
            }}
          >
            ← Back to Active Orders
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="content-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            CANCELLED ORDERS COUNT
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#dc2626', marginTop: '0.35rem' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            Discontinued project contracts
          </div>
        </div>

        <div
          className="content-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            TOTAL CANCELLED VALUE
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            {formatCurrency(totalGross)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            Gross contract value cancelled
          </div>
        </div>

        <div
          className="content-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            RECORDED ADVANCE PAYMENTS
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: totalAdvance > 0 ? '#b45309' : '#64748b', marginTop: '0.35rem' }}>
            {formatCurrency(totalAdvance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>
            {totalAdvance > 0 ? 'Requires offline settlement' : 'No advance collected'}
          </div>
        </div>

        <div
          className="content-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
            VOIDED PROJECT BALANCE
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#64748b', marginTop: '0.35rem' }}>
            {formatCurrency(totalBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
            Balances no longer collectable
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="content-card"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search cancelled orders by Invoice #, Customer, Member ID, or Offering..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              color: '#0f172a',
            }}
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button
            type="button"
            onClick={loadCancelledOrders}
            style={{
              padding: '0.4rem 0.75rem',
              background: '#991b1b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Cancelled Orders Table */}
      <div
        className="content-card"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>INVOICE / ID</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>CANCELLED DATE</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>CUSTOMER</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>MEMBER ID</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>OFFERING</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>PROJECT AMOUNT</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>AMOUNT RECEIVED</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>CANCELLATION REASON</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 0.75rem', borderColor: '#636B2F transparent transparent transparent' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading cancelled orders...</div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      {searchQuery ? 'No Matching Cancelled Orders' : 'No Cancelled Orders'}
                    </div>
                    <p style={{ margin: '0.35rem auto 0', color: '#64748b', fontSize: '0.85rem', maxWidth: '440px' }}>
                      {searchQuery
                        ? 'Try adjusting your search query.'
                        : 'You do not have any cancelled orders. All your orders are either pending Admin review or actively confirmed.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const invoiceNo = order.invoice_number || order.invoiceNumber || `ORD-${order.id}`;
                  const gross = Number(order.gross_amount ?? order.grossAmount) || 0;
                  const advance = Number(order.advance_payment ?? order.advancePayment) || 0;
                  const cancelDate = order.admin_cancelled_at
                    ? new Date(order.admin_cancelled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : (order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-IN') : 'N/A');
                  const reason = order.cancellation_reason || order.cancellationReason || 'No reason specified';

                  return (
                    <tr
                      key={order.id || invoiceNo}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        <div>{invoiceNo}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>ID: #{order.id}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {cancelDate}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.customer_name || order.customerName || 'N/A'}</div>
                        {(order.customer_email || order.customerEmail) && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{order.customer_email || order.customerEmail}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#2563eb', fontWeight: 600, fontFamily: 'monospace' }}>
                        {order.customer_user_code || order.customerUserCode || order.sponsor || 'N/A'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: '#334155' }}>
                        <div style={{ fontWeight: 600 }}>{order.item || 'N/A'}</div>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'capitalize' }}>
                          {order.item_type || 'service'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(gross)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 700, color: advance > 0 ? '#b45309' : '#64748b' }}>
                        {formatCurrency(advance)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', maxWidth: '280px' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#991b1b',
                            background: '#fee2e2',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.35,
                          }}
                          title={reason}
                        >
                          {reason}
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            border: '1px solid #fecaca',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✕ Cancelled
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDetails(order)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View Details
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
        {filteredOrders.length > pageSize && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ color: '#64748b' }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} cancelled orders
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Previous
              </button>
              <span style={{ padding: '0.35rem 0.75rem', color: '#475569', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancelled Order Details Modal */}
      {selectedOrderForDetails && (
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedOrderForDetails(null);
            }
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fee2e2', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#991b1b' }}>
                    Cancelled Order #{selectedOrderForDetails.invoice_number || selectedOrderForDetails.invoiceNumber}
                  </h2>
                  <span
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                    }}
                  >
                    Cancelled
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                  This order was officially cancelled by Administrator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Official Cancellation Reason Box */}
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '1.15rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.725rem', color: '#991b1b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ADMIN CANCELLATION REASON
              </div>
              <p
                style={{
                  margin: '0.4rem 0 0.5rem 0',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#7f1d1d',
                  lineHeight: 1.45,
                }}
              >
                "{selectedOrderForDetails.cancellation_reason || selectedOrderForDetails.cancellationReason || 'No specific reason entered by Admin.'}"
              </p>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', opacity: 0.85 }}>
                Cancelled On:{' '}
                {selectedOrderForDetails.admin_cancelled_at
                  ? new Date(selectedOrderForDetails.admin_cancelled_at).toLocaleString('en-IN')
                  : 'N/A'}
              </div>
            </div>

            {/* Advance Payment Notice (Prompt Section 6 requirement) */}
            {Number(selectedOrderForDetails.advance_payment ?? selectedOrderForDetails.advancePayment ?? 0) > 0 && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>⚠️</div>
                <div style={{ fontSize: '0.825rem', color: '#92400e', lineHeight: 1.45 }}>
                  <strong>Advance Payment Preserved:</strong> An advance payment of{' '}
                  <strong>{formatCurrency(selectedOrderForDetails.advance_payment ?? selectedOrderForDetails.advancePayment)}</strong> was recorded before cancellation.
                  The payment receipt is preserved in the system for auditing. Please contact the relevant Admin for offline settlement/refund arrangements.
                </div>
              </div>
            )}

            {/* Contract Specifications Grid */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.15rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.85rem',
                fontSize: '0.825rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>CUSTOMER NAME</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                  {selectedOrderForDetails.customer_name || selectedOrderForDetails.customerName}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>MEMBER ID</span>
                <div style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                  {selectedOrderForDetails.customer_user_code || selectedOrderForDetails.customerUserCode || selectedOrderForDetails.sponsor || 'N/A'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>OFFERING / ITEM</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                  {selectedOrderForDetails.item} ({selectedOrderForDetails.item_type || 'service'})
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>ORDER CREATION DATE</span>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.15rem' }}>
                  {selectedOrderForDetails.date || (selectedOrderForDetails.created_at ? new Date(selectedOrderForDetails.created_at).toLocaleDateString('en-IN') : 'N/A')}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>TOTAL PROJECT AMOUNT</span>
                <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                  {formatCurrency(selectedOrderForDetails.gross_amount ?? selectedOrderForDetails.grossAmount)}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>ADVANCE COLLECTED</span>
                <div style={{ fontWeight: 800, color: '#16a34a', marginTop: '0.15rem' }}>
                  {formatCurrency(selectedOrderForDetails.advance_payment ?? selectedOrderForDetails.advancePayment)}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>PAYMENT METHOD & REF</span>
                <div style={{ color: '#334155', marginTop: '0.15rem' }}>
                  {selectedOrderForDetails.payment_method || 'Online'} {selectedOrderForDetails.reference_no ? `(Ref: ${selectedOrderForDetails.reference_no})` : ''}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700 }}>VOIDED BALANCE DUE</span>
                <div style={{ fontWeight: 700, color: '#64748b', marginTop: '0.15rem' }}>
                  {formatCurrency(selectedOrderForDetails.balance_due ?? selectedOrderForDetails.balanceDue)}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f1f5f9',
                  color: '#334155',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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

export default EntityCancelledOrders;
