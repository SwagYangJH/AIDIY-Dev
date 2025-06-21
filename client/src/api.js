// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5500', // your backend URL
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
