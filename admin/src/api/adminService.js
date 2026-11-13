import api from './axios';

export const adminLogin = async (credentials) => {
  const response = await api.post('/admin/login', credentials);
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await api.get('/admin/me');
  return response.data;
};

export const adminLogout = async () => {
  const response = await api.post('/admin/logout');
  return response.data;
};

// Admin Password Recovery
export const adminForgotPassword = async (data) => {
  const response = await api.post('/admin/forgot-password', data);
  return response.data;
};

export const adminVerifyOtp = async (data) => {
  const response = await api.post('/admin/verify-otp', data);
  return response.data;
};

export const adminResetPassword = async (data) => {
  const response = await api.post('/admin/reset-password', data);
  return response.data;
};

export const getSystemStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

export const getAdminInfo = async () => {
  const response = await api.get('/admin/info');
  return response.data;
};

// Support Desk API Services
export const getSupportTickets = async (status = 'All', search = '') => {
  const response = await api.get('/admin/support/tickets', {
    params: { status, search },
  });
  return response.data;
};

export const sendSupportReply = async (ticketId, message, adminName) => {
  const response = await api.post(`/admin/support/tickets/${ticketId}/reply`, {
    message,
    admin_name: adminName,
  });
  return response.data;
};

export const updateTicketStatus = async (ticketId, status) => {
  const response = await api.patch(`/admin/support/tickets/${ticketId}/status`, {
    status,
  });
  return response.data;
};

// Enterprise Admin Dashboard Statistics
export const getAdminDashboardStats = async (period = '7d') => {
  const response = await api.get('/admin/dashboard-stats', {
    params: { period },
  });
  return response.data;
};

// Admin User Accounts Management
export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateAdminUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const toggleAdminUserStatus = async (id) => {
  const response = await api.post(`/admin/users/${id}/toggle-status`);
  return response.data;
};
