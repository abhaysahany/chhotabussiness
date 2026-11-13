import api from './axios';

// ----------------------------------------------------
// Admin Centralized Orders & Commission Distribution API
// ----------------------------------------------------

// Get all orders from MySQL database (with fallback to /admin/sales)
export const getAdminOrders = async (params = {}) => {
  try {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  } catch (err) {
    try {
      const fallback = await api.get('/admin/sales', { params });
      return fallback.data;
    } catch (e) {
      console.error('Error fetching admin orders records:', e);
      return { orders: [], sales: [], summary: {} };
    }
  }
};

// Fetch single order details with payments and dump requests
export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data?.order || response.data?.sale || response.data;
  } catch (err) {
    try {
      const fallback = await api.get(`/admin/sales/${orderId}`);
      return fallback.data?.order || fallback.data?.sale || fallback.data;
    } catch (e) {
      console.error(`Error fetching order #${orderId} details:`, e);
      throw (e.response?.data || e);
    }
  }
};

// Create an order record
export const createAdminOrder = async (orderData) => {
  try {
    const response = await api.post('/admin/orders', orderData);
    return response.data?.order || response.data?.sale;
  } catch (e) {
    const fallback = await api.post('/admin/sales', orderData);
    return fallback.data?.order || fallback.data?.sale;
  }
};

// Disburse / Distribute MLM Network Commission and BP for an order (DEPRECATED & DISABLED)
export const distributeOrderCommission = async (orderId, distributionData) => {
  throw new Error('distributeOrderCommission is deprecated and disabled. All Admin Commission allocations are handled via Order Management (POST /api/admin/payments/{paymentId}/income-allocation).');
};

// Receive balance payment on an order
export const receiveOrderBalance = async (orderId, paymentData) => {
  try {
    const response = await api.post(`/orders/${orderId}/receive-balance`, paymentData);
    return response.data;
  } catch (e) {
    const fallback = await api.post(`/sales/${orderId}/receive-balance`, paymentData);
    return fallback.data;
  }
};

// Disburse / Distribute Network Commission and BP for a specific payment receipt (DEPRECATED & DISABLED)
export const distributePaymentCommission = async (paymentId, distributionData) => {
  throw new Error('distributePaymentCommission is deprecated and disabled. All Admin Commission allocations are handled via Order Management (POST /api/admin/payments/{paymentId}/income-allocation).');
};

// Get income allocation preview and status for an order
export const getOrderIncomeAllocation = async (orderId) => {
  try {
    const response = await api.get(`/admin/orders/${orderId}/income-allocation`);
    return response.data;
  } catch (err) {
    try {
      const fallback = await api.get(`/admin/sales/${orderId}/income-allocation`);
      return fallback.data;
    } catch (e) {
      console.error('Error fetching order income allocation:', e);
      throw (e.response?.data || e);
    }
  }
};

// Confirm and persist income allocation for an order
export const confirmOrderIncomeAllocation = async (orderId) => {
  try {
    const response = await api.post(`/admin/orders/${orderId}/income-allocation`);
    return response.data;
  } catch (err) {
    try {
      const fallback = await api.post(`/admin/sales/${orderId}/income-allocation`);
      return fallback.data;
    } catch (e) {
      console.error('Error confirming order income allocation:', e);
      throw (e.response?.data || e);
    }
  }
};

// Get income allocation preview and status for a specific payment receipt
export const getPaymentIncomeAllocation = async (paymentId) => {
  try {
    const response = await api.get(`/admin/payments/${paymentId}/income-allocation`);
    return response.data;
  } catch (err) {
    console.error('Error fetching payment income allocation:', err);
    throw (err.response?.data || err);
  }
};

// Confirm and persist income allocation for a specific payment receipt
export const confirmPaymentIncomeAllocation = async (paymentId) => {
  try {
    const response = await api.post(`/admin/payments/${paymentId}/income-allocation`);
    return response.data;
  } catch (err) {
    console.error('Error confirming payment income allocation:', err);
    throw (err.response?.data || err);
  }
};

// Update order Dump Amount (Deprecated & Disabled: Bug 1 Fix)
export const updateOrderDumpAmount = async (orderId, dumpAmount) => {
  throw new Error(
    'updateOrderDumpAmount is deprecated and disabled. Dump amount write-offs must be requested by the Entity and approved by Admin via Order Management Section B.'
  );
};

// Get distributed payment receipts ledger across all entities (Show ONLY completed distributed payments)
export const getAdminPaymentLedger = async (params = {}) => {
  try {
    const response = await api.get('/admin/payments/history', {
      params: { status: 'completed', ...params },
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching admin payment history:', err);
    return {
      payments: [],
      total_collected: 0,
      total_admin_commission: 0,
      total_net_entity: 0,
      total_direct_income: 0,
      total_level_income: 0,
      total_reward_income: 0,
      total_distributed_admin_cut: 0,
      total_count: 0,
    };
  }
};

export const getAdminDistributedPayments = getAdminPaymentLedger;

// ----------------------------------------------------
// Order Approval Workflow APIs (Pending Orders)
// ----------------------------------------------------

// Fetch all pending orders awaiting admin review and approval
export const getPendingOrders = async (params = {}) => {
  try {
    const response = await api.get('/admin/orders', {
      params: { approval_status: 'pending', ...params },
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching pending orders:', err);
    return { orders: [], count: 0 };
  }
};

// Confirm a pending order with admin-specified commission percentage
export const confirmPendingOrder = async (orderId, commissionPercent) => {
  try {
    const response = await api.post(`/admin/orders/${orderId}/confirm`, {
      admin_commission_percent: commissionPercent,
    });
    return response.data;
  } catch (err) {
    console.error(`Error confirming order #${orderId}:`, err);
    throw (err.response?.data || err);
  }
};

// Cancel a pending order with mandatory cancellation reason
export const cancelPendingOrder = async (orderId, cancellationReason) => {
  try {
    const response = await api.post(`/admin/orders/${orderId}/cancel`, {
      cancellation_reason: cancellationReason,
    });
    return response.data;
  } catch (err) {
    console.error(`Error cancelling order #${orderId}:`, err);
    throw (err.response?.data || err);
  }
};

// ----------------------------------------------------
// Dump Payment Requests APIs
// ----------------------------------------------------

// Fetch all dump payment requests
export const getAdminDumpRequests = async (params = {}) => {
  try {
    const response = await api.get('/admin/dump-requests', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching admin dump requests:', err);
    return { dumps: [], data: [], summary: {} };
  }
};

// Fetch specific dump payment request details with calculation preview
export const getAdminDumpRequestDetails = async (id) => {
  try {
    const response = await api.get(`/admin/dump-requests/${id}`);
    return response.data;
  } catch (err) {
    console.error(`Error fetching dump request #${id} details:`, err);
    throw (err.response?.data || err);
  }
};

// Approve a dump payment request
export const approveDumpRequest = async (id) => {
  try {
    const response = await api.post(`/admin/dump-requests/${id}/approve`);
    return response.data;
  } catch (err) {
    console.error(`Error approving dump request #${id}:`, err);
    throw (err.response?.data || err);
  }
};

// Reject a dump payment request with mandatory rejection reason
export const rejectDumpRequest = async (id, reason) => {
  try {
    const response = await api.post(`/admin/dump-requests/${id}/reject`, {
      rejection_reason: reason,
    });
    return response.data;
  } catch (err) {
    console.error(`Error rejecting dump request #${id}:`, err);
    throw (err.response?.data || err);
  }
};

// ----------------------------------------------------
// Legacy Aliases for Backward Compatibility
// ----------------------------------------------------
export const getAdminSales = getAdminOrders;
export const createAdminSale = createAdminOrder;
export const distributeNetworkCommission = distributeOrderCommission;
export const receiveSaleBalance = receiveOrderBalance;
