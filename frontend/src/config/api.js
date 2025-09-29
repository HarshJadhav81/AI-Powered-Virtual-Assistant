import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://orvion.onrender.com';

// API instance
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with an error
      const status = error.response.status;
      if (status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/signin';
      }
      return Promise.reject({
        status: status,
        message: error.response.data?.message || 'Server error occurred'
      });
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        status: 503,
        message: 'Unable to connect to server'
      });
    } else {
      // Something else happened while setting up the request
      return Promise.reject({
        status: 500,
        message: error.message || 'An unexpected error occurred'
      });
    }
  }
);

// API configuration object
export const apiConfig = {
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
};

export default apiConfig;