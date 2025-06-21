// src/api.js
import axios from 'axios';

// Use Vercel backend
const getApiBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://aidiy-dev.vercel.app';
  }
  return 'https://aidiy-dev.vercel.app'; // Use Vercel for dev too
};

// Export the base URL for direct fetch calls
export const API_BASE_URL = getApiBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
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
