// src/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5140',
}) as any;

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;