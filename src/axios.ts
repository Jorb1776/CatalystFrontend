import axios from 'axios';
import { RefreshResponse } from './types/Auth';

// In development, use empty baseURL to let proxy handle routing
// In production, use the full API URL
const API_URL = process.env.NODE_ENV === 'production'
  ? (process.env.REACT_APP_API_URL || window.location.origin)
  : '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor
api.defaults.withCredentials = true;
api.interceptors.request.use((config: any) => {

  const token = localStorage.getItem('token');
  const isPublicEndpoint =
    (config.method?.toLowerCase() === 'get' &&
    /^\/api\/products(\/\d+)?$/.test(config.url || '')) ||
    config.url?.includes('/api/auth/login') ||
    config.url?.includes('/api/auth/refresh') ||
    config.url?.includes('/api/auth/2fa') ||
    config.url?.includes('/api/ping');

  if (token && !isPublicEndpoint) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[AXIOS] Adding auth to ${config.method?.toUpperCase()} ${config.url}`);
  } else if (!token && !isPublicEndpoint) {
    console.warn(`[AXIOS] No token found for ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Don't retry if already retried, or if this IS the refresh endpoint, or if it's the login endpoint
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') ||
                          originalRequest.url?.includes('/api/auth/refresh') ||
                          originalRequest.url?.includes('/api/auth/2fa');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const res = await api.post<{ token: string }>('/api/auth/refresh');
        const { token } = res.data;

        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        // Clear all auth data and redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;