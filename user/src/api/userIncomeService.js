import api from './axios';

/**
 * Fetch authenticated user's Direct Income summary & record.
 * GET /api/user/income/direct
 */
export const getUserDirectIncome = async () => {
  try {
    const response = await api.get('/user/income/direct');
    return response.data;
  } catch (err) {
    console.error('Error fetching direct income summary:', err);
    throw (err.response?.data || err);
  }
};

/**
 * Fetch authenticated user's Level Income summary & Level 2–5 breakdown.
 * GET /api/user/income/levels
 */
export const getUserLevelIncome = async () => {
  try {
    const response = await api.get('/user/income/levels');
    return response.data;
  } catch (err) {
    console.error('Error fetching level income summary:', err);
    throw (err.response?.data || err);
  }
};

/**
 * Fetch authenticated user's consolidated Income summary cards & streams.
 * GET /api/user/income/summary
 */
export const getUserIncomeSummary = async () => {
  try {
    const response = await api.get('/user/income/summary');
    return response.data;
  } catch (err) {
    console.error('Error fetching combined income summary:', err);
    throw (err.response?.data || err);
  }
};

/**
 * Fetch authenticated user's Order-Wise Direct Income Summaries (Paginated).
 * GET /api/user/income/direct-orders
 * 
 * Supports query params: page, per_page, status, search, sort_by, sort_order
 */
export const getUserDirectIncomeOrders = async (params = {}) => {
  try {
    const response = await api.get('/user/income/direct-orders', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching order-wise direct income summaries:', err);
    throw (err.response?.data || err);
  }
};

/**
 * Fetch authenticated user's detailed installment-wise distributions and dump records for a specific order.
 * GET /api/user/income/direct-orders/{orderId}
 */
export const getUserDirectIncomeOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/user/income/direct-orders/${orderId}`);
    return response.data;
  } catch (err) {
    console.error(`Error fetching direct income details for order #${orderId}:`, err);
    throw (err.response?.data || err);
  }
};

