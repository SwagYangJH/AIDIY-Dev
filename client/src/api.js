// src/api.js
import axios from 'axios';

// Dynamic API URL based on environment
const getApiBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://web-production-6c1b1.up.railway.app';
  }
  return 'http://localhost:5500';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('app_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
