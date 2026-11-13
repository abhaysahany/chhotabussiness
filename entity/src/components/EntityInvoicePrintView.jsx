import React from 'react';
import { createPortal } from 'react-dom';
import { useBranding } from '../utils/branding';
import { formatDate, formatDateTime } from '../utils/timezone';
import { computeInvoiceFinancials, formatINRCurrency } from '../utils/invoiceCalculations';

/**
 * Dedicated full-page A4 Portrait print layout for Entity Order Tax Invoices & Payment Receipts.
 * Rendered directly into document.body via a React Portal so @media print hides #root cleanly
 * and prints only this full-width invoice document without modal sizing, backdrop, or navigation chrome.
 */
function EntityInvoicePrintView({ order, selectedPaymentId = null, entityProfile = null, fallbackEntityName = '' }) {
  const { appName, logoUrl } = useBranding();

  if (!order || typeof document === 'undefined') {
    return null;
  }

  const financials = computeInvoiceFinancials(order, selectedPaymentId);
  if (!financials) {
    return null;
  }

  const isPaymentReceipt = financials.mode === 'payment_receipt' && financials.selectedPayment;
  const activePayment = financials.selectedPayment;

  const invoiceNumber = order.invoiceNumber || order.invoice_number || `ORD-${order.id}`;
  const orderDate = formatDate(order.date || order.created_at);
  const approvalStatus = String(order.approval_status ?? order.approvalStatus ?? 'confirmed').toLowerCase();
  const sellerName = order.entityName || order.entity_name || fallbackEntityName || 'Authorized Partner';
  const sellerType = (order.entityType || order.entity_type || 'business') === 'freelance'
    ? 'Freelancer Partner'
    : 'Business Partner';
  const sellerEmail = entityProfile?.email || '';
  const sellerPhone = entityProfile?.phone || entityProfile?.entity_details?.phone || '';

  const customerName = order.customerName || order.customer_name || order.customer || 'Valued Member';
  const memberId = order.customer_user_code || order.customerUserCode || order.sponsor || 'N/A';
  const customerEmail = order.customerEmail || order.customer_email || '';
  const customerPhone = order.customerPhone || order.customer_phone || '';

  const itemName = order.item || 'Commercial Offering';
  const itemCategory = order.category || 'General';
  const itemType = order.item_type || order.itemType || 'service';
  const unitPrice = Number(order.unitPrice ?? order.unit_price ?? 0);
  const quantity = Number(order.quantity ?? 1);

  const sortedPayments = [...financials.eligiblePayments].sort((a, b) => Number(a.id) - Number(b.id));

  const statusBadgeText =
    approvalStatus === 'pending'
      ? 'PENDING ADMIN APPROVAL'
      : approvalStatus === 'cancelled'
      ? 'CANCELLED BY ADMIN'
      : 'CONFIRMED ORDER';

  const statusBadgeStyle =
    approvalStatus === 'pending'
      ? { background: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }
      : approvalStatus === 'cancelled'
      ? { background: '#FEE2E2', color: '#991B1B', borderColor: '#EF4444' }
      : { background: '#DCFCE7', color: '#166534', borderColor: '#22C55E' };

  const content = (
    <div className="entity-invoice-print-sheet" aria-hidden="true">
      {/* 1. Document Header */}
      <header className="eip-header">
        <div className="eip-brand-block">
          <img
            src={logoUrl || '/logo.png'}
            alt={appName}
            className="eip-brand-logo"
            onError={(e) => { e.currentTarget.src = '/logo.png'; }}
          />
          <div>
            <div className="eip-company-name">{appName}</div>
            <div className="eip-company-sub">Official Partner Order &amp; Settlement Document</div>
          </div>
        </div>

        <div className="eip-doc-meta">
          <div className="eip-doc-title">
            {isPaymentReceipt ? 'PAYMENT RECEIPT' : 'ORDER DETAILS & TAX INVOICE'}
          </div>
          <div className="eip-meta-row">
            <span>Invoice No:</span>
            <strong>{invoiceNumber}</strong>
          </div>
          {isPaymentReceipt && (
            <div className="eip-meta-row">
              <span>Receipt No:</span>
              <strong>RCPT-{activePayment.id}</strong>
            </div>
          )}
          <div className="eip-meta-row">
            <span>Order ID:</span>
            <strong>#{order.id}</strong>
          </div>
          <div className="eip-meta-row">
            <span>{isPaymentReceipt ? 'Payment Date:' : 'Invoice Date:'}</span>
            <strong>
              {isPaymentReceipt
                ? formatDateTime(activePayment.payment_date || activePayment.paymentDate || activePayment.created_at)
                : orderDate}
            </strong>
          </div>
          <div className="eip-status-pill" style={statusBadgeStyle}>
            {statusBadgeText}
          </div>
        </div>
      </header>

      {/* 2. Party Details (Seller & Billed To Member) */}
      <section className="eip-parties-grid">
        <div className="eip-party-card">
          <div className="eip-section-label">SELLER / AUTHORIZED ENTITY</div>
          <div className="eip-party-name">{sellerName}</div>
          <div className="eip-party-detail">{sellerType}</div>
          {sellerEmail && <div className="eip-party-detail">Email: {sellerEmail}</div>}
          {sellerPhone && <div className="eip-party-detail">Phone: {sellerPhone}</div>}
        </div>

        <div className="eip-party-card">
          <div className="eip-section-label">BILLED TO / REGISTERED MEMBER</div>
          <div className="eip-party-name">{customerName}</div>
          <div className="eip-party-detail eip-mono">Member ID: {memberId}</div>
          {customerEmail && <div className="eip-party-detail">Email: {customerEmail}</div>}
          {customerPhone && <div className="eip-party-detail">Phone: {customerPhone}</div>}
        </div>
      </section>

      {/* 3. Order & Offering Specifications */}
      <section className="eip-section">
        <div className="eip-section-heading">ORDER SPECIFICATION</div>
        <table className="eip-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Offering / Item Description</th>
              <th style={{ textAlign: 'left' }}>Category &amp; Type</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              {unitPrice > 0 && <th style={{ textAlign: 'right' }}>Unit Price</th>}
              <th style={{ textAlign: 'right' }}>Total Order Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700, color: '#0f172a' }}>{itemName}</td>
              <td style={{ textTransform: 'capitalize', color: '#475569' }}>
                {itemCategory} • {itemType}
              </td>
              <td style={{ textAlign: 'right' }}>{quantity}</td>
              {unitPrice > 0 && <td style={{ textAlign: 'right' }}>{formatINRCurrency(unitPrice)}</td>}
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINRCurrency(financials.totalOrderCost)}</td>
            </tr>
          </tbody>
        </table>

        {isPaymentReceipt && (
          <div className="eip-receipt-meta-bar">
            <div>
              <span>Receipt Type:</span>{' '}
              <strong style={{ textTransform: 'capitalize' }}>{activePayment.payment_type || activePayment.paymentType || 'Payment'}</strong>
            </div>
            <div>
              <span>Payment Mode:</span>{' '}
              <strong>{activePayment.payment_method || activePayment.paymentMethod || 'N/A'}</strong>
            </div>
            <div>
              <span>Reference / UTR:</span>{' '}
              <strong className="eip-mono">{activePayment.reference_no || activePayment.referenceNo || 'N/A'}</strong>
            </div>
          </div>
        )}
      </section>

      {/* 4. Authoritative Payment-Based Financial Breakdown */}
      <section className="eip-section eip-breakdown-section">
        <div className="eip-section-heading">
          {isPaymentReceipt
            ? `FINANCIAL BREAKDOWN — RECEIPT #RCPT-${activePayment.id} ONLY`
            : 'FINANCIAL BREAKDOWN — COLLECTED PAYMENTS SUMMARY'}
        </div>

        <table className="eip-summary-table">
          <tbody>
            <tr>
              <td className="eip-summary-label">Total Order Cost (Original Order Value)</td>
              <td className="eip-summary-value">{formatINRCurrency(financials.totalOrderCost)}</td>
            </tr>

            <tr className="eip-row-highlight-green">
              <td className="eip-summary-label">
                {isPaymentReceipt
                  ? `Actual Payment Received (Receipt #RCPT-${activePayment.id})`
                  : `Amount Collected to Date (${financials.paymentCount} ${financials.paymentCount === 1 ? 'payment' : 'payments'})`}
              </td>
              <td className="eip-summary-value" style={{ color: '#15803d', fontWeight: 800 }}>
                {formatINRCurrency(financials.actualPaymentAmount)}
              </td>
            </tr>

            <tr>
              <td className="eip-summary-label">Approved Admin Commission Rate</td>
              <td className="eip-summary-value">{financials.commissionPercent}%</td>
            </tr>

            <tr className="eip-row-deduction">
              <td className="eip-summary-label">
                Admin Commission Cut ({financials.commissionPercent}% on Actual Received{' '}
                {formatINRCurrency(financials.actualPaymentAmount)})
              </td>
              <td className="eip-summary-value" style={{ color: '#b91c1c', fontWeight: 700 }}>
                -{formatINRCurrency(financials.adminCommissionCut)}
              </td>
            </tr>

            <tr className="eip-row-total">
              <td className="eip-summary-label">
                {isPaymentReceipt
                  ? 'Net Entity Realized (This Payment)'
                  : 'Net Entity Realized (From Collected Payments)'}
              </td>
              <td className="eip-summary-value" style={{ color: '#166534' }}>
                {formatINRCurrency(financials.netEntityRealized)}
              </td>
            </tr>

            {!isPaymentReceipt && financials.approvedDumpAmount > 0 && (
              <tr>
                <td className="eip-summary-label" style={{ color: '#9a3412' }}>
                  Approved Dump Write-Off
                </td>
                <td className="eip-summary-value" style={{ color: '#9a3412', fontWeight: 700 }}>
                  -{formatINRCurrency(financials.approvedDumpAmount)}
                </td>
              </tr>
            )}

            {!isPaymentReceipt && (
              <tr className="eip-row-balance">
                <td className="eip-summary-label">Remaining Order Balance Due</td>
                <td
                  className="eip-summary-value"
                  style={{ color: financials.remainingOrderBalance > 0 ? '#b45309' : '#166534', fontWeight: 800 }}
                >
                  {formatINRCurrency(financials.remainingOrderBalance)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {isPaymentReceipt && (
          <div className="eip-order-ref-box">
            <div className="eip-order-ref-title">
              Order-Wide Settlement Reference (Cumulative across all {financials.paymentCount} received payment(s))
            </div>
            <div className="eip-order-ref-grid">
              <div>
                <span>Total Order Cost:</span>{' '}
                <strong>{formatINRCurrency(financials.totalOrderCost)}</strong>
              </div>
              <div>
                <span>Cumulative Collected to Date:</span>{' '}
                <strong>{formatINRCurrency(financials.orderCollectedToDate)}</strong>
              </div>
              {financials.approvedDumpAmount > 0 && (
                <div>
                  <span>Approved Dump Write-Off:</span>{' '}
                  <strong>{formatINRCurrency(financials.approvedDumpAmount)}</strong>
                </div>
              )}
              <div>
                <span>Remaining Order Balance:</span>{' '}
                <strong>{formatINRCurrency(financials.remainingOrderBalance)}</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. Verified Installment Payments Table (Order Summary Mode) */}
      {!isPaymentReceipt && sortedPayments.length > 0 && (
        <section className="eip-section">
          <div className="eip-section-heading">
            VERIFIED PAYMENT INSTALLMENTS LEDGER ({sortedPayments.length})
          </div>
          <table className="eip-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Receipt #</th>
                <th style={{ textAlign: 'left' }}>Date</th>
                <th style={{ textAlign: 'left' }}>Type</th>
                <th style={{ textAlign: 'left' }}>Method / Reference</th>
                <th style={{ textAlign: 'right' }}>Cash Received</th>
                <th style={{ textAlign: 'right' }}>Admin Cut</th>
                <th style={{ textAlign: 'right' }}>Net Realized</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((p) => {
                const amt = Number(p.amount) || 0;
                const pct = Number(p.adminCommissionPercent ?? p.admin_commission_percent ?? financials.commissionPercent);
                const cut = Number(p.adminCommissionCut ?? p.admin_commission_cut ?? (amt * pct) / 100);
                const net = Number(p.netEntityAmount ?? p.net_entity_amount ?? Math.max(0, amt - cut));
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>RCPT-{p.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.payment_date || p.paymentDate || p.created_at)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.payment_type || p.paymentType || 'payment'}</td>
                    <td>
                      <div>{p.payment_method || p.paymentMethod || 'N/A'}</div>
                      {(p.reference_no || p.referenceNo) && (
                        <div className="eip-mono" style={{ fontSize: '9px', color: '#64748b' }}>
                          {p.reference_no || p.referenceNo}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINRCurrency(amt)}</td>
                    <td style={{ textAlign: 'right', color: '#b91c1c' }}>
                      -{formatINRCurrency(cut)} <span style={{ fontSize: '9px', color: '#64748b' }}>({pct}%)</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                      {formatINRCurrency(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ fontWeight: 800, textAlign: 'right' }}>Cumulative Totals:</td>
                <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatINRCurrency(financials.orderCollectedToDate)}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>
                  -{formatINRCurrency(financials.orderAdminCutCollected)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#166534' }}>
                  {formatINRCurrency(financials.orderNetRealized)}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}

      {/* 6. Footer */}
      <footer className="eip-footer">
        <div>
          Generated via <strong>{appName}</strong> Entity Partner Portal • Order #{order.id} ({invoiceNumber})
        </div>
        <div>
          Admin Commission applies strictly to verified cash payments received. This is a system-generated financial summary.
        </div>
      </footer>
    </div>
  );

  return createPortal(content, document.body);
}

export default EntityInvoicePrintView;
