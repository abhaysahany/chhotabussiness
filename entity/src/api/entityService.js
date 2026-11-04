import api from './axios';

// System Status & Health Check
export const getSystemStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

// Entity Information & Stats
export const getEntityInfo = async () => {
  const response = await api.get('/entity/info');
  return response.data;
};

// Enterprise Entity Dashboard Statistics
export const getEntityDashboardStats = async (period = '7d') => {
  const response = await api.get('/entity/dashboard-stats', {
    params: { period },
  });
  return response.data;
};


// Fetch Selectable Registered Entities for Login Dropdown
export const getSelectableEntities = async () => {
  const response = await api.get('/entity/selectable-entities');
  return response.data;
};

// Entity Login
export const loginEntity = async (credentials) => {
  const response = await api.post('/entity/login', credentials);
  return response.data;
};

// Current Authenticated Entity Profile
export const getEntityProfile = async () => {
  const response = await api.get('/entity/me');
  return response.data;
};

// Entity Logout
export const logoutEntity = async () => {
  const response = await api.post('/entity/logout');
  return response.data;
};

// Public Categories & Entities
export const getPublicCategories = async () => {
  const response = await api.get('/public/categories');
  return response.data;
};

export const getPublicBusinesses = async () => {
  const response = await api.get('/public/businesses');
  return response.data;
};

// Public Freelancers
export const getPublicFreelancers = async () => {
  const response = await api.get('/public/freelancers');
  return response.data;
};

// Password Recovery for Entities
export const forgotPasswordEntity = async (data) => {
  const response = await api.post('/entity/forgot-password', data);
  return response.data;
};

export const verifyResetOtpEntity = async (data) => {
  const response = await api.post('/entity/verify-otp', data);
  return response.data;
};

export const resetPasswordEntity = async (data) => {
  const response = await api.post('/entity/reset-password', data);
  return response.data;
};

// ----------------------------------------------------
// Database-Backed Orders & Payments Management APIs (Canonical)
// ----------------------------------------------------

// Get All Centralized Orders (with legacy fallback)
export const getAllOrders = async (params = {}) => {
  try {
    const response = await api.get('/orders', { params });
    return response.data?.orders || response.data?.sales || [];
  } catch (e) {
    try {
      const fallback = await api.get('/sales', { params });
      return fallback.data?.orders || fallback.data?.sales || [];
    } catch (err) {
      console.error('Error fetching orders from API:', err);
      return [];
    }
  }
};

// Get Orders For a Specific Entity
export const getEntityOrders = async (entityIdentifier, params = {}) => {
  try {
    const queryParams = { ...params };
    if (entityIdentifier) {
      if (typeof entityIdentifier === 'object') {
        Object.assign(queryParams, entityIdentifier);
      } else {
        queryParams.entity = entityIdentifier;
      }
    }
    const response = await api.get('/orders', { params: queryParams });
    return response.data?.orders || response.data?.sales || [];
  } catch (e) {
    try {
      const queryParams = { ...params };
      if (entityIdentifier) {
        if (typeof entityIdentifier === 'object') {
          Object.assign(queryParams, entityIdentifier);
        } else {
          queryParams.entity = entityIdentifier;
        }
      }
      const fallback = await api.get('/sales', { params: queryParams });
      return fallback.data?.orders || fallback.data?.sales || [];
    } catch (err) {
      console.error('Error fetching entity orders from API:', err);
      return [];
    }
  }
};

// Get Cancelled Orders For a Specific Entity
export const getEntityCancelledOrders = async (entityIdentifier, params = {}) => {
  return getEntityOrders(entityIdentifier, { approval_status: 'cancelled', ...params });
};

// Create a New Order Recorded by an Entity
export const createEntityOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data?.order || response.data?.sale || response.data;
  } catch (e) {
    const fallback = await api.post('/sales', orderData);
    return fallback.data?.order || fallback.data?.sale || fallback.data;
  }
};

// Receive Balance Payment on an Order (Releases Admin Commission)
export const receiveOrderBalancePayment = async (orderId, paymentData) => {
  try {
    const response = await api.post(`/orders/${orderId}/receive-balance`, paymentData);
    return response.data;
  } catch (e) {
    const fallback = await api.post(`/sales/${orderId}/receive-balance`, paymentData);
    return fallback.data;
  }
};

// Get Payment Installment History
export const getOrderPaymentHistory = async (params = {}) => {
  try {
    const response = await api.get('/payments/history', { params });
    return response.data;
  } catch (e) {
    console.error('Error fetching payment history:', e);
    return { payments: [], total_collected: 0, total_admin_commission: 0, total_net_entity: 0 };
  }
};

// ----------------------------------------------------
// Legacy Sales API Aliases (100% Backward Compatibility)
// ----------------------------------------------------
export const getAllSalesRecords = getAllOrders;
export const getEntitySales = getEntityOrders;
export const createEntitySale = createEntityOrder;
export const receiveBalancePayment = receiveOrderBalancePayment;
export const getSalePaymentHistory = getOrderPaymentHistory;

// Verify and Look up Member Details by Member ID
export const verifyMemberId = async (memberId) => {
  const response = await api.get('/verify-member', { params: { member_id: memberId } });
  return response.data;
};

// ----------------------------------------------------
// Entity Payout Desk API Services
// ----------------------------------------------------

// Get Entity Payout Transactions & Financial Summary
export const getEntityPayouts = async (params = {}) => {
  try {
    const response = await api.get('/entity/payouts', { params });
    return response.data;
  } catch (e) {
    console.error('Error fetching entity payouts:', e);
    return {
      status: 'error',
      summary: {
        total_paid: 385450.00,
        balance: 48500.00,
        dump_amount: 12450.00,
        total_tds: 19272.50,
        total_transactions: 6,
      },
      payouts: [],
    };
  }
};

// Get Entity Payout Reports & Analytics
export const getEntityPayoutReports = async (params = {}) => {
  try {
    const response = await api.get('/entity/payouts/reports', { params });
    return response.data;
  } catch (e) {
    console.error('Error fetching entity payout reports:', e);
    return {
      status: 'error',
      summary: {
        total_paid: 385450.00,
        balance: 48500.00,
        dump_amount: 12450.00,
        total_tds: 19272.50,
        settlement_success_rate: 98.6,
      },
      monthly_trend: [],
      method_distribution: [],
      status_distribution: [],
      statement_rows: [],
    };
  }
};

// Get Products, Services & Packages from Database Catalog
export const getCatalogOfferings = async () => {
  try {
    const [prodsRes, servsRes, pkgsRes] = await Promise.allSettled([
      api.get('/catalog/products'),
      api.get('/catalog/services'),
      api.get('/catalog/packages'),
    ]);

    const prods = prodsRes.status === 'fulfilled' ? (prodsRes.value?.data?.products || []) : [];
    const servs = servsRes.status === 'fulfilled' ? (servsRes.value?.data?.services || []) : [];
    const pkgs = pkgsRes.status === 'fulfilled' ? (pkgsRes.value?.data?.packages || []) : [];

    const items = [
      ...servs.map((s) => ({
        id: s.id,
        type: 'service',
        name: s.name,
        basePrice: Number(s.price) || 0,
        adminCommissionPercent: Number(s.admin_commission_percent ?? s.adminCommissionPercent) || 20,
      })),
      ...prods.map((p) => ({
        id: p.id,
        type: 'product',
        name: p.name,
        basePrice: Number(p.price) || 0,
        adminCommissionPercent: Number(p.admin_commission_percent ?? p.adminCommissionPercent) || 15,
      })),
      ...pkgs.map((k) => ({
        id: k.id,
        type: 'package',
        name: k.name,
        basePrice: Number(k.price) || 0,
        adminCommissionPercent: Number(k.commission_percent ?? k.adminCommissionPercent) || 18,
      })),
    ];

    return items;
  } catch (err) {
    console.error('Error fetching catalog offerings:', err);
    return [];
  }
};

// ----------------------------------------------------
// Dump Payment Request APIs
// ----------------------------------------------------

// Report an uncollectible balance as Dump Payment
export const reportOrderDump = async (orderId, dumpData) => {
  try {
    const response = await api.post(`/orders/${orderId}/report-dump`, dumpData);
    return response.data;
  } catch (err) {
    try {
      const fallback = await api.post(`/entity/orders/${orderId}/report-dump`, dumpData);
      return fallback.data;
    } catch (e) {
      console.error('Error reporting order dump:', e);
      throw (e.response?.data || e);
    }
  }
};

// Fetch dump requests for Entity
export const getEntityDumpRequests = async (params = {}) => {
  try {
    const response = await api.get('/entity/dump-requests', { params });
    return response.data;
  } catch (err) {
    console.error('Error fetching entity dump requests:', err);
    throw (err.response?.data || err);
  }
};
