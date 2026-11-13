import axios from 'axios';
import { handleSessionExpired, TOKEN_KEY } from '../utils/sessionManager';

// Detect production domain fallback dynamically so localhost is not hardcoded on production
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.origin.includes('vyaparadnet.com')) {
    return 'https://vyaparadnet.com/api';
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to attach Bearer token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle HTTP 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      // Auth endpoints where 401 is an expected credential error, not an expired session
      const isAuthEndpoint =
        url.includes('/admin/login') ||
        url.includes('/admin/forgot-password') ||
        url.includes('/admin/verify-otp') ||
        url.includes('/admin/reset-password');

      if (!isAuthEndpoint) {
        const expiryType = error.response.data?.expiry_type || 'idle';
        handleSessionExpired(expiryType, true);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
