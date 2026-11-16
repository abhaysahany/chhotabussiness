import axios from 'axios';
import { handleSessionExpired, TOKEN_KEY } from '../utils/sessionManager';

/**
 * Authoritative API Base URL Resolver for Entity Panel
 */
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname.toLowerCase();
    const isLocalhost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      window.location.port === '5173' ||
      window.location.port === '5174' ||
      window.location.port === '5175' ||
      window.location.port === '3000';

    if (!isLocalhost) {
      return `${window.location.origin}/api`;
    }
  }

  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Add a request interceptor to attach Bearer token and enforce production URL safety
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const host = window.location.hostname.toLowerCase();
      const isLocalhost =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local') ||
        window.location.port === '5173' ||
        window.location.port === '5174' ||
        window.location.port === '5175' ||
        window.location.port === '3000';

      if (!isLocalhost && (config.baseURL?.includes('127.0.0.1') || config.baseURL?.includes('localhost'))) {
        config.baseURL = `${window.location.origin}/api`;
      }
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle unauthenticated sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest =
      requestUrl.includes('/entity/login') ||
      requestUrl.includes('/login') ||
      requestUrl.includes('/entity/forgot-password');

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthPage = currentPath.includes('/login') || currentPath.includes('/forgot-password');

    if (error.response?.status === 401 && !isAuthRequest && !isAuthPage) {
      const expiryType = error.response.data?.expiry_type || 'idle';
      handleSessionExpired(expiryType, true);
    }
    return Promise.reject(error);
  }
);

export default api;
