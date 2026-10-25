import api from './axios';

// ----------------------------------------------------
// Admin Centralized Sales & Commission Distribution API
// ----------------------------------------------------

// Get all sales records from MySQL database
export const getAdminSales = async (params = {}) => {
  try {
    const response = await api.get('/admin/sales', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching admin sales records:', err);
    return { sales: [], summary: {} };
  }
};

// Create a sale record (if admin creates a direct sale)
export const createAdminSale = async (saleData) => {
  const response = await api.post('/admin/sales', saleData);
  return response.data?.sale;
};

// Disburse / Distribute MLM Network Commission and BP for a sale
export const distributeNetworkCommission = async (saleId, distributionData) => {
  const response = await api.post(`/admin/sales/${saleId}/distribute`, distributionData);
  return response.data;
};

// Receive balance payment on a sale
export const receiveSaleBalance = async (saleId, paymentData) => {
  const response = await api.post(`/sales/${saleId}/receive-balance`, paymentData);
  return response.data;
};

// Disburse / Distribute Network Commission and BP for a specific payment receipt
export const distributePaymentCommission = async (paymentId, distributionData) => {
  const response = await api.post(`/admin/payments/${paymentId}/distribute`, distributionData);
  return response.data;
};

// Get complete payment receipts ledger across all entities
export const getAdminPaymentLedger = async (params = {}) => {
  try {
    const response = await api.get('/admin/payments/history', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching admin payment history:', err);
    return { payments: [], total_collected: 0, total_admin_commission: 0, total_net_entity: 0 };
  }
};

