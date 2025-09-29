const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    return {
      status: error.response.status,
      message: error.response.data.message || 'Server error occurred'
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      status: 503,
      message: 'Unable to connect to server'
    };
  } else {
    // Something else happened while setting up the request
    return {
      status: 500,
      message: error.message || 'An unexpected error occurred'
    };
  }
};

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