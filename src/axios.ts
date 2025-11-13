import axios from 'axios';
import { RefreshResponse } from './types/Auth';

// Use env var — NO HARDCODE
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5099';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  const isPublicEndpoint = 
    config.method?.toLowerCase() === 'get' && 
    /^\/api\/products(\/\d+)?$/.test(config.url || '');

  if (token && !isPublicEndpoint) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await api.post<RefreshResponse>('/api/auth/refresh', { refreshToken });
        const { token } = res.data;

        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // ADD THIS: Prevent infinite 401 spam
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;