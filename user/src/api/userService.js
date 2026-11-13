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

export const sendOtp = async (data) => {
  const payload = typeof data === 'string' ? { email: data } : data;
  const response = await api.post('/send-otp', payload);
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

/**
 * Secure Google Authentication (Login & Register via authorization code)
 */
export const authenticateWithGoogle = async (payload) => {
  const response = await api.post('/auth/google', payload, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
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

/**
 * User / MLM Member Forgot Password Flow
 */
export const forgotPasswordUser = async (data) => {
  const payload = typeof data === 'string' ? { email: data } : data;
  const response = await api.post('/forgot-password', payload);
  return response.data;
};

export const verifyResetOtpUser = async (data) => {
  const response = await api.post('/verify-reset-otp', data);
  return response.data;
};

export const resetPasswordUser = async (data) => {
  const response = await api.post('/reset-password', data);
  return response.data;
};

export const getDashboardStats = async (period = '7d') => {
  try {
    const response = await api.get('/user/dashboard-stats', {
      params: { period },
    });
    return response.data;
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return null;
  }
};

/**
 * Sponsor Onboarding for Google Sign-in / Direct Onboarding
 */
export const completeSponsorOnboarding = async (sponsor_id) => {
  const payload = typeof sponsor_id === 'string' ? { sponsor_id } : sponsor_id;
  const response = await api.post('/user/complete-sponsor-onboarding', payload);
  return response.data;
};

export const skipSponsorOnboarding = async () => {
  const response = await api.post('/user/skip-sponsor-onboarding');
  return response.data;
};

/**
 * User Profile & Avatar Management
 */
export const getUserProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.post('/user/profile', profileData);
  return response.data;
};

export const uploadUserProfilePhoto = async (fileOrFormData) => {
  let body = fileOrFormData;
  if (fileOrFormData instanceof File) {
    body = new FormData();
    body.append('photo', fileOrFormData);
  }
  const response = await api.post('/user/profile/photo', body, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const removeUserProfilePhoto = async () => {
  const response = await api.delete('/user/profile/photo');
  return response.data;
};
