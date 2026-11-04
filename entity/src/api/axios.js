import axios from 'axios';

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

// Add a request interceptor to attach Bearer token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('entity_token');
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
    // Only redirect to login if 401 is NOT from an authentication request and not already on a login page
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/entity/login') || requestUrl.includes('/login');
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/' || currentPath === '/login' || currentPath === '/entity/login' || currentPath === '/entity-login';

    if (error.response?.status === 401 && !isAuthRequest && !isAuthPage) {
      localStorage.removeItem('entity_token');
      localStorage.removeItem('entity_user');
      window.location.href = '/entity/login';
    }
    return Promise.reject(error);
  }
);

export default api;
