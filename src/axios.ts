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
  const role = localStorage.getItem('role');
  const method = config.method?.toLowerCase();
  const url = config.url || '';

  const isPublicEndpoint =
    (method === 'get' &&
    /^\/api\/products(\/\d+)?$/.test(url)) ||
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/2fa') ||
    url.includes('/api/ping');

  // Block writes for "User" role (read-only). Auth endpoints stay open.
  const isAuthEndpoint =
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/logout') ||
    url.includes('/api/auth/2fa') ||
    url.includes('/api/auth/change-password');
  // Allow all roles (including read-only "User") to submit site feedback.
  const isFeedbackSubmit = method === 'post' && url.includes('/api/feedback');
  const isWrite = method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
  if (role === 'User' && isWrite && !isAuthEndpoint && !isFeedbackSubmit) {
    console.warn(`[AXIOS] Blocked ${method?.toUpperCase()} ${url} for read-only User role`);
    return Promise.reject({ response: { status: 403, data: { message: 'Read-only role' } }, message: 'Read-only role' });
  }

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