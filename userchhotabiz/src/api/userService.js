import api from './axios';

export const getSystemStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

export const getUserInfo = async () => {
  const response = await api.get('/user/info');
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const verifySponsor = async (sponsor_id) => {
  const response = await api.post('/verify-sponsor', { sponsor_id });
  return response.data;
};

export const sendOtp = async (email) => {
  const response = await api.post('/send-otp', { email });
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await api.post('/verify-otp', { email, otp });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/logout');
  return response.data;
};

export const socialLoginUser = async (socialData) => {
  const response = await api.post('/auth/social-login', socialData);
  return response.data;
};

export const updateUserPassword = async (passwordData) => {
  const response = await api.post('/user/update-password', passwordData);
  return response.data;
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/user/dashboard-stats');
    return response.data;
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return null;
  }
};


