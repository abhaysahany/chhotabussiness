import api from './axios';

/**
 * Admin Direct Income Reporting & Reconciliation Service
 *
 * Dedicated strictly to read-only monitoring and 4-way financial cross-reconciliation.
 * Does not mutate financial data, distribute commissions, or adjust wallets.
 */

/**
 * 1. Fetch Global Direct Income KPI Overview & Platform 4-Way Reconciliation
 * Endpoint: GET /api/admin/income/direct-overview
 *
 * @param {Object} params Optional filter params (e.g. date range)
 * @returns {Promise<Object>} Overview metrics and platform reconciliation summary
 */
export const getAdminDirectIncomeOverview = async (params = {}) => {
  try {
    const response = await api.get('/admin/income/direct-overview', { params });
    return response.data;
  } catch {
    // Fallback to legacy/alias route if present
    try {
      const fallback = await api.get('/admin/direct-income/overview', { params });
      return fallback.data;
    } catch (fallbackErr) {
      console.error('Error fetching admin direct income overview:', fallbackErr);
      throw fallbackErr.response?.data || fallbackErr;
    }
  }
};

/**
 * 2. Fetch Consolidated Global Order-wise Direct Income List
 * Endpoint: GET /api/admin/income/direct-orders
 *
 * Supports search, filters, sorting, and server-side pagination.
 *
 * @param {Object} params { search, status, entity_type, entity_id, sponsor, buyer, start_date, end_date, sort_by, sort_order, page, per_page }
 * @returns {Promise<Object>} { status: 'success', data: [...], orders: [...], pagination: { ... } }
 */
export const getAdminDirectIncomeOrders = async (params = {}) => {
  try {
    const response = await api.get('/admin/income/direct-orders', { params });
    return response.data;
  } catch {
    try {
      const fallback = await api.get('/admin/direct-income/orders', { params });
      return fallback.data;
    } catch (fallbackErr) {
      console.error('Error fetching admin direct income orders:', fallbackErr);
      throw fallbackErr.response?.data || fallbackErr;
    }
  }
};

/**
 * 3. Fetch Comprehensive 6-Section Drill-Down Details for a Single Order
 * Endpoint: GET /api/admin/income/direct-orders/{orderId}
 *
 * Returns order details, buyer/sponsor info, parent financials, direct income summary,
 * installment payout history, ledger and wallet trace, approved dumps, and order reconciliation.
 *
 * @param {number|string} orderId Order ID or invoice number
 * @returns {Promise<Object>} Detailed order audit report
 */
export const getAdminDirectIncomeOrderDetails = async (orderId) => {
  if (!orderId) {
    throw new Error('Order ID is required to fetch direct income details.');
  }

  try {
    const response = await api.get(`/admin/income/direct-orders/${orderId}`);
    return response.data;
  } catch {
    try {
      const fallback = await api.get(`/admin/direct-income/orders/${orderId}`);
      return fallback.data;
    } catch (fallbackErr) {
      console.error(`Error fetching order #${orderId} direct income details:`, fallbackErr);
      throw fallbackErr.response?.data || fallbackErr;
    }
  }
};

export default {
  getAdminDirectIncomeOverview,
  getAdminDirectIncomeOrders,
  getAdminDirectIncomeOrderDetails,
};
