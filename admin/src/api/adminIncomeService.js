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

/**
 * 4. Fetch Global Level Income KPI Overview & Platform Cross-Reconciliation
 * Endpoint: GET /api/admin/income/level-overview
 *
 * @param {Object} params Optional filter params
 * @returns {Promise<Object>} Overview metrics, level breakdown, and reconciliation summary
 */
export const getAdminLevelIncomeOverview = async (params = {}) => {
  try {
    const response = await api.get('/admin/income/level-overview', { params });
    return response.data;
  } catch {
    try {
      const fallback = await api.get('/admin/level-income/overview', { params });
      return fallback.data;
    } catch (fallbackErr) {
      console.error('Error fetching admin level income overview:', fallbackErr);
      throw fallbackErr.response?.data || fallbackErr;
    }
  }
};

/**
 * 5. Fetch Consolidated Level-wise Income Records
 * Endpoint: GET /api/admin/income/level-orders
 *
 * Supports search, level filter (1-5), status, entity, date range, and pagination.
 *
 * @param {Object} params { search, level, status, entity_id, entity_type, beneficiary, buyer, start_date, end_date, sort_by, sort_order, page, per_page }
 * @returns {Promise<Object>} { status: 'success', data: [...], records: [...], pagination: { ... } }
 */
export const getAdminLevelIncomeOrders = async (params = {}) => {
  try {
    const response = await api.get('/admin/income/level-orders', { params });
    return response.data;
  } catch {
    try {
      const fallback = await api.get('/admin/level-income/orders', { params });
      return fallback.data;
    } catch (fallbackErr) {
      console.error('Error fetching admin level income orders:', fallbackErr);
      throw fallbackErr.response?.data || fallbackErr;
    }
  }
};

/**
 * 6. Fetch Comprehensive Audit Details for a Single Order Level Income
 * Endpoint: GET /api/admin/income/level-orders/{orderId}
 *
 * Returns order details, multi-level breakdown (Levels 2-5), installment payment history, and reconciliation.
 *
 * @param {number|string} orderId Order ID or invoice number
 * @returns {Promise<Object>} Detailed order level income audit report
 */
export const getAdminLevelIncomeOrderDetails = async (orderId) => {
  if (!orderId) {
    throw new Error('Order ID is required to fetch level income details.');
  }

  try {
    const response = await api.get(`/admin/income/level-orders/${orderId}`);
    return response.data;
  } catch {
    try {
      const fallback = await api.get(`/admin/level-income/orders/${orderId}`);
      return fallback.data;
    } catch (fallbackErr) {
      console.error(`Error fetching order #${orderId} level income details:`, fallbackErr);
      throw fallbackErr.response?.data || fallbackErr;
    }
  }
};

export default {
  getAdminDirectIncomeOverview,
  getAdminDirectIncomeOrders,
  getAdminDirectIncomeOrderDetails,
  getAdminLevelIncomeOverview,
  getAdminLevelIncomeOrders,
  getAdminLevelIncomeOrderDetails,
};
