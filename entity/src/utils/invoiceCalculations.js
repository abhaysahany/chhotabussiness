/**
 * Authoritative Invoice & Payment Receipt Financial Calculation Utilities
 * Aligns strictly with backend Order & SalePayment payment-based accounting rules.
 */

const EXCLUDED_PAYMENT_STATUSES = new Set(['pending', 'failed', 'cancelled', 'rejected']);

export const roundCurrency = (value) => {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatINRCurrency = (value) => {
  const num = Number(value) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Filter actual received payments (excluding any pending, failed, cancelled, or rejected records).
 */
export const getEligibleOrderPayments = (order) => {
  const rawPayments = Array.isArray(order?.payments) ? order.payments : [];
  return rawPayments.filter((p) => {
    const status = String(p?.status ?? '').trim().toLowerCase();
    return status === '' || !EXCLUDED_PAYMENT_STATUSES.has(status);
  });
};

/**
 * Compute authoritative invoice breakdown either for:
 * - Cumulative Order Summary (`selectedPaymentId == null`)
 * - Specific Payment Receipt (`selectedPaymentId != null`)
 */
export const computeInvoiceFinancials = (order, selectedPaymentId = null) => {
  if (!order) return null;

  const summary = order.invoiceSummary || order.invoice_summary || null;
  const eligiblePayments = getEligibleOrderPayments(order);
  const allPayments = Array.isArray(order?.payments) ? order.payments : [];

  const totalOrderCost = roundCurrency(
    summary?.total_order_cost ?? order.grossAmount ?? order.gross_amount ?? 0
  );
  const orderCommissionPercent = roundCurrency(
    summary?.admin_commission_percent ?? order.adminCommissionPercent ?? order.admin_commission_percent ?? 15
  );
  const approvedDumpAmount = roundCurrency(
    summary?.approved_dump_amount ?? order.approvedDumpAmount ?? order.approved_dump_amount ?? order.dumpAmount ?? order.dump_amount ?? 0
  );

  // Cumulative order collections across eligible received payments
  let orderCollectedToDate;
  if (summary?.amount_collected_to_date !== undefined) {
    orderCollectedToDate = roundCurrency(summary.amount_collected_to_date);
  } else if (order.totalPaymentReceived !== undefined || order.total_payment_received !== undefined) {
    orderCollectedToDate = roundCurrency(order.totalPaymentReceived ?? order.total_payment_received);
  } else if (allPayments.length > 0) {
    orderCollectedToDate = roundCurrency(eligiblePayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0));
  } else {
    orderCollectedToDate = roundCurrency(order.advancePayment ?? order.advance_payment ?? 0);
  }

  let orderAdminCutCollected;
  if (summary?.admin_commission_cut_on_received !== undefined) {
    orderAdminCutCollected = roundCurrency(summary.admin_commission_cut_on_received);
  } else if (order.adminCommissionCollected !== undefined || order.admin_commission_collected !== undefined) {
    orderAdminCutCollected = roundCurrency(order.adminCommissionCollected ?? order.admin_commission_collected);
  } else if (allPayments.length > 0) {
    orderAdminCutCollected = roundCurrency(
      eligiblePayments.reduce((acc, p) => {
        const pCut = p.adminCommissionCut ?? p.admin_commission_cut;
        if (pCut !== undefined && pCut !== null) return acc + Number(pCut);
        const pRate = Number(p.adminCommissionPercent ?? p.admin_commission_percent ?? orderCommissionPercent);
        return acc + roundCurrency(((Number(p.amount) || 0) * pRate) / 100);
      }, 0)
    );
  } else {
    orderAdminCutCollected = orderCollectedToDate > 0
      ? roundCurrency((orderCollectedToDate * orderCommissionPercent) / 100)
      : 0;
  }

  let orderNetRealized;
  if (summary?.net_entity_realized !== undefined) {
    orderNetRealized = roundCurrency(summary.net_entity_realized);
  } else if (order.netEntityRealized !== undefined || order.net_entity_realized !== undefined) {
    orderNetRealized = roundCurrency(order.netEntityRealized ?? order.net_entity_realized);
  } else if (allPayments.length > 0) {
    orderNetRealized = roundCurrency(
      eligiblePayments.reduce((acc, p) => {
        const pNet = p.netEntityAmount ?? p.net_entity_amount;
        if (pNet !== undefined && pNet !== null) return acc + Number(pNet);
        const pAmt = Number(p.amount) || 0;
        const pRate = Number(p.adminCommissionPercent ?? p.admin_commission_percent ?? orderCommissionPercent);
        const pCut = p.adminCommissionCut ?? p.admin_commission_cut ?? roundCurrency((pAmt * pRate) / 100);
        return acc + roundCurrency(pAmt - Number(pCut));
      }, 0)
    );
  } else {
    orderNetRealized = Math.max(0, roundCurrency(orderCollectedToDate - orderAdminCutCollected));
  }

  const orderRemainingBalance = Math.max(
    0,
    roundCurrency(
      summary?.remaining_order_balance ??
      order.remainingProjectBalance ??
      order.remaining_project_balance ??
      order.balanceDue ??
      order.balance_due ??
      (totalOrderCost - orderCollectedToDate - approvedDumpAmount)
    )
  );

  // Payment-specific receipt mode
  if (selectedPaymentId !== null && selectedPaymentId !== undefined) {
    const selectedPayment = eligiblePayments.find(
      (p) => String(p.id) === String(selectedPaymentId)
    );

    if (selectedPayment) {
      const paymentAmount = roundCurrency(selectedPayment.amount ?? 0);
      const paymentCommissionPercent = roundCurrency(
        selectedPayment.adminCommissionPercent ??
        selectedPayment.admin_commission_percent ??
        orderCommissionPercent
      );
      const rawCut = selectedPayment.adminCommissionCut ?? selectedPayment.admin_commission_cut;
      const paymentAdminCut = rawCut !== undefined && rawCut !== null
        ? roundCurrency(rawCut)
        : roundCurrency((paymentAmount * paymentCommissionPercent) / 100);

      const rawNet = selectedPayment.netEntityAmount ?? selectedPayment.net_entity_amount;
      const paymentNetRealized = rawNet !== undefined && rawNet !== null
        ? Math.max(0, roundCurrency(rawNet))
        : Math.max(0, roundCurrency(paymentAmount - paymentAdminCut));

      return {
        mode: 'payment_receipt',
        selectedPayment,
        eligiblePayments,
        totalOrderCost,
        actualPaymentAmount: paymentAmount,
        commissionPercent: paymentCommissionPercent,
        adminCommissionCut: paymentAdminCut,
        netEntityRealized: paymentNetRealized,
        approvedDumpAmount,
        orderCollectedToDate,
        orderAdminCutCollected,
        orderNetRealized,
        remainingOrderBalance: orderRemainingBalance,
        paymentCount: eligiblePayments.length,
      };
    }
  }

  return {
    mode: 'order_summary',
    selectedPayment: null,
    eligiblePayments,
    totalOrderCost,
    actualPaymentAmount: orderCollectedToDate,
    commissionPercent: orderCommissionPercent,
    adminCommissionCut: orderAdminCutCollected,
    netEntityRealized: orderNetRealized,
    approvedDumpAmount,
    orderCollectedToDate,
    orderAdminCutCollected,
    orderNetRealized,
    remainingOrderBalance: orderRemainingBalance,
    paymentCount: eligiblePayments.length,
  };
};
