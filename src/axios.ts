import axios from 'axios';
import { RefreshResponse } from './types/Auth';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  //withCredentials: true,
});

// Request interceptor
api.defaults.withCredentials = true;
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

      try {
        const res = await api.post<{ token: string }>('/api/auth/refresh');
        const { token } = res.data;

        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;